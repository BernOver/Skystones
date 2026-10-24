import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  adventureFusionPreview,
  adventureInscriptionOffers,
  adventureWorkshopOffer,
  enterAdventureNode,
  newAdventure,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import { KEYWORD_RULES, handSize } from "../../src/game.ts";
async function open(page: Page, run: Adventure) {
  await page.addInitScript(
    ({ key, run }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { key: ADVENTURE_STORAGE, run },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function reload(page: Page) {
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}

test("paid shop rerolls refresh visible offers, retain purchases and upgrades, and persist the exact new keyword", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...newAdventure(3, 31), floor: 2, gold: 400, potions: [] },
    "shop-one",
  );
  await open(page, run);
  await page
    .getByRole("button", { name: /^Buy card/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /^Buy potion/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Buy upgrade · 25 gold", exact: true })
    .click();
  await page.getByLabel("Workshop service").selectOption("keyword");
  const before = await stored(page),
    oldKeyword = adventureWorkshopOffer(before).keyword;
  await page
    .getByRole("button", { name: "Reroll shop · 20 gold", exact: true })
    .click();
  const after = await stored(page),
    keyword = adventureWorkshopOffer(after).keyword;
  expect(after.gold).toBe(before.gold - 20);
  expect(after.inventory).toEqual(before.inventory);
  expect(after.potions).toEqual(before.potions);
  expect(after.shopCards).toHaveLength(3);
  expect(after.shopPotions).toHaveLength(3);
  expect(keyword.type).not.toBe(oldKeyword.type);
  expect(
    after.shopCards.every(
      (card) => !run.shopCards.some((old) => old.id === card.id),
    ),
  ).toBe(true);
  await expect(
    page.getByRole("region", { name: "Shop keyword offer" }),
  ).toContainText(KEYWORD_RULES[keyword.type].name);
  await expect(page.getByLabel("Refresh shop stock")).toContainText(
    "1 reroll used",
  );
  await page
    .getByRole("button", { name: "Buy upgrade · 35 gold", exact: true })
    .click();
  expect((await stored(page)).inventory[0].keywords).toEqual([keyword]);
  await reload(page);
  await page.getByLabel("Workshop service").selectOption("keyword");
  expect(adventureWorkshopOffer(await stored(page))).toEqual(
    adventureWorkshopOffer(after),
  );
  await expect(
    page.getByRole("region", { name: "Shop keyword offer" }),
  ).toContainText(KEYWORD_RULES[keyword.type].name);
});
test("Merchant's Die grants one free reroll at zero gold, saves the charge, and shows the discounted paid price afterward", async ({
  page,
}) => {
  const run = enterAdventureNode(
    {
      ...newAdventure(4, 13),
      floor: 2,
      gold: 0,
      relics: ["merchants-die", "hagglers-coin"],
    },
    "shop-one",
  );
  await open(page, run);
  await page
    .getByRole("button", { name: "Reroll shop · Free", exact: true })
    .click();
  expect((await stored(page)).gold).toBe(0);
  await expect(
    page.getByRole("button", { name: "Reroll shop · 16 gold", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Refresh shop stock")).toContainText(
    "Free reroll used",
  );
  await reload(page);
  await expect(
    page.getByRole("button", { name: "Reroll shop · 16 gold", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Reroll shop · Free", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Inspect relic Merchant’s Die", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "first shop reroll at each merchant is free",
  );
});
test("buying Merchant's Die makes the current shop's first reroll free immediately", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...newAdventure(3, 18), floor: 2, gold: 100 },
    "shop-one",
  );
  run.shopRelic = "merchants-die";
  await open(page, run);
  await page
    .getByRole("button", { name: "Buy relic · 75 gold", exact: true })
    .click();
  expect((await stored(page)).gold).toBe(25);
  await page
    .getByRole("button", { name: "Reroll shop · Free", exact: true })
    .click();
  expect((await stored(page)).gold).toBe(25);
  await expect(
    page.getByRole("button", { name: "Reroll shop · 20 gold", exact: true }),
  ).toBeEnabled();
});
for (const size of [3, 4] as const)
  test(`${size}×${size} shrine offers permanent free inscriptions with card previews and saves the chosen keyword once`, async ({
    page,
  }) => {
    const run = enterAdventureNode(
        { ...newAdventure(size, 47), floor: 1 },
        "rune-shrine",
      ),
      card = run.inventory[1],
      offer = adventureInscriptionOffers(run)[2];
    await open(page, run);
    await expect(page.locator(".event-inscription-offer")).toHaveCount(3);
    await page.getByLabel("Event inscription card").selectOption(card.id);
    await page
      .getByRole("button", {
        name: `Choose ${KEYWORD_RULES[offer.type].name} inscription`,
        exact: true,
      })
      .click();
    await expect(
      page.locator(".event-card-comparison .event-card-preview"),
    ).toHaveCount(2);
    await page
      .getByRole("button", {
        name: `Inspect inscribed stone ${card.name}`,
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      KEYWORD_RULES[offer.type].name,
    );
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: `Inscribe ${card.name} for free`,
        exact: true,
      })
      .click();
    const saved = await stored(page);
    expect(saved.floor).toBe(2);
    expect(saved.gold).toBe(run.gold);
    expect(saved.deck).toEqual(run.deck);
    expect(saved.inventory[1].keywords).toEqual([offer]);
    await reload(page);
    expect((await stored(page)).inventory[1].keywords).toEqual([offer]);
    await expect(page.locator(".event-inscription-offer")).toHaveCount(0);
  });
for (const size of [3, 4] as const)
  test(`${size}×${size} forge previews merged keywords and capped edges, consumes the donor, and leaves a playable full deck`, async ({
    page,
  }) => {
    const run = enterAdventureNode(
      { ...newAdventure(size, 62), floor: 4 },
      "fusion-forge",
    );
    run.inventory[0] = {
      ...run.inventory[0],
      edges: [5, 5, 2, 0],
      keywords: [{ type: "head-start", side: 0 }],
    };
    run.inventory[1] = {
      ...run.inventory[1],
      edges: [0, 0, 2, 5],
      keywords: [{ type: "dizzy" }],
    };
    const expected = adventureFusionPreview(run.inventory[0], run.inventory[1]);
    await open(page, run);
    await expect(
      page.locator(".fusion-card-comparison .event-card-preview"),
    ).toHaveCount(3);
    await expect(page.locator(".fusion-cap-notice")).toContainText("17 pips");
    await expect(page.locator(".fusion-keywords")).toContainText("Head Start");
    await expect(page.locator(".fusion-keywords")).toContainText("Dizzy");
    await expect(
      page
        .locator(".fusion-card-comparison .event-card-preview")
        .last()
        .locator(".edge b"),
    ).toHaveText(expected.edges.map(String));
    await page
      .getByRole("button", { name: "Combine these stones", exact: true })
      .click();
    const saved = await stored(page);
    expect(saved.floor).toBe(5);
    expect(saved.gold).toBe(run.gold);
    expect(saved.inventory).toHaveLength(run.inventory.length - 1);
    expect(saved.inventory[0]).toEqual(expected);
    expect(
      saved.inventory.some((card) => card.id === run.inventory[1].id),
    ).toBe(false);
    expect(saved.deck).toHaveLength(handSize(size));
    expect(new Set(saved.deck).size).toBe(handSize(size));
    await reload(page);
    await page.getByRole("button", { name: /The Lantern Market/ }).click();
    await page.getByRole("button", { name: "Leave shop", exact: true }).click();
    await page.getByRole("button", { name: /The Stone Sentinel/ }).click();
    await expect(page.locator(".run-hand-card")).toHaveCount(handSize(size));
    await expect(
      page.locator(".run-hand-card").filter({ hasText: expected.name }),
    ).toHaveCount(1);
  });
test("fusion requires a reserve card and allows leaving without consuming either input", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...newAdventure(3, 67), floor: 4 },
    "fusion-forge",
  );
  run.inventory = run.inventory.slice(0, 5);
  await open(page, run);
  await expect(
    page.getByRole("button", { name: "Combine these stones", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".event-unavailable")).toContainText(
    "reserve stone",
  );
  await page
    .getByRole("button", { name: "Leave the forge", exact: true })
    .click();
  expect((await stored(page)).inventory).toEqual(run.inventory);
});
for (const id of ["rune-shrine", "fusion-forge"] as const)
  test(`${id} and its card previews fit a phone screen`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const run = enterAdventureNode(
      { ...newAdventure(4, 81), floor: id === "rune-shrine" ? 1 : 4 },
      id,
    );
    await open(page, run);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/skystones-${id}-mobile.png`,
      fullPage: true,
    });
  });
