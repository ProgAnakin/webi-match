import { ChevronLeft, FileText, ListChecks, Lightbulb } from "lucide-react";
import type { ProductGuide, GuideLang } from "./types";
import { localisedGuide } from "./types";

interface ProductGuideDetailProps {
  guide: ProductGuide;
  lang: GuideLang;
  onBack: () => void;
}

// Renders one section. Content is plain text authored in /manager — newlines
// are preserved with whitespace-pre-wrap; empty sections show a soft hint.
const Section = ({
  icon, title, body,
}: { icon: React.ReactNode; title: string; body: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="mb-2 flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
        {icon}
      </span>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
    {body.trim() ? (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{body}</p>
    ) : (
      <p className="text-xs italic text-muted-foreground/60">Not filled in yet.</p>
    )}
  </div>
);

export const ProductGuideDetail = ({ guide, lang, onBack }: ProductGuideDetailProps) => {
  const { description, specs, tips } = localisedGuide(guide, lang);

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to all products
      </button>

      <div>
        <h2 className="text-lg font-bold text-foreground">{guide.product_name}</h2>
        <p className="text-xs text-muted-foreground">
          Updated {new Date(guide.updated_at).toLocaleDateString()}
        </p>
      </div>

      <Section icon={<FileText className="h-4 w-4" />}   title="Description"           body={description} />
      <Section icon={<ListChecks className="h-4 w-4" />} title="Specs & characteristics" body={specs} />
      <Section icon={<Lightbulb className="h-4 w-4" />}  title="Selling tips"          body={tips} />
    </div>
  );
};
