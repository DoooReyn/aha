import { IAbility, IMod } from './mod';
import { IResCacheAbility } from './res-cache';
import { IResDynamicAbility } from './res-dynamic';
import { IResRemoteAbility } from './res-remote';
import { ITabularAbility } from './tabular';

/**
 * 匹配位置信息
 */
export interface IAuditorMatchPosition {
  /** 匹配到的敏感词 */
  word: string;
  /** 起始位置（字符索引） */
  start: number;
  /** 结束位置（字符索引，不包含） */
  end: number;
}

/**
 * 匹配结果
 */
export interface IAuditorMatchResult {
  /** 是否匹配到敏感词 */
  matched: boolean;
  /** 匹配到的敏感词列表（去重，按首次出现顺序） */
  words: string[];
  /** 所有匹配位置信息 */
  matches: IAuditorMatchPosition[];
}

/**
 * AC 自动机节点接口
 */
export interface IACNode {
  /** 子节点映射 */
  children: Map<string, IACNode>;
  /** 失败指针 */
  fail: IACNode | null;
  /** 输出：匹配到的敏感词列表 */
  output: string[];
  /** 是否为结束节点 */
  isEnd: boolean;
}

/**
 * AC 自动机匹配结果
 */
export interface IACMatchResult {
  /** 匹配到的敏感词 */
  word: string;
  /** 起始位置 */
  start: number;
  /** 结束位置 */
  end: number;
}

/**
 * 审计员配置
 */
export interface IAuditorConfig {
  /**
   * 敏感词替换字符
   * @default '***'
   */
  readonly replacement?: string;

  /**
   * 是否启用缓存
   * @default true
   */
  readonly enableCache?: boolean;

  /**
   * 缓存大小
   * @default 1000
   */
  readonly cacheSize?: number;
}

/**
 * 审计员能力接口
 */
export interface IAuditorAbility extends IAbility {
  /**
   * 检测文本是否包含敏感词
   * @param text 待检测的文本
   * @returns 是否包含敏感词
   */
  test(text: string): boolean;

  /**
   * 查找文本中的所有敏感词
   * @param text 待查找的文本
   * @returns 匹配结果
   */
  find(text: string): IAuditorMatchResult;

  /**
   * 替换文本中的敏感词
   * @param text 待替换的文本
   * @param replacement 替换字符，默认使用配置的替换字符
   * @returns 替换后的文本
   */
  replace(text: string, replacement?: string): string;

  /**
   * 注入敏感词
   * @param words 敏感词列表
   */
  injectSensitiveWords(words: string[]): void;

  /**
   * 注入干扰词
   * @param words 干扰词列表
   */
  injectInterferenceWords(words: string[]): void;

  /**
   * 获取当前敏感词数量
   * @returns 敏感词数量
   */
  getSensitiveWordCount(): number;

  /**
   * 获取当前干扰词数量
   * @returns 干扰词数量
   */
  getInterferenceWordCount(): number;

  /**
   * 清空所有敏感词
   */
  clearSensitiveWords(): void;

  /**
   * 清空所有干扰词
   */
  clearInterferenceWords(): void;
}

/**
 * 审计员接口（敏感词过滤系统）
 *
 * - 使用 AC 自动机算法实现高效的多模式匹配
 * - 配置敏感词库和干扰词库
 * - 提供敏感词检测、查找和替换接口
 * - 支持动态注入新的敏感词/干扰词
 */
export interface IAuditor extends IMod {
  get ability(): IAuditorAbility;
  dependencies: {
    resCache: IResCacheAbility;
    resDynamic: IResDynamicAbility;
    resRemote: IResRemoteAbility;
    tabular: ITabularAbility;
  };
}
