import * as vscode from 'vscode';

import { getContrastingColor, setAlpha } from './utils/utils';

function recoverColorConfig() {
  // 恢复用户颜色配置,用于解决Peacock 插件的冲突问题
  // 该方法没啥用， 因为peacock 直接在vscode 的reload生命周期 去恢复了。
  const config = vscode.workspace.getConfiguration();
  const _color = config.get('coralize.color') as string;
  setColorForVscodeWindow(_color);
}
async function persistColorConfig(color: string) {
  // 持久化coralize 配置到 .vscode/settings.json,该配置字段需要在 package.json 中注册
  // https://code.visualstudio.com/api/extension-capabilities/common-capabilities#configuration
  const config = vscode.workspace.getConfiguration();
  await config.update('coralize.color', color, vscode.ConfigurationTarget.Workspace);
}
async function setColorForVscodeWindow(color: string) {
  const config = vscode.workspace.getConfiguration();
  await config.update(
    'workbench.colorCustomizations',
    {
      'titleBar.activeBackground': color,
      'titleBar.activeForeground': getContrastingColor(color),
      'titleBar.inactiveBackground': color,
      'titleBar.inactiveForeground': getContrastingColor(color),
      'activityBar.background': color,
      'activityBar.foreground': getContrastingColor(color),
      'activityBar.inactiveForeground': setAlpha(getContrastingColor(color), 0.3),
      'statusBar.background': color,
      'statusBar.foreground': getContrastingColor(color),
      'statusBarItem.hoverBackground': setAlpha(getContrastingColor(color), 0.3),
      'statusBarItem.remoteBackground': color,
      'statusBarItem.remoteForeground': getContrastingColor(color),
    },
    // vscode.ConfigurationTarget.Global,全局配置
    vscode.ConfigurationTarget.Workspace, // 局部配置
  );
}
export function activate(context: vscode.ExtensionContext) {
  recoverColorConfig();

  const provider = new ColorsViewProvider(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(ColorsViewProvider.viewType, provider));
  // 监听新建窗口事件
  // context.subscriptions.push(vscode.window.onDidChangeWindowState((e) => {
  //   if (e.focused && e.window.state.focused) {
  //     console.log("New window created");
  //   }
  // }));

  // // 监听重新加载窗口事件
  // context.subscriptions.push(vscode.commands.registerCommand('_extension.reloadWindow', () => {
  //   console.log("Window reloaded");
  // }));
}
class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'coralize-view';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
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
        case 'colorSelected': {
          setColorForVscodeWindow(data.value);
          persistColorConfig(data.value);

          // vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
          break;
        }
      }
    });
  }

  // public addColor() {
  //   if (this._view) {
  //     this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
  //     this._view.webview.postMessage({ type: 'addColor' });
  //   }
  // }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'template','dist', 'main.js'));

    // Do the same for the stylesheet.
    const fontUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'template','dist', 'font.css'));
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'template','dist', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'template','dist', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'template','dist', 'main.css'));

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
    <dic id="wrapper">
      <div id="colorpicker">
        <div id="nav">
          <div id="search">
            <input id="searchbox" type="text" placeholder="过滤" value="#1c2938" />
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
    </dic>

		<script src="${scriptUri}"></script>

  </body>
</html>
		`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}
