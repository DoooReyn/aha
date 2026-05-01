import { Dict, Key } from './interfaces/general';

/**
 * 字典工具
 *
 * 提供常用的字典操作函数，如冻结属性、深冻结、清空、检查是否为空、映射值、提取键值对、排除键值对、浅拷贝、深拷贝、合并和覆盖等
 */

/** 冻结属性（不能修改，不能删除） */
function setPropertyFrozen<T extends Record<PropertyKey, unknown>>(o: T, p: PropertyKey, v?: unknown) {
  v ??= o[p];
  Object.defineProperty(o, p, {
    value: v,
    writable: false,
    configurable: false,
    enumerable: true,
  });
}

/** 冻结属性（可以修改，不能删除） */
function setPropertyLightFrozen<T extends Record<PropertyKey, unknown>>(o: T, p: PropertyKey, v?: unknown) {
  v ??= o[p];
  Object.defineProperty(o, p, {
    value: v,
    writable: true,
    configurable: false,
    enumerable: true,
  });
}

/** 深冻结字典（防止修改） */
function deepFreeze<T extends Dict>(obj: T): T {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = obj[prop];
    if (value && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value as Dict);
    }
  });
  return obj;
}

/** 清空字典 */
function clear(d: Dict) {
  for (const key in d) {
    if (Object.prototype.hasOwnProperty.call(d, key)) {
      delete d[key];
    }
  }
}

/** 检查字典是否为空 */
function isEmpty(d: Dict) {
  return Object.keys(d).length === 0;
}

/** 映射字典值 */
function map(d: Dict, mapping: (k: Key, v: unknown) => unknown) {
  return Object.keys(d).reduce((acc, key) => {
    acc[key] = mapping(key, d[key]);
    return acc;
  }, {} as Dict);
}

/** 从字典中提取指定键值对 */
function pick<K extends Key[]>(d: Dict, keys: K): Pick<Dict, K[number]> {
  return keys.reduce((acc, key) => {
    if (d[key] != undefined) acc[key] = d[key];
    return acc;
  }, {} as Dict) as Pick<Dict, K[number]>;
}

/** 从字典中排除指定键值对 */
function omit<K extends Key[]>(d: Dict, list: K, override: boolean = false): Omit<Dict, K[number]> {
  if (override) {
    list.forEach((key) => Object.prototype.hasOwnProperty.call(d, key) && delete d[key]);
    return d as Omit<Dict, K[number]>;
  }
  return Object.keys(d).reduce((acc, key) => {
    if (list.indexOf(key) === -1) {
      acc[key] = d[key];
    }
    return acc;
  }, {} as Dict) as Omit<Dict, K[number]>;
}

/** 浅拷贝 */
function lightCopy(d: Dict) {
  return { ...d };
}

/** 深拷贝（递归复制嵌套对象，支持数组和对象，不支持循环引用） */
function deepCopy(d: Dict) {
  if (typeof d !== 'object' || d === null || d === undefined) {
    return d;
  }
  return Object.keys(d).reduce((acc, key) => {
    if (Array.isArray(d[key])) {
      acc[key] = d[key].map((item) => deepCopy(item));
    } else {
      acc[key] = deepCopy(d[key] as Dict);
    }
    return acc;
  }, {} as Dict);
}

/** 合并字典（覆盖目标字典中的相同键） */
function merge(dst: Dict, src: Dict) {
  for (const key in src) {
    dst[key] = src[key];
  }
  return dst;
}

/** 覆盖字典（仅覆盖目标字典中不存在的键） */
function override(dst: Dict, src: Dict) {
  for (const key in src) {
    if (dst[key] == undefined) {
      dst[key] = src[key];
    }
  }
  return dst;
}

/** 遍历 */
function each<D extends Dict>(d: D, visit: (k: keyof D, v: D[keyof D]) => void) {
  Object.keys(d).forEach((k) => visit(k, d[k]));
}

function handle<D extends Dict, T = unknown>(d: D, handle: (k: keyof D, v: D[keyof D]) => T) {
  return Object.keys(d).map((k) => handle(k, d[k]));
}

/**
 * 字典工具集合
 */
export {
  setPropertyFrozen,
  setPropertyLightFrozen,
  deepFreeze,
  clear,
  isEmpty,
  map,
  pick,
  omit,
  lightCopy,
  deepCopy,
  merge,
  override,
  each,
  handle,
};
