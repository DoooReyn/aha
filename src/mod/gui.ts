import { Journal } from '../journal';
import { GuiLayers, IGui, IGuiAbility, IGuiScreenAgent, IGuiWindowAgent } from './contract';
import { GuiScreenAgent } from './gui/gui-screen-agent';
import { GuiWindowAgent } from './gui/gui-window-agent';
import { BaseMod } from './mod';
import { TRAIT } from './trait';

class GuiAbility implements IGuiAbility {
  private _screen: IGuiScreenAgent;
  private _window: IGuiWindowAgent;
  public constructor(public mod: IGui) {
    this._screen = null;
  }

  public async attach(): Promise<void> {
    const root = this.mod.dependencies.launcher.root;
    this._screen = new GuiScreenAgent(root);
    this._window = new GuiWindowAgent(root, 5);
  }

  public detach(): void {}

  public async open(ui: string, data: unknown): Promise<void> {
    const config = this.mod.dependencies.guiRegistry.getUiConfig(ui);
    switch (config.layer) {
      case GuiLayers.Screen:
        await this._screen.open(ui, data);
        break;
      case GuiLayers.Window:
        await this._window.open(ui, data);
        break;
      case GuiLayers.Hud:
        break;
      case GuiLayers.Popup:
        break;
      case GuiLayers.Guide:
        break;
      case GuiLayers.Marquee:
        break;
      case GuiLayers.Toast:
        break;
      case GuiLayers.Notification:
        break;
      case GuiLayers.Loading:
        break;
      case GuiLayers.Alert:
        break;
      default:
        Journal.Warn(`视图 ${ui} 未注册`);
        break;
    }
  }

  public async back(layer: GuiLayers): Promise<void> {
    switch (layer) {
      case GuiLayers.Screen:
        await this._screen.back();
        break;
      case GuiLayers.Window:
        await this._window.back();
        break;
      case GuiLayers.Hud:
        break;
      case GuiLayers.Popup:
        break;
      case GuiLayers.Guide:
        break;
      case GuiLayers.Marquee:
        break;
      case GuiLayers.Toast:
        break;
      case GuiLayers.Notification:
        break;
      case GuiLayers.Loading:
        break;
      case GuiLayers.Alert:
        break;
      default:
        Journal.Warn(`未知的视图层级 ${layer}`);
        break;
    }
  }
}

class Gui extends BaseMod<GuiAbility> implements IGui {
  public static readonly InitArgs: Parameters<Gui['loadAbility']>;
  public static readonly Trait: string = TRAIT.GUI;
  declare public dependencies: IGui['dependencies'];

  protected loadAbility(): GuiAbility {
    return new GuiAbility(this);
  }
}

export { Gui };
