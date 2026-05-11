import { js, AudioClip, AudioSource, Node } from 'cc';

import { time } from '../foundation';
import { Journal } from '../journal';
import { CantorCategory, CargoTTL, ICantor, ICantorAbility, ICantorConfig, ICantorPlayer, IProject } from './contract';
import { BaseMod } from './mod';
import { TRAIT } from './trait';

/**
 * 音律节点
 * @warn 音律节点不应直接暴露给外部使用，外部应通过 `cantor.{crisp/rhythm/tune}` 进行访问。
 * @warn Node 在销毁时会自动清除挂在它身上的属性，如果设置了只读属性，就会抛出异常。
 */
class CantorEntry extends Node implements IProject {
  declare public project: string;
  declare public createdAt: number;
  declare public usedAt: number;
  declare public recycledAt: number;
  declare public disposedAt: number;
  /** 音频组件 */
  private _source: AudioSource;

  public constructor() {
    super('cantor');
    this._source = this.addComponent(AudioSource);
  }

  public onProduce(): void {}

  public onRecycle(): void {
    this.off(AudioSource.EventType.ENDED);
    this._source.stop();
    this._source.clip = null;
    this.removeFromParent();
  }

  public onDispose(): void {
    this.onRecycle();
    this.destroy();
  }

  /**
   * 播放
   * @param clip 音频资产
   * @param volume 音量
   * @param loop 是否循环
   */
  public play(clip: AudioClip, volume: number, loop: boolean): void {
    this._source.stop();
    this._source.clip = clip;
    this._source.volume = volume;
    this._source.loop = loop;
    this._source.play();
  }

  /** 暂停 */
  public pause() {
    this._source.pause();
  }

  /** 恢复 */
  public resume() {
    this._source.play();
  }

  /** 停止 */
  public stop() {
    this._source.stop();
  }
}

/**
 * 负责音律的乐师
 *
 * - 原型：音频播放器
 */
abstract class CantorPlayer implements ICantorPlayer {
  /** 是否静音 */
  protected _mute: boolean;
  /** 主音量 */
  protected _masterVolume: number;
  /** 副音量 */
  protected _subVolume: number;
  /** 当前资产标识 */
  protected _uri: string;
  /** 上次播放时间 */
  protected _lastAt: number;

  /**
   * @param _category 音律类别
   * @param _arcane 乐师奥术
   */
  public constructor(
    protected _category: CantorCategory,
    protected _arcane: CantorAbility
  ) {
    this._mute = false;
    this._masterVolume = 1;
    this._subVolume = 1;
    this._uri = '';
    this._lastAt = 0;
  }

  public get mute(): boolean {
    return this._mute;
  }
  public set mute(value: boolean) {
    this._mute = value;
  }

  public get masterVolume(): number {
    return this._masterVolume;
  }
  public set masterVolume(value: number) {
    this._masterVolume = value;
  }

  public get subVolume(): number {
    return this._subVolume;
  }
  public set subVolume(value: number) {
    this._subVolume = value;
  }

  public get uri(): string {
    return this._uri;
  }

  public abstract play(uri: string, loop?: boolean): Promise<string | null>;

  public pause(cid?: string): void {
    if (cid !== undefined) {
      this._arcane.pause(cid);
    } else {
      this._arcane.internalPauseCategory(this._category);
    }
  }

  public resume(cid?: string): void {
    if (cid !== undefined) {
      this._arcane.resume(cid);
    } else {
      this._arcane.internalResumeCategory(this._category);
    }
  }

  public stop(cid?: string): void {
    if (cid !== undefined) {
      this._arcane.stop(cid);
    } else {
      this._arcane.internalStopCategory(this._category);
    }
  }
}

/**
 * 负责脆音的乐师
 */
class CrispPlayer extends CantorPlayer {
  public async play(uri: string): Promise<string | null> {
    if (this._mute) {
      return Promise.resolve(null);
    }

    const now = time.now();
    if (this._arcane.isTooShort(now, this._lastAt)) {
      Journal.Warn(`Crisp 播放过快，拒绝播放 ${uri}`);
      return Promise.resolve(null);
    }
    this._lastAt = now;

    if (this._arcane.isReachLimit(this._category)) {
      Journal.Warn(`Crisp 播放通道受限，拒绝播放 ${uri}`);
      return Promise.resolve(null);
    }

    this._uri = uri;

    const clip = await this._arcane.load(uri, this._category);
    if (!clip) {
      return Promise.resolve(null);
    }

    const cid = this._arcane.internalPlay(this._category, uri, clip, this._masterVolume * this._subVolume, false);
    return Promise.resolve(cid);
  }
}

