import { js, view, Layers, Node, UITransform, Widget } from 'cc';

import { ioc } from '../../../ioc';
import { Journal } from '../../../journal';
import { GuiLayers, IGuiAgent, IGuiRegistry, IGuiView } from '../../contract';
import { TRAIT } from '../../trait';
import { GuiAgentBase } from './gui-agent';

class GuiOverlapAgent extends GuiAgentBase implements IGuiAgent {
  public readonly carrier: Node;
  public readonly layer: GuiLayers;
  public readonly maxDepth: number;
  /** 视图队列 */
  private _overlap: IGuiView[];
  /** 加载中的视图 */
  private _loading: Map<string, string>;
  /** 编号生成器 */
  private _idg: js.IDGenerator;

  public constructor(root: Node, layer: GuiLayers, maxDepth: number) {
    super(root);

    const name = GuiLayers[layer];
    const carrier = new Node(name);
    const uit = carrier.addComponent(UITransform);
    const wit = carrier.addComponent(Widget);

    carrier.layer = Layers.BitMask.UI_2D;
    uit.setContentSize(view.getVisibleSize());
    wit.left = wit.right = wit.top = wit.bottom = 0;
    wit.isAlignLeft = wit.isAlignRight = wit.isAlignTop = wit.isAlignBottom = true;
    wit.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    wit.target = root;
    root.insertChild(carrier, layer + 1);

    this.carrier = carrier;
    this.layer = layer;
    this.maxDepth = maxDepth;
    this._overlap = [];
    this._loading = new Map();
    this._idg = new js.IDGenerator(`overlap_${name}`);
  }

  public async open(ui: string, data: unknown): Promise<void> {
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const config = registry.getUiConfig(ui);
    const id = this._idg.getNewId();
    this._loading.set(id, ui);

    const node = await registry.open(ui);
    if (node) {
      // 检查是否触发深度限制
      const depth = this.size + this._loading.size;
      const maxDepth = this.maxDepth;
      if (maxDepth > 0 && depth > maxDepth) {
        const old = this._overlap.shift();
        Journal.Warn(`触发最大深度限制，${old.ui} 将被关闭`);
        await this.detach(old, true);
      }

      // 添加到队列
      const next = await this.attach(this.carrier, node, config, data);
      this._overlap.push(next);
    }
    this._loading.delete(id);
  }

  public async back(): Promise<void> {
    if (this.checkOperating(`back()`)) {
      return;
    }

    const depth = this.size;
    if (depth > 0) {
      this.operating = true;
      const view = this._overlap.pop();
      await this.detach(view, false);
      this.operating = false;
    }
  }

  public async purge(): Promise<void> {
    if (this.checkOperating(`purge()`)) {
      return;
    }

    this.operating = true;
    const overlap = this._overlap.slice();
    this._overlap.length = 0;
    for (let i = overlap.length - 1; i >= 0; i--) {
      await this.detach(overlap[i], true);
    }
    this.operating = false;
  }

  public get top(): IGuiView<{}> {
    return this._overlap[this._overlap.length - 1];
  }

  public get size(): number {
    return this._overlap.length;
  }
}

export { GuiOverlapAgent };
