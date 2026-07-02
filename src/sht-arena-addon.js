/*
 * sgs-helper-sht-arena-addon
 *
 * Module only. No userscript metadata header, no automatic startup.
 */
(function (root, factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory();
		return;
	}
	root.SHTArenaScoutAddon = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
	'use strict';

	const VERSION = '0.2.1';
	const PANEL_ID = 'sht-arena-addon-panel';
	const STYLE_ID = 'sht-arena-addon-style';
	const POSITION_KEY = 'sht-arena-addon-position-v1';
	const FIRST_KEY = 'sht-arena-addon-first-strike-v1';
	const FIRST_VALUES = ['0', '1', '2', '3', '4', '5'];
	const DEFAULTS = {
		pollMs: 180,
		stageScanMs: 760,
		stageNodeLimit: 180,
		sourceNodeLimit: 380,
		sourceTimeLimitMs: 18,
		firstStrikeScanMs: 120,
		firstStrikeCooldownMs: 1400,
		firstStrikeRepeatGuardMs: 3600,
		firstStrikeNodeLimit: 300,
		panel: true,
		exposeController: true,
		controllerName: 'SHTArenaScout',
		firstStrikeValues: null,
	};
	const NAME_RE = /^[\u4e00-\u9fff][\u4e00-\u9fffA-Za-z0-9_+\-·・一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾ⅠⅡⅢⅣⅤ]{1,28}$/;
	const BAD_NAME_RE = /点击|确定|确认|取消|关闭|返回|选择|等待|加载|倒计时|山河图|擂台|抢先手|技能|战法|手牌|装备|判定|回合|出牌|弃牌|摸牌|开始|结束|成功|失败|暂无|说明|提示/;
	const SKILL_RE = /skill|spell|jineng|jiNeng|技能/i;
	const TACTIC_RE = /zhanfa|zhanFa|tactic|plot|strategy|战法/i;
	const WALK_RE = /skill|spell|zhanfa|zhanFa|tactic|plot|item|items|vo|info|data|list|array|container|panel|pannel|seat|sprite|child|children|card|general|hero|wujiang|player|role/i;
	const OMIT_RE = /^(parent|_parent|stage|_stage|owner|_owner|graphics|texture|bitmap|mask|filters|hitArea|timer|_events|style|transform|cacheAsBitmap)$/;
	const TEXT_KEYS = ['text', '_text', 'label', 'name', 'title', 'value', 'skillName', 'zhanfaName', 'tacticName', 'plotName'];
	const OPP_RE = /opponent|enemy|rival|other|target|duishou|对手|敌方|敌人|对方/i;
	const SELF_RE = /self|my|mine|home|own|ziji|player|主将|自己|我方|己方/i;
	const FIRST_CONTEXT_RE = /抢先手|先手|弃|丢|技能|选择|竞价|明牌|出价|ahead|first|discard|skill/i;

	function install(options) {
		const controller = createController(options);
		controller.start();
		return controller;
	}

	function createController(options) {
		const settings = Object.assign({}, DEFAULTS, options || {});
		const state = {
			started: false,
			timer: 0,
			panel: null,
			drag: null,
			lastDataScanAt: 0,
			lastFirstScanAt: 0,
			lastClickAt: 0,
			lastClickKey: '',
			lastRenderKey: '',
			firstStrikeValues: normalizeFirstValues(settings.firstStrikeValues === null ? loadFirstValues() : settings.firstStrikeValues),
			firstStrikeStatus: firstStatus('未勾选数字', []),
			lastData: emptyData('等待擂台数据'),
		};
		const api = {
			version: VERSION,
			start,
			stop,
			refresh,
			data: () => state.lastData,
			status: () => state.lastData.status,
			firstStrike: () => ({ values: state.firstStrikeValues.slice(), status: Object.assign({}, state.firstStrikeStatus) }),
			setFirstStrike,
			resetPosition,
		};

		function start() {
			if (state.started) return api;
			state.started = true;
			if (settings.exposeController && settings.controllerName) root[settings.controllerName] = api;
			if (settings.panel) state.panel = createPanel(state, api);
			refresh();
			state.timer = root.setInterval(tick, Math.max(60, Math.min(settings.pollMs, settings.firstStrikeScanMs)));
			return api;
		}

		function stop() {
			if (!state.started) return api;
			state.started = false;
			if (state.timer) root.clearInterval(state.timer);
			state.timer = 0;
			if (state.panel && state.panel.parentNode) state.panel.parentNode.removeChild(state.panel);
			state.panel = null;
			return api;
		}

		function tick() {
			const now = Date.now();
			if (now - state.lastDataScanAt >= settings.stageScanMs) refresh();
			if (now - state.lastFirstScanAt >= settings.firstStrikeScanMs) {
				state.lastFirstScanAt = now;
				state.firstStrikeStatus = scanFirstStrike(settings, state, now);
				state.lastData.firstStrike = firstShape(state.firstStrikeStatus);
				renderPanel(state);
			}
		}

		function refresh() {
			state.lastDataScanAt = Date.now();
			state.lastData = scanArena(settings);
			state.lastData.firstStrike = firstShape(state.firstStrikeStatus);
			renderPanel(state);
			return state.lastData;
		}

		function setFirstStrike(values) {
			state.firstStrikeValues = normalizeFirstValues(values);
			saveFirstValues(state.firstStrikeValues);
			state.firstStrikeStatus = firstStatus(state.firstStrikeValues.length ? '等待按钮' : '未勾选数字', state.firstStrikeValues);
			state.lastData.firstStrike = firstShape(state.firstStrikeStatus);
			renderPanel(state, true);
			return state.firstStrikeValues.slice();
		}

		function resetPosition() {
			removeStorage(POSITION_KEY);
			applyPanelPosition(defaultPosition());
			return api;
		}

		return api;
	}

	function scanArena(settings) {
		const roots = runtimeRoots();
		const data = emptyData(roots.length ? '未命中技能或战法' : '未找到 Laya stage');
		data.status.roots = roots.map(item => item.path);
		if (!roots.length) return data;

		const queue = roots.map((item, index) => ({ value: item.value, path: item.path || `root${index}`, hint: '', depth: 0 }));
		const seen = new WeakSet();
		const started = Date.now();
		const entries = new Map();
		let scanned = 0;

		while (queue.length && scanned < settings.sourceNodeLimit) {
			if (Date.now() - started > settings.sourceTimeLimitMs) break;
			const item = queue.shift();
			const value = item.value;
			if (!isObject(value) || seen.has(value)) continue;
			seen.add(value);
			scanned += 1;

			const typeHint = typeOf(item.path) || item.hint;
			const side = sideOf(item.path, value);
			for (const found of namesOf(value, typeHint)) addEntry(entries, found.name, found.type || typeHint || 'skill', side, item.path);

			if (item.depth < 9) {
				for (const child of childrenOf(value, item.path, item.hint)) {
					queue.push({ value: child.value, path: child.path, hint: child.hint, depth: item.depth + 1 });
				}
			}
		}

		for (const entry of entries.values()) {
			const bucket = data[entry.side] || data.preload;
			(entry.type === 'tactic' ? bucket.tactics : bucket.skills).push(entry);
		}
		for (const group of [data.opponent, data.self, data.preload]) {
			sortEntries(group.skills);
			sortEntries(group.tactics);
		}
		data.status.scanned = scanned;
		data.status.found = entries.size;
		data.status.reason = entries.size ? '已读取运行时对象' : data.status.reason;
		data.status.time = new Date().toLocaleTimeString();
		return data;
	}

	function runtimeRoots() {
		const out = [];
		addRoot(out, root.Laya && root.Laya.stage, 'Laya.stage');
		addRoot(out, root.laya && root.laya.stage, 'laya.stage');
		addRoot(out, root.stage, 'window.stage');
		addRoot(out, root.game && root.game.stage, 'game.stage');
		addRoot(out, root.Game && root.Game.stage, 'Game.stage');
		try {
			for (const key of Object.keys(root)) {
				if (!/shan|sht|arena|leitai|擂台|山河|sgs|game|laya/i.test(key)) continue;
				addRoot(out, root[key], `window.${key}`);
			}
		} catch (ignored) {}
		return out;
	}

	function addRoot(out, value, path) {
		if (!isObject(value) || out.some(item => item.value === value)) return;
		out.push({ value, path });
	}

	function namesOf(obj, typeHint) {
		const out = [];
		for (const key of TEXT_KEYS) addName(out, obj[key], typeOf(key) || typeHint || 'skill');
		const nested = [obj.data, obj.info, obj.vo, obj.item, obj._dataSource, obj.dataSource];
		for (const value of nested) {
			if (!isObject(value) || value === obj) continue;
			for (const key of TEXT_KEYS) addName(out, value[key], typeOf(key) || typeHint || 'skill');
		}
		return out;
	}

	function addName(out, value, type) {
		const name = cleanName(value);
		if (NAME_RE.test(name) && !BAD_NAME_RE.test(name)) out.push({ name, type: type || 'skill' });
	}

	function addEntry(entries, name, type, side, path) {
		type = type === 'tactic' ? 'tactic' : 'skill';
		side = side || 'preload';
		const key = `${side}:${type}:${name}`;
		if (entries.has(key)) return;
		entries.set(key, { name, type, side, sourcePath: path });
	}

	function childrenOf(obj, path, hint) {
		const out = [];
		addList(out, obj._children || obj.children || obj.$children || obj._childs || obj.childs, `${path}.children`, hint);
		addList(out, obj.items || obj._items || obj.cells || obj.array || obj._array, `${path}.items`, hint);
		const data = obj.data || obj.info || obj.vo || obj.item || obj._dataSource || obj.dataSource;
		if (isObject(data) && data !== obj) out.push({ value: data, path: `${path}.data`, hint });
		let keys = [];
		try {
			keys = Object.keys(obj);
		} catch (ignored) {
			return out;
		}
		for (const key of keys) {
			if (OMIT_RE.test(key) || (!WALK_RE.test(key) && !SKILL_RE.test(key) && !TACTIC_RE.test(key))) continue;
			let value;
			try {
				value = obj[key];
			} catch (ignored) {
				continue;
			}
			if (!isObject(value)) continue;
			const nextHint = typeOf(key) || hint;
			if (Array.isArray(value)) addList(out, value, `${path}.${key}`, nextHint);
			else out.push({ value, path: `${path}.${key}`, hint: nextHint });
		}
		return out;
	}

	function addList(out, list, path, hint) {
		if (!list) return;
		const length = Math.min(Number(list.length) || 0, 80);
		for (let index = 0; index < length; index += 1) {
			if (isObject(list[index])) out.push({ value: list[index], path: `${path}[${index}]`, hint });
		}
	}

	function typeOf(key) {
		if (!key) return '';
		if (TACTIC_RE.test(key)) return 'tactic';
		if (SKILL_RE.test(key)) return 'skill';
		return '';
	}

	function sideOf(path, obj) {
		const text = `${path || ''} ${String(obj && (obj.side || obj.camp || obj.type || obj.name || '') || '')}`;
		if (OPP_RE.test(text)) return 'opponent';
		if (SELF_RE.test(text)) return 'self';
		return 'preload';
	}

	function scanFirstStrike(settings, state, now) {
		const selected = normalizeFirstValues(state.firstStrikeValues);
		if (!selected.length) return firstStatus('未勾选数字', selected);
		if (now - state.lastClickAt < settings.firstStrikeCooldownMs) {
			return firstStatus('冷却中', selected, { lastClickAt: state.lastClickAt, value: state.lastClickValue || '', path: state.lastClickPath || '', method: state.lastClickMethod || '' });
		}

		const queue = runtimeRoots().map((item, index) => ({ value: item.value, path: item.path || `root${index}`, depth: 0 }));
		const seen = new WeakSet();
		const candidates = [];
		let scanned = 0;
		while (queue.length && scanned < settings.firstStrikeNodeLimit) {
			const item = queue.shift();
			const value = item.value;
			if (!isObject(value) || seen.has(value)) continue;
			seen.add(value);
			scanned += 1;
			if (!isVisible(value)) continue;

			const text = normalizeButtonText(directText(value));
			if (text && selected.includes(text)) {
				const target = clickableTarget(value);
				if (target) candidates.push({ value: text, target, path: item.path, score: firstScore(value, target, item.path) });
			}
			if (item.depth < 8) {
				for (const child of childrenOf(value, item.path, '')) queue.push({ value: child.value, path: child.path, depth: item.depth + 1 });
			}
		}
		candidates.sort((left, right) => right.score - left.score);
		const hit = candidates[0];
		if (!hit) return firstStatus(`未找到按钮，已扫 ${scanned} 个对象`, selected);
		if (hit.score < 2) return firstStatus('找到数字但上下文不足', selected, { value: hit.value, path: hit.path });
		const key = `${hit.value}:${hit.path}`;
		if (key === state.lastClickKey && now - state.lastClickAt < settings.firstStrikeRepeatGuardMs) {
			return firstStatus('重复命中已忽略', selected, { value: hit.value, path: hit.path, lastClickAt: state.lastClickAt });
		}

		const clicked = clickTarget(hit.target);
		if (!clicked.ok) return firstStatus(`点击失败：${clicked.method}`, selected, { value: hit.value, path: hit.path, method: clicked.method });
		state.lastClickAt = now;
		state.lastClickKey = key;
		state.lastClickValue = hit.value;
		state.lastClickPath = hit.path;
		state.lastClickMethod = clicked.method;
		return firstStatus('已点击', selected, { value: hit.value, path: hit.path, method: clicked.method, lastClickAt: now });
	}

	function firstScore(node, target, path) {
		const context = `${path || ''} ${directText(node)} ${directText(target)} ${ancestorText(target, 4)}`;
		let score = 0;
		if (FIRST_CONTEXT_RE.test(context)) score += 5;
		if (isClickable(target)) score += 2;
		if (/button|btn|radio|check/i.test(path)) score += 1;
		if (target !== node) score += 1;
		return score;
	}

	function clickableTarget(node) {
		let current = node;
		for (let depth = 0; current && depth < 5; depth += 1) {
			if (isClickable(current)) return current;
			current = current.parent || current._parent;
		}
		return isObject(node) ? node : null;
	}

	function isClickable(obj) {
		if (!isObject(obj)) return false;
		return Boolean(obj.clickHandler || typeof obj.click === 'function' || typeof obj.onclick === 'function' || typeof obj.event === 'function' || typeof obj.emit === 'function' || obj.mouseEnabled || obj._mouseEnabled || /button|btn/i.test(String(obj.constructor && obj.constructor.name || '')));
	}

	function clickTarget(target) {
		try {
			if (root.laya && typeof root.laya.click === 'function') {
				root.laya.click(target);
				return { ok: true, method: 'laya.click' };
			}
		} catch (error) {
			return { ok: false, method: `laya.click ${error.message || error}` };
		}
		try {
			if (target.clickHandler && typeof target.clickHandler.run === 'function') {
				target.clickHandler.run();
				return { ok: true, method: 'clickHandler.run' };
			}
			if (target.clickHandler && typeof target.clickHandler.runWith === 'function') {
				target.clickHandler.runWith(target);
				return { ok: true, method: 'clickHandler.runWith' };
			}
			if (typeof target.click === 'function') {
				target.click();
				return { ok: true, method: 'target.click' };
			}
			if (typeof target.onclick === 'function') {
				target.onclick.call(target);
				return { ok: true, method: 'onclick' };
			}
			if (typeof target.event === 'function') {
				target.event(root.Laya && root.Laya.Event && root.Laya.Event.CLICK || 'click');
				return { ok: true, method: 'event(click)' };
			}
			if (typeof target.emit === 'function') {
				target.emit('click');
				return { ok: true, method: 'emit(click)' };
			}
		} catch (error) {
			return { ok: false, method: error.message || String(error) };
		}
		return { ok: false, method: 'no-click-method' };
	}

	function createPanel(state, api) {
		if (!root.document || !document.body) return null;
		injectStyle();
		const panel = document.getElementById(PANEL_ID) || document.body.appendChild(document.createElement('div'));
		panel.id = PANEL_ID;
		const pos = loadPosition() || defaultPosition();
		panel.style.left = `${Math.round(pos.left)}px`;
		panel.style.top = `${Math.round(pos.top)}px`;
		panel.addEventListener('change', event => {
			const box = event.target && event.target.closest && event.target.closest('[data-sht-first]');
			if (!box) return;
			api.setFirstStrike(Array.from(panel.querySelectorAll('[data-sht-first]:checked')).map(item => item.value));
		});
		panel.addEventListener('click', event => {
			const action = event.target && event.target.closest && event.target.closest('[data-sht-action]');
			if (!action) return;
			if (action.dataset.shtAction === 'refresh') api.refresh();
			if (action.dataset.shtAction === 'reset') api.resetPosition();
		});
		panel.addEventListener('mousedown', event => {
			if (!event.target || !event.target.closest('.sht-title')) return;
			state.drag = { x: event.clientX, y: event.clientY, left: parseFloat(panel.style.left) || 0, top: parseFloat(panel.style.top) || 0 };
			event.preventDefault();
		});
		document.addEventListener('mousemove', event => {
			if (!state.drag) return;
			applyPanelPosition({
				left: clamp(state.drag.left + event.clientX - state.drag.x, 0, Math.max(0, root.innerWidth - 120)),
				top: clamp(state.drag.top + event.clientY - state.drag.y, 0, Math.max(0, root.innerHeight - 40)),
			});
		});
		document.addEventListener('mouseup', () => {
			if (!state.drag) return;
			state.drag = null;
			savePosition({ left: parseFloat(panel.style.left) || 0, top: parseFloat(panel.style.top) || 0 });
		});
		renderPanel(state, true);
		return panel;
	}

	function renderPanel(state, force) {
		const panel = state.panel || (root.document && document.getElementById(PANEL_ID));
		if (!panel) return;
		const data = state.lastData || emptyData('');
		const key = JSON.stringify([state.firstStrikeValues, data.status, data.opponent, data.preload, state.firstStrikeStatus]);
		if (!force && key === state.lastRenderKey) return;
		state.lastRenderKey = key;
		panel.innerHTML = [
			'<div class="sht-title"><strong>山河图擂台</strong><span>v', escapeHtml(VERSION), '</span></div>',
			'<div class="sht-actions"><button type="button" data-sht-action="refresh">刷新</button><button type="button" data-sht-action="reset">归位</button></div>',
			'<div class="sht-line">', escapeHtml(data.status.reason || ''), ' · ', escapeHtml(data.status.time || ''), '</div>',
			'<div class="sht-first">', FIRST_VALUES.map(value => `<label><input type="checkbox" data-sht-first value="${value}"${state.firstStrikeValues.includes(value) ? ' checked' : ''}>${value}</label>`).join(''), '</div>',
			'<div class="sht-line">抢先手：', escapeHtml(state.firstStrikeStatus.reason || ''), state.firstStrikeStatus.value ? ` · ${escapeHtml(state.firstStrikeStatus.value)}` : '', '</div>',
			renderGroup('对手技能', data.opponent.skills),
			renderGroup('对手战法', data.opponent.tactics),
			renderGroup('预载技能', data.preload.skills),
			renderGroup('预载战法', data.preload.tactics),
		].join('');
	}

	function renderGroup(title, entries) {
		const items = entries && entries.length ? entries.slice(0, 12).map(item => `<li title="${escapeHtml(item.sourcePath || '')}">${escapeHtml(item.name)}</li>`).join('') : '<li class="muted">暂无</li>';
		return `<div class="sht-group"><div>${escapeHtml(title)}</div><ul>${items}</ul></div>`;
	}

	function injectStyle() {
		if (document.getElementById(STYLE_ID)) return;
		const style = document.createElement('style');
		style.id = STYLE_ID;
		style.textContent = `#${PANEL_ID}{position:fixed;z-index:2147483647;width:220px;max-height:78vh;overflow:auto;background:rgba(23,26,33,.94);color:#f7f1e4;font:12px/1.45 Arial,"Microsoft YaHei",sans-serif;border:1px solid rgba(255,255,255,.18);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.32);padding:8px;box-sizing:border-box}#${PANEL_ID} .sht-title{display:flex;align-items:center;justify-content:space-between;cursor:move;margin-bottom:6px}#${PANEL_ID} .sht-title strong{font-size:13px}#${PANEL_ID} .sht-title span,#${PANEL_ID} .muted{color:#aab0bd}#${PANEL_ID} .sht-actions{display:flex;gap:6px;margin-bottom:6px}#${PANEL_ID} button{height:24px;padding:0 8px;border:1px solid rgba(255,255,255,.16);border-radius:4px;background:#2f3747;color:#fff;cursor:pointer}#${PANEL_ID} .sht-line{color:#d4d8df;margin:4px 0;word-break:break-all}#${PANEL_ID} .sht-first{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin:6px 0}#${PANEL_ID} .sht-first label{display:flex;align-items:center;gap:2px;min-width:0}#${PANEL_ID} input{margin:0}#${PANEL_ID} .sht-group{border-top:1px solid rgba(255,255,255,.1);padding-top:6px;margin-top:6px}#${PANEL_ID} .sht-group>div{font-weight:700;margin-bottom:3px}#${PANEL_ID} ul{margin:0;padding-left:16px}#${PANEL_ID} li{margin:1px 0;word-break:break-all}`;
		document.head.appendChild(style);
	}

	function emptyData(reason) {
		return {
			opponent: { skills: [], tactics: [] },
			self: { skills: [], tactics: [] },
			preload: { skills: [], tactics: [] },
			seats: [],
			firstStrike: firstShape(firstStatus('', [])),
			status: { roots: [], scanned: 0, found: 0, reason: reason || '', time: new Date().toLocaleTimeString() },
		};
	}

	function firstStatus(reason, selected, extra) {
		return Object.assign({ enabled: !!(selected && selected.length), selected: normalizeFirstValues(selected), reason, value: '', path: '', method: '', lastClickAt: 0 }, extra || {});
	}

	function firstShape(status) {
		return Object.assign({ enabled: false, selected: [], reason: '', value: '', path: '', method: '', lastClickAt: 0 }, status || {});
	}

	function normalizeFirstValues(values) {
		if (!Array.isArray(values)) values = values == null ? [] : [values];
		return Array.from(new Set(values.map(value => String(value)).filter(value => FIRST_VALUES.includes(value))));
	}

	function normalizeButtonText(value) {
		const text = String(value == null ? '' : value).replace(/\s+/g, '').trim();
		return FIRST_VALUES.includes(text) ? text : '';
	}

	function directText(obj) {
		if (!isObject(obj)) return '';
		for (const key of ['text', '_text', 'label', 'name', 'title', 'value']) {
			if (typeof obj[key] === 'string' || typeof obj[key] === 'number') return String(obj[key]);
		}
		return '';
	}

	function ancestorText(obj, count) {
		const parts = [];
		let current = obj;
		for (let index = 0; current && index < count; index += 1) {
			parts.push(directText(current));
			current = current.parent || current._parent;
		}
		return parts.join(' ');
	}

	function cleanName(value) {
		return String(value == null ? '' : value).replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
	}

	function isObject(value) {
		return value && (typeof value === 'object' || typeof value === 'function');
	}

	function isVisible(obj) {
		if (!isObject(obj)) return false;
		if (obj.visible === false || obj._visible === false || obj.alpha === 0 || obj._alpha === 0 || obj.destroyed || obj._destroyed) return false;
		const parent = obj.parent || obj._parent;
		return parent && parent !== obj ? isVisible(parent) : true;
	}

	function sortEntries(entries) {
		entries.sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));
	}

	function loadFirstValues() {
		try {
			const raw = JSON.parse(localStorage.getItem(FIRST_KEY) || 'null');
			return normalizeFirstValues(raw && raw.values || raw || []);
		} catch (ignored) {
			return [];
		}
	}

	function saveFirstValues(values) {
		try {
			localStorage.setItem(FIRST_KEY, JSON.stringify({ values: normalizeFirstValues(values) }));
		} catch (ignored) {}
	}

	function loadPosition() {
		try {
			const raw = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
			if (!raw || !Number.isFinite(raw.left) || !Number.isFinite(raw.top)) return null;
			return { left: clamp(raw.left, 0, Math.max(0, root.innerWidth - 120)), top: clamp(raw.top, 0, Math.max(0, root.innerHeight - 40)) };
		} catch (ignored) {
			return null;
		}
	}

	function savePosition(pos) {
		try {
			localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
		} catch (ignored) {}
	}

	function removeStorage(key) {
		try {
			localStorage.removeItem(key);
		} catch (ignored) {}
	}

	function defaultPosition() {
		return { left: Math.max(8, root.innerWidth - 236), top: 88 };
	}

	function applyPanelPosition(pos) {
		const panel = document.getElementById(PANEL_ID);
		if (!panel) return;
		panel.style.left = `${Math.round(pos.left)}px`;
		panel.style.top = `${Math.round(pos.top)}px`;
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function escapeHtml(value) {
		return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
	}

	return { version: VERSION, createController, install };
});