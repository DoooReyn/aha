import { Component, Node } from 'cc';

import { Constructor } from '../../foundation';
import { IGuiRegistryAbility } from './gui-registry';
import { ILauncherAbility } from './launcher';
import { IAbility, IMod } from './mod';

/**
 * GUI 分层规划
 */
export enum GuiLayers {
  /** 活动层（一级界面） */
  Screen,
  /** 窗口层（二级界面） */
  Window,
  /** HUD 层（一般指资源栏等） */
  Hud,
  /** 弹窗层（普通弹窗） */
  Popup,
  /** 引导层（新手引导） */
  Guide,
  /** 滚动提示层（跑马灯） */
  Marquee,
  /** 浮动提示层（轻提示） */
  Toast,
  /** 通知提示层（抽屉提示） */
  Notification,
  /** 加载层 */
  Loading,
  /** 警告层（紧急弹窗） */
  Alert,
}

/**
 * UI 缓存时长（秒）
 */
export enum GuiCacheUptime {
  /** 无 */
  No = 0,
  /** 极短 */
  Soon = 5,
  /** 短 */
  Short = 15,
  /** 中等 */
  Medium = 30,
  /** 长 */
  Long = 60,
  /** 永久 */
  Forever = -1,
}

/**
 * 视图配置清单
 */
export interface IGuiManifest {
  [key: string]: IGuiConfig;
}

/**
 * 视图配置
 */
export interface IGuiConfig {
  /** 资源标识符 */
  uri: string;
  /** 所属层级 */
  layer: GuiLayers;
  /** 最长存活时间 */
  uptime: GuiCacheUptime;
  /** 最多缓存实例（默认 1 个） */
  maxInstances?: number;
  /** 进入动画 */
  enterTweener?: string;
  /** 退出动画 */
  exitTweener?: string;
  /** 是否模态弹窗（弹窗专用） */
  isModal?: boolean;
  /** 优先级 */
  priority?: number;
  /** 视图组件 */
  view: Constructor<IGuiView>;
}

/**
 * 抢占式视图容器
 *
 * - 同时只能展示一个视图
 */
export interface IGuiExclusive {
  /**
   * 抢占
   * @param ui 标识
   * @param data 数据（可选）
   */
  open(ui: string, data?: unknown): Promise<void>;
  /**
   * 关闭
   */
  close(): Promise<void>;
  /**
   * 顶层视图
   */
  get top(): IGuiView;
  /**
   * 清理（约等于关闭，但是不带退出动画）
   */
  purge(): Promise<void>;
}

/**
 * 导航式视图容器
 *
 * - 永远只显示栈顶视图
 * - 一次只能执行一个操作：入栈或出栈
 * - 支持栈深度限制，超过栈深度自动清栈
 * - 栈视图需要支持对焦和失焦
 */
export interface IGuiNavigator {
  /**
   * 入栈
   * @param ui 标识
   * @param data 数据（可选）
   */
  open(ui: string, data?: unknown): Promise<void>;
  /**
   * 出栈
   */
  close(data?: unknown): Promise<void>;
  /**
   * 清理
   */
  purge(): Promise<void>;
  /**
   * 栈顶视图
   */
  get top(): IGuiView;
  /**
   * 当前深度
   */
  get depth(): number;
}

/**
 * 优先级队列式视图容器
 *
 * - 同时只能显示一个
 * - 上一个视图关闭后自动展示下一个视图
 * - 所有视图在内部排队（自动去重），依靠优先级决定下一个轮到谁展示
 */
export interface IGuiPriority {
  /**
   * 入列
   * @param ui 标识
   * @param data 数据（可选）
   */
  open(ui: string, data?: unknown): Promise<void>;
  /**
   * 关闭当前视图
   * @param force 是否强制关闭（跳过视图关闭动画）
   */
  close(force: boolean): Promise<void>;
  /**
   * 顶层视图
   */
  get top(): IGuiView;
  /**
   * 清理
   */
  purge(): void;
}

/**
 * 深度队列式视图容器
 *
 * - 可以同时显示多个
 * - 支持最大深度限制，超过限制自动出列
 * - 不存在优先级，先调用先展示
 */
export interface IGuiOverlap {
  /** 深度限制 */
  readonly maxDepth: number;
  /**
   * 入列
   * @param ui 标识
   * @param data 数据（可选）
   */
  open(ui: string, data?: unknown): Promise<void>;
  /**
   * 出列
   */
  close(): Promise<void>;
  /**
   * 清理
   */
  purge(): Promise<void>;
  /**
   * 顶层视图
   */
  get top(): IGuiView;
  /** 当前深度 */
  get depth(): number;
}

/**
 * 视图骨架
 */
export interface IGuiSketch {
  [key: string]: Node | Component;
}

/**
 * GUI 视图接口
 */
export interface IGuiView<S extends IGuiSketch = {}> extends Component {
  /** 视图标识（自动挂载） */
  ui: string;
  /** 视图编号（自动挂载） */
  uiid: string;
  /** 视图配置（自动挂载） */
  config: Readonly<IGuiConfig>;
  /** 视图骨架 */
  sketch(): S;
  /** 轻量初始化回调 */
  onInit(data?: unknown): void;
  /** 视图动画进入 */
  onTransitionEnter?(): Promise<void>;
  /** 视图进入回调 */
  onEnter(): void;
  /** 视图动画退出 */
  onTransitionExit?(): Promise<void>;
  /** 视图退出回调 */
  onExit(): void;
  /** 视图对焦回调 */
  onFocus?(): void;
  /** 视图失焦回调 */
  onBlur?(): void;
}

/**
 * GUI 能力接口
 */
export interface IGuiAbility extends IAbility {
  /**
   * 打开视图
   * @param ui 视图标识
   * @param data 数据
   */
  open(ui: string, data: unknown): Promise<void>;
  /**
   * 执行一次返回
   * @param layer 视图层级
   */
  back(layer: GuiLayers): Promise<void>;
}

/**
 * GUI 模块接口
 *
 * - 提供 GUI 系统的核心功能和服务
 * - 管理视图配置清单、视图实例、视图容器等
 * - 负责协调不同层级和类型的视图展示和交互
 */
export interface IGui extends IMod {
  get ability(): IGuiAbility;
  dependencies: { launcher: ILauncherAbility; guiRegistry: IGuiRegistryAbility };
}

/**
 * 视图界面代理
 */
export interface IGuiAgent {
  /** 视图所属层级 */
  readonly layer: GuiLayers;
  /** 视图容器 */
  readonly carrier: Node;
  /**
   * 打开视图
   * @param ui 视图标识
   * @param data 数据
   */
  open(ui: string, data: unknown): Promise<void>;
  /**
   * 返回
   */
  back(): Promise<void>;
  /**
   * 清空
   */
  purge(): Promise<void>;
  /**
   * 顶层视图
   */
  get top(): IGuiView | null;
  /**
   * 视图个数
   */
  get size(): number;
}

/**
 * 一级界面代理
 */
export interface IGuiScreenAgent extends IGuiAgent {}

/**
 * 二级界面代理
 */
export interface IGuiWindowAgent extends IGuiAgent {}

/**
 * HUD 代理
 */
export interface IGuiHudAgent extends IGuiAgent {}

/**
 * 弹窗代理
 */
export interface IGuiPopupAgent extends IGuiAgent {}
