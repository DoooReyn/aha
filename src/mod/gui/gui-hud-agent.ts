import { Node } from 'cc';

import { GuiLayers, IGuiHudAgent } from '../contract';
import { GuiExclusiveAgent } from './base/gui-exclusive-agent';

class GuiHudAgent extends GuiExclusiveAgent implements IGuiHudAgent {
  public constructor(root: Node) {
    super(root, GuiLayers.Hud);
  }
}

export { GuiHudAgent };
