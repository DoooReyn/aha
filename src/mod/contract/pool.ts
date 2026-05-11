import { IAbility, IMod } from './mod';

/**
 * 对象池项目接口
 */
export interface IProject {
  /** 所属生产线 */
  project: string;
  /** 生产时间 */
  createdAt: number;
  /** 上次使用时间 */
  usedAt: number;
  /** 回收时间 */
  recycledAt: number;
  /** 销毁时间 */
  disposedAt: number;
  /** 生产回调 */
  onProduce(...parameters: unknown[]): void;
  /** 回收回调 */
  onRecycle(): void;
  /** 销毁回调 */
  onDispose(): void;
}

/**
 * 对象池生产线配置
 */
export interface IProjectConfig<P extends IProject = IProject> {
  /** 项目名称 */
  project: string;
  /** 存活时间 */
  ttl: number;
  /** 初始产能 */
  warmup: number;
  /** 最大产能 */
  maximum: number;
  /** 扩充产能 */
  expand: number;
  /** 检查周期 (ms) */
  inspectPeriod: number;
  /** 生产构造 */
  produce: () => P;
}

/**
 * 对象池能力接口
 */
export interface IPoolAbility extends IAbility {
  /** 生产线数量 */
  get lines(): number;
  /** 生产情况 */
  get stats(): { project: string; idle: number; busy: number }[];
  /** 部署生产线 */
  setup(projectInfo: IProjectConfig): void;
  /** 预热生产线 */
  warmup(project: string): void;
  /** 撤销生产线 */
  discard(project: string): void;
  /** 生产项目 */
  produce<P extends IProject>(project: string, ...parameters: Parameters<P['onProduce']>): P;
  /** 回收项目 */
  recycle<P extends IProject>(project: P): void;
  /** 检查生产线 */
  inspect(dt: number): void;
}

/**
 * 对象池管理器接口
 */
export interface IPool extends IMod {
  get ability(): IPoolAbility;
}
