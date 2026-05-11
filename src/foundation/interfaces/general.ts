/* eslint-disable */

/** （任意入参的）构造函数类型 */
export interface Constructor<T> {
  new (...args: any[]): T;
}

/** （指定入参的）构造函数类型 */
export interface ConstructorPassIn<T, P extends unknown[]> {
  new (...args: P): T;
}

/** 异步操作函数类型 */
export interface AsyncOperation<P extends unknown[] = [], R = void> {
  (...args: P): Promise<R>;
}

/** 同步操作函数类型 */
export interface SyncOperation<P extends unknown[] = [], R = void> {
  (...args: P): R;
}

/** 字典键类型 */
export type Key = string | symbol;

/** 字典类型 */
export type Dict = Record<string | symbol, any>;

/** 构建指定长度的泛型元组 */
export type TypeTuple<T, N extends number> = Array<T> & { length: N };

/** 构建指定长度的泛型元组（可指定每个参数类型） */
export type AnyTuple<N extends number, R extends unknown[]> = [...R] & { length: N };

/** 随机区间类型 */
export enum Region {
  /** 左右全开 (min, max) */
  L0R0,
  /** 左开右闭 (min, max] */
  L0R1,
  /** 左闭右开 [min, max) */
  L1R0,
  /** 左右全闭 [min, max] */
  L1R1,
}
