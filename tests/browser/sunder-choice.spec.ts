import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("save and share configurable Sunder strength and choose-when-played targeting", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Wild Sunder");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("sunder");
  await page.getByLabel("Target edge 1").selectOption("any");
  await page.getByLabel("Pips removed 1").fill("3");
  await expect(page.locator(".preview-card .stone-keyword")).toHaveText(
    "Sunder 3ANY EDGE",
  );
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.getByRole("button", { name: "View Wild Sunder" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "choose which edge loses up to 3 pips",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  expect(JSON.parse(buffer.toString()).card.keywords).toEqual([
    { type: "sunder", side: "any", amount: 3 },
  ]);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "wild.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(
    page.getByRole("button", { name: "View Wild Sunder" }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "View Wild Sunder" }).first().click();
  await page.getByRole("button", { name: "Edit stone" }).click();
  await expect(page.getByLabel("Target edge 1")).toHaveValue("any");
  await expect(page.getByLabel("Pips removed 1")).toHaveValue("3");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("sunder");
  await page.getByLabel("Target edge 2").selectOption("any");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Target edge 2")).toHaveValue("any");
  await page.getByRole("button", { name: "Remove keyword 2" }).click();
  await page
    .getByLabel("Keyword 1", { exact: true })
    .selectOption("head-start");
  await expect(page.getByLabel("Affected edge 1")).toHaveValue("0");
  await expect(page.getByLabel("Pips removed 1")).toHaveCount(0);
  await page.getByRole("button", { name: "Save changes" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("skystones-library-v1")!).custom[0]
          .keywords,
    ),
  ).toEqual([{ type: "head-start", side: 0 }]);
});

async function setup(page: Page, multiple = false) {
  await page.addInitScript(
    ({ multiple }) => {
      Math.random = () => 0;
      const make = (
        id: string,
        name: string,
        edges: number[],
        keywords: object[] = [],
      ) => ({
        id: `custom-${id}`,
        name,
        edges,
        keywords,
        element: "earth",
        creature: "golem",
        description: "A test stone.",
        custom: true,
      });
      const custom = [
        make("guard", "Guard", [0, 1, 4, 0]),
        make(
          "breaker",
          "Wild Breaker",
          [0, 0, 0, 0],
          multiple
            ? [
                { type: "sunder", side: "any", amount: 2 },
                { type: "sunder", side: 0, amount: 3 },
              ]
            : [{ type: "sunder", side: "any", amount: 3 }],
        ),
        make("third", "Third", [0, 0, 0, 0]),
        make("fourth", "Fourth", [0, 0, 0, 0]),
        make("fifth", "Fifth", [0, 0, 0, 0]),
      ];
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({
          custom,
          deck: custom.map((stone) => stone.id),
          sound: false,
        }),
      );
    },
    { multiple },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page.getByRole("button", { name: "Find a little magic" }).click();
  for (const [name, coordinate] of [
    ["Guard", "A2"],
    ["Whirlwind", "C3"],
    ["Wild Breaker", "A1"],
  ]) {
    await page
      .getByRole("button", { name: new RegExp(`^Select ${name},`) })
      .click();
    await page
      .getByRole("button", { name: `${coordinate}, empty square`, exact: true })
      .click();
  }
}

test("choose a remote card and edge with zero-edge guards, back, cancel, keyboard, and mobile support", async ({
  page,
}) => {
  await setup(page);
  const dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await expect(dialog).toContainText("any card anywhere on the board");
  await dialog.getByRole("button", { name: /Target A2: Guard/ }).click();
  await expect(dialog).toContainText("Sunder: choose an edge");
  await expect(
    dialog.getByRole("button", { name: "North: 0 → 0", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "West: 0 → 0", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "South: 4 → 1", exact: true }),
  ).toBeEnabled();
  await dialog.getByRole("button", { name: "Choose another card" }).click();
  await dialog.getByRole("button", { name: /Target C3: Whirlwind/ }).click();
  await dialog.getByRole("button", { name: "Cancel play" }).click();
  await expect(page.locator(".board-cell.filled")).toHaveCount(2);
  await expect(page.locator("#board-8 .edge-0 b")).toHaveText("3");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "A1, empty square", exact: true })
    .click();
  await dialog.getByRole("button", { name: /Target C3: Whirlwind/ }).click();
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await expect(
    dialog.getByRole("button", { name: "North: 3 → 0", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#board-8 .edge-0 b")).toHaveText("0");
  await expect(page.locator("#board-8")).toHaveAccessibleName(
    /controlled by Player two/,
  );
  await expect(page.locator("#board-1 .edge-2 b")).toHaveText("4");
  await page.locator("#board-0").click();
  await expect(page.getByRole("dialog")).toContainText(
    "North −3 on C3 · resolved when played",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.locator("#board-8").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Sunder applied: North −3",
  );
});

test("flexible and stronger fixed Sunder resolve separately in a single play", async ({
  page,
}) => {
  await setup(page, true);
  const dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await dialog.getByRole("button", { name: /Target A2: Guard/ }).click();
  await dialog
    .getByRole("button", { name: "South: 4 → 2", exact: true })
    .click();
  await expect(dialog).toContainText("Sunder: choose a card");
  await expect(
    dialog.getByRole("button", { name: /Target C3: Whirlwind/ }),
  ).toContainText("North 3 → 0");
  await dialog.getByRole("button", { name: /Target C3: Whirlwind/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#board-1 .edge-2 b")).toHaveText("2");
  await expect(page.locator("#board-8 .edge-0 b")).toHaveText("0");
  await page.locator("#board-0").click();
  const entries = page.getByRole("dialog").locator(".target-keyword-rule");
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0)).toContainText("South −2 on A2");
  await expect(entries.nth(0)).not.toContainText("North −3 on C3");
  await expect(entries.nth(1)).toContainText("North −3 on C3");
});
