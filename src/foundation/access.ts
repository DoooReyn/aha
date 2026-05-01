import { LightMap } from './light-map';

/** 全局可访问环境 */
const GLOBALS = globalThis || window || self || frames || {};

/**
 * 可访问环境服务实现
 *
 * 提供全局环境访问能力，允许通过键值对的方式存储和获取数据
 */
class Access extends LightMap<LightMap> {
  /** 默认用户可访问环境 */
  public get user() {
    return this.acquire('user');
  }

  /** 默认全局可访问环境 */
  public get global() {
    return this.acquire('global', GLOBALS);
  }

  /**
   * 获取可访问环境
   * @param token 唯一标识符
   * @param env 可访问环境
   * @returns 可访问环境条目
   */
  public acquire(token: string, env?: Record<string | symbol, unknown>) {
    if (!this.has(token)) {
      const inst = new LightMap(env);
      this.set(token, inst);
      return inst;
    }
    return this.get(token)!;
  }
}

/** 可访问环境服务唯一实例 */
export const access = new Access();
