/**
 * Trends Box Quota, TRB Points & Midnight Reset Utility
 * 
 * - Accurately tracks daily generation limits anchored strictly to 12:00 AM (midnight)
 *   Nigeria local time (West Africa Time, Africa/Lagos, UTC+1).
 * - Base Daily Free Quota: 6 generations.
 * - Rewarded Ads & TRB Points: Each completed ad grants +5 TRB bonus quotas.
 * - Maximum Rewarded Ads: 10 per day (up to +50 bonus TRB points).
 * - Access Gate: Ads can ONLY be watched once the initial 6 daily quotas are exhausted.
 */

import { supabase } from './supabase';
import { ADS_CONFIG } from './adsConfig';

export const DAILY_LIMIT = 6; // Reduced from 10 to 6 as requested
export const TRB_POINTS_PER_AD = ADS_CONFIG.rewards.pointsPerAd; // 5 TRB per ad
export const MAX_TRB_ADS_PER_DAY = ADS_CONFIG.rewards.maxAdsPerDay; // 10 ads max per day

/**
 * Returns the current date formatted as YYYY-MM-DD in Nigeria local time (Africa/Lagos, UTC+1).
 * Nigeria does not observe DST, so it is strictly UTC+1 year-round.
 */
export function getNigeriaDateKey(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch {
    const wat = new Date(date.getTime() + 60 * 60 * 1000);
    return wat.toISOString().split('T')[0];
  }
}

/**
 * Calculates live countdown until the next 12:00 AM (midnight) in Nigeria (Africa/Lagos).
 */
export function getTimeUntilNigeriaMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
  diffSeconds: number;
  isPastMidnight: boolean;
} {
  const now = new Date();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      hour12: false,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });

    const parts = formatter.formatToParts(now);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') {
        map[p.type] = parseInt(p.value, 10);
      }
    }

    const hour = (map.hour || 0) % 24;
    const minute = map.minute || 0;
    const second = map.second || 0;

    const secondsElapsedToday = hour * 3600 + minute * 60 + second;
    const totalSecondsInDay = 86400; // 24 * 3600
    let diffSeconds = totalSecondsInDay - secondsElapsedToday;

    if (diffSeconds <= 0 || diffSeconds > 86400) {
      diffSeconds = 0;
    }

    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      diffSeconds,
      isPastMidnight: diffSeconds === 0
    };
  } catch {
    const watNow = new Date(now.getTime() + 60 * 60 * 1000);
    const midnight = new Date(watNow);
    midnight.setUTCHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - watNow.getTime());
    const totalSecs = Math.floor(diff / 1000);

    return {
      hours: Math.floor(totalSecs / 3600),
      minutes: Math.floor((totalSecs % 3600) / 60),
      seconds: totalSecs % 60,
      diffSeconds: totalSecs,
      isPastMidnight: totalSecs === 0
    };
  }
}

function getStorageKey(userId?: string | null): string {
  return userId ? `trendsbox_usage_${userId}` : 'trendsbox_usage_guest';
}

function getTrbStorageKey(userId?: string | null): string {
  return userId ? `trendsbox_trb_${userId}` : 'trendsbox_trb_guest';
}

export interface TrbDailyState {
  adsWatched: number; // 0 to 10
  bonusPoints: number; // adsWatched * 5
}

/**
 * Retrieves today's earned TRB bonus points for the user.
 */
export function getLocalTrbState(userId?: string | null): TrbDailyState {
  if (typeof window === 'undefined') return { adsWatched: 0, bonusPoints: 0 };

  try {
    const key = getTrbStorageKey(userId);
    const raw = localStorage.getItem(key);
    const today = getNigeriaDateKey();

    if (!raw) return { adsWatched: 0, bonusPoints: 0 };

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const todayEntry = parsed[today];
      if (todayEntry && typeof todayEntry.adsWatched === 'number') {
        return {
          adsWatched: todayEntry.adsWatched,
          bonusPoints: todayEntry.adsWatched * TRB_POINTS_PER_AD
        };
      }
      // Stale date -> reset
      localStorage.setItem(key, JSON.stringify({ [today]: { adsWatched: 0 } }));
    }
    return { adsWatched: 0, bonusPoints: 0 };
  } catch {
    return { adsWatched: 0, bonusPoints: 0 };
  }
}

