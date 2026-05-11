import { Journal } from '../journal';
import {
  GuiLayers,
  IGui,
  IGuiAbility,
  IGuiAlertAgent,
  IGuiGuideAgent,
  IGuiHudAgent,
  IGuiLoadingAgent,
  IGuiMarqueeAgent,
  IGuiNotificationAgent,
  IGuiPopupAgent,
  IGuiScreenAgent,
  IGuiToastAgent,
  IGuiWindowAgent,
} from './contract';
import { GuiAlertAgent } from './gui/gui-alert-agent';
import { GuiGuideAgent } from './gui/gui-guide-agent';
import { GuiHudAgent } from './gui/gui-hud-agent';
import { GuiLoadingAgent } from './gui/gui-loading-agent';
import { GuiMarqueeAgent } from './gui/gui-marquee-agent';
import { GuiNotificationAgent } from './gui/gui-notification-agent';
import { GuiPopupAgent } from './gui/gui-popup-agent';
import { GuiScreenAgent } from './gui/gui-screen-agent';
import { GuiToastAgent } from './gui/gui-toast-agent';
import { GuiWindowAgent } from './gui/gui-window-agent';
import { BaseMod } from './mod';
import { TRAIT } from './trait';

class GuiAbility implements IGuiAbility {
  private _screen: IGuiScreenAgent;
  private _window: IGuiWindowAgent;
  private _hud: IGuiHudAgent;
  private _popup: IGuiPopupAgent;
  private _marquee: IGuiMarqueeAgent;
  private _toast: IGuiToastAgent;
  private _notification: IGuiNotificationAgent;
  private _guide: IGuiGuideAgent;
  private _loading: IGuiLoadingAgent;
  private _alert: IGuiAlertAgent;

  public constructor(public mod: IGui) {
    this._screen = null;
    this._window = null;
    this._hud = null;
    this._popup = null;
    this._marquee = null;
    this._toast = null;
    this._notification = null;
    this._guide = null;
    this._loading = null;
    this._alert = null;
  }

  public async attach(): Promise<void> {
    const root = this.mod.dependencies.launcher.root;
    this._screen = new GuiScreenAgent(root);
    this._window = new GuiWindowAgent(root, 5);
    this._hud = new GuiHudAgent(root);
    this._popup = new GuiPopupAgent(root, 5);
    this._marquee = new GuiMarqueeAgent(root);
    this._toast = new GuiToastAgent(root, 0);
    this._notification = new GuiNotificationAgent(root);
    this._guide = new GuiGuideAgent(root);
    this._loading = new GuiLoadingAgent(root);
    this._alert = new GuiAlertAgent(root);
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
        await this._hud.open(ui, data);
        break;
      case GuiLayers.Popup:
        await this._popup.open(ui, data);
        break;
      case GuiLayers.Guide:
        await this._guide.open(ui, data);
        break;
      case GuiLayers.Marquee:
        await this._marquee.open(ui, data);
        break;
      case GuiLayers.Toast:
        await this._toast.open(ui, data);
        break;
      case GuiLayers.Notification:
        await this._notification.open(ui, data);
        break;
      case GuiLayers.Loading:
        await this._loading.open(ui, data);
        break;
      case GuiLayers.Alert:
        await this._alert.open(ui, data);
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
        await this._hud.back();
        break;
      case GuiLayers.Popup:
        await this._popup.back();
        break;
      case GuiLayers.Guide:
        await this._guide.back();
        break;
      case GuiLayers.Marquee:
        await this._marquee.back();
        break;
      case GuiLayers.Toast:
        await this._toast.back();
        break;
      case GuiLayers.Notification:
        await this._notification.back();
        break;
      case GuiLayers.Loading:
        await this._loading.back();
        break;
      case GuiLayers.Alert:
        this._alert.back();
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
