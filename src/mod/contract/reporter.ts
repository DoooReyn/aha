import { IChronosAbility } from './chronos';
import { ILauncherAbility } from './launcher';
import { IAbility, IMod } from './mod';

/**
 * 上报类型
 */
export enum ReportType {
  /** 异常 */
  ERROR = 'ERROR',
  /** 警告 */
  WARN = 'WARN',
  /** 信息 */
  INFO = 'INFO',
  /** 埋点 */
  TRACK = 'TRACK',
  /** 性能 */
  PERF = 'PERF',
}

/**
 * 上报项目
 */
export interface IReportItem {
  /** 轶事类型 */
  type: ReportType;
  /** 轶事代码 */
  code: string;
  /** 轶事消息 */
  message: string;
  /** 轶事时间戳 */
  timestamp: number;
  /** 额外数据 */
  data?: Record<string, unknown>;
  /** 堆栈信息（异常时使用） */
  stack?: string;
  /** 上报次数 */
  retryCount?: number;
  [key: string]: unknown;
}

/**
 * 上报配置
 */
export interface IReporterConfig {
  /** 服务器地址 */
  serverUrl: string;
  /** 批量上报大小 */
  batchSize?: number;
  /** 上报间隔（毫秒） */
  reportInterval?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大队列大小 */
  maxQueueSize?: number;
}

/**
 * 上报统计
 */
export interface IReporterStats {
  /** 队列大小 */
  queueSize: number;
  /** 已上报总数 */
  totalReports: number;
  /** 上报成功数 */
  successCount: number;
  /** 上报失败数 */
  failureCount: number;
  /** 当前重试数 */
  retryCount: number;
  /** 上报队列（按类型分组） */
  queueByType: Record<string, number>;
}

/**
 * 上报中心能力接口
 */
export interface IReporterAbility extends IAbility {
  /**
   * 上报配置
   */
  readonly config: IReporterConfig;

  /**
   * 采集轶事
   * @param type 轶事类型
   * @param code 轶事代码
   * @param message 轶事消息
   * @param data 额外数据
   */
  report(type: ReportType, code: string, message: string, data?: Record<string, unknown>): void;

  /**
   * 上报异常
   * @param code 异常代码
   * @param message 异常消息
   * @param data 额外数据
   */
  reportError(code: string, message: string, data?: Record<string, unknown>): void;

  /**
   * 上报警告
   * @param code 警告代码
   * @param message 警告消息
   * @param data 额外数据
   */
  reportWarn(code: string, message: string, data?: Record<string, unknown>): void;

  /**
   * 上报信息
   * @param code 信息代码
   * @param message 信息消息
   * @param data 额外数据
   */
  reportInfo(code: string, message: string, data?: Record<string, unknown>): void;

  /**
   * 上报埋点
   * @param code 埋点代码
   * @param message 埋点消息
   * @param data 额外数据
   */
  reportTrack(code: string, message: string, data?: Record<string, unknown>): void;

  /**
   * 上报性能
   * @param code 性能代码
   * @param message 性能消息
   * @param data 额外数据
   */
  reportPerf(code: string, message: string, data?: Record<string, unknown>): void;

  /**
   * 立即上报所有队列中的轶事
   */
  flush(): Promise<void>;

  /**
   * 清空上报队列
   */
  clear(): void;

  /**
   * 获取上报统计
   */
  get stats(): IReporterStats;
}

/**
 * 上报中心接口
 *
 * 采集数据并上报给服务器
 */
export interface IReporter extends IMod {
  get ability(): IReporterAbility;
  dependencies: { launcher: ILauncherAbility; chronos: IChronosAbility };
}
