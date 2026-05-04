import { Journal } from '../journal';
import { ILinguist, ILinguistAbility, ILinguistSchema, Language, VId, VText } from './contract';
import { BaseMod } from './mod';

/**
 * 国际化错误码
 */
enum LinguistErrorCode {
  /** 语言未习得 */
  UnlearnedLanguage,
}

/**
 * 国际化错误构造
 */
class LinguistViolationError extends Error {
  public constructor(
    public readonly code: LinguistErrorCode,
    msg: string
  ) {
    super(msg);
  }
}

/**
 * 国际化能力实现
 */
class LinguistAbility implements ILinguistAbility {
  /** 存档数据 */
  private _schema: ILinguistSchema;
  /** 语言词汇表 */
  private _vocabularies: Map<Language, Map<VId, VText>>;

  public constructor(public mod: ILinguist) {
    this._vocabularies = new Map();
  }

  public get language(): Language {
    return this._schema.language;
  }

  public set language(lang: Language) {
    if (!this.hasLearned(lang)) {
      throw new LinguistViolationError(LinguistErrorCode.UnlearnedLanguage, `语言 ${lang} 未习得`);
    }

    if (this._schema.language === lang) {
      return;
    }

    this._schema.language = lang;
    this.mod.dependencies.eventBus.notify(Linguist.EventType, lang);
  }

  public async attach(): Promise<void> {
    // 获取支持的语言列表
    const languages = this.mod.dependencies.launcher.supportedLanguages;
    for (const lang of languages) {
      this.learn(lang);
    }

    // 注册存档字段
    const storage = this.mod.dependencies.storage;
    storage.register({
      key: 'language',
      version: 1,
      defaults() {
        return { language: languages[0] };
      },
    });
    this._schema = storage.get(Linguist.Schema);

    Journal.Info(`国际化模块已就位，当前语言: ${this.language}`);
  }

  public detach(): void {
    this._vocabularies.clear();
    this.mod = null;
  }

  public hasLearned(language: Language): boolean {
    return this._vocabularies.has(language);
  }

  public learn(language: Language, vocabulary?: Record<VId, VText>): void {
    if (!this.hasLearned(language)) {
      this._vocabularies.set(language, new Map());
    }
    if (vocabulary) {
      const langVocab = this._vocabularies.get(language);
      for (const [id, text] of Object.entries(vocabulary)) {
        if (langVocab.has(id)) {
          Journal.Debug(`提示：语言 ${language} 中的词汇 ${id} 已存在，将被覆盖。${langVocab.get(id)} => ${text}`);
        }
        langVocab.set(id, text);
      }
    }
  }

  public forget(language: Language): void {
    this._vocabularies.delete(language);
  }

  public forgetAll(): void {
    this._vocabularies.clear();
  }

  public translate(id: VId): VText | null {
    const langVocab = this._vocabularies.get(this.language);
    return langVocab ? (langVocab.get(id) ?? null) : null;
  }
}

/**
 * 国际化实现
 */
class Linguist extends BaseMod<LinguistAbility> implements ILinguist {
  public static readonly InitArgs: Parameters<Linguist['loadAbility']>;
  public static readonly Trait: string = 'linguist';
  public static readonly Schema: string = 'language';
  public static readonly EventType: string = 'language:changed';
  public dependencies: ILinguist['dependencies'];

  protected loadAbility(): LinguistAbility {
    return new LinguistAbility(this);
  }
}

export { Linguist };
