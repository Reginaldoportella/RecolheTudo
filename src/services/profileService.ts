import AsyncStorage from "@react-native-async-storage/async-storage";

import { collectionsService } from "./collectionsService";
import type { DailySummary } from "../domain/types/collection";

const GOAL_KEY = "profile_goal_daily_kg";
const DEFAULT_GOAL = 20;
const DAYS = 7;

export interface ProfileDashboard {
  goalKg: number;
  weeklySummaries: DailySummary[];
}

function getPastDates(count: number): string[] {
  const dates: string[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates;
}

export const profileService = {
  daysWindow: DAYS,

  async loadDashboard(): Promise<ProfileDashboard> {
    const stored = await AsyncStorage.getItem(GOAL_KEY);
    const parsedGoal = stored ? parseFloat(stored) : DEFAULT_GOAL;
    const goalKg = Number.isNaN(parsedGoal) ? DEFAULT_GOAL : parsedGoal;
    const dates = getPastDates(DAYS);
    const weeklySummaries = await Promise.all(
      dates.map((date) => collectionsService.getDailySummary(date)),
    );

    return { goalKg, weeklySummaries };
  },

  async saveDailyGoal(goalKg: number): Promise<void> {
    await AsyncStorage.setItem(GOAL_KEY, String(goalKg));
  },
};
