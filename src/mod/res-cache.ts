import { assetManager, js, path, Asset } from 'cc';

import { Constructor, Dict } from '../foundation/interfaces/general';
import { now } from '../foundation/time';
import { Journal } from '../journal';
import { CargoState, ICargo, IResCache, IResCacheAbility, IResCacheConfig } from './contract';
import { BaseMod } from './mod';

/**
 * 资源缓存中心错误码
 */
enum ResCacheCode {
  /** 存入错误 */
  DepositError,
  /** 丢弃错误 */
  DiscardError,
  /** 借用错误 */
  BorrowError,
  /** 归还错误 */
  ReturnError,
}

/**
 * 资源缓存中心错误
 */
class ResCacheViolationError extends Error {
  public constructor(
    public readonly code: ResCacheCode,
    public readonly uri: string,
    msg: string
  ) {
    super(msg);
  }
}

/**
 * 资源缓存中心能力实现
 */
class ResCacheAbility implements IResCacheAbility {
  private _requests: Map<string, ICargo>;
  private _cargos: Map<string, ICargo>;
  private _cid: number;
  private _depends: Map<string, string[]>;

  /**
   * @param _config 配置
   */
  public constructor(
    public mod: IResCache,
    private _config: IResCacheConfig
  ) {
    this._cid = 0;
    this._cargos = new Map();
    this._requests = new Map();
    this._depends = new Map();
  }

  public async attach(): Promise<void> {
    this._cid = this.mod.dependencies.chronos.inspector.loop(0, this._config.inspectPeriod, this.cleanup, this);
  }

  public detach(): void {
    if (this._cid > 0) {
      this.mod.dependencies.chronos.inspector.remove(this._cid);
      this._cid = 0;
    }
    this.clear();
    this._depends.clear();
    this._depends = null;
    this._cargos = null;
    this._requests = null;
    this.mod = null;
  }

  public buildDepends(uri: string, depends: string[]): void {
    this._depends.set(uri, depends);
  }

  public request<A extends Asset>(uri: string, ttl?: number): ICargo<A> {
    if (!this._requests.has(uri)) {
      ttl ??= this._config.defaultTTL;
      this._requests.set(uri, { uri, ttl, ref: 0, lastUsed: 0, state: CargoState.Idle, asset: null });
    }
    return this._requests.get(uri) as ICargo<A>;
  }

  public depositDirectly<A extends Asset>(uri: string, asset: A, ttl: number): void {
    this.request(uri, ttl);
    this.deposit(uri, asset);
  }

  public deposit<A extends Asset>(uri: string, asset: A): void {
    if (!this._requests.has(uri)) {
      throw new ResCacheViolationError(ResCacheCode.DepositError, uri, '存入流程错误，请先申请仓位');
    }

    (asset as Dict)['uri'] = uri;
    const cargo = this._requests.get(uri);
    this._cargos.set(uri, cargo);
    this._requests.delete(uri);
    cargo.asset = asset;
    cargo.lastUsed = 0;
    cargo.promise = undefined;
  }

  public discard(uri: string): void {
    if (!this.has(uri)) {
      throw new ResCacheViolationError(ResCacheCode.DiscardError, uri, `丢弃错误：不存在的资产标识 ${uri}`);
    }

    const cargo = this._cargos.get(uri);
    this._requests.delete(uri);
    this._cargos.delete(uri);
    this._depends.delete(uri);
    assetManager.releaseAsset(cargo.asset);

    Journal.Debug(`已丢弃资产 ${uri}`);
  }

  public cleanup(): void {
    const time = now();
    for (const [uri, cargo] of this._cargos) {
      if (cargo.asset && cargo.ref === 0 && cargo.lastUsed > 0 && cargo.lastUsed + cargo.ttl * 1000 < time) {
        this.discard(uri);
      }
    }
  }

  public clear(): void {
    for (const [uri] of this._cargos) {
      this.discard(uri);
    }
    this._requests.clear();
    this._cargos.clear();
  }

  public has(uri: string): boolean {
    return this._cargos.has(uri);
  }

  public get<A extends Asset>(uri: string): ICargo<A> {
    return this._cargos.get(uri) as ICargo<A>;
  }

  public getUriOf(uri: string, type: Constructor<Asset>): string {
    const [header, url] = uri.split('@');
    if (header === 'remote') {
      const typeName = js.getClassName(type);
      const ext = path.extname(url);
      switch (typeName) {
        case 'cc.BitmapFont':
          return `${uri}#bmfont`;
        case 'sp.SkeletonData':
          if (ext === '.skel') {
            return `${uri}#spineSkel`;
          } else {
            return `${uri}#spineJson`;
          }
        case 'cc.SpriteFrame':
          return `${uri}#spriteFrame`;
        case 'cc.SpriteAtlas':
          return `${uri}#spriteAtlas`;
        case 'cc.Texture2D':
          return `${uri}#texture`;
        case 'cc.AudioClip':
        case 'cc.BufferAsset':
        case 'cc.ImageAsset':
        case 'cc.JsonAsset':
        case 'cc.TextAsset':
        case 'cc.TTFFont':
        case 'cc.VideoClip':
        default:
          return uri;
      }
    }
    return uri;
  }

  public borrow<A extends Asset>(uriOrAsset: string | A): A {
    const uri = typeof uriOrAsset === 'string' ? uriOrAsset : (uriOrAsset as Dict)['uri'];

    if (!this.has(uri)) {
      throw new ResCacheViolationError(ResCacheCode.BorrowError, uri, `借用错误：不存在的资产标识 ${uri}，请先存入`);
    }

    const cargo = this._cargos.get(uri);
    cargo.ref++;
    cargo.lastUsed = now();

    const depends = this._depends.get(uri);
    if (depends) {
      depends.forEach((dep) => this.borrow(dep));
    }

    return cargo.asset as A;
  }

  public return<A extends Asset>(uriOrAsset: string | A): void {
    if (!uriOrAsset) return;

    const uri = typeof uriOrAsset === 'string' ? uriOrAsset : (uriOrAsset as Dict)['uri'];
    if (this.has(uri)) {
      const cargo = this._cargos.get(uri);
      cargo.lastUsed = now();
      cargo.ref = Math.max(0, cargo.ref - 1);

      const depends = this._depends.get(cargo.uri);
      if (depends) {
        depends.forEach((dep) => this.return(this._cargos.get(dep)?.asset));
      }
      return;
    }

    throw new ResCacheViolationError(ResCacheCode.ReturnError, uri, '归还错误：无效的资产');
  }

  public get size() {
    return this._cargos.size;
  }
}

/**
 * 资源缓存中心实现
 */
export class ResCache extends BaseMod<ResCacheAbility> implements IResCache {
  public static readonly InitArgs: Parameters<ResCache['loadAbility']>;
  public static readonly Trait: string = 'resCache';
  declare public dependencies: IResCache['dependencies'];

  /**
   * @param config 配置
   * @returns
   */
  protected loadAbility(config: IResCacheConfig): ResCacheAbility {
    return new ResCacheAbility(this, config);
  }
}
