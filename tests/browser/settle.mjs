import { expect } from '@playwright/test';

// Content above the Base tab menu (the report card, a restored profile, a translated headline) renders after load.
// On a slow runner a click aimed at a menu row can land after that shift, on the row next to it.
// Scroll the row into view and wait until it has kept the same position for half a second.
export async function settled(locator, timeout = 20_000) {
  await locator.scrollIntoViewIfNeeded();
  let previous = null;
  await expect.poll(async () => {
    const box = JSON.stringify(await locator.boundingBox());
    const same = box === previous;
    previous = box;
    return same;
  }, { intervals: [500], timeout }).toBe(true);
  return locator;
}
