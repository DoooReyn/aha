import { Asset } from 'cc';

import { Constructor } from '../../foundation';
import { IChronosAbility } from './chronos';
import { IAbility, IMod } from './mod';

/**
 * 资产状态
 */
export enum CargoState {
  /** 未加载 */
  Idle,
  /** 加载中 */
  Loading,
  /** 已加载 */
  Loaded,
  /** 加载失败 */
  Error,
}

/**
 * 资源存活时间分级
 */
export enum CargoTTL {
  /** 极短 */
  Soon = 0,
  /** 短 */
  Short = 5,
  /** 中 */
  Medium = 15,
  /** 长 */
  Long = 30,
  /** 极长 */
  Extreme = 60,
}

/**
 * 资产
 *
 * 【资产标识】
 * - 动态资产: `${bundleName}@${assetPath}`
 * - 远程资产: `remote@${url}`
 */
export interface ICargo<A extends Asset = Asset> {
  /** 资产标识 */
  uri: string;
  /** 加载状态 */
  state: CargoState;
  /** 资产 */
  asset: A | null;
  /** 可能的加载 Promise，用于防止并发重复请求 */
  promise?: Promise<A>;
  /** 引用计数 */
  ref: number;
  /** 最后一次被引用的时间（毫秒） */
  lastUsed: number;
  /** 存活时间（秒） */
  ttl: number;
}

/**
 * 资源缓存中心能力
 */
export interface IResCacheAbility extends IAbility {
  /**
   * 构建直接依赖
   * @param uri 资产标识
   * @param depends 依赖的资产标识
   */
  buildDepends(uri: string, depends: string[]): void;
  /**
   * 申请仓位
   * @param uri 资产标识
   * @param ttl 存活时间
   */
  request<A extends Asset>(uri: string, ttl?: number): ICargo<A>;
  /**
   * 存入
   * @param uri 资产标识
   * @param asset 资产
   */
  deposit<A extends Asset>(uri: string, asset: A): void;
  /**
   * 直接存入，自动申请仓位
   * @param uri 资产标识
   * @param asset 资产
   * @param ttl 存活时间
   */
  depositDirectly<A extends Asset>(uri: string, asset: A, ttl: number): void;
  /**
   * 丢弃
   *
   * 如果引用计数不为0，丢弃可能会由隐患，因此不建议直接调用
   * @warn 谨慎使用
   * @param uri 资产标识
   */
  discard(uri: string): void;
  /**
   * 立即清理一次
   */
  cleanup(): void;
  /**
   * 强制清空
   * @warn 谨慎使用
   */
  clear(): void;
  /**
   * 查询
   * @param uri 资产标识
   */
  has(uri: string): boolean;
  /**
   * 获取
   * @param uri 资产标识
   */
  get<A extends Asset>(uri: string): ICargo<A>;
  /**
   * 获取缓存的资产标识
   * @param uri 原始资产标识
   * @param type 资产类型
   */
  getUriOf(uri: string, type: Constructor<Asset>): string;
  /**
   * 借出
   * @param uriOrAsset 资产标识
   */
  borrow<A extends Asset>(uriOrAsset: string | A): A;
  /**
   * 归还
   * @param uriOrAsset 资产标识
   */
  return<A extends Asset>(uriOrAsset: string | A): void;
  /** 仓位 */
  get size(): number;
}

/**
 * 资源缓存中心
 *
 * - 负责资产的临时存储和过期管理
 * - 在编辑器中引用的动态资产不可用于动态加载
 */
export interface IResCache extends IMod {
  get ability(): IResCacheAbility;
  dependencies: { chronos: IChronosAbility };
}

/**
 * 资源缓存中心配置
 */
export interface IResCacheConfig {
  /** 巡检周期（秒） */
  inspectPeriod: number;
  /** 默认存活时间（秒） */
  defaultTTL: number;
}
