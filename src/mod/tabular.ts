/**
 * 配置中心（Tabular）
 *
 * 王国的配置表数据管理专家
 * - 加载 zlib 压缩的二进制配置文件
 * - 解析三段式 CSV 格式数据
 * - 提供类型安全的查询接口
 * - 实现 LRU 缓存机制
 * - 确保数据安全（查询结果深拷贝）
 */
import { BufferAsset } from 'cc';

import { LZU8Cipher } from '../foundation/cipher-lzstring';
import { LRUCache } from '../foundation/collections/lru-cache';
import { deepCopy } from '../foundation/dict';
import { Journal } from '../journal';
import {
  AggregateOp,
  CustomParser,
  FieldType,
  IConfigTableSchema,
  ITabular,
  ITabularAbility,
  ITabularConfig,
  KVObject,
  KVObjectArray,
  KVValue,
} from './contract';
import { BaseMod } from './mod';

/**
 * 类型转换器类
 */
class TypeParser {
  /**
   * 解析字符串
   */
  public parseString(value: string): string {
    return value;
  }

  /**
   * 解析整数
   */
  public parseNumber(value: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Cannot parse "${value}" as number`);
    }
    return num;
  }

  /**
   * 解析布尔值
   * 支持: true, false, 1, 0
   */
  public parseBoolean(value: string): boolean {
    const normalized = value.toLowerCase().trim();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    throw new Error(`Cannot parse "${value}" as boolean`);
  }

  /**
   * 解析 KV 对象
   * 格式: "key1:value1|key2:value2"
   */
  public parseKV(value: string, valueType: 'string' | 'number' | 'boolean'): KVObject {
    if (!value || value.trim() === '') {
      return {};
    }

    const result: KVObject = {};
    const pairs = value.split('|');

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex === -1) {
        throw new Error(`Invalid KV pair: "${pair}"`);
      }

      const key = pair.substring(0, colonIndex).trim();
      const valStr = pair.substring(colonIndex + 1).trim();

      if (!key) {
        throw new Error(`Empty key in KV pair: "${pair}"`);
      }

      // 根据值类型转换
      let val: KVValue;
      switch (valueType) {
        case 'string':
          val = valStr;
          break;
        case 'number':
          val = this.parseNumber(valStr);
          break;
        case 'boolean':
          val = this.parseBoolean(valStr);
          break;
        default:
          throw new Error(`Unknown value type: ${valueType}`);
      }

      result[key] = val;
    }

    return result;
  }

  /**
   * 解析字符串数组
   * 格式: "a|b|c"
   */
  public parseStringArray(value: string): string[] {
    if (!value || value.trim() === '') {
      return [];
    }
    return value.split('|').map((s) => s.trim());
  }

  /**
   * 解析整数数组
   * 格式: "1|2|3"
   */
  public parseNumberArray(value: string): number[] {
    if (!value || value.trim() === '') {
      return [];
    }
    return value.split('|').map((s) => this.parseNumber(s.trim()));
  }

  /**
   * 解析布尔数组
   * 格式: "true|false|1|0"
   */
  public parseBooleanArray(value: string): boolean[] {
    if (!value || value.trim() === '') {
      return [];
    }
    return value.split('|').map((s) => this.parseBoolean(s.trim()));
  }

  /**
   * 解析 KV 对象数组
   * 格式: "a:1|b:2|c:3|d:4" -> [{a:1,b:2},{c:3,d:4}]
   * 使用 | 分隔多个 KV 对象
   */
  public parseKVArray(value: string, valueType: 'string' | 'number' | 'boolean'): KVObjectArray {
    if (!value || value.trim() === '') {
      return [];
    }

    const kvStrings = value.split('|');
    const result: KVObjectArray = [];

    for (const kvStr of kvStrings) {
      const kv = this.parseKV(kvStr.trim(), valueType);
      result.push(kv);
    }

    return result;
  }

  /**
   * 解析自定义类型
   */
  public parseCustom<T>(value: string, parser: CustomParser<T>): T {
    return parser(value);
  }

  /**
   * 根据字段类型解析值
   */
  public parseByType(value: string, fieldType: string, customParser?: CustomParser<unknown>): unknown {
    // 处理数组类型
    if (fieldType.endsWith('[]')) {
      const baseType = fieldType.slice(0, -2);
      switch (baseType) {
        case 'string':
          return this.parseStringArray(value);
        case 'number':
          return this.parseNumberArray(value);
        case 'boolean':
          return this.parseBooleanArray(value);
        case 'kv':
          // 默认为 string 值类型
          return this.parseKVArray(value, 'string');
        default:
          // custom[] 或 kv:valueType[]
          if (baseType === 'custom') {
            if (!customParser) {
              throw new Error(`Custom parser required for field type: ${fieldType}`);
            }
            const arr = this.parseStringArray(value);
            return arr.map((v) => this.parseCustom(v, customParser as CustomParser<unknown>));
          }
          if (baseType.startsWith('kv:')) {
            const valueType = baseType.slice(3) as 'string' | 'number' | 'boolean';
            return this.parseKVArray(value, valueType);
          }
          throw new Error(`Unknown array type: ${fieldType}`);
      }
    }

    // 处理 KV 类型
    if (fieldType === 'kv') {
      // 默认为推断类型或 string
      return this.parseKV(value, 'string');
    }
    if (fieldType.startsWith('kv:')) {
      const valueType = fieldType.slice(3) as 'string' | 'number' | 'boolean';
      return this.parseKV(value, valueType);
    }

    // 处理基础类型
    switch (fieldType) {
      case 'string':
        return this.parseString(value);
      case 'number':
        return this.parseNumber(value);
      case 'boolean':
        return this.parseBoolean(value);
      case 'custom':
        if (!customParser) {
          throw new Error(`Custom parser required for field type: ${fieldType}`);
        }
        return this.parseCustom(value, customParser as CustomParser<unknown>);
      default:
        throw new Error(`Unknown field type: ${fieldType}`);
    }
  }
}

/**
 * 校验错误
 */
class ValidationError extends Error {
  public constructor(
    public readonly field: string,
    public readonly reason: string
  ) {
    super(`Validation error for field "${field}": ${reason}`);
    this.name = 'ValidationError';
  }
}

/**
 * 数据校验器类
 */
class DataValidator {
  /**
   * 验证单个值是否匹配字段类型
   */
  public validateValue(value: unknown, fieldType: FieldType): boolean {
    // null 或 undefined 总是有效的（可能是可选字段）
    if (value === null || value === undefined) {
      return true;
    }

    switch (fieldType) {
      case 'string':
        return typeof value === 'string';

      case 'number':
        return typeof value === 'number' && Number.isInteger(value);

      case 'boolean':
        return typeof value === 'boolean';

      case 'kv':
        return this._isKVObject(value);

      case 'custom':
        // custom 类型无法校验，跳过
        return true;

      case 'string[]':
        return Array.isArray(value) && value.every((v) => typeof v === 'string');

      case 'number[]':
        return Array.isArray(value) && value.every((v) => typeof v === 'number' && Number.isInteger(v));

      case 'boolean[]':
        return Array.isArray(value) && value.every((v) => typeof v === 'boolean');

      case 'kv[]':
        return Array.isArray(value) && value.every((v) => this._isKVObject(v));

      case 'custom[]':
        // custom[] 类型无法校验，跳过
        return true;

      default:
        // 处理 kv:valueType 格式
        if ((<string>fieldType).startsWith('kv:')) {
          const valueType = (<string>fieldType).slice(3) as 'string' | 'number' | 'boolean';
          return this._isKVObject(value, valueType);
        }
        return false;
    }
  }

  /**
   * 验证是否为 KV 对象
   */
  private _isKVObject(value: unknown, valueType?: 'string' | 'number' | 'boolean'): value is KVObject {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const kv = value as Record<string, unknown>;
    for (const key in kv) {
      if (!Object.prototype.hasOwnProperty.call(kv, key)) {
        continue;
      }

      const val = kv[key];

      // 验证键类型
      if (typeof key !== 'string' && typeof key !== 'number') {
        return false;
      }

      // 验证值类型
      if (valueType) {
        switch (valueType) {
          case 'string':
            if (typeof val !== 'string') return false;
            break;
          case 'number':
            if (typeof val !== 'number' || !Number.isInteger(val)) return false;
            break;
          case 'boolean':
            if (typeof val !== 'boolean') return false;
            break;
        }
      } else {
        // 未指定值类型时，检查是否为合法的 KV 值类型
        if (typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 验证记录是否包含所有必需字段
   */
  public validateRequiredFields<T extends Record<string, unknown>>(record: T, requiredFields: (keyof T)[]): boolean {
    for (const field of requiredFields) {
      if (!(field in record) || record[field] === null || record[field] === undefined) {
        return false;
      }
    }
    return true;
  }

  /**
   * 验证主键是否唯一
   */
  public validatePrimaryKeyUniqueness<T extends Record<string, unknown>>(data: T[], primaryKey: keyof T): boolean {
    const seen = new Set<unknown>();
    for (const record of data) {
      const key = record[primaryKey];
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
    }
    return true;
  }

  /**
   * 验证整个数据集
   */
  public validateDataset<T extends Record<string, unknown>>(
    data: T[],
    types: Record<keyof T, FieldType>,
    primaryKey: keyof T,
    requiredFields?: (keyof T)[]
  ): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 验证主键唯一性
    if (!this.validatePrimaryKeyUniqueness(data, primaryKey)) {
      errors.push(new ValidationError(primaryKey as string, 'Primary key must be unique'));
    }

    // 验证每条记录
    for (let i = 0; i < data.length; i++) {
      const record = data[i];

      // 验证必填字段
      if (requiredFields) {
        if (!this.validateRequiredFields(record, requiredFields)) {
          errors.push(new ValidationError('required', `Missing required fields at record ${i}`));
        }
      }

      // 验证字段类型
      for (const field in types) {
        const value = record[field];
        if (!this.validateValue(value, types[field])) {
          errors.push(new ValidationError(field as string, `Type mismatch at record ${i}, expected ${types[field]}`));
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证字段类型字符串是否合法
   */
  public isValidFieldTypeString(typeStr: string): boolean {
    const validTypes: FieldType[] = [
      'string',
      'number',
      'boolean',
      'kv',
      'custom',
      'string[]',
      'number[]',
      'boolean[]',
      'kv[]',
      'custom[]',
    ];

    // 检查精确匹配
    if (validTypes.includes(typeStr as FieldType)) {
      return true;
    }

    // 检查 kv:valueType 格式
    if (typeStr.startsWith('kv:')) {
      const valueType = typeStr.slice(3);
      return valueType === 'string' || valueType === 'number' || valueType === 'boolean';
    }

    return false;
  }
}

/**
 * CSV 解析错误构造
 */
class CSVParseError extends Error {
  public constructor(
    public readonly line: number,
    public readonly column: number,
    message: string
  ) {
    super(`CSV parse error at line ${line}, column ${column}: ${message}`);
    this.name = 'CSVParseError';
  }
}

/**
 * CSV 解析器类
 */
class CSVParser<T extends Record<string, unknown>> {
  private _typeParser: TypeParser;

  public constructor() {
    this._typeParser = new TypeParser();
  }

  /**
   * 解析三段式 CSV 字符串
   */
  public parse(
    csv: string,
    types: Record<keyof T, FieldType>,
    customParsers?: Record<string, CustomParser<unknown>>
  ): T[] {
    // 分割行
    const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length < 3) {
      throw new Error('CSV must have at least 3 lines (field names, field types, data)');
    }

    // 解析第1行：字段名
    const fieldNames = this._splitLine(lines[0]);
    const fieldCount = fieldNames.length;

    // 解析第2行：字段类型（用于验证）
    const declaredTypes = this._splitLine(lines[1]);
    if (declaredTypes.length !== fieldCount) {
      throw new CSVParseError(2, 0, 'Field types count must match field names count');
    }

    // 验证字段名与类型声明匹配
    for (let i = 0; i < fieldCount; i++) {
      const fieldName = fieldNames[i];
      if (!types[fieldName]) {
        throw new CSVParseError(1, i, `Field "${fieldName}" not found in types definition`);
      }
    }

    // 解析数据行（从第3行开始）
    const result: T[] = [];
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // 跳过空行

      const values = this._splitLine(line);
      if (values.length !== fieldCount) {
        throw new CSVParseError(i + 1, 0, `Expected ${fieldCount} values, got ${values.length}`);
      }

      // 构建对象
      const record: Partial<T> = {};
      for (let j = 0; j < fieldCount; j++) {
        const fieldName = fieldNames[j] as keyof T;
        const fieldType = types[fieldName];
        const value = values[j];

        try {
          // 获取自定义解析器（如果是 custom 类型）
          let customParser: CustomParser<unknown> | undefined;
          if (fieldType === 'custom' || fieldType === 'custom[]') {
            customParser = customParsers?.[fieldName as string];
          }

          record[fieldName] = this._typeParser.parseByType(value, fieldType, customParser) as T[keyof T];
        } catch (error) {
          if (error instanceof Error) {
            throw new CSVParseError(i + 1, j, error.message);
          }
          throw error;
        }
      }

      result.push(record as T);
    }

    return result;
  }

  /**
   * 验证数据完整性
   */
  public validate(data: T[], types: Record<keyof T, FieldType>): boolean {
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      for (const field in types) {
        if (!(field in record)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 填充默认值
   */
  public fillDefaults(data: T[], defaults: Partial<T>): T[] {
    if (Object.keys(defaults).length === 0) {
      return data;
    }

    return data.map((record) => ({ ...defaults, ...record }));
  }

  /**
   * 分割 CSV 行
   * 简单实现，不支持引号包裹的字段
   */
  private _splitLine(line: string): string[] {
    return line.split(',').map((s) => s.trim());
  }

  /**
   * 解析字段名
   */
  public parseFieldNames(csv: string): string[] {
    const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length === 0) {
      throw new Error('CSV is empty');
    }
    return this._splitLine(lines[0]);
  }

  /**
   * 解析字段类型
   */
  public parseFieldTypes(csv: string): FieldType[] {
    const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) {
      throw new Error('CSV must have at least 2 lines');
    }
    return this._splitLine(lines[1]) as FieldType[];
  }
}

/**
 * 配置表查询类
 */
class ConfigTableQuery<T extends Record<string, unknown>> {
  /** 数据存储（主键 -> 记录） */
  private _data: Map<string, T>;
  /** 主键字段名 */
  private _primaryKey: keyof T;
  /** 查询结果缓存 */
  private _cache: LRUCache<string, T[]>;
  /** 是否启用缓存 */
  private _cacheEnabled: boolean;

  constructor(data: Map<string, T>, primaryKey: keyof T, cacheSize: number) {
    this._data = data;
    this._primaryKey = primaryKey;
    this._cacheEnabled = cacheSize > 0;

    if (this._cacheEnabled) {
      this._cache = new LRUCache<string, T[]>(cacheSize);
    }
  }

  /**
   * 根据主键查询单条记录
   */
  public findByPrimaryKey(id: string): T | null {
    const record = this._data.get(id);
    if (!record) {
      return null;
    }
    // 深拷贝返回
    return deepCopy(record) as T;
  }

  /**
   * 根据字段值查询记录列表
   */
  public findByField<K extends keyof T>(field: K, value: T[K]): T[] {
    const cacheKey = `field:${String(field)}:${String(value)}`;
    const cached = this._getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const results: T[] = [];
    for (const record of this._data.values()) {
      if (record[field] === value) {
        results.push(record);
      }
    }

    const copied = results.map((r) => deepCopy(r)) as T[];
    this._setCached(cacheKey, copied);
    return copied;
  }

  /**
   * 根据条件函数查询记录列表
   */
  public findWhere(condition: (item: T) => boolean): T[] {
    // 条件查询不缓存（因为函数无法序列化为缓存键）
    const results: T[] = [];
    for (const record of this._data.values()) {
      if (condition(record)) {
        results.push(record);
      }
    }
    return results.map((r) => deepCopy(r)) as T[];
  }

  /**
   * 获取所有记录
   */
  public getAll(): T[] {
    const cacheKey = 'all';
    const cached = this._getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const results = Array.from(this._data.values()).map((r) => deepCopy(r)) as T[];
    this._setCached(cacheKey, results);
    return results;
  }

  /**
   * 按字段分组
   */
  public groupBy<K extends keyof T>(field: K): Record<string, T[]> {
    // 分组查询不缓存（因为返回类型与缓存类型不兼容）
    const result: Record<string, T[]> = {};

    for (const record of this._data.values()) {
      const key = String(record[field]);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(deepCopy(record) as T);
    }

    return result;
  }

  /**
   * 聚合查询
   */
  public aggregate<K extends keyof T>(field: K, op: AggregateOp): number {
    // 聚合查询不缓存
    const values: number[] = [];
    for (const record of this._data.values()) {
      const value = record[field];
      if (typeof value === 'number') {
        values.push(value);
      }
    }

    switch (op) {
      case 'sum':
        return values.reduce((sum, v) => sum + v, 0);
      case 'avg':
        if (values.length === 0) return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      case 'min':
        if (values.length === 0) return 0;
        return Math.min(...values);
      case 'max':
        if (values.length === 0) return 0;
        return Math.max(...values);
      case 'count':
        return this._data.size;
      default:
        throw new Error(`Unknown aggregate operation: ${op}`);
    }
  }

  /**
   * 排序
   */
  public sortBy<K extends keyof T>(field: K, order: 'asc' | 'desc' = 'asc'): T[] {
    const cacheKey = `sortBy:${String(field)}:${order}`;
    const cached = this._getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const sorted = Array.from(this._data.values())
      .map((r) => deepCopy(r) as T)
      .sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });

    this._setCached(cacheKey, sorted);
    return sorted;
  }

  /**
   * 获取记录数量
   */
  public count(): number {
    return this._data.size;
  }

  /**
   * 检查主键是否存在
   */
  public has(id: string): boolean {
    return this._data.has(id);
  }

  /**
   * 清空查询缓存
   */
  public clearCache(): void {
    if (this._cache) {
      this._cache.clear();
    }
  }

  /**
   * 获取缓存的数据
   */
  private _getCached(key: string): T[] | null {
    if (!this._cacheEnabled || !this._cache) {
      return null;
    }
    const cached = this._cache.get(key);
    return cached ? (deepCopy(cached) as T[]) : null;
  }

  /**
   * 设置缓存数据
   */
  private _setCached(key: string, value: T[]): void {
    if (!this._cacheEnabled || !this._cache) {
      return;
    }
    this._cache.set(key, value);
  }
}

/**
 * 内部表结构
 */
interface ITableInternal<T extends Record<string, unknown>> {
  schema: IConfigTableSchema<T>;
  data: Map<string, T>;
  query: ConfigTableQuery<T> | null;
  loaded: boolean;
}

/**
 * 配置中心能力实现
 */
class TabularAbility implements ITabularAbility {
  /** 表注册表 */
  private _tables: Map<string, ITableInternal<Record<string, unknown>>>;
  /** 默认配置 */
  private _config: Required<ITabularConfig>;

  public constructor(
    public mod: ITabular,
    config: Partial<ITabularConfig> = {}
  ) {
    this._tables = new Map();
    this._config = {
      defaultCacheSize: 100,
      debug: false,
      ...config,
    };
  }

  public async attach(): Promise<void> {
    Journal.Info('配置中心模块已就位');
  }

  public detach(): void {
    // 清空所有表和缓存
    this.clear();
    this._tables.clear();
    Journal.Info('配置中心已清理所有配置表');
  }

  public registerTable<T extends Record<string, unknown>>(schema: IConfigTableSchema<T>): void {
    if (this._tables.has(schema.key)) {
      throw new Error(`Table "${schema.key}" already registered`);
    }

    const table: ITableInternal<T> = {
      schema,
      data: new Map(),
      query: null,
      loaded: false,
    };

    this._tables.set(schema.key, table as ITableInternal<Record<string, unknown>>);

    if (this._config.debug) {
      Journal.Debug(`配置表已注册: ${schema.key}`);
    }
  }

  public async loadTable<T extends Record<string, unknown>>(key: string): Promise<void> {
    const table = this._tables.get(key);
    if (!table) {
      throw new Error(`Table "${key}" not registered`);
    }

    // 已加载则跳过
    if (table.loaded) {
      if (this._config.debug) {
        Journal.Debug(`配置表已加载: ${key}`);
      }
      return;
    }

    const dynamic = this.mod.dependencies.resDynamic;
    const cache = this.mod.dependencies.resCache;

    // 加载文件
    const csvAsset = await dynamic.load(table.schema.uri, BufferAsset);
    cache.borrow<BufferAsset>(table.schema.uri);
    const csv = LZU8Cipher.decode(new Uint8Array(csvAsset.buffer()));

    // 解析 CSV
    const parser = new CSVParser<T>();
    const types = table.schema.types as Record<keyof T, FieldType>;
    const customParsers = table.schema.customParsers as Record<string, CustomParser<unknown>> | undefined;
    const data = parser.parse(csv, types, customParsers);

    // 验证数据
    const validator = new DataValidator();
    const validation = validator.validateDataset(
      data,
      types,
      table.schema.primaryKey,
      Object.keys(table.schema.defaults || {}) as (keyof T)[]
    );

    if (!validation.valid) {
      const errors = validation.errors.map((e) => e.message).join('; ');
      throw new Error(`Table "${key}" validation failed: ${errors}`);
    }

    // 填充默认值
    const defaults = table.schema.defaults as Partial<T> | undefined;
    const dataWithDefaults = parser.fillDefaults(data, defaults || {});

    // 存储数据
    for (const record of dataWithDefaults) {
      const primaryKey = String(record[table.schema.primaryKey]);
      table.data.set(primaryKey, record as Record<string, unknown>);
    }

    // 创建查询接口
    table.query = new ConfigTableQuery(
      table.data as Map<string, T>,
      table.schema.primaryKey as keyof T,
      table.schema.cacheSize
    ) as ConfigTableQuery<Record<string, unknown>>;
    table.loaded = true;

    Journal.Info(`配置表已加载: ${key} (${dataWithDefaults.length} 条记录)`);
  }

  public getQuery<T extends Record<string, unknown>>(key: string): ConfigTableQuery<T> {
    const table = this._tables.get(key);
    if (!table) {
      throw new Error(`配置表 "${key}" 未注册`);
    }

    if (!table.loaded) {
      throw new Error(`配置表 "${key}" 未加载`);
    }

    return table.query as ConfigTableQuery<T>;
  }

  public hasTable(key: string): boolean {
    return this._tables.has(key);
  }

  public isTableLoaded(key: string): boolean {
    const table = this._tables.get(key);
    return table ? table.loaded : false;
  }

  public unloadTable(key: string): void {
    const table = this._tables.get(key);
    if (!table) {
      return;
    }

    table.data.clear();
    if (table.query) {
      table.query.clearCache();
    }
    table.loaded = false;

    if (this._config.debug) {
      Journal.Debug(`配置表已卸载: ${key}`);
    }
  }

  public clear(): void {
    for (const key of this._tables.keys()) {
      this.unloadTable(key);
    }
  }

  public getTableKeys(): string[] {
    return Array.from(this._tables.keys());
  }

  public getTableStats(key: string): { loaded: boolean; count: number } | null {
    const table = this._tables.get(key);
    if (!table) {
      return null;
    }
    return {
      loaded: table.loaded,
      count: table.data.size,
    };
  }
}

/**
 * 配置中心实现
 */
class Tabular extends BaseMod<TabularAbility> implements ITabular {
  public static readonly InitArgs: Parameters<Tabular['loadAbility']>;
  public static readonly Trait: string = 'tabular';
  declare public dependencies: ITabular['dependencies'];

  protected loadAbility(config: Partial<ITabularConfig> = {}): TabularAbility {
    return new TabularAbility(this, config);
  }
}

export { Tabular };
