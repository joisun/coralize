import * as vscode from "vscode";
import { getContrastingColor, setAlpha, ligherColor } from "./utils/utils";
import { WorkspaceConfiguration } from "vscode";
import { ColorCustomization } from "./shared/ColorCustomization";

function recoverColorConfig() {
  // 根据用户 .vscode/settings.json.coralize.color，还原设定
  const _settingColor = getSettingColor();
  if (_settingColor) {
    console.log("coralize恢复用户设置！");
    setColorForVscodeWindow(_settingColor);
  }
}



function getSettingColor() {
  const config = vscode.workspace.getConfiguration();
  return config.get("coralize.color") as string;
}

const config = vscode.workspace.getConfiguration();

console.log('vscode.ThemeColor', vscode.window.activeColorTheme)

async function persistColorConfig(color: string) {
  // 持久化coralize 配置到 .vscode/settings.json,该配置字段需要在 package.json 中注册
  // https://code.visualstudio.com/api/extension-capabilities/common-capabilities#configuration
  const config = vscode.workspace.getConfiguration();
  await config.update(
    "coralize.color",
    color,
    vscode.ConfigurationTarget.Workspace
  );
}

async function setColorForVscodeWindow(color: string) {
  const config = vscode.workspace.getConfiguration();
  const ConfigItems = [
    "coralize.applyToTitleBar",
    "coralize.applyToSideBar",
    "coralize.applyToStatusBar",

  ]
  const computedConfig = ConfigItems.map(item => {
    return {
      field: item,
      value: config.get(item)
    }
  })


  // Config Item Object
  const CIO = {} as ColorCustomization;

  const contrastColor = getContrastingColor(color)
  const lighterColor = ligherColor(color, 30)
  const alphaColor = setAlpha(
    contrastColor,
    0.8
  );
  const _alphaColor = setAlpha(
    contrastColor,
    0.3
  )

  computedConfig.forEach(({ field, value }) => {
    CIO["tab.activeBorder"]= lighterColor;

    switch (field) {
      case "coralize.applyToTitleBar":
        if (value) {
          CIO["titleBar.activeBackground"] = color;
          CIO["titleBar.activeForeground"] = contrastColor
          CIO["titleBar.inactiveBackground"] = color
          CIO["titleBar.inactiveForeground"] = contrastColor
        }
        break;
      case "coralize.applyToSideBar":
        if (value) {
          CIO["activityBar.background"] = color
          CIO["activityBar.foreground"] = contrastColor
          CIO["activityBar.inactiveForeground"] = _alphaColor
          CIO["activityBar.activeBorder"] = alphaColor
        }
        break;
      case "coralize.applyToStatusBar":
        if (value) {
          CIO["statusBar.background"] = color;
          CIO["statusBar.foreground"] = contrastColor;
          CIO["statusBarItem.hoverBackground"] = _alphaColor;
          CIO["statusBarItem.remoteBackground"] = lighterColor;
          CIO["statusBarItem.remoteForeground"] = contrastColor
        }
        break;

    }
  })
  // console.log('CIO',CIO)

  await config.update(
    "workbench.colorCustomizations", { ...CIO },
    // {
    //   "titleBar.activeBackground": color,
    //   "titleBar.activeForeground": getContrastingColor(color),
    //   "titleBar.inactiveBackground": color,
    //   "titleBar.inactiveForeground": getContrastingColor(color),
    //   "activityBar.background": color,
    //   "activityBar.foreground": getContrastingColor(color),
    //   "activityBar.inactiveForeground": setAlpha(
    //     getContrastingColor(color),
    //     0.3
    //   ),
    //   "statusBar.background": color,
    //   "statusBar.foreground": getContrastingColor(color),
    //   "statusBarItem.hoverBackground": setAlpha(
    //     getContrastingColor(color),
    //     0.3
    //   ),
    //   "statusBarItem.remoteBackground": color,
    //   "statusBarItem.remoteForeground": getContrastingColor(color),
    // },
    // vscode.ConfigurationTarget.Global,全局配置
    vscode.ConfigurationTarget.Workspace // 局部配置
  );
  persistColorConfig(color);

}

