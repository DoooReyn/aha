import { Node } from 'cc';

import { GuiLayers, IGuiAlertAgent } from '../contract';
import { GuiPriorityAgent } from './base/gui-priority-agent';

class GuiAlertAgent extends GuiPriorityAgent implements IGuiAlertAgent {
  public constructor(root: Node) {
    super(root, GuiLayers.Alert);
  }
}

export { GuiAlertAgent };
