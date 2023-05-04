'use strict';
// copy hex color
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
const vscode = acquireVsCodeApi();
function onColorClicked(color) {
  vscode.postMessage({ type: 'colorSelected', value: color });
}
function copytext(text) {
  let input = document.createElement('textarea');
  input.innerHTML = text;
  document.body.appendChild(input);
  input.select();
  var result = document.execCommand('copy');
  document.body.removeChild(input);
  return result;
}
trigger();
function trigger() {
  let node = document.getElementById('color-palette');
  for (let i = 0; i < colors.length; i++) {
    let ele = document.createElement('div');
    ele.style.background = colors[i].hex;
    ele.style.color = colors[i].hex;
    let textspan = document.createElement('span');
    let text = document.createTextNode(colors[i].name);
    textspan.appendChild(text);
    ele.append(textspan);
    // 添加点击事件监听
    ele.addEventListener('click', function (e) {
      let copydata = colors[i].hex;
      copytext(copydata);
      myFunction(copydata);
      onColorClicked(copydata);
      let foreseeE = document.getElementById('wrapper');
      foreseeE.style.backgroundColor = copydata;
      let searchboxE = document.getElementById('searchbox');
      searchboxE.value = copydata;
      let colorNameE = document.getElementById('colorName');
      colorNameE.style.color = colors[i].hex;
      colorNameE.innerHTML = colors[i].name;
      let snackbar = document.getElementById('snackbar');
      snackbar.style.color = colors[i].hex;
      let headE = (document.getElementById('head').style.color = colors[i].hex);
    });
    ele.classList.add('kid');
    node.appendChild(ele);
    // 添加锚点
    let linkarr = ['xingrenhuang', 'dantaohong', 'niluolan', 'meidielv', 'yudubai'];
    linkarr.map((item) => {
      if (colors[i].pinyin == item) {
        let anchor = document.createElement('i');
        anchor.id = item;
        node.appendChild(anchor);
      }
    });
  }
}
const anchors = document.querySelectorAll('a[href^="#"]');
anchors.forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth',
    });
  });
});
// toast
function myFunction(copydata) {
  var x = document.getElementById('snackbar');
  x.innerHTML = copydata + ' has been copied successfully!';
  x.className = 'show';
  setTimeout(function () {
    x.className = x.className.replace('show', '');
    x.innerHTML = '';
  }, 2000);
}
