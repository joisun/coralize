# Coralize 



Customize vscode window color in easier way !

![](https://raw.githubusercontent.com/jaycethanks/coralize/main/doc/doc.png)




## Configuraion

默认的， Coralize 会设定 vscode 窗口的 Title bar, Side bar， 以及 Status bar 颜色。 

如果你并不需要他们其中的一些， 你可以通过 扩展设置， 按照需要禁用或者开启。

> By default, Coralize sets the colors of the Title bar, Side bar, and Status bar in the vscode window. If you don't need any of them, you can disable or enable them as needed through extension settings.

- `"coralize.applyToTitleBar"` : `ture/false`
- `"coralize.applyToSideBar"` : `ture/false`
- `"coralize.applyToStatusBar"` : `ture/false`


## TroubleShooting

如果你的窗口发生了异常的颜色切换， 那么很可能是和其他插件冲突造成的， 例如 Peacock, 如果你同时安装了 Peacock ， 那么你可以通过 Peacock 的插件设置 `color`字段为 `null` 以解决该问题 (`@ext:johnpapa.vscode-peacock`). 

> If you experience abnormal color switching in your window, it is likely caused by conflicts with other plugins, such as Peacock. If you have installed Peacock at the same time, you can solve this problem by setting the "color" field to "null" in the plugin settings of Peacock (`@ext:johnpapa.vscode-peacock`).



## Inspiring

Coralize is Inspired by Peacock.





### AND

You can find repository of Coralize here : [Github](https://github.com/jaycethanks/coralize)