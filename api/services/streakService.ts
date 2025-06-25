import { get, post } from '../config/axiosConfig';

// Types
export interface StreakData {
  current: number;
  highest: {
    count: number;
    startDate?: string;
    endDate?: string;
    timeline: Array<{
      date: string;
      activity: string;
      sessionId?: string;
    }>;
  };
  lastActivityDate?: string;
  todayActivity?: {
    hasActivity: boolean;
    activitiesCount: number;
    rewardsClaimed: boolean;
    availableRewards: number;
  };
  recentActivities: Array<{
    date: string;
    activitiesCount: number;
    coinsEarned: number;
    streakDay: number;
  }>;
}

export interface ActivityRecordResult {
  streakUpdated: boolean;
  isFirstActivityToday: boolean;
  currentStreak: number;
  highestStreak: number;
  dailyRewards: {
    baseReward: number;
    streakBonus: number;
    totalCoins: number;
    claimed: boolean;
  };
  coinsEarned: number;
}

export interface StreakStats {
  current: number;
  highest: {
    count: number;
    timeline: Array<{
      date: string;
      activity: string;
    }>;
  };
  todayActivity: {
    hasActivity: boolean;
    activitiesCount: number;
    rewardsClaimed: boolean;
    availableRewards: number;
    breakdown?: {
      baseReward: number;
      streakBonus: number;
    };
  };
  totalEarnings: {
    coinsFromStreaks: number;
    activeDays: number;
  };
  nextMilestone: {
    type: 'weekly' | 'monthly';
    target: number;
    remaining: number;
    reward: number;
  } | null;
  weeklyReportsCount: number;
}

// Get user's streak data
export const getStreakData = async (): Promise<StreakData> => {
  try {
    const response = await get('/api/v1/streak/data');
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to get streak data');
  } catch (error) {
    console.error('Error getting streak data:', error);
    throw error;
  }
};

// Get streak statistics
export const getStreakStats = async (): Promise<StreakStats> => {
  try {
    const response = await get('/api/v1/streak/stats');
    if (response.data.variant === 'success') {
      return response.data.myData;
    }
    throw new Error(response.data.message || 'Failed to get streak stats');
  } catch (error) {
    console.error('Error getting streak stats:', error);
    throw error;
  }
};

// Utility functions
export const getStreakEmoji = (streak: number): string => {
  if (streak >= 100) return '💯';
  if (streak >= 50) return '🔥';
  if (streak >= 30) return '⭐';
  if (streak >= 7) return '💪';
  if (streak >= 3) return '🚀';
  return '🎯';
};

export const getStreakMessage = (streak: number): string => {
  if (streak >= 100) return 'Century Club! Amazing dedication!';
  if (streak >= 50) return 'On fire! Incredible consistency!';
  if (streak >= 30) return 'Monthly master! Keep it up!';
  if (streak >= 7) return 'Week warrior! Great progress!';
  if (streak >= 3) return 'Building momentum!';
  if (streak >= 1) return 'Great start!';
  return 'Start your streak today!';
};

// Weekly Report Types
export interface WeeklyReport {
  _id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  streakData: {
    weekStartStreak: number;
    weekEndStreak: number;
    daysActiveThisWeek: number;
    activitiesCompleted: Array<{
      date: string;
      activity: string;
    }>;
  };
  sessionStats: {
    totalSessions: number;
    aiSessions: number;
    peerSessions: number;
    totalDuration: number;
    averageSessionDuration: number;
  };
  achievements: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
  progressMetrics: {
    improvementPercentage: number;
    consistencyScore: number;
    engagementScore: number;
  };
  badgeData: {
    shareableText: string;
    socialMediaText: string;
  };
  shareData: {
    isShared: boolean;
    shareRewardClaimed: boolean;
  };
  createdAt: string;
}

// Weekly Reports API functions
export const getWeeklyReports = async (): Promise<WeeklyReport[]> => {
  try {
    const response = await get('/api/v1/streak/weekly-reports');
    if (response.data.variant === 'success') {
      return response.data.myData || [];
    }
    throw new Error(response.data.message || 'Failed to get weekly reports');
  } catch (error) {
    console.error('Error fetching weekly reports:', error);
    throw error;
  }
};

export const shareWeeklyReport = async (reportId: string): Promise<{
  success: boolean;
  shareReward?: number;
  shareRewardClaimed?: boolean;
}> => {
  try {
    const response = await post('/api/v1/streak/share-report', { reportId });
    if (response.data.variant === 'success') {
      return response.data.myData || { success: false };
    }
    throw new Error(response.data.message || 'Failed to share weekly report');
  } catch (error) {
    console.error('Error sharing weekly report:', error);
    throw error;
  }
};

// Utility functions for date formatting
export const formatStreakDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export const calculateStreakDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}; 