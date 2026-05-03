import { Asset } from 'cc';

import { Constructor, SyncOperation } from '../../foundation/interfaces/general';
import { IAbility, IMod } from './mod';
import { IResCacheAbility } from './res-cache';

/**
 * 动态资源加载器能力接口
 */
export interface IResDynamicAbility extends IAbility {
  /**
   * 预加载
   * @param uri 资产标识
   * @param type 资产类型
   * @param hook 回调
   */
  preload<A extends Asset>(uri: string, type: Constructor<A>, hook?: SyncOperation): Promise<void>;
  /**
   * 批量预加载
   * @param items <资产标识,资产类型>数组
   * @param hook 回调
   */
  preloadBatch(items: [uri: string, type: Constructor<Asset>][], hook?: SyncOperation): Promise<void[]>;
  /**
   * 预加载目录
   * @param uri 资产标识
   * @param type 资产类型
   * @param hook 回调
   */
  preloadDir<A extends Asset>(uri: string, type: Constructor<A>, hook?: SyncOperation): Promise<void[]>;
  /**
   * 加载
   * @param uri 资产标识
   * @param type 资产类型
   * @param ttl 存活时间（秒）
   * @param hook 回调
   */
  load<A extends Asset>(uri: string, type: Constructor<A>, ttl?: number, hook?: SyncOperation): Promise<A>;
  /**
   * 加载目录
   * @param uri 资产标识
   * @param type 资产类型
   * @param ttl 存活时间（秒）
   * @param hook 回调
   */
  loadDir<A extends Asset>(uri: string, type: Constructor<A>, ttl?: number, hook?: SyncOperation): Promise<A[]>;
  /**
   * 批量加载
   * @param items <资产标识,资产类型,存活时间（秒）>数组
   * @param hook 回调
   */
  loadBatch(items: [uri: string, type: Constructor<Asset>, ttl?: number][], hook?: SyncOperation): Promise<Asset[]>;
  /**
   * 顺序加载
   * @param items <资产标识,资产类型,存活时间（秒）>数组
   * @param hook 回调
   */
  loadQueue(items: [uri: string, type: Constructor<Asset>, ttl?: number][], hook?: SyncOperation): Promise<void>;
}

/**
 * 动态资源加载器接口
 *
 * 负责动态资产的预加载和加载
 */
export interface IResDynamic extends IMod {
  get ability(): IResDynamicAbility;
  dependencies: { resCache: IResCacheAbility };
}
