import { Node } from 'cc';

import { Dict } from '../../foundation';
import { ioc } from '../../ioc';
import { Journal } from '../../journal';
import { IGuiExclusive, IGuiRegistry, IGuiView } from '../contract';
import { TRAIT } from '../trait';

/**
 * 抢占式视图容器
 *
 * - 同时只能展示一个视图
 */
class UiExclusive implements IGuiExclusive {
  /** 当前视图 */
  private _current: IGuiView;

  /**
   * @param _carrier 载体（容器）
   */
  public constructor(private readonly _carrier: Node) {
    this._current = null;
  }

  public async open(ui: string, data?: unknown): Promise<void> {
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    if (this._current) {
      if (this._current.ui === ui) {
        Journal.Warn(`视图 ${ui} 已经打开，请勿重复此操作`);
        return;
      }

      registry.close(this._current.ui, this._current);
      this._current = null;
    }

    const node = await registry.open(ui);
    if (node) {
      const config = registry.getUiConfig(ui);
      this._carrier.addChild(node);

      const current = (this._current = node.acquire(config.view));
      const container = node as Dict;
      current.ui = container['ui'];
      current.uiid = container['uiid'];
      current.config = config;
      current.onInit(data);
      // await (config.enterTweener, current)
      current.onEnter();
    }
  }

  public async close(): Promise<void> {
    if (this._current) {
      const current = this._current;
      //  await (current.config.exitTweener, current)
      current.onExit();
      ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY).close(current.ui, current);
      this._current = null;
    }
  }
  public purge(): void {
    if (this._current) {
      const current = this._current;
      current.onExit();
      ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY).close(current.ui, current);
      this._current = null;
    }
  }
}

export { UiExclusive };
