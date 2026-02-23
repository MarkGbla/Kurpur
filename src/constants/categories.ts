export const INCOME_CATEGORIES = [
  { id: "allowance", label: "Allowance" },
  { id: "salary", label: "Salary" },
  { id: "gift", label: "Gift" },
  { id: "side_income", label: "Side Income" },
  { id: "other_income", label: "Other" },
] as const;

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food" },
  { id: "transport", label: "Transport" },
  { id: "school", label: "School" },
  { id: "entertainment", label: "Entertainment" },
  { id: "data", label: "Data & Airtime" },
  { id: "personal", label: "Personal" },
  { id: "other_expense", label: "Other" },
] as const;
