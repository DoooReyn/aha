/**
 * LRU (Least Recently Used) 缓存
 *
 * 最近最少使用淘汰策略的缓存实现
 */

/**
 * LRU 缓存节点
 */
interface INode<K, V> {
  key: K;
  value: V;
  prev: INode<K, V> | null;
  next: INode<K, V> | null;
}

/**
 * LRU 缓存类
 */
class LRUCache<K, V> {
  /** 容量 */
  private _capacity: number;
  /** 存储 Map */
  private _cache: Map<K, INode<K, V>>;
  /** 头节点（最近使用） */
  private _head: INode<K, V> | null;
  /** 尾节点（最久未使用） */
  private _tail: INode<K, V> | null;

  public constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('LRU capacity must be greater than 0');
    }
    this._capacity = capacity;
    this._cache = new Map();
    this._head = null;
    this._tail = null;
  }

  /**
   * 获取缓存值
   */
  public get(key: K): V | null {
    const node = this._cache.get(key);
    if (!node) {
      return null;
    }

    // 移动到头部（标记为最近使用）
    this._moveToHead(node);
    return node.value;
  }

  /**
   * 设置缓存值
   */
  public set(key: K, value: V): void {
    const existing = this._cache.get(key);

    if (existing) {
      // 更新现有节点
      existing.value = value;
      this._moveToHead(existing);
      return;
    }

    // 创建新节点
    const node: INode<K, V> = {
      key,
      value,
      prev: null,
      next: null,
    };

    // 添加到缓存
    this._cache.set(key, node);
    this._addToHead(node);

    // 检查容量，淘汰最久未使用的节点
    if (this._cache.size > this._capacity) {
      this._removeTail();
    }
  }

  /**
   * 检查是否包含键
   */
  public has(key: K): boolean {
    return this._cache.has(key);
  }

  /**
   * 删除缓存值
   */
  public delete(key: K): boolean {
    const node = this._cache.get(key);
    if (!node) {
      return false;
    }

    this._cache.delete(key);
    this._removeNode(node);
    return true;
  }

  /**
   * 清空缓存
   */
  public clear(): void {
    this._cache.clear();
    this._head = null;
    this._tail = null;
  }

  /**
   * 获取缓存大小
   */
  public get size(): number {
    return this._cache.size;
  }

  /**
   * 获取缓存容量
   */
  public get capacity(): number {
    return this._capacity;
  }

  /**
   * 添加节点到头部
   */
  private _addToHead(node: INode<K, V>): void {
    node.prev = null;
    node.next = this._head;

    if (this._head) {
      this._head.prev = node;
    }

    this._head = node;

    if (!this._tail) {
      this._tail = node;
    }
  }

  /**
   * 移动节点到头部
   */
  private _moveToHead(node: INode<K, V>): void {
    // 先移除节点
    this._removeNode(node);

    // 添加到头部
    this._addToHead(node);
  }

  /**
   * 移除节点
   */
  private _removeNode(node: INode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this._head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this._tail = node.prev;
    }
  }

  /**
   * 移除尾部节点（最久未使用）
   */
  private _removeTail(): void {
    if (!this._tail) {
      return;
    }

    this._cache.delete(this._tail.key);
    this._removeNode(this._tail);
  }

  /**
   * 获取所有键
   */
  public keys(): K[] {
    return Array.from(this._cache.keys());
  }

  /**
   * 获取所有值
   */
  public values(): V[] {
    const result: V[] = [];
    let node = this._head;
    while (node) {
      result.push(node.value);
      node = node.next;
    }
    return result;
  }

  /**
   * 遍历缓存
   */
  public forEach(callback: (value: V, key: K) => void): void {
    let node = this._head;
    while (node) {
      callback(node.value, node.key);
      node = node.next;
    }
  }
}

export { LRUCache };
