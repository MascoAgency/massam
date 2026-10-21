import type { PlanLite } from "./types";
import { limTxt } from "./format";

export function planFeatures(p: PlanLite) {
  const l = p.limits;
  return [`${limTxt(l.surveys)} anket`, `Anket başına ${limTxt(l.responses)} katılımcı`, `Ayda ${limTxt(l.ai)} analiz`, `Ayda ${limTxt(l.pdf)} PDF rapor`, `${l.retention} ay veri saklama`];
}
