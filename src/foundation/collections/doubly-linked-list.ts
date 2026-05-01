/**
 * 泛型双向链表节点
 */
class ListNode<T> {
  /** 保存的值 */
  public value: T;
  /** 前驱节点，链表头部为 null */
  public prev: ListNode<T> | null = null;
  /** 后继节点，链表尾部为 null */
  public next: ListNode<T> | null = null;

  public constructor(value: T) {
    this.value = value;
  }
}

/**
 * 泛型双向链表
 *
 * 常用 API（时间复杂度已标注）：
 * - push(value)      : O(1)   在尾部追加
 * - unshift(value)   : O(1)   在头部插入
 * - pop()            : O(1)   移除并返回尾部节点
 * - shift()          : O(1)   移除并返回头部节点
 * - insertAfter(node, value) : O(1) 在指定节点后插入
 * - insertBefore(node, value): O(1) 在指定节点前插入
 * - remove(node)     : O(1)   删除任意节点
 * - find(cb)         : O(n)   查找第一个满足条件的节点
 * - forEach(cb)      : O(n)   遍历
 * - toArray()        : O(n)   转为普通数组
 */
class DoublyLinkedList<T> {
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

  /** 头节点（只读） */
  public get first(): ListNode<T> | null {
    return this._head;
  }

  /** 尾节点（只读） */
  public get last(): ListNode<T> | null {
    return this._tail;
  }

  /** 在尾部追加节点 */
  public push(value: T): this {
    const node = new ListNode(value);
    if (!this._tail) {
      // 空链表
      this._head = this._tail = node;
    } else {
      node.prev = this._tail;
      this._tail.next = node;
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
      this._head.prev = node;
      this._head = node;
    }
    this._size++;
    return this;
  }

  /** 移除并返回头节点的值 */
  public shift(): T | undefined {
    if (!this._head) return undefined;
    const value = this._head.value;
    if (this._head === this._tail) {
      // 只有一个节点
      this._head = this._tail = null;
    } else {
      this._head = this._head.next;
      if (this._head) this._head.prev = null;
    }
    this._size--;
    return value;
  }

  /** 移除并返回尾节点的值 */
  public pop(): T | undefined {
    if (!this._tail) return undefined;
    const value = this._tail.value;
    if (this._head === this._tail) {
      this._head = this._tail = null;
    } else {
      this._tail = this._tail.prev;
      if (this._tail) this._tail.next = null;
    }
    this._size--;
    return value;
  }

  /** 在指定节点后插入新节点，返回新节点 */
  public insertAfter(node: ListNode<T>, value: T): ListNode<T> {
    const newNode = new ListNode(value);
    newNode.prev = node;
    newNode.next = node.next;

    if (node.next) {
      node.next.prev = newNode;
    } else {
      // node 是尾节点
      this._tail = newNode;
    }
    node.next = newNode;
    this._size++;
    return newNode;
  }

  /** 在指定节点前插入新节点，返回新节点 */
  public insertBefore(node: ListNode<T>, value: T): ListNode<T> {
    const newNode = new ListNode(value);
    newNode.next = node;
    newNode.prev = node.prev;

    if (node.prev) {
      node.prev.next = newNode;
    } else {
      // node 是头节点
      this._head = newNode;
    }
    node.prev = newNode;
    this._size++;
    return newNode;
  }

  /** 删除任意节点，返回是否成功 */
  public remove(node: ListNode<T>): boolean {
    if (!node) return false;

    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // 删除的是头节点
      this._head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // 删除的是尾节点
      this._tail = node.prev;
    }

    this._size--;
    return true;
  }

  /** 根据回调函数查找第一个满足条件的节点 */
  public find(predicate: (value: T, index: number) => boolean): ListNode<T> | null {
    let cur = this._head;
    let idx = 0;
    while (cur) {
      if (predicate(cur.value, idx)) return cur;
      cur = cur.next;
      idx++;
    }
    return null;
  }

  /** 遍历所有节点 */
  public forEach(callback: (value: T, index: number) => void): void {
    let cur = this._head;
    let idx = 0;
    while (cur) {
      callback(cur.value, idx);
      cur = cur.next;
      idx++;
    }
  }

  /** 转换为普通数组（调试/展示用） */
  public toArray(): T[] {
    const arr: T[] = [];
    this.forEach((v) => arr.push(v));
    return arr;
  }

  /** 便于调试的字符串表示 */
  public toString(): string {
    return this.toArray().join(' <-> ');
  }
}

export { DoublyLinkedList };
