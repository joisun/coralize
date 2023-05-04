// copy hex color

type Color = {
  CMYK: number[];
  RGB: number[];
  hex: string;
  name: string;
  pinyin: string;
};
type Colors = Color[];

function copytext(text: string) {
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
      let foreseeE = document.getElementById('wrapper');
      foreseeE.style.backgroundColor = copydata;
      let searchboxE = document.getElementById('searchbox') as HTMLInputElement;
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

const anchors = document.querySelectorAll('a[href^="#"]') as NodeListOf<HTMLAnchorElement>;
anchors.forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth',
    });
  });
});

// toast
function myFunction(copydata: string) {
  var x = document.getElementById('snackbar');
  x.innerHTML = copydata + ' has been copied successfully!';
  x.className = 'show';
  setTimeout(function () {
    x.className = x.className.replace('show', '');
    x.innerHTML = '';
  }, 1000);
}
