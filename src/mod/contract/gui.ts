import { Component, Node } from 'cc';

import { Constructor } from '../../foundation';

/**
 * UI 分层规划
 */
export enum GuiLayers {
  /** 活动层（一级界面） */
  Screen,
  /** 窗口层（二级界面） */
  Window,
  /** 遮罩层（可复用） */
  Mask,
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
   * 清理（约等于关闭，但是不带退出动画）
   */
  purge(): void;
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
  push(ui: string, data?: unknown): Promise<void>;
  /**
   * 出栈
   */
  pop(data?: unknown): Promise<void>;
  /**
   * 清栈
   */
  purge(): void;
  /**
   * 栈顶视图
   */
  get top(): IGuiStackView;
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
  enqueue(ui: string, data?: number): void;
  /**
   * 清栈
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
  enqueue(ui: string, data?: number): void;
  /** 当前深度 */
  get depth(): number;
}

/**
 * GUI 快照备份中心
 */
export interface IGuiSnapshotBackup {
  /**
   * 存入快照
   * @param sid 编号
   * @param snapshot 快照
   */
  deposit(sid: string, snapshot: IGuiSnapshotData): void;
  /**
   * 取出快照
   * @param sid 编号
   */
  withdraw<S extends IGuiSnapshotData>(sid: string): S;
}

/**
 * UI 快照数据
 */
export interface IGuiSnapshotData {
  [key: string]: unknown;
}

/**
 * UI 快照
 */
export interface IGuiSnapshot<S extends IGuiSnapshotData> {
  /** 快照编号 */
  get sid(): string;
  /** 创建快照 */
  create(): S;
  /** 使用快照恢复 */
  recover(snapshot: S): void;
}

/**
 * UI 层级代理接口
 */
export interface IGuiAgent {
  /** 载体 */
  readonly carrier: Node;
  /** 所属层级 */
  readonly layer: GuiLayers;
  /** 关闭所有视图 */
  purge(): void;
}

/**
 * 活动层代理接口
 */
export interface IGuiScreenAgent extends IGuiAgent {}

/**
 * 窗口层代理接口
 */
export interface IGuiWindowAgent extends IGuiAgent {}

/**
 * 遮罩层代理接口
 */
export interface IGuiMaskAgent extends IGuiAgent {}

/**
 * 弹窗层代理接口
 */
export interface IGuiPopupAgent extends IGuiAgent {}

/**
 * 引导层代理接口
 */
export interface IGuiGuideAgent extends IGuiAgent {}

/**
 * 滚动提示层代理接口
 */
export interface IGuiMarqueeAgent extends IGuiAgent {}

/**
 * 浮动提示层代理接口
 */
export interface IGuiToastAgent extends IGuiAgent {}

/**
 * 通知提示层代理接口
 */
export interface IGuiNotificationAgent extends IGuiAgent {}

/**
 * 加载层代理接口
 */
export interface IGuiLoadingAgent extends IGuiAgent {}

/**
 * 警告层代理接口
 */
export interface IGuiAlertAgent extends IGuiAgent {}

/**
 * 视图骨架
 */
export interface IGuiSketch {
  [key: string]: Node | Component;
}

/**
 * UI 视图接口
 */
export interface IGuiView<S extends IGuiSketch = {}> extends Component {
  /** 视图标识（自动挂载） */
  ui: string;
  /** 视图编号（自动挂载） */
  uiid: string;
  /** 视图配置（自动挂载） */
  config: Readonly<IGuiConfig>;
  /** 轻量初始化回调 */
  onInit(data?: unknown): void;
  /** 视图进入回调 */
  onEnter(): void;
  /** 视图退出回调 */
  onExit(): void;
  /** 视图骨架 */
  sketch(): S;
}

/**
 * UI 栈视图接口
 */
export interface IGuiStackView extends IGuiView {
  /** 视图对焦回调 */
  onFocus(): void;
  /** 视图失焦回调 */
  onBlur(): void;
}
