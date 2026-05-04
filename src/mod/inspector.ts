import { sys } from 'cc';

import { access } from '../foundation';
import { CCInspectorFields, ICCInspector, ICCInspectorAbility, ICCInspectorManualField } from './contract/inspector';
import { BaseMod } from './mod';

/**
 * 巡检器能力实现
 */
class CCInspectorAbility implements ICCInspectorAbility {
  private _container: Map<string, number>;

  public constructor(public mod: ICCInspector) {
    this._container = new Map();
  }

  public async attach(): Promise<void> {
    if (this.available) {
      Inspector.show();
    }
  }

  public detach(): void {
    if (this.available) {
      Inspector.hide();
    }
    this.clear();
    this._container.clear();
    this._container = null;
    this.mod = null;
  }

  public get available(): boolean {
    return sys.isBrowser && access.global.has('Inspector');
  }

  public add(field: CCInspectorFields): void {
    if (this.available) {
      if ('value' in field) {
        Inspector.addField(field.name, field.value);
      } else if ('interval' in field) {
        Inspector.addField(field.name, field.update());
        this._container.set(
          field.name,
          setInterval(() => Inspector.updateField(field.name, field.update()), field.interval) as unknown as number
        );
      } else if ('destroy' in field) {
        Inspector.addField(field.name, field.update());
        field.init();
      }
    }
  }

  public remove(name: string): void {
    if (this.available && this._container.has(name)) {
      clearInterval(this._container.get(name));
      this._container.delete(name);
      (Inspector.getField(name) as ICCInspectorManualField)?.destroy();
      Inspector.removeField(name);
    }
  }

  public clear(): void {
    if (this.available) {
      this._container.forEach((v) => clearInterval(v));
      this._container.clear();
      Inspector.clearFields();
    }
  }
}

/**
 * 巡检器实现
 */
class CCInspector extends BaseMod<CCInspectorAbility> implements ICCInspector {
  public static readonly InitArgs: Parameters<CCInspector['loadAbility']>;
  public static readonly Trait: string = 'inspector';

  protected loadAbility(): CCInspectorAbility {
    return new CCInspectorAbility(this);
  }
}

export { CCInspector };
