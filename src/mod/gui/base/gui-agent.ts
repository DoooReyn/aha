import { Node } from 'cc';

import { Dict } from '../../../foundation';
import { ioc } from '../../../ioc';
import { Journal } from '../../../journal';
import { GuiLayers, IGuiConfig, IGuiRegistry, IGuiView, ITweener } from '../../contract';
import { TRAIT } from '../../trait';

/**
 * 视图代理
 */
class GuiAgentBase {
  /** 视图容器节点 */
  public readonly root: Node;
  public layer: GuiLayers;
  public carrier: Node;
  private _operating: boolean;

  public constructor(root: Node) {
    this.root = root;
    this._operating = false;
  }

  protected get operating() {
    return this._operating;
  }

  protected set operating(ing: boolean) {
    this._operating = ing;
  }

  protected checkOperating(operation: string) {
    if (this._operating) {
      Journal.Warn(`请等待上一个操作完成，当前操作已跳过 ${operation}`);
      return true;
    }
    return false;
  }

  /**
   * 视图连接
   * @param node 节点
   * @param config 视图配置
   * @param data 数据
   * @returns 视图
   */
  protected async attach(carrier: Node, node: Node, config: IGuiConfig, data?: unknown): Promise<IGuiView> {
    carrier.addChild(node);
    const view = node.acquire(config.view);
    const container = node as Dict;
    view.ui = container['ui'];
    view.uiid = container['uiid'];
    view.config = config;
    view.onInit(data);
    if (view.onTransitionEnter) {
      await view.onTransitionEnter();
    } else if (config.enterTweener) {
      const tweener = ioc.resolve<ITweener>(TRAIT.TWEENER);
      await tweener.execute(config.enterTweener, view.node);
    }
    view.onEnter();
    return view;
  }

  /**
   * 视图断连
   * @param view 视图
   * @param force 是否强制
   */
  protected async detach(view: IGuiView, force?: boolean): Promise<void> {
    if (!force) {
      if (view.onTransitionExit) {
        await view.onTransitionExit();
      } else if (view.config.exitTweener) {
        const tweener = ioc.resolve<ITweener>(TRAIT.TWEENER);
        await tweener.execute(view.config.exitTweener, view.node);
      }
    }
    view.onExit();
    ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY).close(view.ui, view);
  }

  protected async focus(carrier: Node, view: IGuiView) {
    carrier.addChild(view.node);
    if (view.onTransitionEnter) {
      await view.onTransitionEnter();
    } else if (view.config.enterTweener) {
      const tweener = ioc.resolve<ITweener>(TRAIT.TWEENER);
      await tweener.execute(view.config.enterTweener, view.node);
    }
    view.onFocus?.();
  }

  protected async blur(view: IGuiView): Promise<void> {
    if (view.onTransitionExit) {
      await view.onTransitionExit();
    } else if (view.config.exitTweener) {
      const tweener = ioc.resolve<ITweener>(TRAIT.TWEENER);
      await tweener.execute(view.config.exitTweener, view.node);
    }
    view.onBlur?.();
    view.node.removeFromParent();
  }
}

export { GuiAgentBase };
