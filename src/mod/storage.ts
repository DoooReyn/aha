import { sys } from 'cc';

import { debounce, mightSync, ChainedCipher, Dict, ICipher } from '../foundation';
import { Journal } from '../journal';
import { IStorage, IStorageAbility, IStorageConfig, IStorageSchema } from './contract/storage';
import { BaseMod } from './mod';

/**
 * 本地存储错误码
 */
enum StorageCode {
  /** 重复的存档模板 */
  SchemaDuplicated,
  /** 未找到存档模板 */
  SchemeNotFound,
  /** 存档迁移失败 */
  MigrationFailed,
}

/**
 * 本地存储错误构造
 */
class StorageError extends Error {
  public constructor(
    code: StorageCode,
    public readonly key: string
  ) {
    super(StorageCode[code]);
  }
}

/**
 * 本地存储能力实现
 */
class StorageAbility implements IStorageAbility {
  /** 存档模板映射表 */
  private _schemas: Map<string, IStorageSchema>;
  /** 存档内存缓存 */
  private _archives: Map<string, Record<string, unknown>>;
  /** 代理对象缓存 */
  private _proxies: Map<string, Record<string, unknown>>;
  /** 编解码器链 */
  private _chainedCipher: ChainedCipher<unknown, string>;
  /** 用户空间，用于隔离账号 */
  private readonly _userspace: string;
  /** 自动保存防抖 */
  private _autoSaver: () => void;
  /** 待保存的键名 */
  private _toSaves: Set<string>;

  /**
   * @param config - 配置
   */
  public constructor(
    public mod: IStorage,
    config: IStorageConfig
  ) {
    const launcher = this.mod.dependencies.launcher;
    this._userspace = `${launcher.app}#${launcher.env}`;
    this._autoSaver = debounce(this._autoSave, this, 100);
    this._schemas = new Map();
    this._archives = new Map();
    this._proxies = new Map();
    this._chainedCipher = new ChainedCipher(...config.ciphers);
    this._toSaves = new Set();
  }

  public async attach(): Promise<void> {}

  public detach(): void {
    void this.saveAll();
    this._schemas.clear();
    this._archives.clear();
    this._proxies.clear();
    this._toSaves.clear();
    this._schemas = null;
    this._archives = null;
    this._proxies = null;
    this._chainedCipher = null;
    this._autoSaver = null;
    this._toSaves = null;
    this.mod = null;
  }

  /**
   * 获取真实的键名
   * @param key 键名
   * @returns
   */
  private _makeKey(key: string) {
    return `${this._userspace}@${key}`;
  }

  /** 从本地存储中获取 */
  private _rawget(key: string) {
    return sys.localStorage.getItem(this._makeKey(key));
  }

  /** 从本地存储中设置 */
  private _rawset(key: string, data: string) {
    sys.localStorage.setItem(this._makeKey(key), data);
  }

  /** 从本地存储中删除 */
  private _rawunset(key: string) {
    sys.localStorage.removeItem(this._makeKey(key));
  }

  /**
   * 从存储加载存档（带迁移）
   *
   * @param schema - 存档模板
   * @returns 加载的存档
   */
  private _loadFromStorage<T>(schema: IStorageSchema<T>): T {
    const raw = this._rawget(schema.key);

    if (!raw) {
      // 首次使用，返回默认值
      return schema.defaults();
    }

    const decoded = this._chainedCipher.decode(raw) as { _version: number } & T;
    decoded._version ??= 1;
    const storedVersion = decoded._version;
    if (storedVersion < schema.version) {
      return this._migrate(decoded, schema);
    }
    return decoded as T;
  }

  /**
   * 迁移存档
   *
   * @param stored - 旧存档
   * @param schema - 存档模板
   * @returns 迁移后的存档
   */
  private _migrate<T>(stored: { _version: number } & T, schema: IStorageSchema<T>): T {
    const currentVersion = stored._version || 1;
    let data = stored;
    for (let v = currentVersion; v < schema.version; v++) {
      const migrate = schema.migrations?.[v];
      if (migrate) {
        const [migrated, err] = mightSync(migrate, undefined, data);
        if (err) {
          Journal.Error(`存档迁移失败: ${schema.key} v${v} -> v${v + 1}`, err);
          throw new StorageError(StorageCode.MigrationFailed, schema.key);
        } else {
          data = migrated as { _version: number } & T;
          Journal.Debug(`存档迁移完成: ${schema.key} v${v} -> v${v + 1}`);
        }
      }
    }
    // 标记新版本
    data._version = schema.version;
    return data as T;
  }

