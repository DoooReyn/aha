import { SyncOperation } from './interfaces/general';

/**
 * 安全的调用结果包装工具
 *
 * 提供同步和异步两种安全的调用结果包装方案。
 */

const AMBIENT = Object.create(null);
/**
 * 同步调用包装
 * @param process 方法
 * @param ambient 环境
 * @param args 入参
 * @returns
 */
function sync<P extends unknown[], T = unknown>(
  process: SyncOperation<P, T>,
  ambient?: unknown,
  ...args: P
): [T?, Error?] {
  try {
    const result = process.apply(ambient || AMBIENT, args);
    return [result, undefined];
  } catch (err) {
    return [undefined, err instanceof Error ? err : new Error(String(err))];
  }
}

/**
 * 异步调用包装
 * @param fn 异步方法
 * @returns
 */
async function async<T = unknown>(fn: Promise<T>): Promise<[T?, Error?]> {
  return fn.then((data) => [data, undefined] as [T, undefined]).catch((err) => [undefined, err] as [undefined, Error]);
}

/**
 * 安全的调用结果包装工具集合
 */
export { sync as mightSync, async as mightAsync };
