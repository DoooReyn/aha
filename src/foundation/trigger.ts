import { Journal } from '../journal';
import { mightSync } from './might';

/** 回调方法 */
interface IHandle {
  (...args: unknown[]): unknown;
}

/**
 * 触发器
 */
class Trigger {
  /**
   * @param _handle 回调方法
   * @param _ctx 回调上下文
   * @param _once 是否一次性
   * @param _args 回调入参
   */
  constructor(
    private _handle: IHandle,
    private _ctx: unknown,
    private _once: boolean = false,
    private _args: unknown[] = []
  ) {}

  /**
   * 是否有效
   */
  public get isValid() {
    return !!(this._handle && this._ctx);
  }

  /** 是否一次性 */
  public get once() {
    return this._once;
  }

  /**
   * 比较触发器是否一致
   * @param trigger 触发器
   * @returns
   */
  public equals(trigger: Trigger) {
    return this._handle === trigger._handle && this._ctx === trigger._ctx;
  }

  /**
   * 比较触发器是否一致
   * @param handle 回调方法
   * @param context 回调上下文
   * @returns
   */
  public equalsWith(handle: IHandle, context: unknown) {
    return this._handle === handle && this._ctx === context;
  }

  /**
   * 运行触发器
   */
  public run() {
    if (this.isValid) {
      const [, err] = mightSync(this._handle!, this._ctx!, this._args);
      if (err) {
        Journal.Error('触发器运行时报错:', err);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  public runWith(...args: any[]) {
    if (this.isValid) {
      const [, err] = mightSync(this._handle!, this._ctx!, args.concat(this._args));
      if (err) {
        Journal.Error('触发器运行时报错:', err);
      }
    }
  }
}

/**
 * 触发器容器
 */
class Triggers {
  /** 触发器列表 */
  private _container: Trigger[] = [];

  /**
   * 清空触发器
   */
  public clear() {
    this._container.length = 0;
  }

  /**
   * 添加触发器
   * @param handle 回调方法
   * @param context 回调上下文
   * @param once 是否一次性
   * @param args 回调入参
   */
  public add(handle: IHandle, context: unknown, once: boolean = false, ...args: any[]) {
    const trigger = new Trigger(handle, context, once, args);
    if (trigger) this._container.push(trigger);
  }

  /**
   * 移除触发器
   * @param handle 回调方法
   * @param context 回调上下文
   */
  public delWith(handle: IHandle, context: unknown) {
    const at = this._container.findIndex((tr) => tr.equalsWith(handle, context));
    if (at > -1) {
      this._container.splice(at, 1);
    }
  }

  /**
   * 移除触发器
   * @param trigger 触发器
   */
  public del(trigger: Trigger) {
    const at = this._container.findIndex((tr) => tr.equals(trigger));
    if (at > -1) {
      this._container.splice(at, 1);
    }
  }

  /**
   * 运行触发器
   */
  public run() {
    for (let i = this._container.length - 1; i >= 0; i--) {
      const trigger = this._container[i];
      trigger.run();
      if (trigger.once) {
        this._container.splice(i, 1);
      }
    }
  }

  /**
   * 运行触发器
   * @param args 额外入参（插入到原始入参之前）
   */
  public runWith(...args: any[]) {
    for (let i = this._container.length - 1; i >= 0; i--) {
      const trigger = this._container[i];
      trigger.runWith(...args);
      if (trigger.once) {
        this._container.splice(i, 1);
      }
    }
  }
}

export { Trigger, Triggers };
