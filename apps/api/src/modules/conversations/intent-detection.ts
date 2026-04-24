/**
 * Bilingual (EN/AM) heuristics for “ready to transact / pay / handoff” phrasing.
 * When a buyer message matches, the API can append an `agreement_nudge` message.
 */
const AGREEMENT_PATTERNS: RegExp[] = [
  /\b(i(?:'ll| will)\s*take (it|this|the item))\b/i,
  /\b(okay|ok),?\s*i(?:'ll| will) take it\b/i,
  /\b(where|how)\s+(do|to)\s+(i\s+)?(pay|send (you )?money)\b/i,
  /\b(cod|cash on delivery)\b/i,
  /\bsend( me)?\s+your( bank)?\s*(account|number|details|phone|location)\b/i,
  /\bshare( your)?\s+(location|address|phone|number|delivery (details|address))\b/i,
  /\b(i am|i'm) ready to (complete|pay|pick up|collect)\b/i,
];

export function detectAgreementIntent(body: string): boolean {
  const t = body.trim();
  if (t.length < 4) return false;
  return AGREEMENT_PATTERNS.some((re) => re.test(t));
}

export const agreementNudgeMeta = {
  suggested: ["pick_cod", "pick_bank", "pick_mobile", "share_phone", "share_address"] as const,
} as const;
