import { js, Component, Constructor, Node } from 'cc';

/**
 * 类型检查工具
 *
 * 提供一系列函数用于检查值的类型，支持基本类型、对象类型、数组、函数、Promise、Set、Map 等常见类型
 */

/** 类型枚举 */
enum Type {
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Undefined = 'Undefined',
  Null = 'Null',
  Symbol = 'Symbol',
  Function = 'Function',
  AsyncFunction = 'AsyncFunction',
  Array = 'Array',
  Set = 'Set',
  WeakSet = 'WeakSet',
  Map = 'Map',
  WeakMap = 'WeakMap',
  Object = 'Object',
  Date = 'Date',
  Promise = 'Promise',
  RegExp = 'RegExp',
}

/**
 * 获取值的类型字符串
 * @param target - 要检查的值
 * @returns 值的类型字符串
 */
function typeOf(target: unknown): string {
  return Object.prototype.toString.call(target).slice(8, -1);
}

/**
 * 检查值的类型是否与指定类型匹配
 * @param target - 要检查的值
 * @param type - 要检查的类型
 * @return 如果值的类型与指定类型匹配则返回 true
 */
const checkType = (target: unknown, type: Type) => typeOf(target) == type;

/**
 * 检查值是否为 undefined
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 undefined 则返回 true
 */
function isUndefined<T>(value: T | undefined): value is undefined {
  return checkType(value, Type.Undefined);
}

/**
 * 检查值是否为 null
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 null 则返回 true
 */
function isNull<T>(value: T | null): value is null {
  return checkType(value, Type.Null);
}

/**
 * 检查值是否无效（undefined 或 null）
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 undefined 或 null 则返回 true
 */
function isValid(value: unknown): value is undefined | null {
  return !(isUndefined(value) || isNull(value));
}

/**
 * 检查值是否为空值
 * 如果值为 null、undefined、0、false、空字符串或 'false' 则返回 true
 * @param value - 要检查的值
 * @returns 如果值为空值则返回 true
 */
function isFalsy(value: unknown): boolean {
  return (
    isUndefined(value) ||
    isNull(value) ||
    value === 0 ||
    value === false ||
    value === 'false' ||
    value === '' ||
    (isObject(value) && Object.keys(value).length == 0) ||
    (isArray(value) && (value as unknown[]).length == 0) ||
    ((isSet(value) || isMap(value)) && (value as Set<unknown>).size == 0)
  );
}

/**
 * 检查值是否为真值（转换为布尔值后为 true）
 * @param value - 要检查的值
 * @returns 转换为布尔值后的结果
 */
function isTrue(value: unknown): boolean {
  return Boolean(value) === true;
}

/**
 * 检查值是否为假值（转换为布尔值后为 false）
 * @param value - 要检查的值
 * @returns 转换为布尔值后的结果
 */
function isFalse(value: unknown): boolean {
  return Boolean(value) === false;
}

/**
 * 检查值是否为真值（严格与 true 相等）
 * @param value - 要检查的值
 * @returns 如果值严格等于 true 则返回 true
 */
function isStrictlyTrue(value: unknown): boolean {
  return value === true;
}

/**
 * 检查值是否为假值（严格与 false 相等）
 * @param value - 要检查的值
 * @returns 如果值严格等于 false 则返回 true
 */
function isStrictlyFalse(value: unknown): boolean {
  return value === false;
}

/**
 * 检查值是否为有效的数字（数字类型且不为 NaN）
 * @param value - 要检查的值
 * @returns 如果值为有效数字则返回 true
 */
function isNumber(value: unknown): boolean {
  return checkType(value, Type.Number) && !isNaN(value as number);
}

/**
 * 检查值是否为字符串
 * @param value - 要检查的值
 * @returns 如果值为字符串类型则返回 true
 */
function isString(value: unknown): boolean {
  return checkType(value, Type.String);
}

/**
 * 检查值是否为函数
 * @param value - 要检查的值
 * @returns 如果值为函数类型则返回 true
 */
function isFunction(value: unknown): boolean {
  return checkType(value, Type.Function);
}

function isAsyncFunction(value: unknown): boolean {
  return checkType(value, Type.AsyncFunction);
}

/**
 * 检查值是否为异步函数
 * @param value - 要检查的值
 * @returns 如果值为异步函数类型则返回 true
 */
function isPromise<T>(value: Promise<T> | unknown): value is Promise<T> {
  return checkType(value, Type.Promise);
}

/**
 * 检查值是否为 Symbol
 * @param value - 要检查的值
 * @returns 如果值为 Symbol 类型则返回 true
 */
function isSymbol(value: unknown): boolean {
  return checkType(value, Type.Symbol);
}

/**
 * 检查值是否为对象（非 null 的对象类型）
 * @param value - 要检查的值
 * @returns 如果值为非 null 的对象类型则返回 true
 */
function isObject(value: unknown): boolean {
  return !isNull(value) && checkType(value, Type.Object);
}

