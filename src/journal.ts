/**
 * 日志分类
 *
 * 按功能模块划分的日志类别。
 */
export enum JournalCategory {
  /** 系统日志 */
  SYSTEM = 'SYSTEM',
  /** 战斗日志 */
  BATTLE = 'BATTLE',
  /** UI 日志 */
  UI = 'UI',
  /** 网络日志 */
  NETWORK = 'NETWORK',
  /** 资源日志 */
  ASSET = 'ASSET',
}

/**
 * 日志分级
 *
 * 按重要程度划分的日志级别。
 */
export enum JournalLevel {
  /** 调试信息：开发时使用，生产环境关闭 */
  DEBUG = 'DEBUG',
  /** 一般信息：常规操作记录 */
  INFO = 'INFO',
  /** 警告：潜在问题，不影响运行 */
  WARN = 'WARN',
  /** 错误：错误发生，功能受影响 */
  ERROR = 'ERROR',
  /** 致命错误：严重错误，可能崩溃 */
  FATAL = 'FATAL',
}

/**
 * 日志记录专员
 *
 * 每个 JournalCategory 对应一个记录专员，有相对独立的级别控制。
 */
class JournalUnderling {
  /**
   * 日志级别
   * @description 此记录专员的输出级别，低于此级别的日志不会输出
   */
  private _level: JournalLevel;

  /**
   * 日志分类
   * @description 此记录专员所属的分类
   */
  private readonly _category: string;

  /**
   * 构造函数
   * @param category 日志分类
   */
  public constructor(category: JournalCategory | string) {
    this._category = category;
    this._level = JournalLevel.DEBUG;
  }

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  public setLevel(level: JournalLevel): void {
    this._level = level;
  }

  /**
   * 获取日志级别
   * @returns 当前日志级别
   */
  public getLevel(): JournalLevel {
    return this._level;
  }

  /**
   * 输出日志
   * @param level 日志级别
   * @param title 日志标题
   * @param data 附加数据（可变参数）
   */
  public log(level: JournalLevel, title: string, ...data: unknown[]): void {
    // 检查实例级别
    if (!this._shouldOutputAtInstanceLevel(level)) {
      return;
    }

    // 检查主级别（由 Journal 控制）
    if (!Journal.ShouldOutputAtMainLevel(level)) {
      return;
    }

    // 输出到控制台
    this._outputToConsole(level, title, ...data);
  }

