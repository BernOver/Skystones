import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  ADVENTURE_STORAGE,
  newAdventure,
  enterAdventureNode,
  validateAdventure,
} from "../../src/adventure.ts";
import { DEFAULT_TRAPS } from "../../src/traps.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  test.beforeEach(async ({ page }) => {
    const unexpected: string[] = [];
    (page as Page & { unexpected: string[] }).unexpected = unexpected;
    await page.route("**/*", (route) => {
      if (route.request().url() === "http://127.0.0.1:5173/")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: html,
        });
      unexpected.push(route.request().url());
      return route.abort();
    });
  });
  test.afterEach(({ page }) =>
    expect((page as Page & { unexpected: string[] }).unexpected).toEqual([]),
  );
}
test.beforeEach(({ page }) =>
  page.on("pageerror", (e) => {
    throw e;
  }),
);
async function range(page: Page, label: string, value: number) {
  await page.getByLabel(label, { exact: true }).evaluate((node, n) => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(node, String(n));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(page.getByLabel(label, { exact: true })).toHaveValue(
    String(value),
  );
}
async function download(page: Page) {
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  return Buffer.concat(chunks);
}
async function landscape(page: Page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 100;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#e87047";
    context.fillRect(0, 0, 100, 100);
    context.fillStyle = "#4277bb";
    context.fillRect(100, 0, 100, 100);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return {
    name: "landscape.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
}
test("stone maker resizes and moves built-in portraits, saves and shares the layout, and resets it for a different portrait", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Card studio/ }).click();
  await page.getByLabel("Stone name").fill("Resized Hero");
  await range(page, "Stone image size", 175);
  await range(page, "Stone image horizontal position", 20);
  await range(page, "Stone image vertical position", -30);
  await page
    .getByLabel("Stone image fit", { exact: true })
    .selectOption("cover");
  const preview = page.locator(".preview-card img.uploaded-art");
  await expect(preview).toHaveAttribute(
    "style",
    /translate\(20%, -30%\) scale\(1.75\)/,
  );
  await expect(preview).toHaveCSS("object-fit", "cover");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (c: Stone) => c.name === "Resized Hero",
    ),
  );
  expect(saved.imageTransform).toEqual({
    scale: 1.75,
    x: 20,
    y: -30,
    fit: "cover",
  });
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Resized Hero", exact: true })
    .click();
  await expect(page.locator(".detail-card img.uploaded-art")).toHaveAttribute(
    "style",
    /scale\(1.75\)/,
  );
  const exported = await download(page);
  expect(JSON.parse(exported.toString()).card.imageTransform).toEqual(
    saved.imageTransform,
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Resized Hero", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(
    page.getByLabel("Stone image size", { exact: true }),
  ).toHaveValue("175");
  await page.setViewportSize({ width: 390, height: 1000 });
  await page
    .locator(".preview-card")
    .screenshot({ path: "/tmp/skystones-resized-stone.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Reset stone picture", exact: true })
    .click();
  await expect(preview).toHaveCSS("transform", "none");
  await expect(
    page.getByLabel("Stone image size", { exact: true }),
  ).toHaveValue("100");
  await range(page, "Stone image size", 200);
  await page.getByLabel("Find a character portrait").fill("Trigger Happy");
  await page
    .getByRole("button", { name: "Use Trigger Happy portrait", exact: true })
    .click();
  await expect(
    page.getByLabel("Stone image size", { exact: true }),
  ).toHaveValue("100");
});
test("uploaded stone artwork can shrink and fill the card, and replacement and removal clear the old layout", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Card studio/ }).click();
  const picture = await landscape(page);
  await page
    .getByLabel("Upload card artwork", { exact: true })
    .setInputFiles(picture);
  await expect(page.locator(".preview-card img.uploaded-art")).toHaveAttribute(
    "src",
    /^data:image\/png;/,
  );
  await range(page, "Stone image size", 50);
  await range(page, "Stone image horizontal position", -25);
  await page
    .getByLabel("Stone image fit", { exact: true })
    .selectOption("contain");
  await expect(page.locator(".preview-card img.uploaded-art")).toHaveAttribute(
    "style",
    /translate\(-25%, 0%\) scale\(0.5\)/,
  );
  await page
    .getByLabel("Upload card artwork", { exact: true })
    .setInputFiles(picture);
  await expect(
    page.getByLabel("Stone image size", { exact: true }),
  ).toHaveValue("100");
  await expect(
    page.getByLabel("Stone image horizontal position", { exact: true }),
  ).toHaveValue("0");
  await range(page, "Stone image size", 150);
  await page
    .getByRole("button", { name: "Remove uploaded artwork", exact: true })
    .click();
  await expect(
    page.getByLabel("Stone image size", { exact: true }),
  ).toHaveValue("100");
});
test("Trap maker keeps the full uploaded picture and resizes it inside a fixed circle, with saved position and fit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await page
    .getByRole("button", { name: "Create a Trap", exact: true })
    .click();
  await page.getByLabel("Trap name", { exact: true }).fill("Resized Crystal");
  await page
    .getByLabel("Trap picture", { exact: true })
    .setInputFiles(await landscape(page));
  const image = page.locator(".trap-picture-editor .trap-portrait");
  await expect(image).toHaveAttribute("href", /^data:image\/webp;/);
  const uploaded = await image.getAttribute("href");
  expect(
    await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src!;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, uploaded),
  ).toEqual([256, 128]);
  await range(page, "Trap image size", 50);
  await range(page, "Trap image horizontal position", 30);
  await range(page, "Trap image vertical position", -20);
  await page
    .getByLabel("Trap image fit", { exact: true })
    .selectOption("contain");
  await expect(image).toHaveAttribute("width", "25");
  await expect(image).toHaveAttribute("x", "52.5");
  await expect(image).toHaveAttribute("y", "30.5");
  await expect(image).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
  await expect(
    page.locator(".trap-picture-editor clipPath circle"),
  ).toHaveAttribute("r", "25");
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".trap-editor")
    .screenshot({ path: "/tmp/skystones-resized-trap.png" });
  await page.getByRole("button", { name: "Save Trap", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("skystones-traps-v1")!)[0],
  );
  expect(saved.imageTransform).toEqual({
    scale: 0.5,
    x: 30,
    y: -20,
    fit: "contain",
  });
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  const crystal = page
    .locator(".trap-grid article")
    .filter({ hasText: "Resized Crystal" });
  await expect(crystal.locator(".trap-portrait")).toHaveAttribute(
    "width",
    "25",
  );
  await crystal.getByRole("button", { name: "Edit Trap", exact: true }).click();
  await expect(page.getByLabel("Trap image size", { exact: true })).toHaveValue(
    "50",
  );
  await page
    .getByRole("button", { name: "Reset trap picture", exact: true })
    .click();
  await expect(image).toHaveAttribute("width", "50");
  await expect(image).toHaveAttribute("x", "25");
  await page.getByRole("button", { name: "Save Trap", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("skystones-traps-v1")!)[0]
          .imageTransform,
    ),
  ).toBeUndefined();
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure board and Trap keep picture layouts after reload`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const image = `data:image/webp;base64,${readFileSync("src/assets/characters/trap-shadow.webp").toString("base64")}`;
    const imageTransform = {
      scale: 1.6,
      x: 10,
      y: -15,
      fit: "contain" as const,
    };
    const trap = {
      ...DEFAULT_TRAPS[0],
      image,
      imageTransform: { scale: 0.5, x: 30, y: -20, fit: "contain" as const },
    };
    const first = {
      ...run.battle!.hands[0][0],
      image,
      imageTransform,
      keywords: [{ type: "trap", trap }] as StoneKeyword[],
    };
    run = {
      ...run,
      inventory: run.inventory.map((s) =>
        s.id === first.id ? { ...s, image, imageTransform } : s,
      ),
      battle: {
        ...run.battle!,
        hands: [
          [first, ...run.battle!.hands[0].slice(1)],
          run.battle!.hands[1],
        ],
      },
    };
    await page.addInitScript(
      ({ key, data }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(data));
      },
      { key: ADVENTURE_STORAGE, data: run },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page
      .getByRole("button", {
        name: new RegExp("^Select " + first.name + ", adventure card"),
      })
      .click();
    await page.locator("#adventure-board-0").click();
    await expect(
      page.locator("#adventure-board-0 .capture-flip-back img.uploaded-art"),
    ).toHaveAttribute("style", /translate\(10%, -15%\) scale\(1.6\)/);
    await expect(page.locator(".trap-panel .trap-portrait")).toHaveAttribute(
      "width",
      "25",
    );
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    expect(validateAdventure(stored)).toBe(true);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(
      page.locator("#adventure-board-0 .capture-flip-back img.uploaded-art"),
    ).toHaveAttribute("style", /scale\(1.6\)/);
    await expect(page.locator(".trap-panel .trap-portrait")).toHaveAttribute(
      "x",
      "52.5",
    );
  });
