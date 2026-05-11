import { ICipher } from '../../foundation';
import { ILauncherAbility } from './launcher';
import { IAbility, IMod } from './mod';

/**
 * 存档模板
 *
 * 定义存储数据的结构、版本和迁移逻辑。
 */
export interface IStorageSchema<T = unknown> {
  /** 存储键名 */
  key: string;
  /** 当前版本号 */
  version: number;
  /** 默认数据工厂函数 */
  defaults: () => T;
  /** 迁移映射表：版本号 -> 迁移函数 */
  migrations?: Record<number, (old: unknown) => T>;
}

/**
 * 本地存储配置
 */
export interface IStorageConfig {
  /** 编解码链 */
  ciphers: ICipher[];
}

/**
 * 本地存储能力接口
 */
export interface IStorageAbility extends IAbility {
  /**
   * 注册存档模板
   *
   * - 注册后才能使用该数据的存储和读取。
   * - 如果存储中已有旧版本数据，会自动执行迁移。
   * - 迁移原则：只增、不改、不删。
   *
   * @param schema - 数据模板定义
   *
   * @example
   * ```typescript
   * storage.register({
   *   key: 'player-progress',
   *   version: 2,
   *   defaults: () => ({ level: 1, exp: 0, coins: 0, achievements: [] }),
   *   migrations: {
   *     1: (old) => ({ ...old, achievements: [] }),
   *   },
   * });
   * ```
   */
  register<T>(schema: IStorageSchema<T>): void;

  /**
   * 获取存档（返回代理对象，变化自动保存）
   * @param key - 存储键名
   * @returns 代理后的数据对象
   */
  get<T>(key: string): T;

  /**
   * 手动保存指定存档
   * @param key - 存储键名
   */
  save(key: string): Promise<void>;

  /**
   * 保存所有已注册的存档
   */
  saveAll(): Promise<void>;

  /**
   * 设置链式编解码器
   * @param ciphers - 编解码器（可变参数）
   */
  setChainedCipher(...ciphers: ICipher[]): void;

  /**
   * 检查存档是否存在
   *
   * @param key - 存储键名
   * @returns 存档是否存在
   */
  has(key: string): boolean;

  /**
   * 删除指定存档
   * @param key - 存储键名
   */
  delete(key: string): void;

  /**
   * 清空所有存档
   */
  clear(): void;
}

/**
 * 本地存储接口
 *
 * - 负责本地数据存储
 * - 支持存档模板
 * - 支持编解码器链
 * - 支持自动保存
 * - 支持版本迁移
 * - 支持用户空间隔离
 */
export interface IStorage extends IMod {
  get ability(): IStorageAbility;
  dependencies: { launcher: ILauncherAbility };
}
