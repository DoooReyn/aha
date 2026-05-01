import { Region } from './interfaces/general';

/**
 * 随机数生成工具
 *
 * 提供随机种子、随机数生成、随机方法
 */

/** 随机数哈希字符集 */
const $HASH_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
/** 随机种子 */
let $SEED: string = randomSeed();
/** 上个随机数 */
let $RAND: number = 0;

/**
 * 将字符串转换为数字的哈希值
 * @param str - 要转换的字符串
 * @returns 字符串的哈希值（正整数）
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * 生成随机种子（6 位大写字母和数字组合）
 * @returns 6位随机种子字符串
 */
function randomSeed(): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += $HASH_CHARACTERS.charAt(Math.floor(Math.random() * $HASH_CHARACTERS.length));
  }
  return result;
}

/**
 * 设置随机数种子
 * @param newSeed - 要设置的种子字符串
 */
function setSeed(newSeed: string): void {
  $SEED = newSeed;
  $RAND = hashString(newSeed);
}

/**
 * 获取当前随机数种子
 * @returns 当前使用的种子字符串
 */
function getSeed(): string {
  return $SEED;
}

/**
 * 获取随机数(0~1之间)
 * 使用线性同余生成器算法
 * @returns 0到1之间的随机浮点数
 */
function random(): number {
  $RAND = ($RAND * 9301 + 49297) % 233280;
  return $RAND / 233280;
}

/**
 * 获取随机数(-1~1之间)
 * @returns -1到1之间的随机浮点数
 */
function randomOp(): number {
  return random() * 2 - 1;
}

/**
 * 随机布尔值
 * @returns 随机true或false
 */
function randomIf(): boolean {
  return random() > 0.5;
}

/**
 * 随机整数 0 或 1
 * @returns 0或1的随机整数
 */
function random01(): number {
  return randomIf() ? 1 : 0;
}

/**
 * 随机指定范围内的数
 * @param min - 最小值
 * @param max - 最大值
 * @returns min到max之间的随机浮点数
 */
function randomRange(min: number, max: number): number {
  return min + random() * (max - min);
}

/**
 * 随机整数
 * 根据 Region 枚举值决定区间开闭情况
 * @param min - 最小值
 * @param max - 最大值
 * @param range - 区间类型，默认为L1R0（左闭右开）
 * @returns 指定范围内的随机整数
 */
function randomInteger(min: number, max: number, range: Region = Region.L1R0): number {
  let v: number = min;
  switch (range) {
    case Region.L1R0:
      v = Math.floor(randomRange(min, max));
      break;
    case Region.L0R1:
      v = Math.ceil(randomRange(min, max));
      break;
    case Region.L1R1:
      v = Math.floor(randomRange(min, max + 1));
      break;
    case Region.L0R0:
      v = Math.floor(randomRange(min + 1, max));
      break;
  }
  return v;
}

/**
 * 随机 UUID
 * @returns UUID
 */
function randomUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (random() * 16) | 0;
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * 随机颜色通道值
 * @returns 通道值
 */
function randomChannel() {
  return Math.floor(random() * 256);
}

/**
 * 随机颜色值（十六进制）
 * @param channels 通道数
 * @returns 颜色值（十六进制）
 */
function randomColor(channels: 3 | 4 = 3): string {
  const r = randomChannel();
  const g = randomChannel();
  const b = randomChannel();
  if (channels === 4) {
    const a = randomChannel();
    const c = ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
    return `#${c.toString(16).padStart(8, '0').toUpperCase()}`;
  } else {
    const c = (r << 16) | (g << 8) | b;
    return `#${c.toString(16).padStart(6, '0').toUpperCase()}`;
  }
}

/**
 * 随机圆内的点
 * 使用极坐标系统生成均匀分布的随机点
 * @param x - 圆心x坐标
 * @param y - 圆心y坐标
 * @param r - 圆半径
 * @returns 圆内随机点的坐标
 */