/**
 * 负责节律的乐师
 */
class RhythmPlayer extends CantorPlayer {
  public async play(uri: string, loop: boolean = false): Promise<string | null> {
    if (this._mute) {
      return Promise.resolve(null);
    }

    if (this._arcane.isReachLimit(this._category)) {
      Journal.Warn(`Rhythm 播放通道受限，拒绝播放 ${uri}`);
      this._arcane.releaseInOrder([CantorCategory.Rhythm, CantorCategory.Crisp]);
      return Promise.resolve(null);
    }

    this._uri = uri;

    const clip = await this._arcane.load(uri, this._category);

    if (!clip) {
      return Promise.resolve(null);
    }

    const cid = this._arcane.internalPlay(this._category, uri, clip, this._masterVolume * this._subVolume, loop);
    return Promise.resolve(cid);
  }
}

/**
 * 负责乐章的乐师
 */
class TunePlayer extends CantorPlayer {
  public async play(uri: string): Promise<string> {
    if (this._mute) {
      return Promise.resolve(null);
    }

    if (this._uri === uri) {
      Journal.Warn(`Tune 正在播放，拒绝重复播放 ${uri}`);
      return Promise.resolve(null);
    }

    if (this._arcane.isReachLimit(this._category)) {
      this._arcane.releaseInOrder([CantorCategory.Tune, CantorCategory.Rhythm, CantorCategory.Crisp]);
    }

    this._uri = uri;
    const clip = await this._arcane.load(uri, this._category);
    if (!clip) {
      return Promise.resolve(null);
    }

    const cid = this._arcane.internalPlay(this._category, uri, clip, this._masterVolume * this._subVolume, true);
    return Promise.resolve(cid);
  }
}

/**
 * 乐师能力实现
 */
class CantorAbility implements ICantorAbility {
  /** 音律编号生成器 */
  public static readonly Ids = new js.IDGenerator('cantor');
  /** 脆音乐师 */
  public crisp: ICantorPlayer;
  /** 节律乐师 */
  public rhythm: ICantorPlayer;
  /** 乐章乐师 */
  public tune: ICantorPlayer;
  /** 当前播放列表 */
  private readonly _playings: Map<string, [CantorCategory, string, CantorEntry]>;

  /**
   * @param _config 乐师配置
   */
  public constructor(
    public mod: ICantor,
    private _config: ICantorConfig
  ) {
    _config.totalLimit = Math.min(_config.totalLimit, AudioSource.maxAudioChannel);
    this._playings = new Map();
    this.crisp = new CrispPlayer(CantorCategory.Crisp, this);
    this.rhythm = new RhythmPlayer(CantorCategory.Rhythm, this);
    this.tune = new TunePlayer(CantorCategory.Tune, this);
  }

  public get stats(): {
    [CantorCategory.Crisp]: number;
    [CantorCategory.Rhythm]: number;
    [CantorCategory.Tune]: number;
  } {
    const stats = {
      [CantorCategory.Crisp]: 0,
      [CantorCategory.Rhythm]: 0,
      [CantorCategory.Tune]: 0,
    };
    for (const [, [cat]] of this._playings) {
      stats[cat]++;
    }
    return stats;
  }

  /**
   * 两次播放间隔是否过短（是否播放过快）
   * @internal 该方法仅供内部使用
   * @param time 当前时间
   * @param last 上次播放时间
   * @returns
   */
  public isTooShort(time: number, last: number) {
    return time - last <= this._config.quickPlayLimit;
  }

  /**
   * 是否达到最大通道限制
   * @internal 该方法仅供内部使用
   * @param category 音律类别
   * @returns
   */
  public isReachLimit(category: CantorCategory): boolean {
    if (this._playings.size >= this._config.totalLimit) return true;

    const stats = this.stats;
    if (category === CantorCategory.Crisp) {
      return stats[CantorCategory.Crisp] >= this._config.crispLimit;
    } else if (category === CantorCategory.Rhythm) {
      return stats[CantorCategory.Rhythm] >= this._config.rhythmLimit;
    } else {
      return stats[CantorCategory.Tune] >= 1; // 乐章限制为1
    }
  }

  /**
   * 按顺序释放指定类别的通道
   * @internal 该方法仅供内部使用
   * @param categories 音律类别数组
   */
  public releaseInOrder(categories: CantorCategory[]): void {
    for (const cat1 of categories) {
      for (const [cid, [cat2]] of this._playings) {
        if (cat1 === cat2) {
          this.stop(cid);
          break;
        }
      }
    }
  }

