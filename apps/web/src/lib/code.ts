const prefixes = {
  lead: "LEAD",
  opportunity: "OPP",
  briefing: "BRF",
  proposal: "PROP",
  contract: "CONT",
  project: "PROJ",
  charge: "COB",
  receipt: "REC",
  support: "SUP",
  expense: "DESP"
} as const;

export function formatRecordCode(namespace: keyof typeof prefixes, year: number, sequence: number) {
  return `${prefixes[namespace]}-${year}-${String(sequence).padStart(4, "0")}`;
}
