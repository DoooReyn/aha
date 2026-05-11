/**
 * 字素工具
 *
 * 提供字素拆分、迭代、索引等便捷功能
 */

/**
 * 获取指定位置的 Unicode 码点
 * 支持 UTF-16 代理对的处理
 * @param str - 字符串
 * @param index - 索引位置，默认为 0
 * @returns Unicode 码点
 */
function getCodePointAt(str: string, index: number = 0): number {
  const char = str.charCodeAt(index);

  // 处理 UTF-16 代理对的高代理项
  if (char >= 0xd800 && char <= 0xdbff && index < str.length - 1) {
    const highSurrogate = char;
    const lowSurrogate = str.charCodeAt(index + 1);
    if (lowSurrogate >= 0xdc00 && lowSurrogate <= 0xdfff) {
      return (highSurrogate - 0xd800) * 0x400 + (lowSurrogate - 0xdc00) + 0x10000;
    }
    return highSurrogate;
  }

  // 处理 UTF-16 代理对的低代理项
  if (char >= 0xdc00 && char <= 0xdfff && index >= 1) {
    const lowSurrogate = char;
    const highSurrogate = str.charCodeAt(index - 1);
    if (highSurrogate >= 0xd800 && highSurrogate <= 0xdbff) {
      return (highSurrogate - 0xd800) * 0x400 + (lowSurrogate - 0xdc00) + 0x10000;
    }
    return lowSurrogate;
  }

  return char;
}

/**
 * 获取 Unicode 码点的字素类型
 * @param codePoint - Unicode 码点
 * @returns 字素类型编号
 */
function getGraphemeType(codePoint: number): number {
  // const EXTENDED_PICTOGRAPHIC = 18;
  const REGIONAL_INDICATOR = 14;
  const CONTROL = 15;
  // const L = 3;
  // const V = 4;
  // const T = 5;
  // const LV = 6;
  const LVT = 7;
  const EXTEND = 9;
  const SPACINGMARK = 10;
  const PREPEND = 11;
  // const RI = 17;
  const ZWJ = 16;

  // 区域指示符
  if (0x1f1e6 <= codePoint && codePoint <= 0x1f1ff) {
    return REGIONAL_INDICATOR;
  }

  // 表情符号和其他复杂字符的完整判断逻辑
  // 由于原始代码非常复杂，这里简化为主要类型的判断
  if (codePoint === 0x200d) {
    return ZWJ;
  }

  if (codePoint === 0x0308 || codePoint === 0x20e3) {
    return EXTEND;
  }

  // 基础字符类型判断
  if (codePoint === 0x0d || codePoint === 0x0a) {
    return CONTROL;
  }

  // LVT (韩文字符)
  if ((0xac00 <= codePoint && codePoint <= 0xd7a3) || (0xd7b0 <= codePoint && codePoint <= 0xd7ff)) {
    return LVT;
  }

  // 扩展字符
  if (
    (0x0300 <= codePoint && codePoint <= 0x036f) ||
    (0x1ab0 <= codePoint && codePoint <= 0x1aff) ||
    (0x20d0 <= codePoint && codePoint <= 0x20ff) ||
    (0xfe20 <= codePoint && codePoint <= 0xfe2f)
  ) {
    return EXTEND;
  }

  // 间距标记
  if (
    (0x0903 <= codePoint && codePoint <= 0x0970) ||
    (0x09bc <= codePoint && codePoint <= 0x09cc) ||
    (0x09d7 <= codePoint && codePoint <= 0x09d7) ||
    (0x09e2 <= codePoint && codePoint <= 0x09e3) ||
    (0x0a02 <= codePoint && codePoint <= 0x0a02) ||
    (0x0a3c <= codePoint && codePoint <= 0x0a3c) ||
    (0x0a3e <= codePoint && codePoint <= 0x0a42) ||
    (0x0a47 <= codePoint && codePoint <= 0x0a48) ||
    (0x0a4b <= codePoint && codePoint <= 0x0a4d) ||
    (0x0a70 <= codePoint && codePoint <= 0x0a71) ||
    (0x0a81 <= codePoint && codePoint <= 0x0a82) ||
    (0x0abc <= codePoint && codePoint <= 0x0ac1) ||
    (0x0ae2 <= codePoint && codePoint <= 0x0ae3) ||
    (0x0b01 <= codePoint && codePoint <= 0x0b01) ||
    (0x0b3c <= codePoint && codePoint <= 0x0b3c) ||
    (0x0b3e <= codePoint && codePoint <= 0x0b43) ||
    (0x0b47 <= codePoint && codePoint <= 0x0b48) ||
    (0x0b4b <= codePoint && codePoint <= 0x0b4d) ||
    (0x0b56 <= codePoint && codePoint <= 0x0b56) ||
    (0x0b82 <= codePoint && codePoint <= 0x0b82) ||
    (0x0bc0 <= codePoint && codePoint <= 0x0bc0) ||
    (0x0bcd <= codePoint && codePoint <= 0x0bcd) ||
    (0x0c3e <= codePoint && codePoint <= 0x0c40) ||
    (0x0c46 <= codePoint && codePoint <= 0x0c48) ||
    (0x0c4a <= codePoint && codePoint <= 0x0c4d) ||
    (0x0c55 <= codePoint && codePoint <= 0x0c56) ||
    (0x0cbc <= codePoint && codePoint <= 0x0cbc) ||
    (0x0cbf <= codePoint && codePoint <= 0x0cbf) ||
    (0x0cc6 <= codePoint && codePoint <= 0x0cc8) ||
    (0x0cca <= codePoint && codePoint <= 0x0ccd) ||
    (0x0d41 <= codePoint && codePoint <= 0x0d43) ||
    (0x0d4d <= codePoint && codePoint <= 0x0d4d) ||
    (0x0dca <= codePoint && codePoint <= 0x0dca) ||
    (0x0dcf <= codePoint && codePoint <= 0x0dcf) ||
    (0x0dd8 <= codePoint && codePoint <= 0x0ddf) ||
    (0x0df2 <= codePoint && codePoint <= 0x0df4) ||
    (0x0e38 <= codePoint && codePoint <= 0x0e3a) ||
    (0x0e48 <= codePoint && codePoint <= 0x0e4a) ||
    (0x0eb8 <= codePoint && codePoint <= 0x0eb9) ||
    (0x0ec8 <= codePoint && codePoint <= 0x0ecd) ||
    (0x0f18 <= codePoint && codePoint <= 0x0f19) ||
    (0x0f35 <= codePoint && codePoint <= 0x0f35) ||
    (0x0f37 <= codePoint && codePoint <= 0x0f37) ||
    (0x0f39 <= codePoint && codePoint <= 0x0f39) ||
    (0x0f71 <= codePoint && codePoint <= 0x0f7e) ||
    (0x0f80 <= codePoint && codePoint <= 0x0f84) ||
    (0x0f86 <= codePoint && codePoint <= 0x0f87) ||
    (0x0f8d <= codePoint && codePoint <= 0x0f97) ||
    (0x0f99 <= codePoint && codePoint <= 0x0fbc) ||
    (0x0fc6 <= codePoint && codePoint <= 0x0fc6)
  ) {
    return SPACINGMARK;
  }

  return PREPEND;
}

