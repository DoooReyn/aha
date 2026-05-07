import { Node } from 'cc';

import { IAbility, IMod } from './mod';

/**
 * 动作
 */
export interface ITweenerAction {
  /**
   * @param node 动作节点
   * @param args 动作参数
   */
  (node: Node, args: object): Promise<void>;
}

/**
 * 动作大师能力接口
 */
export interface ITweenerAbility extends IAbility {
  /**
   * 添加动作
   * @param trait 标识
   * @param action 动作
   */
  add(trait: string, action: ITweenerAction): void;
  /**
   * 替换动作
   * @param trait 标识
   * @param action 动作
   */
  replace(trait: string, action: ITweenerAction): void;
  /**
   * 移除动作
   * @param trait 标识
   */
  remove(trait: string): void;
  /**
   * 清空动作
   */
  clear(): void;
  /**
   * 执行动作
   * @param trait 标识
   * @param node 动作节点
   * @param args 参数（可选）
   */
  execute(trait: string, node: Node, args?: object): Promise<void>;
}

/**
 * 动作大师接口
 *
 * 负责管理预设动作（添加、删除、执行）
 */
export interface ITweener extends IMod {
  get ability(): ITweenerAbility;
}
