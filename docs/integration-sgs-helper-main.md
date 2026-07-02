# 接入 sgs-helper-main

本模块按 `sgs-helper-main` 的页面上下文思路设计，核心依赖是游戏运行时对象，而非网络采样。

## 接入位置

推荐把 `src/sht-arena-addon.js` 作为独立文件保留，再由集成者选择自己的加载方式：

- 打包时把模块内容放进主脚本。
- 在本地开发版里先加载模块文件，再加载主脚本。
- 在主脚本初始化完成后调用安装函数。

模块本身不会自动启动。页面里出现 `SHTArenaScoutAddon` 后，调用 `install` 才会创建面板和定时读取。

## 推荐调用

```js
const shtArenaAddon = SHTArenaScoutAddon.install({
	panel: true,
	exposeController: true,
	controllerName: 'SHTArenaScout',
	firstStrikeValues: []
});

SGS.shtArenaAddon = shtArenaAddon;
```

`firstStrikeValues` 留空时，抢先手默认关闭。用户可以在模块面板里勾选数字，也可以由集成者写成固定配置：

```js
SHTArenaScoutAddon.install({
	firstStrikeValues: [2, 3, 4]
});
```

## 和原脚本的边界

- 不改写 `sgs-helper-main` 的现有逻辑。
- 不占用原脚本的主面板结构。
- 不接管原脚本的自动挂机、选将、出牌等功能。
- 不向服务端发自定义请求。

## 运行时要求

- 模块需要在游戏页面上下文执行。
- 页面需要能访问 `window.laya` 或 `window.Laya`。
- 对手技能和战法必须已经出现在 Laya 对象里，模块才能读取。
- 抢先手面板需要存在明文数字按钮，模块才会点击。

## 调试

```js
SHTArenaScout.status()
SHTArenaScout.data()
SHTArenaScout.firstStrike()
SHTArenaScout.setFirstStrike([2, 3, 4])
SHTArenaScout.refresh()
```

`data()` 中的条目会保留 `sourcePath`，用于确认实际命中的 Laya 对象路径。

`firstStrike()` 会返回当前勾选数字、最近一次命中值和来源路径。
