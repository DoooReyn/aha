import { IAbility, IMod } from './mod';

/** 监听器 */
export type IListener = [process: (...args: unknown[]) => void, ambient: unknown, once: boolean];

/**
 * 事件总线能力接口
 */
export interface IEventBusAbility extends IAbility {
  /** 渠道数量 */
  get size(): number;
  /** 渠道详情 */
  get stats(): {
    /** 代号 */
    code: string;
    /** 监听器数量 */
    listeners: number;
  }[];
  /**
   * 渠道是否已部署
   * @param code - 代号
   */
  has(code: string): boolean;
  /**
   * 布置监听器
   * @param code - 代号
   * @param process - 处理方式
   * @param ambient - 环境
   * @param once - 是否一次性
   */
  listen(code: string, process: (...args: unknown[]) => void, ambient: unknown, once?: boolean): void;
  /**
   * 撤销指定监听器
   * @param code - 代号
   * @param process - 处理方式
   * @param ambient - 环境
   */
  unlisten(code: string, process: (...args: unknown[]) => void, ambient: unknown): void;
  /**
   * 撤销指定代号和环境的所有监听器
   * @param code - 代号
   * @param ambient - 环境
   */
  unlistenAmbient(code: string, ambient: unknown): void;
  /**
   * 撤销指定代号的所有监听器
   * @param code - 代号
   */
  unlistenCode(code: string): void;
  /**
   * 撤销所有监听器
   */
  unlistenAll(): void;
  /**
   * 通报
   * @param code - 代号
   * @param news - 消息
   */
  notify(code: string, ...news: unknown[]): void;
}

/**
 * 事件总线接口
 */
export interface IEventBus extends IMod {
  get ability(): IEventBusAbility;
}
