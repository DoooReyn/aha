import { LRUCache } from '../foundation/collections/lru-cache';
import { IAuditor, IAuditorAbility, IAuditorConfig, IAuditorMatchResult, IACMatchResult, IACNode } from './contract';
import { BaseMod } from './mod';

/**
 * AC 自动机
 */
class ACAutomaton {
  private _root: IACNode;
  private _built: boolean;
  private _wordCount: number;
  private _interferenceWords: Set<string>;

  public constructor() {
    this._root = {
      children: new Map(),
      fail: null,
      output: [],
      isEnd: false,
    };
    this._built = false;
    this._wordCount = 0;
    this._interferenceWords = new Set();
  }

  /**
   * 添加敏感词
   * @param word 敏感词
   */
  public addWord(word: string): void {
    if (!word || word.length === 0) {
      return;
    }

    let current = this._root;
    const chars = Array.from(word); // 使用 Array.from 正确处理 Unicode 字符

    for (const char of chars) {
      let child = current.children.get(char);
      if (!child) {
        child = {
          children: new Map(),
          fail: null,
          output: [],
          isEnd: false,
        };
        current.children.set(char, child);
      }
      current = child;
    }

    current.isEnd = true;
    current.output.push(word);
    this._wordCount++;
    this._built = false; // 标记需要重新构建 fail 指针
  }

