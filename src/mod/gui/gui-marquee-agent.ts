import { Node } from 'cc';

import { GuiLayers, IGuiMarqueeAgent } from '../contract';
import { GuiPriorityAgent } from './base/gui-priority-agent';

class GuiMarqueeAgent extends GuiPriorityAgent implements IGuiMarqueeAgent {
  public constructor(root: Node) {
    super(root, GuiLayers.Marquee);
  }
}

export { GuiMarqueeAgent };
