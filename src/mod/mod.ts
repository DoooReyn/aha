import { IAbility, IMod } from './contract/mod';

/**
 * 模块状态
 */
enum State {
  /** 原始 */
  Primitive,
  /** 已登记 */
  Registered,
  /** 已启动 */
  Launched,
  /** 已注销 */
  UnRegistered,
}

/**
 * 模块状态错误码
 */
enum ModCode {
  /** 模块非原始态 */
  NotPrimitive,
  /** 模块未登记 */
  NotRegistered,
  /** 模块未启动 */
  NotLaunched,
  /** 模块能力未装载 */
  AbilityNotLoaded,
}

/**
 * 错误构造
 */
class ModError extends Error {
  public constructor(public readonly code: ModCode) {
    super(ModCode[code]);
  }
}

/**
 * 模块基类
 * @abstract
 */
abstract class BaseMod<A extends IAbility> implements IMod {
  declare public readonly trait: string;
  declare public readonly no: number;
  declare public readonly dependencies: Record<string, IAbility>;

  /** 当前状态 */
  private _state: State;
  /** 能力 */
  private _ability: A;

  public constructor() {
    this._state = State.Primitive;
    this._ability = null;
  }

  public onRegistered(): void {
    if (!this.isPrimitive) {
      throw new ModError(ModCode.NotPrimitive);
    }

    this.didRegistered();
    this._state = State.Registered;
  }

  public async onLaunched(...parameters: unknown[]): Promise<void> {
    if (!this.isRegistered) {
      throw new ModError(ModCode.NotRegistered);
    }

    await this.didLaunched();
    this._ability = this.loadAbility(...parameters);
    await this._ability.attach();
    this._state = State.Launched;
  }

  public async onUnregistered(): Promise<void> {
    if (!this.isLaunched) throw new ModError(ModCode.NotLaunched);

    this._ability.detach();
    this._ability = null;
    await this.didUnregistered();
    this._state = State.UnRegistered;
  }

  public get isPrimitive(): boolean {
    return this._state === State.Primitive;
  }

  public get isRegistered(): boolean {
    return this._state === State.Registered;
  }

  public get isLaunched(): boolean {
    return this._state === State.Launched;
  }

  public get isUnRegistered(): boolean {
    return this._state === State.UnRegistered;
  }

  public get ability(): A {
    if (!this.isLaunched) throw new ModError(ModCode.NotLaunched);
    if (!this._ability) throw new ModError(ModCode.AbilityNotLoaded);
    return this._ability;
  }

  /** 登记钩子 */
  protected didRegistered(): void {}

  /** 启动钩子 */
  protected async didLaunched(): Promise<void> {}

  /** 注销钩子 */
  protected async didUnregistered(): Promise<void> {}

  /** 装载能力 */
  protected abstract loadAbility(...parameters: unknown[]): A;
}

export { BaseMod };
