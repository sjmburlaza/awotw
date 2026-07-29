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

  test('keeps the desktop home composition unchanged', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const homeLayout = await page.locator('.home-container').evaluate((element) => {
      const styles = getComputedStyle(element);

      return {
        bottom: styles.bottom,
        position: styles.position,
        width: styles.width,
      };
    });

    expect(homeLayout).toEqual({
      bottom: '24px',
      position: 'fixed',
      width: '900px',
    });
    await expect(page.locator('.header__globe__home-slot')).toHaveCSS('display', 'contents');
  });

  test('keeps the original navigation layout at tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const actionBoxes = await page
      .locator('.button__search-bar, .button__games, .button__bg-mode')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();

          return { bottom: rect.bottom, top: rect.top };
        }),
      );
    const titleBox = await page.getByText('ARCHITECTURAL WONDERS OF THE WORLD').boundingBox();

    await expect(page.locator('app-header .header')).toHaveCSS('display', 'grid');
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toHaveCSS(
      'display',
      'flex',
    );
    await expect(page.locator('app-header .button')).toHaveCSS('display', 'flex');
    await expect(page.getByPlaceholder('Search...')).toBeVisible();
    await expect(page.locator('.button__games span')).toBeVisible();
    await expect(page.locator('.button__games .mobile-only')).toBeHidden();

    expect(actionBoxes).toHaveLength(3);
    expect(Math.max(...actionBoxes.map(({ top }) => top))).toBeCloseTo(
      Math.min(...actionBoxes.map(({ top }) => top)),
      1,
    );

    if (!titleBox) {
      throw new Error('Expected the title to remain visible at tablet width.');
    }

    expect(titleBox.height).toBeGreaterThan(42);
  });

  test('lays out the home page without horizontal overflow on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/');

    await expect(page.getByText('ARCHITECTURAL WONDERS OF THE WORLD')).toBeVisible();
    await expect(
      page.getByText('Please switch to a laptop or desktop to view this content.'),
    ).toHaveCount(0);
    await expect(page.locator('.home-container .item').first()).toBeVisible();
    await expect(page.locator('.home-container .mode')).toHaveCount(5);

    const mobileGlobeBox = await page
      .getByRole('button', { name: 'Go to home page' })
      .boundingBox();
    const mobileSearchBox = await page.locator('.button__search-bar').boundingBox();
    const mobileGamesBox = await page.locator('.button__games').boundingBox();
    const mobileThemeBox = await page.locator('.button__bg-mode').boundingBox();
    const mobileTitleBox = await page.getByText('ARCHITECTURAL WONDERS OF THE WORLD').boundingBox();
    const mobileTopNavGeometry = await page
      .locator(
        'app-header .header__globe__home-slot > button, app-header .header__globe > button, app-header .button__search-bar > button, app-header .button__games > button, app-header .button__bg-mode > button',
      )
      .evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect();

            return { width: rect.width, x: rect.x };
          })
          .sort((a, b) => a.x - b.x),
      );
    const mobileTextNavGeometry = await page
      .locator('app-header .header__globe > button')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const labelRect = element.querySelector('.url-path')!.getBoundingClientRect();

          return {
            labelWidth: labelRect.width,
            labelX: labelRect.x,
          };
        }),
      );
    const firstGroup = page.locator('.home-container .group').first();
    const groupNameBox = await firstGroup.locator('.group__name').boundingBox();
    const firstItemBox = await firstGroup.locator('.item').first().boundingBox();

    if (
      !mobileGlobeBox ||
      !mobileSearchBox ||
      !mobileGamesBox ||
      !mobileThemeBox ||
      !mobileTitleBox
    ) {
      throw new Error('Expected the mobile navigation, controls, and title to be visible.');
    }

    const controlTopPositions = [mobileSearchBox.y, mobileGamesBox.y, mobileThemeBox.y];
    expect(Math.max(...controlTopPositions) - Math.min(...controlTopPositions)).toBeLessThanOrEqual(
      1,
    );
    expect(
      Math.max(
        mobileGlobeBox.y + mobileGlobeBox.height,
        mobileSearchBox.y + mobileSearchBox.height,
        mobileGamesBox.y + mobileGamesBox.height,
        mobileThemeBox.y + mobileThemeBox.height,
      ),
    ).toBeLessThanOrEqual(mobileTitleBox.y);

    const equalWidthControls = [
      mobileGlobeBox.width,
      mobileSearchBox.width,
      mobileGamesBox.width,
      mobileThemeBox.width,
    ];
    expect(Math.max(...equalWidthControls) - Math.min(...equalWidthControls)).toBeLessThanOrEqual(
      1,
    );
    equalWidthControls.forEach((width) => expect(width).toBeCloseTo(44, 1));
    await expect(page.locator('.button__search-bar input')).toBeHidden();
    await expect(page.locator('.button__games .mobile-only')).toBeVisible();
    await expect(page.locator('.button__games span')).toBeHidden();

    expect(mobileTopNavGeometry).toHaveLength(7);
    mobileTopNavGeometry.forEach((item) => {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x + item.width).toBeLessThanOrEqual(320);
    });

    const mobileControlGaps = [mobileSearchBox, mobileGamesBox, mobileThemeBox]
      .slice(1)
      .map((item, index) => {
        const previousItem = [mobileSearchBox, mobileGamesBox, mobileThemeBox][index];

        return item.x - (previousItem.x + previousItem.width);
      });

    mobileControlGaps.forEach((gap) => expect(gap).toBeCloseTo(8, 1));

    expect(mobileTextNavGeometry).toHaveLength(3);

    const mobileTextNavGaps = mobileTextNavGeometry.slice(1).map((item, index) => {
      const previousItem = mobileTextNavGeometry[index];

      return item.labelX - (previousItem.labelX + previousItem.labelWidth);
    });

    mobileTextNavGaps.forEach((gap) => expect(gap).toBeCloseTo(16, 1));
    expect(Math.max(...mobileTextNavGaps) - Math.min(...mobileTextNavGaps)).toBeLessThanOrEqual(1);

    expect(await firstGroup.evaluate((element) => getComputedStyle(element).flexDirection)).toBe(
      'row',
    );

    if (!groupNameBox || !firstItemBox) {
      throw new Error('Expected the first mobile group and item to be visible.');
    }

    expect(groupNameBox.x + groupNameBox.width).toBeLessThanOrEqual(firstItemBox.x);

    const viewport = await page.evaluate(() => {
      const scrollingElement = document.scrollingElement ?? document.documentElement;

      return {
        clientWidth: scrollingElement.clientWidth,
        scrollWidth: scrollingElement.scrollWidth,
      };
    });

    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  });

  test('expands and submits search from the mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/');

    const searchButton = page.getByRole('button', { name: 'Open search' });
    const searchInput = page.getByPlaceholder('Search...');

    await searchButton.click();

    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
    await expect(page.getByRole('button', { name: 'Map', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Timeline', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Charts', exact: true })).toBeHidden();

    const searchInputBox = await searchInput.boundingBox();
    const submitButtonBox = await page.getByRole('button', { name: 'Submit search' }).boundingBox();

    if (!searchInputBox || !submitButtonBox) {
      throw new Error('Expected the expanded mobile search controls to be visible.');
    }

    expect(searchInputBox.x).toBeLessThan(submitButtonBox.x);
    expect(submitButtonBox.width).toBeCloseTo(44, 1);

    await searchInput.fill('taj');
    await expect(page).toHaveURL(/\/home$|\/$/);
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/search\?q=taj$/);
    await expect(
      page.getByText('Please switch to a laptop or desktop to view this content.'),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Taj Mahal/i })).toBeVisible();
    await expect(searchInput).toHaveValue('taj');
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

    expect(scrollInfo.scrollHeight).toBeGreaterThanOrEqual(scrollInfo.clientHeight);

    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    const canvasPixels = countVisiblePixels(await canvas.screenshot());

    expect(canvasBox?.width).toBeGreaterThan(300);
    expect(canvasBox?.height).toBeGreaterThan(300);
    expect(canvasPixels).toBeGreaterThan(100);

    const popupBoxBeforeAnswer = await page.locator('.quiz-popup').boundingBox();
    const popupFeedback = page.locator('.quiz-popup__feedback');
    await expect(popupFeedback).toBeHidden();

    await page.locator('.quiz-popup__option').last().click();
    await expect(popupFeedback).toBeVisible();
    await expect(popupFeedback).toContainText('Correct. Marker cleared.');
    await expect(page.getByRole('dialog', { name: 'World tour question' })).toBeVisible();

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

    await expect(popupFeedback).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'World tour question' })).toBeVisible();
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
