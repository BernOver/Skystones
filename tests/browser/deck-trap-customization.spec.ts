import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, handSize, placedKeywords } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import { DEFAULT_TRAPS, validTrap } from "../../src/traps.ts";
import {
  ADVENTURE_STORAGE,
  newAdventure,
  enterAdventureNode,
  validateAdventure,
} from "../../src/adventure.ts";

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
const picture = readFileSync("src/assets/characters/trap-shadow.webp");
const image = `data:image/webp;base64,${picture.toString("base64")}`;
const rich: StoneKeyword[] = [
  { type: "head-start", side: 0, amount: 2 },
  { type: "comeback", side: 1, amount: 2 },
  { type: "shield", side: 2, amount: 2 },
  {
    type: "conjure",
    mode: "specific",
    card: "spyro",
    count: 1,
    recipient: "self",
  },
  { type: "sunder", side: "any", amount: 2 },
  { type: "dizzy", sides: [3] },
  { type: "assemble", count: 2 },
  { type: "trap", trap: DEFAULT_TRAPS[0] },
];
const cards: Stone[] = Array.from({ length: 8 }, (_, i) => ({
  ...STARTER_STONES[0],
  id: `custom-readable-${i}`,
  name: `Readable Stone ${i}`,
  element: "fire",
  custom: true,
  edges: [2, 2, 2, 1],
  keywords: i === 0 ? rich : [],
}));
async function fixture(page: Page, size: 3 | 4 = 3) {
  await page.addInitScript(
    ({ cards, size }) => {
      if (!localStorage.getItem("skystones-library-v1"))
        localStorage.setItem(
          "skystones-library-v1",
          JSON.stringify({
            custom: cards,
            deck: cards.slice(0, size === 3 ? 5 : 8).map((c) => c.id),
            boardSize: size,
            sound: false,
          }),
        );
    },
    { cards, size },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
}
async function measurements(
  page: Page,
  selector: string,
  minWidth: number,
  minArt: number,
) {
  const sizes = await page.locator(selector).evaluateAll((nodes) =>
    nodes.map((node) => {
      const card = node.querySelector<HTMLElement>(".stone-card")!,
        art = card.querySelector<HTMLElement>(".stone-art")!,
        words = card.querySelector<HTMLElement>(".stone-keywords");
      return {
        width: card.getBoundingClientRect().width,
        art: art.getBoundingClientRect().height,
        overflow: card.scrollHeight - card.clientHeight,
        overlap: words
          ? art.getBoundingClientRect().bottom -
            words.getBoundingClientRect().top
          : 0,
      };
    }),
  );
  expect(sizes.length).toBeGreaterThan(0);
  for (const s of sizes) {
    expect(s.width).toBeGreaterThanOrEqual(minWidth);
    expect(s.art).toBeGreaterThanOrEqual(minArt);
    expect(s.overflow).toBeLessThanOrEqual(2);
    expect(s.overlap).toBeLessThanOrEqual(1);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
for (const size of [3, 4] as const)
  test(`${size}×${size} deck builder and pregame use large readable cards at desktop, tablet and phone widths`, async ({
    page,
  }) => {
    await fixture(page, size);
    await page.getByRole("button", { name: /^My creations/ }).click();
    await expect(page.locator(".filled-deck-slot")).toHaveCount(handSize(size));
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      await measurements(
        page,
        ".filled-deck-slot",
        width <= 540 ? 128 : 150,
        width <= 540 ? 146 : 164,
      );
      await measurements(
        page,
        ".collection-card-button",
        width <= 540 ? 110 : 180,
        width <= 540 ? 146 : 174,
      );
    }
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page
      .locator(".deck-shelf")
      .screenshot({ path: `/tmp/skystones-deck-${size}.png` });
    await page.getByRole("button", { name: "Let’s play", exact: true }).click();
    await expect(page.locator(".match-deck-card")).toHaveCount(handSize(size));
    await expect(
      page.getByRole("region", { name: "Deck ready for this match" }),
    ).toContainText(`Your stones · ${handSize(size)} / ${handSize(size)}`);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      await measurements(
        page,
        ".match-deck-card",
        width <= 540 ? 128 : 150,
        width <= 540 ? 146 : 164,
      );
    }
    await page.screenshot({
      path: `/tmp/skystones-pregame-${size}-mobile.png`,
    });
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page
      .locator(".deck-slots")
      .getByRole("button", {
        name: "Remove Readable Stone 0 from deck",
        exact: true,
      })
      .click();
    await expect(page.locator(".empty-deck-slot")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Let’s play", exact: true }),
    ).toBeDisabled();
  });
test("changing Match deck replaces the visible pregame cards and board size", async ({
  page,
}) => {
  const decks = [
    {
      id: "five",
      name: "Five stones",
      boardSize: 3,
      cards: cards.slice(0, 5).map((c) => c.id),
    },
    {
      id: "eight",
      name: "Eight stones",
      boardSize: 4,
      cards: cards.map((c) => c.id),
    },
  ];
  await page.addInitScript(
    (data) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(data)),
    {
      custom: cards,
      decks,
      activeDeckId: "five",
      boardSize: 3,
      deck: decks[0].cards,
      sound: false,
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await expect(page.locator(".match-deck-card")).toHaveCount(5);
  await page.getByLabel("Match deck", { exact: true }).selectOption("eight");
  await expect(page.locator(".match-deck-card")).toHaveCount(8);
  await expect(page.locator(".match-deck-card").last()).toContainText(
    "Readable Stone 7",
  );
  await expect(page.getByLabel("Board size", { exact: true })).toHaveValue("4");
  await page.getByLabel("Match deck", { exact: true }).selectOption("five");
  await expect(page.locator(".match-deck-card")).toHaveCount(5);
});
test("Trap editor crops an uploaded picture into a circle and shares its image, doubling and nullification rules", async ({
  page,
}) => {
  await fixture(page);
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await page
    .getByRole("button", { name: "Create a Trap", exact: true })
    .click();
  await page.getByLabel("Trap name", { exact: true }).fill("Portrait Crystal");
  await page.getByLabel("Trap picture", { exact: true }).setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(page.getByRole("alert")).toContainText("PNG, JPG, or WebP");
  await page.getByLabel("Trap picture", { exact: true }).setInputFiles({
    name: "trap-shadow.webp",
    mimeType: "image/webp",
    buffer: picture,
  });
  await expect(
    page.locator(".trap-picture-editor .trap-portrait"),
  ).toHaveAttribute("href", /^data:image\/(webp|png);base64,/);
  const uploadedImage = (await page
    .locator(".trap-picture-editor .trap-portrait")
    .getAttribute("href"))!;
  const dimensions = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = data;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, uploadedImage);
  expect(dimensions).toEqual([256, 256]);
  expect(uploadedImage.length).toBeLessThan(350_000);
  await expect(
    page.locator(".trap-picture-editor clipPath circle"),
  ).toHaveAttribute("r", "25");
  await expect(
    page.locator(".trap-picture-editor .trap-portrait"),
  ).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
  await page
    .getByLabel("Trap effect 1", { exact: true })
    .selectOption("amplify");
  await page
    .getByLabel("Trap doubled keyword 1", { exact: true })
    .selectOption("terrain");
  await page.getByRole("button", { name: "Add effect", exact: true }).click();
  await page
    .getByLabel("Trap effect 2", { exact: true })
    .selectOption("nullify");
  await page
    .getByLabel("Trap nullified effect 2", { exact: true })
    .selectOption("conjure");
  await page.getByRole("button", { name: "Add effect", exact: true }).click();
  await page
    .getByLabel("Trap effect 3", { exact: true })
    .selectOption("nullify");
  await page
    .getByLabel("Trap nullified effect 3", { exact: true })
    .selectOption("defense-bonus");
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".trap-editor")
    .screenshot({ path: "/tmp/skystones-trap-picture.png" });
  await page.getByRole("button", { name: "Save Trap", exact: true }).click();
  const crystal = await page.evaluate(
    () => JSON.parse(localStorage.getItem("skystones-traps-v1")!)[0],
  );
  expect(validTrap(crystal)).toBe(true);
  expect(crystal.image).toBe(uploadedImage);
  await page.getByRole("button", { name: /^All stones/ }).click();
  await page
    .getByRole("button", { name: "View Readable Stone 0", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await page
    .getByLabel("Trap crystal · Keyword 8", { exact: true })
    .selectOption(crystal.id);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Readable Stone 0", exact: true })
    .click();
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(
    exported.card.keywords.find((k: StoneKeyword) => k.type === "trap").trap,
  ).toEqual(crystal);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  const saved = page
    .locator(".trap-grid article")
    .filter({ hasText: "Portrait Crystal" });
  await expect(saved.locator(".trap-portrait")).toHaveAttribute(
    "href",
    uploadedImage,
  );
  await saved.getByRole("button", { name: "Edit Trap", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove Trap picture", exact: true })
    .click();
  await expect(page.locator(".trap-picture-editor .trap-portrait")).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Save Trap", exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("skystones-traps-v1")!)[0].image,
    ),
  ).toBeUndefined();
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure displays the pictured Trap and keeps Conjure nullified after reload`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const crystal = {
      ...DEFAULT_TRAPS[0],
      affects: undefined,
      image,
      effects: [
        { kind: "nullify", effect: "conjure" },
        { kind: "nullify", effect: "shield" },
      ],
    };
    const keywords: StoneKeyword[] = [
      { type: "trap", trap: crystal } as StoneKeyword,
      {
        type: "conjure",
        mode: "specific",
        card: "spyro",
        count: 2,
        recipient: "self",
      },
      { type: "shield", side: 0, amount: 2 },
    ];
    const first = { ...run.battle!.hands[0][0], keywords };
    run = {
      ...run,
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
    await expect(page.locator(".trap-panel .trap-portrait")).toHaveAttribute(
      "href",
      image,
    );
    await expect(page.locator("#adventure-board-0 .shield-pip")).toHaveCount(0);
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    expect(validateAdventure(stored)).toBe(true);
    expect(
      placedKeywords(stored.battle.board[0]).some((k) => k.type === "conjure"),
    ).toBe(false);
    expect(stored.battle.hands[0].some((c: Stone) => c.conjured)).toBe(false);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(page.locator(".trap-panel .trap-portrait")).toHaveAttribute(
      "href",
      image,
    );
    await expect(page.locator(".trap-panel")).toContainText("nullify conjure");
  });
