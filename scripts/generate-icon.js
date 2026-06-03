#!/usr/bin/env node
/**
 * 生成 DocKit 应用图标（纯 Node.js，无外部依赖）
 * 生成 512x512 PNG 图标供桌面端和移动端使用
 *
 * 用法: node scripts/generate-icon.js
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const BG_COLOR = [26, 26, 46];       // #1a1a2e 深蓝背景
const ACCENT_COLOR = [100, 200, 255]; // #64c8ff 亮蓝强调
const WHITE = [255, 255, 255];

function createPixel(r, g, b, a = 255) {
  return [r, g, b, a];
}

function drawRect(pixels, x, y, w, h, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
        const idx = (py * SIZE + px) * 4;
        pixels[idx] = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3] || 255;
      }
    }
  }
}

function drawCircleFill(pixels, cx, cy, r, color) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const px = cx + dx;
        const py = cy + dy;
        if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
          const idx = (py * SIZE + px) * 4;
          pixels[idx] = color[0];
          pixels[idx + 1] = color[1];
          pixels[idx + 2] = color[2];
          pixels[idx + 3] = 255;
        }
      }
    }
  }
}

function generateIconPixels() {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  const margin = 80;

  // 背景
  drawRect(pixels, 0, 0, SIZE, SIZE, BG_COLOR);

  // 圆角矩形文档图标背景
  const docX = margin;
  const docY = margin + 40;
  const docW = SIZE - margin * 2;
  const docH = SIZE - margin * 2 - 50;
  const docRadius = 40;

  // 简化的圆角矩形（文档形状）
  drawRect(pixels, docX + docRadius, docY, docW - docRadius * 2, docH, [30, 40, 60]);
  drawRect(pixels, docX, docY + docRadius, docW, docH - docRadius * 2, [30, 40, 60]);

  // 四个角的圆形填充
  drawCircleFill(pixels, docX + docRadius, docY + docRadius, docRadius, [30, 40, 60]);
  drawCircleFill(pixels, docX + docW - docRadius, docY + docRadius, docRadius, [30, 40, 60]);
  drawCircleFill(pixels, docX + docRadius, docY + docH - docRadius, docRadius, [30, 40, 60]);
  drawCircleFill(pixels, docX + docW - docRadius, docY + docH - docRadius, docRadius, [30, 40, 60]);

  // 文档折角（右上角）
  const foldSize = 60;
  drawRect(pixels, docX + docW - foldSize, docY, foldSize, foldSize, [20, 30, 50]);
  // 折角对角线
  for (let i = 0; i < foldSize; i++) {
    const px = docX + docW - foldSize + i;
    const py = docY + foldSize - i;
    if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
      const idx = (py * SIZE + px) * 4;
      pixels[idx] = 26;
      pixels[idx + 1] = 26;
      pixels[idx + 2] = 46;
      pixels[idx + 3] = 255;
    }
  }

  // MD 文字（简化：绘制方形像素文字块）
  // M 字母
  const textStartX = docX + 50;
  const textStartY = docY + 70;
  const thick = 14;

  // M 字母（简化两笔）
  drawRect(pixels, textStartX, textStartY, thick, 80, ACCENT_COLOR);
  drawRect(pixels, textStartX, textStartY, 55, thick, ACCENT_COLOR);
  drawRect(pixels, textStartX + 27, textStartY, thick, 80, ACCENT_COLOR);
  drawRect(pixels, textStartX + 55, textStartY + 1, thick, 79, ACCENT_COLOR);

  // D 字母
  const dX = textStartX + 85;
  drawRect(pixels, dX, textStartY, thick, 80, ACCENT_COLOR);
  drawRect(pixels, dX, textStartY, 40, thick, ACCENT_COLOR);
  drawRect(pixels, dX, textStartY + 80 - thick, 40, thick, ACCENT_COLOR);
  drawRect(pixels, dX + 36, textStartY + thick, thick, 80 - thick * 2, ACCENT_COLOR);

  // 下方装饰线
  const lineY = docY + docH - 70;
  drawRect(pixels, docX + 50, lineY, docW - 100, 4, [60, 80, 100]);
  drawRect(pixels, docX + 50, lineY + 16, docW - 200, 4, [60, 80, 100]);
  drawRect(pixels, docX + 50, lineY + 32, docW - 140, 4, [60, 80, 100]);

  return pixels;
}

function createPNG(pixels) {
  // 创建原始图像数据（带滤镜字节）
  const rawData = Buffer.alloc(SIZE * (1 + SIZE * 4)); // filter byte + row data
  for (let y = 0; y < SIZE; y++) {
    rawData[y * (1 + SIZE * 4)] = 0; // filter: none
    for (let x = 0; x < SIZE; x++) {
      const srcIdx = (y * SIZE + x) * 4;
      const dstIdx = y * (1 + SIZE * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];       // R
      rawData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      rawData[dstIdx + 2] = pixels[srcIdx + 2]; // B
      rawData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crcInput = Buffer.concat([typeBuffer, data]);
    const crcValue = Buffer.alloc(4);
    crcValue.writeUInt32BE(crc32(crcInput), 0);
    return Buffer.concat([length, typeBuffer, data, crcValue]);
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(SIZE, 0);  // width
  ihdrData.writeUInt32BE(SIZE, 4);  // height
  ihdrData[8] = 8;                   // bit depth
  ihdrData[9] = 6;                   // color type: RGBA
  ihdrData[10] = 0;                  // compression
  ihdrData[11] = 0;                  // filter
  ihdrData[12] = 0;                  // interlace

  const ihdr = createChunk('IHDR', ihdrData);
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function main() {
  console.log('生成 DocKit 应用图标...');

  const pixels = generateIconPixels();
  const png = createPNG(pixels);

  // 确保目录存在
  const desktopResources = path.join(__dirname, '..', 'packages', 'desktop', 'resources');
  const mobileAssets = path.join(__dirname, '..', 'packages', 'mobile', 'assets');

  fs.mkdirSync(desktopResources, { recursive: true });
  fs.mkdirSync(mobileAssets, { recursive: true });

  // 写入桌面端图标
  fs.writeFileSync(path.join(desktopResources, 'icon.png'), png);
  console.log(`  ✓ 桌面端图标: packages/desktop/resources/icon.png (${SIZE}x${SIZE})`);

  // 写入移动端图标
  fs.writeFileSync(path.join(mobileAssets, 'icon.png'), png);
  console.log(`  ✓ 移动端图标: packages/mobile/assets/icon.png (${SIZE}x${SIZE})`);

  // 移动端自适应图标前景（Android adaptive icon）
  fs.writeFileSync(path.join(mobileAssets, 'adaptive-icon.png'), png);
  console.log(`  ✓ 自适应图标: packages/mobile/assets/adaptive-icon.png (${SIZE}x${SIZE})`);

  // 移动端启动画面图标
  // 生成一个简化版小图标用于 splash
  const smallPixels = new Uint8Array(SIZE * SIZE * 4);
  for (let i = 0; i < smallPixels.length; i++) {
    smallPixels[i] = pixels[i] || 0;
  }
  const smallPng = createPNG(smallPixels);
  fs.writeFileSync(path.join(mobileAssets, 'splash-icon.png'), smallPng);
  console.log(`  ✓ 启动画面图标: packages/mobile/assets/splash-icon.png (${SIZE}x${SIZE})`);

  console.log('\n图标生成完成!');
}

main();
