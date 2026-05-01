import { sys } from 'cc';

import { access } from '../foundation/access';
import { Journal } from '../journal';
import { Build, ILauncher, ILauncherAbility, ILauncherConfig, Language } from './contract/launcher';
import { BaseMod } from './mod';

/**
 * 启动器奥术实现
 */
class LauncherAbility implements ILauncherAbility {
  /** 启动参数 */
  private readonly _config: ILauncherConfig;

  public constructor(
    public mod: ILauncher,
    config: Partial<ILauncherConfig>
  ) {
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
    Journal.Info(`🔥 ${this.app} ${this.version}_${this.build}`);
  }

  public detach(): void {
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
}

/**
 * 启动器实现
 */
class Launcher extends BaseMod<LauncherAbility> implements ILauncher {
  public static readonly Parameters: Parameters<Launcher['loadAbility']>;
  public static readonly Trait: string = 'launcher';

  protected loadAbility(config: Partial<ILauncherConfig>): LauncherAbility {
    return new LauncherAbility(this, config);
  }
}

export { Launcher };
