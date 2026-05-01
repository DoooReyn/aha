import { isObject } from './be';
import { Dict } from './interfaces/general';
import { random, randomInteger, randomOp } from './random';

/**
 * 列表工具
 *
 * 提供常用的数组操作函数
 */

/**
 * 向列表中添加唯一元素
 * @param arr 列表
 * @param item 元素
 * @param compare 比较方法
 */
function addUnique<T>(arr: T[], item: T, compare?: (a: T, b: T) => boolean): void {
  if (compare) {
    if (arr.findIndex((v) => compare(v, item)) > -1) {
      arr.push(item);
    }
  } else {
    if (arr.indexOf(item) === -1) {
      arr.push(item);
    }
  }
}

/**
 * 前进/后退 n 步
 * @param arr 数组
 * @param step 步数
 */
function advance(arr: unknown[], step: number): unknown[] {
  step = step | 0;
  if (step !== 0 && arr.length > 1) {
    if (step > 0) {
      arr.unshift(...arr.splice(arr.length - step, step));
    } else {
      arr.push(...arr.splice(0, step));
    }
  }
  return arr;
}

/**
 * 获得数组中的平均值
 * @param arr 数组
 * @returns 平均值
 */
function average(arr: number[]): number {
  return sum(arr) / arr.length;
}

/**
 * 数组元素反向移动
 * @param arr 数组
 */
function backward(arr: unknown[]): unknown[] {
  return advance(arr, -1);
}

/**
 * 删除所有元素
 * @param arr 数组
 * @param after 删除回调
 */
function clear(arr: unknown[], after?: (item: unknown) => unknown): void {
  if (after) {
    for (let i = arr.length - 1; i >= 0; i--) {
      after(arr[i]);
      arr.splice(i, 1);
    }
  } else {
    arr.length = 0;
  }
}

/**
 * 反向管道
 * @param fns 函数列表
 * @returns
 */
function compose<I, F extends (i: I) => I>(...fns: F[]): (i: I) => I {
  return (i: I) => fns.reduceRight((v, f) => f(v), i);
}

/**
 * 遍历
 * @param arr 列表
 * @param visit 列表项处理方法
 * @param reverse 倒叙遍历
 */
function each<ItemType>(
  arr: ItemType[],
  visit: (v: ItemType, i?: number, l?: ItemType[]) => void,
  reverse: boolean = false
): void {
  const len = arr.length;
  if (len == 0) return;
  if (reverse) {
    for (let i = len - 1; i >= 0; i--) visit(arr[i], i, arr);
  } else {
    for (let i = 0; i < len; i++) visit(arr[i], i, arr);
  }
}

/**
 * 数组扁平化
 * @param arrays 目标数组
 */
function flatten(arrays: unknown[]): unknown[] {
  // @ts-expect-error 类型判定
  return arrays.reduce((a, v) => (Array.isArray(v) ? a.concat(flatten(v)) : a.concat(v)), []);
}

/**
 * 数组元素正向移动
 * @param arr 数组
 */
function forward(arr: unknown[]): unknown[] {
  return advance(arr, 1);
}

/**
 * 频次统计
 * @param arr 目标数组
 * @returns
 */
function frequency(arr: (number | string)[]): Dict {
  return arr.reduce((a: Dict, v) => {
    a[v] = (a[v] || 0) + 1;
    return a;
  }, {});
}

/**
 * 根据给定字典的键值进行分组
 * @param arr 目标数组
 * @param key 键
 * @returns
 */
function groupBy(arr: Dict[], key: string): Dict {
  return arr.reduce((a, v) => {
    (a[v[key]] ||= []).push(v);
    return a;
  }, {});
}

/**
 * 保留最小的几个（从小到大排序）
 * @param arr 数组
 * @param count 保留数量
 * @param input 输入值
 */
function keepLeast(arr: number[], count: number, input: number): number[] {
  if (arr.length < count) {
    arr.push(input);
  } else {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] > input) {
        arr[i] = input;
        break;
      }
    }
  }
  return arr.sort((a, b) => a - b).slice(0, count);
}

/**
 * 获得数组中的最大值
 * @param arr 数组
 * @returns 最大值
 */
function max(arr: number[]): number {
  return arr.reduce((a, b) => Math.max(a, b), -Infinity);
}

/**
 * 合并数组
 * @param arrays 数组列表
 * @returns 合并后的数组
 */
function merge(...arrays: unknown[][]): unknown[] {
  return arrays.reduce((a, v) => a.concat(v), []);
}

