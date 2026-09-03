import type { Expense, Member } from "../../domain/types";
import type { Tab } from "../../types/navigation";
import StatRow from "./components/StatRow";
import RecentExpenses from "./components/RecentExpenses";
import QuickBalances from "./components/QuickBalances";

export default function HomeView({ expenses, members, onTabChange, empty = false, onAddExpense }: {
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