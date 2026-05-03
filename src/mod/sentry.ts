import { sys } from 'cc';

import { access } from '../foundation/access';
import { now } from '../foundation/time';
import { Journal } from '../journal';
import { ReportType } from './contract';
import { ISentry, ISentryAbility, ISentryError, ISentryStats, SentryErrorType } from './contract/sentry';
import { BaseMod } from './mod';

/**
 * 哨兵能力实现
 *
 * 职责：
 * - 捕获全局 JavaScript 错误
 * - 捕获未处理的 Promise 拒绝
 * - 通知上报中心报告异常
 */
class SentryAbility implements ISentryAbility {
  /** 哨兵统计 */
  private _stats: ISentryStats;
  /** JavaScript 错误处理器 */
  private _jsErrorHandler: ((this: Window, event: ErrorEvent) => unknown) | null;
  /** Promise 拒绝处理器 */
  private _promiseRejectionHandler: ((event: PromiseRejectionEvent) => unknown) | null;
  /** 原生错误捕获 */
  private _nativeErrorHandler: (name: string, line: number, msg: string, stack: string) => void | null;

  constructor(public mod: ISentry) {
    this._stats = {
      totalErrors: 0,
      javascript: 0,
      promise: 0,
      native: 0,
    };
    this._jsErrorHandler = null;
    this._promiseRejectionHandler = null;
    this._nativeErrorHandler = null;
  }

  public get stats(): ISentryStats {
    return { ...this._stats };
  }

  public async attach(): Promise<void> {
    if (access.global.has('addEventListener')) {
      const addEventListener = access.global.get('addEventListener') as (
        event: string,
        listener: (...args: unknown[]) => void
      ) => void;
      // 注册全局错误处理器
      this._jsErrorHandler = this._handleJavaScriptError.bind(this);
      addEventListener('error', this._jsErrorHandler as (...args: unknown[]) => void);
      // 注册 Promise 拒绝处理器
      this._promiseRejectionHandler = this._handlePromiseRejection.bind(this);
      addEventListener('unhandledrejection', this._promiseRejectionHandler as (...args: unknown[]) => void);
    }

    if (sys.isNative) {
      this._nativeErrorHandler = access.global.get('__errorHandler') as typeof this._nativeErrorHandler;
      access.global.set('__errorHandler', this._handleNativeError.bind(this));
    }
  }

  public detach(): void {
    if (access.global.has('removeEventListener')) {
      const removeEventListener = access.global.get('removeEventListener') as (
        event: string,
        listener: (...args: unknown[]) => void
      ) => void;
      // 移除错误处理器
      if (this._jsErrorHandler) {
        removeEventListener('error', this._jsErrorHandler as (...args: unknown[]) => void);
        this._jsErrorHandler = null;
      }
      // 移除 Promise 拒绝处理器
      if (this._promiseRejectionHandler) {
        removeEventListener('unhandledrejection', this._promiseRejectionHandler as (...args: unknown[]) => void);
        this._promiseRejectionHandler = null;
      }
    }

    // 移除原生错误捕获
    if (sys.isNative && this._nativeErrorHandler) {
      access.global.set('__errorHandler', this._nativeErrorHandler);
      this._nativeErrorHandler = null;
    }

    // 清空引用
    this._stats = null;
    this.mod = null;
  }

  /**
   * 处理 JavaScript 错误
   */
  private _handleJavaScriptError(event: ErrorEvent): void {
    this._stats.totalErrors++;
    this._stats.javascript++;

    const error: ISentryError = {
      type: SentryErrorType.JAVASCRIPT,
      code: 'JAVASCRIPT_ERROR',
      message: event.message || 'Unknown error',
      timestamp: now(),
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    };

    this._reportToReporter(error);
  }

  /**
   * 处理 Promise 拒绝
   */
  private _handlePromiseRejection(event: PromiseRejectionEvent): void {
    this._stats.totalErrors++;
    this._stats.promise++;

    const { reason } = event;

    let message: string;
    let stack: string | undefined;

    if (reason instanceof Error) {
      const { message: _message, stack: _stack } = reason;
      message = _message;
      stack = _stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      message = String(reason);
    }

    const error: ISentryError = {
      type: SentryErrorType.PROMISE,
      code: 'PROMISE_REJECTION',
      message,
      timestamp: now(),
      stack,
    };

    this._reportToReporter(error);
  }

  /**
   * 处理原生错误
   */
  private _handleNativeError(name: string, line: number, msg: string, stack: string) {
    this._stats.totalErrors++;
    this._stats.native++;

    const error: ISentryError = {
      type: SentryErrorType.NATIVE,
      code: 'NATIVE_ERROR',
      message: msg,
      filename: name,
      lineno: line,
      timestamp: now(),
      stack,
    };

    this._reportToReporter(error);
  }

  /**
   * 报告给记者
   */
  private _reportToReporter(error: ISentryError): void {
    Journal.Error('捕获到异常', error);
    if (this.mod.dependencies.launcher.isDev) return;
    this.mod.dependencies.reporter.report(ReportType.ERROR, error.code, error.message, {
      type: error.type,
      timestamp: error.timestamp,
      stack: error.stack,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
    });
  }
}

/**
 * 哨兵实现
 */
class Sentry extends BaseMod<SentryAbility> implements ISentry {
  public static readonly InitArgs: Parameters<Sentry['loadAbility']>;
  public static readonly Trait: string = 'sentry';
  declare public dependencies: ISentry['dependencies'];

  protected loadAbility(): SentryAbility {
    return new SentryAbility(this);
  }
}

export { Sentry };
