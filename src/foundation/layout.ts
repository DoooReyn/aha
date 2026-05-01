import { view, Node, UITransform } from 'cc';

import { range } from './math';

/**
 * 布局工具
 *
 * 提供水平、垂直、流式、网格布局方法
 */

/**
 * 水平布局
 * @param container 容器
 * @param options 选项
 * @param options.padding_left 左边距，默认 0
 * @param options.padding_right 右边距，默认 0
 * @param options.padding_top 上边距，默认 0
 * @param options.padding_bottom 下边距，默认 0
 * @param options.spacing_x 水平间距，默认 0
 * @param options.align_v 垂直对齐方式，默认 `center`
 * @param options.direction 排列方向，默认 `forward`
 */
function horizontal(
  container: Node,
  options?: {
    padding_left?: number;
    padding_right?: number;
    padding_top?: number;
    padding_bottom?: number;
    spacing_x?: number;
    align_v?: 'top' | 'center' | 'bottom';
    direction?: 'forward' | 'backward';
  }
) {
  // 初始化选项
  options = {
    padding_left: 0,
    padding_right: 0,
    padding_top: 0,
    padding_bottom: 0,
    spacing_x: 0,
    align_v: 'center',
    direction: 'forward',
    ...options,
  };

  const uit = container.getComponent(UITransform)!;
  const count = container.children.length;

  if (count === 0) {
    uit.setContentSize(options.padding_left + options.padding_right, options.padding_top + options.padding_bottom);
    return;
  }

  // 计算容器尺寸
  const items = container.children;
  let containerWidth = options.padding_left + options.padding_right + (count - 1) * options.spacing_x;
  let containerHeight = 0;
  const sizes: [width: number, height: number][] = [];

  items.forEach((item) => {
    const { width, height } = item.getComponent(UITransform)!;
    containerWidth += width;
    containerHeight = Math.max(containerHeight, height);
    sizes.push([width, height]);
  });

  containerHeight += options.padding_top + options.padding_bottom;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  let currX = -uit.anchorX * containerWidth + options.padding_left;
  let currY = (0.5 - uit.anchorY) * containerHeight;
  switch (options.align_v) {
    case 'top':
      currY += 0.5 * containerHeight - options.padding_top;
      break;
    case 'bottom':
      currY += -0.5 * containerHeight + options.padding_bottom;
      break;
  }

  // 执行布局
  for (const i of range(0, count, options.direction)) {
    const item = items[i];
    const [width, height] = sizes[i];
    item.x = currX + width * 0.5;
    currX += width + options.spacing_x;
    switch (options.align_v) {
      case 'top':
        item.y = currY - height * 0.5;
        break;
      case 'center':
        item.y = currY;
        break;
      case 'bottom':
        item.y = currY + height * 0.5;
        break;
    }
  }
}

/**
 * 垂直布局
 * @param container 容器
 * @param options 选项
 * @param options.padding_left 左边距，默认 0
 * @param options.padding_right 右边距，默认 0
 * @param options.padding_top 上边距，默认 0
 * @param options.padding_bottom 下边距，默认 0
 * @param options.spacing_y 垂直间距，默认 0
 * @param options.align_h 水平对齐方式，默认 `center`
 * @param options.direction 排列方向，默认 `forward`
 */
function vertical(
  container: Node,
  options?: {
    padding_left?: number;
    padding_right?: number;
    padding_top?: number;
    padding_bottom?: number;
    spacing_y?: number;
    align_h?: 'left' | 'center' | 'right';
    direction?: 'forward' | 'backward';
  }
) {
  // 初始化选项
  options = {
    padding_left: 0,
    padding_right: 0,
    padding_top: 0,
    padding_bottom: 0,
    spacing_y: 0,
    align_h: 'center',
    direction: 'forward',
    ...options,
  };

  const uit = container.getComponent(UITransform)!;
  const count = container.children.length;

  if (count === 0) {
    uit.setContentSize(options.padding_left + options.padding_right, options.padding_top + options.padding_bottom);
    return;
  }

  // 计算容器尺寸
  const items = container.children;
  let containerWidth = 0;
  let containerHeight = options.padding_top + options.padding_bottom + (count - 1) * options.spacing_y;
  const sizes: [width: number, height: number][] = [];

  items.forEach((item) => {
    const { width, height } = item.getComponent(UITransform)!;
    containerHeight += height;
    containerWidth = Math.max(containerWidth, width);
    sizes.push([width, height]);
  });

  containerWidth += options.padding_left + options.padding_right;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  let currX = (0.5 - uit.anchorX) * containerWidth;
  let currY = (1 - uit.anchorY) * containerHeight - options.padding_top;
  switch (options.align_h) {
    case 'left':
      currX += -containerWidth * 0.5 + options.padding_left;
      break;
    case 'right':
      currX += containerWidth * 0.5 - options.padding_right;
      break;
  }

  // 执行布局
  for (const i of range(0, count, options.direction)) {
    const item = items[i];
    const [width, height] = sizes[i];
    item.y = currY - height * 0.5;
    currY -= height + options.spacing_y;
    switch (options.align_h) {
      case 'left':
        item.x = currX + width * 0.5;
        break;
      case 'center':
        item.x = currX;
        break;
      case 'right':
        item.x = currX - width * 0.5;
        break;
    }
  }
}

