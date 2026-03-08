export function deriveThreadTopic(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    return "General";
  }

  const colonSplit = trimmed.split(":");
  if (colonSplit.length > 1 && colonSplit[0].trim().length >= 3) {
    return colonSplit[0].trim();
  }

  const words = trimmed
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "General";
  }

  return words.slice(0, Math.min(2, words.length)).join(" ");
}
