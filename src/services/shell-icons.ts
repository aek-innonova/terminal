/**
 * Bundled SVG icons for known shell types, keyed by shell name.
 * Each value is a data:image/svg+xml;base64,... URL ready for use in <img src>.
 */

function svg(raw: string): string {
  return "data:image/svg+xml;base64," + Buffer.from(raw).toString("base64");
}

// PowerShell — stylised ">_" prompt in blue
const powershell = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#012456"/>
    <path d="M7 22l8-6-8-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="17" y1="22" x2="25" y2="22" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`,
);

// Command Prompt — ">_" prompt in dark
const cmd = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#1e1e1e"/>
    <path d="M7 22l8-6-8-6" fill="none" stroke="#c0c0c0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="17" y1="22" x2="25" y2="22" stroke="#c0c0c0" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`,
);

// Bash — simple "B" with hash lines
const bash = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#2e3436"/>
    <text x="16" y="23" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="18" fill="#4ebc5a">$_</text>
  </svg>`,
);

// Zsh — "Z" badge
const zsh = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#1a1a2e"/>
    <text x="16" y="23" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="18" fill="#89b4fa">Z</text>
  </svg>`,
);

// Fish — simple fish shape
const fish = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#1c2431"/>
    <g transform="translate(16,16)">
      <ellipse rx="9" ry="5.5" fill="#98be65"/>
      <polygon points="9,-5 14,0 9,5" fill="#98be65"/>
      <circle cx="-4" cy="-1.5" r="1.2" fill="#1c2431"/>
    </g>
  </svg>`,
);

// Sh — minimal "sh" label
const sh = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#3b3b3b"/>
    <text x="16" y="22" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="15" fill="#aaaaaa">sh</text>
  </svg>`,
);

// Git — orange Git branch icon
const git = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#2e3436"/>
    <g fill="#f05033">
      <circle cx="11" cy="10" r="2.5"/>
      <circle cx="21" cy="10" r="2.5"/>
      <circle cx="11" cy="22" r="2.5"/>
      <line x1="11" y1="12.5" x2="11" y2="19.5" stroke="#f05033" stroke-width="2"/>
      <line x1="21" y1="12.5" x2="21" y2="15" stroke="#f05033" stroke-width="2"/>
      <path d="M21 15 Q21 18 11 19" fill="none" stroke="#f05033" stroke-width="2"/>
    </g>
  </svg>`,
);

// Linux/WSL — Tux-inspired penguin
const linux = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#2b2b2b"/>
    <ellipse cx="16" cy="19" rx="7" ry="9" fill="#e8ba2e"/>
    <ellipse cx="16" cy="18" rx="6" ry="8" fill="#1a1a1a"/>
    <ellipse cx="16" cy="14" rx="5.5" ry="5.5" fill="#1a1a1a"/>
    <circle cx="14" cy="12.5" r="1.8" fill="#fff"/>
    <circle cx="18" cy="12.5" r="1.8" fill="#fff"/>
    <circle cx="14.3" cy="12.2" r="0.9" fill="#000"/>
    <circle cx="18.3" cy="12.2" r="0.9" fill="#000"/>
    <ellipse cx="16" cy="15.5" rx="1.5" ry="0.8" fill="#e8ba2e"/>
  </svg>`,
);

// Visual Studio — purple VS diamond
const vs = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="4" fill="#1e1e1e"/>
    <path d="M16 5 L26 11 L26 21 L16 27 L6 21 L6 11 Z" fill="#68217a" stroke="#a05eb5" stroke-width="0.5"/>
    <path d="M12 12 L16 16 L20 12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="16" y1="16" x2="16" y2="22" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
);

/**
 * Keyword-based icon rules, checked in order.
 * Each entry has a test function and the icon to use when matched.
 * The first match wins.
 */
const ICON_RULES: { test: (name: string) => boolean; icon: string }[] = [
  { test: (n) => /\bgit\b/i.test(n), icon: git },
  {
    test: (n) =>
      /\bpowershell\b/i.test(n) &&
      !/\bvisual studio\b/i.test(n) &&
      !/\bvs\b/i.test(n),
    icon: powershell,
  },
  {
    test: (n) =>
      /\bcmd\b|command prompt/i.test(n) &&
      !/\bvisual studio\b/i.test(n) &&
      !/\bvs\b/i.test(n) &&
      !/\bdeveloper\b/i.test(n),
    icon: cmd,
  },
  { test: (n) => /\bdeveloper\b.*\b(vs|visual studio)\b/i.test(n), icon: vs },
  {
    test: (n) =>
      /\bubuntu\b|\bdebian\b|\bsuse\b|\bkali\b|\boracle\s*linux\b|\bfedora\b|\barch\b|\balpine\b/i.test(
        n,
      ),
    icon: linux,
  },
  { test: (n) => /\bwsl\b|\blinux\b/i.test(n), icon: linux },
  { test: (n) => /\bbash\b/i.test(n), icon: bash },
  { test: (n) => /\bzsh\b/i.test(n), icon: zsh },
  { test: (n) => /\bfish\b/i.test(n), icon: fish },
  { test: (n) => /\bsh\b/i.test(n), icon: sh },
];

/**
 * Find a bundled icon for a shell by its display name.
 * Uses keyword matching so names like "Windows PowerShell" or
 * "Ubuntu 22.04.5 LTS" are matched correctly.
 */
export function findBundledIcon(name: string): string | undefined {
  for (const rule of ICON_RULES) {
    if (rule.test(name)) return rule.icon;
  }
  return undefined;
}

/**
 * Map of shell display names to their bundled SVG data URLs.
 * Used for exact-match lookups in the fallback candidate path.
 */
export const SHELL_ICONS: ReadonlyMap<string, string> = new Map([
  ["PowerShell", powershell],
  ["PowerShell 7", powershell],
  ["Command Prompt", cmd],
  ["Bash", bash],
  ["Git Bash", git],
  ["Zsh", zsh],
  ["Fish", fish],
  ["Sh", sh],
]);
