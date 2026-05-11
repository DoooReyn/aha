import { ICipher } from './interfaces/cipher';

/**
 * 链式编解码器
 *
 * 支持多个编解码器串联使用，编码时按顺序执行，解码时按逆序执行。
 *
 * @example
 * ```typescript
 * // 混合使用对象编解码器和类编解码器
 * const codec = new ChainedCipher<PlayerData>(
 *   JsonCipher,              // 对象编解码器
 *   Base64Cipher,            // 对象编解码器
 *   new XorCipher('secret')  // 类编解码器
 * );
 * // 编码: PlayerData -> JSON -> Base64 -> XOR
 * // 解码: XOR -> Base64 -> JSON -> PlayerData
 * ```
 */
class ChainedCipher<Raw = unknown, Enc = unknown> implements ICipher {
  /** 编解码器链 */
  private readonly codecs: ICipher[];

  /**
   * 构造函数
   *
   * @param codecs - 编解码器数组，编码时按顺序执行
   */
  public constructor(...codecs: ICipher[]) {
    this.codecs = codecs;
  }

  public encode(raw: Raw): Enc {
    let result: unknown = raw;
    for (const codec of this.codecs) {
      result = codec.encode(result);
    }
    return result as Enc;
  }

  public decode(enc: Enc): Raw {
    let result: unknown = enc;
    for (let i = this.codecs.length - 1; i >= 0; i--) {
      result = this.codecs[i].decode(result);
    }
    return result as Raw;
  }
}

export { ChainedCipher };
