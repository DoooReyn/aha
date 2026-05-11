import { Node } from 'cc';

import { GuiLayers, IGuiLoadingAgent } from '../contract';
import { GuiExclusiveAgent } from './base/gui-exclusive-agent';

class GuiLoadingAgent extends GuiExclusiveAgent implements IGuiLoadingAgent {
  public constructor(root: Node) {
    super(root, GuiLayers.Loading);
  }
}

export { GuiLoadingAgent };
