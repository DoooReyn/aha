import {
  assetManager,
  js,
  path,
  rect,
  sp,
  __private,
  Asset,
  AudioClip,
  BitmapFont,
  BufferAsset,
  Constructor,
  ImageAsset,
  JsonAsset,
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  TTFFont,
  VideoClip,
} from 'cc';

import { dict, time, Dict, SyncOperation } from '../foundation';
import { Journal, JournalCategory } from '../journal';
import { CargoState, IResRemote, IResRemoteAbility, IResRemoteConfig } from './contract';
import { BaseMod } from './mod';

/**
 * 远程资源加载器错误码
 */
enum ResRemoteCode {
  /** 不合规的资产 */
  IllegalUri,
  /** 服务器未配置 */
  ServerAbsence,
  /** 未提供支持的资产 */
  AssetUnsupported,
  /** 实现缺位的资产 */
  ImplementationAbsence,
}

/**
 * 远程资源加载器错误
 */
class ResRemoteError extends Error {
  public constructor(
    public readonly code: ResRemoteCode,
    msg: string
  ) {
    super(msg);
  }
}

/**
 * 支持的资源类型
 */
const SUPPORTED_ASSET_TYPES: Dict = {
  ['cc.AudioClip']: true,
  ['cc.BitmapFont']: true,
  ['cc.BufferAsset']: true,
  ['cc.ImageAsset']: true,
  ['cc.JsonAsset']: true,
  ['cc.SpriteFrame']: true,
  ['cc.SpriteAtlas']: true,
  ['cc.TextAsset']: true,
  ['cc.Texture2D']: true,
  ['cc.TTFFont']: true,
  ['cc.VideoClip']: true,
  ['sp.SkeletonData']: true,
} as const;

/**
 * 远程资源加载器能力实现
 */
class ResRemoteAbility implements IResRemoteAbility {
  /** 请求参数 */
  private readonly _params: Record<string, unknown>;
  /** 开启时间戳 */
  private _timestamp: boolean;

  /**
   * @param config 配置
   */
  public constructor(
    public mod: IResRemote,
    config: IResRemoteConfig
  ) {
    this._params = Object.create(null);
    this._timestamp = config.appendTimestamp ?? false;
    (assetManager.downloader as Dict)['_remoteServerAddress'] = config.serverAddr;
  }

  public async attach(): Promise<void> {}

  public detach(): void {
    this.mod = null;
  }

  private _parseUri(uri: string, type: Constructor<Asset>) {
    const [bundle, url] = uri.split('@');
    if (!bundle || bundle !== 'remote' || !url) {
      throw new ResRemoteError(ResRemoteCode.IllegalUri, `不合规的资产标识: ${uri}`);
    }

    const ext = path.extname(url);
    const cacheUri = this.mod.dependencies.resCache.getUriOf(uri, type);
    return { uri: cacheUri, url, ext };
  }

  private _makeUrl(url: string) {
    const remoteUrl = this.getRemoteUrl();
    if (!remoteUrl || !remoteUrl.startsWith('http')) {
      throw new ResRemoteError(ResRemoteCode.ServerAbsence, '远程资源服务器地址未配置');
    }

    const params = dict.handle<typeof this._params, string>(this._params, (k, v) => `${k}=${v}`);
    if (this._timestamp) {
      params.push(`timestamp=${time.time()}`);
    }
    if (params.length) {
      return `${path.join(remoteUrl, url)}?${params.join('&')}`;
    }

    return path.join(remoteUrl, url);
  }

  private _createImageAsset(img: __private._cocos_asset_assets_image_asset__ImageSource) {
    return img instanceof ImageAsset ? img : new ImageAsset(img);
  }

  private _getAtlasName(atlas: string) {
    const matches = atlas.match(/[\w\-_]+\.png/);
    if (matches) return matches[0];
    return '';
  }

  private _parseRect(data: string) {
    const arr = data.replace(/[{}]/g, '').split(',').map(parseFloat) as [number, number, number, number];
    return rect(...arr);
  }

  private async _loadAudio(data: { uri: string; url: string; ttl: number }) {
    return new Promise<AudioClip>((res) => {
      const { url } = data;
      const fullUrl = this._makeUrl(url);
      assetManager.loadAny({ url: fullUrl }, { __isNative__: true }, (err, nativeAsset) => {
        if (err) Journal.Acquire(JournalCategory.ASSET).error(`远程资源加载失败: ${fullUrl}`);
        if (nativeAsset) {
          const asset = new AudioClip();
          asset._nativeAsset = nativeAsset;
          return res(asset);
        }
        return res(null);
      });
    });
  }

