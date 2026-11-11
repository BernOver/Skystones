import { keywordHalf, isSwapForce } from "./swapForce";
import { readTokens } from "./tokens";
import { amplifyText } from "./amplify";
import { trapText, trapKeywordText, trapCombatBonuses } from "./traps";
import type { Trap } from "./traps";
import { SwapDetails } from "./SwapDetails";
import { TribeBadges } from "./TribeEditor";
import { stoneTribes, tribeName } from "./tribes";
import type { Tribe } from "./tribes";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Check,
  Flag,
  Info,
  RotateCcw,
  Waves,
  Shuffle,
  Scissors,
  VolumeX,
  Shield,
  Link,
  Sparkles,
} from "lucide-react";
import { ELEMENT_ICONS, StoneCard } from "./Artwork";
import {
  coordinate,
  ELEMENTS,
  DIZZY_EDGE_CAP,
  dizzySides,
  KEYWORD_RULES,
  SIDE_NAMES,
  keywordGroups,
  shieldEdges,
  trapAdjustedShields,
} from "./game";
import type {
  ActiveKeyword,
  Edges,
  Stone,
  TargetEffect,
  BoardSize,
  BasicKeyword,
  Element,
  Side,
} from "./game";
import {
  ENVIRONMENTS,
  environmentText,
  pipEffectText,
  nextEffectText,
  nextRequirementText,
  keywordNames,
  shiftEffectText,
  environmentAffects,
} from "./effects";
import type { TileEnvironment } from "./effects";
import { conjureText, conjurationSummary, MAX_HAND_CARDS } from "./conjure";
import type { Conjuration } from "./conjure";
import { discardText, discardSummary } from "./discard";
import type { DiscardBuffs, DiscardRecord } from "./discard";

export interface Inspection {
  trap?: Trap;
  stone: Stone;
  sourceId: string;
  anchor: { left: number; right: number; top: number };
  anchorElement: HTMLElement;
  edges: Edges;
  activeKeywords: ActiveKeyword[];
  played: boolean;
  playerName: string;
  preview?: boolean;
  controllerName?: string;
  silenced?: boolean;
  reductions?: Edges;
  effects?: TargetEffect[];
  dizzy?: {
    before: Edges;
    after: Edges;
    sides?: Side[];
    timing?: "before-captures";
  };
  size?: BoardSize;
  shields?: Edges;
  keywordShields?: Edges;
  comboActive?: boolean;
  comboStates?: boolean[];
  comboPrevious?: Element;
  comboPreviousTribes?: Tribe[];
  grantedKeywords?: BasicKeyword[];
  arenaElement?: Element;
  environment?: TileEnvironment;
  inheritedPips?: Edges;
  conjurations?: Conjuration[];
  discards?: DiscardRecord[];
  discardBuffs?: DiscardBuffs;
  playerNames?: string[];
}

