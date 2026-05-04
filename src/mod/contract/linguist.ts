import { IEventBusAbility } from './event-bus';
import { ILauncherAbility, Language } from './launcher';
import { IAbility, IMod } from './mod';
import { IStorageAbility } from './storage';

/** 词汇ID */
export type VId = string;

/** 词汇文本 */
export type VText = string;

/** 国际化存档模板 */
export interface ILinguistSchema {
  language: Language;
}

/**
 * 国际化能力接口
 */
export interface ILinguistAbility extends IAbility {
  /** 当前语言 */
  language: Language;

  /**
   * 检查是否已学习指定语言
   * @param language - 语言
   * @returns 是否已学习
   */
  hasLearned(language: Language): boolean;

  /**
   * 学习新语言
   * @param language - 语言
   * @param vocabulary - 词汇表
   */
  learn(language: Language, vocabulary?: Record<VId, VText>): void;

  /**
   * 忘记已学语言
   * @param language - 语言
   */
  forget(language: Language): void;

  /** 忘记全部已学习的语言 */
  forgetAll(): void;

  /**
   * 翻译词汇
   * @param id - 词汇ID
   * @returns 翻译结果
   */
  translate(id: VId): VText | null;
}

/**
 * 国际化接口
 *
 * 负责多语言切换、翻译
 */
export interface ILinguist extends IMod {
  get ability(): ILinguistAbility;
  dependencies: { eventBus: IEventBusAbility; storage: IStorageAbility; launcher: ILauncherAbility };
}
