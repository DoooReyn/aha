import { Journal } from './journal';
import { IMod, IModConstructor } from './mod/contract/mod';

/**
 * 错误代码
 */
enum IoCCode {
  /** 重复登记 */
  Duplicated,
  /** 未登记 */
  NotRegistered,
}

/**
 * 错误构造
 */
class IocError extends Error {
  public constructor(
    public readonly code: IoCCode,
    public readonly trait: string
  ) {
    super(IoCCode[code]);
  }
}

/**
 * 依赖容器
 * @rule 模块必须先登记，再启动，最后注销。
 * @rule 模块注销是调用者责任，请适当处理模块间依赖。
 */
class IoC {
  /** 模块实例映射 */
  private _mod: Map<string, IMod> = new Map();

  /**
   * 登记模块
   * @param ctor 模块构造
   */
  public register(ctor: IModConstructor) {
    if (typeof ctor.Trait !== 'string' || !ctor.Trait) {
      throw new IocError(IoCCode.NotRegistered, '模块必须声明 static Trait');
    }

    const trait = ctor.Trait;

    if (this._mod.has(trait)) {
      throw new IocError(IoCCode.Duplicated, trait);
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
   * 启动模块
   * @param ctor 模块构造
   * @param dependencies 依赖
   * @param initArgs 模块能力入参
   */
  public async activate<M extends IMod, P extends unknown[]>(
    ctor: IModConstructor<M, P>,
    dependencies: IModConstructor[],
    ...initArgs: P
  ) {
    const trait = ctor.Trait;

    if (!this._mod.has(trait)) {
      throw new IocError(IoCCode.NotRegistered, trait);
    }

    const mod = this._mod.get(trait);
    Object.defineProperty(mod, 'dependencies', {
      value: dependencies.reduce((all: IMod['dependencies'], item) => {
        all[item.Trait] = this.resolve(item);
        return all;
      }, {}),
      enumerable: true,
      configurable: false,
      writable: false,
    });

    await mod.onLaunched(...initArgs);

    Journal.Info(`激活 [${mod.no}] ${trait}`);
  }

  /**
   * 注销模块
   * @param ctor 模块构造或标识
   */
  public unregister(ctor: IModConstructor | string) {
    const trait = typeof ctor === 'string' ? ctor : ctor.Trait;
    if (!this._mod.has(trait)) {
      throw new IocError(IoCCode.NotRegistered, trait);
    }

    const mod = this._mod.get(trait);
    mod.onUnregistered();
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
      throw new IocError(IoCCode.NotRegistered, trait);
    }
    return this._mod.get(trait).ability as InstanceType<M>['ability'];
  }
}

/** 依赖容器唯一实例 */
const ioc = new IoC();

export { ioc };