/**
 * 获得数组中的最小值
 * @param arr 数组
 * @returns 最小值
 */
function min(arr: number[]): number {
  return arr.reduce((a, b) => Math.min(a, b), Infinity);
}

/**
 * 提取元素索引
 * @param arr 数组
 * @param target 目标元素
 * @param match 比较方法
 * @param sequence 是否按顺序输出（默认逆序）
 * @returns
 */
function pickIndices(
  arr: unknown[],
  target: unknown,
  match: (a: unknown, b: unknown) => boolean,
  sequence?: boolean
): number[] {
  const ret: number[] = [];
  arr.forEach((v, i) => {
    if (match(target, v)) {
      if (sequence) {
        ret.push(i);
      } else {
        ret.unshift(i);
      }
    }
  });
  return ret;
}

/**
 * 提取元素
 * @param arr 数组
 * @param target 目标元素
 * @param match 比较方法
 * @param sequence 是否按顺序输出（默认逆序）
 * @returns
 */
function pickValues(
  arr: unknown[],
  target: unknown,
  match: (a: unknown, b: unknown) => boolean,
  sequence?: boolean
): unknown[] {
  const ret: unknown[] = [];
  arr.forEach((v) => {
    if (match(target, v)) {
      if (sequence) {
        ret.push(v);
      } else {
        ret.unshift(v);
      }
    }
  });
  return ret;
}

/**
 * 管道
 * @param fns 函数列表
 * @returns
 */
function pipe<I, F extends (i: I) => I>(...fns: F[]): (i: I) => I {
  return (i: I) => fns.reduce((v, f) => f(v), i);
}

/**
 * 获得数组中的乘积
 * @param arr 数组
 * @returns 乘积
 */
function product(arr: number[]): number {
  return arr.reduce((a, b) => a * b, 1);
}

/**
 * 随机权重
 * @param arr 目标数组
 * @param weighted 权重计算函数
 * @param key 键
 * @returns
 */
function randomWeight<T>(arr: T[], weighted?: (t: T) => number, key?: string): T {
  // 默认权重函数
  weighted ??= (t: T) => (isObject(t) ? (t as Dict)[key] : 0);
  // 获取权重和
  let total = arr.reduce((a, b) => a + weighted(b), 0);
  const rate = random() * total;
  for (let i = 0; i < arr.length; i++) {
    total -= weighted(arr[i]);
    if (total <= rate) {
      return arr[i];
    }
  }
  // 保底
  return arr[arr.length - 1];
}

/**
 * 获得指定范围内的数值数组
 * @param start 起始数值
 * @param ended 终止数值
 * @param step 增进步幅
 * @returns
 */
function range(start: number, ended: number, step?: number): number[] {
  start = start | 0;
  ended = ended | 0;
  step = step | 0;
  const ret = [];
  if (step > 0) {
    [start, ended] = ended > start ? [start, ended] : [ended, start];
    for (let i = start; i <= ended; i += step) {
      ret.push(i);
    }
  } else if (step === 0) {
    ret.push(start, ended);
  } else {
    [start, ended] = ended > start ? [start, ended] : [ended, start];
    for (let i = ended; i >= start; i += step) {
      ret.push(i);
    }
  }
  return ret;
}

/**
 * 删除指定数量的元素
 * @param arr 数组
 * @param count 数量
 * @param after 删除回调
 */
function removeBatch(arr: unknown[], count: number, after?: (item: unknown) => unknown): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (--count < 0) {
      break;
    }
    after?.(arr[i]);
    arr.splice(i, 1);
  }
}

/**
 * 删除列表中的重复元素
 * @param arr 列表
 * @returns 去重后的列表
 */
function removeDuplicates(arr: unknown[]): unknown[] {
  return arr.filter((v, i, a) => a.indexOf(v) === i);
}

/**
 * 删除所有符合条件的元素
 * @param arr 列表
 * @param match 列表项处理方法
 * @param reverse 倒序遍历
 */
function removeIf<ItemType>(
  arr: ItemType[],
  match: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
  reverse?: boolean
): void {
  let l = arr.length;
  if (l == 0) return;
  reverse ??= false;
  if (reverse) {
    for (let i = l - 1; i >= 0; i--) if (match(arr[i], i, arr) === true) arr.splice(i, 1);
  } else {
    for (let i = 0; i < l; i++)
      if (match(arr[i], i, arr) === true) {
        arr.splice(i, 1);
        i--;
        l--;
      }
  }
}

