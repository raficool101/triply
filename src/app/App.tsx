import { useState, useRef, useEffect, type ReactNode } from "react";
import { AuthFlow } from "../features/auth/Auth";
import TourList from "../features/tours/TourList";
import CreateTour from "../features/tours/CreateTour";
import InviteMembers from "../features/tours/InviteMembers";
import InviteAcceptFlow from "../features/tours/InviteAccept";
import AddExpense from "../features/expenses/AddExpense";
import { Avatar } from "../components/shared/Avatar";
import { fmt } from "../lib/format";

const DEMO_INVITE_MODE = false;

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "home" | "expenses" | "members" | "settlement";
type SyncStatus = "online" | "offline" | "syncing" | "pending" | "failed";

interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  balance: number;
  paid: number;
  isMe?: boolean;
  role?: "owner" | "member" | "guest";
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: "food" | "lodging" | "transport" | "activity" | "other";
  paidBy: string;
  splitIds: string[];
  date: string;
  dateIso: string;
  note?: string;
  addedBy: string;
  addedAt: string;
  syncStatus?: "pending" | "failed";
}

interface RecordedSettlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  dateIso: string;
  recordedBy: string;
  syncStatus?: "pending" | "failed";
}

interface SuggestedPayment {
  from: string;
  to: string;
  amount: number;
}

type SubScreen =
  | { type: "expense-detail"; id: string }
  | { type: "member-detail"; id: string }
  | { type: "settlement-history" }
  | null;

// ─── Sample Data ──────────────────────────────────────────────────────────────
const TOUR = {
  name:      "Cox's Bazar Getaway",
  dates:     "Aug 22–27, 2026",
  startDate: "2026-08-22",
  endDate:   "2026-08-27",
};

const MEMBERS_INIT: Member[] = [
  { id: "1", name: "Farhan Ahmed",    initials: "FA", color: "#7C3AED", paid: 480,   balance: -5967, role: "member" },
  { id: "2", name: "Nadia Islam",     initials: "NI", color: "#0A86A0", paid: 19050, balance: 12603, role: "member" },
  { id: "3", name: "Rakib Hassan",    initials: "RH", color: "#059669", paid: 6000,  balance: -447,  role: "member" },
  { id: "4", name: "Tanha Khanam",    initials: "TK", color: "#D97706", paid: 2400,  balance: -4047, role: "member" },
  { id: "5", name: "Imran Chowdhury", initials: "IC", color: "#E11D48", paid: 0,     balance: -6447, role: "member" },
  { id: "6", name: "You",             initials: "RI", color: "#0A86A0", paid: 11400, balance: 4953,  isMe: true, role: "owner" },
  { id: "7", name: "Hasan Ahmed",     initials: "HA", color: "#64748B", paid: 0,     balance: -650,  role: "guest" },
];

const EXPENSES_INIT: Expense[] = [
  {
    id: "1", title: "Hotel Seagull — 2 nights", amount: 14800, category: "lodging",
    paidBy: "2", splitIds: ["1","2","3","4","5","6"], date: "Aug 22", dateIso: "2026-08-22",
    addedBy: "2", addedAt: "Aug 22 at 2:15 PM",
  },
  {
    id: "2", title: "Hilsha fish dinner at Jhawban", amount: 4200, category: "food",
    paidBy: "6", splitIds: ["1","2","3","4","5","6"], date: "Aug 23", dateIso: "2026-08-23",
    addedBy: "6", addedAt: "Aug 23 at 8:45 PM",
    note: "Best hilsha in Cox's Bazar — we ordered the full fish.",
  },
  {
    id: "3", title: "CNG auto from station", amount: 480, category: "transport",
    paidBy: "1", splitIds: ["1","2","3","4","5","6"], date: "Aug 22", dateIso: "2026-08-22",
    addedBy: "1", addedAt: "Aug 22 at 11:20 AM",
  },
  {
    id: "4", title: "Beach chair & umbrella rentals", amount: 2400, category: "activity",
    paidBy: "4", splitIds: ["1","2","3","4","5","6"], date: "Aug 24", dateIso: "2026-08-24",
    addedBy: "4", addedAt: "Aug 24 at 10:00 AM",
  },
  {
    id: "5", title: "Breakfast buffet × 6", amount: 3600, category: "food",
    paidBy: "2", splitIds: ["1","2","3","4","5","6"], date: "Aug 24", dateIso: "2026-08-24",
    addedBy: "6", addedAt: "Aug 24 at 9:30 AM",
  },
  {
    id: "6", title: "Speed boat to Saint Martin", amount: 6000, category: "transport",
    paidBy: "3", splitIds: ["1","2","3","4","5","6"], date: "Aug 25", dateIso: "2026-08-25",
    addedBy: "3", addedAt: "Aug 25 at 7:00 AM",
    syncStatus: "pending",
  },
  {
    id: "7", title: "Mermaid Beach Resort — 1 night", amount: 7200, category: "lodging",
    paidBy: "6", splitIds: ["1","2","3","4","5","6"], date: "Aug 25", dateIso: "2026-08-25",
    addedBy: "6", addedAt: "Aug 25 at 6:45 PM",
  },
  {
    id: "8", title: "Hasan's taxi to resort", amount: 650, category: "transport",
    paidBy: "2", splitIds: ["7"], date: "Aug 22", dateIso: "2026-08-22",
    addedBy: "6", addedAt: "Aug 22 at 3:00 PM",
  },
];

const RECORDED_SETTLEMENTS_INIT: RecordedSettlement[] = [
  { id: "s1", from: "5", to: "2", amount: 6447, date: "Aug 26", dateIso: "2026-08-26", recordedBy: "6" },
  { id: "s2", from: "1", to: "2", amount: 5967, date: "Aug 26", dateIso: "2026-08-26", recordedBy: "1" },
];

const BUDGET = 60000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeMembers(members: Member[], expenses: Expense[], recordedSettlements: RecordedSettlement[] = []): Member[] {
  return members.map((m) => {
    const paid       = expenses.filter((e) => e.paidBy === m.id).reduce((s, e) => s + e.amount, 0);
    const share      = expenses.filter((e) => e.splitIds.includes(m.id)).reduce((s, e) => s + e.amount / e.splitIds.length, 0);
    const settledOut = recordedSettlements.filter((s) => s.from === m.id).reduce((sum, s) => sum + s.amount, 0);
    const settledIn  = recordedSettlements.filter((s) => s.to   === m.id).reduce((sum, s) => sum + s.amount, 0);
    return { ...m, paid, balance: Math.round(paid - share + settledOut - settledIn) };
  });
}

function hasMemberFinancialHistory(id: string, expenses: Expense[], recordedSettlements: RecordedSettlement[]): boolean {
  return (
    expenses.some((e) => e.paidBy === id || e.splitIds.includes(id)) ||
    recordedSettlements.some((s) => s.from === id || s.to === id)
  );
}

function computeSuggestedPayments(members: Member[]): SuggestedPayment[] {
  const payments: SuggestedPayment[] = [];
  const creds = members.filter((m) => m.balance > 1).sort((a, b) => b.balance - a.balance).map((m) => ({ id: m.id, bal: m.balance }));
  const debts = members.filter((m) => m.balance < -1).sort((a, b) => a.balance - b.balance).map((m) => ({ id: m.id, bal: m.balance }));
  let ci = 0, di = 0;
  while (ci < creds.length && di < debts.length) {
    const amount = Math.min(creds[ci].bal, -debts[di].bal);
    if (amount >= 1) payments.push({ from: debts[di].id, to: creds[ci].id, amount: Math.round(amount) });
    creds[ci].bal -= amount;
    debts[di].bal += amount;
    if (creds[ci].bal < 1) ci++;
    if (debts[di].bal > -1) di++;
  }
  return payments;
}

const CATEGORY_META: Record<
  Expense["category"],
  { icon: ReactNode; label: string; bg: string; fg: string }
> = {
  food:      { icon: <IconUtensils size={14} />, label: "Food",      bg: "#FFF7ED", fg: "#C2410C" },
  lodging:   { icon: <IconBed      size={14} />, label: "Lodging",   bg: "#F0F9FF", fg: "#0369A1" },
  transport: { icon: <IconCar      size={14} />, label: "Transport", bg: "#F5F3FF", fg: "#6D28D9" },
  activity:  { icon: <IconStar     size={14} />, label: "Activity",  bg: "#FFF1F2", fg: "#BE123C" },
  other:     { icon: <IconDots     size={14} />, label: "Other",     bg: "#F8FAFC", fg: "#475569" },
};