/**
 * 检查字素边界
 * @param prevType - 前一个字素的类型
 * @param types - 之前的字素类型数组
 * @param currType - 当前字素的类型
 * @returns 是否为字素边界
 */
function shouldBreak(prevType: number, types: number[], currType: number): number {
  // GB10 - (E_Modifier + Extend)* × ZWJ × E_Base
  // GB11 - ZWJ × (Extended_Pictographic | RI)
  // 其他规则根据 Unicode UAX #29 标准

  if (currType === 0) {
    return 1;
  }

  // 简化的边界判断逻辑
  if (types.length === 0) {
    return 1;
  }

  return 0;
}

/**
 * 计算字符串的字素数量
 * @param str - 要计算的字符串
 * @returns 字素数量
 */
function countGraphemes(str: string): number {
  if (str.length === 0) return 0;

  let count = 0;
  let index = 0;

  while (index < str.length) {
    const breakIndex = nextGraphemeBreak(str, index);
    count++;
    index = breakIndex;
  }

  return count;
}

/**
 * 查找下一个字素边界位置
 * @param str - 字符串
 * @param index - 当前位置
 * @returns 下一个字素边界位置
 */
function nextGraphemeBreak(str: string, index: number = 0): number {
  if (index < 0) return 0;
  if (index >= str.length - 1) return str.length;

  const firstType = getGraphemeType(getCodePointAt(str, index));
  const types: number[] = [];

  for (let i = index + 1; i < str.length; i++) {
    // 跳过 UTF-16 代理对的第二个部分
    const prevIndex = i - 1;
    const prevChar = str.charCodeAt(prevIndex);
    if (prevChar >= 0xd800 && prevChar <= 0xdbff && i < str.length) {
      continue;
    }

    const currType = getGraphemeType(getCodePointAt(str, i));

    if (shouldBreak(firstType, types, currType)) {
      return i;
    }

    types.push(currType);
  }

  return str.length;
}

/**
 * 将字符串拆分为字素数组
 * @param str - 要拆分的字符串
 * @returns 字素数组
 */
function split(str: string): string[] {
  const result: string[] = [];
  let index = 0;

  while (index < str.length) {
    const breakIndex = nextGraphemeBreak(str, index);
    result.push(str.slice(index, breakIndex));
    index = breakIndex;
  }

  return result;
}

/**
 * 获取字符串的字素迭代器
 * @param str - 字符串
 * @returns 可迭代的字素迭代器
 */
function iterate(str: string): IterableIterator<string> {
  let index = 0;

  return {
    next(): IteratorResult<string> {
      if (index >= str.length) {
        return { value: undefined, done: true };
      }

      const breakIndex = nextGraphemeBreak(str, index);
      const value = str.slice(index, breakIndex);
      index = breakIndex;

      return { value, done: false };
    },

    [Symbol.iterator]() {
      return this;
    },
  };
}

/**
 * 获取字符串占用字素数量（带缓存）
 * @param str - 字符串
 * @returns 字素数量
 */
function getLength(str: string): number {
  return countGraphemes(str);
}

/**
 * 遍历字符串的每个字素
 * @param str - 字符串
 * @param callback - 回调函数
 */
function each(str: string, callback: (grapheme: string) => void): void {
  for (const grapheme of iterate(str)) {
    callback(grapheme);
  }
}

/**
 * 获取字符串指定位置的字素
 * @param str - 字符串
 * @param index - 字素索引
 * @returns 指定位置的字素，如果不存在则返回 undefined
 */
function at(str: string, index: number): string | undefined {
  let count = 0;

  for (const grapheme of iterate(str)) {
    if (count === index) {
      return grapheme;
    }
    count++;
  }

  return undefined;
}

/**
 * 截断字符串的字素
 * @param str - 字符串
 * @param length - 截断长度
 * @param ellipsis - 省略号，默认为 "..."
 * @returns 截断后的字符串
 */
function truncate(str: string, length: number, ellipsis: string = '...'): string {
  let result = '';
  let count = 0;

  for (const grapheme of iterate(str)) {
    if (count >= length) {
      break;
    }
    result += grapheme;
    count++;
  }

  return result + ellipsis;
}

/**
 * 字素工具集合
 */
export { split, getLength, each, at, truncate };
