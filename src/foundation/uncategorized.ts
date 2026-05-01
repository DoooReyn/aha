import { sys } from 'cc';

import { SyncOperation } from './interfaces/general';
import { now } from './time';

/**
 * 杂项工具
 *
 * 提供未归类的常用方法
 */

/** 什么也不做 */
function idle(..._args: unknown[]) {}

/** 网页重载 */
function reload() {
  if (sys.isBrowser) {
    window.location.reload();
  }
}

/**
 * 节流
 * @tip 记忆口诀：到点就干，不到不干
 * @tip 执行规则：固定时间内，最多执行一次
 * @tip 触发频率：高频率触发 → 均匀间隔执行
 * @tip 典型场景：滚动加载、鼠标移动、高频点击、视频播放时间更新
 * @param handle 句柄
 * @param context 上下文
 * @param delay 延迟时间默认 500 ms
 */
function throttle(handle: SyncOperation<unknown[], unknown>, context = {}, delay: number = 500) {
  let lastTime = 0; // 记录上次执行时间
  return function (...args: unknown[]) {
    const time = now();
    // 超过时间间隔才执行
    if (time - lastTime >= delay) {
      handle.apply(context, args);
      lastTime = time;
    }
  };
}

/**
 * 防抖
 * @tip 记忆口诀：等你停手，我再干活
 * @tip 执行规则：停止触发后，延迟执行
 * @tip 触发频率：高频率触发 → 最终只执行 1 次
 * @tip 典型场景：搜索框输入、窗口拉伸、按钮防重复点击
 * @param handle 句柄
 * @param context 上下文
 * @param delay 延迟时间默认 500 ms
 */
function debounce(handle: SyncOperation<unknown[], unknown>, context = {}, delay: number = 500) {
  let timer: number = null;
  return (...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      handle.apply(context, args);
      timer = null;
    }, delay) as unknown as number;
  };
}

/**
 * 杂项工具集合
 */
export { idle, reload, throttle, debounce };