export function activate(context: vscode.ExtensionContext) {
  // activationEvents.onStartupFinished 将会在reload 和 new window 时触发
  recoverColorConfig();

  const provider = new ColorsViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ColorsViewProvider.viewType,
      provider
    )
  );

  // 处理设置变化
  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('coralize.applyToTitleBar') || event.affectsConfiguration('coralize.applyToSideBar') || event.affectsConfiguration('coralize.applyToStatusBar')) {
      // console.log("effedcted")
      // 当用户修改了 Coralize 的配置，更新设定
      recoverColorConfig();
    }
  });
}
class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "coralize-view";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);


    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "colorSelected": {
          // 用户选中颜色 handler
          setColorForVscodeWindow(data.value);
          // vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
          break;
        }
      }
    });

    // 同步用户设置颜色到 coralize webview, 一定要在 _getHtmlForWebview() 之后执行
    let _view = this._view;

    // 当用户点击activity bar: coralize 按钮时，该方法仅会在首次触发以后再触发， 用户首次渲染coralize 的时候不会执行
    webviewView.onDidChangeVisibility((visible) => {
      const _settingColor = getSettingColor();
      if (_settingColor) {
        // 同步 coralize 的颜色状态
        _view.webview.postMessage({
          type: "syncCoralizeState",
          value: _settingColor,
        });
      }
    });

    // 没有找到 类似 loaded 或者 mounted 的方法， 直接在 activate 中去同步 coralize 状态好像获取不到 webview(undefined)
    // TODO: 待优化！
    const _settingColor = getSettingColor();
    if (_settingColor) {
      setTimeout(() => {
        _view.webview.postMessage({
          type: "syncCoralizeState",
          value: _settingColor,
        });
      }, 800);
    }
  }


  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "template", "dist", "main.js")
    );

    // Do the same for the stylesheet.
    const fontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "template", "dist", "font.css")
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "template", "dist", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "template", "dist", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "template", "dist", "main.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="style.css" />
    <link rel="stylesheet" href="reset.css" />
		<link href="${styleResetUri}" rel="stylesheet">
		<link href="${fontUri}" rel="stylesheet">
		<link href="${styleVSCodeUri}" rel="stylesheet">
		<link href="${styleMainUri}" rel="stylesheet">

    <title>coralize-html</title>
  </head>
  <body>
    <div id="wrapper">
      <div id="colorpicker">
        <div id="nav">
          <div id="search">
            <input id="searchbox" type="text"  value="#1c2938" />
          </div>
          <div id="link">
            <a href="#xingrenhuang">
              <div style="background-color: rgb(247, 232, 170)">
                <!-- 杏仁黄 -->
              </div>
            </a>
            <a href="#dantaohong">
              <div style="background-color: rgb(240, 173, 160)">
                <!-- 桃红 -->
              </div>
            </a>
            <a href="#xidanhong">
              <div style="background-color: rgb(236, 44, 100)">
                <!-- 喜蛋红 -->
              </div>
            </a>            
            <a href="#niluolan">
              <div style="background-color: rgb(36, 116, 181)">
                <!-- 尼罗蓝 -->
              </div>
            </a>
            <a href="#meidielv">
              <div style="background-color: rgb(18, 170, 156)">
                <!-- 美蝶绿 -->
              </div>
            </a>
            <a href="#yudubai">
              <div style="background-color: rgb(247, 244, 237)">
                <!-- 鱼肚白 -->
              </div>
            </a>
            <div id="button"  title="suprise me with a deep random color">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512"><path fill="currentColor" d="M255.76 44.764c-6.176 0-12.353 1.384-17.137 4.152L85.87 137.276c-9.57 5.536-9.57 14.29 0 19.826l152.753 88.36c9.57 5.536 24.703 5.536 34.272 0l152.753-88.36c9.57-5.535 9.57-14.29 0-19.825l-152.753-88.36c-4.785-2.77-10.96-4.153-17.135-4.153zm-.824 53.11c9.013.097 17.117 2.162 24.31 6.192c4.92 2.758 8.143 5.903 9.666 9.438c1.473 3.507 1.56 8.13.26 13.865l-1.6 5.706c-1.06 4.083-1.28 7.02-.66 8.81c.57 1.764 1.983 3.278 4.242 4.544l3.39 1.898l-33.235 18.62l-3.693-2.067c-4.118-2.306-6.744-4.912-7.883-7.82c-1.188-2.935-.99-7.603.594-14.005l1.524-5.748c.887-3.423.973-6.23.26-8.418c-.653-2.224-2.134-3.983-4.444-5.277c-3.515-1.97-7.726-2.676-12.63-2.123c-4.956.526-10.072 2.268-15.35 5.225c-4.972 2.785-9.487 6.272-13.55 10.46c-4.112 4.162-7.64 8.924-10.587 14.288L171.9 138.21c5.318-5.34 10.543-10.01 15.676-14.013c5.134-4 10.554-7.6 16.262-10.8c14.976-8.39 28.903-13.38 41.78-14.967a68.57 68.57 0 0 1 9.32-.557zm50.757 56.7l26.815 15.024l-33.235 18.62l-26.816-15.023l33.236-18.62zM75.67 173.84c-5.753-.155-9.664 4.336-9.664 12.28v157.696c0 11.052 7.57 24.163 17.14 29.69l146.93 84.848c9.57 5.526 17.14 1.156 17.14-9.895V290.76c0-11.052-7.57-24.16-17.14-29.688l-146.93-84.847c-2.69-1.555-5.225-2.327-7.476-2.387zm360.773.002c-2.25.06-4.783.83-7.474 2.385l-146.935 84.847c-9.57 5.527-17.14 18.638-17.14 29.69v157.7c0 11.05 7.57 15.418 17.14 9.89L428.97 373.51c9.57-5.527 17.137-18.636 17.137-29.688v-157.7c0-7.942-3.91-12.432-9.664-12.278zm-321.545 63.752c6.553 1.366 12.538 3.038 17.954 5.013a99.59 99.59 0 0 1 15.68 7.325c13.213 7.63 23.286 16.324 30.218 26.082c6.932 9.7 10.398 20.046 10.398 31.04c0 5.64-1.055 10.094-3.168 13.364c-2.112 3.212-5.714 5.91-10.804 8.094l-5.2 1.92c-3.682 1.442-6.093 2.928-7.23 4.46c-1.137 1.472-1.705 3.502-1.705 6.092v3.885l-29.325-16.933v-4.23c0-4.72.892-8.376 2.68-10.97c1.787-2.652 5.552-5.14 11.292-7.467l5.2-2.006c3.087-1.21 5.334-2.732 6.742-4.567c1.46-1.803 2.192-4.028 2.192-6.676c0-4.027-1.3-7.915-3.9-11.66c-2.6-3.804-6.227-7.05-10.885-9.74c-4.387-2.532-9.126-4.29-14.217-5.272c-5.09-1.04-10.398-1.254-15.922-.645v-27.11zm269.54 8.607c1.522 0 2.932.165 4.232.493c6.932 1.696 10.398 8.04 10.398 19.034c0 5.64-1.056 11.314-3.168 17.023c-2.112 5.65-5.714 12.507-10.804 20.568l-5.2 7.924c-3.682 5.695-6.093 9.963-7.23 12.807c-1.137 2.785-1.705 5.473-1.705 8.063v3.885l-29.325 16.932v-4.23c0-4.72.894-9.41 2.68-14.067c1.79-4.715 5.552-11.55 11.292-20.504l5.2-8.01c3.087-4.776 5.334-8.894 6.742-12.354c1.46-3.492 2.192-6.562 2.192-9.21c0-4.028-1.3-6.414-3.898-7.158c-2.6-.8-6.23.142-10.887 2.83c-4.387 2.533-9.124 6.25-14.215 11.145c-5.09 4.84-10.398 10.752-15.922 17.74v-27.11c6.553-6.2 12.536-11.44 17.95-15.718c5.417-4.278 10.645-7.87 15.68-10.777c10.738-6.2 19.4-9.302 25.99-9.307zm-252.723 94.515l29.326 16.93v30.736l-29.325-16.93v-30.735zm239.246 8.06v30.735l-29.325 16.93v-30.733l29.326-16.932z"/></svg>
            </div>            
          </div>
        </div>
        <div id="foresee">
          <div id="indicator">
            <p id="colorName">鸽蓝</p>
            <p id="head">(中国传统色)</p>
          </div>
          <div id="snackbar"></div>
          <div id="color-palette"></div>
        </div>
      </div>
    </div>

		<script nonce="${nonce}" src="${scriptUri}"></script>


  </body>
</html>
		`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() { }
