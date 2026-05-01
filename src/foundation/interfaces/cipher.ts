/**
 * 编解码器接口
 *
 * 定义数据的编码和解码方式。
 */
export interface ICipher<Raw = unknown, Enc = unknown> {
  /** 编码 */
  encode(raw: Raw): Enc;
  /** 解码 */
  decode(enc: Enc): Raw;
}
