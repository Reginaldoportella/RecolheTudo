import { getDailySummary as getDailySummaryFromDb } from "../data/collections-repository.mjs";

export async function getDailySummary(date) {
  return getDailySummaryFromDb(date);
}

export async function getWeeklySummary(referenceDate) {
  const end = new Date(`${referenceDate}T00:00:00.000Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const dailySummaries = [];

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    dailySummaries.push(await getDailySummary(day.toISOString().slice(0, 10)));
  }

  return {
    startDate: dailySummaries[0]?.date ?? referenceDate,
    endDate: dailySummaries.at(-1)?.date ?? referenceDate,
    totalKg: dailySummaries.reduce((total, summary) => total + summary.totalKg, 0),
    collectionsCount: dailySummaries.reduce(
      (total, summary) => total + summary.collectionsCount,
      0,
    ),
    dailySummaries,
  };
}
