import {
  dragonBones,
  isValid,
  js,
  sp,
  v3,
  __private,
  AudioSource,
  Button,
  Camera,
  Canvas,
  Color,
  Component,
  Constructor,
  EditBox,
  Graphics,
  Label,
  Layout,
  Mask,
  Node,
  PageView,
  ParticleSystem2D,
  ProgressBar,
  RichText,
  ScrollView,
  Size,
  Slider,
  Sprite,
  TiledMap,
  Toggle,
  UIOpacity,
  UIRenderer,
  UISkew,
  UITransform,
  Vec2,
  Vec3,
  VideoPlayer,
  WebView,
  Widget,
} from 'cc';

import {
  isDragonBonesEnabled,
  isGraphicsEnabled,
  isMaskEnabled,
  isParticleEnabled,
  isRichTextEnabled,
  isSkewEnabled,
  isSpineEnabled,
  isTiledMapEnabled,
  isVideoEnabled,
  isWebviewEnabled,
} from './engine-module-querier';

/** 扩展节点属性 */
declare module 'cc' {
  interface Node {
    uiGraphics: Graphics;
    uiLabel: Label;
    uiRichText: RichText;
    uiSprite: Sprite;
    uiButton: Button;
    uiCanvas: Canvas;
    uiEditBox: EditBox;
    uiLayout: Layout;
    uiPageView: PageView;
    uiProgressBar: ProgressBar;
    uiScrollView: ScrollView;
    uiSlider: Slider;
    uiToggle: Toggle;
    uiWidget: Widget;
    uiOpacity: UIOpacity;
    uiTransform: UITransform;
    uiMask: Mask;
    uiSpine: sp.Skeleton;
    uiCamera: Camera;
    uiVideoPlayer: VideoPlayer;
    uiTiledMap: TiledMap;
    uiWebView: WebView;
    uiAudio: AudioSource;

    /** 获取、设置节点的本地X坐标 */
    x: number;
    /** 获取、设置节点的本地Y坐标 */
    y: number;
    /** 获取、设置节点的本地Z坐标 */
    z: number;
    /** 获取节点的本地X,Y坐标 */
    xy: [number, number];
    /** 获取节点的本地X,Y,Z坐标 */
    xyz: [number, number, number];
    /** 获取、设置节点的世界X坐标 */
    wx: number;
    /** 获取、设置节点的世界Y坐标 */
    wy: number;
    /** 获取、设置节点的世界Z坐标 */
    wz: number;
    /** 获取、设置节点宽 */
    w: number;
    /** 获取、设置节点高 */
    h: number;
    /** 获取、设置节点尺寸 */
    size: Size;
    /** 获取、设置锚点 */
    pivot: Vec2;
    /** 获取、设置X轴锚点 */
    pivotX: number;
    /** 获取、设置Y轴锚点 */
    pivotY: number;
    /** 获取、设置节点透明度  */
    opacity: number;
    /** 获取、设置节点颜色  */
    color: Color;
    /** 获取、设置X轴缩放 */
    scaleX: number;
    /** 获取、设置Y轴缩放 */
    scaleY: number;
    /** 获取、设置Z轴缩放 */
    scaleZ: number;
    /** 获取、设置节点的 X 欧拉角 */
    angleX: number;
    /** 获取、设置节点的 Y 欧拉角 */
    angleY: number;
    /** 获取、设置节点的 Z 欧拉角 */
    angleZ: number;
    /** 设置节点尺寸 */
    setSize(w: number, h: number): void;
    /** 设置锚点 */
    setPivot(x: number, y: number): void;
    /** 设置缩放 */
    setZoom(x: number, y?: number, z?: number): void;
    /** 查找子节点 */
    find(path: string): Node | null;
    /** 获取组件 */
    acquire<T extends Component>(type: __private.__types_globals__Constructor<T>): T | null;
    /** 查询组件 */
    seek<T extends Component>(type: __private.__types_globals__Constructor<T>): T | null;
    /** 查询组件 */
    deepSeek<T extends Component>(type: __private.__types_globals__Constructor<T>): T | null;
    /** 获取同组组件 */
    listed<T extends Component>(type: __private.__types_globals__Constructor<T>, recursive: boolean): T[];
    /** 获取节点的完整路径 */
    pathOf(): string;
    /**
     * 屏幕坐标系转世界坐标系
     * @param camera 相机
     * @param screen 屏幕坐标
     * @returns
     */
    screenToWorld(screen: Vec2 | Vec3, camera: Camera): Vec3;
    /**
     * 世界坐标系转屏幕坐标系
     * @param camera 相机
     * @param world 世界坐标
     * @returns
     */
    worldToScreen(world: Vec2 | Vec3, camera: Camera): Vec3;
    /**
     * 触点是否落在目标节点内
     * @param touch 触点
     * @param node 目标节点
     * @returns
     */
    hitTest(touch: Vec2, node: Node): boolean;
    /**
     * 坐标系转换（世界坐标转换到节点坐标）
     * @param src 待转换坐标节点
     * @param dst 目标节点
     */
    convertToNodeSpace(src: Node, dst: Node): Vec3;
    /**
     * 坐标系转换 (节点坐标转换到世界坐标)
     * @param src 待转换坐标节点
     */
    convertToWorldSpace(src: Node): Vec3;
    /**
     * 节点置灰
     * @param node 目标节点
     * @param gray 是否置灰
     * @param recursive 是否递归（默认是）
     */
    setGray(node: Node, gray: boolean, recursive: boolean): void;
    /**
     * 刷新根节点以下所有对齐组件
     * @param root 根节点
     */
    updateAlignment(root: Node): void;
    /**
     * 刷新根节点以下所有布局组件
     * @param root 根节点
     */
    updateLayout(root: Node): void;
  }
}

