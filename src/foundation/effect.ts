import { builtinResMgr, __private, Material, Node, UIRenderer } from 'cc';

/**
 * 节点材质调整工具
 *
 * 提供设置节点材质、恢复节点材质、置灰等便捷功能
 */

/**
 * 设置节点材质（包括子节点）
 * @param node - 目标节点
 * @param material - 材质，传入 null 表示取消材质
 * @param properties - 材质属性的可选映射表
 */
function apply(
  node: Node,
  material: Material | null,
  properties?: Record<
    string,
    | __private._cocos_asset_assets_material__MaterialPropertyFull
    | __private._cocos_asset_assets_material__MaterialPropertyFull[]
  >
): void {
  if (node == null || node.isValid == false) return;
  const renders = node.getComponentsInChildren(UIRenderer);
  const diveToProperties = material && properties;
  for (let i = 0, l = renders.length; i < l; i++) {
    if (diveToProperties) {
      for (const p in properties) {
        material.setProperty(p, properties[p]);
      }
    }
    renders[i].customMaterial = material;
  }
}

/**
 * 将节点恢复正常（取消材质效果）
 * @param node - 目标节点
 */
function cancel(node: Node): void {
  apply(node, null);
}

/**
 * 将节点置灰
 * 使用内置的灰色材质将节点及其子节点设置为灰度显示
 * @param node - 目标节点
 */
function gray(node: Node): void {
  apply(node, builtinResMgr.get<Material>('ui-sprite-gray-material'));
}

/**
 * 节点材质调整工具集合
 */
export { apply, cancel, gray };