function randomInCircle(x: number, y: number, r: number): { x: number; y: number } {
  const rad = randomRange(0, Math.PI * 2);
  const r2 = randomRange(0, r);
  x += r2 * Math.cos(rad);
  y += r2 * Math.sin(rad);
  return { x, y };
}

/**
 * 随机圆上的点
 * @param x - 圆心x坐标
 * @param y - 圆心y坐标
 * @param r - 圆半径
 * @returns 圆上随机点的坐标
 */
function randomOnCircle(x: number, y: number, r: number): { x: number; y: number } {
  const rad = randomRange(0, 2 * Math.PI);
  x += Math.cos(rad) * r;
  y += Math.sin(rad) * r;
  return { x, y };
}

/**
 * 随机圆弧内的点
 * 在指定弧度范围内随机生成点
 * @param x - 圆心x坐标
 * @param y - 圆心y坐标
 * @param startRad - 起始弧度
 * @param endRad - 结束弧度
 * @param r - 半径
 * @returns 圆弧内随机点的坐标
 */
function randomInRad(x: number, y: number, startRad: number, endRad: number, r: number): { x: number; y: number } {
  const rad = randomRange(startRad, endRad);
  const r2 = randomRange(0, r);
  x += Math.cos(rad) * r2;
  y += Math.sin(rad) * r2;
  return { x, y };
}

/**
 * 随机圆弧上的点
 * @param x - 圆心x坐标
 * @param y - 圆心y坐标
 * @param startRad - 起始弧度
 * @param endRad - 结束弧度
 * @param r - 半径
 * @returns 圆弧上随机点的坐标
 */
function randomOnRad(x: number, y: number, startRad: number, endRad: number, r: number): { x: number; y: number } {
  const rad = randomRange(startRad, endRad);
  x += Math.cos(rad) * r;
  y += Math.sin(rad) * r;
  return { x, y };
}

/**
 * 随机矩形内的点
 * @param x - 矩形左上角x坐标
 * @param y - 矩形左上角y坐标
 * @param w - 矩形宽度
 * @param h - 矩形高度
 * @returns 矩形内随机点的坐标
 */
function randomInRect(x: number, y: number, w: number, h: number): { x: number; y: number } {
  x += randomRange(0, w);
  y += randomRange(0, h);
  return { x, y };
}

/**
 * 随机矩形边上的点
 * 随机选择四条边中的一条，然后在边上随机位置生成点
 * @param x - 矩形左上角x坐标
 * @param y - 矩形左上角y坐标
 * @param w - 矩形宽度
 * @param h - 矩形高度
 * @returns 矩形边上随机点的坐标
 */
function randomOnRect(x: number, y: number, w: number, h: number): { x: number; y: number } {
  const edge = randomInteger(0, 4);
  switch (edge) {
    case 0:
      // 左边
      y += randomRange(0, h);
      break;
    case 1:
      // 上边
      x += randomRange(0, w);
      y += h;
      break;
    case 2:
      // 右边
      x += w;
      y += randomRange(0, h);
      break;
    case 3:
      // 下边
      x += randomRange(0, w);
      break;
  }
  return { x, y };
}

/**
 * 随机圆环内的点
 * 在内外半径之间的环形区域内随机生成点
 * @param x - 圆心x坐标
 * @param y - 圆心y坐标
 * @param r1 - 内半径
 * @param r2 - 外半径
 * @returns 圆环内随机点的坐标
 */
function randomInRing(x: number, y: number, r1: number, r2: number): { x: number; y: number } {
  const rad = randomRange(0, 2 * Math.PI);
  const r = randomRange(r1, r2);
  x += Math.cos(rad) * r;
  y += Math.sin(rad) * r;
  return { x, y };
}

/**
 * 随机数生成工具集合
 */
export {
  randomSeed,
  setSeed,
  getSeed,
  random,
  randomOp,
  randomIf,
  random01,
  randomRange,
  randomInteger,
  randomUuid,
  randomChannel,
  randomColor,
  randomInCircle,
  randomOnCircle,
  randomInRad,
  randomOnRad,
  randomInRect,
  randomOnRect,
  randomInRing,
};
