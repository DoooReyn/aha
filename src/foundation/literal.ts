/**
 * 字符串工具
 *
 * 提供常用的字符串操作函数
 */

import { Dict } from './interfaces/general';

/**
 * 格式化
 * @param template 模板
 * @param args 参数列表
 * @returns 格式化后的字符串
 */
function fmt(template: string, ...args: unknown[]) {
  // 如果没有参数，则直接返回模板字符串
  if (args.length === 0) {
    return template;
  }
  // 如果只有一个参数且为对象，则使用命名参数格式化
  if (args.length === 1) {
    const params = args[0];
    if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
      return template.replace(/{([^{}]*)}/g, (match, key) => {
        const value = (params as Dict)[key];
        return value !== undefined ? String(value) : match;
      });
    }
  }
  // 否则使用位置参数进行格式化
  return template.replace(/{(\d+)}/g, (match, index) => {
    const value = args[parseInt(index)];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * 是否空字符串
 * @param str 输入字符串
 * @returns 是否空字符串
 */
function isBlank(str: string) {
  return isLiteral(str) && str.length === 0;
}

/**
 * 是否字符串
 * @param str 输入字符串
 * @returns 是否字符串
 */
function isLiteral(str: string) {
  return typeof str === 'string';
}

/**
 * 截断字符串
 * @param str 输入字符串
 * @param maxLength 截断长度
 * @param ellipsis 省略号（默认"..."）
 * @returns 截断后的字符串
 */
function truncate(str: string, maxLength: number, ellipsis: string = '...') {
  return str.length <= maxLength ? str : str.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * 首字母大写
 * @param str 输入字符串
 * @returns 转换后的字符串
 */
function capitalize(str: string) {
  if (!str || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 首字母小写
 * @param str 输入字符串
 * @returns 转换后的字符串
 */
function uncapitalize(str: string) {
  if (!str || str.length === 0) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/** 常用字符集码范围 */
const CHAR_SET: Record<string, [number, number]> = {
  /** 基本汉字 */
  CHINESE: [0x4e00, 0x9fa5],
  /** 数字0-9	*/
  DIGIT: [0x30, 0x39],
  /** 小写英文字母 */
  LOWER: [0x61, 0x7a],
  /** 大写英文字母 */
  UPPER: [0x41, 0x5a],
} as const;

/**
 * 是否中文字符
 * @param char 输入字符
 * @returns 是否中文字符
 */
function isChinese(char: string) {
  const charCode = char.charCodeAt(0);
  return charCode >= CHAR_SET.CHINESE[0] && charCode <= CHAR_SET.CHINESE[1];
}

/**
 * 是否英文字符
 * @param char 输入字符
 * @returns 是否英文字符
 */
function isEnglish(char: string) {
  return /^[a-zA-Z]$/.test(char);
}

/**
 * 是否数字字符
 * @param char 输入字符
 * @returns 是否数字字符
 */
function isDigit(char: string) {
  const charCode = char.charCodeAt(0);
  return charCode >= CHAR_SET.DIGIT[0] && charCode <= CHAR_SET.DIGIT[1];
}

/**
 * 拆分单词
 * @param text 输入文本
 * @returns 单词列表
 */
function splitWords(text: string) {
  if (!text || text.length === 0) {
    return [];
  }

  const result: string[] = [];
  let currentWord = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // 检查是否为英文字母
    if (isEnglish(char)) {
      // 如果当前字符是英文字母，添加到当前单词中
      currentWord += char;
    } else {
      // 如果当前字符不是英文字母
      // 1. 先保存之前的英文单词（如果有的话）
      if (currentWord.length > 0) {
        result.push(currentWord);
        currentWord = '';
      }

      // 2. 添加当前非英文字符
      result.push(char);
    }
  }

  // 处理最后一个单词（如果字符串以英文字母结尾）
  if (currentWord.length > 0) {
    result.push(currentWord);
  }

  return result;
}

/** 剔除出空白字符 */
function prune(text: string, space = true) {
  return text.replace(space ? /\s+/g : /[^\S ]+/g, '');
}

/**
 * 字符串工具集合
 */
export {
  fmt,
  isBlank,
  isLiteral,
  truncate,
  capitalize,
  uncapitalize,
  isChinese,
  isEnglish,
  isDigit,
  splitWords,
  prune,
};
