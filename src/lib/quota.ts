/**
 * Trends Box Quota & Midnight Reset Utility
 * 
 * Accurately tracks daily generation limits anchored strictly to 12:00 AM (midnight)
 * Nigeria local time (West Africa Time, Africa/Lagos, UTC+1).
 * 
 * Works 100% offline, resilient across logouts and logins, without database lockouts.
 */

import { supabase } from './supabase';

export const DAILY_LIMIT = 10;

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
    // Fallback: Nigeria is UTC+1 (60 minutes ahead of UTC)
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
    // Fallback calculation using UTC+1
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

/**
 * Retrieves the current day's usage count for a user in Nigeria time.
 * If the recorded count was from yesterday or earlier, it automatically resets to 0.
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
      // If we have an entry for today's Nigerian date, return it
      if (typeof parsed[today] === 'number') {
        return parsed[today];
      }
      // If today is a new day, clear older entries and reset
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
 * a background sync to Supabase without blocking the client.
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

      // Retain only today to keep storage lean and prevent stale lockouts
      localStorage.setItem(key, JSON.stringify({ [today]: nextCount }));

      // Also update generic key for backup
      localStorage.setItem('trendsbox_last_nigeria_date', today);
    } catch (e) {
      console.warn('Failed to write to localStorage', e);
    }
  }

  // Non-blocking background sync with Supabase if user is logged in
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
        // Silently catch database errors so user is never locked out due to network or DB schema
        console.warn('Background Supabase usage sync skipped:', err);
      }
    })();
  }

  return nextCount;
}

/**
 * Synchronizes local usage with Supabase if online, taking the max count
 * for today's Nigeria date without locking the user out on network failure.
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
