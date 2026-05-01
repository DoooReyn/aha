import { IAbility, IMod } from './mod';

declare global {
  /** Cocos Creator Inspector */
  interface Inspector {
    /**
     * 获取字段
     * @param name 字段名称
     */
    getField<T>(name: string): T;
    /**
     * 添加或更新字段
     * @param name 字段名称
     * @param value 字段值
     */
    addField(name: string, value: string): void;
    /**
     * 更新字段
     * @param name 字段名称
     * @param value 字段值
     */
    updateField(name: string, value: string): void;
    /**
     * 移除字段
     * @param name 字段名称
     */
    removeField(name: string): void;
    /**
     * 清空所有字段
     */
    clearFields(): void;
    /** 显示面板 */
    show(): void;
    /** 隐藏面板 */
    hide(): void;
  }

  interface Window {
    /** Cocos Creator Inspector */
    Inspector: Inspector | undefined;
  }

  /** Cocos Creator Inspector 实例 */
  const Inspector: Inspector | undefined;
}

/**
 * 巡检器静态项目
 */
export interface ICCInspectorStaticField {
  /** 字段名称 */
  name: string;
  /** 字段值 */
  value: string;
}

/**
 * 巡检器动态项目
 */
export interface ICCInspectorDynamicField {
  /** 字段名称 */
  name: string;
  /** 更新频率 */
  interval: number;
  /** 更新字段 */
  update(): string;
}

/** 巡检器手动项目 */
export interface ICCInspectorManualField {
  /** 字段名称 */
  name: string;
  /** 更新字段 */
  update(): string;
  /** 初始化 */
  init(): void;
  /** 销毁 */
  destroy(): void;
}

/** 巡检器项目集合 */
export type CCInspectorFields = ICCInspectorStaticField | ICCInspectorDynamicField | ICCInspectorManualField;

/**
 * 巡检器能力
 */
export interface ICCInspectorAbility {
  /** 功能是否可用 */
  get available(): boolean;
  /** 添加字段 */
  add(field: CCInspectorFields): void;
  /** 移除字段 */
  remove(name: string): void;
  /** 清空所有字段 */
  clear(): void;
}

/**
 * 巡检器
 */
export interface ICCInspector extends IMod {
  get ability(): IAbility & ICCInspectorAbility;
}