export function KeywordDetails({
  stone,
  activeKeywords,
  played = false,
  silenced = false,
  effects,
  conjurations,
  discards,
  playerNames = ["Player one", "Player two"],
  dizzy,
  size = 3,
  comboActive,
  comboStates,
  comboPrevious,
  comboPreviousTribes,
  keywordOffset = 0,
}: {
  stone: Stone;
  activeKeywords?: ActiveKeyword[];
  played?: boolean;
  silenced?: boolean;
  effects?: TargetEffect[];
  conjurations?: Conjuration[];
  discards?: DiscardRecord[];
  playerNames?: string[];
  dizzy?: {
    before: Edges;
    after: Edges;
    sides?: Side[];
    timing?: "before-captures";
  };
  size?: BoardSize;
  comboActive?: boolean;
  comboStates?: boolean[];
  comboPrevious?: Element;
  comboPreviousTribes?: Tribe[];
  keywordOffset?: number;
}) {
  const effectIndexFor = (index: number) =>
    keywordOffset +
    (stone.keywords || [])
      .slice(0, index)
      .reduce(
        (count, keyword, previousIndex) =>
          count +
          (keyword.type === "combo"
            ? (comboStates?.[
                (stone.keywords || [])
                  .slice(0, previousIndex + 1)
                  .filter((k) => k.type === "combo").length - 1
              ] ?? comboActive)
              ? keyword.keywords?.length || 0
              : 0
            : 1),
        0,
      );
  return (
    <div className={`keyword-details ${silenced ? "keywords-disabled" : ""}`}>
      {silenced && (
        <p className="silenced-notice">
          <VolumeX size={14} />
          <span>
            <strong>Silenced</strong> · All keywords are disabled and their pip
            bonuses and Dizzy rolls are removed. Earlier captures and resolved
            effects stay.
          </span>
        </p>
      )}
      {keywordGroups(stone.keywords || [], isSwapForce(stone)).map(
        ({ type, keywords, keywordIndex }, groupIndex) => {
          if (!keywords.length) return null;
          if (type === "shift")
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <ArrowUpRight size={15} />
                  <strong>Shift</strong>
                  <span>After captures</span>
                </div>
                {keywords.map(
                  (keyword, index) =>
                    keyword.type === "shift" && (
                      <p key={index}>
                        After normal captures, only the card next to this card’s{" "}
                        <strong>{SIDE_NAMES[keyword.side]}</strong> side moves
                        one tile{" "}
                        <strong>
                          {["Up", "Right", "Down", "Left"][keyword.direction]}
                        </strong>
                        .{" "}
                        {keyword.affects === "both"
                          ? "Allies and enemies qualify."
                          : keyword.affects === "allies"
                            ? "Allies only."
                            : "Enemies only."}{" "}
                        Eligibility uses ownership before captures, so a
                        captured enemy is still pushed. Movement wraps across
                        the board edge. An occupied destination or this card’s
                        placement tile blocks it. No eligible neighbor means no
                        movement. This never chooses a direction during play or
                        triggers the moved card’s keywords.
                      </p>
                    ),
                )}
                {played &&
                  effects
                    ?.filter(
                      (effect) =>
                        effect.type === "shift" &&
                        effect.keywordIndex === effectIndexFor(keywordIndex),
                    )
                    .map(
                      (effect, index) =>
                        effect.type === "shift" && (
                          <span className="keyword-status" key={index}>
                            {shiftEffectText(effect, size)}
                          </span>
                        ),
                    )}
              </section>
            );
          if (
            type === "trap" ||
            type === "assemble" ||
            type === "flash" ||
            type === "amplify"
          )
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <strong>{KEYWORD_RULES[type].name}</strong>
                {keywords.map((k, i) => (
                  <p key={i}>
                    {k.type === "trap"
                      ? trapKeywordText(k.trap)
                      : k.type === "amplify"
                        ? amplifyText(k)
                        : k.type === "assemble"
                          ? `Generate ${k.count} ${k.mode === "specific" ? `copies of ${readTokens().find((c) => c.id === k.part)?.name || "the specified Part"}` : "random Parts tokens"}. Two Parts in hand immediately combine into a Supercharger with both Parts’ pips and effects plus Flash. Any player can cover it to inherit its pips and other effects, which trigger again. Flash is not inherited.`
                          : "Play this card without ending your turn. A temporary Supercharger must be covered by a stone before the board is complete."}
                  </p>
                ))}
              </section>
            );
          if (
            type === "discard" ||
            type === "scavenge" ||
            type === "parting-gift" ||
            type === "discard-priority"
          )
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <Sparkles size={15} />
                  <strong>{KEYWORD_RULES[type].name}</strong>
                  <span>{KEYWORD_RULES[type].condition}</span>
                </div>
                {keywords.map((keyword, index) =>
                  keyword.type === "discard" ||
                  keyword.type === "scavenge" ||
                  keyword.type === "parting-gift" ||
                  keyword.type === "discard-priority" ? (
                    <div key={index}>
                      <p>{discardText(keyword)}</p>
                      {keyword.type === "parting-gift" &&
                        !!keyword.keywords?.length && (
                          <div className="next-granted-rules">
                            <strong>Keywords given to recipients</strong>
                            <KeywordDetails
                              stone={{ ...stone, keywords: keyword.keywords }}
                              size={size}
                            />
                          </div>
                        )}
                    </div>
                  ) : null,
                )}
                {type === "discard" && (
                  <p>
                    Conjure is resolved first using its actual pool and hand
                    cap. Each player keeps enough cards to fill all remaining
                    squares on their turns. Unsafe discards are skipped and
                    grant no buffs. Chosen cards are selected by the player of
                    this card; canceling leaves the entire play untouched.
                  </p>
                )}
                {type === "discard" &&
                  discards
                    ?.filter(
                      (record) =>
                        record.keywordIndex === effectIndexFor(keywordIndex),
                    )
                    .map((record, index) => (
                      <div key={index} className="keyword-status">
                        <p>{discardSummary([record], playerNames)}</p>
                        {record.buffs.map((buff, i) => (
                          <p key={i}>
                            {buff.source} → {buff.target}
                            {buff.owner === undefined
                              ? ""
                              : ` (${playerNames[buff.owner]} · ${buff.location || "board"})`}
                            :{" "}
                            {buff.pips
                              .flatMap((n, side) =>
                                n
                                  ? [
                                      `${SIDE_NAMES[side]} ${n > 0 ? "+" : ""}${n}`,
                                    ]
                                  : [],
                              )
                              .join(" · ")}
                            {!!buff.keywords?.length &&
                              ` · Gains ${keywordNames(buff.keywords)}`}
                            {buff.shields.some(Boolean)
                              ? ` · Shield ${buff.shields.join("/")} (N/E/S/W)`
                              : ""}
                          </p>
                        ))}
                      </div>
                    ))}
              </section>
            );
          if (type === "conjure")
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <Sparkles size={15} />
                  <strong>Conjure</strong>
                  <span>After this play</span>
                </div>
                {keywords.map(
                  (keyword, index) =>
                    keyword.type === "conjure" && (
                      <div key={index}>
                        <p>{conjureText(keyword)}</p>
                        {!!keyword.keywords?.length && (
                          <div className="next-granted-rules">
                            <strong>
                              Keywords added to each generated card
                            </strong>
                            <KeywordDetails
                              stone={{ ...stone, keywords: keyword.keywords }}
                              size={size}
                            />
                          </div>
                        )}
                      </div>
                    ),
                )}
                <p>
                  Normal cards use the character’s saved default, or its fixed
                  base for this mode. Tokens use their saved token template and
                  can only be generated through Conjure. Copies are playable on
                  later turns and last for this battle. They do not join your
                  Adventure pack. Each hand holds up to {MAX_HAND_CARDS} cards;
                  excess cards are skipped. Random filters must all match. If no
                  cards match, none are added. Configured pip buffs are added
                  once to each copy and remain through Silence. Keyword grants
                  keep existing unique keywords on the same edge and stop at the
                  card’s 24-keyword limit. Silence disables those keywords.
                </p>
                {conjurations
                  ?.filter(
                    (record) =>
                      record.keywordIndex === effectIndexFor(keywordIndex),
                  )
                  .map((record, index) => (
                    <p className="keyword-status" key={index}>
                      {conjurationSummary([record], playerNames)}
                    </p>
                  ))}
                <span className="keyword-status">
                  {played
                    ? "Resolved once when played. Capture and Silence do not remove cards already added."
                    : "Canceled plays add no cards. Repeat Conjure to add different specified cards."}
                </span>
              </section>
            );
          if (type === "next-play")
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <Flag size={15} />
                  <strong>Next Play</strong>
                  <span>After this play</span>
                </div>
                {keywords.map(
                  (keyword, index) =>
                    keyword.type === "next-play" && (
                      <div key={index}>
                        <p>
                          {keyword.recipient === "self"
                            ? `Your next${nextRequirementText(keyword) ? ` ${nextRequirementText(keyword)}` : ""} card`
                            : `The opponent’s next${nextRequirementText(keyword) ? ` ${nextRequirementText(keyword)}` : ""} card`}
                          : <strong>{nextEffectText(keyword)}</strong> once,
                          before Dizzy and captures. Changes stack, cannot
                          reduce pips below zero, and stay on that card after
                          play.{" "}
                          {keyword.tribe || keyword.element
                            ? "All selected requirements must match before any element change; other cards do not spend this queued effect."
                            : ""}
                          {keyword.changeElement
                            ? " Element changes apply before Combo, terrain and captures, persist through capture and Silence, and use the last matching change in cast order."
                            : ""}
                        </p>
                        {!!keyword.keywords?.length && (
                          <div className="next-granted-rules">
                            <strong>Keywords added to the next card</strong>
                            <KeywordDetails
                              stone={{ ...stone, keywords: keyword.keywords }}
                              size={size}
                            />
                          </div>
                        )}
                      </div>
                    ),
                )}
                <span className="keyword-status">
                  {played
                    ? "Queued when this card was played; completed effects survive capture and Silence."
                    : "Does not affect this card. Canceled plays spend no pending effects."}
                </span>
              </section>
            );
          if (type === "environment")
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <Waves size={15} />
                  <strong>Environment</strong>
                  <span>Choose any tile</span>
                </div>
                {keywords.map(
                  (keyword, index) =>
                    keyword.type === "environment" && (
                      <p key={index}>
                        <strong>
                          {ENVIRONMENTS[keyword.environment.kind].name}
                        </strong>{" "}
                        · {environmentText(keyword.environment)}
                      </p>
                    ),
                )}
                <p>
                  Choose any empty or occupied tile, including where you play
                  this card. Applies immediately before captures and lasts for
                  this battle. The newest environment replaces the previous one
                  on that tile. It affects either player and stays on the tile
                  when cards swap positions.
                </p>
                <span className="keyword-status">
                  {effects
                    ?.filter(
                      (effect) =>
                        effect.type === "environment" &&
                        effect.keywordIndex === effectIndexFor(keywordIndex),
                    )
                    .map(
                      (effect) =>
                        `Placed at ${coordinate(effect.target, size)}`,
                    )
                    .join(" · ") ||
                    "Completed terrain casts cannot be removed by Silence or capturing the caster."}
                </span>
              </section>
            );
          if (type === "shield")
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <Shield size={15} />
                  <strong>Shield</strong>
                  <span>Defense only</span>
                </div>
                <p>
                  Each shield pip adds 1 to its edge{" "}
                  <strong>only when defending against a capture</strong>. It
                  never adds attack strength and is not spent when attacked.
                  Ties still defend.
                </p>
                <span className="keyword-status">
                  {keywords
                    .flatMap((keyword) =>
                      keyword.type === "shield"
                        ? [
                            `${SIDE_NAMES[keyword.side]} +${keyword.amount ?? 1} defense`,
                          ]
                        : [],
                    )
                    .join(" · ")}
                  {silenced
                    ? " · removed by Silence"
                    : " · stays through captures"}
                </span>
              </section>
            );
          if (type === "combo") {
            const activeCombo =
              comboStates?.[
                (stone.keywords || [])
                  .slice(0, keywordIndex + 1)
                  .filter((k) => k.type === "combo").length - 1
              ] ?? comboActive;
            const combo = keywords.find((keyword) => keyword.type === "combo");
            if (!combo || combo.type !== "combo") return null;
            return (
              <section
                className="keyword-rule combo-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <Link size={15} />
                  <strong>Combo</strong>
                  <span>
                    {combo.condition === "tribe"
                      ? "Shared tribe"
                      : combo.condition === "either"
                        ? "Element or tribe"
                        : combo.condition === "both"
                          ? "Element and tribe"
                          : "Same element"}
                  </span>
                </div>
                <p>
                  Before placement, check{" "}
                  <strong>the last card you played</strong>.{" "}
                  {!combo.condition || combo.condition === "element"
                    ? "Match its element"
                    : combo.condition === "tribe"
                      ? "Share a tribe with it"
                      : combo.condition === "either"
                        ? "Match its element or share a tribe"
                        : "Match its element and share a tribe"}
                  {combo.tribe
                    ? ` (both cards must belong to ${tribeName(combo.tribe)} for the tribe check)`
                    : ""}{" "}
                  to gain these pips and keywords once, before captures. Your
                  first card cannot activate Combo. Opponent plays and captures
                  do not rewrite your play history.
                </p>
                {!!combo.pips?.length && (
                  <p>
                    <strong>
                      {combo.pips
                        .map(
                          (pip) =>
                            `${SIDE_NAMES[pip.side]} +${pip.amount} pip${pip.amount === 1 ? "" : "s"}`,
                        )
                        .join(" · ")}
                    </strong>
                  </p>
                )}
                <span
                  className={`keyword-status ${activeCombo && !silenced ? "is-active" : ""}`}
                >
                  {silenced
                    ? "Disabled by Silence · Combo pips and granted keywords removed"
                    : activeCombo === undefined
                      ? "Matching your previous card activates these effects."
                      : `${activeCombo ? (played ? "Activated when played · bonuses locked in" : "Will activate if played now") : played ? "Did not activate when played" : "Will not activate if played now"}${comboPrevious ? ` · previous element: ${ELEMENTS[comboPrevious].name}` : " · no previous card"}`}
                </span>
                {combo.condition &&
                  combo.condition !== "element" &&
                  comboPreviousTribes !== undefined && (
                    <p className="combo-tribe-history">
                      Previous card tribes:{" "}
                      {comboPreviousTribes.map(tribeName).join(", ") || "none"}.
                      Shared tribes:{" "}
                      {stoneTribes(stone)
                        .filter(
                          (tribe) =>
                            comboPreviousTribes.includes(tribe) &&
                            (!combo.tribe || combo.tribe === tribe),
                        )
                        .map(tribeName)
                        .join(", ") || "none"}
                      .
                    </p>
                  )}
                {!!combo.keywords?.length && (
                  <div className="combo-granted-rules">
                    <strong>Granted keywords</strong>
                    <KeywordDetails
                      stone={{
                        ...stone,
                        keywords: combo.keywords.map((k) => ({
                          ...k,
                          half: keywordHalf(combo),
                        })),
                      }}
                      played={played && !!activeCombo}
                      keywordOffset={effectIndexFor(keywordIndex)}
                      activeKeywords={activeCombo ? activeKeywords : undefined}
                      silenced={silenced}
                      effects={activeCombo ? effects : undefined}
                      conjurations={activeCombo ? conjurations : undefined}
                      discards={activeCombo ? discards : undefined}
                      playerNames={playerNames}
                      dizzy={dizzy}
                      size={size}
                    />
                  </div>
                )}
                <small>
                  Granted bonuses stay on this card. Targeted grants choose
                  targets when played. Silence removes the bonuses; completed
                  effects and captures stay.
                </small>
              </section>
            );
          }
          if (type === "dizzy")
            return (
              <section
                className="keyword-rule"
                key={groupIndex}
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
              >
                <div className="keyword-rule-heading">
                  <Shuffle size={15} />
                  <strong>Dizzy</strong>
                  <span>Before captures</span>
                </div>
                <p>
                  Before captures, each marked edge independently rolls a new
                  strength from <strong>0 to {DIZZY_EDGE_CAP}</strong>. Other
                  edges stay unchanged. The total can increase or decrease. A{" "}
                  <strong>?</strong> beside an edge marks a pending roll;
                  captures use the rolled strengths. Affected edges:{" "}
                  {keywords
                    .flatMap((keyword) =>
                      keyword.type === "dizzy"
                        ? dizzySides(keyword).map((side) => SIDE_NAMES[side])
                        : [],
                    )
                    .join(", ")}
                  .
                </p>
                <span className="keyword-status">
                  {silenced
                    ? "Disabled by Silence · printed strengths restored, minus damage"
                    : dizzy
                      ? `Rolled once: ${dizzy.before.join("/")} → ${dizzy.after.join("/")} (N/E/S/W)`
                      : "Each selected edge rolls once when played. The result stays through turns and captures."}
                </span>
              </section>
            );
          if (type === "resonance")
            return (
              <ResonanceDetails
                key={groupIndex}
                stone={stone}
                activeKeywords={activeKeywords}
                played={played}
                silenced={silenced}
              />
            );
          if (type === "sunder" || type === "silence") {
            const matchingEffects = (effects || []).filter(
              (effect) =>
                effect.type === type &&
                (effect.keywordIndex === undefined ||
                  effect.keywordIndex === effectIndexFor(keywordIndex)) &&
                (effect.type === "silence" ||
                  keywords.some(
                    (keyword) =>
                      keyword.type === "sunder" &&
                      (keyword.side === "any"
                        ? effect.flexible
                        : !effect.flexible && keyword.side === effect.side),
                  )),
            );
            return (
              <section
                data-half={
                  isSwapForce(stone)
                    ? `${keywordHalf(keywords[0])} half`
                    : undefined
                }
                className="keyword-rule target-keyword-rule"
                key={groupIndex}
              >
                <div className="keyword-rule-heading">
                  {type === "sunder" ? (
                    <Scissors size={15} />
                  ) : (
                    <VolumeX size={15} />
                  )}
                  <strong>{KEYWORD_RULES[type].name}</strong>
                  <span>On play</span>
                </div>
                <p>
                  {type === "sunder" ? (
                    keywords.some(
                      (keyword) =>
                        keyword.type === "sunder" && keyword.side === "any",
                    ) ? (
                      <>
                        Choose <strong>any card anywhere on the board</strong>,
                        from either player, then{" "}
                        <strong>
                          choose which edge loses up to{" "}
                          {keywords[0].type === "sunder"
                            ? (keywords[0].amount ?? 1)
                            : 1}{" "}
                          pip
                          {keywords[0].type === "sunder" &&
                          (keywords[0].amount ?? 1) > 1
                            ? "s"
                            : ""}
                        </strong>
                        . Choose the edge when played; it must have at least one
                        pip. The reduction stays, to a minimum of zero.
                      </>
                    ) : (
                      <>
                        Choose a card already on the board. Its{" "}
                        <strong>
                          {keywords
                            .flatMap((keyword) =>
                              keyword.type === "sunder"
                                ? [
                                    keyword.side === "any"
                                      ? "Chosen"
                                      : SIDE_NAMES[keyword.side],
                                  ]
                                : [],
                            )
                            .join(", ")}{" "}
                          edge{keywords.length > 1 ? "s each lose" : " loses"}{" "}
                          {keywords[0].type === "sunder" &&
                          (keywords[0].amount ?? 1) > 1
                            ? `up to ${keywords[0].amount} pips`
                            : "1 pip"}
                        </strong>
                        , to a minimum of zero. Choose a target for each listed
                        edge.
                      </>
                    )
                  ) : (
                    <>
                      Choose a card already on the board.{" "}
                      <strong>
                        Disable all its keywords and restore printed pips, minus
                        damage
                      </strong>{" "}
                      for the rest of the match. Earlier captures and resolved
                      effects stay.
                    </>
                  )}
                </p>
                {played ? (
                  matchingEffects.length ? (
                    matchingEffects.map((effect, i) => (
                      <span className="keyword-status is-active" key={i}>
                        <Check size={12} />
                        {effect.type === "sunder"
                          ? `${SIDE_NAMES[effect.side]} −${effect.amount ?? 1} on`
                          : "Silenced"}{" "}
                        {coordinate(effect.target, size)} · resolved when played
                      </span>
                    ))
                  ) : (
                    <span className="keyword-status">
                      No valid target when played.
                    </span>
                  )
                ) : (
                  <span className="keyword-status">
                    Choose either player’s card when played, before captures. No
                    valid target means this effect is skipped.
                  </span>
                )}
              </section>
            );
          }
          const rule = KEYWORD_RULES[type];
          const active = activeKeywords?.some(
            (keyword) => keyword.type === type,
          );
          const Icon = type === "head-start" ? Flag : RotateCcw;
          const sides = keywords
            .flatMap((keyword) =>
              keyword.type === "head-start" || keyword.type === "comeback"
                ? [SIDE_NAMES[keyword.side]]
                : [],
            )
            .join(", ");
          return (
            <section
              data-half={
                isSwapForce(stone)
                  ? `${keywordHalf(keywords[0])} half`
                  : undefined
              }
              className={`keyword-rule ${active ? "keyword-active" : ""}`}
              key={groupIndex}
            >
              <div className="keyword-rule-heading">
                <Icon size={15} />
                <strong>{rule.name}</strong>
                <span>{sides}</span>
              </div>
              <p>
                If its player is{" "}
                <strong>{rule.condition} before placement</strong>, gain{" "}
                <strong>
                  {keywords
                    .flatMap((keyword) =>
                      keyword.type === "head-start" ||
                      keyword.type === "comeback"
                        ? [
                            `${SIDE_NAMES[keyword.side]} +${keyword.amount ?? 1} pip${(keyword.amount ?? 1) === 1 ? "" : "s"}`,
                          ]
                        : [],
                    )
                    .join(" · ")}
                </strong>{" "}
                for the rest of the match.
              </p>
              {activeKeywords !== undefined && (
                <span className={`keyword-status ${active ? "is-active" : ""}`}>
                  {active ? <Check size={12} /> : <Info size={12} />}
                  {silenced
                    ? "Disabled by Silence"
                    : played
                      ? active
                        ? "Activated when played · bonus locked in"
                        : "Did not activate when played"
                      : active
                        ? "Will activate if played now"
                        : "Will not activate with the current score"}
                </span>
              )}
            </section>
          );
        },
      )}
      {!stone.keywords?.length && (
        <p className="no-keywords">
          {stone.spell
            ? "This spell has no effects."
            : "No keywords. This stone uses its printed edge strengths."}
        </p>
      )}
      {!!stone.keywords?.length && (
        <p className="keyword-timing">
          <Info size={12} />
          Dizzy rolls marked edges before captures. Other keywords check before
          placement. Ties block Head Start and Comeback only. Bonuses remain
          through captures and score changes unless removed by Silence. Targeted
          effects resolve in listed order before captures; Shift moves eligible
          neighbors afterward.
        </p>
      )}
    </div>
  );
}

