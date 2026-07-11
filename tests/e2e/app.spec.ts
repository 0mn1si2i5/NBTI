import { expect, test } from "@playwright/test";

test("completes the private in-memory quiz and exposes sources", async ({ page }, testInfo) => {
  const externalRequests: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "测测你的精神出厂设置" })).toBeVisible();
  await page.getByRole("button", { name: "开始解剖" }).click();
  await expect(page.getByText("样本 1 / 24")).toBeVisible();

  await page.locator(".option-button").first().click();
  await expect(page.getByText("样本 2 / 24")).toBeVisible();
  await page.getByRole("button", { name: "回上一层" }).click();
  await expect(page.getByText("样本 1 / 24")).toBeVisible();

  for (let index = 0; index < 18; index += 1) {
    await page.locator(".option-button").first().click();
  }
  await expect(page.getByText("样本 19 / 24")).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

  const firstScale = page.getByRole("radiogroup", { name: "这句话像不像你" });
  const firstChoice = firstScale.getByRole("radio").first();
  await firstChoice.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(firstScale.getByRole("radio").nth(2)).toBeFocused();
  await page.keyboard.press("Enter");
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("radiogroup", { name: "这句话像不像你" }).getByRole("radio").nth(2).click();
  }

  await expect(page.getByText("为什么借他作镜子")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole("heading", { name: "史料边角" })).toBeVisible();
  await expect(page.locator(".quote a")).toHaveAttribute("href", /^https:\/\//);
  await expect(page.locator(".fact-card a").first()).toHaveAttribute("href", /^https:\/\//);

  const layout = await page.evaluate(() => {
    const hero = document.querySelector(".result-hero")?.getBoundingClientRect();
    const avatar = document.querySelector(".persona-avatar")?.getBoundingClientRect();
    const copy = document.querySelector(".result-copy")?.getBoundingClientRect();
    const axes = document.querySelector(".result-axes")?.getBoundingClientRect();
    return {
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      heroHeight: hero?.height ?? 0,
      avatarHeight: avatar?.height ?? 0,
      avatarTop: avatar?.top ?? 0,
      copyHeight: copy?.height ?? 0,
      copyTop: copy?.top ?? 0,
      axesTop: axes?.top ?? 0,
      axesBottom: axes?.bottom ?? Infinity,
    };
  });
  expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
  if (testInfo.project.name === "desktop") {
    expect(layout.heroHeight).toBeLessThanOrEqual(580);
    expect(Math.abs(layout.avatarHeight - layout.copyHeight)).toBeLessThanOrEqual(2);
    expect(layout.axesBottom).toBeLessThanOrEqual(900);
  } else {
    expect(layout.avatarHeight).toBeLessThanOrEqual(335);
    expect(layout.avatarTop).toBeLessThan(layout.copyTop);
    expect(layout.axesTop).toBeGreaterThan(layout.copyTop);
  }

  await page.getByRole("button", { name: "复制结果" }).click();
  await expect(page.locator(".share-box")).toBeVisible();
  await expect(page.locator(".share-box")).toHaveValue(/https:\/\/0mn1si2i5\.github\.io\/NBTI\//);

  if (testInfo.project.name === "desktop") {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "保存结果卡" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^nbti-.+\.png$/);
  }

  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  expect(externalRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);

  await page.reload();
  await expect(page.getByRole("button", { name: "开始解剖" })).toBeVisible();
});
