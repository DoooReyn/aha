import { Node } from 'cc';

import { GuiLayers, IGuiGuideAgent } from '../contract';
import { GuiExclusiveAgent } from './base/gui-exclusive-agent';

class GuiGuideAgent extends GuiExclusiveAgent implements IGuiGuideAgent {
  public constructor(root: Node) {
    super(root, GuiLayers.Guide);
  }
}

export { GuiGuideAgent };
