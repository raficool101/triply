import { useState, useEffect, useRef, useId } from "react";

// ─── Built-in categories ──────────────────────────────────────────────────────
export interface CategoryDef {
  id:    string;
  label: string;
  icon:  React.ReactNode;
}

function IconUtensils({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}
function IconCar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 104 0m6 0a2 2 0 104 0" />
      <path d="M3 12h18" />
    </svg>
  );
}
function IconBed({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16M2 8h20v12M2 12h20M6 8V4" />
      <rect x="6" y="10" width="4" height="2" rx="1" />
    </svg>
  );
}
function IconTicket({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6M2 15a3 3 0 000 6h20a3 3 0 000-6" />
      <path d="M2 9h20M2 15h20" />
    </svg>
  );
}
function IconDroplet({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
    </svg>
  );
}
function IconShoppingBag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function IconCross({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}
function IconMusic({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function IconAlertTriangle({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconDots({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="5"  cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}
function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconCheck({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export const BUILTIN_CATEGORIES: CategoryDef[] = [
  { id: "food",          label: "Food",           icon: <IconUtensils    size={18} /> },
  { id: "transport",     label: "Transport",      icon: <IconCar         size={18} /> },
  { id: "accommodation", label: "Accommodation",  icon: <IconBed         size={18} /> },
  { id: "tickets",       label: "Tickets",        icon: <IconTicket      size={18} /> },
  { id: "fuel",          label: "Fuel",           icon: <IconDroplet     size={18} /> },
  { id: "shopping",      label: "Shopping",       icon: <IconShoppingBag size={18} /> },
  { id: "medical",       label: "Medical",        icon: <IconCross       size={18} /> },
  { id: "entertainment", label: "Entertainment",  icon: <IconMusic       size={18} /> },
  { id: "emergency",     label: "Emergency",      icon: <IconAlertTriangle size={18} /> },
  { id: "other",         label: "Other",          icon: <IconDots        size={18} /> },
];

// ─── Category Sheet ───────────────────────────────────────────────────────────
export default function CategorySheet({
  selected,
  customCategories,
  onSelect,
  onClose,
}: {
  selected:         string | null;
  customCategories: CategoryDef[];
  onSelect:         (id: string, label: string, isNew: boolean) => void;
  onClose:          () => void;
}) {
  const [view,      setView]      = useState<"list" | "add">("list");
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nameId   = useId();

  const allCategories = [...BUILTIN_CATEGORIES, ...customCategories];

  // Close on Escape — only when in list view; in add view, go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "add") { setView("list"); setNameInput(""); setNameError(""); }
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [view, onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Focus input when add view opens
  useEffect(() => {
    if (view === "add") {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [view]);

  const handleSelectCategory = (cat: CategoryDef) => {
    onSelect(cat.id, cat.label, false);
    onClose();
  };

  const handleAddCategory = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { setNameError("Enter a category name."); return; }
    const duplicate = allCategories.some(
      (c) => c.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) { setNameError(`"${trimmed}" already exists.`); return; }
    onSelect(trimmed.toLowerCase().replace(/\s+/g, "-"), trimmed, true);
    onClose();
  };

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-60 bg-black/30"
        style={{ animation: "fadeIn 150ms ease" }}
        onClick={view === "list" ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={view === "list" ? "Choose category" : "Add category"}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-70 bg-white rounded-t-[20px] safe-bottom flex flex-col overflow-hidden"
        style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)", maxHeight: "90dvh" }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0" aria-hidden="true">
          <div className="w-9 h-1 bg-[#E1E7EF] rounded-full" />
        </div>

        {/* ── LIST VIEW ──────────────────────────────────────────────────── */}
        <div
          className="flex flex-col overflow-hidden transition-all duration-200"
          style={{ display: view === "list" ? "flex" : "none" }}
        >
          {/* Title */}
          <div className="px-5 pt-2 pb-3 border-b border-[#F1F5F9] shrink-0">
            <h2 className="text-[16px] font-700 text-[#0F172A]">Choose category</h2>
          </div>

          {/* Category rows */}
          <div className="overflow-y-auto flex-1">
            {allCategories.map((cat, i) => {
              const isSelected = cat.id === selected;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className={`pressable w-full flex items-center gap-3.5 px-5 py-3.5 text-left transition-colors ${
                    isSelected ? "bg-[#EFF9FB]" : "hover:bg-[#F8FAFC]"
                  } ${i > 0 ? "border-t border-[#F4F6F9]" : ""}`}
                >
                  {/* Icon container — neutral tint, selected gets brand tint */}
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      backgroundColor: isSelected ? "#EFF9FB" : "#F4F6F9",
                      color:           isSelected ? "#0A86A0" : "#94A3B8",
                    }}
                  >
                    {cat.icon}
                  </div>

                  <span
                    className={`flex-1 text-[15px] font-600 leading-snug ${
                      isSelected ? "text-[#0A7490]" : "text-[#0F172A]"
                    }`}
                  >
                    {cat.label}
                  </span>

                  {/* Checkmark slot — reserved width so rows don't shift */}
                  <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                    {isSelected && (
                      <span className="text-[#0A86A0]">
                        <IconCheck size={17} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Add category row */}
            <button
              onClick={() => setView("add")}
              className="pressable w-full flex items-center gap-3.5 px-5 py-4 text-left border-t border-[#E1E7EF] transition-colors hover:bg-[#F8FAFC]"
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-[#F4F6F9] text-[#94A3B8] border border-dashed border-[#C9D4DF]">
                <IconPlus size={16} />
              </div>
              <span className="text-[15px] font-600 text-[#475569]">Add category</span>
            </button>
          </div>
        </div>

        {/* ── ADD VIEW ───────────────────────────────────────────────────── */}
        <div
          className="flex flex-col"
          style={{ display: view === "add" ? "flex" : "none" }}
        >
          {/* Header with back */}
          <div className="flex items-center gap-1 px-2 pt-1 pb-3 border-b border-[#F1F5F9] shrink-0">
            <button
              onClick={() => { setView("list"); setNameInput(""); setNameError(""); }}
              className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]"
              aria-label="Back to category list"
            >
              <IconChevronLeft size={20} />
            </button>
            <h2 className="text-[16px] font-700 text-[#0F172A] leading-none">Add category</h2>
          </div>

          {/* Form */}
          <div className="px-5 pt-5 pb-4">
            <label
              htmlFor={nameId}
              className="text-[11px] font-700 text-[#475569] uppercase tracking-wide block mb-2"
            >
              Category name
            </label>
            <input
              id={nameId}
              ref={inputRef}
              type="text"
              placeholder="e.g. Boat rent"
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); if (nameError) setNameError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
              className={`w-full bg-[#F4F6F9] rounded-[11px] px-4 h-12 text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border-2 transition-colors ${
                nameError
                  ? "border-[#FECACA] bg-[#FFF5F5]"
                  : "border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white"
              }`}
            />
            {nameError && (
              <p className="flex items-center gap-1 text-[12px] font-500 text-[#DC2626] mt-1.5">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {nameError}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={() => { setView("list"); setNameInput(""); setNameError(""); }}
              className="pressable flex-1 h-12 rounded-[12px] border-2 border-[#E1E7EF] text-[#475569] font-700 text-[14px] transition-colors hover:bg-[#F4F6F9]"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCategory}
              className="pressable flex-1 h-12 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_8px_rgba(10,134,160,0.18)] transition-opacity"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
