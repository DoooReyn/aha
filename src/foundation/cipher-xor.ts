/**
 * XOR 编解码器
 *
 * 使用异或运算对数据进行简单的加密/混淆。
 * 支持字符串密钥，密钥会循环使用。
 *
 * @example
 * ```typescript
 * const codec = new XorCipher('secret');
 * const encoded = codec.encode('hello');
 * const decoded = codec.decode(encoded); // 'hello'
 * ```
 */
class XorCipher {
  private readonly _key: string;

  /**
   * 构造函数
   *
   * @param key - XOR 密钥
   */
  public constructor(key: string) {
    this._key = key;
  }

  public encode(data: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      // 循环使用密钥的每个字符
      const keyChar = this._key.charCodeAt(i % this._key.length);
      result += String.fromCharCode(data.charCodeAt(i) ^ keyChar);
    }
    return result;
  }

  public decode(raw: string): string {
    return this.encode(raw); // XOR 编码和解码是相同的操作
  }
}

export { XorCipher };
