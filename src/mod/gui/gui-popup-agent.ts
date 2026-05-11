import { Node } from 'cc';

import { GuiLayers, IGuiPopupAgent } from '../contract';
import { GuiOverlapAgent } from './base/gui-overlap-agent';

class GuiPopupAgent extends GuiOverlapAgent implements IGuiPopupAgent {
  public constructor(root: Node, maxDepth: number) {
    super(root, GuiLayers.Popup, maxDepth);
  }
}

export { GuiPopupAgent };
