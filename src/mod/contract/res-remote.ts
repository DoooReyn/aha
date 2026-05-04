import { Asset } from 'cc';

import { Constructor, SyncOperation } from '../../foundation';
import { IAbility, IMod } from './mod';
import { IResCacheAbility } from './res-cache';

/**
 * 远程资源加载器配置
 */
export interface IResRemoteConfig {
  /** 服务器地址 */
  serverAddr: string;
  /** 是否追加时间戳 */
  appendTimestamp?: boolean;
}

/**
 * 远程资源加载器能力
 */
export interface IResRemoteAbility extends IAbility {
  /**
   * 加载
   * @param uri 资产标识
   * @param type 资产类型
   * @param ttl 存活时间
   * @param hook 回调
   */
  load<A extends Asset>(uri: string, type: Constructor<A>, ttl?: number, hook?: SyncOperation): Promise<A>;
  /**
   * 批量加载
   * @param items <资产标识,资产类型>数组
   * @param hook 回调
   */
  loadBatch(items: [uri: string, type: Constructor<Asset>, ttl?: number][], hook?: SyncOperation): Promise<Asset[]>;
  /**
   * 顺序加载
   * @param items <资产标识,资产类型>数组
   * @param hook 回调
   */
  loadQueue(items: [uri: string, type: Constructor<Asset>, ttl?: number][], hook?: SyncOperation): Promise<void>;
}

/**
 * 远程资源加载器
 */
export interface IResRemote extends IMod {
  get ability(): IAbility & IResRemoteAbility;
  dependencies: { resCache: IResCacheAbility };
}
