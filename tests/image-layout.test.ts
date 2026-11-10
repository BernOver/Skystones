import { test } from "node:test";
import assert from "node:assert/strict";
import { validImageTransform, trapImageLayout } from "../src/imageLayout.ts";
import type { ImageTransform } from "../src/imageLayout.ts";
import {
  STARTER_STONES,
  validateStone,
  validateKeywords,
  placedKeywords,
} from "../src/game.ts";
import { DEFAULT_TRAPS, validTrap } from "../src/traps.ts";
import { CHARACTER_STONES } from "../src/characters.ts";
import { swapCards, validSwapParts } from "../src/swapForce.ts";
import { hasTribe } from "../src/tribes.ts";
import {
  characterDefault,
  editedCharacterDefault,
  parseCharacterDefaults,
} from "../src/cardDefaults.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
import type { StoneKeyword } from "../src/game.ts";
const layout: ImageTransform = { scale: 1.75, x: 20, y: -30, fit: "contain" };
const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDrsAAAAASUVORK5CYII=";
const stone = {
  ...STARTER_STONES[0],
  id: "custom-crop-test",
  imageTransform: layout,
};
test("image layout validation preserves legacy cards and Traps and rejects unsafe imported transforms", () => {
  assert.ok(validateStone({ ...stone, imageTransform: undefined }));
  assert.ok(validateStone(stone));
  assert.ok(validTrap({ ...DEFAULT_TRAPS[0], imageTransform: layout, image }));
  for (const scale of [0.25, 1, 3])
    assert.ok(validImageTransform({ scale, x: -100, y: 100 }));
  for (const bad of [
    null,
    [],
    { ...layout, scale: 0 },
    { ...layout, scale: 3.1 },
    { ...layout, x: 101 },
    { ...layout, y: -101 },
    { ...layout, x: NaN },
    { ...layout, y: Infinity },
    { ...layout, scale: "1" },
    { ...layout, fit: "fill" },
  ]) {
    assert.equal(validImageTransform(bad), false);
    if (bad !== null) {
      assert.equal(validateStone({ ...stone, imageTransform: bad }), false);
      assert.equal(
        validTrap({ ...DEFAULT_TRAPS[0], imageTransform: bad }),
        false,
      );
    }
  }
});
test("Trap resizing changes only the picture box, with centered zoom and independent position and fit", () => {
  assert.deepEqual(trapImageLayout(), {
    x: 25,
    y: 28,
    width: 50,
    height: 50,
    preserveAspectRatio: "xMidYMid slice",
  });
  assert.deepEqual(
    trapImageLayout({ scale: 0.5, x: 30, y: -20, fit: "contain" }),
    {
      x: 52.5,
      y: 30.5,
      width: 25,
      height: 25,
      preserveAspectRatio: "xMidYMid meet",
    },
  );
});
test("edited character defaults and portable card definitions retain artwork layout without changing pips", () => {
  const original = CHARACTER_STONES.find((c) => c.portrait === "spyro")!;
  const next = editedCharacterDefault(
    "spyro",
    { ...original, imageTransform: layout },
    {},
  );
  assert.deepEqual(
    parseCharacterDefaults(JSON.parse(JSON.stringify(next))).spyro.card
      .imageTransform,
    layout,
  );
  const generated = characterDefault(original, next);
  assert.deepEqual(generated.imageTransform, layout);
  assert.deepEqual(generated.edges, original.edges);
  const imported = JSON.parse(
    JSON.stringify({
      ...stone,
      keywords: [
        {
          type: "trap",
          trap: { ...DEFAULT_TRAPS[0], image, imageTransform: layout },
        },
      ],
    }),
  );
  assert.ok(validateStone(imported));
  assert.deepEqual(imported.keywords[0].trap.imageTransform, layout);
});
test("SWAP Force keeps each source portrait's layout on its own half without applying the top layout twice", () => {
  const candidates = CHARACTER_STONES.filter((s) => hasTribe(s, "swap-force"));
  const first = {
    ...candidates[0],
    id: "custom-layout-top",
    imageTransform: layout,
  };
  const bottomLayout = { scale: 0.6, x: -10, y: 40, fit: "cover" as const };
  const second = {
    ...candidates[1],
    id: "custom-layout-bottom",
    imageTransform: bottomLayout,
  };
  const [mixed] = swapCards(first, second);
  assert.equal(mixed.imageTransform, undefined);
  assert.deepEqual(mixed.swapParts!.top.imageTransform, layout);
  assert.deepEqual(mixed.swapParts!.bottom.imageTransform, bottomLayout);
  assert.ok(validateStone(mixed));
  const broken = structuredClone(mixed.swapParts)!;
  broken.bottom.imageTransform!.scale = 10;
  assert.equal(validSwapParts(broken), false);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure retains stone and Trap picture layouts through placement and restoration`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const source = {
      ...run.battle!.hands[0][0],
      image,
      imageTransform: layout,
      keywords: [
        {
          type: "trap",
          trap: {
            ...DEFAULT_TRAPS[0],
            image,
            imageTransform: { scale: 0.5, x: 30, y: -20, fit: "contain" },
          },
        },
      ] as StoneKeyword[],
    };
    run = {
      ...run,
      inventory: run.inventory.map((s) =>
        s.id === source.id ? { ...s, image, imageTransform: layout } : s,
      ),
      battle: {
        ...run.battle!,
        hands: [
          [source, ...run.battle!.hands[0].slice(1)],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, 0, 0);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(restored.battle!.board[0]!.stone.imageTransform, layout);
    assert.deepEqual(restored.battle!.traps!.active!.trap.imageTransform, {
      scale: 0.5,
      x: 30,
      y: -20,
      fit: "contain",
    });
    assert.ok(validateKeywords(placedKeywords(restored.battle!.board[0]!)));
  });