  private async _loadBitmapFont(data: { uri: string; url: string; ttl: number }) {
    const { uri, url, ttl } = data;
    const ext = path.extname(url);
    const jsonUrl = uri.replace(ext, '.json');
    const imageUrl = uri.replace(ext, '.png');
    const [jsonAsset, frameAsset] = await Promise.all([
      this.load(jsonUrl, JsonAsset, ttl),
      this.load(imageUrl, SpriteFrame, ttl),
    ]);

    if (jsonAsset && frameAsset) {
      this.mod.dependencies.resCache.buildDepends(uri, [(jsonAsset as Dict)['uri'], (frameAsset as Dict)['uri']]);
      const asset = new BitmapFont();
      asset.fntConfig = jsonAsset.json;
      asset.spriteFrame = frameAsset;
      return asset;
    }

    return null;
  }

  private async _loadBuffer(data: { uri: string; url: string; ttl: number }) {
    return new Promise<BufferAsset>((res) => {
      const { url } = data;
      const fullUrl = this._makeUrl(url);
      assetManager.loadAny({ url: fullUrl }, { __isNative__: true }, (err, nativeAsset) => {
        if (err) Journal.Acquire(JournalCategory.ASSET).error(`远程资源加载失败: ${fullUrl}`);
        if (nativeAsset) {
          const asset = new BufferAsset();
          asset._nativeAsset = nativeAsset;
          return res(asset);
        }
        return res(null);
      });
    });
  }

  private async _loadImage(data: { uri: string; url: string; ttl: number }) {
    return new Promise<ImageAsset>((res) => {
      const { url } = data;
      const fullUrl = this._makeUrl(url);
      assetManager.loadAny({ url: fullUrl }, { __isNative__: true }, (err, nativeAsset) => {
        if (err) Journal.Acquire(JournalCategory.ASSET).error(`远程资源加载失败: ${fullUrl}`);
        if (nativeAsset) {
          const asset = this._createImageAsset(nativeAsset);
          asset._nativeAsset = nativeAsset;
          return res(asset);
        }
        return res(null);
      });
    });
  }

  private async _loadJson(data: { uri: string; url: string; ttl: number }) {
    return new Promise<JsonAsset>((res) => {
      const { url } = data;
      const fullUrl = this._makeUrl(url);
      assetManager.loadAny({ url: fullUrl }, { __isNative__: true }, (err, nativeAsset) => {
        if (err) Journal.Acquire(JournalCategory.ASSET).error(`远程资源加载失败: ${fullUrl}`);
        if (nativeAsset) {
          const asset = new JsonAsset();
          asset.json = nativeAsset;
          asset._nativeAsset = nativeAsset;
          return res(asset);
        }
        return res(null);
      });
    });
  }

  private async _loadSpineJson(data: { uri: string; url: string; ttl: number }) {
    const { uri, ttl } = data;
    const ext = path.extname(uri);
    const imageUrl = uri.replace(ext, '.png');
    const atlasUrl = uri.replace(ext, '.atlas');
    const dataUrl = uri.replace(ext, '.json');
    const [textureAsset, atlasAsset, jsonAsset] = await Promise.all([
      this.load(imageUrl, Texture2D, ttl),
      this.load(atlasUrl, TextAsset, ttl),
      this.load(dataUrl, JsonAsset, ttl),
    ]);

    if (textureAsset && atlasAsset && jsonAsset) {
      this.mod.dependencies.resCache.buildDepends(uri, [
        (textureAsset as Dict)['uri'],
        (atlasAsset as Dict)['uri'],
        (jsonAsset as Dict)['uri'],
      ]);
      const asset = new sp.SkeletonData();
      asset.skeletonJson = jsonAsset.json as sp.spine.SkeletonJson;
      asset.atlasText = atlasAsset.text;
      asset.textures = [textureAsset];
      asset.textureNames = [this._getAtlasName(atlasAsset.text)];
      return asset;
    }

    return null;
  }

