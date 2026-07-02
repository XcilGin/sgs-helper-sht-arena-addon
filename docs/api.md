# API

模块加载后暴露全局对象：

```js
SHTArenaScoutAddon
```

## SHTArenaScoutAddon.install(options)

创建控制器并立即启动。

```js
const controller = SHTArenaScoutAddon.install({
	panel: true,
	exposeController: true,
	controllerName: 'SHTArenaScout',
	firstStrikeValues: []
});
```

## SHTArenaScoutAddon.createController(options)

创建控制器但不启动，需要手动调用 `start()`。

```js
const controller = SHTArenaScoutAddon.createController({ panel: true });
controller.start();
```

## Options

| 参数 | 默认值 | 用途 |
| --- | --- | --- |
| `panel` | `true` | 是否创建模块面板 |
| `exposeController` | `true` | 是否把控制器挂到全局 |
| `controllerName` | `"SHTArenaScout"` | 全局控制器名称 |
| `firstStrikeValues` | `null` | 初始抢先手数字，`null` 表示读取本地保存值 |
| `pollMs` | `180` | 主轮询间隔 |
| `firstStrikeScanMs` | `120` | 抢先手扫描间隔 |
| `firstStrikeCooldownMs` | `1400` | 连续点击冷却 |

## Controller

| 方法 | 用途 |
| --- | --- |
| `start()` | 启动 |
| `stop()` | 停止并移除面板 |
| `refresh()` | 立即刷新一次 |
| `data()` | 返回最近一次读取结果 |
| `status()` | 返回最近一次状态 |
| `firstStrike()` | 返回抢先手配置和状态 |
| `setFirstStrike(values)` | 设置抢先手数字 |
| `resetPosition()` | 重置面板位置 |

## 结果结构

```js
{
	opponent: { skills: [], tactics: [] },
	self: { skills: [], tactics: [] },
	preload: { skills: [], tactics: [] },
	seats: [],
	firstStrike: {
		enabled: false,
		selected: [],
		reason: '未勾选数字',
		value: '',
		path: '',
		method: '',
		lastClickAt: 0
	},
	status: {}
}
```
