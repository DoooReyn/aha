import { js, Node } from 'cc';

import { list, Dict } from '../../foundation';
import { ioc } from '../../ioc';
import { Journal } from '../../journal';
import { IGuiOverlap, IGuiRegistry, IGuiView } from '../contract';
import { TRAIT } from '../trait';

/**
 * 深度队列式视图容器
 *
 * - 可以同时显示多个
 * - 支持最大深度限制，超过限制自动出列
 * - 不存在优先级，先调用先展示
 */
class GuiOverlap implements IGuiOverlap {
  /** 视图队列 */
  private _overlap: IGuiView[];
  /** 加载中的视图 */
  private _loading: Map<string, string>;
  /** 编号生成器 */
  private _idg: js.IDGenerator;

  public constructor(
    private readonly _carrier: Node,
    public readonly maxDepth: number
  ) {
    this._overlap = [];
    this._loading = new Map();
    this._idg = new js.IDGenerator(`overlap_${this._carrier.name}`);
  }

  public async enqueue(ui: string, data?: number): Promise<void> {
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const config = registry.getUiConfig(ui);
    const id = this._idg.getNewId();
    this._loading.set(id, ui);

    const node = await registry.open(ui);
    if (node) {
      // 检查是否触发深度限制
      const depth = this.depth + this._loading.size;
      const maxDepth = this.maxDepth;
      if (maxDepth > 0 && depth >= maxDepth) {
        const old = this._overlap.shift();
        Journal.Warn(`触发最大深度限制，${old.ui} 将被关闭`);
        // @todo await playExitTweener(old, config.exitTweener);
        old.onExit();
        registry.close(old.ui, old);
      }

      // 添加到队列
      this._carrier.addChild(node);
      const next = node.acquire(config.view);
      const container = node as Dict;
      next.ui = container['ui'];
      next.uiid = container['uiid'];
      next.config = config;
      next.onInit(data);
      // @todo await playEnterTweener(next, config.enterTweener);
      next.onEnter();
      this._overlap.push(next);
    }
    this._loading.delete(id);
  }

  public purge(): void {
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const overlap = this._overlap.slice();
    this._overlap.length = 0;
    list.each(
      overlap,
      (view) => {
        view.onExit();
        registry.close(view.ui, view);
      },
      true
    );
  }

  public get depth(): number {
    return this._overlap.length;
  }
}

export { GuiOverlap };