/**
 * 流式布局
 * @param container 容器
 * @param options 选项
 * @param options.max_width 最大宽度，默认 0
 * @param options.line_height 行高，默认 20
 * @param options.padding_left 左边距，默认 0
 * @param options.padding_right 右边距，默认 0
 * @param options.padding_top 上边距，默认 0
 * @param options.padding_bottom 下边距，默认 0
 * @param options.spacing_x 水平间距，默认 0
 * @param options.spacing_y 垂直间距，默认 0
 * @param options.align_v 垂直对齐方式，默认 `center`
 * @param options.direction 排列方向，默认 `forward`
 */
function flow(
  container: Node,
  options: {
    padding_left?: number;
    padding_right?: number;
    padding_top?: number;
    padding_bottom?: number;
    spacing_x?: number;
    spacing_y?: number;
    max_width: number;
    line_height?: number;
    align_v?: 'top' | 'center' | 'bottom';
    direction?: 'forward' | 'backward';
  }
) {
  // 初始化选项
  options = {
    padding_left: 0,
    padding_right: 0,
    padding_top: 0,
    padding_bottom: 0,
    spacing_x: 0,
    spacing_y: 0,
    max_width: 0,
    align_v: 'center',
    direction: 'forward',
    line_height: 20,
    ...options,
  };

  const uit = container.getComponent(UITransform)!;
  const count = container.children.length;

  if (count === 0) {
    uit.setContentSize(options.padding_left + options.padding_right, options.padding_top + options.padding_bottom);
    return;
  }

  // 最大宽度为 0 时，使用屏幕可见宽度
  if (options.max_width === 0) {
    options.max_width = view.getVisibleSize().width;
  }

  // 计算容器尺寸
  const items = container.children;
  const containerWidth = options.max_width;
  let containerHeight = options.padding_top + options.padding_bottom;
  const minWidth = options.padding_left + options.padding_right;
  let currWidth = minWidth;
  let currLine = 0;
  const lines: { height: number; sizes: [number, number, string][] }[] = [];

  items.forEach((v: Node) => {
    const item = v as Node & { __hyper_char__: string };
    const { width, height } = item.getComponent(UITransform)!;
    if (currLine === 0 && width >= containerWidth) {
      // 如果第一个子项的宽度大于容器宽度或子项为换行符，则添加子项后再换行
      (lines[currLine] ??= { height, sizes: [] }).sizes.push([width, height, item.__hyper_char__]);
      currWidth = minWidth;
      currLine++;
    } else if (item.__hyper_char__ === '\n') {
      // 如果子项为换行符，则换行后再添加子项
      lines[currLine] ??= { height, sizes: [] };
      lines[currLine].height = lines[currLine].sizes.map((v) => v[1]).reduce((a, b) => Math.max(a, b), 0);
      currWidth = minWidth;
      currLine++;
      (lines[currLine] ??= { height, sizes: [] }).sizes.push([0, options.line_height, item.__hyper_char__]);
    } else if (currWidth + width > containerWidth) {
      // 如果新增的子项宽度加上当前行宽度大于容器宽度，则换行后再添加子项
      lines[currLine].height = lines[currLine].sizes.map((v) => v[1]).reduce((a, b) => Math.max(a, b), 0);
      currWidth = minWidth + width + options.spacing_x;
      currLine++;
      (lines[currLine] ??= { height: options.line_height, sizes: [] }).sizes.push([width, height, item.__hyper_char__]);
    } else {
      // 否则继续添加子项
      currWidth += width + options.spacing_x;
      (lines[currLine] ??= { height: 0, sizes: [] }).sizes.push([width, height, item.__hyper_char__]);
    }
  });

  lines[currLine].height = lines[currLine].sizes.map((v) => v[1]).reduce((a, b) => Math.max(a, b), 0);
  lines.forEach((line) => (containerHeight += line.height));
  containerHeight += (lines.length - 1) * options.spacing_y;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  let currY = (1 - uit.anchorY) * containerHeight - options.padding_top;

  // 执行布局
  let index = -1;
  for (const line of range(0, lines.length)) {
    const { height: lineHeight, sizes: lineSizes } = lines[line];
    let currX = -containerWidth * uit.anchorX + options.padding_left;
    for (const seq of range(0, lineSizes.length)) {
      const item = items[++index] as Node & { __hyper_char__: string };
      let [width, height] = lineSizes[seq];
      if (item.__hyper_char__ === '\n') {
        width = height = 0;
      }
      item.x = currX + width * 0.5;
      switch (options.align_v) {
        case 'top':
          item.y = currY - height * 0.5;
          break;
        case 'center':
          item.y = currY - lineHeight * 0.5;
          break;
        case 'bottom':
          item.y = currY - lineHeight + height * 0.5;
          break;
      }
      currX += width + options.spacing_x;
    }
    currY -= lineHeight + options.spacing_y;
  }
}

