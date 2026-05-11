/**
 * 泛型队列
 *
 * 采用环形缓冲区（环形数组）实现，能够在 O(1) 时间完成 enqueue / dequeue。
 */
class Queue<T> {
  private _buffer: (T | undefined)[] = [];
  private _head = 0; // 指向队首
  private _tail = 0; // 指向队尾（下一个写入位置）
  private _size = 0;

  /** 队列当前大小 */
  public get size(): number {
    return this._size;
  }

  /** 是否为空 */
  public get isEmpty(): boolean {
    return this._size === 0;
  }

  /** 入队 */
  public enqueue(item: T): void {
    if (this._size === this._buffer.length) {
      // 扩容：把环形数组展开成普通数组再继续使用
      const newCap = this._buffer.length === 0 ? 4 : this._buffer.length * 2;
      const newBuf: (T | undefined)[] = new Array(newCap);
      for (let i = 0; i < this._size; i++) {
        newBuf[i] = this._buffer[(this._head + i) % this._buffer.length];
      }
      this._buffer = newBuf;
      this._head = 0;
      this._tail = this._size;
    }
    this._buffer[this._tail] = item;
    this._tail = (this._tail + 1) % this._buffer.length;
    this._size++;
  }

  /** 出队，返回队首元素 */
  public dequeue(): T | undefined {
    if (this.isEmpty) return undefined;
    const item = this._buffer[this._head];
    this._buffer[this._head] = undefined; // 释放引用
    this._head = (this._head + 1) % this._buffer.length;
    this._size--;
    return item;
  }

  /** 查看队首元素但不移除 */
  public peek(): T | undefined {
    return this.isEmpty ? undefined : this._buffer[this._head];
  }

  /** 清空队列 */
  public clear(): void {
    this._buffer = [];
    this._head = this._tail = this._size = 0;
  }

  /** 以数组形式返回所有元素（从队首到队尾） */
  public toArray(): T[] {
    const arr: T[] = [];
    for (let i = 0; i < this._size; i++) {
      arr.push(this._buffer[(this._head + i) % this._buffer.length] as T);
    }
    return arr;
  }

  /** 迭代器，支持 for…of */
  public *[Symbol.iterator](): IterableIterator<T> {
    for (let i = 0; i < this._size; i++) {
      yield this._buffer[(this._head + i) % this._buffer.length] as T;
    }
  }
}

export { Queue };
