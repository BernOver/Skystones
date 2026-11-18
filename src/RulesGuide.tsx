import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, X } from "lucide-react";
import "./rules.css";

const RULE_TOPICS = [
  {
    id: "random-keywords",
    name: "Random keywords",
    text: [
      "Flash is excluded from random keyword generation. Other available keyword types are eligible, including Environment Immunity. A custom pool can narrow the eligible types further. Fixed keyword grants can still give Flash.",
      "Each recipient rolls independently when the grant resolves. The result stays for this battle and survives Adventure reloads; previews and canceled choices do not reroll it. Unique keyword assignments are not duplicated, and the 24-keyword card limit still applies. If the allowed pool or remaining slots cannot supply the requested number, fewer keywords are added.",
    ],
  },
  {
    id: "keyword-grants",
    name: "Hand and board buffs",
    text: [
      "Enchant resolves after Conjure, so newly generated cards can receive its buffs. Only matching cards present then are affected. All matching cards has no five-card target limit. The buffs last for this battle; hand cards keep them when played.",
      "Hand recipients use granted keywords on their later plays or discards. Board Shield and conditional Head Start, Comeback and Resonance bonuses activate immediately for the recipient’s controller. Environment Immunity also becomes active immediately. Other on-play effects attach without replaying placement, captures or earlier effects. Silenced board cards cannot receive these grants.",
      "Traps can change pips, add Shield and grant fixed or random keywords to matching hand cards, board cards, or both. These grants persist for this battle after their crystal is replaced. Placement and entry grants resolve after captures and Conjure. Turn-start grants use the configured recipients.",
    ],
  },
  {
    id: "traps-and-doubling",
    name: "Traps, doubling and nullification",
    text: [
      "Only one shared Trap is active. Playing a new Trap replaces the previous crystal’s ongoing rules. Completed casts and granted keywords remain unless another rule removes or disables them.",
      "Trap doubling of all keyword effects excludes Amplify, Flash, Trap placement and Environment Immunity. Printed base pips and turn length do not double. Immunity has no stronger doubled form and does not consume a queued Amplify use.",
      "Trap nullification overrides doubling. Nullify all keywords still allows Trap placement, so a new crystal can replace the nullifier. A Trap can specifically nullify Environment Immunity; replacing that Trap restores an unsilenced card’s immunity.",
    ],
  },
  {
    id: "superchargers",
    name: "Parts, Superchargers and Flash",
    text: [
      "Two Parts in hand automatically combine. Loose Parts cannot be played alone. The Supercharger combines both Parts’ pips and effects and gains Flash, allowing it to be played without ending the turn.",
      "Either player can cover a Supercharger with a stone. The stone inherits its pips and other effects, but Flash is not inherited. Inherited on-play effects trigger for the covering stone. A Supercharger must be covered before its square counts as finished.",
    ],
  },
  {
    id: "environments",
    name: "Environments and immunity",
    text: [
      "Environment Immunity ignores all seven tile environments, including helpful bonuses and harmful effects. It applies before captures and stays with a moved or captured card. Silence disables it. The environment stays on the tile for other cards.",
      "Immunity only concerns tile environments. Trap effects, the elemental arena, Sunder, potions and other card effects still apply. Pip conditions use ordinary pips before the relevant field modifiers. Crosswind changes the displayed sides used by Sunder and potions only while its terrain effect applies to the target.",
    ],
  },
  {
    id: "deleted-content",
    name: "Deleted defaults and saved copies",
    text: [
      "Delete built-in stones, tokens, Parts and spells in their card details. Delete Traps in Collection → Traps. Deleted content is saved in this browser. Collection → Deleted content lets you restore individual items or all deleted defaults, preserving earlier edits.",
      "Deleted card templates leave saved normal decks and new random generation. Restore cards before adding them to decks again. Existing matches, Adventure packs, draft tables and authored card or encounter definitions keep their saved copies. Deleting a Trap template does not erase crystals already chosen on stones or active in a battle.",
      "A Conjure or Assemble that specifically needs a deleted template produces no matching card until it is restored. Deleting every Trap also removes Trap placement from newly generated random keyword rolls and shop offers. Draft needs 25 available characters; Adventure needs enough unused characters to generate its cards. Restore defaults if a mode runs out of available cards. Portraits remain available in Card studio for making your own versions.",
    ],
  },
  {
    id: "timing-and-discards",
    name: "Timing and protected discards",
    text: [
      "Head Start checks whether its player is winning, and Comeback checks whether its player is losing, before placement. Neither activates on a tie. Their activated pip bonuses stay after the score changes. Dizzy and Shuffle resolve before captures; Shift captures first, then pushes its eligible neighbor.",
      "Spells and Flash keep the current turn. Turn Start fires once per matching new turn, not after every card. Its targets and discard reactions are automatic. Reloading an Adventure does not repeat an already processed turn-start trigger.",
      "Discard effects keep enough playable stones to finish the board. Actual Conjure gains count after pool and hand limits; spells, loose Parts and temporary Superchargers do not replace the required finishing stones. Protected or skipped discards grant no discard rewards.",
    ],
  },
] as const;
export type RulesTopic = (typeof RULE_TOPICS)[number]["id"];
const OpenRules = createContext<(topic: RulesTopic) => void>(() => {});

export function RulesLink({
  topic = "random-keywords",
  label = "Rules & clarifications",
  className = "",
}: {
  topic?: RulesTopic;
  label?: string;
  className?: string;
}) {
  const open = useContext(OpenRules);
  return (
    <button
      type="button"
      className={`rules-link ${className}`}
      aria-haspopup="dialog"
      data-rules-topic={topic}
      onClick={(event) => {
        event.stopPropagation();
        open(topic);
      }}
    >
      <BookOpen size={15} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function RulesDialog({
  topic,
  onClose,
}: {
  topic: RulesTopic;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState<RulesTopic | null>(topic);
  const [query, setQuery] = useState("");
  const shown = RULE_TOPICS.filter((rule) =>
    `${rule.name} ${rule.text.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="rules-clarifications-dialog"
      aria-labelledby="rules-clarifications-title"
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          onClose();
      }}
    >
      <button
        type="button"
        className="icon-button modal-close"
        aria-label="Close rules"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <div className="eyebrow">AT THE TABLE</div>
      <h2 id="rules-clarifications-title">Rules & clarifications</h2>
      <p className="rules-guide-intro">
        Open a topic for exceptions, limits and timing details.
      </p>
      <label className="rules-guide-search">
        Search rules and keywords
        <input
          type="search"
          aria-label="Search rules and keywords"
          placeholder="Search Amplify, random keywords, traps…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {!shown.length && (
        <p role="status">No matching rules. Try another keyword.</p>
      )}
      {shown.map((rule) => (
        <details
          key={rule.id}
          className="rules-guide-topic"
          open={expanded === rule.id || (!!query.trim() && shown.length === 1)}
        >
          <summary
            onClick={(event) => {
              event.preventDefault();
              setExpanded(expanded === rule.id ? null : rule.id);
            }}
          >
            {rule.name}
          </summary>
          <div>
            {rule.text.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </details>
      ))}
    </dialog>
  );
}

export function RulesProvider({ children }: { children: ReactNode }) {
  const [topic, setTopic] = useState<RulesTopic | null>(null);
  return (
    <OpenRules.Provider value={setTopic}>
      {children}
      {topic && <RulesDialog topic={topic} onClose={() => setTopic(null)} />}
    </OpenRules.Provider>
  );
}
