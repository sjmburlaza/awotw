import { expect, test } from '@playwright/test';
import { inflateSync } from 'node:zlib';

test.describe('Architectural Wonders app', () => {
  test('loads the home page with primary navigation', async ({ page }) => {
    await page.goto('/');
    const primaryNav = page.getByRole('navigation', { name: 'Primary navigation' });

    await expect(page.getByText('ARCHITECTURAL WONDERS OF THE WORLD')).toBeVisible();
    await expect(primaryNav.getByRole('button', { name: 'Map', exact: true })).toBeVisible();
    await expect(primaryNav.getByRole('button', { name: 'Timeline', exact: true })).toBeVisible();
    await expect(primaryNav.getByRole('button', { name: 'Charts', exact: true })).toBeVisible();
    await expect(page.getByText('Style')).toHaveClass(/selected-mode/);
  });

  test('searches for wonders from the header', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Search...').fill('taj');

    await expect(page).toHaveURL(/\/search\?q=taj$/);
    await expect(page.getByText('Your search results...')).toBeVisible();
    await expect(page.getByRole('link', { name: /Taj Mahal/i })).toBeVisible();
  });

  test('opens the quiz flow from the games hub', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Games/ }).click();

    await expect(page).toHaveURL(/\/games$/);
    await expect(page.getByRole('button', { name: 'GeoGuesser' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'World Tour Mode' })).toBeVisible();
    await page.getByRole('button', { name: 'Quizzes' }).click();

    await expect(page).toHaveURL(/\/games\/quiz$/);
    await expect(page.locator('app-quiz').getByText('Quiz Me!!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'What is the name?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Where is it located?' })).toBeVisible();
  });

  test('starts World Tour Mode on the 3D globe', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/games/world-tour-mode');

    await expect(page.getByText('World Tour Mode')).toBeVisible();
    await expect(page.getByText('Active stop')).toBeHidden();
    await expect(page.getByText('Marker in focus')).toBeHidden();
    await expect(
      page.getByText(
        'To complete the game, clear all the markers by answering each pop-up question correctly.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: 'World Tour Mode 3D globe' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'World tour question' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('.quiz-popup__image')).toBeVisible();
    await expect(page.locator('.quiz-popup__option')).toHaveCount(5);

    const scrollInfo = await page.evaluate(() => {
      const scrollingElement = document.scrollingElement ?? document.documentElement;

      return {
        clientHeight: scrollingElement.clientHeight,
        scrollHeight: scrollingElement.scrollHeight,
      };
    });

    expect(scrollInfo.scrollHeight).toBeGreaterThan(scrollInfo.clientHeight);

    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    const canvasPixels = countVisiblePixels(await canvas.screenshot());

    expect(canvasBox?.width).toBeGreaterThan(300);
    expect(canvasBox?.height).toBeGreaterThan(300);
    expect(canvasPixels).toBeGreaterThan(100);

    const popupBoxBeforeAnswer = await page.locator('.quiz-popup').boundingBox();
    await expect(page.locator('.quiz-popup__feedback')).toBeHidden();

    await page.locator('.quiz-popup__option').last().click();
    await expect(page.locator('.quiz-popup__feedback')).toBeVisible();
    await expect(page.locator('.quiz-popup__feedback')).toContainText('Correct. Marker cleared.');
    await expect(page.getByRole('dialog', { name: 'World tour question' })).toBeVisible();

    await page.waitForTimeout(1000);

    const popupBoxWithFeedback = await page.locator('.quiz-popup').boundingBox();

    if (!popupBoxBeforeAnswer || !popupBoxWithFeedback) {
      throw new Error('Expected the World Tour popup to have a visible bounding box.');
    }

    expect(Math.abs(popupBoxWithFeedback.x - popupBoxBeforeAnswer.x)).toBeLessThan(3);
    expect(Math.abs(popupBoxWithFeedback.y - popupBoxBeforeAnswer.y)).toBeLessThan(3);
    expect(popupBoxWithFeedback.height).toBeGreaterThan(popupBoxBeforeAnswer.height);

    const popupScrollInfo = await page.locator('.quiz-popup').evaluate((element) => ({
      clientHeight: element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
      scrollHeight: element.scrollHeight,
    }));

    expect(popupScrollInfo.overflowY).not.toBe('auto');
    expect(popupScrollInfo.scrollHeight).toBeLessThanOrEqual(popupScrollInfo.clientHeight + 1);

    await page.waitForTimeout(2800);
    await expect(page.getByRole('dialog', { name: 'World tour question' })).toBeVisible();
    await expect(page.locator('.quiz-popup__feedback')).toBeHidden();
    await expect(page.locator('.quiz-popup__option')).toHaveCount(5);
  });
});

function countVisiblePixels(png: Buffer): number {
  const pngSignature = '89504e470d0a1a0a';

  if (png.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error('Expected a PNG screenshot.');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = png.subarray(dataStart, dataEnd);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const rowLength = width * channels;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = new Uint8Array(height * rowLength);
  let inputOffset = 0;
  let outputOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[inputOffset++];

    for (let x = 0; x < rowLength; x++) {
      const raw = inflated[inputOffset++];
      const left = x >= channels ? pixels[outputOffset + x - channels] : 0;
      const up = y > 0 ? pixels[outputOffset - rowLength + x] : 0;
      const upLeft = y > 0 && x >= channels ? pixels[outputOffset - rowLength + x - channels] : 0;
      let predictor = 0;

      if (filter === 1) {
        predictor = left;
      } else if (filter === 2) {
        predictor = up;
      } else if (filter === 3) {
        predictor = Math.floor((left + up) / 2);
      } else if (filter === 4) {
        predictor = paethPredictor(left, up, upLeft);
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter: ${filter}`);
      }

      pixels[outputOffset + x] = (raw + predictor) & 0xff;
    }

    outputOffset += rowLength;
  }

  let visiblePixels = 0;

  for (let index = 0; index < pixels.length; index += channels) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const alpha = channels === 4 ? pixels[index + 3] : 255;

    if (alpha > 0 && red + green + blue > 32) {
      visiblePixels++;
    }
  }

  return visiblePixels;
}

function paethPredictor(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;

  return upLeft;
}
