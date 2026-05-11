import { __private, Camera, Canvas, Node, Scene } from 'cc';

import { IEventBusAbility } from './event-bus';
import { IAbility, IMod } from './mod';
import { IPoolAbility } from './pool';
import { IResCacheAbility } from './res-cache';

/** 语言代码 */
export type Language = __private._pal_system_info_enum_type_language__Language;

/**
 * 应用构建版本
 */
export enum Build {
  /** 内部开发版 */
  Dev = 'dev',
  /** 内部测试版 */
  Alpha = 'alpha',
  /** 公开测试版 */
  Beta = 'beta',
  /** 候选发布版 */
  Candidate = 'candidate',
  /** 正式发布版 */
  Release = 'release',
}

/**
 * 启动器配置
 */
export interface ILauncherConfig {
  /** 应用名称 */
  app: string;
  /** 应用版本号 */
  version: string;
  /** 构建版本 */
  build: Build;
  /** 支持语言 */
  language: Language[];
  /** 用户空间标识（仅开发时使用，用于区分独立数据的用户空间，默认 `default`） */
  env?: string;

  [k: string]: unknown;
}

/**
 * 启动器能力接口
 */
export interface ILauncherAbility extends IAbility {
  /** 应用名称 */
  readonly app: string;
  /** 应用版本号 */
  readonly version: string;
  /** 构建版本 */
  readonly build: Build;
  /** 是否开发版本 */
  readonly isDev: boolean;
  /** 是否内测版本 */
  readonly isAlpha: boolean;
  /** 是否公测版本 */
  readonly isBeta: boolean;
  /** 是否候选版本 */
  readonly isCandidate: boolean;
  /** 是否正式版本 */
  readonly isRelease: boolean;
  /** 用户空间标识 */
  readonly env: string;
  /** 是否指定构建版本 */
  isBuild(build: Build): boolean;
  /** 是否支持语言 */
  isLanguageSupported(language: Language): boolean;
  /** 获取当前支持的语言列表 */
  get supportedLanguages(): Language[];
  /** 场景 */
  scene: Scene;
  /** 根节点 */
  root: Node;
  /** 挂载节点 */
  mnt: Node;
  /** 画布 */
  canvas: Canvas;
  /** UI相机 */
  cameraUi: Camera;
  /** 舞台 */
  stage: Node;
  /** 暂停逻辑 */
  pause(): void;
  /** 恢复逻辑 */
  resume(): void;
  /** 从后台回到前台经历的时间（ms） */
  get elapsed(): number;
  /** 运行状态 */
  get running(): boolean;
}

/**
 * 启动器接口
 *
 * 负责管理启动参数
 */
export interface ILauncher extends IMod {
  get ability(): ILauncherAbility;
  dependencies: { eventBus: IEventBusAbility; pool: IPoolAbility; resCache: IResCacheAbility };
}
