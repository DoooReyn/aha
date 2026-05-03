import { mightSync } from '../foundation/might';
import { Journal } from '../journal';
import { IEventBus, IEventBusAbility, IListener } from './contract/event-bus';
import { BaseMod } from './mod';

/**
 * 事件总线能力实现
 */
class EventBusAbility implements IEventBusAbility {
  /**
   * 数据结构：Map<code, Map<process, Map<ambient, listener>>>
   *
   * - 外层 Map：按 code 分组
   * - 中层 Map：按 process 分组
   * - 内层 Map：按 ambient 分组，支持同一 process 的多个 ambient
   *
   * 查找复杂度：O(1)
   */
  private _channels: Map<string, Map<IListener[0], Map<IListener[1], IListener>>>;

  public constructor(public mod: IEventBus) {
    this._channels = new Map();
  }

  public async attach(): Promise<void> {}

  public detach(): void {
    this.unlistenAll();
    this._channels = null;
    this.mod = null;
  }

  public get size(): number {
    return this._channels.size;
  }

  public get stats() {
    const stats: IEventBusAbility['stats'] = [];
    this._channels.forEach((processMap, code) => {
      let listeners = 0;
      processMap.forEach((ambientMap) => {
        listeners += ambientMap.size;
      });
      stats.push({ code, listeners });
    });
    return stats;
  }

  public has(code: string): boolean {
    return this._channels.has(code);
  }

  public listen(code: string, process: IListener[0], ambient: IListener[1], once?: IListener[2]): void {
    if (ambient === undefined) {
      Journal.Warn('ambient 不允许为 undefined');
      return;
    }

    if (!this._channels.has(code)) {
      this._channels.set(code, new Map());
    }

    const processMap = this._channels.get(code);

    // 获取或创建该 process 的 ambient 映射
    let ambientMap = processMap.get(process);
    if (!ambientMap) {
      ambientMap = new Map();
      processMap.set(process, ambientMap);
    }

    // O(1) 检查是否已存在
    if (ambientMap.has(ambient)) {
      return;
    }

    const listener: IListener = [process, ambient, once];
    ambientMap.set(ambient, listener);
  }

  public unlisten(code: string, process: IListener[0], ambient: IListener[1]): void {
    if (this._channels.has(code)) {
      const processMap = this._channels.get(code);
      const ambientMap = processMap.get(process);
      if (ambientMap) {
        // O(1) 删除
        ambientMap.delete(ambient);

        // 如果该 process 没有其他 ambient 了，清理 processMap 条目
        if (ambientMap.size === 0) {
          processMap.delete(process);
        }
      }
    }
  }

  public unlistenAmbient(code: string, ambient: IListener[1]): void {
    if (this._channels.has(code)) {
      const processMap = this._channels.get(code);
      // 遍历所有 process，删除指定 ambient
      // 注意：这里仍然是 O(n)，但通常 unlistenAmbient 使用较少
      for (const [process, ambientMap] of processMap) {
        ambientMap.delete(ambient);
        if (ambientMap.size === 0) {
          processMap.delete(process);
        }
      }
    }
  }

  public unlistenCode(code: string): void {
    this._channels.delete(code);
  }

  public unlistenAll(): void {
    this._channels.clear();
  }

  public notify(code: string, ...news: unknown[]): void {
    if (this._channels.has(code)) {
      const processMap = this._channels.get(code);
      const toDelete: Array<{ process: IListener[0]; ambient: IListener[1] }> = [];

      // 收集要执行的和要删除的监听器
      for (const [process, ambientMap] of processMap) {
        for (const [ambient, listener] of ambientMap) {
          const [processFn, ambientObj, once] = listener;
          const [, err] = mightSync(processFn, ambientObj, ...news);
          if (err) Journal.Warn('监听器执行报错：', err);
          if (once) {
            toDelete.push({ process, ambient });
          }
        }
      }

      // 批量删除一次性监听器
      for (const { process, ambient } of toDelete) {
        const ambientMap = processMap.get(process);
        if (ambientMap) {
          ambientMap.delete(ambient);
          if (ambientMap.size === 0) {
            processMap.delete(process);
          }
        }
      }
    }
  }
}

/**
 * 事件总线实现
 */
class EventBus extends BaseMod<EventBusAbility> implements IEventBus {
  public static readonly InitArgs: Parameters<EventBus['loadAbility']>;
  public static readonly Trait: string = 'eventBus';

  protected loadAbility(): EventBusAbility {
    return new EventBusAbility(this);
  }
}

export { EventBus };