  /**
   * 判断是否应该在实例级别输出
   * @param level 日志级别
   * @returns 是否应该输出
   */
  private _shouldOutputAtInstanceLevel(level: JournalLevel): boolean {
    const levels = [JournalLevel.DEBUG, JournalLevel.INFO, JournalLevel.WARN, JournalLevel.ERROR, JournalLevel.FATAL];
    const levelIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this._level);
    return levelIndex >= minIndex;
  }

  /**
   * 输出到控制台
   * @param level 日志级别
   * @param title 日志标题
   * @param data 附加数据（可变参数）
   */
  private _outputToConsole(level: JournalLevel, title: string, ...data: unknown[]): void {
    const now = new Date();
    const timestamp = `${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    const header = `[${this._category} | ${level} | ${timestamp}]`;

    // 检查是否应该使用彩色输出
    const useColor = Journal.ColorOutputEnabled;

    switch (level) {
      case JournalLevel.DEBUG:
        if (useColor) {
          console.debug(
            `%c${header} %c${title}`,
            `color: ${Journal.LevelColors[level]}; font-weight: bold`,
            '',
            ...data
          );
        } else {
          console.debug(header, title, ...data);
        }
        break;
      case JournalLevel.INFO:
        if (useColor) {
          console.info(
            `%c${header} %c${title}`,
            `color: ${Journal.LevelColors[level]}; font-weight: bold`,
            '',
            ...data
          );
        } else {
          console.info(header, title, ...data);
        }
        break;
      case JournalLevel.WARN:
        if (useColor) {
          console.warn(
            `%c${header} %c${title}`,
            `color: ${Journal.LevelColors[level]}; font-weight: bold`,
            '',
            ...data
          );
        } else {
          console.warn(header, title, ...data);
        }
        break;
      case JournalLevel.ERROR:
      case JournalLevel.FATAL:
        if (useColor) {
          console.error(
            `%c${header} %c${title}`,
            `color: ${Journal.LevelColors[level]}; font-weight: bold`,
            '',
            ...data
          );
        } else {
          console.error(header, title, ...data);
        }
        break;
    }
  }

  // ========== 便捷方法 ==========

  /**
   * 调试日志
   */
  public debug(title: string, ...data: unknown[]): void {
    this.log(JournalLevel.DEBUG, title, ...data);
  }

  /**
   * 信息日志
   */
  public info(title: string, ...data: unknown[]): void {
    this.log(JournalLevel.INFO, title, ...data);
  }

  /**
   * 警告日志
   */
  public warn(title: string, ...data: unknown[]): void {
    this.log(JournalLevel.WARN, title, ...data);
  }

  /**
   * 错误日志
   */
  public error(title: string, ...data: unknown[]): void {
    this.log(JournalLevel.ERROR, title, ...data);
  }

  /**
   * 致命错误日志
   */
  public fatal(title: string, ...data: unknown[]): void {
    this.log(JournalLevel.FATAL, title, ...data);
  }
}

/**
 * 日志记录器
 *
 * 管理所有日志记录专员，并提供全局控制。
 */
class Journal {
  /**
   * 记录专员实例容器
   * @description 存储所有记录专员，key 为分类，value 为记录专员实例
   */
  private static Underlings: Map<string, JournalUnderling> = new Map();

  /**
   * 主日志级别
   * @description 全局最低输出级别，所有记录专员都受此限制
   */
  public static MainLevel: JournalLevel = JournalLevel.DEBUG;

  /**
   * 彩色输出启用
   * @description 用户设置的彩色输出开关
   */
  public static ColorOutputEnabled: boolean = true;

  /**
   * 日志级别颜色映射
   * @description 不同级别对应的控制台颜色
   */
  public static readonly LevelColors: Record<JournalLevel, string> = {
    [JournalLevel.DEBUG]: '#888888', // 灰色
    [JournalLevel.INFO]: '#4CAF50', // 绿色
    [JournalLevel.WARN]: '#FF9800', // 橙色
    [JournalLevel.ERROR]: '#F44336', // 红色
    [JournalLevel.FATAL]: '#D32F2F', // 深红色
  } as const;

  /**
   * 判断是否应该在主级别输出
   * @param level 日志级别
   * @returns 是否应该输出
   */
  public static ShouldOutputAtMainLevel(level: JournalLevel): boolean {
    const levels = [JournalLevel.DEBUG, JournalLevel.INFO, JournalLevel.WARN, JournalLevel.ERROR, JournalLevel.FATAL];
    const levelIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.MainLevel);
    return levelIndex >= minIndex;
  }

  /**
   * 获取记录专员
   *
   * 根据分类获取对应的记录专员，如果不存在则自动创建。
   * @param category 日志分类
   * @returns 记录专员
   */
  public static Acquire(category: JournalCategory | string): JournalUnderling {
    if (!this.Underlings.has(category)) {
      this.Underlings.set(category, new JournalUnderling(category));
    }
    return this.Underlings.get(category)!;
  }

  /**
   * 设置某个分类的日志级别
   * @param category 日志分类
   * @param level 日志级别
   */
  public static SetCategoryLevel(category: JournalCategory, level: JournalLevel): void {
    this.Acquire(category).setLevel(level);
  }

  // ========== 通用快捷方法（使用 SYSTEM 分类） ==========

  /**
   * 系统调试日志
   */
  public static Debug(title: string, ...data: unknown[]): void {
    this.Acquire(JournalCategory.SYSTEM).debug(title, ...data);
  }

  /**
   * 系统信息日志
   */
  public static Info(title: string, ...data: unknown[]): void {
    this.Acquire(JournalCategory.SYSTEM).info(title, ...data);
  }

  /**
   * 系统警告日志
   */
  public static Warn(title: string, ...data: unknown[]): void {
    this.Acquire(JournalCategory.SYSTEM).warn(title, ...data);
  }

  /**
   * 系统错误日志
   */
  public static Error(title: string, ...data: unknown[]): void {
    this.Acquire(JournalCategory.SYSTEM).error(title, ...data);
  }

  /**
   * 系统致命错误日志
   */
  public static Fatal(title: string, ...data: unknown[]): void {
    this.Acquire(JournalCategory.SYSTEM).fatal(title, ...data);
  }
}

/**
 * 导出日志
 */
export { Journal };
