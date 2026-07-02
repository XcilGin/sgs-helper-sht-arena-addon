# sgs-helper-sht-arena-addon

面向 `sgs-helper-main` 的山河图擂台附属功能模块。

本仓库不提供 `.user.js` 入口，不包含 `@match`、`@grant`、`@run-at` 等用户脚本元信息。集成者需要自行把模块放入已有页面上下文脚本，并手动调用安装函数。

## 功能

- 在山河图擂台加载阶段读取已暴露的对手技能和战法。
- 在模块面板中勾选 `0` 到 `5`，出现对应明文数字按钮时自动抢先手。
- 读取方式以 `window.laya`、`window.Laya.stage`、`seatContainer`、`seatUIs`、`skillItems`、`zhanFaItems`、`zhanfaPanel` 为主。
- 抢先手点击优先使用游戏内的 `laya.click(对象)`，再尝试按钮自身事件。
- 不拦截 WebSocket，不发包，不做 OCR。

## 文件

- `src/sht-arena-addon.js`：模块源码。
- `docs/integration-sgs-helper-main.md`：接入 `sgs-helper-main` 的说明。
- `docs/api.md`：公开接口和参数。

## 最小接入

加载 `src/sht-arena-addon.js` 后，在原脚本页面上下文里手动调用：

```js
const shtArenaAddon = SHTArenaScoutAddon.install({
	panel: true,
	exposeController: true,
	controllerName: 'SHTArenaScout',
	firstStrikeValues: []
});
```

若想把控制器挂到原脚本对象上：

```js
SGS.shtArenaAddon = shtArenaAddon;
```

## 校验

```bash
npm run check
```

当前校验只做语法检查。真实游戏对象仍需在山河图擂台加载流程中验证。
