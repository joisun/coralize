import * as vscode from "vscode";
import { getContrastingColor, setAlpha } from "./utils/utils";

function recoverColorConfig() {
  // 根据用户 .vscode/settings.json.coralize.color，还原设定
  // TODO: 设置用户默认颜色，
  // await config.update('coralize.default', [1,2,3], vscode.ConfigurationTarget.Global);
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
  await config.update(
    "workbench.colorCustomizations",
    {
      "titleBar.activeBackground": color,
      "titleBar.activeForeground": getContrastingColor(color),
      "titleBar.inactiveBackground": color,
      "titleBar.inactiveForeground": getContrastingColor(color),
      "activityBar.background": color,
      "activityBar.foreground": getContrastingColor(color),
      "activityBar.inactiveForeground": setAlpha(
        getContrastingColor(color),
        0.3
      ),
      "statusBar.background": color,
      "statusBar.foreground": getContrastingColor(color),
      "statusBarItem.hoverBackground": setAlpha(
        getContrastingColor(color),
        0.3
      ),
      "statusBarItem.remoteBackground": color,
      "statusBarItem.remoteForeground": getContrastingColor(color),
    },
    // vscode.ConfigurationTarget.Global,全局配置
    vscode.ConfigurationTarget.Workspace // 局部配置
  );
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
}
class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "coralize-view";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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
          persistColorConfig(data.value);
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

export function deactivate() {}
