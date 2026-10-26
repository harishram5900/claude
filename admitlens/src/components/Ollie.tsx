// Ollie, the AdmitLens owl: big round reading lenses, because the whole product is a careful read.
// Pure SVG so it themes, scales and ships without image assets.
import type { ReactNode } from "react";
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export type OllieMood = "happy" | "wave" | "reading" | "think" | "cheer";

const C = {
  body: "#1d5a46",
  bodyDark: "#164636",
  belly: "#f5f2ea",
  feather: "#e4ddcd",
  beak: "#e0a53a",
  rim: "#191d1b",
  lens: "#fffdf8",
  pupil: "#191d1b",
  cheek: "#f2a68a",
  book: "#23406b",
};

function Eyes({ mood }: { mood: OllieMood }) {
  const closed = mood === "happy" || mood === "cheer";
  const look = mood === "reading" ? 6 : mood === "think" ? -4 : 0;
  const lookY = mood === "reading" ? 5 : mood === "think" ? -5 : 0;
  return (
    <g>
      {/* lens rims and bridge */}
      <circle cx="74" cy="84" r="25" fill={C.lens} stroke={C.rim} strokeWidth="6" />
      <circle cx="126" cy="84" r="25" fill={C.lens} stroke={C.rim} strokeWidth="6" />
      <path d="M97 82 Q100 77 103 82" fill="none" stroke={C.rim} strokeWidth="5" strokeLinecap="round" />
      {closed ? (
        <>
          <path d="M62 88 Q74 76 86 88" fill="none" stroke={C.pupil} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M114 88 Q126 76 138 88" fill="none" stroke={C.pupil} strokeWidth="5.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={74 + look} cy={86 + lookY} r="10" fill={C.pupil} />
          <circle cx={126 + look} cy={86 + lookY} r="10" fill={C.pupil} />
          <circle cx={78 + look} cy={82 + lookY} r="3.4" fill={C.lens} />
          <circle cx={130 + look} cy={82 + lookY} r="3.4" fill={C.lens} />
        </>
      )}
      {/* lens glint */}
      <path d="M58 72 Q62 64 70 62" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" />
      <path d="M110 72 Q114 64 122 62" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

export function Ollie({ mood = "happy", size = 160, className, title = "Ollie the AdmitLens owl" }: { mood?: OllieMood; size?: number; className?: string; title?: string }) {
  const wave = mood === "wave" || mood === "cheer";
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={cx("shrink-0", className)} role="img" aria-label={title}>
      {/* ear tufts */}
      <path d="M48 52 L40 18 L74 40 Z" fill={C.bodyDark} />
      <path d="M152 52 L160 18 L126 40 Z" fill={C.bodyDark} />
      {/* body */}
      <path d="M100 30 C150 30 172 70 170 116 C168 160 140 186 100 186 C60 186 32 160 30 116 C28 70 50 30 100 30 Z" fill={C.body} />
      {/* belly with feather scallops */}
      <path d="M100 104 C132 104 146 128 144 152 C142 172 124 182 100 182 C76 182 58 172 56 152 C54 128 68 104 100 104 Z" fill={C.belly} />
      <g fill="none" stroke={C.feather} strokeWidth="3" strokeLinecap="round">
        <path d="M80 132 q6 6 12 0 q6 6 12 0 q6 6 12 0" />
        <path d="M74 150 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0" />
        <path d="M82 168 q6 6 12 0 q6 6 12 0 q6 6 12 0" />
      </g>
      {/* wings */}
      {wave ? (
        <path className="ollie-wave" d="M164 112 C186 96 192 70 182 54 C170 66 158 86 154 108 Z" fill={C.bodyDark} style={{ transformOrigin: "160px 112px" }} />
      ) : (
        <path d="M166 104 C180 124 178 152 160 168 C156 146 154 126 158 106 Z" fill={C.bodyDark} />
      )}
      <path d="M34 104 C20 124 22 152 40 168 C44 146 46 126 42 106 Z" fill={C.bodyDark} />
      {mood === "cheer" && <path d="M36 112 C14 96 8 70 18 54 C30 66 42 86 46 108 Z" fill={C.bodyDark} />}
      {/* cheeks */}
      {(mood === "happy" || mood === "cheer" || mood === "wave") && (
        <>
          <ellipse cx="56" cy="112" rx="8" ry="5" fill={C.cheek} opacity="0.7" />
          <ellipse cx="144" cy="112" rx="8" ry="5" fill={C.cheek} opacity="0.7" />
        </>
      )}
      <Eyes mood={mood} />
      {/* beak */}
      <path d="M92 104 L108 104 L100 120 Z" fill={C.beak} strokeLinejoin="round" stroke={C.beak} strokeWidth="3" />
      {/* feet */}
      <g fill={C.beak}>
        <path d="M78 182 q4 10 8 0 q4 10 8 0 Z" />
        <path d="M106 182 q4 10 8 0 q4 10 8 0 Z" />
      </g>
      {/* book for reading */}
      {mood === "reading" && (
        <g>
          <path d="M60 140 L100 132 L140 140 L140 178 L100 170 L60 178 Z" fill={C.book} />
          <path d="M100 132 L100 170" stroke={C.lens} strokeWidth="2.5" />
          <path d="M70 148 L92 144 M70 156 L92 152 M108 144 L130 148 M108 152 L130 156" stroke={C.lens} strokeOpacity="0.7" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {/* thinking dots */}
      {mood === "think" && (
        <g fill={C.beak}>
          <circle cx="166" cy="34" r="5" />
          <circle cx="180" cy="18" r="7" />
        </g>
      )}
    </svg>
  );
}

/** Ollie with a speech bubble, for tips and empty states. */
export function OllieSays({ children, mood = "happy", size = 84, className }: { children: ReactNode; mood?: OllieMood; size?: number; className?: string }) {
  return (
    <div className={cx("flex items-end gap-3", className)}>
      <Ollie mood={mood} size={size} />
      <div className="relative mb-4 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3 text-sm leading-relaxed shadow-card">
        {children}
      </div>
    </div>
  );
}
