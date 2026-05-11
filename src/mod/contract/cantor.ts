import { ILauncherAbility } from './launcher';
import { IAbility, IMod } from './mod';
import { IPoolAbility } from './pool';
import { IResCacheAbility } from './res-cache';
import { IResDynamicAbility } from './res-dynamic';
import { IResRemoteAbility } from './res-remote';

/**
 * 音律类别
 */
export enum CantorCategory {
  /** 脆音（适用于短音效） */
  Crisp,
  /** 节律（适用于有节奏的环境音效） */
  Rhythm,
  /** 乐章（适用于背景音乐） */
  Tune,
}

/**
 * 乐师配置
 */
export interface ICantorConfig {
  /** 脆音限制 */
  crispLimit: number;
  /** 节律限制 */
  rhythmLimit: number;
  /** 总体限制（不能超过平台限制） */
  totalLimit: number;
  /** 快速播放限制（ms） */
  quickPlayLimit: number;
}

/**
 * 乐手
 */
export interface ICantorPlayer {
  /** 静音 */
  mute: boolean;
  /** 主音量 */
  masterVolume: number;
  /** 子音量 */
  subVolume: number;
  /** 资产标识 */
  uri: string;
  /** 播放 */
  play(uri: string, loop?: boolean): void;
  /** 暂停 */
  pause(cid?: string): void;
  /** 恢复 */
  resume(cid?: string): void;
  /** 停止 */
  stop(cid?: string): void;
}

/**
 * 乐师能力
 */
export interface ICantorAbility extends IAbility {
  /** 脆音 */
  crisp: ICantorPlayer;
  /** 节律 */
  rhythm: ICantorPlayer;
  /** 乐章 */
  tune: ICantorPlayer;
  /** 统计 */
  get stats(): {
    [CantorCategory.Crisp]: number;
    [CantorCategory.Rhythm]: number;
    [CantorCategory.Tune]: number;
  };
  /**
   * 暂停
   * @param cid 音律编号（不指定时针对所有播放中的音律）
   */
  pause(cid?: string): void;
  /**
   * 恢复
   * @param cid 音律编号（不指定时针对所有播放中的音律）
   */
  resume(cid?: string): void;
  /**
   * 停止
   * @param cid 音律编号（不指定时针对所有播放中的音律）
   */
  stop(cid?: string): void;
}

/**
 * 乐师（音频播放系统）
 *
 * 短音效 Crisp
 * 长音频 Rythym
 * 背景音 Tune
 */
export interface ICantor extends IMod {
  get ability(): ICantorAbility;
  dependencies: {
    launcher: ILauncherAbility;
    pool: IPoolAbility;
    resCache: IResCacheAbility;
    resDynamic: IResDynamicAbility;
    resRemote: IResRemoteAbility;
  };
}
