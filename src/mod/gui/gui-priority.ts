import { Node } from 'cc';

import { Dict } from '../../foundation';
import { ioc } from '../../ioc';
import { Journal } from '../../journal';
import { IGuiPriority, IGuiRegistry, IGuiView } from '../contract';
import { TRAIT } from '../trait';

/** 优先级队列条目 */
interface IPriorityEntry {
  ui: string;
  priority: number;
  data: unknown;
}

/**
 * 优先级队列式视图容器
 *
 * - 同时只能显示一个
 * - 上一个视图关闭后自动展示下一个视图
 * - 所有视图在内部排队（自动去重），依靠优先级决定下一个轮到谁展示
 */
class GuiPriority implements IGuiPriority {
  /** 当前视图 */
  private _current: IGuiView | null;
  /** 等待队列（按优先级降序排列，相同优先级按入队先后） */
  private _queue: IPriorityEntry[];
  /** 加载状态锁 */
  private _loading: boolean;
  /** 取消状态 */
  private _canceled: boolean;
  /** 加载中的视图 */
  private _loadingUi: string;

  /**
   * @param _carrier 载体（容器）
   */
  public constructor(private readonly _carrier: Node) {
    this._current = null;
    this._loadingUi = null;
    this._queue = [];
    this._loading = false;
    this._canceled = false;
  }

  public enqueue(ui: string, data?: unknown): void {
    // 去重：当前正在展示
    if (this._current && this._current.ui === ui) {
      Journal.Warn(`视图 ${ui} 已打开`);
      return;
    }

    // 去重：队列中已存在
    if (this._queue.some((entry) => entry.ui === ui)) {
      Journal.Warn(`视图 ${ui} 已在队列中`);
      return;
    }

    // 去重：正在加载中
    if (this._loadingUi === ui) {
      Journal.Warn(`视图 ${ui} 正在加载中`);
      return;
    }

    // 无当前视图且无加载中 → 直接加载
    if (!this._current && !this._loading) {
      this._loadingUi = ui;
      this._load(ui, data);
      return;
    }

    // 入队（按优先级降序插入，同优先级保持入队顺序）
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const config = registry.getUiConfig(ui);
    const priority = config.priority ?? 0;
    this._insertOrdered({ ui, priority, data });
  }

  public purge(): void {
    // 清空队列
    this._queue.length = 0;
    // 如果有任务正在加载，则需要设置为取消状态
    if (this._loading) {
      this._canceled = true;
    }
    // 关闭当前视图
    this.close(true);
  }

  /** 按优先级降序插入，同优先级保持入队顺序 */
  private _insertOrdered(entry: IPriorityEntry): void {
    let lo = 0;
    let hi = this._queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this._queue[mid].priority > entry.priority) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    this._queue.splice(lo, 0, entry);
  }

  /** 加载视图 */
  private async _load(ui: string, data: unknown): Promise<void> {
    this._loading = true;
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const config = registry.getUiConfig(ui);
    const node = await registry.open(ui);
    this._loading = false;
    this._loadingUi = null;
    if (node) {
      const view = node.acquire(config.view);
      if (this._canceled) {
        registry.close(ui, view);
        this._canceled = false;
        return;
      }

      this._current = view;
      this._carrier.addChild(node);
      const container = node as Dict;
      view.ui = container['ui'];
      view.uiid = container['uiid'];
      view.config = config;
      view.onInit(data);
      // await (config.enterTweener, view)
      view.onEnter();
    } else {
      this._playNext();
    }
  }

  /** 关闭当前视图并播放下一个 */
  public async close(force: boolean): Promise<void> {
    if (!this._current) {
      return;
    }

    const current = this._current;
    this._current = null;
    if (!force) {
      // await (current.config.exitTweener, current)
    }
    current.onExit();
    ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY).close(current.ui, current);
    await this._playNext();
  }

  /** 从队列头部取出下一个并加载 */
  private async _playNext(): Promise<void> {
    if (this._loading) {
      Journal.Warn(`视图正在加载中`);
      return;
    }

    const entry = this._queue.shift();
    if (entry) {
      await this._load(entry.ui, entry.data);
    }
  }
}

export { GuiPriority };