/**
 * 删除指定索引范围内的所有元素
 * @param arr 数组
 * @param indices 索引数组
 * @param sorted 是否排序过（需要逆向排序）
 */
function removeIndices(arr: unknown[], indices: number[], sorted?: boolean): unknown[] {
  indices = sortIn(indices, sorted);
  indices.forEach((i) => {
    arr.splice(i, 1);
  });
  return arr;
}

/**
 * 删除所有指定值的元素
 * @param arr 数组
 * @param val 目标值
 * @param reverse 是否逆向删除（默认正向）
 */
function removeOne(arr: unknown[], val: unknown, reverse: boolean): void {
  const index = reverse ? arr.lastIndexOf(val) : arr.indexOf(val);
  if (index > -1) {
    arr.splice(index, 1);
  }
}

/**
 * 随机打乱列表元素顺序(实现1)
 * @param arr 要打乱的列表
 * @returns 打乱后的列表
 */
function shuffle1(arr: unknown[]): unknown[] {
  let pid = -1;
  const { length } = arr;
  while (++pid < length) {
    const nid = randomInteger(pid, length);
    [arr[nid], arr[pid]] = [arr[pid], arr[nid]];
  }
  return arr;
}

/**
 * 随机打乱列表元素顺序(实现2)
 * @param arr 要打乱的列表
 * @returns 打乱后的列表
 */
function shuffle2(arr: unknown[]): unknown[] {
  return arr.sort(() => randomOp());
}

/**
 * 数值数组排序
 * @param arr 数值数组
 * @param sequence 是否按顺序输出（默认正序：从小到大）
 * @returns 排序后的数组
 */
function sortIn(arr: number[], sequence?: boolean): number[] {
  return arr.sort((a, b) => (sequence ? a - b : b - a));
}

/**
 * 根据字段对数组排序
 * @param arr 数值数组
 * @param field 字段
 * @param sequence 是否按顺序输出（默认正序：从小到大）
 * @warn 必要条件：元素必须是字典，字段必须存在，字段类型为 number
 * @returns 排序后的数组
 */
function sortBy(arr: Dict[], field: string, sequence?: boolean) {
  return arr.sort((a, b) => (sequence ? a[field] - b[field] : b[field] - a[field]));
}

/**
 * 将列表拆分成多个子列表，每个子列表的最大元素数量为 maxGroupSize
 * @param arr 列表
 * @param maxGroupSize 每个子列表的最大元素数量
 * @returns 拆分后的子列表数组
 */
function split<T>(arr: T[], maxGroupSize?: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += maxGroupSize) {
    result.push(arr.slice(i, i + maxGroupSize));
  }
  return result;
}

/**
 * 获得数组中的总和
 * @param arr 数组
 * @returns 总和
 */
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

/**
 * 交换数组中的两个元素
 * @param arr 数组
 * @param pid 索引 1
 * @param nid 索引 2
 */
function swap(arr: unknown[], pid: number, nid: number): unknown[] {
  [arr[nid], arr[pid]] = [arr[pid], arr[nid]];
  return arr;
}

/**
 * 遍历，符合条件时打断
 * @param arr 列表
 * @param visit 列表项处理方法
 * @param reverse 倒序遍历
 */
function until<ItemType>(
  arr: ItemType[],
  visit: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
  reverse: boolean = false
): void {
  const len = arr.length;
  if (len == 0) return;
  if (reverse) {
    for (let i = len - 1; i >= 0; i--) if (visit(arr[i], i, arr) === true) break;
  } else {
    for (let i = 0; i < len; i++) if (visit(arr[i], i, arr) === true) break;
  }
}

/**
 * 数组压缩
 * @param arrays 数组列表
 * @returns 压缩后的数组
 */
function zip(...arrays: unknown[][]): unknown[] {
  return [...Array(arrays[0].length)].map((_: unknown, i: number) => {
    return arrays.map((array) => array[i]);
  });
}

/**
 * 列表工具集合
 */
export {
  addUnique,
  advance,
  average,
  backward,
  clear,
  compose,
  each,
  flatten,
  forward,
  frequency,
  groupBy,
  keepLeast,
  max,
  merge,
  min,
  pickIndices,
  pickValues,
  pipe,
  product,
  randomWeight,
  range,
  removeBatch,
  removeDuplicates,
  removeIf,
  removeIndices,
  removeOne,
  shuffle1,
  shuffle2,
  sortIn,
  sortBy,
  split,
  sum,
  swap,
  until,
  zip,
};
