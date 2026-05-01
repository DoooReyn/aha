import { color, Color } from 'cc';

/**
 * 颜色工具
 *
 * 提供颜色相关的功能，包括色值通道合成、色值转换、CCColor与十六进制色值的相互转换等
 */

/**
 * 色值通道合成
 * @param channels 色值通道数组
 * @returns 色值
 */
function composite(channels: number[]) {
  return `#${channels.map(toChannelHEX).join('').toUpperCase()}`;
}

/**
 * 色值转换
 * @param r 色值(通道 R)
 * @param g 通道 G
 * @param b 通道 B
 * @param a 通道 A
 * @returns Cocos Creator 颜色
 */
function from(r: Color | string | number[] | number, g?: number, b?: number, a?: number): Color {
  if (typeof r === 'string') {
    return color(r);
  } else if (typeof r === 'number') {
    g ??= 255;
    b ??= 255;
    const channels = [r, g, b];
    if (a != undefined) channels[3] = a;
    return from(composite(channels));
  } else if (Array.isArray(r)) {
    if (r.length <= 3) {
      for (let i = 0; i < 3; i++) r[i] ??= 255;
    } else {
      r.splice(4);
    }
    return from(composite(r));
  } else {
    return color(r);
  }
}

/**
 * 将通道值转换为十六进制
 * @param c 通道值
 * @returns 十六进制通道值
 */
function toChannelHEX(c: number) {
  return (c ?? 255).toString(16).padStart(2, '0');
}

/**
 * 将 CCColor 转换为3个通道的十六进制色值
 * @param c 色值
 * @returns 3通道的十六进制色值
 */
function toHex3(c: Color): string {
  const r = toChannelHEX(c.r);
  const g = toChannelHEX(c.g);
  const b = toChannelHEX(c.b);
  return `#${r}${g}${b}`;
}

/**
 * 将 CCColor 转换为4个通道的十六进制色值
 * @param c 色值
 * @returns 4通道的十六进制色值
 */
function toHex4(c: Color) {
  const r = toChannelHEX(c.r);
  const g = toChannelHEX(c.g);
  const b = toChannelHEX(c.b);
  const a = toChannelHEX(c.a);
  return `#${r}${g}${b}${a}`;
}

/**
 * 颜色工具集合
 */
export { composite, from, toHex3, toHex4 };
