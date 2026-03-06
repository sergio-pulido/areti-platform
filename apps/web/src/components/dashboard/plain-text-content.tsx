type PlainTextContentProps = {
  value: string;
  className?: string;
};

function normalizeBlocks(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

function isOrderedList(lines: string[]): boolean {
  return lines.every((line) => /^\d+\.\s+/.test(line));
}

function isUnorderedList(lines: string[]): boolean {
  return lines.every((line) => /^[-*]\s+/.test(line));
}

export function PlainTextContent({ value, className }: PlainTextContentProps) {
  const blocks = normalizeBlocks(value);
  const containerClass = className ?? "space-y-4 text-sm text-night-200";

  return (
    <div className={containerClass}>
      {blocks.map((block, index) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (lines.length > 1 && isOrderedList(lines)) {
          return (
            <ol key={`${index}-${lines[0]}`} className="list-decimal space-y-1 pl-5">
              {lines.map((line) => (
                <li key={line}>{line.replace(/^\d+\.\s+/, "")}</li>
              ))}
            </ol>
          );
        }

        if (lines.length > 1 && isUnorderedList(lines)) {
          return (
            <ul key={`${index}-${lines[0]}`} className="list-disc space-y-1 pl-5">
              {lines.map((line) => (
                <li key={line}>{line.replace(/^[-*]\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        return <p key={`${index}-${block.slice(0, 24)}`}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}
