import { director, game, Director } from 'cc';

import { now } from '../foundation/time';
import { Journal } from '../journal';
import { IPool, IPoolAbility, IProject, IProjectConfig } from './contract/pool';
import { BaseMod } from './mod';

/**
 * 对象池错误代码
 */
enum PoolCode {
  /** 违法项目 */
  IllegalProject,
  /** 项目重复部署 */
  ProjectDuplicated,
  /** 项目未部署 */
  ProjectNotSetup,
}

/**
 * 对象池错误
 */
class PoolError extends Error {
  public constructor(
    public readonly code: PoolCode,
    public readonly project: string
  ) {
    super(PoolCode[code]);
  }
}

/**
 * 生产线
 */
class ProjectLine<P extends IProject = IProject> {
  /** 空闲队列 */
  private _idleProjects: P[];
  /** 在用队列 */
  private _busyProjects: P[];
  /** 累计时间片 */
  private _accumulation: number;
  /** 生产线配置 */
  public readonly config: IProjectConfig<P>;

  /**
   * 生产线构造
   * @param config 生产线参数
   */
  public constructor(config: IProjectConfig<P>) {
    this.config = Object.freeze(config);
    this._idleProjects = [];
    this._busyProjects = [];
    this._accumulation = 0;
  }

  /**
   * 从在用队列中移除项目
   * @param project 项目
   */
  private _removeFromBusy(project: P) {
    const busyIdx = this._busyProjects.indexOf(project);
    if (busyIdx > -1) {
      this._busyProjects.splice(busyIdx, 1);
    }
  }

  /** 在用数量 */
  public get busySize() {
    return this._busyProjects.length;
  }

  /** 空闲数量 */
  public get idleSize() {
    return this._idleProjects.length;
  }

  /** 预热 */
  public warmup() {
    if (this._idleProjects.length === 0) {
      this._manufacture(this.config.warmup);
    }
  }

  /** 扩充 */
  protected expand() {
    this._manufacture(this.config.expand);
  }

  /** 生产项目 */
  public produce(...parameters: Parameters<P['onProduce']>): P {
    if (this._idleProjects.length == 0) {
      this.expand();
    }

    const project = this._idleProjects.pop();
    project.usedAt = now();
    project.recycledAt = project.disposedAt = 0;
    project.onProduce(...parameters);
    this._busyProjects.push(project);
    return project;
  }

  /**
   * 判断项目是否允许回收
   *
   * 回收条件必须同时满足：
   * - 已创建
   * - 未回收
   * - 未销毁
   * @param project 项目
   * @returns 是否允许回收
   */
  private isRecyclable(project: P) {
    return project.createdAt > 0 && project.recycledAt === 0 && project.disposedAt === 0;
  }

  /** 回收项目 */
  public recycle(project: P) {
    if (this.isRecyclable(project)) {
      if (this._idleProjects.length < this.config.maximum) {
        project.recycledAt = now();
        project.onRecycle();
        this._removeFromBusy(project);
        this._idleProjects.push(project);
      } else {
        this._dispose(project);
      }
      return;
    }

    throw new PoolError(PoolCode.IllegalProject, project.project);
  }

  /**
   * 销毁项目
   * @param project 项目
   */
  private _dispose(project: P) {
    this._removeFromBusy(project);
    project.disposedAt = now();
    project.onDispose();
  }

  /** 撤销生产线（调用后不可再使用此实例） */
  public discard() {
    this._idleProjects.forEach((project) => this._dispose(project));
    this._idleProjects.length = 0;
    this._idleProjects = null;
    this._busyProjects.length = 0;
    this._busyProjects = null;
  }

  /**
   * 检查
   * @description 移除多余的过期项目
   * @param dt 时间片
   * @returns
   */
  public inspect(dt: number) {
    this._accumulation += dt;

    if (this._accumulation > this.config.inspectPeriod) {
      this._accumulation -= this.config.inspectPeriod;

      if (this._idleProjects.length <= this.config.warmup) return;

      const time = now();
      let count = this.config.warmup;
      for (let i = this._idleProjects.length - 1; i >= 0; i--) {
        const project = this._idleProjects[i];
        if (project.usedAt > 0 && time - project.usedAt > this.config.ttl) {
          project.disposedAt = now();
          project.onDispose();
          this._idleProjects.splice(i, 1);
          if (--count == 0) break;
        }
      }
    }
  }

  /**
   * 一次性批量生产
   * @param count 数量
   */
  private _manufacture(count: number) {
    const time = now();
    for (let i = 0; i < count; i++) {
      const project = this.config.produce();
      project.project = this.config.project;
      project.createdAt = time;
      project.usedAt = project.recycledAt = project.disposedAt = 0;
      this._idleProjects.push(project);
    }
  }
}

/**
 * 对象池能力实现
 */
class PoolAbility implements IPoolAbility {
  /** 生产线 */
  private _lines: Map<string, ProjectLine>;

  public constructor(public mod: IPool) {
    this._lines = new Map();
  }

  /** 运转 */
  private _drive() {
    this.inspect(game.deltaTime);
  }

  public async attach(): Promise<void> {
    director.on(Director.EVENT_BEFORE_UPDATE, this._drive, this);
  }

  public detach() {
    director.off(Director.EVENT_BEFORE_UPDATE, this._drive, this);
    this._lines.forEach((_, project) => this.discard(project));
    this._lines.clear();
    this._lines = null;
    this.mod = null;
  }

  public get lines() {
    return this._lines.size;
  }

  public get stats() {
    const stats: IPoolAbility['stats'] = [];
    this._lines.forEach((line, project) => {
      stats.push({
        project,
        idle: line.idleSize,
        busy: line.busySize,
      });
    });
    return stats;
  }

  public setup(projectInfo: IProjectConfig): void {
    if (this._lines.has(projectInfo.project)) {
      throw new PoolError(PoolCode.ProjectDuplicated, projectInfo.project);
    }

    const line = new ProjectLine(projectInfo);
    this._lines.set(projectInfo.project, line);

    Journal.Debug(`生产线 ${projectInfo.project} 已部署`);
  }

  public warmup(project: string): void {
    this._lines.get(project)?.warmup();
  }

  public discard(project: string) {
    if (!this._lines.has(project)) {
      throw new PoolError(PoolCode.ProjectNotSetup, project);
    }

    this._lines.get(project)!.discard();
    this._lines.delete(project);

    Journal.Debug(`${this.mod.trait} 生产线 ${project} 已撤销`);
  }

  public produce<P extends IProject>(project: string, ...parameters: Parameters<P['onProduce']>): P {
    const line = this._lines.get(project);
    if (!line) {
      throw new PoolError(PoolCode.ProjectNotSetup, project);
    }

    return (line as ProjectLine<P>).produce(...parameters);
  }

  public recycle<P extends IProject>(project: P): void {
    const line = this._lines.get(project.project);
    if (line) {
      // 回收到生产线
      line.recycle(project);
    } else {
      // 保底销毁
      if (project.disposedAt === 0) {
        project.disposedAt = now();
        project.onDispose();
      }
    }
  }

  public inspect(dt: number) {
    this._lines.forEach((line) => line.inspect(dt));
  }
}

/**
 * 对象池管理器实现
 */
class Pool extends BaseMod<PoolAbility> implements IPool {
  public static readonly InitArgs: Parameters<Pool['loadAbility']>;
  public static readonly Trait: string = 'pool';

  protected loadAbility(): PoolAbility {
    return new PoolAbility(this);
  }
}

export { Pool };
