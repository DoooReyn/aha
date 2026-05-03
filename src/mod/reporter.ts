import { sys } from 'cc';

import { now } from '../foundation/time';
import {
  IReporter,
  IReporterAbility,
  IReporterConfig,
  IReporterStats,
  IReportItem,
  ReportType,
} from './contract/reporter';
import { BaseMod } from './mod';

class ReporterAbility implements IReporterAbility {
  /** 上报配置 */
  private _config: IReporterConfig;
  /** 上报队列 */
  private _queue: IReportItem[];
  /** 上报统计 */
  private _stats: IReporterStats;
  /** 上报定时器ID */
  private _timerId: number;
  /** 是否正在上报 */
  private _isReporting: boolean;

  constructor(
    public mod: Reporter,
    config: IReporterConfig
  ) {
    this._config = {
      batchSize: 10,
      reportInterval: 5000,
      maxRetries: 3,
      timeout: 10000,
      maxQueueSize: 50,
      ...config,
    };
    this._queue = [];
    this._stats = {
      queueSize: 0,
      totalReports: 0,
      successCount: 0,
      failureCount: 0,
      retryCount: 0,
      queueByType: {},
    };
    this._timerId = null;
    this._isReporting = false;
  }

  public get config(): IReporterConfig {
    return this._config;
  }

  public async attach(): Promise<void> {
    // 启动定时上报
    this._startSchedule();
  }

  public detach(): void {
    // 停止定时上报
    this._stopSchedule();

    // 清空队列
    this._clear();

    // 清空引用
    this._config = null;
    this._queue = null;
    this._stats = null;
    this.mod = null;
  }

  /**
   * 采集轶事
   * @param type 轶事类型
   * @param code 轶事代码
   * @param message 轶事消息
   * @param data 额外数据
   */
  public report(type: ReportType, code: string, message: string, data?: Record<string, unknown>): void {
    // 开发环境不上报
    if (this.mod.dependencies.launcher.isDev) return;

    this._addToQueue({
      type,
      code,
      message,
      timestamp: now(),
      data,
      retryCount: 0,
      os: sys.os,
      platform: sys.platform,
    });
  }

  /**
   * 上报异常
   * @param code 异常代码
   * @param message 异常消息
   * @param data 额外数据
   */
  public reportError(code: string, message: string, data?: Record<string, unknown>): void {
    this.report(ReportType.ERROR, code, message, data);
  }

  /**
   * 上报警告
   * @param code 警告代码
   * @param message 警告消息
   * @param data 额外数据
   */
  public reportWarn(code: string, message: string, data?: Record<string, unknown>): void {
    this.report(ReportType.WARN, code, message, data);
  }

  /**
   * 上报信息
   * @param code 信息代码
   * @param message 信息消息
   * @param data 额外数据
   */
  public reportInfo(code: string, message: string, data?: Record<string, unknown>): void {
    this.report(ReportType.INFO, code, message, data);
  }

  /**
   * 上报埋点
   * @param code 埋点代码
   * @param message 埋点消息
   * @param data 额外数据
   */
  public reportTrack(code: string, message: string, data?: Record<string, unknown>): void {
    this.report(ReportType.TRACK, code, message, data);
  }

  /**
   * 上报性能
   * @param code 性能代码
   * @param message 性能消息
   * @param data 额外数据
   */
  public reportPerf(code: string, message: string, data?: Record<string, unknown>): void {
    this.report(ReportType.PERF, code, message, data);
  }
  /**
   * 立即上报所有队列中的轶事
   */
  public async flush(): Promise<void> {
    if (this._queue.length > 0 && !this._isReporting) {
      this._isReporting = true;

      try {
        // 按批次大小上报
        const batchSize = this._config.batchSize;
        while (this._queue.length > 0) {
          const batch = this._queue.splice(0, batchSize);
          await this._sendBatch(batch);
        }
      } finally {
        this._isReporting = false;
      }
    }
  }

  /**
   * 清空上报队列
   */
  public clear(): void {
    this._clear();
  }

  /**
   * 获取上报统计
   */
  public get stats(): IReporterStats {
    return { ...this._stats };
  }

  /**
   * 添加到队列
   * @param report 轶事数据
   */
  private _addToQueue(report: IReportItem): void {
    // 检查队列大小，超过限制则丢弃最旧的
    if (this._queue.length >= this._config.maxQueueSize) {
      const removed = this._queue.shift();
      this._updateQueueByType(removed.type, -1);
    }

    this._queue.push(report);
    this._stats.totalReports++;
    this._stats.queueSize = this._queue.length;
    this._updateQueueByType(report.type, 1);
  }

  /**
   * 更新按类型分组的队列统计
   * @param type 轶事类型
   * @param delta 变化量
   */
  private _updateQueueByType(type: ReportType, delta: number): void {
    const typeKey = type.toString();
    this._stats.queueByType[typeKey] = (this._stats.queueByType[typeKey] || 0) + delta;
  }

  /**
   * 启动定时上报
   */
  private _startSchedule(): void {
    if (this._timerId !== null) {
      return;
    }

    const clock = this.mod.dependencies.chronos.acquire('Reporter');
    const interval = this._config.reportInterval / 1000;
    this._timerId = clock.loop(0, interval, this.flush, this);
  }

  /**
   * 停止定时上报
   */
  private _stopSchedule(): void {
    if (this._timerId === null) {
      return;
    }

    const clock = this.mod.dependencies.chronos.acquire('Reporter');
    clock.remove(this._timerId);
    this._timerId = null;
  }

  /**
   * 发送批次数据
   * @param batch 批次数据
   */
  private async _sendBatch(batch: IReportItem[]): Promise<void> {
    const maxRetries = this._config.maxRetries;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        await this._httpRequest(batch);
        this._stats.successCount += batch.length;
        this._stats.queueSize = this._queue.length;
        return;
      } catch (error) {
        retryCount++;

        if (retryCount > maxRetries) {
          // 超过最大重试次数，丢弃数据
          this._stats.failureCount += batch.length;
          this._stats.queueSize = this._queue.length;
          console.error('[Reporter] 上报失败，已丢弃:', error);
          return;
        }

        // 更新重试次数
        this._stats.retryCount++;
        // 指数退避
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  }

  /**
   * HTTP 请求
   * @param batch 批次数据
   */
  private async _httpRequest(batch: IReportItem[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', this._config.serverUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = this._config.timeout;

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Request timeout'));
      };

      xhr.send(JSON.stringify(batch));
    });
  }

  /**
   * 清空队列
   */
  private _clear(): void {
    this._queue = [];
    this._stats.queueSize = 0;
    this._stats.queueByType = {};
  }
}
/**
 * 记者公民实现
 *
 * 原型：日志上报系统
 * 职业：采集王国轶事并上报到服务器
 */
class Reporter extends BaseMod<ReporterAbility> implements IReporter {
  public static readonly InitArgs: Parameters<Reporter['loadAbility']>;
  public static readonly Trait: string = 'reporter';
  declare public dependencies: IReporter['dependencies'];

  protected loadAbility(config: IReporterConfig): ReporterAbility {
    return new ReporterAbility(this, config);
  }
}

export { Reporter };
