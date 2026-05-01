import { sys } from 'cc';

import { Journal } from '../journal';
import { mightSync } from './might';

/**
 * 时间工具
 *
 * 提供常用的时间操作方法
 */

/**
 * 常用计时点（以毫秒计）
 */
const MS = {
  /**  立刻 */
  ZERO: 0,
  /**  1 帧 */
  FRAME: 16,
  /**  1 秒钟 */
  SECOND: 1_000,
  /**  1 分钟 */
  MINUTE: 60_000,
  /**  1 小时 */
  HOUR: 3_600_000,
  /**  1 天 */
  DAY: 86_400_000,
  /**  1 周 */
  WEEK: 604_800_000,
  /** 1 月（按30天计算） */
  MONTH: 18_144_000_000,
} as const;

/**
 * 常用计时点（以秒计）
 */
const SEC = {
  /** 立刻 */
  ZERO: 0,
  /**  1 帧 */
  FRAME: 0.01667,
  /**  1 秒钟 */
  SECOND: 1,
  /**  1 分钟 */
  MINUTE: 60,
  /**  1 小时 */
  HOUR: 3_600,
  /**  1 天 */
  DAY: 86_400,
  /**  1 周 */
  WEEK: 604_800,
  /** 1 月（按30天计算） */
  MONTH: 18_144_000,
} as const;

/** 人类可读的时间格式配置 */
interface SecondsToReadableOptions {
  // 输出格式：zh(中文自然语言) | en(英文自然语言) | digital(数字格式 HH:MM:SS)
  format?: 'zh' | 'en' | 'digital';
  // 是否显示天级别的单位（仅对 zh/en 格式生效）
  showDays?: boolean;
}

/**
 * 将秒数转换为人类可读的时间格式
 * @param seconds 要转换的秒数（非负数字）
 * @param options 格式化选项
 * @returns 人类可读的时间字符串
 * @example
 * ```typescript
 * // // 中文格式（默认）
 * secondsToReadable(61); // 1分1秒
 * secondsToReadable(3661); // 1小时1分1秒
 * secondsToReadable(93784); // 1天2小时3分4秒
 * secondsToReadable(0); // 0秒
 * secondsToReadable(-5); // 0秒（边界处理）
 * // 英文格式
 * secondsToReadable(3661, { format: 'en' }); // 1h 1m 1s
 * secondsToReadable(93784, { format: 'en' }); // 1d 2h 3m 4s
 * // 数字格式（HH:MM:SS）
 * secondsToReadable(3661, { format: 'digital' }); // 01:01:01
 * secondsToReadable(93784, { format: 'digital' }); // 26:03:04
 * // 数字格式不显示天（仅显示当天的小时）
 * secondsToReadable(93784, { format: 'digital', showDays: false }); // 02:03:04
 * ```
 */
