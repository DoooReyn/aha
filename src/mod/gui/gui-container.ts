import { Node } from 'cc';

import { Dict } from '../../foundation/interfaces/general';
import { ioc } from '../../ioc';
import { IGuiConfig, IGuiRegistry, IGuiView, ITweener } from '../contract';
import { TRAIT } from '../trait';

/**
 * 视图容器
 */
class GuiContainer {
  /**
   * 视图连接
   * @param node 节点
   * @param config 视图配置
   * @param data 数据
   * @returns 视图
   */
  protected async attach(node: Node, config: IGuiConfig, data?: unknown): Promise<IGuiView> {
    const view = node.acquire(config.view);
    const container = node as Dict;
    view.ui = container['ui'];
    view.uiid = container['uiid'];
    view.config = config;
    view.onInit(data);
    if (config.enterTweener) {
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
    if (!force && view.config.exitTweener) {
      const tweener = ioc.resolve<ITweener>(TRAIT.TWEENER);
      await tweener.execute(view.config.exitTweener, view.node);
    }
    view.onExit();
    ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY).close(view.ui, view);
  }
}

export { GuiContainer };
