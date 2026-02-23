/**
 * Behavioral engagement logic:
 * - Positive reinforcement messages
 * - Savings milestone detection
 * - Usage streak logic
 */

export function getPositiveReinforcementMessage(
  financialScore: number,
  burnRateVsBaseline: number, // ratio
  savingsGrowth: number,
  streakDays: number
): string {
  const messages: string[] = [];

  if (financialScore >= 80) {
    messages.push("You're doing great with your finances!");
  }
  if (financialScore >= 70 && financialScore < 80) {
    messages.push("Nice progress. Keep it up!");
  }
  if (burnRateVsBaseline > 0 && burnRateVsBaseline <= 0.8) {
    messages.push("Your spending is under control.");
  }
  if (savingsGrowth > 0) {
    messages.push("Your savings are growing.");
  }
  if (streakDays >= 3) {
    messages.push(`${streakDays} days in a row—strong habit!`);
  }
  if (streakDays >= 7) {
    messages.push("A full week of check-ins. Well done!");
  }

  if (messages.length === 0) {
    return "Every small step counts. You've got this.";
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

export function detectSavingsMilestone(
  currentBalance: number,
  previousBalance: number,
  thresholds: number[] = [500, 1000, 2500, 5000, 10000]
): { milestone: number; message: string } | null {
  for (const threshold of thresholds) {
    if (previousBalance < threshold && currentBalance >= threshold) {
      return {
        milestone: threshold,
        message: `You reached Le ${threshold.toLocaleString()} in savings!`,
      };
    }
  }
  return null;
}

export function calculateUsageStreak(
  transactionDates: string[],
  referenceDate: Date = new Date()
): number {
  const dateSet = new Set(
    transactionDates.map((ts) => new Date(ts).toDateString())
  );
  if (dateSet.size === 0) return 0;

  const sorted = Array.from(dateSet).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  const mostRecent = sorted[0];
  let checkDate = new Date(mostRecent);
  let streak = 0;

  for (let i = 0; i < 31; i++) {
    const dStr = checkDate.toDateString();
    if (dateSet.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
