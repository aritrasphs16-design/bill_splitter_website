export type Transaction = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  toUpiId?: string;
  amount: number;
};

export type Member = {
  id: string;
  name: string;
  upiId?: string;
};

export type CustomSplit = {
  user_id: string;
  amount: number;
};

export type ExpenseInfo = {
  paidBy: string;
  amount: number;
  splits?: CustomSplit[] | null;
};

export type SettlementInfo = {
  paidBy: string;
  paidTo: string;
  amount: number;
};

export function calculateSettlements(members: Member[], expenses: ExpenseInfo[], settlements: SettlementInfo[] = []): Transaction[] {
  if (members.length === 0) return [];

  // Initialize net balances
  const balances: Record<string, number> = {};
  const upiMap: Record<string, string> = {};
  members.forEach(m => {
    balances[m.id] = 0;
    if (m.upiId) upiMap[m.id] = m.upiId;
  });

  // Add what each person paid for group expenses
  // and subtract what each person owes
  expenses.forEach(e => {
    // Add what the person paid
    if (balances[e.paidBy] !== undefined) {
      balances[e.paidBy] += e.amount;
    }

    if (e.splits && e.splits.length > 0) {
      // Custom splits
      e.splits.forEach(split => {
        if (balances[split.user_id] !== undefined) {
          balances[split.user_id] -= split.amount;
        }
      });
    } else {
      // Equal split
      const sharePerPerson = e.amount / members.length;
      members.forEach(m => {
        balances[m.id] -= sharePerPerson;
      });
    }
  });

  // Apply manual direct settlements (A pays B)
  settlements.forEach(s => {
    if (balances[s.paidBy] !== undefined) balances[s.paidBy] += s.amount;
    if (balances[s.paidTo] !== undefined) balances[s.paidTo] -= s.amount;
  });

  // Separate debtors (negative balance) and creditors (positive balance)
  const debtors = members
    .map(m => ({ id: m.id, name: m.name, balance: balances[m.id] }))
    .filter(m => m.balance < -0.01)
    .sort((a, b) => a.balance - b.balance); // Ascending: Most negative first

  const creditors = members
    .map(m => ({ id: m.id, name: m.name, balance: balances[m.id] }))
    .filter(m => m.balance > 0.01)
    .sort((a, b) => b.balance - a.balance); // Descending: Most positive first

  const transactions: Transaction[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        from: debtor.id,
        fromName: debtor.name,
        to: creditor.id,
        toName: creditor.name,
        toUpiId: upiMap[creditor.id],
        amount: roundedAmount,
      });
    }

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) dIdx++;
    if (Math.abs(creditor.balance) < 0.01) cIdx++;
  }

  return transactions;
}
