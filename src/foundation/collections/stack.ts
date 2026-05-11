/**
 * 泛型栈
 *
 * 采用数组作为底层存储，所有操作均为 O(1)。
 */
class Stack<T> {
  /** 内部数组 */
  private _items: T[] = [];

  /** 栈的当前大小 */
  public get size(): number {
    return this._items.length;
  }

  /** 是否为空 */
  public get isEmpty(): boolean {
    return this._items.length === 0;
  }

  /** 读取栈顶元素但不移除 */
  public peek(): T | undefined {
    return this._items[this._items.length - 1];
  }

  /** 入栈 */
  public push(item: T): void {
    this._items.push(item);
  }

  /** 出栈，返回栈顶元素 */
  public pop(): T | undefined {
    return this._items.pop();
  }

  /** 清空栈 */
  public clear(): void {
    this._items.length = 0;
  }

  /** 以数组形式返回所有元素（从栈底到栈顶） */
  public toArray(): T[] {
    return [...this._items];
  }

  /** 迭代器，支持 for…of */
  public *[Symbol.iterator](): IterableIterator<T> {
    // 从栈顶向下遍历
    for (let i = this._items.length - 1; i >= 0; i--) {
      yield this._items[i];
    }
  }
}

export { Stack };