  /**
   * 暂停指定类别的通道
   * @internal 该方法仅供内部使用，外部应通过 pause/resume/stop 方法控制播放状态。
   * @param category 音律类别
   */
  public internalPauseCategory(category: CantorCategory): void {
    for (const [, [cat, , entry]] of this._playings) {
      if (cat === category) {
        entry.pause();
      }
    }
  }

  /**
   * 恢复指定类别的通道
   * @internal 该方法仅供内部使用，外部应通过 pause/resume/stop 方法控制播放状态。
   * @param category 音律类别
   */
  public internalResumeCategory(category: CantorCategory): void {
    for (const [, [cat, , entry]] of this._playings) {
      if (cat === category) {
        entry.resume();
      }
    }
  }

  /**
   * 停止指定类别的通道
   * @internal 该方法仅供内部使用，外部应通过 pause/resume/stop 方法控制播放状态。
   * @param category 音律类别
   */
  public internalStopCategory(category: CantorCategory): void {
    const cids: string[] = [];
    for (const [cid, [cat]] of this._playings) {
      if (cat === category) {
        cids.push(cid);
      }
    }
    for (const cid of cids) {
      this.stop(cid);
    }
  }

  /**
   * 加载音频资产
   * @internal 该方法仅供内部使用
   * @param uri 资产标识
   * @param category 音律类别
   * @returns
   */
  public load(uri: string, category: CantorCategory): Promise<AudioClip> {
    const [header] = uri.split('@');
    const ttl = category === CantorCategory.Crisp ? CargoTTL.Medium : CargoTTL.Short;
    if (header === 'remote') {
      return this.mod.dependencies.resRemote.load(uri, AudioClip, ttl);
    } else {
      return this.mod.dependencies.resDynamic.load(uri, AudioClip, ttl);
    }
  }

  /**
   * 播放音律
   * @internal 该方法仅供内部使用，外部应通过 crisp/rhythm/tune 方法控制播放。
   * @param category 音律类别
   * @param uri 资产标识
   * @param clip 音频资产
   * @param volume 音律
   * @param loop 是否循环
   * @returns
   */
  public internalPlay(category: CantorCategory, uri: string, clip: AudioClip, volume: number, loop: boolean): string {
    const entry = this.mod.dependencies.pool.produce('cantor') as CantorEntry;
    const cid = CantorAbility.Ids.getNewId();
    this._playings.set(cid, [category, uri, entry]);
    this.mod.dependencies.resCache.borrow(uri);
    this.mod.dependencies.launcher.mnt.addChild(entry);

    if (category === CantorCategory.Crisp) {
      entry.play(clip, volume, false);
    } else if (category === CantorCategory.Rhythm) {
      entry.play(clip, volume, loop);
    } else if (category === CantorCategory.Tune) {
      entry.play(clip, volume, true);
    }

    entry.once(AudioSource.EventType.ENDED, () => {
      this.stop(cid);
    });

    return cid;
  }

  public pause(cid: string): void {
    const playing = this._playings.get(cid);
    if (playing) {
      const [, , entry] = playing;
      entry.pause();
    }
  }

  public resume(cid: string): void {
    const playing = this._playings.get(cid);
    if (playing) {
      const [, , entry] = playing;
      entry.resume();
    }
  }

  public stop(cid: string): void {
    const playing = this._playings.get(cid);
    if (playing) {
      this._playings.delete(cid);
      const [, uri, entry] = playing;
      if (entry.isValid) {
        entry.stop();
        this.mod.dependencies.resCache.return(uri);
        this.mod.dependencies.pool.recycle(entry);
      }
    }
  }

  public async attach(): Promise<void> {
    this.mod.dependencies.pool.setup({
      project: 'cantor',
      ttl: 30,
      warmup: AudioSource.maxAudioChannel / 2,
      maximum: AudioSource.maxAudioChannel,
      expand: 3,
      inspectPeriod: 1_000,
      produce() {
        return new CantorEntry();
      },
    });
  }

  public detach(): void {
    this._playings.clear();
    this._config = null;
    this.mod = null;
  }
}

/**
 * 乐师实现
 */
export class Cantor extends BaseMod<CantorAbility> implements ICantor {
  public static readonly InitArgs: Parameters<Cantor['loadAbility']>;
  public static readonly Trait: string = TRAIT.CANTOR;
  declare public dependencies: ICantor['dependencies'];

  /**
   * @param config 乐师配置
   * @returns
   */
  protected loadAbility(config: ICantorConfig): CantorAbility {
    return new CantorAbility(this, config);
  }
}