  private async _loadSpineSkel(data: { uri: string; url: string; ttl: number }) {
    const { uri, ttl } = data;
    const ext = path.extname(uri);
    const imageUrl = uri.replace(ext, '.png');
    const atlasUrl = uri.replace(ext, '.atlas');
    const dataUrl = uri.replace(ext, '.skel');
    const [textureAsset, atlasAsset, skelAsset] = await Promise.all([
      this.load(imageUrl, Texture2D, ttl),
      this.load(atlasUrl, TextAsset, ttl),
      this.load(dataUrl, BufferAsset, ttl),
    ]);

    if (textureAsset && atlasAsset && skelAsset) {
      this.mod.dependencies.resCache.buildDepends(uri, [
        (textureAsset as Dict)['uri'],
        (atlasAsset as Dict)['uri'],
        (skelAsset as Dict)['uri'],
      ]);
      const asset = new sp.SkeletonData();
      asset._nativeAsset = skelAsset.buffer();
      asset.atlasText = atlasAsset.text;
      asset.textures = [textureAsset];
      asset.textureNames = [this._getAtlasName(atlasAsset.text)];
      return asset;
    }

    return null;
  }

  private async _loadSpriteAtlas(data: { uri: string; url: string; ttl: number }) {
    const { uri, url, ttl } = data;
    const ext = path.extname(url);
    const imageUrl = uri.replace(ext, '.png');
    const atlasUrl = uri.replace(ext, '.plist');
    const [textureAsset, jsonAsset] = await Promise.all([
      this.load(imageUrl, Texture2D, ttl),
      this.load(atlasUrl, JsonAsset, ttl),
    ]);

    if (textureAsset && jsonAsset) {
      const cache = this.mod.dependencies.resCache;
      cache.buildDepends(uri, [(textureAsset as Dict)['uri'], (jsonAsset as Dict)['uri']]);

      const asset = new SpriteAtlas();
      const frames: Record<string, SpriteFrame> = {};
      asset.spriteFrames = frames;

      dict.each(jsonAsset.json.frames, (k, info) => {
        const frame = new SpriteFrame();
        const frameUuid = `${uri}#${k as string}`;
        frame.texture = textureAsset;
        frame.atlasUuid = uri;
        if (info.textureRect) {
          frame.rect = this._parseRect(info.textureRect);
        } else if (info.frame) {
          frame.rect = rect(info.frame.x, info.frame.y, info.frame.w, info.frame.h);
        } else {
          frame.rect = rect(info.x, info.y, info.w, info.h);
        }
        frames[k as string] = frame;
        cache.depositDirectly(frameUuid, frame, ttl);
        cache.buildDepends(frameUuid, [uri]);
      });

      return asset;
    }

    return null;
  }

  private async _loadSpriteFrame(data: { uri: string; url: string; ttl: number }) {
    const { uri, ttl } = data;
    const textureAsset = await this.load(uri, Texture2D, ttl);
    if (!textureAsset) return null;

    const asset = new SpriteFrame();
    asset.texture = textureAsset;

    this.mod.dependencies.resCache.buildDepends(uri, [(textureAsset as Dict)['uri']]);

    return asset;
  }

  private async _loadText(data: { uri: string; url: string; ttl: number }) {
    return new Promise<TextAsset>((res) => {
      const { url } = data;
      const fullUrl = this._makeUrl(url);
      assetManager.loadAny({ url: fullUrl }, { __isNative__: true }, (err, nativeAsset) => {
        if (err) Journal.Acquire(JournalCategory.ASSET).error(`远程资源加载失败: ${fullUrl}`);
        if (nativeAsset) {
          const asset = new TextAsset();
          asset.text = nativeAsset;
          asset._nativeAsset = nativeAsset;
          return res(asset);
        }
        return res(null);
      });
    });
  }

  private async _loadTTFFont(data: { uri: string; url: string; ttl: number }) {
    return new Promise<TTFFont>((res) => {
      const { url } = data;
      const fullUrl = this._makeUrl(url);
      assetManager.loadAny({ url: fullUrl }, { __isNative__: true }, (err, nativeAsset) => {
        if (err) Journal.Acquire(JournalCategory.ASSET).error(`远程资源加载失败: ${fullUrl}`);
        if (nativeAsset) {
          const asset = new TTFFont();
          asset._nativeAsset = nativeAsset;
          return res(asset);
        }
        return res(null);
      });
    });
  }

  private async _loadTexture(data: { uri: string; url: string; ttl: number }) {
    const { uri, ttl } = data;
    const imageAsset = await this.load(uri, ImageAsset, ttl);
    if (!imageAsset) return null;

    const asset = new Texture2D();
    asset.image = imageAsset;

    this.mod.dependencies.resCache.buildDepends(uri, [(imageAsset as Dict)['uri']]);

    return asset;
  }

