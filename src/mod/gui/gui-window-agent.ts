import { Node } from 'cc';

import { GuiLayers, IGuiWindowAgent } from '../contract';
import { GuiNavigatorAgent } from './base/gui-navigator-agent';

class GuiWindowAgent extends GuiNavigatorAgent implements IGuiWindowAgent {
  public constructor(root: Node, maxDepth: number) {
    super(root, GuiLayers.Window, maxDepth);
  }
}

export { GuiWindowAgent };
