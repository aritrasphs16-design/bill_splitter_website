export type Transaction = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
};

export type Member = {
  id: string;
  name: string;
};

export type ExpenseInfo = {
  paidBy: string;
  amount: number;
};

export function calculateSettlements(members: Member[], expenses: ExpenseInfo[]): Transaction[] {
  if (members.length === 0) return [];

  // Initialize net balances
  const balances: Record<string, number> = {};
  members.forEach(m => balances[m.id] = 0);

  // Add what each person paid
  expenses.forEach(e => {
    // Only process expenses for current members (just in case)
    if (balances[e.paidBy] !== undefined) {
      balances[e.paidBy] += e.amount;
    }
  });

  // Subtract what each person owes
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const sharePerPerson = totalSpent / members.length;

  members.forEach(m => {
    balances[m.id] -= sharePerPerson;
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
