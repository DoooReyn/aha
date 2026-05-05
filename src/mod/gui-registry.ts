import { instantiate, js, Node, Prefab } from 'cc';

import { time, Dict } from '../foundation';
import { Journal } from '../journal';
import { IGuiManifest, IGuiRegistry, IGuiRegistryAbility, IGuiView } from './contract';
import { BaseMod } from './mod';

/**
 * 用户界面登记簿能力实现
 */
class GuiRegistryAbility implements IGuiRegistryAbility {
  /** 视图缓存 */
  private _caches: Map<string, IGuiView[]>;
  /** 视图异步加载对象 */
  private _promises: Map<string, [promise: Promise<Node>, aborted: boolean]>;
  /** 编号生成器 */
  private _idg: js.IDGenerator;

  /**
   * @param _manifest 视图配置清单
   */
  public constructor(
    public mod: IGuiRegistry,
    private _manifest: IGuiManifest
  ) {
    this._caches = new Map();
    this._promises = new Map();
    this._idg = new js.IDGenerator('scenery');
  }

  public async attach(): Promise<void> {}

  public detach(): void {
    this.purge();
    this._manifest = null;
    this._promises.clear();
    this._idg = null;
  }

  public bindManifest(manifest: IGuiManifest) {
    this._manifest = manifest;
  }

  public getUiConfig(ui: string) {
    return this._manifest[ui];
  }

  public async open(ui: string): Promise<Node> {
    if (!this._manifest) {
      Journal.Warn('请先绑定视图配置清单');
      return null;
    }

    const config = this._manifest[ui];
    if (!config) {
      Journal.Warn(`未找到 ${ui} 视图配置`);
      return null;
    }

    const { uri, maxInstances } = config;
    const max = maxInstances ?? 1;
    const instances = this._caches.get(ui)?.length ?? 0;

    // 验证是否单例
    if (max === 1 && instances > 0) {
      Journal.Warn(`视图 ${ui} 不允许重复打开`);
      return null;
    }

    // 从缓存中找
    if (this._caches.has(ui)) {
      const items = this._caches.get(ui);
      const count = items.length;
      if (count > 0) {
        const node = items.shift().node;
        delete (node as Dict)['cacheAt'];
        if (count === 1) this._caches.delete(ui);
        return node;
      }
    }

    // 从加载中找
    if (this._promises.has(ui)) {
      Journal.Warn(`视图 ${ui} 加载中，请稍候`);
      return this._promises.get(ui)[0];
    }

    // 从本地加载
    const cache = this.mod.dependencies.resCache;
    const dynamic = this.mod.dependencies.resDynamic;
    const promise = new Promise<Node>(async (res) => {
      const prefab = await dynamic.load(uri, Prefab);
      const aborted = this._promises.get(ui)[1];
      this._promises.delete(ui);

      if (aborted) {
        Journal.Warn(`视图 ${ui} 加载被中断`);
        return res(null);
      }

      if (!prefab) {
        Journal.Warn(`加载 ${ui} 视图资产失败`);
        return res(null);
      }

      const node = instantiate(prefab);
      const container = node as Dict;
      container['ui'] = ui;
      container['uiid'] = this._idg.getNewId();
      cache.borrow(prefab);

      return res(node);
    });
    this._promises.set(ui, [promise, false]);

    return promise;
  }

  public close(ui: string, view: IGuiView): void {
    if (ui !== view.ui) {
      Journal.Warn(`视图不匹配: ${ui} != ${view.ui}`);
      return;
    }

    if (!view.isValid) {
      Journal.Warn(`视图 ${ui} 已失效`);
      return;
    }

    const cacheAt = (view.node as Dict)['cacheAt'];
    if (cacheAt !== undefined) {
      Journal.Warn(`视图 ${ui} 已缓存，请勿重复缓存`);
      return;
    }

    const cache = this.mod.dependencies.resCache;
    const { uptime, maxInstances, uri } = view.config;
    const max = maxInstances ?? 1;
    if (uptime <= 0 || max <= 0) {
      view.node.destroy();
      cache.return(uri);
      Journal.Info(`视图 ${ui} 不缓存，立即销毁`);
      return;
    }

    const instances = this._caches.get(ui)?.length ?? 0;
    if (instances >= max) {
      view.node.destroy();
      cache.return(uri);
      Journal.Info(`视图 ${ui} 已触发缓存上限，立即销毁`);
      return;
    }

    view.node.removeFromParent();
    (view.node as Dict)['cacheAt'] = time.now();
    if (this._caches.has(ui)) {
      this._caches.get(ui).push(view);
    } else {
      this._caches.set(ui, [view]);
    }
  }

  public purge(): void {
    const cache = this.mod.dependencies.resCache;

    // 中断正在加载中的
    for (const [, promise] of this._promises) {
      promise[1] = true;
    }

    // 清空已缓存的
    for (const [, items] of this._caches) {
      for (const item of items) {
        cache.return(item.config.uri);
        item.destroy();
      }
    }
    this._caches.clear();
  }

  public get size() {
    let size = 0;
    for (const [, items] of this._caches) {
      size += items.length;
    }
    return size;
  }
}

/**
 * 用户界面登记簿实现
 */
class GuiRegistry extends BaseMod<GuiRegistryAbility> implements IGuiRegistry {
  public static readonly InitArgs: Parameters<GuiRegistry['loadAbility']>;
  public static readonly Trait: string = 'guiRegistry';
  declare public dependencies: IGuiRegistry['dependencies'];

  protected loadAbility(manifest: IGuiManifest): GuiRegistryAbility {
    return new GuiRegistryAbility(this, manifest);
  }
}

export { GuiRegistry };