/**
 * 检查值是否为纯对象（直接由 Object 构造函数创建或字面量创建）
 * @param value - 要检查的值
 * @returns 如果值为纯对象则返回 true
 */
function isPlainObject(value: unknown): boolean {
  if (!isObject(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * 检查值是否为数组
 * @param value - 要检查的值
 * @returns 如果值为数组类型则返回 true
 */
function isArray(value: unknown): boolean {
  return checkType(value, Type.Array) || Array.isArray(value);
}

/**
 * 检查值是否为正则表达式
 * @param value - 要检查的值
 * @returns 如果值为正则表达式类型则返回 true
 */
function isRegExp(value: unknown): boolean {
  return checkType(value, Type.RegExp);
}

/**
 * 检查值是否为 Map 对象
 * @param value - 要检查的值
 * @returns 如果值为 Map 类型则返回 true
 */
function isMap(value: unknown): boolean {
  return checkType(value, Type.Map);
}

/**
 * 检查值是否为 WeakMap 对象
 * @param value - 要检查的值
 * @returns 如果值为 WeakMap 类型则返回 true
 */
function isWeakMap(value: unknown): boolean {
  return checkType(value, Type.WeakMap);
}

/**
 * 检查值是否为 Set 对象
 * @param value - 要检查的值
 * @returns 如果值为 Set 类型则返回 true
 */
function isSet(value: unknown): boolean {
  return checkType(value, Type.Set);
}

/**
 * 检查值是否为 WeakSet 对象
 * @param value - 要检查的值
 * @returns 如果值为 WeakSet 类型则返回 true
 */
function isWeakSet(value: unknown): boolean {
  return checkType(value, Type.WeakSet);
}

/**
 * 检查值是否为日期对象
 * @param value - 要检查的值
 * @returns 如果值为日期类型则返回 true
 */
function isDate(value: unknown): boolean {
  return checkType(value, Type.Date);
}

/**
 * 检查值是否为指定构造函数的实例
 * @param value - 要检查的值
 * @param type - 构造函数或类
 * @returns 如果值是指定类型的实例则返回 true
 */
function isInstanceof<T = unknown>(value: unknown, type: Constructor<T>): boolean {
  return value instanceof type;
}

/**
 * 检查值是否为 Cocos Creator 节点
 * @param value - 要检查的值
 * @returns 如果值是 CC 节点则返回 true
 */
function isCCNode(value: unknown): boolean {
  return isInstanceof(value, Node);
}

/**
 * 检查值是否为 Cocos Creator 组件
 * @param value - 要检查的值
 * @returns 如果值是 CC 组件则返回 true
 */
function isCCComponent(value: unknown): boolean {
  return isInstanceof(value, Component);
}

/**
 * 获取 Cocos Creator 对象的类名
 * @template T - 构造函数类型
 * @param value - Cocos Creator 对象实例
 * @returns 对象的类名
 */
function getCCClassOf<T extends Constructor<unknown>>(value: InstanceType<T>): string {
  return js.getClassName(value);
}

/**
 * 检查 Cocos Creator 对象是否为指定类名
 * @template T - 构造函数类型
 * @param value - Cocos Creator 对象实例
 * @param type - 要检查的类名
 * @returns 如果对象的类名匹配则返回 true
 */
function isCCClassOf<T extends Constructor<unknown>>(value: InstanceType<T>, type: string): boolean {
  return getCCClassOf(value) === type;
}

/**
 * 检查字符串是否为有效的 URL（包含 '://' 协议分隔符）
 * @param value - 要检查的字符串
 * @returns 如果字符串是有效的 URL 则返回 true
 */
function isURL(value: string): boolean {
  return value.indexOf('://') > -1;
}

/**
 * 获取 URL 的协议部分（小写形式）
 * @param url - 要解析的 URL
 * @returns URL 的协议部分
 */
function getProtocol(url: string): string {
  return url.split('://')[0].trim().toLowerCase();
}

/**
 * 检查 URL 是否使用指定协议
 * @param url - 要检查的 URL
 * @param protocol - 协议名称
 * @returns 如果 URL 使用指定协议则返回 true
 */
function isProtocolOf(url: string, protocol: string): boolean {
  return getProtocol(url) === protocol;
}

export {
  typeOf,
  checkType,
  isUndefined,
  isNull,
  isValid,
  isFalsy,
  isTrue,
  isFalse,
  isStrictlyFalse,
  isStrictlyTrue,
  isNumber,
  isString,
  isFunction,
  isAsyncFunction,
  isPromise,
  isSymbol,
  isObject,
  isPlainObject,
  isArray,
  isRegExp,
  isMap,
  isWeakMap,
  isSet,
  isWeakSet,
  isDate,
  isInstanceof,
  isCCNode,
  isCCClassOf,
  isCCComponent,
  getCCClassOf,
  isURL,
  getProtocol,
  isProtocolOf,
};