function ResonanceDetails({
  stone,
  activeKeywords,
  played,
  silenced,
}: {
  stone: Stone;
  activeKeywords?: ActiveKeyword[];
  played: boolean;
  silenced: boolean;
}) {
  const keywords = (stone.keywords || []).filter(
    (keyword) => keyword.type === "resonance",
  );
  const anyActive = activeKeywords?.some(
    (keyword) => keyword.type === "resonance" && keyword.bonus > 0,
  );
  return (
    <section
      className={`keyword-rule resonance-rule ${anyActive ? "keyword-active" : ""}`}
    >
      <div className="keyword-rule-heading">
        <Waves size={15} />
        <strong>Resonance</strong>
        <span>
          {keywords.some((keyword) => keyword.tribe)
            ? "Element / tribe count"
            : "Element count"}
        </span>
      </div>
      <p>
        Each listed edge gains{" "}
        <strong>+1 pip per card of its chosen element or tribe</strong> already
        on the board. Count both players’ cards{" "}
        <strong>before placement</strong>; this card does not count.
      </p>
      <div className="resonance-rule-list">
        {keywords.map((keyword) => {
          const active = activeKeywords?.find(
            (candidate) =>
              candidate.type === "resonance" &&
              candidate.side === keyword.side &&
              candidate.element === keyword.element &&
              candidate.tribe === keyword.tribe,
          );
          const bonus = active?.type === "resonance" ? active.bonus : 0;
          const Icon = keyword.tribe ? Flag : ELEMENT_ICONS[keyword.element];
          return (
            <div className="resonance-rule-row" key={keyword.side}>
              <Icon
                size={14}
                style={{ color: ELEMENTS[keyword.element].color }}
              />
              <div>
                <strong>
                  {keyword.tribe
                    ? tribeName(keyword.tribe)
                    : ELEMENTS[keyword.element].name}
                </strong>
                <span>{SIDE_NAMES[keyword.side]} edge</span>
              </div>
              <div
                className={`resonance-amount ${bonus > 0 ? "is-active" : ""}`}
              >
                {activeKeywords === undefined ? (
                  <b>+1 per card</b>
                ) : (
                  <>
                    <b>+{bonus}</b>
                    <small>
                      {silenced
                        ? "removed by Silence"
                        : played
                          ? `${bonus} matching · locked in`
                          : `${bonus} matching · if played now`}
                    </small>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <span className="keyword-status">
        <Info size={12} />
        {silenced
          ? "The Resonance bonus was removed by Silence."
          : played
            ? "The count is locked. Later cards and captures do not change it."
            : "No matching cards means +0. The count is locked when played."}
      </span>
    </section>
  );
}

export function InspectionDetails({ inspection }: { inspection: Inspection }) {
  const {
    stone,
    edges,
    played,
    playerName,
    controllerName,
    activeKeywords,
    silenced,
    reductions,
    effects,
    dizzy,
  } = inspection;
  const { defense: defenseBonus, attack: attackBonus } = trapCombatBonuses(
    stone,
    trapAdjustedShields(
      stone,
      inspection.shields || shieldEdges(stone),
      inspection.trap,
      !!silenced,
      inspection.keywordShields,
    ),
    inspection.trap,
    inspection.environment,
  );
  return (
    <>
      <div className="inspection-context">
        {inspection.preview
          ? "Draft table"
          : played
            ? `Played by ${playerName}`
            : playerName === "You"
              ? "Your hand"
              : `${playerName}’s hand`}
        {played && controllerName !== playerName && (
          <span> · Controlled by {controllerName}</span>
        )}
      </div>
      {stone.spell && (
        <p className="inspection-note">
          {stone.spell === "discard"
            ? "Discard-only spell · cannot be played. Its effects trigger when discarded. Board targets and further discards resolve automatically for its owner."
            : "Spell · cast from your hand without occupying a tile or ending your turn. Casting consumes this card; it does not count as discarding it."}{" "}
          Spells enter hands through Conjure.
        </p>
      )}
      <TribeBadges stone={stone} />
      <SwapDetails stone={stone} edges={edges} />
      {stone.unique && (
        <p className="inspection-note">
          Unique · playable in decks; excluded from normal Conjure. Use an
          explicit Unique source to generate it.
        </p>
      )}
      {stone.part && (
        <p className="inspection-note">
          Part · pairs automatically assemble in hand. Cannot be played alone.
        </p>
      )}
      {stone.supercharger && (
        <p className="inspection-note">
          Supercharger · {stone.supercharger.parts.join(" + ")}. Cover to
          inherit its pips and effects, except Flash.
        </p>
      )}
      {inspection.trap && (
        <p className="inspection-note">
          Active Trap · {inspection.trap.name}: {trapText(inspection.trap)}
        </p>
      )}
      {stone.token && !stone.spell && (
        <p className="conjured-notice">
          Token · available through Conjure or a custom enemy’s starting hand.
        </p>
      )}
      {stone.conjured && (
        <p className="conjured-notice">
          Conjured card · lasts for this battle only.
        </p>
      )}
      {stone.encounterStart && (
        <p className="conjured-notice">
          Encounter starting card · this battle only.
        </p>
      )}
      <div className="inspection-stats">
        {SIDE_NAMES.map((side, index) => (
          <div
            key={side}
            className={
              edges[index] > stone.edges[index]
                ? "stat-boosted"
                : edges[index] < stone.edges[index]
                  ? "stat-reduced"
                  : ""
            }
          >
            <small>{side}</small>
            <strong>{edges[index]}</strong>
            {!!defenseBonus[index] && (
              <span className="defense-stat">
                Defense {defenseBonus[index] > 0 ? "+" : ""}
                {defenseBonus[index]} · defends{" "}
                {Math.max(0, edges[index] + defenseBonus[index])}
              </span>
            )}
            {!!attackBonus[index] && (
              <span className="attack-stat">
                Attack {attackBonus[index] > 0 ? "+" : ""}
                {attackBonus[index]} · attacks{" "}
                {Math.max(0, edges[index] + attackBonus[index])}
              </span>
            )}
            {edges[index] !== stone.edges[index] && (
              <span>
                {stone.edges[index]}{" "}
                {edges[index] > stone.edges[index] ? "+" : "−"}{" "}
                {Math.abs(edges[index] - stone.edges[index])}
              </span>
            )}
          </div>
        ))}
      </div>
      {inspection.environment && (
        <p className="terrain-inspection-note">
          <strong>{ENVIRONMENTS[inspection.environment.kind].name}</strong> ·{" "}
          {environmentText(inspection.environment)}{" "}
          {!environmentAffects(inspection.environment, stone)
            ? "This card does not match the tribe condition, so it is unaffected."
            : ""}{" "}
          Terrain stays on the tile and is separate from this card’s keywords.
        </p>
      )}
      {[
        { name: "Hand gift bonuses", buff: stone.discardBuffs },
        { name: "Board discard bonuses", buff: inspection.discardBuffs },
      ].map(
        ({ name, buff }) =>
          buff && (
            <p key={name} className="next-play-inspection-note">
              <strong>{name}</strong> ·{" "}
              {buff.pips
                .flatMap((n, side) =>
                  n ? [`${SIDE_NAMES[side]} ${n > 0 ? "+" : ""}${n}`] : [],
                )
                .join(" · ")}
              {buff.shields.some(Boolean)
                ? ` · Shield ${buff.shields.join("/")} (N/E/S/W)`
                : ""}
              .
              {silenced
                ? " Disabled by Silence."
                : " Included in this card’s strengths. These bonuses last for this battle and are disabled by Silence on the board."}
            </p>
          ),
      )}
      {inspection.inheritedPips?.some(Boolean) && (
        <p className="next-play-inspection-note">
          <strong>Next Play {played ? "received" : "pending"}</strong> ·{" "}
          {inspection.inheritedPips
            .flatMap((amount, side) =>
              amount ? [pipEffectText({ amount, side: side as Side })] : [],
            )
            .join(" · ")}
          .{" "}
          {played
            ? "Included in this card’s pips; capture and Silence do not spend it again."
            : "Included in the preview. Spent only when you place this card."}
        </p>
      )}
      {stone.receivedElement && (
        <p className="next-play-inspection-note">
          <strong>Next Play element {played ? "received" : "preview"}</strong> ·{" "}
          {ELEMENTS[stone.receivedElement.before].name} →{" "}
          {ELEMENTS[stone.receivedElement.after].name}.
          {played
            ? " Changed before Combo and captures; capture and Silence do not reverse it."
            : " Applied if you play this card next. The queued effect is still unspent."}
        </p>
      )}
      {!!stone.receivedKeywords?.length && (
        <p className="next-play-inspection-note">
          {played ? "Next Play keywords received" : "Next Play keyword preview"}
          : {keywordNames(stone.receivedKeywords)}.
          {played
            ? " These were added before this card’s on-play checks. "
            : " These are added if you play this card next; the queue is still unspent. "}
          {silenced
            ? "Silence has disabled them; completed effects stay."
            : played
              ? "They stay on this card through captures."
              : "Conditions are checked when you place the card."}
        </p>
      )}
      {inspection.arenaElement && inspection.arenaElement === stone.element && (
        <p className="arena-bonus-notice">
          <strong>
            {ELEMENTS[inspection.arenaElement].name} arena · +1 on every edge
          </strong>
          . Temporary attack and defense bonus for both players. It expires when
          the element changes and cannot be removed by Sunder or Silence.
        </p>
      )}
      {stone.baseEdges && (
        <p className="adventure-base-reference">
          <strong>
            {stone.defaultRevision
              ? "Saved character default"
              : "Fixed Adventure base"}
          </strong>{" "}
          · {stone.baseEdges.join("/")} (N/E/S/W)
          {stone.baseKeywords?.length
            ? ` · ${[...new Set(stone.baseKeywords.map((keyword) => KEYWORD_RULES[keyword.type].name))].join(", ")}`
            : " · No base keywords"}
          .
          {JSON.stringify(stone.edges) !== JSON.stringify(stone.baseEdges) ||
          JSON.stringify(stone.keywords || []) !==
            JSON.stringify(stone.baseKeywords || [])
            ? " This copy has upgrades or effects from this run."
            : " The same character starts with these stats in every run."}
        </p>
      )}
      {reductions?.some(Boolean) && (
        <p className="sunder-notice">
          Sunder applied:{" "}
          {reductions
            .flatMap((amount, side) =>
              amount
                ? [
                    `${SIDE_NAMES[inspection.environment?.kind === "crosswind" && environmentAffects(inspection.environment, stone) ? (side + 1) % 4 : side]} −${amount}`,
                  ]
                : [],
            )
            .join(", ")}
          . Reductions persist through capture and Silence; edges cannot fall
          below zero.
        </p>
      )}
      <KeywordDetails
        stone={stone}
        activeKeywords={inspection.preview ? undefined : activeKeywords}
        played={played}
        silenced={silenced}
        effects={effects}
        conjurations={inspection.conjurations}
        discards={inspection.discards}
        playerNames={inspection.playerNames}
        dizzy={dizzy}
        size={inspection.size}
        comboActive={inspection.comboActive}
        comboStates={inspection.comboStates}
        comboPrevious={inspection.comboPrevious}
        comboPreviousTribes={inspection.comboPreviousTribes}
      />
      {stone.description && (
        <div className="inspection-story">
          <span>BACKSTORY</span>
          <p>{stone.description}</p>
          <small>Flavor text — no gameplay effect.</small>
        </div>
      )}
      <p className="inspection-capture-note">
        <ArrowUpRight size={13} />A higher facing edge captures an adjacent
        rival. Equal pips do not capture.
      </p>
    </>
  );
}

export function CardInspector({ inspection }: { inspection: Inspection }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  useLayoutEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const width = ref.current.offsetWidth;
      const height = ref.current.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const anchor = inspection.anchorElement.isConnected
        ? inspection.anchorElement.getBoundingClientRect()
        : inspection.anchor;
      const preferredLeft =
        anchor.right + 16 + width <= viewportWidth - 12
          ? anchor.right + 16
          : anchor.left - width - 16;
      setPosition({
        left: Math.max(12, Math.min(preferredLeft, viewportWidth - width - 12)),
        top: Math.max(12, Math.min(anchor.top, viewportHeight - height - 12)),
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [inspection]);
  return createPortal(
    <div
      ref={ref}
      id="card-inspector"
      role="tooltip"
      className="card-inspector"
      style={{
        left: position?.left || 0,
        top: position?.top || 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      <div className="inspector-card">
        <StoneCard
          stone={inspection.stone}
          played={inspection.played}
          grantedKeywords={inspection.grantedKeywords}
          edges={inspection.edges}
          silenced={inspection.silenced}
          shields={inspection.shields}
          keywordShields={inspection.keywordShields}
          trap={inspection.trap}
          environment={inspection.environment}
        />
      </div>
      <h2>{inspection.stone.name}</h2>
      <InspectionDetails inspection={inspection} />
    </div>,
    document.body,
  );
}
