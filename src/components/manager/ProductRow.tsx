import { motion } from "framer-motion";
import { Camera, Check, HelpCircle, Link, Pencil, Power, PowerOff, Trash2, X } from "lucide-react";
import type { Product } from "@/data/products";
import { DISCOUNT_OPTIONS, formatUpdatedAt, type DiscountOption } from "./managerDashboardUtils";

interface PriceEditing {
  active: boolean;
  draft: string;
  error: string | null;
  onStart: (current: string) => void;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

interface VideoEditing {
  active: boolean;
  draft: string;
  error: string | null;
  onStart: (current: string) => void;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

interface ImageState {
  hasOverride: boolean;
  shown: string;
  uploading: boolean;
  anyUploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

interface FaqState {
  complete: boolean;
  partial: boolean;
  onOpen: () => void;
}

export interface ProductRowProps {
  product: Product;
  index: number;
  isActive: boolean;
  isSaving: boolean;
  isCustom: boolean;
  updatedAt?: string;
  bulkSelected: boolean;
  onBulkSelectToggle: (selected: boolean) => void;
  onToggle: () => void;
  priceOverride?: string;
  price: PriceEditing;
  discount: DiscountOption;
  onDiscountChange: (value: DiscountOption) => void;
  image: ImageState;
  video: VideoEditing & { hasVideo: boolean };
  faq: FaqState;
}

export const ProductRow = ({
  product,
  index,
  isActive,
  isSaving,
  isCustom,
  updatedAt,
  bulkSelected,
  onBulkSelectToggle,
  onToggle,
  priceOverride,
  price,
  discount,
  onDiscountChange,
  image,
  video,
  faq,
}: ProductRowProps) => (
  <motion.div
    className={`overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 ${
      isActive ? "border-border" : "border-border/30"
    }`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: isActive ? 1 : 0.52, y: 0 }}
    transition={{ delay: index * 0.04 }}
  >
    <div className={`h-0.5 w-full transition-colors duration-500 ${isActive ? "gradient-primary" : "bg-border/40"}`} />

    <div className="p-4">
      {/* Row 1: checkbox · status · name · toggle */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={bulkSelected}
          onChange={(e) => onBulkSelectToggle(e.target.checked)}
          className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer"
        />
        <div className="min-w-0 flex-1">
          <span
            className={`mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
              isActive ? "text-green-400" : "text-muted-foreground"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-400" : "bg-muted-foreground"}`} />
            {isActive ? "Active" : "Paused"}
          </span>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold leading-snug text-foreground">{product.name}</h3>
            {isCustom && (
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                Custom
              </span>
            )}
          </div>
          {updatedAt && (
            <p className="mt-0.5 text-[10px] text-muted-foreground/50">
              Updated: {formatUpdatedAt(updatedAt)}
            </p>
          )}
        </div>
        <motion.button
          onClick={() => !isSaving && onToggle()}
          disabled={isSaving}
          className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            isActive
              ? "border-destructive/30 bg-destructive/10 text-destructive active:bg-destructive/20"
              : "border-green-500/30 bg-green-500/10 text-green-400 active:bg-green-500/20"
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {isSaving ? (
            <span className="animate-pulse">…</span>
          ) : isActive ? (
            <><PowerOff className="h-3 w-3" /> Deactivate</>
          ) : (
            <><Power className="h-3 w-3" /> Reactivate</>
          )}
        </motion.button>
      </div>

      {/* Row 2: price · discount */}
      <div className="ml-7 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {price.active ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={price.draft}
                onChange={(e) => price.onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") price.onSubmit(price.draft);
                  if (e.key === "Escape") price.onCancel();
                }}
                className="w-28 rounded-lg border border-primary bg-card px-2 py-1 text-sm font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="€0,00"
              />
              <button
                onClick={() => price.onSubmit(price.draft)}
                className="rounded-lg bg-primary/20 p-1.5 text-primary hover:bg-primary/30"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={price.onCancel}
                className="rounded-lg bg-muted p-1.5 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {price.error && <p className="text-[10px] text-destructive">{price.error}</p>}
          </div>
        ) : (
          <button
            onClick={() => price.onStart(priceOverride ?? product.price)}
            className="group flex items-center gap-1.5"
          >
            <span className="text-sm font-bold text-primary">{priceOverride ?? product.price}</span>
            {priceOverride && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                custom
              </span>
            )}
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        <span className="hidden h-3 w-px bg-border/50 sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Discount:</span>
          {DISCOUNT_OPTIONS.map((opt) => {
            const sel = discount === opt;
            return (
              <button
                key={opt}
                onClick={() => onDiscountChange(opt)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                  sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt}%
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: media actions + tags */}
      <div className="ml-7 mt-3 flex flex-wrap items-center gap-2">
        {image.shown ? (
          <div className="flex items-center gap-1.5">
            <img
              src={image.shown}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-8 w-12 rounded-md border border-border object-cover"
            />
            {image.hasOverride ? (
              <button
                onClick={image.onRemove}
                title="Remove the per-store image override"
                className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] text-destructive active:scale-95"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            ) : (
              <ImageUploadLabel image={image} compact />
            )}
          </div>
        ) : (
          <ImageUploadLabel image={image} compact={false} />
        )}

        {video.active ? (
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={video.draft}
                onChange={(e) => video.onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") video.onSubmit(video.draft);
                  if (e.key === "Escape") video.onCancel();
                }}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 rounded-lg border border-primary bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => video.onSubmit(video.draft)}
                className="rounded-lg bg-primary/20 p-1.5 text-primary"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={video.onCancel}
                className="rounded-lg bg-muted p-1.5 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {video.error && <p className="text-[10px] text-destructive">{video.error}</p>}
          </div>
        ) : (
          <button
            onClick={() => video.onStart(video.draft)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
              video.hasVideo
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Link className="h-3 w-3" />
            {video.hasVideo ? "Video ✓" : "Video"}
          </button>
        )}

        <button
          onClick={faq.onOpen}
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
            faq.complete
              ? "border-primary/40 bg-primary/10 text-primary"
              : faq.partial
              ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
              : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <HelpCircle className="h-3 w-3" />
          {faq.complete ? "FAQ ✓" : faq.partial ? "FAQ ⚠" : "FAQ"}
        </button>

        <div className="ml-auto flex flex-wrap gap-1">
          {product.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

interface ImageUploadLabelProps {
  image: ImageState;
  compact: boolean;
}

const ImageUploadLabel = ({ image, compact }: ImageUploadLabelProps) => (
  <label
    className={`flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-muted/50 ${
      compact ? "px-2 py-1" : "px-2.5 py-1.5"
    } text-[10px] font-medium text-muted-foreground hover:bg-muted active:scale-95 ${
      image.uploading ? "animate-pulse" : ""
    }`}
  >
    <Camera className="h-3 w-3" />
    {image.uploading ? "…" : compact ? "Store photo" : "Photo"}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      disabled={image.anyUploading}
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) image.onUpload(f);
        e.target.value = "";
      }}
    />
  </label>
);