js.mixin(Node.prototype, {
  get uiGraphics() {
    return isGraphicsEnabled() && this.getComponent(Graphics);
  },
  get uiLabel() {
    return this.getComponent(Label);
  },
  get uiRichText() {
    return isRichTextEnabled() && this.getComponent(RichText);
  },
  get uiSprite() {
    return this.getComponent(Sprite);
  },
  get uiButton() {
    return this.getComponent(Button);
  },
  get uiCanvas() {
    return this.getComponent(Canvas);
  },
  get uiEditBox() {
    return this.getComponent(EditBox);
  },
  get uiLayout() {
    return this.getComponent(Layout);
  },
  get uiPageView() {
    return this.getComponent(PageView);
  },
  get uiProgressBar() {
    return this.getComponent(ProgressBar);
  },
  get uiScrollView() {
    return this.getComponent(ScrollView);
  },
  get uiSlider() {
    return this.getComponent(Slider);
  },
  get uiToggle() {
    return this.getComponent(Toggle);
  },
  get uiWidget() {
    return this.getComponent(Widget);
  },
  get uiOpacity() {
    return this.getComponent(UIOpacity);
  },
  get uiTransform() {
    return this.getComponent(UITransform);
  },
  get uiMask() {
    return isMaskEnabled() && this.getComponent(Mask);
  },
  get uiAudio() {
    return this.getComponent(AudioSource);
  },
  get uiSpine() {
    return isSpineEnabled() && this.getComponent(sp.Skeleton);
  },
  get uiDragonBones() {
    return isDragonBonesEnabled() && this.getComponent(dragonBones.ArmatureDisplay);
  },
  get uiCamera() {
    return this.getComponent(Camera);
  },
  get uiTiledMap() {
    return isTiledMapEnabled() && this.getComponent(TiledMap);
  },
  get uiParticle() {
    return isParticleEnabled() && this.getComponent(ParticleSystem2D);
  },
  get uiWebView() {
    return isWebviewEnabled() && this.getComponent(WebView);
  },
  get uiVideoPlayer() {
    return isVideoEnabled() && this.getComponent(VideoPlayer);
  },
  get uiSkew() {
    return isSkewEnabled() && this.getComponent(UISkew);
  },
  get x() {
    return this.position.x;
  },
  set x(value: number) {
    this.setPosition(value, this.position.y, this.position.z);
  },
  get y() {
    return this.position.y;
  },
  set y(value: number) {
    this.setPosition(this.position.x, value, this.position.z);
  },
  get z() {
    return this.position.z;
  },
  set z(value: number) {
    this.setPosition(this.position.x, this.position.y, value);
  },
  get xy() {
    return [this.x, this.y];
  },
  get xyz() {
    return [this.x, this.y, this.z];
  },
  get wx() {
    return this.worldPosition.x;
  },
  set wx(value: number) {
    this.setWorldPosition(value, this.worldPosition.y, this.worldPosition.z);
  },
  get wy() {
    return this.worldPosition.y;
  },
  set wy(value: number) {
    this.setWorldPosition(this.worldPosition.x, value, this.worldPosition.z);
  },
  get wz() {
    return this.worldPosition.z;
  },
  set wz(value: number) {
    this.setWorldPosition(this.worldPosition.x, this.worldPosition.y, value);
  },
  get w() {
    return this.getComponent(UITransform)?.width ?? 0;
  },
  set w(value: number) {
    (this.getComponent(UITransform) || this.addComponent(UITransform)).width = value;
  },
  get h() {
    return this.getComponent(UITransform)?.height ?? 0;
  },
  set h(value: number) {
    (this.getComponent(UITransform) || this.addComponent(UITransform)).height = value;
  },
  get size() {
    const uiTransform = this.getComponent(UITransform)!;
    return new Size(uiTransform.width, uiTransform.height);
  },
  set size(value: Size) {
    const uiTransform = this.getComponent(UITransform) || this.addComponent(UITransform);
    uiTransform.width = value.width;
    uiTransform.height = value.height;
  },
  get opacity() {
    const op = this.getComponent(UIOpacity);
    if (op != null) {
      return op.opacity;
    }
    const render = this.getComponent(UIRenderer);
    if (render) {
      return render.color.a;
    }
    return 255;
  },
  set opacity(value: number) {
    const op = this.getComponent(UIOpacity);
    if (op != null) {
      op.opacity = value;
      return;
    }
    const render = this.getComponent(UIRenderer);
    if (render) {
      if (!this.$__color__) {
        this.$__color__ = new Color(render.color.r, render.color.g, render.color.b, value);
      } else {
        this.$__color__.a = value;
      }
      render.color = this.$__color__;
    } else {
      this.addComponent(UIOpacity).opacity = value;
    }
  },
  get color() {
    return this.getComponent(UIRenderer)?.color;
  },
  set color(value: Color) {
    const render = this.getComponent(UIRenderer);
    if (render) {
      render.color = value;
    }
  },
  get scaleX() {
    return this.scale.x;
  },
  set scaleX(value: number) {
    this.scale = v3(value, this.scale.y, this.scale.z);
  },
  get scaleY() {
    return this.scale.y;
  },
  set scaleY(value: number) {
    this.scale = v3(this.scale.x, value, this.scale.z);
  },
  get scaleZ() {
    return this.scale.z;
  },
  set scaleZ(value: number) {
    this.scale = v3(this.scale.x, this.scale.y, value);
  },
  get pivot() {
    const anchor = this.getComponent(UITransform)!.anchorPoint;
    return new Vec2(anchor.x, anchor.y);
  },
  set pivot(value: Vec2) {
    (this.getComponent(UITransform) || this.addComponent(UITransform)).anchorPoint = value;
  },
  get pivotX() {
    return this.getComponent(UITransform)?.anchorX ?? 0.5;
  },
  set pivotX(value: number) {
    (this.getComponent(UITransform) || this.addComponent(UITransform)).anchorX = value;
  },
  get pivotY() {
    return this.getComponent(UITransform)?.anchorY ?? 0.5;
  },
  set pivotY(value: number) {
    (this.getComponent(UITransform) || this.addComponent(UITransform)).anchorY = value;
  },
  get angleX() {
    return this.eulerAngles.x;
  },
  set angleX(value: number) {
    this.setRotationFromEuler(value, this.eulerAngles.y, this.eulerAngles.z);
  },
  get angleY() {
    return this.eulerAngles.y;
  },
  set angleY(value: number) {
    this.setRotationFromEuler(this.eulerAngles.x, value, this.eulerAngles.z);
  },
  get angleZ() {
    return this.eulerAngles.z;
  },
  set angleZ(value: number) {
    this.setRotationFromEuler(this.eulerAngles.x, this.eulerAngles.y, value);
  },
  setSize(width: number, height: number) {
    const uiTransform = this.getComponent(UITransform) || this.addComponent(UITransform);
    uiTransform.width = width;
    uiTransform.height = height;
  },
  setPivot(x: number, y: number) {
    const uiTransform = this.getComponent(UITransform) || this.addComponent(UITransform);
    uiTransform.setAnchorPoint(x, y);
  },
  setZoom(x: number, y?: number, z?: number) {
    const xx = x ?? this.scale.x;
    const yy = y ?? this.scale.y;
    const zz = z ?? this.scale.z;
    this.setScale(xx, yy, zz);
  },
  find(path: string) {
    return this.getChildByPath(path);
  },
  acquire(type: Constructor<Component>) {
    return this.getComponent(type) || this.addComponent(type);
  },
  seek(type: Constructor<Component>) {
    return this.getComponent(type);
  },
  deepSeek(type: Constructor<Component>) {
    return this.getComponent(type) || this.getComponentInChildren(type);
  },
  listed(type: Constructor<Component>, recursive: boolean = false) {
    let list = this.getComponents(type);
    if (recursive) {
      list = list.concat(...this.getComponentsInChildren(type));
    }
    return list as Component[];
  },
  pathOf() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node = this;
    const path: string[] = [];
    while (node.parent) {
      path.unshift(node.name);
      node = node.parent;
    }
    return path.join('/');
  },
  screenToWorld(screen: Vec2 | Vec3, camera: Camera) {
    if (screen instanceof Vec2) {
      screen = screen.toVec3();
    }
    return camera.screenToWorld(screen);
  },
  worldToScreen(world: Vec2 | Vec3, camera: Camera) {
    if (world instanceof Vec2) {
      world = world.toVec3();
    }
    return camera.worldToScreen(world);
  },
  hitTest(touch: Vec2, node: Node) {
    return node && node.isValid && node._uiProps.uiTransformComp.hitTest(touch);
  },
  convertToNodeSpace(src: Node, dst: Node) {
    const wps = src.parent!._uiProps.uiTransformComp.convertToWorldSpaceAR(src.position);
    return dst._uiProps.uiTransformComp.convertToNodeSpaceAR(wps);
  },
  convertToWorldSpace(src: Node) {
    return src.parent!._uiProps.uiTransformComp.convertToWorldSpaceAR(src.position);
  },
  setGray(node: Node, gray: boolean, recursive: boolean = true) {
    if (recursive) {
      const all = node.getComponentsInChildren(Sprite);
      all.forEach((sprite) => {
        if (sprite && sprite.isValid && sprite.enabled) {
          sprite.grayscale = gray;
        }
      });
    } else {
      const sprite = node.getComponent(Sprite);
      if (sprite && sprite.isValid && sprite.enabled) {
        sprite.grayscale = gray;
      }
    }
  },
  updateAlignment(root: Node) {
    if (root && isValid(root)) {
      root.getComponentsInChildren(Widget).forEach((w) => w.isValid && w.enabled && w.updateAlignment());
    }
  },
  updateLayout(root: Node) {
    if (root && isValid(root)) {
      root.getComponentsInChildren(Layout).forEach((w) => w.isValid && w.enabled && w.updateLayout(true));
    }
  },
});
