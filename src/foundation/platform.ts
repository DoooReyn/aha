import { sys } from 'cc';

/**
 * 平台鉴定工具
 *
 * 提供平台相关的属性，方便在代码中进行平台适配
 */

/* 操作系统 */
const os = sys.os;
/* 平台 */
const platform = sys.platform;
/* 是否小端字节序 */
const littleEndian = sys.isLittleEndian;
/* 原生环境 */
const native = sys.isNative;
/* 移动端环境 */
const mobile = sys.isMobile;
/* 浏览器环境 */
const browser = sys.isBrowser;
/* macOS */
const macos = sys.OS.OSX === os;
/* Windows */
const windows = sys.OS.WINDOWS === os;
/* Linux */
const linux = sys.OS.LINUX === os;
/* iOS */
const ios = sys.OS.IOS === os;
/* Android */
const android = sys.OS.ANDROID === os;
/* OpenHarmony */
const ohos = sys.OS.OHOS === os;
/* 桌面端环境 */
const desktop = macos || windows || linux;
/* 移动端原生环境 */
const mobileNative = mobile && native;
/* 桌面端原生环境 */
const desktopNative = desktop && native;
/* iOS原生环境 */
const iosNative = ios && native;
/* Android原生环境 */
const androidNative = android && native;
/* OpenHarmony原生环境 */
const ohosNative = ohos && native;
/* 移动端浏览器环境 */
const mobileBrowser = mobile && browser;
/* 桌面端浏览器环境 */
const desktopBrowser = desktop && browser;
/* iOS浏览器环境 */
const iosBrowser = ios && browser;
/* Android浏览器环境 */
const androidBrowser = android && browser;
/* OpenHarmony浏览器环境 */
const ohosBrowser = ohos && browser;
/* 微信小游戏 */
const wxGame = platform === sys.Platform.WECHAT_GAME;
/* 华为小游戏 */
const hwGame = platform === sys.Platform.HUAWEI_QUICK_GAME;
/* 支付宝小游戏 */
const zfbGame = platform === sys.Platform.ALIPAY_MINI_GAME;
/* 小米小游戏 */
const xmGame = platform === sys.Platform.XIAOMI_QUICK_GAME;
/* 字节小游戏 */
const dyGame = platform === sys.Platform.BYTEDANCE_MINI_GAME;
/* 淘宝小游戏 */
const tbGame = platform === sys.Platform.TAOBAO_MINI_GAME;
/* 荣耀小游戏 */
const honorGame = platform === sys.Platform.HONOR_MINI_GAME;
/* OPPO小游戏 */
const oppoGame = platform === sys.Platform.OPPO_MINI_GAME;
/* VIVO小游戏 */
const vivoGame = platform === sys.Platform.VIVO_MINI_GAME;

/**
 * 平台鉴定工具集合
 */
export {
  os,
  platform,
  littleEndian as isLittleEndian,
  native as isNative,
  mobile as isMobile,
  browser as isBrowser,
  macos as isMacos,
  windows as isWindows,
  linux as isLinux,
  ios as isIos,
  android as isAndroid,
  ohos as isOhos,
  desktop as isDesktop,
  mobileNative as isMobileNative,
  desktopNative as isDesktopNative,
  iosNative as isIosNative,
  androidNative as isAndroidNative,
  ohosNative as isOhosNative,
  mobileBrowser as isMobileBrowser,
  desktopBrowser as isDesktopBrowser,
  iosBrowser as isIosBrowser,
  androidBrowser as isAndroidBrowser,
  ohosBrowser as isOhosBrowser,
  wxGame as isWxGame,
  hwGame as isHwGame,
  zfbGame as isZfbGame,
  xmGame as isXmGame,
  dyGame as isDyGame,
  tbGame as isTbGame,
  honorGame as isHonorGame,
  oppoGame as isOppoGame,
  vivoGame as isVivoGame,
};