function secondsToReadable(
  seconds: number,
  options: SecondsToReadableOptions = { format: 'zh', showDays: true }
): string {
  // 边界处理：确保输入是非负数字，非数字/负数按0处理
  const totalSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);

  // 计算天、时、分、秒
  const days = Math.floor(totalSeconds / 86400);
  const remainingAfterDays = totalSeconds % 86400;
  const hours = Math.floor(remainingAfterDays / 3600);
  const remainingAfterHours = remainingAfterDays % 3600;
  const minutes = Math.floor(remainingAfterHours / 60);
  const secs = Math.floor(remainingAfterHours % 60);

  // 根据格式类型处理
  const { format = 'zh', showDays = true } = options;

  // 1. 中文自然语言格式（默认）
  if (format === 'zh') {
    const parts: string[] = [];
    if (showDays && days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分`);
    // 保证至少显示秒（即使所有单位都是0）
    if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);
    return parts.join('');
  }

  // 2. 英文自然语言格式
  else if (format === 'en') {
    const parts: string[] = [];
    if (showDays && days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(' ');
  }

  // 3. 数字格式（HH:MM:SS），超过24小时也按小时累加（比如25:01:02）
  else if (format === 'digital') {
    // 补零函数：确保数字是两位数
    const padZero = (num: number) => num.toString().padStart(2, '0');
    // 若显示天，则把天数换算成小时（比如1天2小时 → 26小时）
    const totalHours = showDays ? days * 24 + hours : hours;
    return `${padZero(totalHours)}:${padZero(minutes)}:${padZero(secs)}`;
  }

  // 兜底（理论上不会走到这里）
  return `${minutes}分${secs}秒`;
}

function now() {
  return sys.now();
}

/**
 * 模拟耗时操作（毫秒）
 * @param ms 时间
 */
function lag(ms: number): void {
  const end = now() + ms;
  while (now() < end) {
    // 什么也不做
  }
}

/**
 * 毫秒数转换为秒数
 * @param ms - 毫秒数
 * @returns 转换后的秒数
 */
function ms2sec(ms: number): number {
  return (ms / 1000) | 0;
}

/**
 * 秒数转换为毫秒数
 * @param sec - 秒数
 * @returns 转换后的毫秒数
 */
function sec2ms(sec: number): number {
  return (sec * 1000) | 0;
}

/**
 * 秒数转换为时分秒格式（例如：100秒 => 00:01:40）
 * @param seconds - 秒数
 * @returns 时分秒格式字符串
 */
function sec2hms(seconds: number): string {
  seconds = seconds | 0;
  const hour = (seconds / SEC.HOUR) | 0;
  const min = (seconds / SEC.MINUTE) | 0;
  const sec = seconds % SEC.MINUTE;
  return [hour, min, sec].map((v) => v.toString().padStart(2, '0')).join(':');
}

/**
 * 获取当前日期对象
 * @returns 当前日期
 */
function date(): Date {
  return new Date();
}

/**
 * 获取年份
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年份
 */
function year(d?: Date): number {
  return (d ?? date()).getFullYear();
}

/**
 * 获取月份（0-11）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 月份
 */
function month(d?: Date): number {
  return (d ?? date()).getMonth();
}

/**
 * 获取日期（月份中的第几天）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 日期
 */
function day(d?: Date): number {
  return (d ?? date()).getDate();
}

/**
 * 获取小时（24小时制）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 小时
 */
function hour(d?: Date): number {
  return (d ?? date()).getHours();
}

/**
 * 获取分钟
 * @param d - 日期对象，不传则使用当前日期
 * @returns 分钟
 */
function minute(d?: Date): number {
  return (d ?? date()).getMinutes();
}

/**
 * 获取秒数
 * @param d - 日期对象，不传则使用当前日期
 * @returns 秒数
 */
function second(d?: Date): number {
  return (d ?? date()).getSeconds();
}

/**
 * 获取毫秒数
 * @param d - 日期对象，不传则使用当前日期
 * @returns 毫秒数
 */
function millisecond(d?: Date): number {
  return (d ?? date()).getMilliseconds();
}

/**
 * 获取时间戳
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时间戳（毫秒）
 */
function time(d?: Date): number {
  return (d ?? date()).getTime();
}

/**
 * 计算两个日期之间的时间差（绝对值）
 * @param d1 - 第一个日期
 * @param d2 - 第二个日期，不传则使用当前日期
 * @returns 时间差（毫秒）
 */
function diff(d1: Date, d2?: Date): number {
  return Math.abs((d2 ?? date()).getTime() - d1.getTime());
}

/**
 * 判断是否为闰年
 * @param y - 年份，不传则使用当前年份
 * @returns 是否为闰年
 */
function isLeapYear(y?: number): boolean {
  y ??= year();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * 解析日期对象为详细时间信息
 * @param d - 日期对象，不传则使用当前日期
 * @returns 包含年月日时分秒毫秒和时间戳的对象
 */
function parse(d?: Date): {
  yy: number;
  mm: number;
  dd: number;
  h: number;
  m: number;
  s: number;
  ms: number;
  ts: number;
} {
  d ??= date();
  return {
    yy: year(d),
    mm: month(d),
    dd: day(d),
    h: hour(d),
    m: minute(d),
    s: second(d),
    ms: millisecond(d),
    ts: time(d),
  };
}

/**
 * 格式化日期为年-月-日格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年-月-日格式字符串
 */
function ymd(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.yy}-${s.mm + 1}-${s.dd}`;
}

/**
 * 格式化时间为时:分:秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时:分:秒格式字符串
 */
function hms(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.h}:${s.m}:${s.s}`;
}

/**
 * 格式化时间为时:分:秒.毫秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时:分:秒.毫秒格式字符串
 */
function hmsm(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.h}:${s.m}:${s.s}.${s.ms}`;
}

/**
 * 格式化日期时间为年-月-日 时:分:秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年-月-日 时:分:秒格式字符串
 */
function ymdhms(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.yy}-${s.mm + 1}-${s.dd} ${s.h}:${s.m}:${s.s}`;
}

/**
 * 格式化时间差为可读文本
 * @param stamp - 目标时间戳
 * @param unit - 时间单位配置对象
 * @returns 包含天数、小时数、分钟数、秒数和格式化文本的对象
 */
function fmt(
  stamp: number,
  unit: { day: string; hour: string; minute: string; second: string }
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  text: string;
} {
  let days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    text = '';
  const nowValue = now();
  const remaining = stamp - nowValue;
  if (remaining > 0) {
    days = Math.floor(remaining / MS.DAY);
    hours = Math.floor((remaining % MS.DAY) / MS.HOUR);
    minutes = Math.floor((remaining % MS.HOUR) / MS.MINUTE);
    seconds = Math.floor((remaining % MS.MINUTE) / MS.SECOND);
    if (days > 0) {
      text = `${days} ${unit.day} ${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else if (hours > 0) {
      text = `${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else if (minutes > 0) {
      text = `${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else {
      text = `${seconds}${unit.second}`;
    }
  }
  return { days, hours, minutes, seconds, text };
}

/**
 * 等待指定时间
 * @param handle 处理方法
 * @param ms 时间（毫秒）
 * @returns
 */
async function waitAsync<R = unknown>(handle: () => R, ms: number) {
  return new Promise<R>((resolve) => {
    setTimeout(() => {
      resolve(mightSync(handle)[0]);
    }, ms);
  });
}

/**
 * 等待指定时间后执行方法
 * @param handle 方法
 * @param ms 时间（毫秒）
 */
function waitSync<R = unknown>(handle: () => R, ms: number) {
  setTimeout(() => {
    mightSync(handle);
  }, ms);
}

/**
 * 空转方法
 */
function idle() {}

/**
 * 计时点
 * @param tag 标记
 */
function timing(tag: string) {
  const startAt = now();
  return function () {
    Journal.Debug(`${tag}: ${Math.round((now() - startAt) * 100) / 100}ms`);
  };
}

/**
 * 时间工具集合
 */
export {
  MS,
  SEC,
  secondsToReadable,
  now,
  lag,
  ms2sec,
  sec2ms,
  sec2hms,
  date,
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond,
  time,
  diff,
  isLeapYear,
  parse,
  ymd,
  hms,
  hmsm,
  ymdhms,
  fmt,
  waitAsync,
  waitSync,
  idle,
  timing,
};
