import { view, Layers, Node, UITransform, Widget } from 'cc';

import { ioc } from '../../../ioc';
import { Journal } from '../../../journal';
import { GuiLayers, IGuiAgent, IGuiRegistry, IGuiView } from '../../contract';
import { TRAIT } from '../../trait';
import { GuiAgentBase } from './gui-agent';

class GuiExclusiveAgent extends GuiAgentBase implements IGuiAgent {
  public readonly carrier: Node;
  public readonly layer: GuiLayers;
  private _current: IGuiView;

  public constructor(root: Node, layer: GuiLayers) {
    super(root);

    const carrier = new Node(GuiLayers[layer]);
    const uit = carrier.addComponent(UITransform);
    const wit = carrier.addComponent(Widget);

    carrier.layer = Layers.BitMask.UI_2D;
    uit.setContentSize(view.getVisibleSize());
    wit.left = wit.right = wit.top = wit.bottom = 0;
    wit.isAlignLeft = wit.isAlignRight = wit.isAlignTop = wit.isAlignBottom = true;
    wit.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    wit.target = root;
    root.insertChild(carrier, layer + 1);

    this.layer = layer;
    this.carrier = carrier;
    this._current = null;
  }

  public async open(ui: string, data: unknown): Promise<void> {
    if (this.checkOperating(`open(${ui})`)) {
      return;
    }

    if (this._current) {
      if (this._current.ui === ui) {
        Journal.Warn(`视图 ${ui} 已经打开，请勿重复此操作`);
        return;
      }

      await this.detach(this._current, false);
      this._current = null;
    }

    this.operating = true;
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const node = await registry.open(ui);
    if (node) {
      const config = registry.getUiConfig(ui);
      this._current = await this.attach(this.carrier, node, config, data);
    }
    this.operating = false;
  }

  public async back(): Promise<void> {
    if (this.checkOperating(`back()`)) {
      return;
    }

    if (this._current) {
      this.operating = true;
      await this.detach(this._current, false);
      this._current = null;
      this.operating = false;
    }
  }

  public async purge(): Promise<void> {
    if (this.checkOperating(`purge()`)) {
      return;
    }

    if (this._current) {
      this.operating = true;
      await this.detach(this._current, true);
      this._current = null;
      this.operating = false;
    }
  }

  public get top(): IGuiView<{}> {
    return this._current;
  }

  public get size(): number {
    return this._current ? 1 : 0;
  }
}

export { GuiExclusiveAgent };
