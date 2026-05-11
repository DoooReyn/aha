/** Base64 字符表 */
const BASE64_TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base64 字符表索引映射 */
const BASE64_TABLE_INDEX: Record<string, number> = (() => {
  const table: Record<string, number> = {};
  for (let i = 0; i < 64; i++) {
    table[BASE64_TABLE.charAt(i)] = i;
  }
  return table;
})();

/**
 * Base64 编解码器
 *
 * 将数据转换为 Base64 编码的字符串，常用于二进制数据的安全传输。
 * 完整实现，不依赖 atob/btoa，确保跨平台兼容性。
 *
 * @example
 * ```typescript
 * const base64 = Base64Cipher.encode('Hello, 世界!');
 * const text = Base64Cipher.decode(base64);
 * ```
 */
const Base64Cipher = {
  /**
   * 将字符串编码为 Base64
   *
   * @param data - 原始字符串
   * @returns Base64 编码后的字符串
   */
  encode(data: string): string {
    const input = stringToUtf8ByteArray(data);
    const output: string[] = [];

    for (let i = 0; i < input.length; i += 3) {
      const byte1 = input[i];
      const byte2 = i + 1 < input.length ? input[i + 1] : 0;
      const byte3 = i + 2 < input.length ? input[i + 2] : 0;

      const triple = (byte1 << 16) | (byte2 << 8) | byte3;

      output.push(BASE64_TABLE.charAt(triple >> 18));
      output.push(BASE64_TABLE.charAt((triple >> 12) & 63));
      output.push(i + 1 < input.length ? BASE64_TABLE.charAt((triple >> 6) & 63) : '=');
      output.push(i + 2 < input.length ? BASE64_TABLE.charAt(triple & 63) : '=');
    }

    return output.join('');
  },

  /**
   * 将 Base64 字符串解码
   *
   * @param raw - Base64 编码的字符串
   * @returns 解码后的原始字符串
   * @throws 解码失败时抛出错误
   */
  decode(raw: string): string {
    const input = raw.replace(/[^A-Za-z0-9+/=]/g, '');
    const output: number[] = [];

    for (let i = 0; i < input.length; i += 4) {
      const enc1 = BASE64_TABLE_INDEX[input.charAt(i)];
      const enc2 = BASE64_TABLE_INDEX[input.charAt(i + 1)];
      const enc3 = BASE64_TABLE_INDEX[input.charAt(i + 2)];
      const enc4 = BASE64_TABLE_INDEX[input.charAt(i + 3)];

      if (enc1 === undefined || enc2 === undefined) {
        throw new Error('Base64 解码失败：非法字符');
      }

      const triple = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;

      output.push((triple >> 16) & 0xff);
      if (enc3 !== undefined) {
        output.push((triple >> 8) & 0xff);
      }
      if (enc4 !== undefined) {
        output.push(triple & 0xff);
      }
    }

    return utf8ByteArrayToString(output);
  },
};

/**
 * 将字符串转换为 UTF-8 字节数组
 */
function stringToUtf8ByteArray(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6));
      bytes.push(0x80 | (charCode & 0x3f));
    } else {
      bytes.push(0xe0 | (charCode >> 12));
      bytes.push(0x80 | ((charCode >> 6) & 0x3f));
      bytes.push(0x80 | (charCode & 0x3f));
    }
  }
  return bytes;
}

/**
 * 将 UTF-8 字节数组转换为字符串
 */
function utf8ByteArrayToString(bytes: number[]): string {
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte1 = bytes[i];
    if (byte1 < 0x80) {
      str += String.fromCharCode(byte1);
    } else if (byte1 < 0xc0) {
      throw new Error('Base64 解码失败：非法 UTF-8 编码');
    } else if (byte1 < 0xe0) {
      const byte2 = bytes[++i];
      str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
    } else {
      const byte2 = bytes[++i];
      const byte3 = bytes[++i];
      str += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
    }
  }
  return str;
}

export { Base64Cipher };
