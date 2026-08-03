import { cn } from "@/lib/utils";

type CustomerTextContentProps = {
  content: string;
  className?: string;
};

export function CustomerTextContent({ content, className }: CustomerTextContentProps) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-4", className)}>
      {lines.map((line, index) => {
        if (line.startsWith("###")) {
          return (
            <h2 key={`${index}-${line}`} className="pt-2 text-base font-extrabold text-white md:text-lg">
              {line.replace(/^#+\s*/, "")}
            </h2>
          );
        }

        if (line.startsWith("-")) {
          return (
            <p key={`${index}-${line}`} className="flex gap-2 text-sm font-semibold leading-7 text-white/70">
              <span aria-hidden="true" className="text-pink-200">•</span>
              <span>{line.replace(/^-\s*/, "")}</span>
            </p>
          );
        }

        return (
          <p key={`${index}-${line}`} className="text-sm font-semibold leading-7 text-white/70 md:text-base">
            {line}
          </p>
        );
      })}
    </div>
  );
}
