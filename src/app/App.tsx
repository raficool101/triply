import { useState, useRef, useEffect, type ReactNode } from "react";
import { AuthFlow } from "../features/auth/Auth";
import TourList from "../features/tours/TourList";
import CreateTour from "../features/tours/CreateTour";
import InviteMembers from "../features/tours/InviteMembers";
import InviteAcceptFlow from "../features/tours/InviteAccept";
import AddExpense from "../features/expenses/AddExpense";
import { Avatar } from "../components/shared/Avatar";
import { fmt } from "../lib/format";
import Sheet from "../components/shared/Sheet";
import SettlementToast from "../features/settlements/components/SettlementToast";
import RecordPaymentSheet from "../features/settlements/components/RecordPaymentSheet";
import SettlementHistoryView from "../features/settlements/SettlementHistoryView";
import SettlementView from "../features/settlements/SettlementView";
import StatRow from "../features/home/components/StatRow";
import RecentExpenses from "../features/home/components/RecentExpenses";
import { BUDGET } from "../features/home/homeConstants";

const DEMO_INVITE_MODE = false;

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "home" | "expenses" | "members" | "settlement";
type SyncStatus = "online" | "offline" | "syncing" | "pending" | "failed";

import type { Member, Expense, RecordedSettlement } from "../domain/types";
import type { SuggestedPayment } from "../features/settlements/settlementUtils";
import { MemberRowCompact, MemberRow } from "../features/members/components/MemberRow";
import RemoveMemberConfirmSheet from "../features/members/components/RemoveMemberConfirmSheet";
import EditNameSheet from "../features/members/components/EditNameSheet";
import InviteSheet from "../features/members/components/InviteSheet";
import AddGuestSheet from "../features/members/components/AddGuestSheet";
import MemberActionsMenu from "../features/members/components/MemberActionsMenu";
import MemberOverflowSheet from "../features/members/components/MemberOverflowSheet";
import RemoveMemberBlockedSheet from "../features/members/components/RemoveMemberBlockedSheet";
import { IconEdit, IconUserPlus, IconUserX, IconAlertCircle, IconChevronLeft, IconChevronRight, IconDots, IconDotsV, IconArrowRight, IconCheck, IconTrash, IconInfo, IconHistory, IconCheckCircle2, IconReceipt, IconMapPin } from "../components/shared/icons";
import DeleteSettlementSheet from "../features/settlements/components/DeleteSettlementSheet";
import SettlementDetailSheet from "../features/settlements/components/SettlementDetailSheet";
import Badge from "../components/shared/Badge";
import CATEGORY_META from "../lib/categoryMeta";
import MemberDetails from "../features/members/MemberDetails";
import { TOUR } from "../lib/tour";
import MembersView from "../features/members/MembersView";
import EmptyState from "../components/shared/EmptyState";





type SubScreen =
  | { type: "expense-detail"; id: string }
  | { type: "member-detail"; id: string }
  | { type: "settlement-history" }
  | null;

// ─── Sample Data ──────────────────────────────────────────────────────────────

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

// BUDGET moved to src/features/home/homeConstants.ts

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

import { hasMemberFinancialHistory } from "../features/members/memberUtils";
import { computeSuggestedPayments } from "../features/settlements/settlementUtils";

 

// CATEGORY_META moved to src/lib/categoryMeta.tsx

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
// IconAlertCircle extracted to src/components/shared/icons.tsx
function IconCloud({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  );
}
// Icons moved to src/components/shared/icons.tsx
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
// IconEdit extracted to src/components/shared/icons.tsx
// IconTrash and IconInfo moved to src/components/shared/icons.tsx
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
// IconHistory moved to src/components/shared/icons.tsx
// IconCheckCircle2 moved to src/components/shared/icons.tsx

// `Avatar` moved to `src/components/shared/Avatar.tsx`

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

// EmptyState moved to src/components/shared/EmptyState.tsx

// Bottom sheet scaffold now extracted to src/components/shared/Sheet.tsx

// ─── Feature: Home View ───────────────────────────────────────────────────────
// StatRow extracted to src/features/home/components/StatRow.tsx

// RecentExpenses extracted to src/features/home/components/RecentExpenses.tsx

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

// ─── Feature: Expenses View ───────────────────────────────────────────────────
// ExpenseRow extracted to src/features/expenses/components/ExpenseRow.tsx
import ExpenseRow from "../features/expenses/components/ExpenseRow";
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

// MemberRowCompact and MemberRow extracted to src/features/members/components/MemberRow.tsx

// MembersView extracted to src/features/members/MembersView

// ─── Feature: Member Details ──────────────────────────────────────────────────
// MemberOverflowSheet extracted to src/features/members/components/MemberOverflowSheet

// RemoveMemberBlockedSheet extracted to src/features/members/components/RemoveMemberBlockedSheet

// RemoveMemberConfirmSheet and EditNameSheet extracted to src/features/members/components/

// MemberDetails extracted to src/features/members/MemberDetails

// ─── Feature: Settlement (full experience) ────────────────────────────────────

 

// SettlementHistoryView extracted to src/features/settlements/SettlementHistoryView.tsx

// SettlementHistoryView extracted to src/features/settlements/SettlementHistoryView.tsx

// SettlementView extracted to src/features/settlements/SettlementView.tsx

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
    return <TourList onSelectTour={(id: string) => { setActiveTourId(id); setScreen("tour"); }} onNewTour={() => setScreen("createTour")} />;
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
