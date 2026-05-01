import { Journal } from './journal';
import { IMod, IModConstructor } from './mod/contact/mod';

/**
 * 错误代码
 */
enum ErrorCode {
  /** 重复登记 */
  Duplicated,
  /** 未登记 */
  NotRegistered,
}

/**
 * 错误构造
 */
class ViolationError extends Error {
  public constructor(
    public readonly code: ErrorCode,
    public readonly roster: string
  ) {
    super(ErrorCode[code]);
  }
}

/**
 * 依赖容器
 */
class IoC {
  /** 模块实例映射 */
  private _mod: Map<string, IMod> = new Map();

  /**
   * 登记模块
   * @param ctor 模块构造
   */
  public register(ctor: IModConstructor) {
    const trait = ctor.Trait;

    if (this._mod.has(trait)) {
      throw new ViolationError(ErrorCode.Duplicated, trait);
    }

    const mod = new ctor();
    this._mod.set(trait, mod);
    Object.defineProperties(mod, {
      trait: {
        value: trait,
        enumerable: true,
        configurable: false,
        writable: false,
      },
      no: {
        value: this._mod.size,
        enumerable: true,
        configurable: false,
        writable: false,
      },
    });

    mod.onRegistered();

    Journal.Info(`登记 [${mod.no}] ${trait}`);
  }

  /**
   * 激活模块
   * @param ctor 模块构造
   * @param dependencies 依赖
   * @param parameters 模块入参
   */
  public async activate<M extends IMod, P extends unknown[]>(
    ctor: IModConstructor<M, P>,
    dependencies: IModConstructor[],
    ...parameters: P
  ) {
    const trait = ctor.Trait;

    if (!this._mod.has(trait)) {
      throw new ViolationError(ErrorCode.NotRegistered, trait);
    }

    const mod = this._mod.get(trait);
    mod.dependencies = dependencies.reduce((all: IMod['dependencies'], item) => {
      all[item.Trait] = this.resolve(item);
      return all;
    }, {});

    await mod.onWork(...parameters);

    Journal.Info(`激活 [${mod.no}] ${trait}`);
  }

  /**
   * 注销模块
   * @param ctor 模块构造或标识
   */
  public unregister(ctor: IModConstructor | string) {
    const trait = typeof ctor === 'string' ? ctor : ctor.Trait;
    if (!this._mod.has(trait)) {
      throw new ViolationError(ErrorCode.NotRegistered, trait);
    }

    const mod = this._mod.get(trait);
    mod.onUnRegistered();
    this._mod.delete(trait);

    Journal.Info(`注销 [${mod.no}] ${trait}`);
  }

  /**
   * 解析模块
   * @param ctor 模块构造或标识
   * @returns 模块能力
   */
  public resolve<M extends IModConstructor>(ctor: M | string): InstanceType<M>['ability'] {
    const trait = typeof ctor === 'string' ? ctor : ctor.Trait;
    if (!this._mod.has(trait)) {
      throw new ViolationError(ErrorCode.NotRegistered, trait);
    }
    return this._mod.get(trait).ability;
  }
}

/** 依赖容器唯一实例 */
const ioc = new IoC();

export { ioc };
