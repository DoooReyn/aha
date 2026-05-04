import { assetManager, js, Asset, AssetManager, Constructor } from 'cc';

import { SyncOperation } from '../foundation';
import { Journal } from '../journal';
import { CargoState, IResDynamic, IResDynamicAbility } from './contract';
import { BaseMod } from './mod';

/**
 * 动态资源加载器错误码
 */
enum ResDynamicCode {
  /** 不合规的资产标识 */
  IllegalUri,
}

/**
 * 动态资源加载器错误
 */
class ResDynamicError extends Error {
  public constructor(
    public readonly code: ResDynamicCode,
    msg: string
  ) {
    super(msg);
  }
}

/**
 * 动态资源加载器能力实现
 */
class ResDynamicAbility implements IResDynamicAbility {
  public constructor(public mod: IResDynamic) {}

  public async attach(): Promise<void> {}

  public detach(): void {
    this.mod = null;
  }

  private _parseUri(uri: string, type: Constructor<Asset>) {
    const [bundle, path] = uri.split('@');
    if (!bundle || bundle === 'remote' || !path) {
      throw new ResDynamicError(ResDynamicCode.IllegalUri, `不合规的资产标识: ${uri}`);
    }

    const typeName = js.getClassName(type);
    if ('cc.Texture2D' === typeName) {
      return { bundle, path: `${path}/texture` };
    } else if ('cc.SpriteFrame' === typeName) {
      return { bundle, path: `${path}/spriteFrame` };
    }
    return { bundle, path };
  }

  private async _loadBundle(bundle: string): Promise<AssetManager.Bundle> {
    const bun = assetManager.getBundle(bundle);
    if (bun) {
      return Promise.resolve(bun);
    }

    return new Promise<AssetManager.Bundle>((res) => {
      assetManager.loadBundle(bundle, (err, bun) => {
        if (err) Journal.Error(`加载资源包失败: ${bundle}`, err);
        res(bun);
      });
    });
  }

  public async preload<A extends Asset>(uri: string, type: Constructor<A>, hook?: SyncOperation): Promise<void> {
    const { bundle, path } = this._parseUri(uri, type);
    const bun = await this._loadBundle(bundle);
    if (!bun) {
      hook?.();
      return Promise.resolve();
    }

    return new Promise<void>((res) => {
      bun.preload(path, (err) => {
        if (err) Journal.Error(`预加载资源失败: ${uri}`, err);
        hook?.();
        res();
      });
    });
  }

  public async preloadBatch(items: [uri: string, type: Constructor<Asset>][], hook?: SyncOperation): Promise<void[]> {
    return Promise.all(items.map((item) => this.preload(...item, hook)));
  }

  public async preloadDir<A extends Asset>(uri: string, type: Constructor<A>, hook?: SyncOperation): Promise<void[]> {
    const { bundle, path } = this._parseUri(uri, type);
    const bun = await this._loadBundle(bundle);
    if (!bun) {
      hook?.();
      return Promise.resolve([]);
    }

    return new Promise<void[]>((res) => {
      bun.preloadDir(path, (err, items) => {
        if (err) Journal.Error(`预加载资源失败: ${uri}`, err);
        hook?.();
        res(items as unknown as void[]);
      });
    });
  }

  public async load<A extends Asset>(
    uri: string,
    type: Constructor<A>,
    ttl?: number,
    hook?: SyncOperation
  ): Promise<A> {
    const { bundle, path } = this._parseUri(uri, type);
    const bun = await this._loadBundle(bundle);
    if (!bun) {
      hook?.();
      return Promise.resolve(null);
    }

    const cacheUri = `${bundle}@${path}`;
    const cache = this.mod.dependencies.resCache;
    const cargo = cache.get<A>(cacheUri) || cache.request<A>(uri, ttl);

    if (cargo.state === CargoState.Error) {
      hook?.();
      return Promise.resolve(null);
    }

    if (cargo.state === CargoState.Loaded && cargo.asset) {
      hook?.();
      return Promise.resolve(cargo.asset as A);
    }

    if (cargo.state === CargoState.Loading) {
      return await cargo.promise;
    }

    cargo.state = CargoState.Loading;
    return (cargo.promise = new Promise<A>((res) => {
      bun.load(path, type, (err, item) => {
        if (err) {
          cargo.state = CargoState.Error;
          cargo.promise = undefined;
          hook?.();
          res(null);
        } else {
          cargo.state = CargoState.Loaded;
          cache.deposit(cacheUri, item);
          hook?.();
          res(item);
        }
      });
    }));
  }

  public async loadDir<A extends Asset>(
    uri: string,
    type: Constructor<A>,
    ttl?: number,
    hook?: SyncOperation
  ): Promise<A[]> {
    const { bundle, path: dir } = this._parseUri(uri, type);
    const bun = await this._loadBundle(bundle);
    if (!bun) {
      hook?.();
      return Promise.resolve([]);
    }
    return Promise.all(bun.getDirWithPath(dir, type).map((v) => this.load(`${bundle}@${v.path}`, type, ttl, hook)));
  }

  public async loadBatch(
    items: [uri: string, type: Constructor<Asset>, ttl?: number][],
    hook?: SyncOperation
  ): Promise<Asset[]> {
    return Promise.all(items.map((item) => this.load(...item, hook)));
  }

  public async loadQueue(
    items: [uri: string, type: Constructor<Asset>, ttl?: number][],
    hook?: SyncOperation
  ): Promise<void> {
    for (const item of items) {
      await this.load(...item, hook);
    }
    return Promise.resolve();
  }
}

/**
 * 动态资源加载器实现
 */
export class ResDynamic extends BaseMod<ResDynamicAbility> implements IResDynamic {
  public static readonly InitArgs: Parameters<ResDynamic['loadAbility']>;
  public static readonly Trait: string = 'resDynamic';
  declare public dependencies: IResDynamic['dependencies'];

  protected loadAbility(): ResDynamicAbility {
    return new ResDynamicAbility(this);
  }
}
