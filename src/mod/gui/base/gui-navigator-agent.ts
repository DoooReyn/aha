import { view, Layers, Node, UITransform, Widget } from 'cc';

import { ioc } from '../../../ioc';
import { Journal } from '../../../journal';
import { GuiLayers, IGuiAgent, IGuiRegistry, IGuiView } from '../../contract';
import { TRAIT } from '../../trait';
import { GuiAgentBase } from './gui-agent';

class GuiNavigatorAgent extends GuiAgentBase implements IGuiAgent {
  public readonly maxDepth: number;
  /** 导航栈 */
  private _stack: IGuiView[];

  public constructor(root: Node, layer: GuiLayers, maxDepth: number) {
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
    this.maxDepth = maxDepth;
    this.carrier = carrier;
    this._stack = [];
  }

  public async open(ui: string, data: unknown): Promise<void> {
    if (this.checkOperating(`open(${ui})`)) {
      return;
    }

    const curr = this._stack[this._stack.length - 1];
    if (curr) {
      // 顶层视图 = 入栈视图
      // 对焦到顶层视图
      if (curr.ui === ui) {
        curr.onFocus?.();
        return;
      }

      // 入栈视图在导航栈内
      // 关闭并移除入栈视图之上的所有视图，然后对焦到顶层视图
      const index = this._stack.findIndex((v) => v.ui === ui);
      if (index > -1) {
        for (let i = this._stack.length - 1; i > index; i--) {
          await this.detach(this._stack[i], true);
        }
        this._stack.length = index + 1;
        const next = this._stack[index];
        await this.focus(this.carrier, next);
        return;
      }
    }

    // 检测视图合法性
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const config = registry.getUiConfig(ui);
    if (!('onFocus' in config.view.prototype) || !('onBlur' in config.view.prototype)) {
      Journal.Warn(`${ui} 不是合法的导航栈视图`);
      return;
    }

    // 加载准备
    this.operating = true;

    // 检测导航栈深度：如果超过了深度限制，则需要清栈
    if (this.depth >= this.maxDepth) {
      await this.purge();
    }

    // 加载入栈视图
    const node = await registry.open(ui);
    if (node) {
      if (curr) {
        // 当前视图失焦，然后关闭
        await this.blur(curr);
      }

      // 添加入栈视图
      const next = await this.attach(this.carrier, node, config, data);
      this._stack.push(next);
    }

    // 加载完成
    this.operating = false;
  }

  public async back(): Promise<void> {
    if (this.checkOperating(`back()`)) {
      return;
    }

    const depth = this.depth;
    if (depth > 0) {
      this.operating = true;
      await this.detach(this._stack.pop()!);
      const next = this._stack[depth - 1];
      if (next) {
        await this.focus(this.carrier, next);
      }
      this.operating = false;
    }
  }

  public async purge(): Promise<void> {
    if (this.checkOperating(`purge()`)) {
      return;
    }

    this.operating = true;
    for (let i = this._stack.length - 1; i >= 0; i--) {
      await this.detach(this._stack[i], true);
    }
    this._stack.length = 0;
    this.operating = false;
  }

  public get top(): IGuiView<{}> {
    return this._stack[this._stack.length - 1];
  }

  /**
   * 可见的视图个数
   */
  public get size(): number {
    return this.depth ? 1 : 0;
  }

  /**
   * 栈深度
   */
  public get depth(): number {
    return this._stack.length;
  }
}

export { GuiNavigatorAgent };
