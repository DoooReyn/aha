/**
 * 配置中心（Tabular）契约
 *
 * 配置中心数据管理系统的接口定义
 */

import { IAbility, IMod } from './mod';
import { IResCacheAbility } from './res-cache';
import { IResDynamicAbility } from './res-dynamic';

/**
 * KV 类型的值类型
 */
export type KVValue = string | number | boolean;

/**
 * KV 对象类型
 */
export type KVObject = Record<string, KVValue>;

/**
 * KV 对象数组类型
 */
export type KVObjectArray = KVObject[];

/**
 * 自定义类型解析器
 */
export type CustomParser<T> = (value: string) => T;

/**
 * 聚合操作类型
 */
export type AggregateOp = 'sum' | 'avg' | 'min' | 'max' | 'count';

/**
 * 字段类型
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'kv'
  | 'kv:string'
  | 'kv:number'
  | 'kv:boolean'
  | 'custom'
  | 'string[]'
  | 'number[]'
  | 'boolean[]'
  | 'kv[]'
  | 'custom[]';

/**
 * 配置中心结构定义
 */
export interface IConfigTableSchema<T extends Record<string, unknown>> {
  /** 表标识 */
  readonly key: string;
  /** 主键字段名（必须是 string 类型） */
  readonly primaryKey: keyof T & string;
  /** 二进制文件 URI */
  readonly uri: string;
  /** 字段类型映射 */
  readonly types: Record<keyof T, FieldType>;
  /** 自定义类型解析器 */
  readonly customParsers?: Record<string, CustomParser<unknown>>;
  /** 默认值 */
  readonly defaults?: Partial<T>;
  /** LRU 缓存大小（0 表示不缓存） */
  readonly cacheSize: number;
}

/**
 * 配置中心解析器接口
 */
export interface IConfigTableParser<T extends Record<string, unknown>> {
  /**
   * 解析三段式 CSV 字符串
   * @param csv CSV 字符串
   * @param types 字段类型映射
   * @param customParsers 自定义解析器
   */
  parse(csv: string, types: Record<keyof T, FieldType>, customParsers?: Record<string, CustomParser<unknown>>): T[];

  /**
   * 验证数据完整性
   * @param data 数据数组
   * @param types 字段类型映射
   */
  validate(data: T[], types: Record<keyof T, FieldType>): boolean;

  /**
   * 填充默认值
   * @param data 数据数组
   * @param defaults 默认值
   */
  fillDefaults(data: T[], defaults: Partial<T>): T[];
}

/**
 * 配置中心查询接口
 */
export interface IConfigTableQuery<T extends Record<string, unknown>> {
  /**
   * 根据主键查询单条记录
   * @param id 主键值
   */
  findByPrimaryKey(id: string): T | null;

  /**
   * 根据字段值查询记录列表
   * @param field 字段名
   * @param value 字段值
   */
  findByField<K extends keyof T>(field: K, value: T[K]): T[];

  /**
   * 根据条件函数查询记录列表
   * @param condition 条件函数
   */
  findWhere(condition: (item: T) => boolean): T[];

  /**
   * 获取所有记录
   */
  getAll(): T[];

  /**
   * 按字段分组
   * @param field 字段名
   */
  groupBy<K extends keyof T>(field: K): Record<string, T[]>;

  /**
   * 聚合查询
   * @param field 字段名
   * @param op 聚合操作
   */
  aggregate<K extends keyof T>(field: K, op: AggregateOp): number;

  /**
   * 排序
   * @param field 字段名
   * @param order 排序方向
   */
  sortBy<K extends keyof T>(field: K, order?: 'asc' | 'desc'): T[];

  /**
   * 获取记录数量
   */
  count(): number;

  /**
   * 检查主键是否存在
   * @param id 主键值
   */
  has(id: string): boolean;

  /**
   * 清空查询缓存
   */
  clearCache(): void;
}

/**
 * 配置中心能力接口
 */
export interface ITabularAbility extends IAbility {
  /**
   * 注册配置中心
   * @param schema 表结构定义
   */
  registerTable<T extends Record<string, unknown>>(schema: IConfigTableSchema<T>): void;

  /**
   * 加载配置中心数据
   * @param key 表标识
   */
  loadTable<T extends Record<string, unknown>>(key: string): Promise<void>;

  /**
   * 获取配置中心查询接口
   * @param key 表标识
   */
  getQuery<T extends Record<string, unknown>>(key: string): IConfigTableQuery<T>;

  /**
   * 检查表是否已注册
   * @param key 表标识
   */
  hasTable(key: string): boolean;

  /**
   * 检查表是否已加载
   * @param key 表标识
   */
  isTableLoaded(key: string): boolean;

  /**
   * 卸载配置中心
   * @param key 表标识
   */
  unloadTable(key: string): void;

  /**
   * 清空所有表和缓存
   */
  clear(): void;

  /**
   * 获取已注册的表列表
   */
  getTableKeys(): string[];

  /**
   * 获取表的统计信息
   * @param key 表标识
   */
  getTableStats(key: string): { loaded: boolean; count: number } | null;
}

/**
 * 配置中心配置
 */
export interface ITabularConfig {
  /** 默认 LRU 缓存大小 */
  readonly defaultCacheSize?: number;
  /** 是否启用调试日志 */
  readonly debug?: boolean;
}

/**
 * 配置中心接口
 */
export interface ITabular extends IMod {
  get ability(): ITabularAbility;
  dependencies: { resCache: IResCacheAbility; resDynamic: IResDynamicAbility };
}