  /**
   * 构建 fail 指针（使用 BFS）
   */
  public build(): void {
    if (this._built) {
      return;
    }

    const queue: IACNode[] = [];

    // 第一层节点的 fail 指针指向 root
    for (const child of this._root.children.values()) {
      child.fail = this._root;
      queue.push(child);
    }

    // BFS 构建 fail 指针
    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const [char, child] of current.children) {
        queue.push(child);

        // 查找 fail 指针
        let fail = current.fail;
        while (fail && !fail.children.has(char)) {
          fail = fail.fail;
        }

        child.fail = fail ? fail.children.get(char) || this._root : this._root;

        // 合并 output
        child.output.push(...child.fail.output);
      }
    }

    this._built = true;
  }

  /**
   * 匹配文本，返回所有匹配结果
   * @param text 待匹配的文本
   * @returns 匹配结果列表
   */
  public match(text: string): IACMatchResult[] {
    if (!this._built) {
      this.build();
    }

    const results: IACMatchResult[] = [];
    let current = this._root;
    const chars = Array.from(text); // 使用 Array.from 正确处理 Unicode 字符

    // 记录匹配时的原始位置
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      // 如果是干扰字符，跳过
      if (this._interferenceWords.has(char)) {
        continue;
      }

      // 沿着 fail 指针查找匹配的子节点
      while (current !== this._root && !current.children.has(char)) {
        current = current.fail!;
      }

      if (current.children.has(char)) {
        current = current.children.get(char)!;

        // 输出所有匹配的敏感词
        for (const word of current.output) {
          // 计算在原始文本中的起始位置（跳过干扰字符）
          let j = i;
          // 从当前位置向前查找匹配的起始位置
          const wordChars = Array.from(word);
          let wordIndex = wordChars.length - 1;

          // 从后向前匹配，找到原始文本中的位置
          while (j >= 0 && wordIndex >= 0) {
            if (this._interferenceWords.has(chars[j])) {
              j--;
              continue;
            }
            if (chars[j] === wordChars[wordIndex]) {
              wordIndex--;
            }
            j--;
          }

          results.push({
            word,
            start: j + 1,
            end: i + 1,
          });
        }
      }
    }

    return results;
  }

  /**
   * 检测文本是否包含敏感词
   * @param text 待检测的文本
   * @returns 是否包含敏感词
   */
  public test(text: string): boolean {
    if (!this._built) {
      this.build();
    }

    let current = this._root;
    const chars = Array.from(text);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      // 如果是干扰字符，跳过
      if (this._interferenceWords.has(char)) {
        continue;
      }

      while (current !== this._root && !current.children.has(char)) {
        current = current.fail!;
      }

      if (current.children.has(char)) {
        current = current.children.get(char)!;

        if (current.output.length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 获取敏感词数量
   * @returns 敏感词数量
   */
  public getWordCount(): number {
    return this._wordCount;
  }

  /**
   * 清空所有节点
   */
  public clear(): void {
    this._root = {
      children: new Map(),
      fail: null,
      output: [],
      isEnd: false,
    };
    this._built = false;
    this._wordCount = 0;
  }

  /**
   * 注入干扰词
   * @param words 干扰词列表
   */
  public addInterferenceWords(words: string[]): void {
    for (const word of words) {
      if (word && word.length > 0) {
        this._interferenceWords.add(word);
      }
    }
  }

  /**
   * 清空干扰词
   */
  public clearInterferenceWords(): void {
    this._interferenceWords.clear();
  }

  /**
   * 获取干扰词数量
   */
  public getInterferenceWordCount(): number {
    return this._interferenceWords.size;
  }
}

/**
 * 审计员能力实现
 */
class AuditorAbility implements IAuditorAbility {
  private _acAutomaton: ACAutomaton;
  private _config: IAuditorConfig;
  private _testCache: LRUCache<string, boolean> | null;
  private _findCache: LRUCache<string, IAuditorMatchResult> | null;
  private _replaceCache: LRUCache<string, string> | null;
  private _sensitiveWords: Set<string>;

  constructor(
    public mod: IAuditor,
    config: IAuditorConfig
  ) {
    this._acAutomaton = new ACAutomaton();
    this._sensitiveWords = new Set();
    this._acAutomaton.addInterferenceWords(' \t\r\n'.split(''));
    this._config = {
      replacement: '█',
      enableCache: true,
      cacheSize: 1000,
      ...config,
    };

    if (this._config.enableCache) {
      this._testCache = new LRUCache(this._config.cacheSize);
      this._findCache = new LRUCache(this._config.cacheSize);
      this._replaceCache = new LRUCache(this._config.cacheSize);
    } else {
      this._testCache = null;
      this._findCache = null;
      this._replaceCache = null;
    }
  }

  public async attach(): Promise<void> {
    // 构建敏感词自动机
    this._buildAutomaton();
  }

  public detach(): void {
    this._acAutomaton.clear();
    this._testCache?.clear();
    this._findCache?.clear();
    this._replaceCache?.clear();
    this._sensitiveWords.clear();
    this._acAutomaton = null;
    this._testCache = null;
    this._findCache = null;
    this._replaceCache = null;
    this._sensitiveWords = null;
    this._config = null;
    this.mod = null;
  }

  public test(text: string): boolean {
    if (!text || text.length === 0) {
      return false;
    }

    // 检查缓存
    if (this._testCache) {
      const cached = this._testCache.get(text);
      if (cached !== null) {
        return cached;
      }
    }

    const result = this._acAutomaton.test(text);

    // 更新缓存
    if (this._testCache) {
      this._testCache.set(text, result);
    }

    return result;
  }

  public find(text: string): IAuditorMatchResult {
    if (!text || text.length === 0) {
      return { matched: false, words: [], matches: [] };
    }

    // 检查缓存
    if (this._findCache) {
      const cached = this._findCache.get(text);
      if (cached !== null) {
        // 返回浅拷贝，防止外部修改影响缓存
        return {
          matched: cached.matched,
          words: [...cached.words],
          matches: cached.matches.map((m) => ({ ...m })),
        };
      }
    }

    // 匹配文本，自动跳过干扰词
    const matches = this._acAutomaton.match(text);

    // 去重敏感词
    const wordSet = new Set<string>();
    for (const match of matches) {
      wordSet.add(match.word);
    }

    const result: IAuditorMatchResult = {
      matched: matches.length > 0,
      words: Array.from(wordSet),
      matches,
    };

    // 更新缓存（存储副本，防止后续修改影响缓存）
    if (this._findCache) {
      this._findCache.set(text, {
        matched: result.matched,
        words: [...result.words],
        matches: result.matches.map((m) => ({ ...m })),
      });
    }

    return result;
  }

  public replace(text: string, replacement?: string): string {
    if (!text || text.length === 0) {
      return text;
    }

    // 检查缓存
    const cacheKey = `${text}_${replacement || this._config.replacement}`;
    if (this._replaceCache) {
      const cached = this._replaceCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const result = this.find(text);
    if (!result.matched) {
      return text;
    }

    // 按位置从后向前替换，避免位置偏移
    const replaceChar = replacement || this._config.replacement;
    let replacedText = text;

    for (const match of result.matches.sort((a, b) => b.start - a.start)) {
      const before = replacedText.slice(0, match.start);
      const after = replacedText.slice(match.end);
      replacedText = before + replaceChar + after;
    }

    // 更新缓存
    if (this._replaceCache) {
      this._replaceCache.set(cacheKey, replacedText);
    }

    return replacedText;
  }

  public injectSensitiveWords(words: string[]): void {
    for (const word of words) {
      if (word && word.length > 0) {
        this._sensitiveWords.add(word);
      }
    }
    this._buildAutomaton();
    this._clearCache();
  }

  public injectInterferenceWords(words: string[]): void {
    this._acAutomaton.addInterferenceWords(words);
    this._clearCache();
  }

  public getSensitiveWordCount(): number {
    return this._sensitiveWords.size;
  }

  public getInterferenceWordCount(): number {
    return this._acAutomaton.getInterferenceWordCount();
  }

  public clearSensitiveWords(): void {
    this._sensitiveWords.clear();
    this._buildAutomaton();
    this._clearCache();
  }

  public clearInterferenceWords(): void {
    this._acAutomaton.clearInterferenceWords();
    this._clearCache();
  }

  /**
   * 构建 AC 自动机
   */
  private _buildAutomaton(): void {
    this._acAutomaton.clear();
    const words = this._sensitiveWords;
    for (const word of words) {
      this._acAutomaton.addWord(word);
    }
    this._acAutomaton.build();
  }

  /**
   * 清空缓存
   */
  private _clearCache(): void {
    this._testCache?.clear();
    this._findCache?.clear();
    this._replaceCache?.clear();
  }
}

/**
 * 审计员实现
 */
class Auditor extends BaseMod<AuditorAbility> implements IAuditor {
  public static readonly InitArgs: Parameters<Auditor['loadAbility']>;
  public static readonly Trait: string = 'auditor';
  declare public dependencies: IAuditor['dependencies'];

  protected loadAbility(config: IAuditorConfig = {}): AuditorAbility {
    return new AuditorAbility(this, config);
  }
}

export { Auditor };