/**
 * Calculates current effective limit for the day:
 * Effective Limit = 6 (Base) + Earned TRB Points
 */
export function getEffectiveLimit(userId?: string | null): number {
  const trb = getLocalTrbState(userId);
  return DAILY_LIMIT + trb.bonusPoints;
}

/**
 * Checks whether the user is eligible to watch a rewarded ad:
 * 1. Must have consumed at least the base DAILY_LIMIT (6).
 * 2. Must not have exceeded MAX_TRB_ADS_PER_DAY (10).
 */
export function canWatchRewardedAd(count: number, userId?: string | null): boolean {
  if (count < DAILY_LIMIT) {
    return false; // Gate: Cannot watch ads while base 6 free quotas are still available
  }
  const trb = getLocalTrbState(userId);
  return trb.adsWatched < MAX_TRB_ADS_PER_DAY;
}

/**
 * Adds 1 completed ad view (+5 TRB points) to user's quota.
 * Persists locally and synchronizes to Supabase user metadata.
 */
export async function addTrbReward(userId?: string | null): Promise<TrbDailyState> {
  const today = getNigeriaDateKey();
  const key = getTrbStorageKey(userId);

  const current = getLocalTrbState(userId);
  const nextAdsWatched = Math.min(MAX_TRB_ADS_PER_DAY, current.adsWatched + 1);
  const nextBonus = nextAdsWatched * TRB_POINTS_PER_AD;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify({
        [today]: { adsWatched: nextAdsWatched }
      }));
    } catch (e) {
      console.warn('Failed to save TRB reward locally:', e);
    }
  }

  // Sync to Supabase user metadata in background
  if (userId) {
    (async () => {
      try {
        await supabase.auth.updateUser({
          data: {
            trb_rewards: {
              date: today,
              adsWatched: nextAdsWatched,
              bonusPoints: nextBonus
            }
          }
        });
      } catch (err) {
        console.warn('Supabase TRB sync skipped:', err);
      }
    })();
  }

  return { adsWatched: nextAdsWatched, bonusPoints: nextBonus };
}

/**
 * Retrieves the current day's usage count for a user in Nigeria time.
 */
export function getLocalUsageCount(userId?: string | null): number {
  if (typeof window === 'undefined') return 0;

  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    const today = getNigeriaDateKey();

    if (!raw) return 0;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed[today] === 'number') {
        return parsed[today];
      }
      localStorage.setItem(key, JSON.stringify({ [today]: 0 }));
      return 0;
    }

    return 0;
  } catch {
    return 0;
  }
}

/**
 * Saves and increments today's usage count in localStorage and attempts
 * a background sync to Supabase.
 */
export async function incrementUsageCount(userId?: string | null): Promise<number> {
  const today = getNigeriaDateKey();
  const key = getStorageKey(userId);

  let nextCount = 1;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      const current = typeof data[today] === 'number' ? data[today] : 0;
      nextCount = current + 1;

      localStorage.setItem(key, JSON.stringify({ [today]: nextCount }));
      localStorage.setItem('trendsbox_last_nigeria_date', today);
    } catch (e) {
      console.warn('Failed to write usage to localStorage', e);
    }
  }

  // Non-blocking background sync with Supabase
  if (userId) {
    (async () => {
      try {
        const { data: usageData } = await supabase
          .from('usage')
          .select('count')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();

        const serverCount = (usageData?.count || 0) + 1;
        await supabase
          .from('usage')
          .upsert({
            user_id: userId,
            date: today,
            count: Math.max(serverCount, nextCount)
          }, { onConflict: 'user_id,date' });
      } catch (err) {
        console.warn('Background Supabase usage sync skipped:', err);
      }
    })();
  }

  return nextCount;
}

/**
 * Synchronizes local usage with Supabase if online.
 */
export async function syncUsageWithServer(userId?: string | null): Promise<number> {
  const localCount = getLocalUsageCount(userId);
  if (!userId) return localCount;

  const today = getNigeriaDateKey();

  try {
    const { data, error } = await supabase
      .from('usage')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (!error && data && typeof data.count === 'number') {
      const maxCount = Math.max(localCount, data.count);
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify({ [today]: maxCount }));
      return maxCount;
    }
  } catch (err) {
    console.warn('Supabase usage check skipped (using local quota):', err);
  }

  return localCount;
}
