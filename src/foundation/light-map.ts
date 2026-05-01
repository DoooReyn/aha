import { clear } from './dict';

/**
 * 轻量级键值对映射容器
 *
 * 适用于处理极小规模的数据
 */
class LightMap<V = unknown> {
  /** 键值对容器 */
  private readonly _pairs: Record<string, V>;

  /** 数据量 */
  private _size: number;

  /**
   * 键值对构造
   * @param pairs 原始键值对
   */
  public constructor(pairs?: Record<string, V>) {
    if (!pairs) {
      this._size = 0;
      this._pairs = Object.create(null);
    } else {
      this._size = Object.keys(pairs).length;
      this._pairs = Object.assign(Object.create(null), pairs);
    }
  }

  /**
   * 查询键值对
   * @param k 键
   * @returns 是否存在键值对
   */
  public has(k: string): boolean {
    return Object.prototype.hasOwnProperty.call(this._pairs, k);
  }

  /**
   * 获取键值对的值
   * @param k 键
   * @returns 键值对的值
   */
  public get(k: string): V | undefined {
    return this._pairs[k] as V | undefined;
  }

  /**
   * 设置键值对
   * @param k 键
   * @param v 值
   * @returns 操作成功与否
   */
  public set(k: string, v: V) {
    if (!this.has(k)) {
      this._size++;
    }
    this._pairs[k] = v;
  }

  /**
   * 更新键值对
   * @param k 键
   * @param v 值
   * @returns 操作成功与否
   */
  public update(k: string, v: V) {
    if (this.has(k)) {
      this._pairs[k] = v;
    }
  }

  /**
   * 移除键值对
   * @param k 键
   * @returns 操作成功与否
   */
  public remove(k: string) {
    if (delete this._pairs[k]) {
      this._size--;
      return true;
    }
    return false;
  }

  /**
   * 清空键值对
   */
  public clear() {
    clear(this._pairs);
    this._size = 0;
  }

  /**
   * 键值对个数
   */
  public get size() {
    return this._size;
  }

  /**
   * 遍历键值对
   * @param visit 访问方法
   */
  public each(visit: (v: V, k: string) => void) {
    Object.keys(this._pairs).forEach((k) => visit(this._pairs[k], k));
  }
}

export { LightMap };
