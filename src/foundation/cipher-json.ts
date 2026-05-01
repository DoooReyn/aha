import { Journal } from '../journal';
import { mightSync } from './might';

/**
 * JSON 编解码器
 *
 * 将 JavaScript 对象转换为 JSON 字符串，支持嵌套对象和数组。
 *
 * @example
 * ```typescript
 * const json = JsonCipher.encode({ name: 'Player', level: 5 });
 * const data = JsonCipher.decode<{ name: string; level: number }>(json);
 * ```
 */
const JsonCipher = {
  /**
   * 将数据编码为 JSON 字符串
   *
   * @param data - 要编码的数据
   * @returns JSON 字符串，编码失败返回 '{}'
   */
  encode<T>(data: T): string {
    const [ret, err] = mightSync(JSON.stringify, null, data);
    if (err) {
      Journal.Error('JSON 编码失败', err);
    }
    return err ? '{}' : ret;
  },

  /**
   * 将 JSON 字符串解码为数据
   *
   * @param raw - JSON 字符串
   * @returns 解码后的数据，解码失败返回 null
   */
  decode<T>(raw: string): T {
    const [ret, err] = mightSync(JSON.parse, null, raw);
    if (err) {
      Journal.Error('JSON 解码失败', err);
    }
    return err ? null : ret;
  },
};

export { JsonCipher };