  private async _loadVideo(data: { uri: string; url: string; ttl: number }) {
    return new Promise<VideoClip>((res) => {
      const { url } = data;
      const fullUrl = this._makeUrl(url);
      assetManager.loadAny({ url: fullUrl }, { __isNative__: true }, (err, nativeAsset) => {
        if (err) Journal.Acquire(JournalCategory.ASSET).error(`远程资源加载失败: ${fullUrl}`);
        if (nativeAsset) {
          const asset = new VideoClip();
          asset._nativeAsset = nativeAsset;
          return res(asset);
        }
        return res(null);
      });
    });
  }

  public setTimestampEnabled(enabled: boolean) {
    this._timestamp = enabled;
  }

  public getRemoteUrl(): string {
    return assetManager.downloader.remoteServerAddress;
  }

  public setServerUrl(url: string) {
    (assetManager.downloader as Dict)['_remoteServerAddress'] = url;
  }

  public addRequestParams(args: Record<string, string>) {
    dict.merge(this._params, args);
  }

  public async load<A extends Asset>(
    uri: string,
    type: Constructor<A>,
    ttl?: number,
    hook?: SyncOperation
  ): Promise<A> {
    const typeName = js.getClassName(type);
    if (!SUPPORTED_ASSET_TYPES[typeName]) {
      throw new ResRemoteError(ResRemoteCode.AssetUnsupported, `资产支持缺位: ${uri}<${typeName}>`);
    }

    const { uri: cacheUri, url, ext } = this._parseUri(uri, type);
    const cache = this.mod.dependencies.resCache;
    const cargo = cache.get<A>(cacheUri) || cache.request<A>(cacheUri, ttl);

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

    const data = { uri, url, ttl };

    switch (typeName) {
      case 'cc.AudioClip':
        cargo.promise = this._loadAudio(data) as unknown as Promise<A>;
        break;
      case 'cc.BitmapFont':
        cargo.promise = this._loadBitmapFont(data) as unknown as Promise<A>;
        break;
      case 'cc.BufferAsset':
        cargo.promise = this._loadBuffer(data) as unknown as Promise<A>;
        break;
      case 'cc.ImageAsset':
        cargo.promise = this._loadImage(data) as unknown as Promise<A>;
        break;
      case 'cc.JsonAsset':
        cargo.promise = this._loadJson(data) as unknown as Promise<A>;
        break;
      case 'sp.SkeletonData':
        if (ext === '.skel') {
          cargo.promise = this._loadSpineSkel(data) as unknown as Promise<A>;
        } else {
          cargo.promise = this._loadSpineJson(data) as unknown as Promise<A>;
        }
        break;
      case 'cc.SpriteFrame':
        cargo.promise = this._loadSpriteFrame(data) as unknown as Promise<A>;
        break;
      case 'cc.SpriteAtlas':
        cargo.promise = this._loadSpriteAtlas(data) as unknown as Promise<A>;
        break;
      case 'cc.TextAsset':
        cargo.promise = this._loadText(data) as unknown as Promise<A>;
        break;
      case 'cc.Texture2D':
        cargo.promise = this._loadTexture(data) as unknown as Promise<A>;
        break;
      case 'cc.TTFFont':
        cargo.promise = this._loadTTFFont(data) as unknown as Promise<A>;
        break;
      case 'cc.VideoClip':
        cargo.promise = this._loadVideo(data) as unknown as Promise<A>;
        break;
    }

    if (cargo.promise === undefined) {
      throw new ResRemoteError(ResRemoteCode.ImplementationAbsence, `资产实现缺位: ${uri}<${typeName}>`);
    }

    const asset = await cargo.promise;
    if (asset) {
      cargo.state = CargoState.Loaded;
      cache.deposit(cacheUri, asset);
    } else {
      cargo.state = CargoState.Error;
      cargo.promise = undefined;
    }
    hook?.();
    return Promise.resolve(asset);
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
 * 远程资源加载器实现
 */
export class ResRemote extends BaseMod<ResRemoteAbility> implements IResRemote {
  public static readonly InitArgs: Parameters<ResRemote['loadAbility']>;
  public static readonly Trait: string = 'resRemote';
  declare public dependencies: IResRemote['dependencies'];

  /**
   * @param config 配置
   * @returns
   */
  protected loadAbility(config: IResRemoteConfig): ResRemoteAbility {
    return new ResRemoteAbility(this, config);
  }
}
