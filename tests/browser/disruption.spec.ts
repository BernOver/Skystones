import { expect, test } from "@playwright/test";

test("make, save, export, import, and edit Sunder and Silence cards", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Quiet Cutter");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("sunder");
  await page.getByLabel("Target edge 1").selectOption("3");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("silence");
  await expect(page.getByLabel("Affected edge 2")).toHaveCount(0);
  await expect(page.locator(".preview-card .stone-keyword")).toHaveText([
    "SunderW",
    "SilenceON PLAY",
  ]);
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
  await page.getByRole("button", { name: "View Quiet Cutter" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(
    "Disable all its keywords and remove their pip bonuses",
  );
  await expect(dialog).toContainText("West edge loses 1 pip");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  expect(JSON.parse(buffer.toString()).card.keywords).toEqual([
    { type: "sunder", side: 3 },
    { type: "silence" },
  ]);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "quiet.skystone.json",
      mimeType: "application/json",
      buffer,
    });
  await expect(
    page.getByRole("button", { name: "View Quiet Cutter" }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "View Quiet Cutter" }).first().click();
  await page.getByRole("button", { name: "Edit stone" }).click();
  await expect(page.getByLabel("Target edge 1")).toHaveValue("3");
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("silence");
  await expect(page.getByRole("alert")).toHaveText(
    "Silence is already on this card.",
  );
  await expect(page.getByLabel("Keyword 1", { exact: true })).toHaveValue(
    "sunder",
  );
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("resonance");
  await page.getByLabel("Counted element 2").selectOption("water");
  await page.getByRole("button", { name: "Save changes" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("skystones-library-v1")!).custom[0]
          .keywords,
    ),
  ).toEqual([
    { type: "sunder", side: 3 },
    { type: "resonance", side: 0, element: "water" },
  ]);
});

async function setup(page: import("@playwright/test").Page, multiple = false) {
  await page.addInitScript(
    ({ multiple }) => {
      Math.random = () => 0;
      const make = (
        id: string,
        name: string,
        edges = [0, 0, 0, 0],
        keywords: object[] = [],
      ) => ({
        id: `custom-${id}`,
        name,
        edges,
        keywords,
        element: "fire",
        creature: "fox",
        description: "A test stone.",
        custom: true,
      });
      const custom = [
        make(
          "beacon",
          "Beacon",
          [2, 2, 2, 2],
          [{ type: "silence" }, { type: "sunder", side: 0 }],
        ),
        make(
          "champion",
          "Champion",
          [2, 2, 2, 2],
          [{ type: "resonance", side: 3, element: "fire" }],
        ),
        make(
          "breaker",
          "Breaker",
          [0, 0, 0, 0],
          multiple
            ? [
                { type: "sunder", side: 0 },
                { type: "silence" },
                { type: "sunder", side: 3 },
              ]
            : [{ type: "sunder", side: 0 }],
        ),
        make("muter", "Muter", [0, 3, 0, 0], [{ type: "silence" }]),
        make("closer", "Closer"),
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
}

async function play(
  page: import("@playwright/test").Page,
  name: string,
  coordinate: string,
) {
  await page
    .getByRole("button", { name: new RegExp(`^Select ${name},`) })
    .click();
  await page
    .getByRole("button", { name: `${coordinate}, empty square`, exact: true })
    .click();
}

async function prepareBoard(page: import("@playwright/test").Page) {
  for (const [name, coordinate] of [
    ["Beacon", "A2"],
    ["Cloudpaws", "C3"],
    ["Champion", "B2"],
    ["Glowcap", "C2"],
  ])
    await play(page, name, coordinate);
}

test("target selection supports canceling, Sunder reaches zero, and Silence enables captures and stays after capture", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await setup(page);
  await prepareBoard(page);
  await expect(page.locator("#board-4 .edge-3 b")).toHaveText("3");
  await play(page, "Breaker", "A1");
  let dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await expect(dialog).toContainText("Sunder: choose a card");
  await expect(
    dialog.getByRole("button", { name: "A1, placing here", exact: true }),
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: /Target C2: Glowcap/ }),
  ).toContainText("North 1 → 0");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Cancel play" }).click();
  await expect(page.locator(".board-cell.filled")).toHaveCount(4);
  await expect(page.locator("#board-7 .edge-0 b")).toHaveText("1");
  await expect(
    page.getByRole("button", { name: /^Select Breaker,/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "A1, empty square", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await dialog.getByRole("button", { name: /Target C2: Glowcap/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#board-7 .edge-0 b")).toHaveText("0");
  await page.locator("#board-7").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Sunder applied: North −1",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await play(page, "Moonwatch", "C1");
  await play(page, "Muter", "B1");
  dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await expect(dialog).toContainText("Silence: choose a card");
  await expect(
    dialog.getByRole("button", { name: /Target C1: Moonwatch/ }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: /Target B2: Champion/ }).click();
  await expect(page.locator("#board-4")).toHaveAccessibleName(
    /controlled by Player one/,
  );
  await expect(page.locator("#board-4 .silenced-label")).toHaveText("Silenced");
  await expect(page.locator("#board-4 .edge-3 b")).toHaveText("2");
  await expect(page.locator("#board-7 .edge-0 b")).toHaveText("0");
  await play(page, "Cinder", "B3");
  await expect(page.locator("#board-4")).toHaveAccessibleName(
    /controlled by Player two/,
  );
  await expect(page.locator("#board-4 .silenced-label")).toHaveText("Silenced");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator("#board-4").hover();
  await expect(
    page.getByRole("tooltip").locator(".silenced-notice"),
  ).toContainText("All keywords are disabled");
  await expect(page.getByRole("tooltip")).toContainText("removed by Silence");
  await page.locator("#board-3").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Silenced B2 · resolved when played",
  );
  expect(errors).toEqual([]);
});

test("multiple on-play effects resolve in listed order with preview changes and full rollback on cancel", async ({
  page,
}) => {
  await setup(page, true);
  await prepareBoard(page);
  await play(page, "Breaker", "A1");
  let dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await dialog.getByRole("button", { name: /Target C2: Glowcap/ }).click();
  await expect(dialog).toContainText("Silence: choose a card");
  await expect(
    dialog
      .getByRole("button", { name: /Target C2: Glowcap/ })
      .locator(".edge-0 b"),
  ).toHaveText("0");
  await page.keyboard.press("Escape");
  await expect(page.locator(".board-cell.filled")).toHaveCount(4);
  await expect(page.locator("#board-7 .edge-0 b")).toHaveText("1");
  await page
    .getByRole("button", { name: "A1, empty square", exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await dialog.getByRole("button", { name: /Target C2: Glowcap/ }).click();
  await dialog.getByRole("button", { name: /Target B2: Champion/ }).click();
  await expect(dialog).toContainText("Sunder: choose a card");
  await expect(
    dialog
      .getByRole("button", { name: /Target B2: Champion/ })
      .locator(".edge-3 b"),
  ).toHaveText("2");
  await dialog.getByRole("button", { name: /Target B2: Champion/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#board-4 .edge-3 b")).toHaveText("1");
  await expect(page.locator("#board-7 .edge-0 b")).toHaveText("0");
  await page.locator("#board-0").click();
  await expect(
    page
      .getByRole("dialog")
      .locator(".target-keyword-rule .keyword-rule-heading strong"),
  ).toHaveText(["Sunder", "Silence", "Sunder"]);
  await expect(page.getByRole("dialog")).toContainText("West −1 on B2");
});
