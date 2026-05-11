import { Node } from 'cc';

import { GuiLayers, IGuiToastAgent } from '../contract';
import { GuiOverlapAgent } from './base/gui-overlap-agent';

class GuiToastAgent extends GuiOverlapAgent implements IGuiToastAgent {
  public constructor(root: Node, maxDepth: number) {
    super(root, GuiLayers.Toast, maxDepth);
  }
}

export { GuiToastAgent };
