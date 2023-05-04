export const getContrastingColor = function (backgroundColor: string) {
    // 将背景颜色转换为RGB值
    const rgb = hexToRgb(backgroundColor)!;

    // 计算相对亮度
    const brightness = calculateRelativeBrightness(rgb);

    // 如果亮度小于0.5，则返回白色，否则返回黑色
    return brightness < 0.5 ? '#fff' : '#000';
}

// 将十六进制颜色代码转换为RGB格式
export const hexToRgb = function (hex: string) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

// 计算相对亮度
export const calculateRelativeBrightness = function (rgb: { r: number, g: number, b: number }) {
    const { r, g, b } = rgb;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
export const  rgbaToHex = function(r: number, g: number, b: number, a: number = 1): string {
    // 将 r、g、b 值转换为 16 进制字符串并填充到两位
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
  
    // 将 alpha 值乘以 255 并转换为 16 进制字符串，并去掉前导零
    const aHex = Math.round(a * 255)
      .toString(16)
      .toUpperCase();
  
    // 返回完整的 hex 颜色码
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }

export const setAlpha = function(color:string,alpha:number){
    const {r,g,b} = hexToRgb(color)!
    return rgbaToHex(r,g,b,alpha)
}


  