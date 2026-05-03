import { IAbility, IMod } from './mod';

/**
 * 时钟
 *
 * - 时钟运转，累积计时
 * - 便捷添加闹钟
 */
export interface IClock {
  /** 速度（调节时间的流速） */
  speed: number;
  /** 运行状态（内部控制时钟的运行和停摆） */
  get isRunning(): boolean;
  /** 闹钟数量 */
  get size(): number;
  /** 运行 */
  run(): void;
  /** 暂停 */
  pause(): void;
  /** 重置 */
  reset(): void;
  /** 停止 */
  stop(): void;
  /**
   * 移除闹钟
   * @param cid 闹钟编号
   */
  remove(cid: number): void;
  /**
   * 延迟执行
   * @param interval 间隔
   * @param process 处方
   * @param ambient 环境
   */
  delay(interval: number, process: () => void, ambient: unknown): number;
  /**
   * 下一帧
   * @param process 处方
   * @param ambient 环境
   */
  nextFrame(process: () => void, ambient: unknown): number;
  /**
   * 计次执行
   * @param delay 延迟
   * @param interval 间隔
   * @param total 总次数
   * @param process 处方
   * @param ambient 环境
   */
  repeat(
    delay: number,
    interval: number,
    total: number,
    process: (count: number, total: number) => void,
    ambient: unknown
  ): number;
  /**
   * 重复执行
   * @param delay 延迟
   * @param interval 间隔
   * @param process 处方
   * @param ambient 环境
   */
  loop(delay: number, interval: number, process: (count: number, total: number) => void, ambient: unknown): number;
  /**
   * 每帧执行
   * @param process 处方
   * @param ambient 环境
   */
  everyFrame(process: (dt: number) => void, ambient: unknown): number;
  /**
   * 按频率重复执行
   * @param interval 间隔
   * @param process 处方
   * @param ambient 环境
   */
  everyFrequency(interval: number, process: (frequency: number) => void, ambient: unknown): number;
  /**
   * 每秒执行
   * @param process 处方
   * @param ambient 环境
   */
  everySecond(process: (count: number, total: number) => void, ambient: unknown): number;
  /**
   * 计时
   * @param dt 时间片
   */
  tick(dt: number): void;
}

/** 时钟详情 */
export interface IClockStats {
  token: string;
  size: number;
  speed: number;
}

/**
 * 定时器管理器能力接口
 */
export interface IChronosAbility extends IAbility {
  /** 运行状态（外部控制开关，不会影响到时钟内部的运转状态） */
  get isRunning(): boolean;
  /** 时钟数量 */
  get size(): number;
  /** 时钟详情 */
  get stats(): IClockStats[];
  /** 运转 */
  run(): void;
  /** 暂停 */
  pause(): void;
  /**
   * 创建/获取时钟
   * @param token 时钟标识
   */
  acquire(token: string): IClock;
  /**
   * 移除指定时钟
   * @param token 时钟标识
   */
  remove(token: string): void;
  /**
   * 是否有指定时钟
   * @param token 时钟标识
   */
  has(token: string): boolean;
  /** 移除所有时钟 */
  clear(): void;
  /** 用于公共的时钟 */
  get shared(): IClock;
  /** 用于巡检的时钟 */
  get inspector(): IClock;
}

/**
 * 定时器管理器接口
 */
export interface IChronos extends IMod {
  get ability(): IChronosAbility;
}
