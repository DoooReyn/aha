import { settings, SettingsCategory } from 'cc';

import { Journal } from '../journal';

/**
 * 引擎模块查询器
 */

/** 模块列表 */
const _modules: string[] = settings.querySettings(SettingsCategory.ENGINE, 'engineModules') as string[];

/** 查询结果缓存 */
const _result: Record<string, boolean> = Object.create(null);

/**
 * 查询引擎模块
 * @param mod 模块名称
 * @returns
 */
function query(mod: string) {
  const result = !!(_result[mod] ??= _modules.includes(mod));
  if (!result) {
    Journal.Debug(`引擎模块未开启: ${mod}`);
  }
  return result;
}

/** 图形模块是否开启 */
function isGraphicsEnabled() {
  return query('graphics');
}

/** spine模块是否开启 */
function isSpineEnabled() {
  return query('spine-3.8') || query('spine-4.2');
}

/** 龙骨模块是否开启 */
function isDragonBonesEnabled() {
  return query('dragon-bones');
}

/** 遮罩模块是否开启 */
function isMaskEnabled() {
  return query('mask');
}

/** 富文本模块是否开启 */
function isRichTextEnabled() {
  return query('rich-text');
}

/** 瓦片地图模块是否开启 */
function isTiledMapEnabled() {
  return query('tiled-map');
}

/** 2D粒子模块是否开启 */
function isParticleEnabled() {
  return query('particle-2d');
}

/** 2D倾斜模块是否开启 */
function isSkewEnabled() {
  return query('ui-skew');
}

/** 视频模块是否开启 */
function isVideoEnabled() {
  return query('video');
}

/** 网页视图模块是否开启 */
function isWebviewEnabled() {
  return query('webview');
}

/**
 * 引擎模块查询器集合
 */
export {
  query,
  isGraphicsEnabled,
  isSpineEnabled,
  isDragonBonesEnabled,
  isMaskEnabled,
  isRichTextEnabled,
  isTiledMapEnabled,
  isParticleEnabled,
  isSkewEnabled,
  isVideoEnabled,
  isWebviewEnabled,
};
