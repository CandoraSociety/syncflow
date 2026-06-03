/**
 * Returns a Tailwind class string for colour-coding a client table row
 * based on their program/case status.
 *
 * 🔴 Red    — bad ending (cancelled, incomplete, withdrew, etc.)
 * 🟢 Green  — fully complete including 90-day follow-up
 * 🔵 Blue   — program complete, now in follow-up period
 * 🟡 Yellow — in progress (or no status yet)
 */
export function clientRowColor(client) {
  const ps = client.program_status;
  const cr = client.closed_reason;

  // Bad endings
  const badEndings = ["cancelled", "incomplete", "withdrew", "relocated", "no_longer_eligible", "no_contact", "duplicate"];
  if (ps === "incomplete" || ps === "cancelled") return "bg-red-50 hover:bg-red-100";
  if (client.file_closed && badEndings.includes(cr)) return "bg-red-50 hover:bg-red-100";

  // Fully complete including follow-up
  if (ps === "complete" && client.followup_90day_status) return "bg-green-50 hover:bg-green-100";

  // Program complete, in follow-up period
  if (ps === "complete") return "bg-blue-50 hover:bg-blue-100";

  // In progress / default
  return "bg-yellow-50 hover:bg-yellow-100";
}