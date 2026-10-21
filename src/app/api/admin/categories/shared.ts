const ICONS = ["vote", "users", "heart", "coin", "shield", "book", "cpu", "building", "globe", "chart", "file", "home", "alert"];

export function categoryData(b: Record<string, unknown>) {
  const name = String(b.name || "").trim().slice(0, 120);
  if (!name) return { error: "Alan adı gerekli." } as const;
  const topics = (Array.isArray(b.topics) ? b.topics : String(b.topics || "").split("\n")).map((t) => String(t).trim()).filter(Boolean).slice(0, 20);
  return {
    name,
    description: String(b.description || "").trim().slice(0, 600),
    icon: ICONS.includes(String(b.icon)) ? String(b.icon) : "chart",
    topics,
    coverId: typeof b.coverId === "string" && /^[a-z0-9]{10,40}$/.test(b.coverId) ? b.coverId : null,
    active: b.active === undefined ? true : !!b.active,
  };
}
