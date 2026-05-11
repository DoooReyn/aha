import { Node } from 'cc';

import { Journal } from '../journal';
import { ITweener, ITweenerAbility, ITweenerAction } from './contract/tweener';
import { BaseMod } from './mod';
import { TRAIT } from './trait';

/**
 * 动作大师能力实现
 */
class TweenerAbility implements ITweenerAbility {
  private _lib: Map<string, ITweenerAction>;

  public constructor(public mod: ITweener) {
    this._lib = new Map();
  }

  public async attach(): Promise<void> {}

  public detach(): void {
    this._lib.clear();
    this._lib = null;
    this.mod = null;
  }

  public add(trait: string, action: ITweenerAction): void {
    if (this._lib.has(trait)) {
      Journal.Warn(`add 不支持替换预设动作 ${trait}，如确有必要，请使用 replace`);
      return;
    }
    this._lib.set(trait, action);
  }

  public replace(trait: string, action: ITweenerAction): void {
    if (this._lib.has(trait)) {
      Journal.Info(`预设动作 ${trait} 将被替换，请知悉`);
    }
    this._lib.set(trait, action);
  }

  public remove(trait: string): void {
    this._lib.delete(trait);
  }

  public clear(): void {
    this._lib.clear();
  }

  public async execute(trait: string, node: Node, args: object = {}): Promise<void> {
    if (!this._lib.has(trait)) {
      Journal.Warn(`未找到预设动作 ${trait}`);
      return;
    }

    const action = this._lib.get(trait);
    await action(node, args);
  }
}

/**
 * 动作大师实现
 */
class Tweener extends BaseMod<TweenerAbility> implements ITweener {
  public static readonly Trait: string = TRAIT.TWEENER;
  public static readonly InitArgs: Parameters<Tweener['loadAbility']>;

  protected loadAbility(): TweenerAbility {
    return new TweenerAbility(this);
  }
}

export { Tweener };
