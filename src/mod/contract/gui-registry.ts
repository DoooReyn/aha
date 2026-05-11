import { Node } from 'cc';

import { IGuiConfig, IGuiView } from './gui';
import { IAbility, IMod } from './mod';
import { IResCacheAbility } from './res-cache';
import { IResDynamicAbility } from './res-dynamic';

/**
 * 用户界面登记簿能力接口
 */
export interface IGuiRegistryAbility extends IAbility {
  /**
   * 获取视图配置
   * @param ui 标识
   */
  getUiConfig(ui: string): IGuiConfig;
  /**
   * 打开视图
   * @param ui 标识
   * @returns 视图节点实例
   */
  open(ui: string): Promise<Node>;
  /**
   * 关闭视图
   * @param ui 标识
   */
  close(ui: string, view: IGuiView): void;
  /**
   * 清除缓存
   */
  purge(): void;
  /**
   * 已缓存视图数量
   */
  get size(): number;
}

/**
 * 用户界面登记簿接口
 *
 * 负责用户界面的加载、缓存与复用
 */
export interface IGuiRegistry extends IMod {
  get ability(): IGuiRegistryAbility;
  dependencies: { resDynamic: IResDynamicAbility; resCache: IResCacheAbility };
}
