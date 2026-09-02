import { useState, useEffect } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function isoToDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function dateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isOutsideTourDates(
  iso: string,
  tourStart?: string,
  tourEnd?: string
): boolean {
  if (!tourStart && !tourEnd) return false;
  if (tourStart && iso < tourStart) return true;
  if (tourEnd   && iso > tourEnd)   return true;
  return false;
}

// Build the array of day cells for a given year/month (always 6 rows × 7 cols)
interface DayCell {
  iso:      string;
  day:      number;
  overflow: boolean; // belongs to prev or next month
}

function buildCalendarGrid(year: number, month: number): DayCell[] {
  const firstDow   = new Date(year, month, 1).getDay();          // 0 = Sun
  const daysInMo   = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: DayCell[] = [];

  // Overflow from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrev - i);
    cells.push({ iso: dateToISO(d), day: daysInPrev - i, overflow: true });
  }
  // Current month
  for (let d = 1; d <= daysInMo; d++) {
    cells.push({ iso: dateToISO(new Date(year, month, d)), day: d, overflow: false });
  }
  // Overflow from next month to fill to 42 cells
  let next = 1;
  while (cells.length < 42) {
    const d = new Date(year, month + 1, next++);
    cells.push({ iso: dateToISO(d), day: d.getDate(), overflow: true });
  }
  return cells;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function IconChevronRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function IconCalendar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

// ─── Date Sheet ───────────────────────────────────────────────────────────────
export default function DateSheet({
  selectedDate,
  tourStartDate,
  tourEndDate,
  onConfirm,
  onClose,
}: {
  selectedDate:  string;       // ISO or "" (means today)
  tourStartDate?: string;
  tourEndDate?:   string;
  onConfirm:     (iso: string) => void;
  onClose:       () => void;
}) {
  const today     = todayISO();
  const yesterday = yesterdayISO();

  // Treat "" as today internally
  const [draft, setDraft] = useState<string>(selectedDate || today);

  // Calendar view month
  const initDate = isoToDate(draft);
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const selectDraft = (iso: string) => {
    setDraft(iso);
    const d = isoToDate(iso);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const handleDone = () => {
    // "" means today; store "" if draft === today so the label shows "Today"
    onConfirm(draft === today ? "" : draft);
    onClose();
  };

  const cells   = buildCalendarGrid(viewYear, viewMonth);
  const outside = isOutsideTourDates(draft, tourStartDate, tourEndDate);

  // Human-readable label for the outside-tour notice
  const draftLabel = (() => {
    if (draft === today)     return "Today";
    if (draft === yesterday) return "Yesterday";
    const d = isoToDate(draft);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  })();

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-60 bg-black/30"
        style={{ animation: "fadeIn 150ms ease" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select date"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-70 bg-white rounded-t-[20px] safe-bottom"
        style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="w-9 h-1 bg-[#E1E7EF] rounded-full" />
        </div>

        {/* Title */}
        <div className="px-5 pt-2 pb-3 border-b border-[#F1F5F9]">
          <h2 className="text-[16px] font-700 text-[#0F172A]">Select date</h2>
        </div>

        <div className="px-4 pt-4 pb-2">

          {/* ── Quick picks ──────────────────────────────────────────────── */}
          <div className="flex gap-2 mb-5">
            {[
              { label: "Today",     iso: today     },
              { label: "Yesterday", iso: yesterday },
            ].map(({ label, iso }) => {
              const active = draft === iso;
              return (
                <button
                  key={iso}
                  onClick={() => selectDraft(iso)}
                  className={`pressable flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-700 border transition-all ${
                    active
                      ? "bg-[#0A86A0] text-white border-[#0A86A0]"
                      : "bg-white text-[#475569] border-[#E1E7EF]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Calendar header ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={prevMonth}
              className="pressable w-8 h-8 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9] transition-colors"
              aria-label="Previous month"
            >
              <IconChevronLeft size={18} />
            </button>
            <p className="text-[14px] font-700 text-[#0F172A]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <button
              onClick={nextMonth}
              className="pressable w-8 h-8 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9] transition-colors"
              aria-label="Next month"
            >
              <IconChevronRight size={18} />
            </button>
          </div>

          {/* ── Day-of-week labels ────────────────────────────────────────── */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="flex items-center justify-center h-8">
                <span className="text-[11px] font-700 text-[#94A3B8] uppercase">{d}</span>
              </div>
            ))}
          </div>

          {/* ── Calendar grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((cell) => {
              const isSelected = cell.iso === draft;
              const isToday    = cell.iso === today;
              const inTour     = tourStartDate && tourEndDate
                ? cell.iso >= tourStartDate && cell.iso <= tourEndDate
                : true;

              return (
                <div key={cell.iso} className="flex items-center justify-center h-9">
                  <button
                    onClick={() => selectDraft(cell.iso)}
                    className={`pressable relative w-9 h-9 flex items-center justify-center rounded-full text-[13px] font-600 transition-all ${
                      isSelected
                        ? "bg-[#0A86A0] text-white"
                        : cell.overflow
                        ? "text-[#D1D5DB]"
                        : !inTour
                        ? "text-[#C9D4DF]"
                        : "text-[#0F172A] hover:bg-[#F4F6F9]"
                    }`}
                  >
                    {cell.day}
                    {/* Today dot — only shown when not selected */}
                    {isToday && !isSelected && (
                      <span
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0A86A0]"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Outside tour dates notice ─────────────────────────────────── */}
          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: outside ? 40 : 0, opacity: outside ? 1 : 0 }}
          >
            <div className="flex items-center gap-1.5 mt-3 px-1 py-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px]">
              <IconCalendar size={13} />
              <p className="text-[12px] font-600 text-[#B45309]">
                {draftLabel} is outside the tour dates
              </p>
            </div>
          </div>
        </div>

        {/* Done CTA */}
        <div className="px-4 pt-3 pb-4">
          <button
            onClick={handleDone}
            className="pressable w-full flex items-center justify-center rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] transition-all"
            style={{ height: 52 }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
