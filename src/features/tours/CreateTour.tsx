import { useState, useId } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreateTourData {
  name:        string;
  destination: string;
  startDate:   string;
  endDate:     string;
  budget:      string;
  currency:    string;
  note:        string;
}

interface FieldError {
  name?: string;
  endDate?: string;
  budget?: string;
}

// ─── Currency options ─────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "BDT", symbol: "৳", label: "BDT — ৳" },
  { code: "USD", symbol: "$", label: "USD — $" },
  { code: "EUR", symbol: "€", label: "EUR — €" },
  { code: "GBP", symbol: "£", label: "GBP — £" },
  { code: "INR", symbol: "₹", label: "INR — ₹" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronDown({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  optional,
  error,
  children,
  htmlFor,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-1.5">
        <label htmlFor={htmlFor} className="text-[12px] font-700 text-[#475569] uppercase tracking-wide">
          {label}
        </label>
        {optional && (
          <span className="text-[11px] font-500 text-[#94A3B8]">optional</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input base styles ─────────────────────────────────────────────────────────
const inputBase =
  "w-full bg-[#F4F6F9] rounded-[11px] px-4 h-12 text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border transition-colors";

const inputIdle   = "border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white";
const inputError  = "border-[#FECACA] bg-[#FFF5F5] focus:border-[#DC2626]";

// ─── Create Tour Screen ───────────────────────────────────────────────────────
export default function CreateTour({ onBack, onCreate }: {
  onBack:    () => void;
  onCreate:  (data: CreateTourData) => void;
}) {
  const nameId       = useId();
  const destId       = useId();
  const startId      = useId();
  const endId        = useId();
  const budgetId     = useId();
  const currencyId   = useId();
  const noteId       = useId();

  const [form, setForm] = useState<CreateTourData>({
    name:        "",
    destination: "",
    startDate:   "",
    endDate:     "",
    budget:      "",
    currency:    "BDT",
    note:        "",
  });

  const [errors, setErrors]     = useState<FieldError>({});
  const [touched, setTouched]   = useState<Set<string>>(new Set());

  const set = (key: keyof CreateTourData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (touched.has(key)) validate({ ...form, [key]: e.target.value });
  };

  const touch = (key: string) =>
    setTouched((prev) => new Set([...prev, key]));

  const validate = (data: CreateTourData): FieldError => {
    const errs: FieldError = {};

    if (!data.name.trim()) {
      errs.name = "Tour name is required.";
    }

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      errs.endDate = "End date can't be before start date.";
    }

    if (data.budget !== "" && (isNaN(Number(data.budget)) || Number(data.budget) <= 0)) {
      errs.budget = "Budget must be greater than zero.";
    }

    setErrors(errs);
    return errs;
  };

  const handleSubmit = () => {
    setTouched(new Set(["name", "endDate", "budget"]));
    const errs = validate(form);
    if (Object.keys(errs).length === 0) {
      onCreate(form);
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === form.currency) ?? CURRENCIES[0];

  return (
    <div className="h-full bg-[#F4F6F9] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px]">
          <button
            onClick={onBack}
            className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]"
            aria-label="Go back"
          >
            <IconChevronLeft size={22} />
          </button>
          <h1 className="text-[16px] font-700 text-[#0F172A] leading-none">Create tour</h1>
        </div>
      </div>

      {/* ── Scrollable form ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-6 space-y-5 max-w-[520px] mx-auto w-full">

          {/* Tour name */}
          <Field label="Tour name" error={errors.name} htmlFor={nameId}>
            <input
              id={nameId}
              type="text"
              placeholder="Cox's Bazar Getaway"
              value={form.name}
              onChange={set("name")}
              onBlur={() => { touch("name"); validate(form); }}
              className={`${inputBase} ${errors.name ? inputError : inputIdle}`}
            />
          </Field>

          {/* Destination */}
          <Field label="Destination" optional htmlFor={destId}>
            <input
              id={destId}
              type="text"
              placeholder="Cox's Bazar"
              value={form.destination}
              onChange={set("destination")}
              className={`${inputBase} ${inputIdle}`}
            />
          </Field>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" htmlFor={startId}>
              <input
                id={startId}
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                onBlur={() => { touch("startDate"); validate(form); }}
                className={`${inputBase} ${inputIdle} [color-scheme:light]`}
                style={{ colorScheme: "light" }}
              />
            </Field>
            <Field label="End date" error={errors.endDate} htmlFor={endId}>
              <input
                id={endId}
                type="date"
                value={form.endDate}
                onChange={set("endDate")}
                onBlur={() => { touch("endDate"); validate({ ...form, endDate: form.endDate }); }}
                min={form.startDate || undefined}
                className={`${inputBase} ${errors.endDate ? inputError : inputIdle} [color-scheme:light]`}
                style={{ colorScheme: "light" }}
              />
            </Field>
          </div>

          {/* Budget + Currency row */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <Field label="Estimated budget" optional error={errors.budget} htmlFor={budgetId}>
              <div className={`flex items-center bg-[#F4F6F9] rounded-[11px] border transition-colors h-12 ${errors.budget ? "border-[#FECACA] bg-[#FFF5F5]" : "border-[#E1E7EF] focus-within:border-[#0A86A0] focus-within:bg-white"}`}>
                <span className="pl-4 text-[16px] font-600 text-[#94A3B8] shrink-0 select-none">
                  {selectedCurrency.symbol}
                </span>
                <input
                  id={budgetId}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.budget}
                  onChange={set("budget")}
                  onBlur={() => { touch("budget"); validate(form); }}
                  className="flex-1 bg-transparent pl-1.5 pr-4 h-full text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none num"
                />
              </div>
              {errors.budget && (
                <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1 mt-1">
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  {errors.budget}
                </p>
              )}
            </Field>

            <Field label="Currency" htmlFor={currencyId}>
              <div className="relative h-12">
                <select
                  id={currencyId}
                  value={form.currency}
                  onChange={set("currency")}
                  className="appearance-none w-full h-full bg-[#F4F6F9] border border-[#E1E7EF] rounded-[11px] px-3 pr-8 text-[14px] font-600 text-[#0F172A] outline-none focus:border-[#0A86A0] focus:bg-white transition-colors cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <IconChevronDown size={15} />
                </span>
              </div>
            </Field>
          </div>

          {/* Note */}
          <Field label="Note" optional htmlFor={noteId}>
            <textarea
              id={noteId}
              placeholder="Anything the group should know…"
              value={form.note}
              onChange={set("note")}
              rows={3}
              className={`${inputBase} h-auto py-3 resize-none leading-relaxed ${inputIdle}`}
            />
          </Field>

          {/* ── Creator ownership strip ───────────────────────────────────── */}
          <div className="pt-1">
            <div className="border-t border-[#E1E7EF] mb-5" />
            <div className="flex items-center gap-3 bg-white border border-[#E1E7EF] rounded-[12px] px-4 py-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-700 shrink-0"
                style={{ backgroundColor: "#0A86A0" }}
              >
                RI
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-700 text-[#0F172A] leading-snug">Rafi</p>
                <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5">Owner · You</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#EFF9FB] text-[#0A7490] border border-[#A3DFE9]">
                Added automatically
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky bottom CTA ────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-[#E1E7EF] px-4 py-3 safe-bottom shrink-0">
        <button
          onClick={handleSubmit}
          className="pressable w-full flex items-center justify-center h-13 rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] active:scale-[0.985] transition-all"
          style={{ height: 52 }}
        >
          Create tour
        </button>
      </div>
    </div>
  );
}
