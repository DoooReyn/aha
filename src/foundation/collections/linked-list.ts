/**
 * 泛型单向链表节点
 */
class ListNode<T> {
  /** 节点保存的值 */
  public value: T;
  /** 指向下一个节点，末尾为 null */
  public next: ListNode<T> | null = null;

  public constructor(value: T) {
    this.value = value;
  }
}

/**
 * 泛型链表
 *
 * 主要方法：
 * - push(value)      : 在链表尾部追加节点
 * - pop()            : 移除并返回最后一个节点的值（O(n)）
 * - shift()          : 移除并返回头节点的值（O(1)）
 * - unshift(value)   : 在链表头部插入节点（O(1)）
 * - find(cb)         : 根据回调函数查找第一个满足条件的节点
 * - remove(cb)       : 删除第一个满足条件的节点
 * - forEach(cb)      : 遍历所有节点
 * - toArray()        : 转换为普通数组
 * - size / isEmpty   : 获取长度或判断是否为空
 */
class LinkedList<T> {
  private _head: ListNode<T> | null = null;
  private _tail: ListNode<T> | null = null;
  private _size = 0;

  /** 链表当前长度 */
  public get size(): number {
    return this._size;
  }

  /** 链表是否为空 */
  public get isEmpty(): boolean {
    return this._size === 0;
  }

  /** 在尾部追加节点 */
  public push(value: T): this {
    const node = new ListNode(value);
    if (!this._head) {
      this._head = this._tail = node;
    } else {
      (this._tail as ListNode<T>).next = node;
      this._tail = node;
    }
    this._size++;
    return this;
  }

  /** 在头部插入节点 */
  public unshift(value: T): this {
    const node = new ListNode(value);
    if (!this._head) {
      this._head = this._tail = node;
    } else {
      node.next = this._head;
      this._head = node;
    }
    this._size++;
    return this;
  }

  /** 移除并返回头节点的值 */
  public shift(): T | undefined {
    if (!this._head) return undefined;
    const value = this._head.value;
    this._head = this._head.next;
    if (!this._head) this._tail = null; // 链表变空
    this._size--;
    return value;
  }

  /** 移除并返回尾节点的值（需要遍历） */
  public pop(): T | undefined {
    if (!this._head) return undefined;
    if (this._head === this._tail) {
      // 只有一个节点
      const value = this._head.value;
      this._head = this._tail = null;
      this._size = 0;
      return value;
    }
    // 找到倒数第二个节点
    let prev = this._head;
    while (prev.next && prev.next !== this._tail) {
      prev = prev.next;
    }
    const value = (this._tail as ListNode<T>).value;
    prev.next = null;
    this._tail = prev;
    this._size--;
    return value;
  }

  /** 根据回调函数查找第一个满足条件的节点 */
  public find(predicate: (value: T, index: number) => boolean): ListNode<T> | null {
    let current = this._head;
    let idx = 0;
    while (current) {
      if (predicate(current.value, idx)) return current;
      current = current.next;
      idx++;
    }
    return null;
  }

  /** 删除第一个满足条件的节点，返回是否成功 */
  public remove(predicate: (value: T, index: number) => boolean): boolean {
    if (!this._head) return false;

    // 删除头节点
    if (predicate(this._head.value, 0)) {
      this.shift();
      return true;
    }

    let prev = this._head;
    let current = this._head.next;
    let idx = 1;
    while (current) {
      if (predicate(current.value, idx)) {
        prev.next = current.next;
        if (current === this._tail) this._tail = prev;
        this._size--;
        return true;
      }
      prev = current;
      current = current.next;
      idx++;
    }
    return false;
  }

  /** 遍历所有节点 */
  public forEach(callback: (value: T, index: number) => void): void {
    let current = this._head;
    let idx = 0;
    while (current) {
      callback(current.value, idx);
      current = current.next;
      idx++;
    }
  }

  /** 转换为普通数组 */
  public toArray(): T[] {
    const arr: T[] = [];
    this.forEach((v) => arr.push(v));
    return arr;
  }

  /** 返回链表的字符串表示（调试用） */
  public toString(): string {
    return this.toArray().join(' -> ');
  }
}

export { LinkedList };
