import { StoneCard } from "./Artwork";
import type { Stone } from "./game";
import type { AIProfile } from "./ai";
import { CardFilterFields } from "./CardFilterFields";
export function AIProfileFields({
  value = {},
  onChange,
}: {
  value?: AIProfile;
  onChange: (value: AIProfile) => void;
}) {
  return (
    <section className="studio-section">
      <h3>Bot behavior</h3>
      <label>
        Play order
        <select
          aria-label="Bot play order"
          value={value.order || "tactical"}
          onChange={(e) =>
            onChange({ ...value, order: e.target.value as AIProfile["order"] })
          }
        >
          <option value="tactical">Tactical · best capture and defense</option>
          <option value="low-pips">Lowest pips first</option>
          <option value="high-pips">Highest pips first</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          aria-label="Bot card priority"
          checked={!!value.priority}
          onChange={(e) =>
            onChange({ ...value, priority: e.target.checked ? {} : undefined })
          }
        />
        Prioritize matching cards
      </label>
      {value.priority && (
        <CardFilterFields
          value={value.priority}
          onChange={(priority) => onChange({ ...value, priority })}
          label="Bot priority"
        />
      )}
      <label>
        Player chooses the bot’s cards for its first turns
        <input
          type="number"
          aria-label="Initial bot control turns"
          min={0}
          max={99}
          value={value.controlTurns || 0}
          onChange={(e) =>
            onChange({
              ...value,
              controlTurns: Math.max(0, Math.min(99, Number(e.target.value))),
            })
          }
        />
      </label>
      <p>
        Priority applies first, then pip order, then tactical placement. If no
        priority card is available, use the rest of the hand. During controlled
        turns the player chooses each card, and the bot chooses its placement.
        Spells and Flash stay in the same controlled turn.
      </p>
    </section>
  );
}
export function BotControlPanel({
  hand,
  remaining,
  onChoose,
}: {
  hand: Stone[];
  remaining: number;
  onChoose: (index: number) => void;
}) {
  return (
    <section className="bot-control-panel" aria-label="Choose the bot’s card">
      <h3>You control this bot turn</h3>
      <p>
        Choose its next card. The bot will place it. {remaining} more controlled
        turn{remaining === 1 ? "" : "s"} remain after this one.
      </p>
      <div className="bot-control-cards">
        {hand.map((card, index) => (
          <button
            key={card.id}
            type="button"
            aria-label={`Bot play ${card.name}`}
            disabled={!!card.part || card.spell === "discard"}
            onClick={() => onChoose(index)}
          >
            <StoneCard stone={card} />
          </button>
        ))}
      </div>
    </section>
  );
}
