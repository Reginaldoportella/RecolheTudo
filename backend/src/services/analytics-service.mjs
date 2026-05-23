import {
  getDailySummary as getDailySummaryFromDb,
  getMaterialsSummary as getMaterialsSummaryFromDb,
  getProductivitySummary as getProductivitySummaryFromDb,
} from "../data/collections-repository.mjs";

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

  return buildWeeklySummary(referenceDate, dailySummaries);
}

export function buildWeeklySummary(referenceDate, dailySummaries) {
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

export async function getAnalyticsSummary(period, date) {
  if (period === "daily") {
    return getDailySummary(date);
  }

  return getWeeklySummary(date);
}

export async function getAnalyticsMaterials(period, date) {
  return getMaterialsSummaryFromDb(date, period);
}

export async function getAnalyticsProductivity(period, date) {
  return getProductivitySummaryFromDb(date, period);
}
