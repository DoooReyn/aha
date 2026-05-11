import { Node } from 'cc';

import { GuiLayers, IGuiNotificationAgent } from '../contract';
import { GuiPriorityAgent } from './base/gui-priority-agent';

class GuiNotificationAgent extends GuiPriorityAgent implements IGuiNotificationAgent {
  public constructor(root: Node) {
    super(root, GuiLayers.Notification);
  }
}

export { GuiNotificationAgent };
