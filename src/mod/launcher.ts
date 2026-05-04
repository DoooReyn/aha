import { director, game, sys, Camera, Canvas, Director, Game, Layers, Node, Scene } from 'cc';

import { access, time } from '../foundation';
import { Journal } from '../journal';
import { Build, ILauncher, ILauncherAbility, ILauncherConfig, Language } from './contract/launcher';
import { BaseMod } from './mod';

/**
 * 启动器能力实现
 */
class LauncherAbility implements ILauncherAbility {
  public scene: Scene;
  public root: Node;
  public stage: Node;
  public mnt: Node;
  public canvas: Canvas;
  public cameraUi: Camera;

  /** 逻辑运行状态 */
  private _runningLogic: boolean;
  /** 内部运行状态 */
  private _runningInternal: boolean;
  /** 内部暂停计时点 */
  private _timingPause: number;
  /** 内部恢复计时点 */
  private _timingResume: number;
  /** 启动参数 */
  private readonly _config: ILauncherConfig;

  public constructor(
    public mod: ILauncher,
    config: Partial<ILauncherConfig>
  ) {
    this.mnt = null;
    this.root = null;
    this.stage = null;
    this.canvas = null;
    this.cameraUi = null;
    this.scene = null;
    this._runningLogic = false;
    this._runningInternal = false;
    this._timingPause = 0;
    this._timingResume = 0;
    this._config = {
      app: 'civilization',
      version: '1.0.0',
      build: Build.Dev,
      language: [sys.Language.CHINESE, sys.Language.ENGLISH],
      env: 'default',
      ...config,
    };
  }

  public async attach(): Promise<void> {
    // 合并启动参数
    if (access.global.has('location')) {
      const url = (access.global.get('location') as Location)?.href ?? '';
      const query = url.split('?');
      if (query.length == 2) {
        const pairs = query[1].split('&');
        for (let i = 0, l = pairs.length, key: string, value: string; i < l; i++) {
          const eq = pairs[i].indexOf('=');
          if (eq === -1) continue;
          key = pairs[i].substring(0, eq);
          value = pairs[i].substring(eq + 1);
          try {
            this._config[key] = decodeURIComponent(value);
          } catch {
            this._config[key] = value;
          }
        }
      }
    }
    Object.freeze(this._config);

    // 监听内部事件
    director.once(Director.EVENT_BEFORE_SCENE_LAUNCH, this._onSceneLaunch, this);
    game.on(Game.EVENT_SHOW, this._internalResume, this);
    game.on(Game.EVENT_HIDE, this._internalPause, this);
    game.on(Game.EVENT_CLOSE, this._internalClose, this);
    game.on(Game.EVENT_LOW_MEMORY, this._internalLowMemory, this);

    // 开始工作
    this._runningInternal = true;
    this._runningLogic = true;

    Journal.Info(`🔥 ${this.app} ${this.version}_${this.build}`);
  }

  public detach(): void {
    game.off(Game.EVENT_SHOW, this._internalResume, this);
    game.off(Game.EVENT_HIDE, this._internalPause, this);
    game.off(Game.EVENT_CLOSE, this._internalClose, this);
    game.off(Game.EVENT_LOW_MEMORY, this._internalLowMemory, this);
    this.mnt = null;
    this.root = null;
    this.stage = null;
    this.canvas = null;
    this.cameraUi = null;
    this.scene = null;
    this.mod = null;
  }

  public get app(): string {
    return this._config.app;
  }

  public get version(): string {
    return this._config.version;
  }

  public get build(): Build {
    return this._config.build;
  }

  public get isDev(): boolean {
    return this.isBuild(Build.Dev);
  }

  public get isAlpha(): boolean {
    return this.isBuild(Build.Alpha);
  }

  public get isBeta(): boolean {
    return this.isBuild(Build.Beta);
  }

  public get isCandidate(): boolean {
    return this.isBuild(Build.Candidate);
  }

  public get isRelease(): boolean {
    return this.isBuild(Build.Release);
  }

  public get env(): string {
    return this._config.env;
  }

  public isBuild(build: Build): boolean {
    return this._config.build === build;
  }

  public isLanguageSupported(language: Language): boolean {
    return this._config.language.includes(language);
  }

  public get supportedLanguages(): Language[] {
    return [...this._config.language];
  }

  /** 应用退到后台 */
  private _internalPause() {
    this._runningInternal = false;
    this._timingPause = time.now();
    this.mod.dependencies.eventBus.notify(Launcher.EventType.EnterBackground);
  }

  /** 应用回到前台 */
  private _internalResume() {
    this._runningInternal = true;
    this._timingResume = time.now();
    this.mod.dependencies.eventBus.notify(Launcher.EventType.EnterForeground);
  }

  /** 应用退出 */
  private _internalClose() {
    this.mod.dependencies.eventBus.notify(Launcher.EventType.Quit);
    game.targetOff(this);
    director.targetOff(this);
  }

  /** 内存报警 */
  private _internalLowMemory() {
    this.mod.dependencies.pool.inspect(game.deltaTime);
    this.mod.dependencies.resCache.cleanup();
  }

  /** 场景启动 */
  private _onSceneLaunch(scene: Scene) {
    this.scene = scene;

    this.mnt = scene.getChildByName('mnt');
    if (!this.mnt) {
      this.mnt = new Node('mnt');
      this.mnt.layer = 0;
      this.scene.insertChild(this.mnt, 0);
    }

    this.root = scene.getChildByName('Canvas');
    this.stage = this.root.getChildByName('Stage');
    if (!this.stage) {
      this.stage = new Node('Stage');
      this.stage.layer = Layers.BitMask.UI_2D;
      this.root.insertChild(this.stage, 0);
    }

    this.canvas = this.root.getComponent(Canvas);

    this.cameraUi = this.root.getChildByName('Camera')?.getComponent(Camera);
    this.mod.dependencies.eventBus.notify(Launcher.EventType.StageReady);
  }

  public pause() {
    this._runningLogic = false;
  }

  public resume() {
    this._runningLogic = true;
  }

  public get elapsed() {
    return this._timingResume - this._timingPause;
  }

  public get running() {
    return this._runningInternal && this._runningLogic;
  }
}

/**
 * 启动器实现
 */
class Launcher extends BaseMod<LauncherAbility> implements ILauncher {
  /** 事件 */
  public static readonly EventType = {
    /** 应用进入后台 */
    EnterBackground: 'app@enter-background',
    /** 应用进入前台 */
    EnterForeground: 'app@enter-foreground',
    /** 应用退出 */
    Quit: 'app@quit',
    /** 场景启动 */
    StageReady: 'app@stage-ready',
  };
  public static readonly InitArgs: Parameters<Launcher['loadAbility']>;
  public static readonly Trait: string = 'launcher';
  declare public dependencies: ILauncher['dependencies'];

  protected loadAbility(config: Partial<ILauncherConfig>): LauncherAbility {
    return new LauncherAbility(this, config);
  }
}

export { Launcher };
