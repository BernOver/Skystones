import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { newAdventure, ADVENTURE_STORAGE } from "../../src/adventure.ts";
import {
  BUILTIN_ENEMY_CHARACTERS,
  ENCOUNTERS_STORAGE,
} from "../../src/encounters.ts";
import type {
  EncounterDefinition,
  EncounterLibrary,
} from "../../src/encounters.ts";
import { DEFAULT_TOKENS } from "../../src/tokens.ts";
import { customTribe, CUSTOM_TRIBES_STORAGE } from "../../src/tribes.ts";

if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  let requests: string[];
  test.beforeEach(async ({ page }) => {
    requests = [];
    await page.route("**/*", (route) =>
      route.request().url() === "http://127.0.0.1:5173/"
        ? route.fulfill({ status: 200, contentType: "text/html", body: html })
        : (requests.push(route.request().url()), route.abort()),
    );
  });
  test.afterEach(() => expect(requests).toEqual([]));
}
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});
const rival: EncounterDefinition = {
  id: "custom-clockwork",
  name: "Clockwork Showdown",
  description: "A clockwork keeper wagers its spare gears on a stone duel.",
  character: {
    ...BUILTIN_ENEMY_CHARACTERS[3],
    id: "enemy-clockwork",
    name: "Gear Guardian",
    portrait: "dr-krankcase",
  },
  pools: ["easy", "event", "boss"],
  acts: [1, 2],
  enabled: true,
  mechanic: "standard",
  deck: [DEFAULT_TOKENS[0], DEFAULT_TOKENS[0]],
};
const roster: EncounterLibrary = {
  version: 1,
  characters: [rival.character],
  encounters: [rival],
};
async function adventure(page: Page) {
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}
async function workshop(page: Page) {
  await adventure(page);
  await page
    .getByRole("button", { name: "Adventure workshop", exact: true })
    .click();
}
async function runSave(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), ADVENTURE_STORAGE);
}
async function playEmptyEnemyTest(page: Page, size: number) {
  for (let i = 0; i < (size === 3 ? 5 : 8); i++) {
    await page.locator(".run-hand-card:enabled").first().click();
    await page.locator(".adventure-square.vacant:enabled").first().click();
  }
  await expect(page.locator(".run-rewards")).toBeVisible();
}
test("create reusable tribes during card creation and round-trip their names and conditions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Clockwork Caller");
  await page.getByLabel("New tribe name").fill("Clockwork Crew");
  await page.getByLabel("New tribe name").press("Enter");
  await expect(
    page.getByLabel("Tribe Clockwork Crew", { exact: true }),
  ).toBeChecked();
  await page.getByLabel("New tribe name").fill("Storm Riders");
  await page.getByRole("button", { name: "Add tribe", exact: true }).click();
  await expect(
    page.getByLabel("Tribe Storm Riders", { exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("combo");
  await page.getByLabel("Combo trigger", { exact: true }).selectOption("tribe");
  await page
    .getByLabel("Combo tribe", { exact: true })
    .selectOption(customTribe("Clockwork Crew"));
  await expect(page.locator(".preview-card .keyword-combo")).toHaveText(
    "Combo Clockwork Crew",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByLabel("Filter by tribe")
    .selectOption(customTribe("Clockwork Crew"));
  await page
    .getByRole("button", { name: "View Clockwork Caller", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Card tribes"),
  ).toContainText("Storm Riders");
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    payload = JSON.parse(buffer.toString());
  expect(payload.customTribes).toEqual(
    expect.arrayContaining([
      { id: customTribe("Clockwork Crew"), name: "Clockwork Crew" },
      { id: customTribe("Storm Riders"), name: "Storm Riders" },
    ]),
  );
  await page.keyboard.press("Escape");
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    CUSTOM_TRIBES_STORAGE,
  );
  await page.getByLabel("Import card file").setInputFiles({
    name: "clockwork.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await expect(
    page.getByLabel("Tribe Clockwork Crew", { exact: true }),
  ).toBeVisible();
});
test("build a new enemy with tokens, combine pool filters, and test unsaved edits without replacing Adventure", async ({
  page,
}) => {
  const saved = newAdventure(3, 441);
  await page.addInitScript(
    ({ key, run }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { key: ADVENTURE_STORAGE, run: saved },
  );
  await page.goto("/");
  await workshop(page);
  const original = await runSave(page);
  await page
    .getByRole("button", { name: "New encounter", exact: true })
    .click();
  await page
    .getByLabel("Encounter name", { exact: true })
    .fill("Gear Guardian's Trial");
  await page
    .getByLabel("Encounter story", { exact: true })
    .fill("A machine made of spare gears wants to practice Skystones.");
  await page.getByLabel("Pool Easy encounters", { exact: true }).uncheck();
  await page.getByLabel("Pool Hard encounters", { exact: true }).check();
  await page.getByLabel("Pool Bosses", { exact: true }).check();
  await page.getByLabel("Encounter Act 1", { exact: true }).uncheck();
  await page
    .getByRole("button", { name: "New enemy character", exact: true })
    .click();
  await page.getByLabel("Enemy name", { exact: true }).fill("Gear Guardian");
  await page
    .getByLabel("Enemy portrait", { exact: true })
    .selectOption("dr-krankcase");
  await page
    .getByLabel("Find enemy cards", { exact: true })
    .fill("Chompy Seedling");
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", {
        name: "Add Chompy Seedling to enemy hand",
        exact: true,
      })
      .click();
  await expect(page.locator(".encounter-hand-count")).toHaveText(
    "3 starting cards · 3 tokens",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".encounter-character-preview")
    .screenshot({ path: "/tmp/skystones-custom-enemy-phone.png" });
  await page
    .locator(".encounter-edit-body > .run-panel")
    .first()
    .screenshot({ path: "/tmp/skystones-encounter-settings-phone.png" });
  await page.getByLabel("Test board size", { exact: true }).selectOption("4");
  await page.getByLabel("Test act", { exact: true }).selectOption("2");
  await page.getByLabel("Test pool", { exact: true }).selectOption("boss");
  await page
    .getByRole("button", { name: "Test encounter", exact: true })
    .click();
  await expect(page.locator(".adventure-square")).toHaveCount(16);
  await expect(page.locator(".run-battle-heading")).toContainText(
    "Gear Guardian's Trial",
  );
  await expect(page.locator(".run-battle-heading img")).toHaveAttribute(
    "alt",
    "Gear Guardian portrait",
  );
  await expect(page.locator(".run-hand-heading")).toContainText(
    "3 keeper cards remain",
  );
  await page.locator(".run-hand-card:enabled").first().click();
  await page.locator(".adventure-square.vacant:enabled").first().click();
  await expect(page.locator(".run-hand-heading")).toContainText(
    "2 keeper cards remain",
  );
  expect(await runSave(page)).toBe(original);
  await page
    .getByRole("button", { name: "Back to encounter editor", exact: true })
    .click();
  await expect(page.getByLabel("Encounter name", { exact: true })).toHaveValue(
    "Gear Guardian's Trial",
  );
  await page
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await expect(page.locator(".encounter-save-message")).toContainText(
    "Encounter saved",
  );
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ENCOUNTERS_STORAGE,
  );
  const definition = stored.encounters.find(
    (encounter: EncounterDefinition) =>
      encounter.name === "Gear Guardian's Trial",
  );
  expect(definition.pools).toEqual(["hard", "boss"]);
  expect(definition.acts).toEqual([2]);
  expect(definition.deck).toHaveLength(3);
  expect(definition.deck.every((card: { token?: boolean }) => card.token)).toBe(
    true,
  );
  expect(await runSave(page)).toBe(original);
  await page.reload();
  await workshop(page);
  await page
    .getByLabel("Edit encounter", { exact: true })
    .selectOption(definition.id);
  await expect(page.getByLabel("Enemy name", { exact: true })).toHaveValue(
    "Gear Guardian",
  );
  await expect(page.locator(".encounter-hand-entry")).toHaveCount(3);
});
for (const size of [3, 4])
  test(`${size}×${size} an empty custom enemy hand passes and the test finishes without altering the saved run`, async ({
    page,
  }) => {
    await page.goto("/");
    await workshop(page);
    const original = await runSave(page);
    await page
      .getByRole("button", { name: "New encounter", exact: true })
      .click();
    await page
      .getByLabel("Test board size", { exact: true })
      .selectOption(String(size));
    await page
      .getByRole("button", { name: "Test encounter", exact: true })
      .click();
    await playEmptyEnemyTest(page, size);
    expect(await runSave(page)).toBe(original);
    await page
      .getByRole("button", { name: "Restart test", exact: true })
      .click();
    await expect(page.locator(".adventure-square.occupied")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Back to encounter editor", exact: true })
      .click();
    await expect(
      page.getByLabel("Encounter name", { exact: true }),
    ).toHaveValue("New encounter");
  });
test("custom encounters appear in map and event pools with matching portraits, and repeated starting tokens survive reload", async ({
  page,
}) => {
  const run = { ...newAdventure(4, 412), encounterLibrary: roster };
  await page.addInitScript(
    ({ run, roster, runKey, rosterKey }) => {
      if (!localStorage.getItem(runKey))
        localStorage.setItem(runKey, JSON.stringify(run));
      localStorage.setItem(rosterKey, JSON.stringify(roster));
    },
    { run, roster, runKey: ADVENTURE_STORAGE, rosterKey: ENCOUNTERS_STORAGE },
  );
  await page.goto("/");
  await adventure(page);
  const first = page.locator(".run-map-row.current .run-node").first();
  await expect(first).toContainText("Clockwork Showdown");
  await expect(first.locator("img")).toHaveAttribute(
    "alt",
    "Gear Guardian portrait",
  );
  await first.click();
  let stored = JSON.parse((await runSave(page))!);
  expect(
    stored.battle.hands[1].map((card: { name: string }) => card.name),
  ).toEqual(["Chompy Seedling", "Chompy Seedling"]);
  const ids = stored.battle.hands[1].map((card: { id: string }) => card.id);
  expect(new Set(ids).size).toBe(2);
  await page.reload();
  await adventure(page);
  stored = JSON.parse((await runSave(page))!);
  expect(stored.battle.hands[1].map((card: { id: string }) => card.id)).toEqual(
    ids,
  );
  await expect(page.locator(".run-battle-heading")).toContainText(
    "Clockwork Showdown",
  );
  // An event stop uses the same pool definition and offers a choice before combat.
  await page.evaluate(
    ({ key, run }) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          ...run,
          floor: 1,
          phase: "map",
          battle: undefined,
          node: undefined,
        }),
      ),
    { key: ADVENTURE_STORAGE, run },
  );
  await page.reload();
  await adventure(page);
  await page
    .locator(".run-map-row.current .run-node")
    .filter({ hasText: "Clockwork Showdown" })
    .click();
  await expect(
    page.getByRole("button", { name: "Fight this encounter", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fight this encounter", exact: true })
    .click();
  await expect(page.locator(".adventure-square")).toHaveCount(16);
});
test("an original fight can receive a fixed normal card hand and move to a different pool", async ({
  page,
}) => {
  await page.goto("/");
  await workshop(page);
  await page
    .getByLabel("Edit encounter", { exact: true })
    .selectOption("builtin-vortex");
  await page
    .getByLabel("Encounter name", { exact: true })
    .fill("Kaos's Practice Vortex");
  await page.getByLabel("Pool Bosses", { exact: true }).uncheck();
  await page.getByLabel("Pool Easy encounters", { exact: true }).check();
  await page.getByLabel("Use generated enemy hand", { exact: true }).uncheck();
  await page.getByLabel("Find enemy cards", { exact: true }).fill("Spyro");
  await page
    .getByRole("button", { name: "Add Spyro to enemy hand", exact: true })
    .click();
  await expect(page.locator(".encounter-hand-count")).toHaveText(
    "1 starting cards · 0 tokens",
  );
  await page
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  await expect(page.locator(".encounter-save-message")).toContainText(
    "Encounter saved",
  );
  await page
    .getByRole("button", { name: "Test encounter", exact: true })
    .click();
  await expect(page.locator(".run-hand-heading")).toContainText(
    "1 keeper cards remain",
  );
  await expect(page.locator(".run-battle-heading .eyebrow")).not.toContainText(
    "BOSS",
  );
  await expect(page.locator(".elemental-arena")).toBeVisible();
  await page
    .getByRole("button", { name: "Back to encounter editor", exact: true })
    .click();
  await page.reload();
  await workshop(page);
  await page
    .getByLabel("Edit encounter", { exact: true })
    .selectOption("builtin-vortex");
  await expect(
    page.getByLabel("Pool Easy encounters", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByLabel("Pool Bosses", { exact: true }),
  ).not.toBeChecked();
  await expect(page.locator(".encounter-hand-entry")).toHaveCount(1);
});
