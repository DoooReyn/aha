import { Node } from 'cc';

import { GuiLayers, IGuiScreenAgent } from '../contract';
import { GuiExclusiveAgent } from './base/gui-exclusive-agent';

class GuiScreenAgent extends GuiExclusiveAgent implements IGuiScreenAgent {
  public constructor(root: Node) {
    super(root, GuiLayers.Screen);
  }
}

export { GuiScreenAgent };
