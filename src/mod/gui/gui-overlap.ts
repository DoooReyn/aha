import { js, Node } from 'cc';

import { ioc } from '../../ioc';
import { Journal } from '../../journal';
import { IGuiOverlap, IGuiRegistry, IGuiView } from '../contract';
import { TRAIT } from '../trait';
import { GuiContainer } from './gui-container';

/**
 * 深度队列式视图容器
 *
 * - 可以同时显示多个
 * - 支持最大深度限制，超过限制自动出列
 * - 不存在优先级，先调用先展示
 */
class GuiOverlap extends GuiContainer implements IGuiOverlap {
  /** 视图队列 */
  private _overlap: IGuiView[];
  /** 加载中的视图 */
  private _loading: Map<string, string>;
  /** 编号生成器 */
  private _idg: js.IDGenerator;

  public constructor(
    public readonly carrier: Node,
    public readonly maxDepth: number
  ) {
    super();
    this._overlap = [];
    this._loading = new Map();
    this._idg = new js.IDGenerator(`overlap_${this.carrier.name}`);
  }

  public async open(ui: string, data?: unknown): Promise<void> {
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
        await this.detach(old, true);
      }

      // 添加到队列
      this.carrier.addChild(node);
      const next = await this.attach(node, config, data);
      this._overlap.push(next);
    }
    this._loading.delete(id);
  }

  public async close() {
    const depth = this.depth;
    if (depth > 0) {
      const view = this._overlap.pop();
      await this.detach(view, false);
    }
  }

  public get top() {
    return this._overlap[this._overlap.length - 1];
  }

  public async purge(): Promise<void> {
    const overlap = this._overlap.slice();
    this._overlap.length = 0;
    for (let i = overlap.length - 1; i >= 0; i--) {
      await this.detach(overlap[i], true);
    }
  }

  public get depth(): number {
    return this._overlap.length;
  }
}

export { GuiOverlap };