/**
 * 网格布局
 * @param container 容器
 * @param options 选项
 * @param options.padding_left 左边距，默认 0
 * @param options.padding_right 右边距，默认 0
 * @param options.padding_top 上边距，默认 0
 * @param options.padding_bottom 下边距，默认 0
 * @param options.spacing_x 水平间距，默认 0
 * @param options.spacing_y 垂直间距，默认 0
 * @param options.col_num 列数，默认 1
 * @param options.cell_width 单元格宽度，默认 0
 * @param options.cell_height 单元格高度，默认 0
 * @param options.direction 排列方向，默认 'horizontal'
 */
function grid(
  container: Node,
  options: {
    col_num?: number;
    cell_width?: number;
    cell_height?: number;
    padding_left?: number;
    padding_right?: number;
    padding_top?: number;
    padding_bottom?: number;
    spacing_x?: number;
    spacing_y?: number;
    direction?: 'horizontal' | 'vertical';
  } = {}
) {
  // 初始化选项
  options = {
    padding_left: 0,
    padding_right: 0,
    padding_top: 0,
    padding_bottom: 0,
    spacing_x: 0,
    spacing_y: 0,
    cell_width: 0,
    cell_height: 0,
    col_num: 1,
    direction: 'horizontal',
    ...options,
  };
  options.col_num = Math.max(2, Math.ceil(options.col_num));

  const uit = container.getComponent(UITransform)!;
  const items = container.children;
  const count = items.length;

  // 计算容器宽度
  const containerWidth =
    options.padding_left +
    options.padding_right +
    options.spacing_x * (options.col_num - 1) +
    options.cell_width * options.col_num;

  if (count === 0) {
    uit.setContentSize(containerWidth, options.padding_top + options.padding_bottom + options.cell_height);
    return;
  }

  // 计算容器尺寸
  const rows = Math.ceil(count / options.col_num);
  const containerHeight =
    options.padding_top + options.padding_bottom + options.spacing_y * (rows - 1) + options.cell_height * rows;

  // 设置容器尺寸
  uit.setContentSize(containerWidth, containerHeight);

  // 定位左上角
  const fromX = -uit.anchorX * containerWidth + options.padding_left;
  const fromY = (1 - uit.anchorY) * containerHeight;
  let currX = fromX;
  let currY = fromY;

  // 执行布局
  if (options.direction === 'horizontal') {
    for (const i of range(0, count)) {
      const item = items[i];
      const height = options.cell_height;
      const col = i % options.col_num;
      if (col == 0) {
        currX = fromX;
        currY -= height + options.spacing_y;
      }
      item.x = currX + options.cell_width * 0.5;
      currX += options.cell_width + options.spacing_x;
      item.y = currY + height * 0.5;
    }
  } else {
    for (const i of range(0, count)) {
      const item = items[i];
      const height = options.cell_height;
      const row = i % rows; // 把列作为行
      item.y = currY - height * 0.5;
      item.x = currX + options.cell_width * 0.5;
      currY -= height + options.spacing_y;
      if (row === rows - 1) {
        currX += options.cell_width + options.spacing_x;
        currY = fromY;
      }
    }
  }
}

/**
 * 布局工具集合
 */
export { horizontal, vertical, flow, grid };
