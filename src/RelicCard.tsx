import {
  Award,
  Sword,
  CircleDollarSign,
  Landmark,
  Flame,
  Gem,
  Palette,
  Repeat2,
  Map,
  Leaf,
  Wine,
  Shield,
  HeartPulse,
  Dices,
  ScanEye,
  RefreshCw,
  Backpack,
  Flag as Banner,
  Coins,
  Copy,
  Eye,
  Feather,
  FlaskConical,
  Gift,
  Hammer,
  Heart,
  Magnet,
  PenTool,
  Percent,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { RELICS } from "./relics";
import type { RelicId } from "./relics";
export const RELIC_ICONS = {
  "gilded-compass": Coins,
  "merchants-purse": Wallet,
  "runesmiths-quill": PenTool,
  "twin-sigil": Copy,
  "travelers-satchel": Backpack,
  "bubbling-flask": FlaskConical,
  "alchemists-mortar": Sparkles,
  "phoenix-feather": Feather,
  "campfire-charm": Heart,
  "hagglers-coin": Percent,
  "stonewrights-hammer": Hammer,
  "fated-lens": Eye,
  "pilgrims-flask": Gift,
  "treasure-magnet": Magnet,
  "vanguard-banner": Banner,
  "victory-medallion": Award,
  "copper-claw": Sword,
  "quiet-coin": CircleDollarSign,
  "rainy-day-bank": Landmark,
  "restful-ember": Flame,
  "whetstone-ring": Gem,
  "elemental-prism": Palette,
  "rune-echo": Repeat2,
  "market-map": Map,
  "herbalists-lens": Leaf,
  "bottomless-bottle": Wine,
  "duelists-bracer": Shield,
  "stout-heart": HeartPulse,
  "loaded-dice": Dices,
  "oracles-eye": ScanEye,
  "merchants-die": RefreshCw,
};
export function RelicCard({
  id,
  children,
  owned = false,
  spent = false,
}: {
  id: RelicId;
  children?: ReactNode;
  owned?: boolean;
  spent?: boolean;
}) {
  const relic = RELICS[id],
    Icon = RELIC_ICONS[id];
  return (
    <article
      className={`relic-card ${owned ? "relic-owned" : ""} ${spent ? "relic-spent" : ""}`}
    >
      <span className="relic-icon">
        <Icon size={29} />
      </span>
      <h3>{relic.name}</h3>
      <p>{relic.description}</p>
      {owned && (
        <small>{spent ? "Spent for this run" : "In your collection"}</small>
      )}
      {children}
    </article>
  );
}
