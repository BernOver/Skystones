import type { CSSProperties } from "react";
import { portraitImage } from "./portraits";
export function CharacterAvatar({
  id,
  name,
  color = "#547f9a",
  small = false,
}: {
  id: string;
  name: string;
  color?: string;
  small?: boolean;
}) {
  return (
    <span
      className={`character-avatar ${small ? "character-avatar-small" : ""}`}
      style={{ "--portrait-color": color } as CSSProperties}
    >
      <img
        src={portraitImage(id)}
        alt={`${name} portrait`}
        width={64}
        height={64}
      />
    </span>
  );
}
