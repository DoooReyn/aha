import { director, game, js, Director } from 'cc';

import { mightSync } from '../foundation';
import { IChronos, IChronosAbility, IClock, IClockStats } from './contract/chronos';
import { BaseMod } from './mod';
import { TRAIT } from './trait';

/** 闹钟监听器 */
type IListener<P extends unknown[] = []> = [process: (...args: P) => void, ambient?: unknown, once?: boolean];

/**
 * 闹钟
 */
class Alarm {
  /** 闹钟编号生成器 */
  public static readonly Idg: js.IDGenerator = new js.IDGenerator('alarm');

  /** 闹钟编号 */
  private readonly _cid: number;
  /** 延迟时间 */
  private _delay: number;
  /** 计次总数 */
  private readonly _total: number;
  /** 计次间隔 */
  private _interval: number;
  /** 当前计次 */
  private _count: number;
  /** 累积时间 */
  private _accumulated: number;
  /** 是否完成 */
  private _done: boolean;
  /** 计次之后的残留时间 */
  private _rest: number;
  /** 计次监听器集合 */
  private _countListeners: Set<IListener<[count: number, total: number]>>;
  /** 计帧监听器集合 */
  private _frameListeners: Set<IListener<[dt: number]>>;
  /** 计频监听器集合 */
  private _frequencyListeners: Set<IListener<[frequency: number]>>;
  /** 完成监听器集合 */
  private _doneListeners: Set<IListener>;

  /** 闹钟编号 */
  public get cid() {
    return this._cid;
  }

  /** 是否已完成 */
  public get isDone() {
    return this._done;
  }

  /**
   * 闹钟构造
   * @param delay 延迟时间
   * @param interval 计次间隔
   * @param total 计次总数
   */
  public constructor(delay: number, interval: number, total: number) {
    Alarm.Idg.getNewId();
    this._cid = Alarm.Idg.id;
    this._delay = delay;
    this._interval = interval;
    this._total = total;
    this._count = 0;
    this._rest = 0;
    this._accumulated = 0;
    this._done = false;
  }

  /** 重置 */
  public reset(): void {
    this._delay = 0;
    this._interval = 0;
    this._count = 0;
    this._rest = 0;
    this._accumulated = 0;
    this._done = false;
  }

  /**
   * 添加计帧监听器
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  public addFrameListener(process: (dt: number) => void, ambient: unknown, once: boolean) {
    (this._frameListeners ??= new Set()).add([process, ambient, once]);
  }

  /**
   * 添加计次监听器
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  public addCountListener(process: (count: number, total: number) => void, ambient: unknown, once: boolean) {
    (this._countListeners ??= new Set()).add([process, ambient, once]);
  }

  /**
   * 添加计频监听器
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  public addFrequencyListener(process: (frequency: number) => void, ambient: unknown, once: boolean) {
    (this._frequencyListeners ??= new Set()).add([process, ambient, once]);
  }

  /**
   * 添加完成监听器
   * @param process 处方
   * @param ambient 环境
   * @param once 一次性
   */
  public addDoneListener(process: () => void, ambient: unknown, once: boolean) {
    (this._doneListeners ??= new Set()).add([process, ambient, once]);
  }

  /**
   * 执行计帧监听器
   * @param dt 时间片
   */
  private _runFrameListener(dt: number) {
    const listeners = this._frameListeners;
    if (listeners) {
      for (const listener of listeners) {
        const [process, ambient, once] = listener;
        mightSync(process, ambient, dt);
        if (once) {
          listeners.delete(listener);
        }
      }
    }
  }

  /**
   * 执行计次监听器
   */
  private _runCountListener() {
    const listeners = this._countListeners;
    if (listeners) {
      for (const listener of listeners) {
        const [process, ambient, once] = listener;
        mightSync(process, ambient, this._count, this._total);
        if (once) {
          listeners.delete(listener);
        }
      }
    }
  }

  /**
   * 执行计频监听器
   * @param frequency 频次
   */
  private _runFrequencyListener(frequency: number) {
    const listeners = this._frequencyListeners;
    if (listeners) {
      for (const listener of listeners) {
        const [process, ambient, once] = listener;
        mightSync(process, ambient, frequency);
        if (once) {
          listeners.delete(listener);
        }
      }
    }
  }

  /**
   * 执行完成监听器
   */
  private _runDoneListener() {
    const listeners = this._doneListeners;
    if (listeners) {
      for (const listener of listeners) {
        const [process, ambient, once] = listener;
        mightSync(process, ambient);
        if (once) {
          listeners.delete(listener);
        }
      }
    }
  }

  /**
   * 步进
   * @param dt 时间片
   */
  public step(dt: number) {
    if (this._done) return;

    this._accumulated += dt;
    if (this._accumulated < this._delay) return;

    this._rest += dt;
    this._runFrameListener(dt);

    const step = this._interval || dt; // 如果步长为0，那么就应该取时间片，否则就会无限循环
    while (this._rest >= step) {
      this._rest -= step;
      this._count++;
      this._runFrequencyListener(step);
      this._runCountListener();
      if (this._total > 0 && this._count >= this._total) {
        this._done = true;
        this._runDoneListener();
        break;
      }
    }
  }
}

/**
 * 时钟
 */
