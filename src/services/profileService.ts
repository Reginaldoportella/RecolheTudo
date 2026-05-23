import AsyncStorage from "@react-native-async-storage/async-storage";

import { collectionsService } from "./collectionsService";
import type {
  DailySummary,
  MaterialsSummary,
  ProductivitySummary,
} from "../domain/types/collection";

const GOAL_KEY = "profile_goal_daily_kg";
const DEFAULT_GOAL = 20;
const DAYS = 7;

export interface ProfileDashboard {
  goalKg: number;
  weeklySummaries: DailySummary[];
  productivitySummary: ProductivitySummary;
  materialsSummary: MaterialsSummary;
}

export const profileService = {
  daysWindow: DAYS,

  async loadDashboard(): Promise<ProfileDashboard> {
    const stored = await AsyncStorage.getItem(GOAL_KEY);
    const parsedGoal = stored ? parseFloat(stored) : DEFAULT_GOAL;
    const goalKg = Number.isNaN(parsedGoal) ? DEFAULT_GOAL : parsedGoal;
    const today = new Date().toISOString().slice(0, 10);
    const [weeklySummary, productivitySummary, materialsSummary] = await Promise.all([
      collectionsService.getWeeklySummary(today),
      collectionsService.getProductivitySummary("weekly", today),
      collectionsService.getMaterialsSummary("weekly", today),
    ]);

    return {
      goalKg,
      weeklySummaries: weeklySummary.dailySummaries,
      productivitySummary,
      materialsSummary,
    };
  },

  async saveDailyGoal(goalKg: number): Promise<void> {
    await AsyncStorage.setItem(GOAL_KEY, String(goalKg));
  },
};
