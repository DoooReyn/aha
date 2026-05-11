import { ILauncherAbility } from './launcher';
import { IAbility, IMod } from './mod';
import { IReporterAbility } from './reporter';

/**
 * 异常类型
 */
export enum SentryErrorType {
  /** JavaScript 错误 */
  JAVASCRIPT = 'JAVASCRIPT',
  /** Promise 拒绝 */
  PROMISE = 'PROMISE',
  /** 原生错误 */
  NATIVE = 'NATIVE',
}

/**
 * 异常数据
 */
export interface ISentryError {
  /** 异常类型 */
  type: SentryErrorType;
  /** 异常代码 */
  code: string;
  /** 异常消息 */
  message: string;
  /** 异常时间戳 */
  timestamp: number;
  /** 异常堆栈 */
  stack?: string;
  /** 额外数据 */
  data?: Record<string, unknown>;
  /** 文件名 */
  filename?: string;
  /** 行号 */
  lineno?: number;
  /** 列号 */
  colno?: number;
}

/**
 * 哨兵统计
 */
export interface ISentryStats {
  /** 捕获的错误总数 */
  totalErrors: number;
  /** 捕获的 JavaScript 错误总数 */
  javascript: number;
  /** 捕获的 Promise 拒绝总数 */
  promise: number;
  /** 捕获的原生错误总数 */
  native: number;
}

/**
 * 哨兵能力接口
 */
export interface ISentryAbility extends IAbility {
  /** 哨兵统计 */
  readonly stats: ISentryStats;
}

/**
 * 哨兵接口
 *
 * 全局异常监控系统
 */
export interface ISentry extends IMod {
  get ability(): ISentryAbility;
  dependencies: { reporter: IReporterAbility; launcher: ILauncherAbility };
}