class Clock implements IClock {
  /** 速度（调节时间的流速） */
  private _speed: number;
  /** 运行状态（内部控制时钟的运行和停摆） */
  private _running: boolean;
  /** 闹钟 */
  private _alarms: Map<number, Alarm>;

  public constructor() {
    this._speed = 1;
    this._running = true;
    this._alarms = new Map();
  }

  public get speed() {
    return this._speed;
  }

  public set speed(speed: number) {
    this._speed = speed;
  }

  public get isRunning(): boolean {
    return this._running;
  }

  public get size() {
    return this._alarms.size;
  }

  public run(): void {
    this._running = true;
  }

  public pause(): void {
    this._running = false;
  }

  public reset() {
    this.pause();
    this._alarms.forEach((alarm) => alarm.reset());
  }

  public stop() {
    this.pause();
    this._alarms.clear();
  }

  public remove(cid: number) {
    this._alarms.delete(cid);
  }

  private _add(delay: number, interval: number, total: number): Alarm {
    const alarm = new Alarm(delay, interval, total);
    this._alarms.set(alarm.cid, alarm);
    return alarm;
  }

  public delay(interval: number, process: () => void, ambient: unknown): number {
    const counter = this._add(0, interval, 1);
    counter.addDoneListener(process, ambient, true);
    return counter.cid;
  }

  public nextFrame(process: () => void, ambient: unknown): number {
    const counter = this._add(0, 0, 1);
    counter.addDoneListener(process, ambient, true);
    return counter.cid;
  }

  public repeat(
    delay: number,
    interval: number,
    total: number,
    process: (count: number, total: number) => void,
    ambient: unknown
  ): number {
    const counter = this._add(delay, interval, total);
    counter.addCountListener(process, ambient, false);
    return counter.cid;
  }

  public loop(
    delay: number,
    interval: number,
    process: (count: number, total: number) => void,
    ambient: unknown
  ): number {
    const counter = this._add(delay, interval, 0);
    counter.addCountListener(process, ambient, false);
    return counter.cid;
  }

  public everyFrame(process: (dt: number) => void, ambient: unknown): number {
    const counter = this._add(0, 0, 0);
    counter.addFrameListener(process, ambient, false);
    return counter.cid;
  }

  public everyFrequency(interval: number, process: (frequency: number) => void, ambient: unknown): number {
    const counter = this._add(0, interval, 0);
    counter.addFrequencyListener(process, ambient, false);
    return counter.cid;
  }

  public everySecond(process: (count: number, total: number) => void, ambient: unknown): number {
    const counter = this._add(0, 1, 0);
    counter.addCountListener(process, ambient, false);
    return counter.cid;
  }

  public tick(dt: number) {
    if (this._speed <= 0 || !this._running) return;

    const step = this._speed * dt;
    for (const [cid, alarm] of this._alarms) {
      alarm.step(step);
      if (alarm.isDone) {
        this._alarms.delete(cid);
      }
    }
  }
}

/**
 * 定时器管理器能力实现
 */
class ChronosAbility implements IChronosAbility {
  /** 运行状态（外部控制开关，不会影响到时钟内部的运转状态） */
  private _running: boolean;
  /** 时钟 */
  private _clocks: Map<string, IClock>;

  public constructor(public mod: IChronos) {
    this._running = false;
    this._clocks = new Map();
  }

  /** 运转 */
  private _drive() {
    if (this._running) {
      this._tick(game.deltaTime);
    }
  }

  /**
   * 计时
   * @param dt 时间片
   */
  private _tick(dt: number) {
    this._clocks.forEach((clock) => clock.tick(dt));
  }

  public async attach(): Promise<void> {
    director.on(Director.EVENT_BEFORE_UPDATE, this._drive, this);

    this._running = true;
  }

  public detach(): void {
    director.off(Director.EVENT_BEFORE_UPDATE, this._drive, this);
    this.clear();
    this._running = false;
    this._clocks = null;
    this.mod = null;
  }

  public get shared() {
    return this.acquire('shared');
  }

  public get inspector() {
    return this.acquire('inspector');
  }

  public get size() {
    return this._clocks.size;
  }

  public get stats(): IClockStats[] {
    const stats: IClockStats[] = [];
    for (const [token, clock] of this._clocks) {
      stats.push({ token, size: clock.size, speed: clock.speed });
    }
    return stats;
  }

  public get isRunning() {
    return this._running;
  }

  public pause() {
    this._running = false;
  }

  public run() {
    this._running = true;
  }

  public acquire(token: string): IClock {
    if (!this._clocks.has(token)) {
      this._clocks.set(token, new Clock());
    }
    return this._clocks.get(token);
  }

  public remove(token: string) {
    this._clocks.get(token)?.stop();
    this._clocks.delete(token);
  }

  public has(token: string): boolean {
    return this._clocks.has(token);
  }

  public clear() {
    this._clocks.forEach((clock) => clock.stop());
    this._clocks.clear();
  }
}

/**
 * 定时器管理器实现
 */
class Chronos extends BaseMod<ChronosAbility> implements IChronos {
  public static readonly InitArgs: Parameters<Chronos['loadAbility']>;
  public static readonly Trait: string = TRAIT.CHRONOS;
  protected loadAbility(): ChronosAbility {
    return new ChronosAbility(this);
  }
}

export { Chronos };
