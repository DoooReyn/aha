import { view, Layers, Node, UITransform, Widget } from 'cc';

import { mightSync, Dict } from '../../../foundation';
import { ioc } from '../../../ioc';
import { Journal } from '../../../journal';
import { GuiLayers, IGuiAgent, IGuiRegistry, IGuiView } from '../../contract';
import { TRAIT } from '../../trait';
import { GuiAgentBase } from './gui-agent';

/** 优先级队列条目 */
interface IPriorityEntry {
  ui: string;
  priority: number;
  data: unknown;
  serialized: string;
  status: 'ready' | 'loading' | 'completed' | 'aborted';
}

class GuiPriorityAgent extends GuiAgentBase implements IGuiAgent {
  public readonly carrier: Node;
  public readonly layer: GuiLayers;
  private _current: IGuiView;
  /** 等待队列（按优先级降序排列，相同优先级按入队先后） */
  private _queue: IPriorityEntry[];

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
    this._queue = [];
  }

  public async open(ui: string, data: unknown): Promise<void> {
    const serialized = this._serialize(data);

    // 去重：正在展示中
    if (this._current && this._current.ui === ui && (this._current as Dict)['serialized'] === serialized) {
      Journal.Warn(`视图 ${ui} 正在展示中`);
      return;
    }

    // 去重：队列中已存在
    const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
    const config = registry.getUiConfig(ui);
    if (this._queue.some((entry) => entry.ui === ui && entry.serialized === serialized)) {
      Journal.Warn(`视图 ${ui} 已在队列中`);
      return;
    }

    // 入队（按优先级降序插入，同优先级保持入队顺序）
    const priority = config.priority ?? 0;
    this._insert({ ui, priority, data, status: 'ready', serialized });

    // 尝试加载下一个
    await this._next();
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

  /** 关闭当前视图并播放下一个 */
  public async close(force: boolean): Promise<void> {
    if (this.checkOperating(`close()`)) {
      return;
    }

    if (this._current) {
      this.operating = true;
      await this.detach(this._current, force);
      this._current = null;
      this.operating = false;
      await this._next();
    }
  }

  public async purge(): Promise<void> {
    if (this.checkOperating(`purge()`)) {
      return;
    }

    // 将加载中的任务设置为取消
    const top = this._queue[0];
    if (top && top.status === 'loading') {
      top.status = 'aborted';
    }

    // 清空队列
    this._queue.length = 0;

    // 关闭当前视图
    await this.close(true);
  }

  public get top(): IGuiView<{}> {
    return this._current;
  }

  public get size(): number {
    return this._queue.length;
  }

  private _serialize(data: unknown) {
    const [result, err] = mightSync(JSON.stringify, JSON, data, null, 0);
    return err ? `err#${Date.now()}` : result;
  }

  private async _next(): Promise<void> {
    if (!this._current && this._queue.length) {
      const entry = this._queue[0];
      await this._load(entry);
    }
  }

  /** 按优先级降序插入，同优先级保持入队顺序 */
  private _insert(entry: IPriorityEntry): void {
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
  private async _load(entry: IPriorityEntry): Promise<void> {
    const { status, ui, data } = entry;
    if (status === 'ready') {
      entry.status = 'loading';
      const registry = ioc.resolve<IGuiRegistry>(TRAIT.GUI_REGISTRY);
      const config = registry.getUiConfig(ui);
      const node = await registry.open(ui);
      if (node) {
        this._current = await this.attach(this.carrier, node, config, data);
        (this._current as Dict)['serialized'];
        this._queue.shift();
        if (entry.status === 'loading') {
          entry.status = 'completed';
        } else {
          await this.close(true);
        }
      } else {
        // 加载失败，则继续下一个
        this._queue.shift();
        await this._next();
      }
    }
  }
}

export { GuiPriorityAgent };