  /**
   * 创建代理对象
   *
   * @param key - 存储键名
   * @param target - 目标对象
   * @returns 代理对象
   */
  private _createProxy<T>(key: string, target: T): T {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return new Proxy(target as object, {
      set(obj: Dict, prop, value) {
        obj[prop] = value;
        self._toSaves.add(key);
        self._autoSaver();
        return true;
      },

      deleteProperty(obj: Dict, prop) {
        delete obj[prop];
        self._toSaves.add(key);
        self._autoSaver();
        return true;
      },
    }) as T;
  }

  /** 自动保存 */
  private _autoSave() {
    const keys = Array.from(this._toSaves);
    this._toSaves.clear();
    keys.forEach((key) => this.save(key));
  }

  public register<T>(schema: IStorageSchema<T>): void {
    if (this._schemas.has(schema.key)) {
      throw new StorageError(StorageCode.SchemaDuplicated, schema.key);
    }

    this._schemas.set(schema.key, schema);

    // 尝试从存储加载
    const loaded = this._loadFromStorage(schema);
    this._archives.set(schema.key, loaded as unknown as Record<string, unknown>);

    Journal.Debug(`注册存档模板: ${schema.key} (v${schema.version})`);
  }

  public get<T>(key: string): T {
    if (!this._schemas.has(key)) {
      throw new StorageError(StorageCode.SchemeNotFound, key);
    }

    let proxy = this._proxies.get(key);

    if (!proxy) {
      const data = this._archives.get(key);
      if (!data) {
        throw new StorageError(StorageCode.SchemeNotFound, key);
      }

      // 创建 Proxy
      proxy = this._createProxy(key, data);
      this._proxies.set(key, proxy);
    }

    return proxy as unknown as T;
  }

  public async save(key: string): Promise<void> {
    if (!this._schemas.has(key)) {
      throw new StorageError(StorageCode.SchemeNotFound, key);
    }

    const schema = this._schemas.get(key);
    const data = this._archives.get(key);

    // 添加版本号
    const toSave = { ...data, _version: schema.version };

    // 使用编解码器链编码
    const encoded = this._chainedCipher.encode(toSave);

    // 保存到 localStorage
    this._rawset(key, encoded);

    Journal.Debug(`存档已保存: ${key}`);
  }

  public async saveAll(): Promise<void> {
    const keys = Array.from(this._schemas.keys());
    await Promise.all(keys.map((key) => this.save(key)));
  }

  public setChainedCipher(...ciphers: ICipher[]): void {
    this._chainedCipher = new ChainedCipher(...ciphers);
  }

  public has(key: string): boolean {
    return this._schemas.has(key);
  }

  public delete(key: string): void {
    // 从存储中删除
    this._rawunset(key);

    // 从内存中删除
    this._schemas.delete(key);
    this._archives.delete(key);
    this._proxies.delete(key);

    Journal.Debug(`存档已删除: ${key}`);
  }

  public clear(): void {
    // 删除所有存档
    for (const key of this._schemas.keys()) {
      this._rawunset(key);
    }

    // 清空内存
    this._schemas.clear();
    this._archives.clear();
    this._proxies.clear();

    Journal.Debug('存档已清空');
  }
}

/**
 * 本地存储实现
 */
class Storage extends BaseMod<StorageAbility> implements IStorage {
  public static readonly InitArgs: Parameters<Storage['loadAbility']>;
  public static readonly Trait: string = 'storage';
  declare public readonly dependencies: IStorage['dependencies'];

  protected loadAbility(config: IStorageConfig): StorageAbility {
    return new StorageAbility(this, config);
  }
}

export { Storage };
