/**
 * 数学工具
 *
 * 提供常用的数学操作函数
 */

/** 校验数字是否有效 */
function isValid(d: number): boolean {
  return !isNaN(d);
}

/** 校验数字是否为无限大 */
function isInfinite(d: number): boolean {
  return !isFinite(d);
}

/** 校验数字是否为负数 */
function isNegative(d: number): boolean {
  return d < 0;
}

/** 校验数字是否为非负数 */
function isPositive(d: number): boolean {
  return d >= 0;
}

/** 校验数字是否为整数 */
function isInteger(d: number): boolean {
  return Number.isInteger(d);
}

/** 获取数字的小数部分 */
function decimal(d: number): number {
  return d - Math.floor(d);
}

/** 限制数字在指定范围内 */
function clamp(d: number, min: number, max: number): number {
  return Math.min(Math.max(d, min), max);
}

/** 限制数字在 0~1 范围内 */
function clamp01(d: number): number {
  return clamp(d, 0, 1);
}

/** 数字是否在指定范围内 */
function isInRange(d: number, min: number, max: number) {
  return d >= min && d <= max;
}

/** 校验数字是否近似等于另一个数字 */
function equals(d: number, e: number, tolerance?: number): boolean {
  return d === e || Math.abs(d - e) <= tolerance;
}

/** 获取数字的符号 */
function sign(d: number): number {
  return d === 0 ? 0 : d < 0 ? -1 : 1;
}

/** 计算数字的和 */
function sum(...arr: number[]): number {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

/** 计算数字的平均值 */
function average(...arr: number[]): number {
  return sum(...arr) / arr.length;
}

/** 计算数字的乘积 */
function product(...arr: number[]): number {
  return arr.reduce((acc, cur) => acc * cur, 1);
}

/** 保留数字的指定小数位数 */
function toPrecise(d: number, precision: number): number {
  const e = Math.pow(10, precision);
  return Math.round(d * e) / e;
}

/** 计算两点之间的距离 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/** 角度转换为弧度 */
function angle2rad(angle: number): number {
  return (angle * Math.PI) / 180;
}

/** 弧度转换为角度 */
function rad2angle(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 计算两点之间的角度 */
function angle(x1: number, y1: number, x2: number, y2: number): number {
  return rad2angle(Math.atan2(y2 - y1, x2 - x1));
}

/** 校验两个圆是否相交 */
function circleCross(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
  return distance(x1, y1, x2, y2) <= r1 + r2;
}

/** 计算二次贝塞尔曲线在指定参数值下的点 */
function quadraticBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  t: number
): [number, number] {
  const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
  const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
  return [x, y];
}

/** 计算三次贝塞尔曲线在指定参数值下的点 */
function cubicBezier(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number
): [number, number] {
  const x = (1 - t) ** 3 * x1 + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t ** 2 * cx2 + t ** 3 * x2;
  const y = (1 - t) ** 3 * y1 + 3 * (1 - t) ** 2 * t * cy1 + 3 * (1 - t) * t ** 2 * cy2 + t ** 3 * y2;
  return [x, y];
}

/**
 * 范围生成器
 * @param start 开始位置
 * @param end 结束位置
 * @param direction 方向
 */
function* range(start: number, end: number, direction: 'forward' | 'backward' = 'forward') {
  start = Math.floor(start);
  end = Math.floor(end);
  if (start > end) [start, end] = [end, start];
  if (direction === 'forward') {
    for (let i = start; i < end; i++) yield i;
  } else {
    for (let i = end - 1; i >= start; i--) yield i;
  }
}

/**
 * 数学工具集合
 */
export {
  isValid,
  isInfinite,
  isNegative,
  isPositive,
  isInteger,
  decimal,
  clamp,
  clamp01,
  isInRange,
  equals,
  sign,
  sum,
  average,
  product,
  toPrecise,
  distance,
  angle2rad,
  rad2angle,
  angle,
  circleCross,
  quadraticBezier,
  cubicBezier,
  range,
};
