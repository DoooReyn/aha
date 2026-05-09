import { Node } from 'cc';

import { ioc } from '../../ioc';
import { Journal } from '../../journal';
import { IGuiExclusive, IGuiRegistry, IGuiView } from '../contract';
import { TRAIT } from '../trait';
import { GuiContainer } from './gui-container';

/**
 * 抢占式视图容器
 *
 * - 同时只能展示一个视图
 */
class GuiExclusive extends GuiContainer implements IGuiExclusive {
  /** 当前视图 */
  private _current: IGuiView;

  /**
   * @param carrier 载体（容器）
   */
  public constructor(public readonly carrier: Node) {
    super();
    this._current = null;
  }

  public async open(ui: string, data?: unknown): Promise<void> {
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    if (this._current) {
      if (this._current.ui === ui) {
        Journal.Warn(`视图 ${ui} 已经打开，请勿重复此操作`);
        return;
      }

      await this.detach(this._current, false);
      this._current = null;
    }

    const node = await registry.open(ui);
    if (node) {
      const config = registry.getUiConfig(ui);
      this.carrier.addChild(node);
      this._current = await this.attach(node, config, data);
    }
  }

  public async close(): Promise<void> {
    if (this._current) {
      await this.detach(this._current, false);
      this._current = null;
    }
  }

  public async purge(): Promise<void> {
    if (this._current) {
      const current = this._current;
      this._current = null;
      await this.detach(current, true);
    }
  }

  public get top() {
    return this._current;
  }
}

export { GuiExclusive };
