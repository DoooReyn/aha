import { Node } from 'cc';

import { ioc } from '../../ioc';
import { Journal } from '../../journal';
import { IGuiNavigator, IGuiRegistry, IGuiView } from '../contract';
import { TRAIT } from '../trait';
import { GuiContainer } from './gui-container';

/**
 * 导航式视图容器
 *
 * - 永远只显示栈顶视图
 * - 一次只能执行一个操作：入栈或出栈
 * - 支持栈深度限制，超过栈深度自动清栈
 * - 栈视图需要支持对焦和失焦
 */
class GuiNavigator extends GuiContainer implements IGuiNavigator {
  /** 加载状态 */
  private _loading: boolean;
  /** 导航栈 */
  private _stack: IGuiView[];

  /**
   * @param carrier 载体（容器）
   * @param maxDepth 最大深度
   */
  public constructor(
    public readonly carrier: Node,
    public readonly maxDepth: number
  ) {
    super();
    this._loading = false;
    this._stack = [];
  }

  public async open(ui: string, data?: unknown): Promise<void> {
    if (this._loading) return;

    const curr = this._stack[this._stack.length - 1];
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    if (curr) {
      // 顶层视图 = 入栈视图
      // 对焦到顶层视图
      if (curr.ui === ui) {
        curr.onFocus();
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
        next.onFocus();
        return;
      }
    }

    // 检测视图合法性
    const config = registry.getUiConfig(ui);
    if (!('onFocus' in config.view.prototype) || !('onBlur' in config.view.prototype)) {
      Journal.Warn(`${ui} 不是合法的导航栈视图`);
      return;
    }

    // 加载准备
    this._loading = true;

    // 检测导航栈深度：如果超过了深度限制，则需要清栈
    if (this.depth >= this.maxDepth) {
      this.purge();
    }

    // 加载入栈视图
    const node = await registry.open(ui);
    if (node) {
      if (curr) {
        // 当前视图失焦，然后关闭
        curr.onBlur();
        await this.detach(curr, false);
      }

      // 添加入栈视图
      this.carrier.addChild(node);
      const next = await this.attach(node, config, data);
      this._stack.push(next);
    }

    // 加载完成
    this._loading = false;
  }

  public async close(): Promise<void> {
    const depth = this.depth;
    if (depth > 0) {
      const vd1 = this._stack[depth - 1];
      const vd2 = this._stack[depth - 2];
      this._stack.pop();
      await this.detach(vd1, false);
      if (vd2) {
        vd2.onFocus();
      }
    }
  }

  public async purge(): Promise<void> {
    const stack = this._stack.slice();
    this._stack.length = 0;
    for (let i = stack.length - 1; i >= 0; i--) {
      await this.detach(stack[i], true);
    }
  }

  public get top() {
    return this._stack[this._stack.length - 1];
  }

  public get depth(): number {
    return this._stack.length;
  }
}

export { GuiNavigator };
