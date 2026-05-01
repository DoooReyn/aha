/**
 * 模块接口
 */
export interface IMod {
  /** 标识 */
  readonly trait: string;
  /** 编号（从 1 开始） */
  readonly no: number;
  /** 依赖 */
  readonly dependencies: Record<string, IAbility>;
  /** 生命周期: 登记 */
  onRegistered(): void;
  /** 生命周期: 启动 */
  onLaunched(...parameters: unknown[]): Promise<void>;
  /** 生命周期: 注销 */
  onUnregistered(): Promise<void>;
  /** 是否初始状态 */
  get isPrimitive(): boolean;
  /** 是否登记状态 */
  get isRegistered(): boolean;
  /** 是否启动状态 */
  get isLaunched(): boolean;
  /** 是否注销状态 */
  get isUnRegistered(): boolean;
  /** 能力 */
  get ability(): IAbility;
}

/**
 * 模块构造接口
 */
export interface IModConstructor<M extends IMod = IMod, P extends unknown[] = unknown[]> {
  /** 构造 */
  new (): M;
  /** 标识 */
  Trait: string;
  /** 入参 */
  readonly Parameters: P;
}

/**
 * 模块能力接口
 */
export interface IAbility {
  /** 所属模块 */
  mod: IMod;
  /** 能力装载 */
  attach(): Promise<void>;
  /** 能力卸载 */
  detach(): void;
}
