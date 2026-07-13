// ==UserScript==
// @name         小抄：深空霓虹科幻 UI
// @namespace    https://github.com/XcilGin/sgs-helper-sht-arena-addon
// @version      1.0.0
// @description  为“三国杀打小抄”叠加深色霓虹科幻主题；不修改原脚本功能逻辑。
// @author       XcilGin / ChatGPT
// @match        *://test.sanguosha.com/*
// @match        *://web.sanguosha.com/*
// @match        *://my.4399.com/yxsgs/*
// @match        *://game.4399iw2.com/yxsgs/*
// @match        *://web.kuaiwan.com/kwsgsn/*
// @match        *://wan.baidu.com/microend?gameId=19793595/*
// @exclude      *://web.sanguosha.com/test*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const STYLE_ID = 'xiaochao-sci-fi-theme-addon';
    const WRAP_FLAG = Symbol.for('xiaochao.sciFiOpenWindowWrapped');

    const MAIN_THEME = String.raw`:root {
	--sci-bg: rgba(3, 10, 19, .94);
	--sci-panel: rgba(7, 24, 38, .78);
	--sci-panel-2: rgba(9, 35, 52, .66);
	--sci-line: #18e7ff;
	--sci-line-soft: rgba(24, 231, 255, .34);
	--sci-blue: #58a6ff;
	--sci-violet: #a879ff;
	--sci-green: #55ffb1;
	--sci-warn: #ffd166;
	--sci-danger: #ff4d8d;
	--sci-text: #dffaff;
	--sci-muted: #78aebd;
}
@keyframes sciScan {
	0% { transform: translateY(-110%); opacity: 0; }
	15% { opacity: .4; }
	85% { opacity: .14; }
	100% { transform: translateY(1100%); opacity: 0; }
}
@keyframes sciPulse {
	0%, 100% { box-shadow: 0 0 8px rgba(24,231,255,.22), inset 0 0 12px rgba(24,231,255,.05); }
	50% { box-shadow: 0 0 18px rgba(24,231,255,.5), inset 0 0 18px rgba(24,231,255,.1); }
}
@keyframes sciSelect {
	0%, 100% { filter: brightness(1); }
	50% { filter: brightness(1.32); }
}
#Iframe {
	font-family: "Microsoft YaHei UI", "Segoe UI", sans-serif;
	color: var(--sci-text);
}
#sidebar {
	background:
		linear-gradient(135deg, rgba(24,231,255,.08), transparent 30%),
		repeating-linear-gradient(0deg, transparent 0 22px, rgba(24,231,255,.035) 23px),
		linear-gradient(160deg, rgba(3,10,19,.97), rgba(4,19,31,.94) 52%, rgba(8,10,29,.96)) !important;
	border: 1px solid var(--sci-line) !important;
	border-radius: 12px 2px 12px 2px;
	box-shadow: 0 0 0 1px rgba(88,166,255,.25), 0 0 24px rgba(24,231,255,.34), inset 0 0 30px rgba(24,231,255,.055);
	backdrop-filter: blur(9px) saturate(135%);
	-webkit-backdrop-filter: blur(9px) saturate(135%);
}
#sidebar::before {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	height: 10%;
	z-index: 1001;
	pointer-events: none;
	background: linear-gradient(to bottom, transparent, rgba(24,231,255,.14), transparent);
	animation: sciScan 7s linear infinite;
}
#sidebar::after {
	content: "";
	position: absolute;
	inset: 4px;
	z-index: 1000;
	pointer-events: none;
	border: 1px solid rgba(88,166,255,.15);
	clip-path: polygon(0 0, 28px 0, 28px 1px, 1px 1px, 1px 28px, 0 28px, 0 0, 100% 0, 100% 28px, calc(100% - 1px) 28px, calc(100% - 1px) 1px, calc(100% - 28px) 1px, calc(100% - 28px) 0, 100% 0, 100% 100%, calc(100% - 28px) 100%, calc(100% - 28px) calc(100% - 1px), calc(100% - 1px) calc(100% - 1px), calc(100% - 1px) calc(100% - 28px), 100% calc(100% - 28px), 100% 100%, 0 100%, 0 calc(100% - 28px), 1px calc(100% - 28px), 1px calc(100% - 1px), 28px calc(100% - 1px), 28px 100%, 0 100%);
}
.header {
	height: 25px;
	line-height: 25px;
	color: var(--sci-text);
	font-weight: 700;
	font-size: 13px;
	letter-spacing: 2px;
	text-shadow: 0 0 7px var(--sci-line);
	background: linear-gradient(90deg, transparent, rgba(24,231,255,.19) 18%, rgba(88,166,255,.2) 50%, rgba(24,231,255,.19) 82%, transparent);
	border-bottom: 1px solid var(--sci-line-soft);
	box-shadow: 0 6px 16px rgba(0,0,0,.22);
}
.header::before { content: "◢ "; color: var(--sci-line); }
.header::after { content: " ◣"; color: var(--sci-violet); }
.subdiv {
	height: calc(100% - 25px);
	scrollbar-color: var(--sci-line) transparent;
}
.subdiv::-webkit-scrollbar { width: 5px; height: 5px; }
.subdiv::-webkit-scrollbar-track { background: rgba(3,10,19,.72); }
.subdiv::-webkit-scrollbar-thumb {
	background: linear-gradient(var(--sci-line), var(--sci-violet));
	border-radius: 6px;
	box-shadow: 0 0 7px var(--sci-line);
}
.tool {
	margin: 4px 5px;
	padding: 3px;
	background: linear-gradient(100deg, rgba(9,35,52,.78), rgba(6,16,29,.56));
	border-left: 2px solid var(--sci-line);
	border-right: 1px solid rgba(168,121,255,.28);
	border-radius: 2px 8px 2px 8px;
	box-shadow: inset 0 0 12px rgba(24,231,255,.045);
}
.tool::before {
	color: var(--sci-line);
	font: 700 14px/22px "Microsoft YaHei UI", sans-serif;
	letter-spacing: 1px;
	text-shadow: 0 0 8px rgba(24,231,255,.7);
}
.tool.fold::before { border-bottom: 1px solid var(--sci-line-soft); }
.tool::after { color: var(--sci-violet); text-shadow: 0 0 7px var(--sci-violet); }
.listContainer { color: var(--sci-text); }
.listContainer.detail,
.type-body,
.cards-body {
	background: linear-gradient(145deg, rgba(7,24,38,.78), rgba(8,12,28,.64));
	border: 1px solid rgba(24,231,255,.22);
	box-shadow: inset 0 0 12px rgba(24,231,255,.05), 0 0 7px rgba(0,0,0,.38);
	border-radius: 3px 9px 3px 9px;
}
.type-body::after,
.cards-body::after,
.cards-body:not(.sp)::after {
	color: var(--sci-line);
	font-family: "Segoe UI", sans-serif;
	letter-spacing: 1px;
	text-shadow: 0 0 6px rgba(24,231,255,.65);
}
.inner {
	border-color: var(--sci-violet);
	box-shadow: 0 0 8px rgba(168,121,255,.8), inset 0 0 7px rgba(168,121,255,.14);
}
.inner::before { color: #dec8ff; text-shadow: 0 0 7px var(--sci-violet), 1px 1px 2px #000; }
.cardLabel {
	color: var(--sci-text);
	border: 1px solid rgba(24,231,255,.2);
	border-radius: 2px 6px 2px 6px;
	background: rgba(7,24,38,.68);
	box-shadow: inset -2px 0 0 rgba(24,231,255,.5), inset 0 -1px 0 rgba(168,121,255,.35);
	text-shadow: 0 0 4px rgba(24,231,255,.72);
	transition: .16s ease;
}
.cardLabel:hover { background: rgba(24,231,255,.13); color: #fff; }
.labelcheck:checked + .cardLabel {
	color: #031019;
	background: linear-gradient(120deg, var(--sci-line), #93f5ff);
	box-shadow: 0 0 12px rgba(24,231,255,.72);
	text-shadow: none;
}
.card {
	color: #061017;
	background: linear-gradient(145deg, #e9fbff, #91c8d8);
	border: 1px solid #234d60;
	border-radius: 2px 6px 2px 6px;
	box-shadow: 0 2px 6px rgba(0,0,0,.38), inset 0 0 8px rgba(255,255,255,.58);
	transition: transform .12s ease, filter .12s ease, box-shadow .12s ease;
}
.card:hover {
	transform: translateY(-2px);
	filter: brightness(1.13);
	box-shadow: 0 0 10px var(--sci-line), 0 4px 8px rgba(0,0,0,.45);
}
.card.red { color: #c50044; }
.card.unknown {
	background: rgba(5,27,40,.88);
	border-color: var(--sci-line);
	box-shadow: 0 0 10px rgba(24,231,255,.62), inset 0 0 10px rgba(24,231,255,.12);
	color: var(--sci-text);
}
.card.unknown .card { background: linear-gradient(145deg, #8affee, #3ccbd7); }
.frac > span { color: var(--sci-line); text-shadow: 0 0 6px rgba(24,231,255,.65); }
.frac > span:nth-last-child(1) { border-color: var(--sci-line); }
.suit.b { color: var(--sci-line); }
.suit.r { color: #ff5b91; }
.calRes,
.layout {
	color: var(--sci-text);
	background: linear-gradient(145deg, rgba(12,42,59,.92), rgba(5,17,29,.96));
	border: 1px solid rgba(24,231,255,.66);
	border-radius: 2px 7px 2px 7px;
	box-shadow: inset 0 0 10px rgba(24,231,255,.06), 0 0 5px rgba(24,231,255,.15);
	text-shadow: 0 0 5px rgba(24,231,255,.68);
	transition: background .15s ease, box-shadow .15s ease, transform .15s ease;
}
.calRes:hover,
.layout:hover {
	color: #fff;
	background: linear-gradient(145deg, rgba(19,72,91,.98), rgba(11,35,53,.98));
	border-color: #98f6ff;
	box-shadow: 0 0 12px rgba(24,231,255,.62), inset 0 0 10px rgba(24,231,255,.12);
	transform: translateY(-1px);
}
.calRes:active,
.layout:active { transform: translateY(0); filter: brightness(.9); }
.calRes:disabled,
.layout:disabled { color: #587783; background: #101a20; border-color: #344c56; box-shadow: none; }
.textRes { color: #fff; text-shadow: -1px 0 var(--sci-danger), 1px 0 var(--sci-line), 0 0 8px #fff; }
.checkbutton {
	color: var(--sci-text);
	border: 1px solid rgba(24,231,255,.42);
	background: rgba(5,21,34,.7);
	padding: 2px 3px;
	border-radius: 2px 7px 2px 7px;
	box-shadow: inset 0 0 8px rgba(24,231,255,.04);
	transition: .15s ease;
}
.checkbutton:hover { background: rgba(24,231,255,.12); border-color: var(--sci-line); }
input[type="checkbox"], input[type="radio"] { accent-color: var(--sci-line); }
input[type="text"], textarea, #layoutName, #inviteName, #vipKey, #yuanbao {
	color: var(--sci-text) !important;
	background: rgba(2,13,22,.92) !important;
	border: 1px solid rgba(24,231,255,.48) !important;
	border-radius: 2px 7px 2px 7px;
	outline: none;
	box-shadow: inset 0 0 9px rgba(24,231,255,.07);
}
input[type="text"]:focus, textarea:focus {
	border-color: #b0f9ff !important;
	box-shadow: 0 0 10px rgba(24,231,255,.55), inset 0 0 10px rgba(24,231,255,.08);
}
input::placeholder, textarea::placeholder { color: var(--sci-muted); }
.cell.select,
.list.select { animation: sciPulse 1.8s infinite, sciSelect 1.8s infinite; }
.cell.select:hover::after,
.list.select:hover::after { background: rgba(24,231,255,.17); border: 1px solid var(--sci-line); }
.moving::before { background: rgba(3,10,19,.74); border: 1px dashed var(--sci-line); }
.roge {
	border-color: rgba(24,231,255,.7);
	background: rgba(4,17,29,.86);
	box-shadow: inset 0 0 10px rgba(24,231,255,.1);
}
.roge.elite { background: rgba(28,91,170,.62); }
.roge.start { background: rgba(230,130,20,.6); }
.roge.boss { background: rgba(203,25,79,.62); }
.roge.start.boss { background: rgba(141,43,207,.7); }
#hint > span { color: var(--sci-green); text-shadow: 0 0 5px rgba(85,255,177,.55); }
#vipDiv a, #charge a, #tools a { color: var(--sci-line) !important; text-shadow: 0 0 5px rgba(24,231,255,.5); }
.linear { background: linear-gradient(to right, rgba(65,84,90,.7) calc(min(1, calc(max(0, calc(var(--rate, 0) - 0.9999)) * 10000)) * 100%), var(--sci-line) 0%, rgba(65,84,90,.7) calc(var(--rate, 0) * 100%), rgba(0,0,0,0) calc(var(--rate, 0) * 100%)); }`;
    const RECORD_THEME = String.raw`:root { --c:#18e7ff; --v:#a879ff; --t:#dffaff; --p:rgba(7,24,38,.9); }
* { box-sizing: border-box; }
body {
	color: var(--t);
	font-family: "Microsoft YaHei UI", "Segoe UI", sans-serif;
	background: repeating-linear-gradient(0deg, transparent 0 31px, rgba(24,231,255,.025) 32px), radial-gradient(circle at 15% 0, rgba(24,231,255,.14), transparent 35%), linear-gradient(145deg,#020811,#071524 55%,#09071a);
	background-attachment: fixed;
}
table { margin-right: 10px; border-collapse: separate; border-spacing: 0; background: rgba(4,16,28,.74); box-shadow: 0 0 18px rgba(24,231,255,.12); }
th, td { color: var(--t); border-color: rgba(24,231,255,.26) !important; }
th { background: linear-gradient(145deg, rgba(12,48,65,.98), rgba(8,20,36,.98)); color: #bff9ff; text-shadow: 0 0 6px rgba(24,231,255,.55); }
td { background: rgba(4,18,30,.7); }
tbody tr:hover td { background: rgba(24,231,255,.11); }
.button[name=mode] + .label, th .button + .label, button {
	color: var(--t); border: 1px solid rgba(24,231,255,.55); background: linear-gradient(145deg,rgba(10,39,56,.96),rgba(5,17,29,.96)); box-shadow: inset 0 0 10px rgba(24,231,255,.07); text-shadow: 0 0 5px rgba(24,231,255,.5); cursor: pointer;
}
.button:checked + .label { color:#041016; background: linear-gradient(120deg,var(--c),#a7f8ff); box-shadow:0 0 13px rgba(24,231,255,.65); text-shadow:none; }
button:hover { border-color:#c9fbff; box-shadow:0 0 12px rgba(24,231,255,.55); }
.nav { color:var(--t); background:rgba(2,10,18,.95) !important; border-top:1px solid var(--c); box-shadow:0 -5px 18px rgba(24,231,255,.18); padding:5px; }
input { color:var(--t); background:#06131f; border:1px solid rgba(24,231,255,.55); padding:4px; }
.rate { text-shadow:0 0 7px currentColor; }
.s0 { background:rgba(225,248,255,.86) !important; color:#06131f !important; }
.s1 { background:rgba(255,46,91,.78) !important; }
.s2 { background:rgba(255,196,54,.78) !important; color:#171000 !important; }
.s3 { background:rgba(35,210,137,.72) !important; }
.s4 { background:rgba(36,112,230,.75) !important; }
.s5 { background:rgba(177,65,232,.78) !important; }`;
    const MANUAL_THEME = String.raw`:root { --c:#18e7ff; --v:#a879ff; --t:#dffaff; }
* { box-sizing:border-box; }
body { color:var(--t); font-family:"Microsoft YaHei UI","Segoe UI",sans-serif; background:repeating-linear-gradient(90deg,transparent 0 47px,rgba(24,231,255,.018) 48px),radial-gradient(circle at 10% 0,rgba(24,231,255,.13),transparent 34%),linear-gradient(145deg,#020811,#071524 55%,#0a071a); background-attachment:fixed; }
table, th, td { border-color:rgba(24,231,255,.34); }
table { background:rgba(3,14,25,.78); box-shadow:0 0 16px rgba(24,231,255,.1); }
th, thead { color:#c9fbff; background:rgba(5,22,36,.97) !important; text-shadow:0 0 6px rgba(24,231,255,.5); }
td { background:rgba(5,18,31,.7); }
tr:hover td { filter:brightness(1.2); }
section > div, #boss > div, #pvp > div { color:var(--t); background:rgba(2,10,18,.96) !important; border-bottom:1px solid rgba(24,231,255,.55); box-shadow:0 5px 15px rgba(24,231,255,.1); }
#result { color:var(--c); text-shadow:0 0 9px rgba(24,231,255,.7); }
button, .button + .label { color:var(--t); background:linear-gradient(145deg,rgba(10,39,56,.96),rgba(5,17,29,.96)); border:1px solid rgba(24,231,255,.55); border-radius:2px 8px 2px 8px; text-shadow:0 0 5px rgba(24,231,255,.55); cursor:pointer; }
.button:checked + .label { color:#041016; background:linear-gradient(120deg,var(--c),#9bf5ff); box-shadow:0 0 13px rgba(24,231,255,.65); text-shadow:none; }
button:hover, .button + .label:hover { box-shadow:0 0 11px rgba(24,231,255,.55); border-color:#c5fbff; }
a, a:visited { color:var(--c); text-shadow:0 0 5px rgba(24,231,255,.45); }
.light { box-shadow:0 0 8px var(--c) inset; }
.gray { background:rgba(85,105,115,.72) !important; }
.lv0 { background:rgba(220,245,255,.9) !important; color:#06131f; }
.lv1 { background:rgba(55,212,151,.65) !important; }
.lv2 { background:rgba(61,118,240,.72) !important; }
.lv3 { background:rgba(238,200,42,.75) !important; color:#171000; }
.lv4 { background:rgba(235,57,90,.72) !important; }
.lv5 { background:rgba(160,63,211,.74) !important; }`;
    const VOICE_THEME = String.raw`:root { --c:#18e7ff; --t:#dffaff; }
* { box-sizing:border-box; }
body { color:var(--t); font-family:"Microsoft YaHei UI","Segoe UI",sans-serif; background:radial-gradient(circle at 15% 0,rgba(24,231,255,.14),transparent 35%),linear-gradient(145deg,#020811,#071524 55%,#09071a); background-attachment:fixed; }
form { background:rgba(2,10,18,.96); border-bottom:1px solid var(--c); box-shadow:0 5px 18px rgba(24,231,255,.15); }
input { color:var(--t); background:#06131f; border:1px solid rgba(24,231,255,.55); border-radius:2px 8px 2px 8px; outline:none; }
input:focus { box-shadow:0 0 12px rgba(24,231,255,.55); }
button { color:var(--t); background:linear-gradient(145deg,rgba(10,39,56,.96),rgba(5,17,29,.96)); border:1px solid rgba(24,231,255,.55); border-radius:2px 8px 2px 8px; cursor:pointer; }
button:hover { box-shadow:0 0 11px rgba(24,231,255,.55); }
table { background:rgba(3,14,25,.78); }
thead { background:rgba(5,22,36,.98); }
th,td { color:var(--t); border-color:rgba(24,231,255,.3); }
th { color:#c9fbff; text-shadow:0 0 6px rgba(24,231,255,.55); }
tbody tr:hover td { background:rgba(24,231,255,.1); }
td.match { color:#031019; background:linear-gradient(120deg,var(--c),#a8f8ff); }
label { color:#8fb8c4; }
a,a:visited { color:var(--c); text-shadow:0 0 5px rgba(24,231,255,.45); }`;
    const SKIN_THEME = String.raw`:root { --c:#18e7ff; --t:#dffaff; }
* { box-sizing:border-box; }
body { color:var(--t); font-family:"Microsoft YaHei UI","Segoe UI",sans-serif; background:radial-gradient(circle at 15% 0,rgba(24,231,255,.14),transparent 35%),linear-gradient(145deg,#020811,#071524 55%,#09071a); background-attachment:fixed; }
table { background:rgba(3,14,25,.78); }
th,td { color:var(--t); border-color:rgba(24,231,255,.3); }
th { color:#c9fbff; background:linear-gradient(145deg,rgba(12,48,65,.98),rgba(8,20,36,.98)); text-shadow:0 0 6px rgba(24,231,255,.55); }
thead { background:rgba(5,22,36,.98); box-shadow:0 5px 15px rgba(24,231,255,.1); }
tbody tr:hover td { background:rgba(24,231,255,.1); }
.filters { color:var(--t); background:rgba(2,10,18,.96); border-top:1px solid var(--c); box-shadow:0 -5px 18px rgba(24,231,255,.16); }
.filters>span { background:rgba(7,24,38,.86); border-color:rgba(24,231,255,.45); border-radius:2px 8px 2px 8px; }
input { accent-color:var(--c); }
a,a:visited { color:var(--c); text-shadow:0 0 5px rgba(24,231,255,.45); }`;

    function addStyle(doc, css, id = STYLE_ID) {
        if (!doc || doc.getElementById(id)) return false;
        const style = doc.createElement('style');
        style.id = id;
        style.textContent = css;
        (doc.head || doc.documentElement || doc.body)?.appendChild(style);
        return true;
    }

    function applyMainTheme() {
        if (!document.documentElement) return;
        const hasHelperUI = document.getElementById('Iframe') || document.getElementById('sidebar');
        if (hasHelperUI) addStyle(document, MAIN_THEME);
    }

    function popupThemeFor(html) {
        if (html.includes('<title>战绩胜率统计</title>')) return RECORD_THEME;
        if (html.includes('<title>山河图加点模拟器 BOSS技能查询</title>')) return MANUAL_THEME;
        if (html.includes('<title>三国杀台词搜索查询</title>')) return VOICE_THEME;
        if (html.includes('<title>皮肤收集进度</title>')) return SKIN_THEME;
        return '';
    }

    function injectPopupTheme(html) {
        if (typeof html !== 'string' || html.includes('XIAOCHAO_SCI_FI_')) return html;
        const css = popupThemeFor(html);
        if (!css) return html;
        const themed = `
/* XIAOCHAO_SCI_FI_POPUP_ADDON_START */
${css}
/* XIAOCHAO_SCI_FI_POPUP_ADDON_END */
`;
        if (html.includes('</style>')) return html.replace('</style>', themed + '</style>');
        if (html.includes('</head>')) return html.replace('</head>', `<style>${themed}</style></head>`);
        return `<style>${themed}</style>` + html;
    }

    function wrapOpenWindow() {
        const current = window.openWindow;
        if (typeof current !== 'function' || current[WRAP_FLAG]) return false;

        function sciFiOpenWindow(html, ...args) {
            return current.call(this, injectPopupTheme(html), ...args);
        }

        Object.defineProperty(sciFiOpenWindow, WRAP_FLAG, { value: true });
        try {
            window.openWindow = sciFiOpenWindow;
            return window.openWindow === sciFiOpenWindow;
        } catch (error) {
            console.warn('[小抄科幻UI] 无法包装 openWindow：', error);
            return false;
        }
    }

    function start() {
        applyMainTheme();
        wrapOpenWindow();

        const observer = new MutationObserver(() => {
            applyMainTheme();
            wrapOpenWindow();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        let attempts = 0;
        const timer = setInterval(() => {
            applyMainTheme();
            wrapOpenWindow();
            attempts += 1;
            if (attempts >= 240) clearInterval(timer);
        }, 250);
    }

    if (document.documentElement) start();
    else document.addEventListener('readystatechange', start, { once: true });
})();