const NAV_ITEMS: { id: Tab; label: string; icon: (active: boolean) => ReactNode }[] = [
  {
    id: "home",
    label: "Home",
    icon: (a) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" fill="white" stroke={a ? "white" : "currentColor"} strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: (a) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h16v20l-2-2-2 2-2-2-2 2-2-2-2 2-2-2V2z" fill={a ? "currentColor" : "none"} />
        <path d="M8 7h8M8 11h8M8 15h4" stroke={a ? "white" : "currentColor"} strokeWidth={1.5} />
      </svg>
    ),
  },
  {
    id: "members",
    label: "Members",
    icon: (a) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" fill={a ? "currentColor" : "none"} />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" />
      </svg>
    ),
  },
  {
    id: "settlement",
    label: "Settle",
    icon: (a) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={a ? 2.25 : 1.75}>
        <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
      </svg>
    ),
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconPlus({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
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
function IconChevronRight({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function IconDots({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="5"  cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function IconDotsV({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="5"  r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}
function IconWifiOff({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
    </svg>
  );
}
function IconRefresh({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}
function IconAlertCircle({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8"  x2="12"    y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function IconCloud({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  );
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function IconUtensils({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}
function IconBed({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16M2 8h20v12M2 12h20M6 8V4" />
      <rect x="6" y="10" width="4" height="2" rx="1" />
    </svg>
  );
}
function IconCar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 104 0m6 0a2 2 0 104 0" />
      <path d="M3 12h18" />
    </svg>
  );
}
function IconStar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function IconReceipt({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h16v20l-2-2-2 2-2-2-2 2-2-2-2 2-2-2V2z" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}
function IconMapPin({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconSearch({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconX({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconEdit({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconTrash({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}
function IconUserPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
function IconUserX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="11" x2="23" y2="17" />
      <line x1="23" y1="11" x2="17" y2="17" />
    </svg>
  );
}
function IconInfo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="8.01" />
      <path d="M12 12v4" />
    </svg>
  );
}
function IconNote({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}
function IconHistory({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}
function IconCheckCircle2({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// ─── Primitive Components ─────────────────────────────────────────────────────
// `Avatar` moved to `src/components/shared/Avatar.tsx`

function Badge({ label, variant }: { label: string; variant: "positive" | "negative" | "warning" | "neutral" | "brand" }) {
  const styles = {
    positive: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",
    negative: "bg-[#FFF5F5] text-[#DC2626] border-[#FECACA]",
    warning:  "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    neutral:  "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    brand:    "bg-[#EFF9FB] text-[#0A86A0] border-[#A3DFE9]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-600 border ${styles[variant]}`}>
      {label}
    </span>
  );
}

function SyncBanner({ status }: { status: SyncStatus }) {
  if (status === "online" || status === "pending") return null;
  if (status === "syncing") {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 px-4 text-[11px] font-500 border-b border-[#A3DFE9]" style={{ backgroundColor: "#EFF9FB", color: "#0A7490" }}>
        <IconRefresh size={12} /><span>Syncing…</span>
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div className="flex items-center justify-center gap-1.5 py-[7px] px-4 text-[12px] font-500" style={{ backgroundColor: "#1C1C1E", color: "#FFFFFF" }}>
        <IconWifiOff size={13} /><span>Offline · 3 changes waiting</span>
      </div>
    );
  }
  return (
    <div className="flex items-center px-4 py-[7px] text-[12px] font-500 border-b border-[#FECACA]" style={{ backgroundColor: "#FFF5F5", color: "#DC2626" }}>
      <IconAlertCircle size={13} />
      <span className="ml-1.5 flex-1">Sync failed</span>
      <button className="pressable font-700 underline underline-offset-2">Retry</button>
    </div>
  );
}

function AppHeader({
  title, subtitle, scrolled = false, showBack = false, onBack, action, inlineSync,
}: {
  title: string; subtitle?: string; scrolled?: boolean; showBack?: boolean;
  onBack?: () => void; action?: ReactNode; inlineSync?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 h-[52px]">
      {showBack && (
        <button onClick={onBack} className="pressable -ml-1 w-9 h-9 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
          <IconChevronLeft />
        </button>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h1 className="text-[15px] font-700 text-[#0F172A] truncate leading-none">{title}</h1>
        {subtitle && (
          <div className="overflow-hidden transition-all duration-200 ease-out" style={{ maxHeight: scrolled ? 0 : 18, opacity: scrolled ? 0 : 1, marginTop: scrolled ? 0 : 3 }}>
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-[12px] text-[#94A3B8] font-500 leading-none truncate">{subtitle}</p>
              {inlineSync && (
                <span className="flex items-center gap-[3px] text-[11px] font-500 text-[#94A3B8] shrink-0">
                  <IconCloud size={11} />{inlineSync}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function BottomNavBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex items-stretch h-[56px]">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button key={item.id} onClick={() => onChange(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] nav-item pressable ${isActive ? "text-[#0A86A0]" : "text-[#94A3B8]"}`}
            aria-label={item.label} aria-current={isActive ? "page" : undefined}
          >
            {item.icon(isActive)}
            <span className={`text-[10px] font-600 ${isActive ? "text-[#0A86A0]" : "text-[#94A3B8]"}`}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SidebarNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="flex-1 py-2 px-3 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button key={item.id} onClick={() => onChange(item.id)}
            className={`pressable flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] mb-0.5 text-left transition-colors ${isActive ? "bg-[#EFF9FB] text-[#0A86A0]" : "text-[#475569] hover:bg-[#F4F6F9] hover:text-[#0F172A]"}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="shrink-0">{item.icon(isActive)}</span>
            <span className="text-[14px] font-600">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="w-16 h-16 rounded-[18px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] mb-4">
        {icon}
      </div>
      <p className="text-[16px] font-700 text-[#0F172A] mb-2">{title}</p>
      <p className="text-[14px] text-[#94A3B8] font-500 leading-relaxed max-w-[260px]">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Bottom sheet scaffold
function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} style={{ animation: "fadeIn 150ms ease" }} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[24px] z-50 safe-bottom" style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#E1E7EF] rounded-full" /></div>
        {children}
      </div>
    </>
  );
}

// ─── Feature: Home View ───────────────────────────────────────────────────────
function StatRow({ expenses, members, empty = false }: { expenses: Expense[]; members: Member[]; empty?: boolean }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const me = members.find((m) => m.isMe);
  const myShare = me ? expenses.filter((e) => e.splitIds.includes(me.id)).reduce((s, e) => s + e.amount / e.splitIds.length, 0) : 0;
  const myShareRounded = Math.round(myShare);
  const myBalance = me?.balance ?? 0;
  const remaining = BUDGET - total;
  const progress = Math.min(total / BUDGET, 1);

  if (empty || !me) {
    return (
      <div className="px-4 pt-4 pb-3">
        <div className="bg-white rounded-[16px] border border-[#E1E7EF] overflow-hidden">
          <div className="px-5 pt-3 pb-2">
            <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Total spent</p>
            <span className="num text-[32px] font-800 text-[#0F172A] leading-none">{fmt(0)}</span>
          </div>
          <div className="px-5 pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="num text-[12px] font-500 text-[#94A3B8]">{fmt(0)} of {fmt(BUDGET)}</span>
              <span className="num text-[12px] font-600 text-[#475569]">{fmt(BUDGET)} remaining</span>
            </div>
            <div className="h-[3px] bg-[#F1F5F9] rounded-full overflow-hidden"><div className="h-full bg-[#0A86A0] rounded-full" style={{ width: "0%" }} /></div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#F1F5F9]">
            <div className="px-5 py-3"><p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your share</p><p className="num text-[18px] font-700 text-[#0F172A] leading-snug">{fmt(0)}</p></div>
            <div className="px-5 py-3"><p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your balance</p><p className="num text-[18px] font-700 leading-snug text-[#94A3B8]">Settled</p></div>
          </div>
        </div>
      </div>
    );
  }

  const balanceZero = myBalance === 0;
  const balancePositive = myBalance > 0;
  const balanceColor = balanceZero ? "#94A3B8" : balancePositive ? "#15803D" : "#DC2626";
  const balanceLabel = balanceZero ? "Settled" : balancePositive ? `Receive ${fmt(myBalance)}` : `Owe ${fmt(myBalance)}`;

  return (
    <div className="px-4 pt-4 pb-3">
      <div className="bg-white rounded-[16px] border border-[#E1E7EF] overflow-hidden">
        <div className="px-5 pt-3 pb-2">
          <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Total spent</p>
          <span className="num text-[32px] font-800 text-[#0F172A] leading-none">{fmt(total)}</span>
        </div>
        <div className="px-5 pb-3 border-b border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="num text-[12px] font-500 text-[#94A3B8]">{fmt(total)} of {fmt(BUDGET)}</span>
            <span className="num text-[12px] font-600 text-[#475569]">{fmt(remaining)} remaining</span>
          </div>
          <div className="h-[3px] bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className="h-full bg-[#0A86A0] rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-[#F1F5F9]">
          <div className="px-5 py-3">
            <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your share</p>
            <p className="num text-[18px] font-700 text-[#0F172A] leading-snug">{fmt(myShareRounded)}</p>
            <p className="num text-[11px] text-[#94A3B8] font-500 mt-0.5">Paid {fmt(me.paid)}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your balance</p>
            <p className="num text-[18px] font-700 leading-snug" style={{ color: balanceColor }}>{balanceLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentExpenses({ expenses, members, onViewAll, empty = false, onAddExpense }: {
  expenses: Expense[]; members: Member[]; onViewAll: () => void; empty?: boolean; onAddExpense?: () => void;
}) {
  if (empty) {
    return (
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-700 text-[#0F172A]">Recent expenses</h2>
        </div>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] px-5 py-6 flex flex-col items-center text-center gap-3">
          <div>
            <p className="text-[14px] font-700 text-[#0F172A] mb-1">No expenses yet</p>
            <p className="text-[13px] text-[#94A3B8] font-500 leading-relaxed max-w-[220px]">Add your first expense to start tracking the trip.</p>
          </div>
          <button onClick={onAddExpense} className="pressable flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#0A86A0] text-white font-700 text-[13px] shadow-[0_2px_8px_rgba(10,134,160,0.18)]">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add expense
          </button>
        </div>
      </section>
    );
  }
  const recent = expenses.slice(0, 4);
  return (
    <section className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-700 text-[#0F172A]">Recent expenses</h2>
        <button onClick={onViewAll} className="text-[13px] font-600 text-[#0A86A0] pressable">View all</button>
      </div>
      <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
        {recent.map((expense) => <ExpenseRow key={expense.id} expense={expense} members={members} />)}
      </div>
    </section>
  );
}

function QuickBalances({ members, onViewAll, empty = false }: { members: Member[]; onViewAll: () => void; empty?: boolean }) {
  if (empty) {
    return (
      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3"><h2 className="text-[14px] font-700 text-[#0F172A]">Balances</h2></div>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] px-5 py-5 flex items-center justify-center">
          <p className="text-[13px] text-[#94A3B8] font-500 text-center leading-relaxed">Balances will appear after expenses are added.</p>
        </div>
      </section>
    );
  }
  const sorted = [...members].sort((a, b) => b.balance - a.balance).slice(0, 3);
  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-700 text-[#0F172A]">Balances</h2>
        <button onClick={onViewAll} className="text-[13px] font-600 text-[#0A86A0] pressable">View all</button>
      </div>
      <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
        {sorted.map((member) => <MemberRowCompact key={member.id} member={member} />)}
      </div>
    </section>
  );
}

function HomeView({ expenses, members, onTabChange, empty = false, onAddExpense }: {
  expenses: Expense[]; members: Member[]; onTabChange: (t: Tab) => void; empty?: boolean; onAddExpense?: () => void;
}) {
  return (
    <div>
      <StatRow expenses={expenses} members={members} empty={empty} />
      <RecentExpenses expenses={expenses} members={members} onViewAll={() => onTabChange("expenses")} empty={empty} onAddExpense={onAddExpense} />
      <QuickBalances members={members} onViewAll={() => onTabChange("members")} empty={empty} />
    </div>
  );
}

// ─── Feature: Expense Row ─────────────────────────────────────────────────────
function ExpenseRow({
  expense, members, onTap,
}: {
  expense: Expense; members: Member[]; onTap?: () => void;
}) {
  const payer = members.find((m) => m.id === expense.paidBy);
  const cat = CATEGORY_META[expense.category];
  const me = members.find((m) => m.isMe);
  const inSplit = me ? expense.splitIds.includes(me.id) : false;
  const myShare = inSplit ? Math.round(expense.amount / expense.splitIds.length) : 0;
  const isMe = payer?.isMe;

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 ${onTap ? "pressable cursor-pointer" : ""}`} onClick={onTap}>
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cat.bg, color: cat.fg }}>
        {cat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-[#0F172A] truncate leading-snug">{expense.title}</p>
        <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 leading-snug">
          {isMe ? "You paid" : payer ? `${payer.name.split(" ")[0]} paid` : "Unknown"} · {expense.date}
        </p>
        {expense.syncStatus === "pending" && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-600 text-[#B45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] shrink-0" />
            Pending sync
          </span>
        )}
        {expense.syncStatus === "failed" && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-600 text-[#DC2626]">
            <IconAlertCircle size={11} />
            Sync failed
          </span>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="num text-[14px] font-700 text-[#0F172A]">{fmt(expense.amount)}</p>
        {inSplit && <p className="num text-[11px] text-[#94A3B8] font-500 mt-0.5">your {fmt(myShare)}</p>}
      </div>
    </div>
  );
}

// ─── Feature: Expenses View ───────────────────────────────────────────────────
type ExpenseFilter = "all" | "i-paid" | "my-expenses";

function ExpensesView({
  expenses, members, onTapExpense,
}: {
  expenses: Expense[]; members: Member[]; onTapExpense: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ExpenseFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const me = members.find((m) => m.isMe);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const filterTabs: { id: ExpenseFilter; label: string }[] = [
    { id: "all",         label: "All"          },
    { id: "i-paid",      label: "I paid"       },
    { id: "my-expenses", label: "My expenses"  },
  ];

  const filtered = expenses.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const payer = members.find((m) => m.id === e.paidBy);
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchPayer = payer?.name.toLowerCase().includes(q) ?? false;
      const matchCat   = CATEGORY_META[e.category].label.toLowerCase().includes(q);
      if (!matchTitle && !matchPayer && !matchCat) return false;
    }
    if (filter === "i-paid"      && e.paidBy !== me?.id)             return false;
    if (filter === "my-expenses" && !e.splitIds.includes(me?.id ?? "")) return false;
    if (categoryFilter && e.category !== categoryFilter)              return false;
    return true;
  });

  // Group by date, sorted newest first
  const uniqueDates = [...new Set(filtered.map((e) => e.dateIso))].sort((a, b) => b.localeCompare(a));
  const grouped = uniqueDates.map((iso) => ({
    iso,
    label: new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    items: filtered.filter((e) => e.dateIso === iso),
  }));

  const hasActiveFilters = filter !== "all" || !!categoryFilter || !!searchQuery;
  const catLabel = categoryFilter ? CATEGORY_META[categoryFilter as Expense["category"]]?.label : null;

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-0 bg-white border-b border-[#E1E7EF] z-10">
        {/* Search */}
        <div className="px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-2.5 bg-[#F4F6F9] rounded-[11px] px-3 h-9 border border-[#E1E7EF] focus-within:border-[#0A86A0] focus-within:bg-white transition-colors">
            <span className="text-[#94A3B8] shrink-0"><IconSearch size={15} /></span>
            <input
              type="text"
              placeholder="Search expenses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] font-500 text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="pressable text-[#94A3B8] shrink-0">
                <IconX size={14} />
              </button>
            )}
          </div>
        </div>
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto scrollbar-none">
          {filterTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`pressable shrink-0 px-3 py-1.5 rounded-full text-[12px] font-600 transition-colors ${
                filter === t.id ? "bg-[#0A86A0] text-white" : "bg-[#F4F6F9] text-[#475569]"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="w-px h-5 bg-[#E1E7EF] shrink-0 mx-0.5" />
          {/* Category chip */}
          <button
            onClick={() => setShowCategorySheet(true)}
            className={`pressable shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-600 transition-colors ${
              categoryFilter ? "bg-[#EFF9FB] text-[#0A7490] border border-[#A3DFE9]" : "bg-[#F4F6F9] text-[#475569]"
            }`}
          >
            {catLabel ? (
              <>
                <span>{catLabel}</span>
                <span
                  className="pressable"
                  onClick={(e) => { e.stopPropagation(); setCategoryFilter(null); }}
                >
                  <IconX size={12} />
                </span>
              </>
            ) : (
              <>Category <IconChevronRight size={12} /></>
            )}
          </button>
          <div className="flex-1 min-w-[8px]" />
          <span className="num shrink-0 text-[12px] font-500 text-[#94A3B8]">
            {fmt(total)}
          </span>
        </div>
      </div>

      {/* Expense count summary */}
      {filtered.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <p className="text-[12px] font-500 text-[#94A3B8]">
            {filtered.length} {filtered.length === 1 ? "expense" : "expenses"}
            {hasActiveFilters && " match your filter"}
          </p>
        </div>
      )}

      {/* Grouped expenses */}
      {grouped.length > 0 ? (
        <div className="px-4 pt-2 pb-4 space-y-4">
          {grouped.map(({ iso, label, items }) => (
            <div key={iso}>
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-1.5">{label}</p>
              <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                {items.map((e) => (
                  <ExpenseRow key={e.id} expense={e} members={members} onTap={() => onTapExpense(e.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<IconReceipt size={32} />}
          title={searchQuery ? "No matches" : hasActiveFilters ? "No expenses here" : "No expenses yet"}
          body={
            searchQuery
              ? `No expenses match "${searchQuery}". Try a different search.`
              : hasActiveFilters
              ? "No expenses match the selected filter."
              : "Tap '+ Add Expense' to record your first shared expense."
          }
        />
      )}

      {/* Category picker sheet */}
      {showCategorySheet && (
        <Sheet onClose={() => setShowCategorySheet(false)}>
          <div className="px-5 pt-3 pb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-700 text-[#0F172A]">Filter by category</h2>
            <button onClick={() => setShowCategorySheet(false)} className="pressable text-[14px] font-600 text-[#94A3B8]">Done</button>
          </div>
          <div className="px-3 py-2 space-y-0.5 pb-6">
            {(Object.keys(CATEGORY_META) as Expense["category"][]).map((key) => {
              const cat = CATEGORY_META[key];
              const isSelected = categoryFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => { setCategoryFilter(isSelected ? null : key); setShowCategorySheet(false); }}
                  className={`pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors ${isSelected ? "bg-[#EFF9FB]" : "hover:bg-[#F4F6F9]"}`}
                >
                  <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                    {cat.icon}
                  </div>
                  <span className={`text-[15px] font-600 ${isSelected ? "text-[#0A86A0]" : "text-[#0F172A]"}`}>{cat.label}</span>
                  {isSelected && <span className="ml-auto text-[#0A86A0]"><IconCheck size={16} /></span>}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ─── Feature: Expense Details ─────────────────────────────────────────────────
function ExpenseOverflowSheet({ canEdit, onEdit, onDelete, onClose }: {
  canEdit: boolean; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-3 py-3 space-y-0.5">
        {canEdit ? (
          <>
            <button
              onClick={() => { onEdit(); onClose(); }}
              className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]"
            >
              <div className="w-8 h-8 rounded-[9px] bg-[#F4F6F9] flex items-center justify-center text-[#475569] shrink-0">
                <IconEdit size={16} />
              </div>
              <div>
                <p className="text-[15px] font-600 text-[#0F172A]">Edit expense</p>
                <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Change amount, description, split</p>
              </div>
            </button>
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#FFF5F5]"
            >
              <div className="w-8 h-8 rounded-[9px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
                <IconTrash size={16} />
              </div>
              <div>
                <p className="text-[15px] font-600 text-[#DC2626]">Delete expense</p>
                <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Balances will update for all participants</p>
              </div>
            </button>
          </>
        ) : (
          <div className="px-4 py-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] shrink-0 mt-0.5">
              <IconInfo size={16} />
            </div>
            <p className="text-[14px] font-500 text-[#475569] leading-relaxed">
              Only the expense creator or Tour Owner can edit or delete this expense.
            </p>
          </div>
        )}
      </div>
      <div className="px-3 pb-4 pt-1">
        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Cancel</button>
      </div>
    </Sheet>
  );
}

function DeleteExpenseSheet({ expense, onConfirm, onClose }: {
  expense: Expense; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#FFF5F5] text-[#DC2626] shrink-0">
            <IconTrash size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A] leading-snug">Delete expense?</p>
            <p className="text-[13px] font-500 text-[#94A3B8] mt-0.5 truncate max-w-[220px]">{expense.title}</p>
          </div>
        </div>
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
          <p className="text-[13px] font-500 text-[#DC2626] leading-relaxed">
            This will remove <span className="font-700">{fmt(expense.amount)}</span> from the trip total and update balances for {expense.splitIds.length} {expense.splitIds.length === 1 ? "participant" : "participants"}.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Cancel</button>
          <button onClick={onConfirm} className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px]">Delete</button>
        </div>
      </div>
    </Sheet>
  );
}

function ExpenseDetails({
  expense, members, onBack, onEdit, onDelete,
}: {
  expense: Expense; members: Member[]; onBack: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const payer   = members.find((m) => m.id === expense.paidBy);
  const adder   = members.find((m) => m.id === expense.addedBy);
  const cat     = CATEGORY_META[expense.category];
  const me      = members.find((m) => m.isMe);
  const canEdit = me ? (me.id === expense.addedBy || me.role === "owner") : false;
  const inSplit = me ? expense.splitIds.includes(me.id) : false;

  const perPersonShare = expense.amount / expense.splitIds.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden"
      style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button onClick={onBack} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
            <IconChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">Expense detail</h1>
          <button onClick={() => setShowOverflow(true)} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="More options">
            <IconDotsV size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto w-full pb-8">
          {/* Amount hero */}
          <div className="bg-white px-5 pt-5 pb-5 border-b border-[#E1E7EF]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                <div style={{ transform: "scale(1.35)" }}>{cat.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="num text-[30px] font-800 text-[#0F172A] leading-none">{fmt(expense.amount)}</p>
                <p className="text-[15px] font-600 text-[#0F172A] mt-1.5 leading-snug">{expense.title}</p>
                {expense.syncStatus === "pending" && (
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-600 text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                    Pending sync
                  </span>
                )}
                {expense.syncStatus === "failed" && (
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-600 text-[#DC2626] bg-[#FFF5F5] border border-[#FECACA] rounded-full px-2.5 py-1">
                    <IconAlertCircle size={11} />
                    Sync failed · <button className="underline font-700">Retry</button>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata rows */}
          <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F4F6F9]">
              <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                <div style={{ transform: "scale(0.85)" }}>{cat.icon}</div>
              </div>
              <span className="text-[13px] font-600 text-[#475569] w-[88px] shrink-0">Category</span>
              <span className="text-[14px] font-600 text-[#0F172A]">{cat.label}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F4F6F9]">
              <div className="w-7 h-7 rounded-[8px] bg-[#F1F5F9] flex items-center justify-center shrink-0 text-[#475569]">
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className="text-[13px] font-600 text-[#475569] w-[88px] shrink-0">Date</span>
              <span className="text-[14px] font-600 text-[#0F172A]">{expense.date}, 2026</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-7 h-7 shrink-0">
                {payer && <Avatar member={payer} size="sm" />}
              </div>
              <span className="text-[13px] font-600 text-[#475569] w-[88px] shrink-0">Paid by</span>
              <span className="text-[14px] font-600 text-[#0F172A]">
                {payer ? (payer.isMe ? `${payer.name} (You)` : payer.name) : "Unknown"}
              </span>
            </div>
          </div>

          {/* Split breakdown */}
          <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4F6F9]">
              <p className="text-[13px] font-700 text-[#0F172A]">Split between</p>
              <span className="text-[12px] font-600 text-[#94A3B8]">{expense.splitIds.length} {expense.splitIds.length === 1 ? "person" : "people"} · equal split</span>
            </div>
            {expense.splitIds.map((sid) => {
              const m = members.find((x) => x.id === sid);
              if (!m) return null;
              const isYou = m.isMe;
              const isPayer = m.id === expense.paidBy;
              return (
                <div key={sid} className={`flex items-center gap-3 px-4 py-3 border-b border-[#F4F6F9] last:border-b-0 ${isYou ? "bg-[#EFF9FB]" : ""}`}>
                  <Avatar member={m} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-600 text-[#0F172A] leading-snug">
                      {isYou ? "You" : m.name}
                      {isPayer && <span className="ml-1.5 text-[11px] font-600 text-[#0A86A0] bg-[#EFF9FB] border border-[#A3DFE9] px-1.5 py-0.5 rounded-full align-middle">Paid</span>}
                    </p>
                    {m.role === "guest" && <p className="text-[11px] text-[#94A3B8] font-500 mt-0.5">Guest</p>}
                  </div>
                  <p className={`num text-[14px] font-700 shrink-0 ${isYou ? "text-[#0A86A0]" : "text-[#0F172A]"}`}>
                    {fmt(Math.round(perPersonShare))}
                  </p>
                </div>
              );
            })}
            {inSplit && (
              <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E1E7EF]">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-600 text-[#475569]">Your net impact</p>
                  <p className={`num text-[13px] font-700 ${payer?.isMe ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                    {payer?.isMe
                      ? `+${fmt(Math.round(expense.amount - perPersonShare))} (you get back)`
                      : `−${fmt(Math.round(perPersonShare))} (you owe)`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {expense.note && (
            <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#F1F5F9] flex items-center justify-center shrink-0 text-[#94A3B8] mt-0.5">
                  <IconNote size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Note</p>
                  <p className="text-[14px] font-500 text-[#475569] leading-relaxed">{expense.note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Added by */}
          <div className="px-4 mt-3">
            <p className="text-[12px] font-500 text-[#94A3B8] text-center">
              Added by {adder ? (adder.isMe ? "you" : adder.name) : "unknown"} · {expense.addedAt}
            </p>
          </div>
        </div>
      </div>

      {/* Overflow menu */}
      {showOverflow && (
        <ExpenseOverflowSheet
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={() => setShowDeleteConfirm(true)}
          onClose={() => setShowOverflow(false)}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <DeleteExpenseSheet
          expense={expense}
          onConfirm={onDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── Feature: Member Row (compact, used in Home quick balances) ───────────────
function MemberRowCompact({ member }: { member: Member }) {
  const isOwed  = member.balance > 0;
  const isEven  = member.balance === 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Avatar member={member} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-[#0F172A] leading-snug truncate">{member.isMe ? "You" : member.name}</p>
      </div>
      <div className="text-right shrink-0">
        {isEven
          ? <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
          : <>
              <p className={`num text-[14px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                {isOwed ? "+" : "−"}{fmt(member.balance)}
              </p>
              <p className="text-[11px] text-[#94A3B8] font-500 mt-0.5">{isOwed ? "gets back" : "owes"}</p>
            </>
        }
      </div>
    </div>
  );
}

// ─── Feature: Member Row (full, used in Members tab) ─────────────────────────
function MemberRow({
  member, expenses, onTap,
}: {
  member: Member; expenses: Expense[]; onTap?: () => void;
}) {
  const isOwed    = member.balance > 0;
  const isEven    = member.balance === 0;
  const isGuest   = member.role === "guest";
  const isOwner   = member.role === "owner";
  const shareAmt  = Math.round(expenses.filter((e) => e.splitIds.includes(member.id)).reduce((s, e) => s + e.amount / e.splitIds.length, 0));

  let roleLabel = "";
  if (isOwner && member.isMe) roleLabel = "Owner · You";
  else if (isOwner)          roleLabel = "Owner";
  else if (member.isMe)      roleLabel = "You";
  else if (isGuest)          roleLabel = "Guest";
  else                       roleLabel = "Member";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${onTap ? "pressable cursor-pointer" : ""}`}
      onClick={onTap}
    >
      <Avatar member={member} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-[#0F172A] leading-snug truncate">{member.isMe ? "Rafi" : member.name}</p>
        <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 leading-none">{roleLabel}</p>
        <p className="num text-[11px] text-[#94A3B8] font-500 mt-1 leading-none">
          Paid {fmt(member.paid)} · Share {fmt(shareAmt)}
        </p>
      </div>
      <div className="text-right shrink-0 ml-2">
        {isEven ? (
          <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
        ) : (
          <div>
            <p className={`num text-[13px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
              {isOwed ? "Receive" : "Owes"}
            </p>
            <p className={`num text-[14px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
              {fmt(member.balance)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feature: Members View ────────────────────────────────────────────────────
function InviteSheet({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const INVITE_URL = "tourapp.com/join/K7DQ92";
  function handleCopy() { navigator.clipboard.writeText(`https://${INVITE_URL}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2200); }
  function handleShare() { if (navigator.share) { navigator.share({ title: `Join ${TOUR.name}`, url: `https://${INVITE_URL}` }).catch(() => {}); } else { handleCopy(); } }
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Invite your group</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Done</button>
      </div>
      <div className="px-5 pb-6 pt-2 space-y-3">
        <div className="flex items-center gap-3 bg-[#F4F6F9] rounded-[12px] px-3.5 py-3 border border-[#E1E7EF]">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#0A86A0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <p className="flex-1 text-[13px] font-600 text-[#0F172A] truncate">{INVITE_URL}</p>
        </div>
        <button onClick={handleShare} className="pressable w-full h-[50px] rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(10,134,160,0.22)]">
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share invite
        </button>
        <button onClick={handleCopy} className={`pressable w-full h-[44px] rounded-[13px] border font-600 text-[14px] flex items-center justify-center gap-2 transition-colors ${copied ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" : "bg-white border-[#E1E7EF] text-[#475569]"}`}>
          {copied
            ? <><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Link copied</>
            : <><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy link</>
          }
        </button>
      </div>
    </Sheet>
  );
}

function AddGuestSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Add guest</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
      </div>
      <p className="px-5 pb-4 text-[13px] font-500 text-[#475569] leading-relaxed">For someone participating in expenses who won't use the app yet.</p>
      <div className="px-5 pb-6 space-y-3">
        <div>
          <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">Name</label>
          <input
            autoFocus type="text" placeholder="e.g. Hasan Ahmed" value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && trimmed && onAdd(trimmed)}
            className="w-full bg-[#F4F6F9] rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white transition-colors"
          />
        </div>
        <button onClick={() => trimmed && onAdd(trimmed)} disabled={!trimmed}
          className={`pressable w-full h-[50px] rounded-[13px] font-700 text-[15px] transition-colors ${trimmed ? "bg-[#0A86A0] text-white shadow-[0_4px_16px_rgba(10,134,160,0.22)]" : "bg-[#F1F5F9] text-[#C9D4DF]"}`}
        >
          Add guest
        </button>
      </div>
    </Sheet>
  );
}

function MemberActionsMenu({ onClose, onInvite, onAddGuest }: {
  onClose: () => void; onInvite: () => void; onAddGuest: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-3 py-3 space-y-0.5">
        <button onClick={() => { onInvite(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]">
          <div className="w-9 h-9 rounded-[10px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-600 text-[#0F172A] leading-snug">Invite members</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Share the invite link with your group</p>
          </div>
        </button>
        <button onClick={() => { onAddGuest(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]">
          <div className="w-9 h-9 rounded-[10px] bg-[#F4F6F9] flex items-center justify-center text-[#475569] shrink-0">
            <IconUserPlus size={17} />
          </div>
          <div>
            <p className="text-[15px] font-600 text-[#0F172A] leading-snug">Add guest member</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">For someone without the app</p>
          </div>
        </button>
      </div>
      <div className="px-3 pb-4 pt-1">
        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Cancel</button>
      </div>
    </Sheet>
  );
}

function MembersView({
  members, expenses, actionsOpen, onActionsClose, onSetMembers, onTapMember,
}: {
  members: Member[]; expenses: Expense[];
  actionsOpen: boolean; onActionsClose: () => void;
  onSetMembers: (m: Member[]) => void; onTapMember: (id: string) => void;
}) {
  const [showInvite,   setShowInvite]   = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);

  const sorted     = [...members].sort((a, b) => b.balance - a.balance);
  const totalOwed  = members.reduce((s, m) => s + Math.max(m.balance, 0), 0);
  const totalOwing = members.reduce((s, m) => s + Math.max(-m.balance, 0), 0);
  const onlyOwner  = members.length === 1 && members[0].isMe;

  function handleAddGuest(name: string) {
    const initials = name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
    onSetMembers([...members, { id: `g${Date.now()}`, name, initials, color: "#64748B", balance: 0, paid: 0, role: "guest" }]);
    setShowAddGuest(false);
  }

  return (
    <div>
      {/* Balance summary card */}
      {!onlyOwner && (
        <div className="px-4 pt-4 pb-2">
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[#F1F5F9]">
              <div className="px-4 py-3">
                <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Total outstanding</p>
                <p className="num text-[18px] font-700 text-[#DC2626] leading-snug">{fmt(totalOwing)}</p>
                <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">still to settle</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">To receive</p>
                <p className="num text-[18px] font-700 text-[#15803D] leading-snug">{fmt(totalOwed)}</p>
                <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">across {members.filter((m) => m.balance > 0).length} members</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solo invite prompt */}
      {onlyOwner && (
        <div className="px-4 pt-4 pb-2">
          <div className="bg-[#EFF9FB] border border-[#A3DFE9] rounded-[14px] px-4 py-4">
            <p className="text-[14px] font-700 text-[#0A7490] mb-1">It's just you so far</p>
            <p className="text-[13px] font-500 text-[#0A86A0] leading-relaxed mb-3">Invite your travel group to start tracking expenses together.</p>
            <button onClick={() => setShowInvite(true)} className="pressable flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#0A86A0] text-white font-700 text-[13px]">
              <IconPlus size={14} />
              Invite members
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">
          All members · {members.length}
        </p>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
          {sorted.map((m) => (
            <MemberRow key={m.id} member={m} expenses={expenses} onTap={() => onTapMember(m.id)} />
          ))}
        </div>
      </div>

      {/* Note about guests */}
      {members.some((m) => m.role === "guest") && (
        <p className="px-5 pb-4 text-[12px] font-500 text-[#94A3B8] text-center">
          Guest members participate in expenses but haven't joined Triply yet.
        </p>
      )}

      {actionsOpen && (
        <MemberActionsMenu onClose={onActionsClose} onInvite={() => setShowInvite(true)} onAddGuest={() => setShowAddGuest(true)} />
      )}
      {showInvite    && <InviteSheet onClose={() => setShowInvite(false)} />}
      {showAddGuest  && <AddGuestSheet onClose={() => setShowAddGuest(false)} onAdd={handleAddGuest} />}
    </div>
  );
}

// ─── Feature: Member Details ──────────────────────────────────────────────────
function MemberOverflowSheet({
  member, canEditName, onEditName, onRemove, onClose,
}: {
  member: Member; canEditName: boolean; onEditName: () => void; onRemove: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-3 flex items-center gap-3 border-b border-[#F1F5F9]">
        <Avatar member={member} size="sm" />
        <div>
          <p className="text-[15px] font-700 text-[#0F172A] leading-snug">{member.name}</p>
          <p className="text-[12px] font-500 text-[#94A3B8] capitalize">{member.role}</p>
        </div>
      </div>
      <div className="px-3 py-2 space-y-0.5">
        {canEditName && (
          <button onClick={() => { onEditName(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]">
            <IconEdit size={18} />
            <span className="text-[15px] font-600 text-[#0F172A]">Edit name</span>
          </button>
        )}
        {!member.isMe && (
          <button onClick={() => { onRemove(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#FFF5F5]">
            <span className="text-[#DC2626]"><IconUserX size={18} /></span>
            <span className="text-[15px] font-600 text-[#DC2626]">Remove from tour</span>
          </button>
        )}
      </div>
      <div className="px-3 pb-4 pt-1">
        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Cancel</button>
      </div>
    </Sheet>
  );
}

function RemoveMemberBlockedSheet({ member, reason, onClose }: {
  member: Member; reason: string; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFFBEB] flex items-center justify-center text-[#B45309] shrink-0">
            <IconAlertCircle size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A]">Can't remove {member.name.split(" ")[0]}</p>
          </div>
        </div>
        <p className="text-[14px] font-500 text-[#475569] leading-relaxed mb-4">{reason}</p>
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] px-4 py-3 mb-4">
          <p className="text-[13px] font-600 text-[#B45309]">
            Their financial history must stay with the tour to keep balances accurate for everyone.
          </p>
        </div>
        <button onClick={onClose} className="pressable w-full h-12 rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px]">Got it</button>
      </div>
    </Sheet>
  );
}

function RemoveMemberConfirmSheet({ member, onConfirm, onClose }: {
  member: Member; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar member={member} size="md" />
          <div>
            <p className="text-[16px] font-700 text-[#0F172A]">Remove {member.name}?</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5 capitalize">{member.role}</p>
          </div>
        </div>
        <p className="text-[14px] font-500 text-[#475569] leading-relaxed mb-4">
          {member.name.split(" ")[0]} will be removed from this tour and will no longer appear in expense splits. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Cancel</button>
          <button onClick={onConfirm} className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px]">Remove</button>
        </div>
      </div>
    </Sheet>
  );
}

function EditNameSheet({ member, onSave, onClose }: {
  member: Member; onSave: (name: string) => void; onClose: () => void;
}) {
  const [name, setName] = useState(member.name);
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Edit name</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
      </div>
      <div className="px-5 pb-6 pt-3 space-y-3">
        <input
          autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
          className="w-full bg-[#F4F6F9] rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white transition-colors"
        />
        <button
          onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim()}
          className={`pressable w-full h-[50px] rounded-[13px] font-700 text-[15px] transition-colors ${name.trim() ? "bg-[#0A86A0] text-white shadow-[0_4px_16px_rgba(10,134,160,0.22)]" : "bg-[#F1F5F9] text-[#C9D4DF]"}`}
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}

function MemberDetails({
  member, allMembers, allExpenses, recordedSettlements, me, isCurrentUserOwner,
  onBack, onSetMembers, onRemove,
}: {
  member: Member; allMembers: Member[]; allExpenses: Expense[]; recordedSettlements: RecordedSettlement[];
  me: Member | undefined; isCurrentUserOwner: boolean;
  onBack: () => void; onSetMembers: (m: Member[]) => void; onRemove: () => void;
}) {
  const [showOverflow,       setShowOverflow]       = useState(false);
  const [showEditName,       setShowEditName]       = useState(false);
  const [showRemoveBlocked,  setShowRemoveBlocked]  = useState(false);
  const [showRemoveConfirm,  setShowRemoveConfirm]  = useState(false);

  const isMe      = member.isMe;
  const isGuest   = member.role === "guest";
  const isOwner   = member.role === "owner";
  const shareAmt  = Math.round(allExpenses.filter((e) => e.splitIds.includes(member.id)).reduce((s, e) => s + e.amount / e.splitIds.length, 0));

  const memberExpenses     = allExpenses.filter((e) => e.paidBy === member.id || e.splitIds.includes(member.id));
  const memberSettlements  = recordedSettlements.filter((s) => s.from === member.id || s.to === member.id);

  const balancePositive = member.balance > 2;
  const balanceZero     = Math.abs(member.balance) <= 2;
  const balanceColor    = balanceZero ? "#94A3B8" : balancePositive ? "#15803D" : "#DC2626";

  let balanceExplanation = "";
  if (balanceZero) {
    balanceExplanation = `${isMe ? "You are" : `${member.name.split(" ")[0]} is`} fully settled.`;
  } else if (balancePositive) {
    balanceExplanation = `${isMe ? "You paid" : `${member.name.split(" ")[0]} paid`} more than their fair share and should receive ${fmt(member.balance)} back from the group.`;
  } else {
    balanceExplanation = `${isMe ? "You owe" : `${member.name.split(" ")[0]} owes`} ${fmt(Math.abs(member.balance))} to the group — their share of expenses exceeds what they've paid.`;
  }

  function handleRemoveTapped() {
    if (isOwner) return;
    if (hasMemberFinancialHistory(member.id, allExpenses, recordedSettlements)) {
      setShowRemoveBlocked(true);
    } else {
      setShowRemoveConfirm(true);
    }
  }

  const removedBlockedReason = (() => {
    const paidExpenses = allExpenses.filter((e) => e.paidBy === member.id);
    const splitExpenses = allExpenses.filter((e) => e.splitIds.includes(member.id));
    const parts: string[] = [];
    if (paidExpenses.length > 0) parts.push(`paid for ${paidExpenses.length} expense${paidExpenses.length > 1 ? "s" : ""}`);
    if (splitExpenses.length > 0 && splitExpenses.length !== paidExpenses.length) parts.push(`is in ${splitExpenses.length} expense split${splitExpenses.length > 1 ? "s" : ""}`);
    if (memberSettlements.length > 0) parts.push(`has ${memberSettlements.length} settlement${memberSettlements.length > 1 ? "s" : ""}`);
    const nameFirst = member.name.split(" ")[0];
    return `${nameFirst} has ${parts.join(" and ")}. Removing them would break the financial record for this tour.`;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden" style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}>
      {/* Header */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button onClick={onBack} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
            <IconChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">Member detail</h1>
          {isCurrentUserOwner && !isMe && (
            <button onClick={() => setShowOverflow(true)} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="More options">
              <IconDotsV size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto w-full pb-8">

          {/* Identity card */}
          <div className="bg-white px-5 pt-6 pb-5 border-b border-[#E1E7EF]">
            <div className="flex items-center gap-4">
              <Avatar member={member} size="xl" />
              <div className="flex-1 min-w-0">
                <p className="text-[20px] font-800 text-[#0F172A] leading-tight">{isMe ? "Rafi" : member.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {isOwner && <Badge label="Owner" variant="brand" />}
                  {isMe    && <Badge label="You" variant="neutral" />}
                  {isGuest && <Badge label="Guest" variant="neutral" />}
                  {!isOwner && !isGuest && !isMe && <Badge label="Member" variant="neutral" />}
                </div>
                {isGuest && (
                  <p className="text-[12px] font-500 text-[#94A3B8] mt-2 leading-snug">
                    Participates in expenses but hasn't joined Triply yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-[#F1F5F9]">
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1">Paid</p>
                <p className="num text-[16px] font-700 text-[#0F172A] leading-snug">{fmt(member.paid)}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1">Share</p>
                <p className="num text-[16px] font-700 text-[#0F172A] leading-snug">{fmt(shareAmt)}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1">Balance</p>
                <p className="num text-[16px] font-700 leading-snug" style={{ color: balanceColor }}>
                  {balanceZero ? "Settled" : `${balancePositive ? "+" : "−"}${fmt(member.balance)}`}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC]">
              <p className="text-[12px] font-500 text-[#475569] leading-relaxed">{balanceExplanation}</p>
            </div>
          </div>

          {/* Expense activity */}
          {memberExpenses.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-5 mb-2">Expense activity</p>
              <div className="bg-white mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                {memberExpenses.slice(0, 8).map((e) => {
                  const cat = CATEGORY_META[e.category];
                  const isPayer = e.paidBy === member.id;
                  const inSplit = e.splitIds.includes(member.id);
                  const share = inSplit ? Math.round(e.amount / e.splitIds.length) : 0;
                  return (
                    <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                        <div style={{ transform: "scale(0.9)" }}>{cat.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-600 text-[#0F172A] truncate leading-snug">{e.title}</p>
                        <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">
                          {e.date}
                          {isPayer && inSplit && " · Paid & split"}
                          {isPayer && !inSplit && " · Paid"}
                          {!isPayer && inSplit && ` · Split with ${e.splitIds.length - 1} others`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {isPayer && <p className="num text-[13px] font-700 text-[#0F172A]">{fmt(e.amount)}</p>}
                        {inSplit && <p className="num text-[11px] font-500 text-[#94A3B8] mt-0.5">share {fmt(share)}</p>}
                      </div>
                    </div>
                  );
                })}
                {memberExpenses.length > 8 && (
                  <div className="px-4 py-3 text-center">
                    <p className="text-[12px] font-500 text-[#94A3B8]">+{memberExpenses.length - 8} more expenses</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 mx-4 bg-white rounded-[14px] border border-[#E1E7EF] px-4 py-4">
              <p className="text-[13px] font-500 text-[#94A3B8] text-center">No expense activity yet.</p>
            </div>
          )}

          {/* Settlement activity */}
          {memberSettlements.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-5 mb-2">Settlements</p>
              <div className="bg-white mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                {memberSettlements.map((s) => {
                  const from     = allMembers.find((m) => m.id === s.from);
                  const to       = allMembers.find((m) => m.id === s.to);
                  const isFromMe = s.from === member.id;
                  return (
                    <div key={s.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        {from && <Avatar member={from} size="sm" />}
                        <span className="text-[#C9D4DF] mx-1"><IconArrowRight size={12} /></span>
                        {to && <Avatar member={to} size="sm" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-600 text-[#0F172A] truncate">
                          {from?.isMe ? "You" : from?.name.split(" ")[0]} paid {to?.isMe ? "you" : to?.name.split(" ")[0]}
                        </p>
                        {s.date && <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">{s.date}</p>}
                      </div>
                      <p className={`num text-[14px] font-700 shrink-0 ${isFromMe ? "text-[#DC2626]" : "text-[#15803D]"}`}>
                        {isFromMe ? "−" : "+"}{fmt(s.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overflow menu */}
      {showOverflow && (
        <MemberOverflowSheet
          member={member}
          canEditName={isGuest}
          onEditName={() => setShowEditName(true)}
          onRemove={handleRemoveTapped}
          onClose={() => setShowOverflow(false)}
        />
      )}

      {/* Edit name sheet */}
      {showEditName && (
        <EditNameSheet
          member={member}
          onSave={(name) => {
            const initials = name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
            onSetMembers(allMembers.map((m) => m.id === member.id ? { ...m, name, initials } : m));
            setShowEditName(false);
          }}
          onClose={() => setShowEditName(false)}
        />
      )}

      {/* Remove blocked */}
      {showRemoveBlocked && (
        <RemoveMemberBlockedSheet
          member={member}
          reason={removedBlockedReason}
          onClose={() => setShowRemoveBlocked(false)}
        />
      )}

      {/* Remove confirm */}
      {showRemoveConfirm && (
        <RemoveMemberConfirmSheet
          member={member}
          onConfirm={() => { onRemove(); setShowRemoveConfirm(false); }}
          onClose={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── Feature: Settlement (full experience) ────────────────────────────────────

function SettlementToast({ fromName, toName, amount, onHide }: {
  fromName: string; toName: string; amount: number; onHide: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onHide, 2800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)", animation: "toastIn 300ms cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1C1C1E] text-white text-[13px] font-600 shadow-[0_8px_32px_rgba(0,0,0,0.30)] max-w-[340px]">
        <div className="w-[18px] h-[18px] rounded-full bg-[#15803D] flex items-center justify-center shrink-0">
          <IconCheck size={10} />
        </div>
        <span className="truncate">Payment recorded · {fromName} paid {toName} {fmt(amount)}</span>
      </div>
    </div>
  );
}

function RecordPaymentSheet({
  fromId, toId, suggestedAmount, isManual, members, me, onRecord, onClose,
}: {
  fromId?: string; toId?: string; suggestedAmount?: number; isManual?: boolean;
  members: Member[]; me: Member | undefined;
  onRecord: (from: string, to: string, amount: number) => void;
  onClose: () => void;
}) {
  const [selectedFrom, setSelectedFrom] = useState(fromId ?? me?.id ?? "");
  const [selectedTo,   setSelectedTo]   = useState(toId ?? "");
  const [amountStr,    setAmountStr]    = useState(suggestedAmount ? String(suggestedAmount) : "");
  const [page,         setPage]         = useState<"form" | "select-from" | "select-to">("form");
  const [touched,      setTouched]      = useState(false);

  const from   = members.find((m) => m.id === selectedFrom);
  const to     = members.find((m) => m.id === selectedTo);
  const amount = parseFloat(amountStr);
  const canSubmit = !!(selectedFrom && selectedTo && selectedFrom !== selectedTo && !isNaN(amount) && amount > 0);

  const handleBackdrop = () => { if (page !== "form") setPage("form"); else onClose(); };

  if (page === "select-from" || page === "select-to") {
    const isFrom  = page === "select-from";
    const exclude = isFrom ? selectedTo : selectedFrom;
    const current = isFrom ? selectedFrom : selectedTo;
    return (
      <>
        <div className="fixed inset-0 bg-black/30 z-40" onClick={handleBackdrop} />
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[24px] z-50 safe-bottom" style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#E1E7EF] rounded-full" /></div>
          <div className="px-5 pt-2 pb-3 flex items-center border-b border-[#F4F6F9]">
            <button onClick={() => setPage("form")} className="pressable flex items-center gap-0.5 text-[#0A86A0] font-600 text-[14px] mr-3">
              <IconChevronLeft size={18} /><span>Back</span>
            </button>
            <h3 className="flex-1 text-center text-[15px] font-700 text-[#0F172A]">{isFrom ? "Who paid?" : "Who received?"}</h3>
            <div className="w-16" />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "55dvh" }}>
            <div className="px-3 py-2 space-y-0.5 pb-6">
              {members.filter((m) => m.id !== exclude).map((m) => {
                const sel = m.id === current;
                return (
                  <button key={m.id} onClick={() => { if (isFrom) setSelectedFrom(m.id); else setSelectedTo(m.id); setPage("form"); }}
                    className={`pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors ${sel ? "bg-[#EFF9FB]" : "hover:bg-[#F4F6F9]"}`}
                  >
                    <Avatar member={m} size="sm" />
                    <span className={`flex-1 text-[15px] font-600 ${sel ? "text-[#0A86A0]" : "text-[#0F172A]"}`}>
                      {m.isMe ? "Rafi (You)" : m.name}
                    </span>
                    {sel && <span className="text-[#0A86A0]"><IconCheck size={16} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleBackdrop} style={{ animation: "fadeIn 150ms ease" }} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[24px] z-50 safe-bottom" style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#E1E7EF] rounded-full" /></div>
        <div className="px-5 pt-2 pb-2 flex items-center justify-between">
          <h2 className="text-[17px] font-700 text-[#0F172A]">{isManual ? "Record settlement" : "Record payment"}</h2>
          <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
        </div>
        <div className="px-5 pb-6 space-y-4">
          {/* From / To block */}
          <div className="bg-[#F8FAFC] rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <button onClick={isManual ? () => setPage("select-from") : undefined} disabled={!isManual}
              className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#E1E7EF] ${isManual ? "pressable" : ""}`}
            >
              <span className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide w-10 shrink-0">From</span>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {from ? (
                  <><Avatar member={from} size="sm" /><span className="text-[15px] font-600 text-[#0F172A] truncate">{from.isMe ? "Rafi (You)" : from.name}</span></>
                ) : (
                  <span className="text-[15px] font-500 text-[#C9D4DF]">Select member…</span>
                )}
              </div>
              {isManual && <span className="text-[#94A3B8] shrink-0"><IconChevronRight /></span>}
            </button>
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-[#E1E7EF]">
              <div className="w-10 shrink-0" />
              <span className="text-[#C9D4DF]"><IconArrowRight size={14} /></span>
            </div>
            <button onClick={isManual ? () => setPage("select-to") : undefined} disabled={!isManual}
              className={`w-full flex items-center gap-3 px-4 py-3.5 ${isManual ? "pressable" : ""}`}
            >
              <span className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide w-10 shrink-0">To</span>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {to ? (
                  <><Avatar member={to} size="sm" /><span className="text-[15px] font-600 text-[#0F172A] truncate">{to.isMe ? "Rafi (You)" : to.name}</span></>
                ) : (
                  <span className="text-[15px] font-500 text-[#C9D4DF]">Select member…</span>
                )}
              </div>
              {isManual && <span className="text-[#94A3B8] shrink-0"><IconChevronRight /></span>}
            </button>
          </div>

          {touched && selectedFrom && selectedTo && selectedFrom === selectedTo && (
            <p className="text-[12px] font-600 text-[#DC2626] -mt-1">From and To must be different members.</p>
          )}

          {/* Amount */}
          <div>
            <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">Amount</label>
            <div className={`flex items-center gap-2 rounded-[13px] border h-[54px] px-4 transition-colors ${
              touched && (isNaN(amount) || amount <= 0) ? "border-[#FECACA] bg-[#FFF5F5]" : "bg-[#F8FAFC] border-[#E1E7EF] focus-within:border-[#0A86A0] focus-within:bg-white"
            }`}>
              <span className="text-[20px] font-700 text-[#94A3B8]">৳</span>
              <input
                type="number" inputMode="decimal" placeholder="0" value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="flex-1 bg-transparent num text-[24px] font-800 text-[#0F172A] outline-none placeholder:text-[#C9D4DF]"
              />
            </div>
            {touched && (isNaN(amount) || amount <= 0) && (
              <p className="text-[12px] font-600 text-[#DC2626] mt-1">Enter a valid amount.</p>
            )}
          </div>

          <p className="text-[12px] font-500 text-[#94A3B8] leading-relaxed text-center">
            Triply records that this payment happened outside the app. No money is moved.
          </p>

          <button
            onClick={() => { setTouched(true); if (canSubmit) onRecord(selectedFrom, selectedTo, amount); }}
            className={`pressable w-full h-[52px] rounded-[14px] font-700 text-[15px] flex items-center justify-center transition-all ${
              canSubmit ? "bg-[#0A86A0] text-white shadow-[0_4px_16px_rgba(10,134,160,0.20)]" : "bg-[#F1F5F9] text-[#C9D4DF]"
            }`}
          >
            {isManual ? "Record settlement" : "Record payment"}
          </button>
        </div>
      </div>
    </>
  );
}

function DeleteSettlementSheet({
  settlement, members, onConfirm, onClose,
}: {
  settlement: RecordedSettlement; members: Member[]; onConfirm: () => void; onClose: () => void;
}) {
  const from = members.find((m) => m.id === settlement.from);
  const to   = members.find((m) => m.id === settlement.to);
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
            <IconTrash size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A]">Delete settlement?</p>
            <p className="text-[13px] font-500 text-[#94A3B8] mt-0.5">
              {from?.isMe ? "You" : from?.name.split(" ")[0]} → {to?.isMe ? "you" : to?.name.split(" ")[0]} · {fmt(settlement.amount)}
            </p>
          </div>
        </div>
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
          <p className="text-[13px] font-500 text-[#DC2626] leading-relaxed">
            This will reverse the settlement and update member balances. Total Spent will not change.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Cancel</button>
          <button onClick={onConfirm} className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px]">Delete</button>
        </div>
      </div>
    </Sheet>
  );
}

function SettlementDetailSheet({
  settlement, members, canDelete, onDelete, onClose,
}: {
  settlement: RecordedSettlement; members: Member[]; canDelete: boolean; onDelete: () => void; onClose: () => void;
}) {
  const from     = members.find((m) => m.id === settlement.from);
  const to       = members.find((m) => m.id === settlement.to);
  const recorder = members.find((m) => m.id === settlement.recordedBy);
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-1 pb-6">
        {/* Avatar pair + amount */}
        <div className="flex items-center justify-center gap-4 py-5 border-b border-[#F4F6F9] mb-4">
          <div className="flex flex-col items-center gap-1.5">
            {from && <Avatar member={from} size="lg" />}
            <p className="text-[12px] font-600 text-[#0F172A]">{from?.isMe ? "You" : from?.name.split(" ")[0]}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-[#C9D4DF]"><IconArrowRight size={20} /></div>
            <p className="num text-[20px] font-800 text-[#0A86A0]">{fmt(settlement.amount)}</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            {to && <Avatar member={to} size="lg" />}
            <p className="text-[12px] font-600 text-[#0F172A]">{to?.isMe ? "You" : to?.name.split(" ")[0]}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-[#F8FAFC] rounded-[12px] border border-[#E1E7EF] overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9]">
            <span className="text-[12px] font-600 text-[#94A3B8] w-24 shrink-0">Date</span>
            <span className="text-[14px] font-600 text-[#0F172A]">{settlement.date}, 2026</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[12px] font-600 text-[#94A3B8] w-24 shrink-0">Recorded by</span>
            <span className="text-[14px] font-600 text-[#0F172A]">{recorder?.isMe ? "You" : (recorder?.name ?? "Unknown")}</span>
          </div>
        </div>

        {/* Delete / info */}
        {canDelete ? (
          <button onClick={onDelete} className="pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-[#FFF5F5] mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
              <IconTrash size={15} />
            </div>
            <div>
              <p className="text-[15px] font-600 text-[#DC2626]">Delete settlement</p>
              <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Balances will recalculate</p>
            </div>
          </button>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] shrink-0 mt-0.5">
              <IconInfo size={14} />
            </div>
            <p className="text-[13px] font-500 text-[#475569] leading-relaxed">
              Only the person who recorded this or the Tour Owner can delete it.
            </p>
          </div>
        )}

        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Close</button>
      </div>
    </Sheet>
  );
}

function SettlementHistoryView({
  recordedSettlements, members, me, isCurrentUserOwner, onDeleteSettlement, onBack,
}: {
  recordedSettlements: RecordedSettlement[]; members: Member[]; me: Member | undefined;
  isCurrentUserOwner: boolean; onDeleteSettlement: (id: string) => void; onBack: () => void;
}) {
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selected      = selectedId      ? recordedSettlements.find((s) => s.id === selectedId)      : null;
  const confirmDelete = confirmDeleteId ? recordedSettlements.find((s) => s.id === confirmDeleteId) : null;

  const sorted      = [...recordedSettlements].sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const uniqueDates = [...new Set(sorted.map((s) => s.dateIso))];
  const grouped     = uniqueDates.map((iso) => ({
    iso,
    label: new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    items: sorted.filter((s) => s.dateIso === iso),
  }));

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden" style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}>
      {/* Header */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button onClick={onBack} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
            <IconChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">Settlement history</h1>
          {recordedSettlements.length > 0 && (
            <span className="num text-[13px] font-500 text-[#94A3B8] pr-2">{recordedSettlements.length}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto w-full pb-8">
          {grouped.length === 0 ? (
            <EmptyState
              icon={<IconHistory size={28} />}
              title="No settlements recorded"
              body="Settlements you record will appear here."
            />
          ) : (
            <div className="px-4 pt-4 space-y-5">
              {grouped.map(({ iso, label, items }) => (
                <div key={iso}>
                  <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">{label}</p>
                  <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                    {items.map((s) => {
                      const from     = members.find((m) => m.id === s.from);
                      const to       = members.find((m) => m.id === s.to);
                      const recorder = members.find((m) => m.id === s.recordedBy);
                      if (!from || !to) return null;
                      return (
                        <button key={s.id} onClick={() => setSelectedId(s.id)}
                          className="pressable w-full flex items-center gap-3 px-4 py-3.5 text-left"
                        >
                          <div className="flex items-center shrink-0">
                            <Avatar member={from} size="sm" />
                            <span className="mx-1.5 text-[#94A3B8]"><IconArrowRight size={12} /></span>
                            <Avatar member={to} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-600 text-[#0F172A]">
                              {from.isMe ? "You" : from.name.split(" ")[0]} paid {to.isMe ? "you" : to.name.split(" ")[0]}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[12px] font-500 text-[#94A3B8]">
                                {s.date} · Added by {recorder?.isMe ? "you" : (recorder?.name.split(" ")[0] ?? "unknown")}
                              </p>
                              {s.syncStatus === "pending" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-600 text-[#B45309]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] shrink-0" />Pending sync
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="num text-[15px] font-700 text-[#0F172A] shrink-0">{fmt(s.amount)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <SettlementDetailSheet
          settlement={selected}
          members={members}
          canDelete={me ? (me.id === selected.recordedBy || isCurrentUserOwner) : false}
          onDelete={() => { setConfirmDeleteId(selected.id); setSelectedId(null); }}
          onClose={() => setSelectedId(null)}
        />
      )}

      {confirmDelete && (
        <DeleteSettlementSheet
          settlement={confirmDelete}
          members={members}
          onConfirm={() => { onDeleteSettlement(confirmDelete.id); setConfirmDeleteId(null); }}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

function SettlementView({
  members, recordedSettlements, me, isCurrentUserOwner,
  onRecordSettlement, onOpenHistory,
}: {
  members: Member[];
  recordedSettlements: RecordedSettlement[];
  me: Member | undefined;
  isCurrentUserOwner: boolean;
  onRecordSettlement: (from: string, to: string, amount: number) => void;
  onOpenHistory: () => void;
}) {
  const [recordPayment, setRecordPayment] = useState<{ fromId: string; toId: string; amount: number } | null>(null);
  const [showManual,    setShowManual]    = useState(false);
  const [toast,         setToast]         = useState<{ from: string; to: string; amount: number } | null>(null);

  const suggestedPayments = computeSuggestedPayments(members);
  const totalToSettle     = suggestedPayments.reduce((s, p) => s + p.amount, 0);
  const isFullySettled    = members.every((m) => Math.abs(m.balance) <= 2);

  function handleRecord(from: string, to: string, amount: number) {
    onRecordSettlement(from, to, amount);
    const f = members.find((m) => m.id === from);
    const t = members.find((m) => m.id === to);
    setToast({ from: f?.isMe ? "You" : (f?.name.split(" ")[0] ?? from), to: t?.isMe ? "you" : (t?.name.split(" ")[0] ?? to), amount });
    setRecordPayment(null);
    setShowManual(false);
  }

  const sorted = [...members].sort((a, b) => b.balance - a.balance);

  // ── Fully settled state ──────────────────────────────────────────────────────
  if (isFullySettled) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center px-8 pt-12 pb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border-2 border-[#BBF7D0] flex items-center justify-center text-[#15803D] mb-5">
            <IconCheckCircle2 size={30} />
          </div>
          <p className="text-[22px] font-800 text-[#0F172A] mb-2">{"You're all settled up"}</p>
          <p className="text-[15px] font-500 text-[#94A3B8] leading-relaxed max-w-[240px]">{"Everyone's balance is clear."}</p>
        </div>

        <div className="px-4 pb-3">
          <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">Members</p>
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
            {sorted.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar member={m} size="sm" />
                <p className="text-[14px] font-600 text-[#0F172A] flex-1 truncate">{m.isMe ? "Rafi" : m.name}</p>
                <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
              </div>
            ))}
          </div>
        </div>

        {recordedSettlements.length > 0 && (
          <div className="px-4 pb-6">
            <button onClick={onOpenHistory} className="pressable w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-[14px] border border-[#E1E7EF]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[9px] bg-[#F4F6F9] flex items-center justify-center text-[#475569]">
                  <IconHistory size={15} />
                </div>
                <span className="text-[15px] font-600 text-[#0F172A]">Settlement history</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <span className="num text-[13px] font-500">{recordedSettlements.length}</span>
                <IconChevronRight size={14} />
              </div>
            </button>
          </div>
        )}

        {toast && <SettlementToast fromName={toast.from} toName={toast.to} amount={toast.amount} onHide={() => setToast(null)} />}
      </div>
    );
  }

  // ── Normal state (payments remaining) ────────────────────────────────────────
  return (
    <div>
      {/* Summary banner */}
      <div className="px-4 pt-4 pb-1">
        <div className="bg-[#EFF9FB] border border-[#A3DFE9] rounded-[14px] px-4 py-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-700 text-[#0A7490]">
              {suggestedPayments.length} {suggestedPayments.length === 1 ? "payment" : "payments"} remaining
            </p>
            <p className="num text-[13px] font-500 text-[#0A86A0] mt-0.5">{fmt(totalToSettle)} to settle</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/60 border border-[#A3DFE9] flex items-center justify-center text-[#0A86A0] shrink-0">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
            </svg>
          </div>
        </div>
      </div>

      {/* Suggested payments */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">Suggested payments</p>
        <div className="space-y-2">
          {suggestedPayments.map((p, i) => {
            const from = members.find((m) => m.id === p.from);
            const to   = members.find((m) => m.id === p.to);
            if (!from || !to) return null;
            return (
              <div key={i} className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden">
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div className="flex items-center shrink-0">
                    <Avatar member={from} size="sm" />
                    <span className="mx-2 text-[#C9D4DF]"><IconArrowRight size={13} /></span>
                    <Avatar member={to} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-600 text-[#475569]">
                      {from.isMe ? "You" : from.name.split(" ")[0]} → {to.isMe ? "you" : to.name.split(" ")[0]}
                    </p>
                    <p className="num text-[20px] font-800 text-[#0A86A0] leading-tight">{fmt(p.amount)}</p>
                  </div>
                </div>
                <div className="px-4 pb-3.5">
                  <button
                    onClick={() => setRecordPayment({ fromId: p.from, toId: p.to, amount: p.amount })}
                    className="pressable w-full h-9 rounded-[10px] bg-[#EFF9FB] text-[#0A86A0] font-700 text-[13px] border border-[#A3DFE9] transition-colors hover:bg-[#D1EFF5]"
                  >
                    Record payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member balances */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">Member balances</p>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
          {sorted.map((m) => {
            const isOwed = m.balance > 2;
            const isEven = Math.abs(m.balance) <= 2;
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar member={m} size="sm" />
                <p className="text-[14px] font-600 text-[#0F172A] flex-1 truncate">{m.isMe ? "Rafi" : m.name}</p>
                <div className="text-right shrink-0">
                  {isEven ? (
                    <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
                  ) : (
                    <>
                      <p className={`num text-[12px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                        {isOwed ? "Receive" : "Owes"}
                      </p>
                      <p className={`num text-[14px] font-800 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                        {fmt(m.balance)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary actions */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <button
          onClick={() => setShowManual(true)}
          className="pressable w-full flex items-center justify-between px-4 h-12 rounded-[13px] bg-white border border-[#E1E7EF] text-[#0F172A] font-600 text-[14px]"
        >
          <span>Record settlement</span>
          <span className="text-[#94A3B8]"><IconChevronRight size={15} /></span>
        </button>
        {recordedSettlements.length > 0 && (
          <button
            onClick={onOpenHistory}
            className="pressable w-full flex items-center justify-between px-4 h-12 rounded-[13px] bg-white border border-[#E1E7EF] text-[#475569] font-500 text-[14px]"
          >
            <div className="flex items-center gap-2.5">
              <IconHistory size={15} />
              <span>Settlement history</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#94A3B8]">
              <span className="num text-[13px]">{recordedSettlements.length}</span>
              <IconChevronRight size={13} />
            </div>
          </button>
        )}
      </div>

      <div className="h-4" />

      {/* Sheets */}
      {recordPayment && (
        <RecordPaymentSheet
          fromId={recordPayment.fromId}
          toId={recordPayment.toId}
          suggestedAmount={recordPayment.amount}
          members={members}
          me={me}
          onRecord={handleRecord}
          onClose={() => setRecordPayment(null)}
        />
      )}
      {showManual && (
        <RecordPaymentSheet
          isManual
          members={members}
          me={me}
          onRecord={handleRecord}
          onClose={() => setShowManual(false)}
        />
      )}
      {toast && <SettlementToast fromName={toast.from} toName={toast.to} amount={toast.amount} onHide={() => setToast(null)} />}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
type Screen = "tourList" | "createTour" | "inviteMembers" | "inviteAccept" | "tour";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screen, setScreen]                   = useState<Screen>(DEMO_INVITE_MODE ? "inviteAccept" : "tourList");
  const [activeTourId, setActiveTourId]       = useState<string | null>(null);

  if (screen === "inviteAccept") {
    return (
      <InviteAcceptFlow
        isAuthenticated={isAuthenticated}
        onAuthenticate={() => setIsAuthenticated(true)}
        onJoined={() => { setIsAuthenticated(true); setActiveTourId("joined"); setScreen("tour"); }}
        onGoToTours={() => { setIsAuthenticated(true); setScreen("tourList"); }}
      />
    );
  }
  if (!isAuthenticated) return <AuthFlow onAuthenticate={() => setIsAuthenticated(true)} />;
  if (screen === "createTour") {
    return <CreateTour onBack={() => setScreen("tourList")} onCreate={() => { setActiveTourId("new"); setScreen("inviteMembers"); }} />;
  }
  if (screen === "inviteMembers") {
    return <InviteMembers tourName={TOUR.name} tourDates={TOUR.dates} onBack={() => setScreen("createTour")} onDone={() => setScreen("tour")} />;
  }
  if (screen === "tourList" || !activeTourId) {
    return <TourList onSelectTour={(id) => { setActiveTourId(id); setScreen("tour"); }} onNewTour={() => setScreen("createTour")} />;
  }
  return <AuthenticatedApp isEmpty={activeTourId === "new"} />;
}

function AuthenticatedApp({ isEmpty = false }: { isEmpty?: boolean }) {
  const [members,               setMembers]               = useState<Member[]>(() => computeMembers(MEMBERS_INIT, EXPENSES_INIT, RECORDED_SETTLEMENTS_INIT));
  const [expenses,              setExpenses]              = useState<Expense[]>(EXPENSES_INIT);
  const [recordedSettlements,   setRecordedSettlements]   = useState<RecordedSettlement[]>(RECORDED_SETTLEMENTS_INIT);
  const [tab,                 setTab]                 = useState<Tab>("home");
  const [syncStatus]                                  = useState<SyncStatus>("pending");
  const [showAddExpense,      setShowAddExpense]       = useState(false);
  const [editingExpense,      setEditingExpense]       = useState<Expense | null>(null);
  const [subScreen,           setSubScreen]           = useState<SubScreen>(null);
  const [scrolled,            setScrolled]            = useState(false);
  const [membersActionsOpen,  setMembersActionsOpen]  = useState(false);

  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const handleMobileScroll = () => setScrolled((mobileScrollRef.current?.scrollTop ?? 0) > 6);

  const me = members.find((m) => m.isMe);

  function handleExpenseSave(data: { amount: string; description: string; category: string | null; paidBy: string; splitIds: string[]; date: string; expenseId?: string }) {
    const amount = parseFloat(data.amount);
    if (isNaN(amount)) return;

    if (data.expenseId) {
      // Edit existing
      const updated = expenses.map((e) =>
        e.id === data.expenseId
          ? { ...e, title: data.description, amount, category: (data.category ?? e.category) as Expense["category"], paidBy: data.paidBy, splitIds: data.splitIds, dateIso: data.date || e.dateIso }
          : e
      );
      const recomputed = computeMembers(MEMBERS_INIT, updated, recordedSettlements);
      setExpenses(updated);
      setMembers(recomputed);
    } else {
      // New expense
      const isoDate = data.date || new Date().toISOString().slice(0, 10);
      const dateDisplay = new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const newExp: Expense = {
        id:        `e${Date.now()}`,
        title:     data.description,
        amount,
        category:  (data.category ?? "other") as Expense["category"],
        paidBy:    data.paidBy,
        splitIds:  data.splitIds,
        date:      dateDisplay,
        dateIso:   isoDate,
        addedBy:   me?.id ?? "6",
        addedAt:   new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      };
      const updated    = [newExp, ...expenses];
      const recomputed = computeMembers(MEMBERS_INIT, updated, recordedSettlements);
      setExpenses(updated);
      setMembers(recomputed);
    }
    setShowAddExpense(false);
    setEditingExpense(null);
  }

  function handleDeleteExpense(id: string) {
    const updated    = expenses.filter((e) => e.id !== id);
    const recomputed = computeMembers(MEMBERS_INIT, updated, recordedSettlements);
    setExpenses(updated);
    setMembers(recomputed);
    setSubScreen(null);
  }

  function handleRecordSettlement(from: string, to: string, amount: number) {
    const isoDate     = new Date().toISOString().slice(0, 10);
    const dateDisplay = new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newS: RecordedSettlement = {
      id: `rs${Date.now()}`, from, to, amount,
      date: dateDisplay, dateIso: isoDate,
      recordedBy: me?.id ?? "6",
      syncStatus: "pending",
    };
    const updated    = [newS, ...recordedSettlements];
    const recomputed = computeMembers(MEMBERS_INIT, expenses, updated);
    setRecordedSettlements(updated);
    setMembers(recomputed);
  }

  function handleDeleteSettlement(id: string) {
    const updated    = recordedSettlements.filter((s) => s.id !== id);
    const recomputed = computeMembers(MEMBERS_INIT, expenses, updated);
    setRecordedSettlements(updated);
    setMembers(recomputed);
  }

  function handleRemoveMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setSubScreen(null);
  }

  const headerConfig: Record<Tab, { title: string; subtitle?: string; showBack: boolean }> = {
    home:       { title: TOUR.name, subtitle: TOUR.dates, showBack: false },
    expenses:   { title: "Expenses",                       showBack: false },
    members:    { title: "Members",                        showBack: false },
    settlement: { title: "Settle up",                      showBack: false },
  };
  const h = headerConfig[tab];
  const inlineSyncText = syncStatus === "pending" ? "3 waiting" : undefined;
  const fabBottomStyle = "calc(env(safe-area-inset-bottom, 0px) + 56px + 10px)";
  const fabRightStyle  = "max(16px, env(safe-area-inset-right, 16px))";
  const contentBottomPad = "calc(env(safe-area-inset-bottom, 0px) + 56px + 10px + 44px + 16px + 8px)";

  const activeExpense = subScreen?.type === "expense-detail" ? expenses.find((e) => e.id === subScreen.id) : null;
  const activeMember  = subScreen?.type === "member-detail"  ? members.find((m) => m.id === subScreen.id)  : null;

  const PageContent = () => (
    <>
      {tab === "home"       && <HomeView       expenses={expenses} members={members} onTabChange={setTab} empty={isEmpty} onAddExpense={() => setShowAddExpense(true)} />}
      {tab === "expenses"   && <ExpensesView   expenses={expenses} members={members} onTapExpense={(id) => setSubScreen({ type: "expense-detail", id })} />}
      {tab === "members"    && (
        <MembersView
          members={members} expenses={expenses}
          actionsOpen={membersActionsOpen} onActionsClose={() => setMembersActionsOpen(false)}
          onSetMembers={setMembers}
          onTapMember={(id) => setSubScreen({ type: "member-detail", id })}
        />
      )}
      {tab === "settlement" && (
        <SettlementView
          members={members}
          recordedSettlements={recordedSettlements}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onRecordSettlement={handleRecordSettlement}
          onOpenHistory={() => setSubScreen({ type: "settlement-history" })}
        />
      )}
    </>
  );

  return (
    <div className="h-full bg-[#F4F6F9] overflow-hidden">

      {/* ══ MOBILE ══ */}
      <div className="flex flex-col h-full lg:hidden">
        <div className={`sticky top-0 z-20 bg-white transition-shadow duration-200 ${scrolled ? "shadow-[0_1px_12px_rgba(15,23,42,0.07)]" : "border-b border-[#E1E7EF]"}`}>
          <div className="safe-top" />
          <AppHeader
            title={h.title} subtitle={h.subtitle}
            scrolled={scrolled && tab === "home"} showBack={h.showBack}
            inlineSync={tab === "home" ? inlineSyncText : undefined}
            action={
              tab === "home" ? (
                <button className="pressable w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-700 shrink-0" style={{ backgroundColor: "#0A86A0" }} aria-label="Account">RI</button>
              ) : tab === "members" ? (
                <button onClick={() => setMembersActionsOpen(true)} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#0A86A0]" aria-label="Add member"><IconPlus size={19} /></button>
              ) : tab === "settlement" ? (
                <button onClick={() => setSubScreen({ type: "settlement-history" })} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569]" aria-label="Settlement history"><IconHistory size={18} /></button>
              ) : (
                <button className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569]" aria-label="More options"><IconDots size={18} /></button>
              )
            }
          />
          <SyncBanner status={syncStatus} />
        </div>

        <div ref={mobileScrollRef} onScroll={handleMobileScroll} className="flex-1 overflow-y-auto bg-[#F4F6F9]" style={{ paddingBottom: contentBottomPad }}>
          <PageContent />
        </div>

        <div className="fixed z-30" style={{ bottom: fabBottomStyle, right: fabRightStyle }}>
          <button
            onClick={() => setShowAddExpense(true)}
            className="pressable flex items-center gap-1.5 px-4 h-11 rounded-full bg-[#0A86A0] text-white font-700 text-[13px] shadow-[0_1px_6px_rgba(10,134,160,0.18),0_2px_12px_rgba(10,134,160,0.10)] active:scale-95 transition-all"
          >
            <IconPlus size={16} />
            Add expense
          </button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#E1E7EF] safe-bottom">
          <BottomNavBar active={tab} onChange={setTab} />
        </div>
      </div>

      {/* ══ DESKTOP ══ */}
      <div className="hidden lg:flex h-full">
        <aside className="w-[220px] shrink-0 flex flex-col bg-white border-r border-[#E1E7EF] safe-top safe-bottom" style={{ animation: "sidebarIn 200ms ease" }}>
          <div className="px-5 pt-5 pb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[8px] bg-[#EFF9FB] text-[#0A86A0] flex items-center justify-center"><IconMapPin size={14} /></div>
              <span className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-widest">Active tour</span>
            </div>
            <p className="text-[14px] font-700 text-[#0F172A] leading-snug">{TOUR.name}</p>
            <p className="text-[12px] text-[#94A3B8] font-500 mt-1">{TOUR.dates}</p>
          </div>
          <SidebarNav active={tab} onChange={setTab} />
          <div className="px-4 py-4 border-t border-[#F1F5F9]">
            <button onClick={() => setShowAddExpense(true)} className="pressable w-full flex items-center justify-center gap-2 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_8px_rgba(10,134,160,0.18)]">
              <IconPlus size={17} />Add expense
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden safe-top">
          <div className="sticky top-0 z-20 bg-white border-b border-[#E1E7EF]">
            <div className="max-w-[720px] mx-auto px-6 h-[52px] flex items-center gap-3">
              <h1 className="text-[15px] font-700 text-[#0F172A] flex-1 truncate">{h.title}</h1>
              {tab === "members" ? (
                <button onClick={() => setMembersActionsOpen(true)} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#0A86A0] hover:bg-[#EFF9FB]" aria-label="Add member"><IconPlus size={19} /></button>
              ) : tab === "settlement" ? (
                <button onClick={() => setSubScreen({ type: "settlement-history" })} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9]" aria-label="Settlement history"><IconHistory size={18} /></button>
              ) : (
                <button className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9]" aria-label="More options"><IconDots size={18} /></button>
              )}
            </div>
            <SyncBanner status={syncStatus} />
          </div>
          <div className="flex-1 overflow-y-auto bg-[#F4F6F9]" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 6)}>
            <div className="max-w-[720px] mx-auto pb-12">
              <PageContent />
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Expense ─────────────────────────────────────────────── */}
      {(showAddExpense || editingExpense) && (
        <AddExpense
          tourName={TOUR.name}
          members={members.map((m) => ({
            id: m.id, name: m.isMe ? "Rafi" : m.name, initials: m.initials, color: m.color, isMe: m.isMe,
          }))}
          tourStartDate={TOUR.startDate}
          tourEndDate={TOUR.endDate}
          initialExpense={editingExpense ? {
            id:          editingExpense.id,
            amount:      editingExpense.amount,
            title:       editingExpense.title,
            category:    editingExpense.category,
            paidBy:      editingExpense.paidBy,
            splitIds:    editingExpense.splitIds,
            dateIso:     editingExpense.dateIso,
            note:        editingExpense.note,
          } : undefined}
          mode={editingExpense ? "edit" : "add"}
          onClose={() => { setShowAddExpense(false); setEditingExpense(null); }}
          onSave={handleExpenseSave}
        />
      )}

      {/* ── Expense Details ────────────────────────────────────────────────── */}
      {activeExpense && (
        <ExpenseDetails
          expense={activeExpense}
          members={members}
          onBack={() => setSubScreen(null)}
          onEdit={() => {
            setSubScreen(null);
            setEditingExpense(activeExpense);
          }}
          onDelete={() => handleDeleteExpense(activeExpense.id)}
        />
      )}

      {/* ── Member Details ─────────────────────────────────────────────────── */}
      {activeMember && (
        <MemberDetails
          member={activeMember}
          allMembers={members}
          allExpenses={expenses}
          recordedSettlements={recordedSettlements}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onBack={() => setSubScreen(null)}
          onSetMembers={setMembers}
          onRemove={() => handleRemoveMember(activeMember.id)}
        />
      )}

      {/* ── Settlement History ─────────────────────────────────────────────── */}
      {subScreen?.type === "settlement-history" && (
        <SettlementHistoryView
          recordedSettlements={recordedSettlements}
          members={members}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onDeleteSettlement={handleDeleteSettlement}
          onBack={() => setSubScreen(null)}
        />
      )}
    </div>
  );
}
