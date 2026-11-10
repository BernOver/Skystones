import {
  boardTrap,
  trapKeywordMultiplier,
  trapNullifies,
  isTrapPipEffect,
  validTrap,
} from "./traps.ts";
import type { Trap } from "./traps.ts";
import { hasTribe } from "./tribes.ts";
import type {
  BasicKeyword,
  Board,
  KeywordType,
  Owner,
  Stone,
  StoneKeyword,
  ComboKeyword,
  Edges,
} from "./game.ts";
import { playHistory, score, validateKeywords, KEYWORD_RULES } from "./game.ts";
export type AmplifyKeyword = {
  type: "amplify";
  effect: Exclude<KeywordType, "amplify"> | "all";
} & (
  | { duration: "always"; count?: never }
  | { duration: "next"; count: number }
);
export interface AmplifyQueue {
  id: string;
  owner: Owner;
  effect: AmplifyKeyword["effect"];
  count: number;
}
export interface AmplifySpent {
  id: string;
  count: number;
}
export function amplifyText(k: AmplifyKeyword) {
  return `Double ${k.effect === "all" ? "all effects" : k.effect.replaceAll("-", " ")} ${k.duration === "always" ? "on this card whenever they trigger" : `on your next ${k.count} matching effect${k.count === 1 ? "" : "s"} after this play`}. Each queued use is consumed by one matching keyword; unrelated effects leave it ready. Base pips and turn length do not double.`;
}
export function pendingAmplify(board: Board, owner: Owner): AmplifyQueue[] {
  const history = playHistory(board),
    spent = new Map<string, number>();
  for (const c of history)
    for (const s of c.amplifySpent || [])
      spent.set(s.id, (spent.get(s.id) || 0) + s.count);
  return history
    .flatMap((c) =>
      (c.queuedAmplify || [])
        .filter((q) => q.owner === owner)
        .map((q) => ({ ...q, count: q.count - (spent.get(q.id) || 0) })),
    )
    .filter((q) => q.count > 0);
}
export function scaleEffect<T extends BasicKeyword>(k: T, times: number): T[] {
  if (times <= 0) return [];
  if (times === 1) return [k];
  const out = structuredClone(k);
  switch (out.type) {
    case "amplify":
      return [out];
    case "flash":
      return [out];
    case "discard-priority":
      out.priority = Math.min(99, (out.priority ?? 1) * times);
      break;
    case "head-start":
    case "comeback":
    case "shield":
    case "sunder":
      out.amount = Math.min(99, (out.amount ?? 1) * times);
      break;
    case "resonance":
      return [{ ...out, multiplier: times } as T];
    case "assemble":
    case "conjure":
    case "discard":
      out.count = Math.min(160, out.count * times);
      break;
    case "next-play":
      out.amount = Math.max(-99, Math.min(99, out.amount * times));
      out.keywords = out.keywords?.flatMap<StoneKeyword>((g) =>
        g.type === "combo"
          ? [
              {
                ...structuredClone(g),
                pips: g.pips?.map((p) => ({
                  ...p,
                  amount: Math.min(99, p.amount * times),
                })),
                keywords: g.keywords?.flatMap((grant) =>
                  scaleEffect(grant, times),
                ),
              } as ComboKeyword,
            ]
          : scaleEffect(g, times),
      );
      break;
    case "scavenge":
    case "parting-gift":
      for (const kind of ["pips", "shields"] as const)
        out[kind] = out[kind]?.map((p) => ({
          ...p,
          amount: Math.min(99, p.amount * times),
        }));
      break;
    case "trap":
      out.trap.effects = out.trap.effects.map((e) =>
        isTrapPipEffect(e)
          ? {
              ...e,
              amount: Math.max(-99, Math.min(99, e.amount * times)),
            }
          : e,
      );
      break;
    case "environment":
      if ("amount" in out.environment)
        out.environment.amount = Math.min(99, out.environment.amount * times);
      else return Array.from({ length: times }, () => structuredClone(k));
      break;
    default:
      return Array.from({ length: Math.min(32, times) }, () =>
        structuredClone(k),
      );
  }
  return [out];
}
export function amplifyPlan(
  stone: Stone,
  groups: { keyword: StoneKeyword; active: boolean }[],
  board: Board,
  owner?: Owner,
) {
  const candidates = groups.flatMap((g) =>
    g.keyword.type === "combo"
      ? g.active
        ? g.keyword.keywords || []
        : []
      : [g.keyword],
  );
  const trap =
    candidates.filter((k) => k.type === "trap").at(-1)?.trap ||
    boardTrap(board);
  const all = groups.flatMap((g) =>
    g.keyword.type === "combo"
      ? g.active
        ? (g.keyword.keywords || []).filter(
            (k) => k.type === "trap" || !trapNullifies(trap, stone, "combo"),
          )
        : []
      : [g.keyword],
  );
  // Reactive keywords read the field when they actually trigger, rather than locking it at placement.
  const reactive = new Set<KeywordType>([
    "shield",
    "scavenge",
    "parting-gift",
    "discard-priority",
  ]);
  let fieldAmplified = false;
  const fieldMultiplier = (type: KeywordType, includeAll: boolean) => {
    const times = reactive.has(type)
      ? 1
      : trapKeywordMultiplier(trap, stone, type, includeAll);
    if (times > 1) fieldAmplified = true;
    return times;
  };
  const local = all.filter(
    (k) =>
      k.type === "amplify" &&
      k.duration === "always" &&
      !trapNullifies(trap, stone, "amplify"),
  );
  const queue =
      owner === undefined || trapNullifies(trap, stone, "amplify")
        ? []
        : pendingAmplify(board, owner),
    spent: AmplifySpent[] = [];
  const localMultiplier = (type: KeywordType, includeAll = true) =>
    Math.min(
      32,
      fieldMultiplier(type, includeAll) *
        local.reduce(
          (n, k) =>
            n *
            (k.type === "amplify" &&
            (k.effect === type || (includeAll && k.effect === "all"))
              ? 2
              : 1),
          1,
        ),
    );
  const queuedMultiplier = (
    type: KeywordType,
    eligible = true,
    includeAll = true,
  ) => {
    let times = 1;
    if (eligible)
      for (const q of queue)
        if (
          q.count > 0 &&
          (q.effect === type || (includeAll && q.effect === "all"))
        ) {
          times *= 2;
          q.count--;
          const record = spent.find((s) => s.id === q.id);
          if (record) record.count++;
          else spent.push({ id: q.id, count: 1 });
        }
    return Math.min(32, times);
  };
  const scores = score(board),
    comboPips: Edges = [0, 0, 0, 0],
    resolved: BasicKeyword[] = [];
  const resolve = (k: BasicKeyword, extra = 1, comboQueued = false) => {
    if (!reactive.has(k.type) && trapNullifies(trap, stone, k.type)) {
      fieldAmplified = true;
      return;
    }
    if (k.type === "amplify") {
      resolved.push(k);
      return;
    }
    let eligible = k.type !== "flash" && k.type !== "parting-gift";
    if (
      owner !== undefined &&
      (k.type === "head-start" || k.type === "comeback")
    )
      eligible =
        k.type === "head-start"
          ? scores[owner] > scores[1 - owner]
          : scores[owner] < scores[1 - owner];
    if (k.type === "sunder")
      eligible = board.some(
        (c) => c && (c.edges || c.stone.edges).some((n) => n > 0),
      );
    if (k.type === "silence")
      eligible = board.some(
        (c) => c && !c.silenced && !!c.stone.keywords?.length,
      );
    if (k.type === "resonance")
      eligible = board.some(
        (c) =>
          c &&
          (k.tribe
            ? hasTribe(c.stone, k.tribe)
            : c.stone.element === k.element),
      );
    const times = Math.min(
      32,
      extra *
        localMultiplier(k.type) *
        queuedMultiplier(k.type, eligible, !comboQueued),
    );
    resolved.push(...scaleEffect(k, times));
  };
  for (const g of groups) {
    const k = g.keyword;
    if (k.type !== "combo") {
      resolve(k);
      continue;
    }
    if (!g.active) continue;
    if (trapNullifies(trap, stone, "combo")) {
      fieldAmplified = true;
      for (const grant of k.keywords || [])
        if (grant.type === "trap") resolve(grant);
      continue;
    }
    const queued = queuedMultiplier("combo"),
      localCombo = localMultiplier("combo", false);
    for (const p of k.pips || [])
      comboPips[p.side] +=
        p.amount * Math.min(32, queued * localMultiplier("combo"));
    for (const grant of k.keywords || [])
      resolve(
        {
          ...grant,
          ...(k.half || hasTribe(stone, "swap-force")
            ? { half: k.half || ("top" as const) }
            : {}),
        },
        Math.min(32, queued * localCombo),
        queued > 1,
      );
  }
  const queues = all.flatMap((k) =>
    k.type === "amplify" &&
    k.duration === "next" &&
    !trapNullifies(trap, stone, "amplify") &&
    !groups.some(
      (g) =>
        g.keyword.type === "combo" &&
        g.keyword.keywords?.includes(k) &&
        trapNullifies(trap, stone, "combo"),
    )
      ? [{ effect: k.effect, count: k.count }]
      : [],
  );
  return {
    effects: resolved,
    spent,
    queues,
    comboPips,
    amplified:
      fieldAmplified ||
      local.length > 0 ||
      spent.length > 0 ||
      !!stone.runtimeEffects,
  };
}
export function validAmplifyQueue(value: unknown): value is AmplifyQueue[] {
  return (
    Array.isArray(value) &&
    value.length <= 128 &&
    value.every(
      (q) =>
        q &&
        typeof q.id === "string" &&
        /^\d+-\d+$/.test(q.id) &&
        [0, 1].includes(q.owner) &&
        Number.isInteger(q.count) &&
        q.count >= 1 &&
        q.count <= 5 &&
        (q.effect === "all" ||
          (typeof q.effect === "string" &&
            Object.hasOwn(KEYWORD_RULES, q.effect) &&
            q.effect !== "amplify")),
    )
  );
}
export function validAmplifySpent(value: unknown): value is AmplifySpent[] {
  return (
    Array.isArray(value) &&
    value.length <= 4096 &&
    value.every(
      (s) =>
        s &&
        typeof s.id === "string" &&
        /^\d+-\d+$/.test(s.id) &&
        Number.isInteger(s.count) &&
        s.count >= 1 &&
        s.count <= 5,
    )
  );
}
// Generated effect magnitudes may exceed maker limits, while their shapes and nesting remain validated.
export function validRuntimeEffects(value: unknown): value is BasicKeyword[] {
  if (!Array.isArray(value) || value.length > 4096) return false;
  const normalize = (list: unknown[], depth = 0): StoneKeyword[] | null => {
    if (depth > 3 || list.length > 4096) return null;
    const out: StoneKeyword[] = [];
    for (const input of list) {
      if (!input || typeof input !== "object") return null;
      const k = structuredClone(input) as Record<string, unknown>;
      for (const key of ["amount", "count", "multiplier"])
        if (k[key] !== undefined) {
          if (
            !Number.isInteger(k[key]) ||
            Math.abs(Number(k[key])) > (key === "count" ? 160 : 99)
          )
            return null;
          k[key] = Math.min(
            5,
            Math.max(key === "amount" ? -5 : 1, Number(k[key])),
          );
        }
      for (const key of ["pips", "shields"])
        if (k[key] !== undefined) {
          if (!Array.isArray(k[key])) return null;
          k[key] = (k[key] as Record<string, unknown>[]).map((p) => ({
            ...p,
            amount:
              Number.isInteger(p?.amount) &&
              Number(p.amount) > 0 &&
              Number(p.amount) <= 99
                ? Math.min(5, Number(p.amount))
                : NaN,
          }));
        }
      if (k.type === "trap" && k.trap && typeof k.trap === "object") {
        if (!validTrap(k.trap, true)) return null;
        const trap = k.trap as Trap;
        trap.effects = trap.effects.map((e) =>
          isTrapPipEffect(e)
            ? {
                ...e,
                amount: Math.max(-5, Math.min(5, e.amount)),
              }
            : e,
        );
      }
      if (k.environment && typeof k.environment === "object") {
        const env = k.environment as Record<string, unknown>;
        if (env.amount !== undefined) {
          if (
            !Number.isInteger(env.amount) ||
            Number(env.amount) < 1 ||
            Number(env.amount) > 99
          )
            return null;
          env.amount = Math.min(5, Number(env.amount));
        }
      }
      if (k.keywords !== undefined) {
        if (!Array.isArray(k.keywords)) return null;
        const nested = normalize(k.keywords, depth + 1);
        if (!nested) return null;
        k.keywords = nested.slice(0, 5);
      }
      if (!validateKeywords([k], depth, true)) return null;
      out.push(k as StoneKeyword);
    }
    return out;
  };
  return !!normalize(value);
}
