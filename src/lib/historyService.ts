import { supabase } from './supabase';
import { GenerationRecord } from '../types';

export const RETENTION_MAX_ITEMS = 10;
export const RETENTION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Automatically cleans up stale generation records from Supabase and localStorage.
 * Rule:
 *  - Up to 10 most recent generations are always preserved for fetching.
 *  - If a user has more than 10 generations, any excess records beyond the top 10
 *    that are older than 24 hours are permanently deleted from the database.
 * This optimizes database storage and index efficiency.
 */
export async function pruneStaleHistory(userId: string | undefined): Promise<{ deletedCount: number }> {
  let deletedCount = 0;

  // 1. Supabase Database Auto-Cleanup
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('history')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > RETENTION_MAX_ITEMS) {
        // Items ranked beyond the top 10
        const excessItems = data.slice(RETENTION_MAX_ITEMS);
        const cutoffTime = Date.now() - RETENTION_WINDOW_MS;

        const staleIds = excessItems
          .filter(item => {
            const itemTime = new Date(item.created_at).getTime();
            return !isNaN(itemTime) && itemTime < cutoffTime;
          })
          .map(item => item.id);

        if (staleIds.length > 0) {
          const { error: delError } = await supabase
            .from('history')
            .delete()
            .in('id', staleIds)
            .eq('user_id', userId);

          if (delError) {
            console.warn('[DB Optimization] Failed to prune stale history from Supabase:', delError);
          } else {
            deletedCount = staleIds.length;
            console.log(`[DB Optimization] Successfully auto-deleted ${staleIds.length} stale generation(s) (>10 items and >24h old).`);
          }
        }
      }
    } catch (err) {
      console.warn('[DB Optimization] Error checking stale history in Supabase:', err);
    }
  }

  // 2. Synchronize Local Storage
  try {
    const rawLocal = localStorage.getItem('trendsbox_history');
    if (rawLocal) {
      const localItems: any[] = JSON.parse(rawLocal);
      if (Array.isArray(localItems) && localItems.length > RETENTION_MAX_ITEMS) {
        const cutoffTime = Date.now() - RETENTION_WINDOW_MS;
        const top10 = localItems.slice(0, RETENTION_MAX_ITEMS);
        const excess = localItems.slice(RETENTION_MAX_ITEMS);

        const keptExcess = excess.filter(item => {
          const itemTime = new Date(item.timestamp || item.created_at).getTime();
          return !isNaN(itemTime) && itemTime >= cutoffTime;
        });

        const pruned = [...top10, ...keptExcess];
        if (pruned.length < localItems.length) {
          localStorage.setItem('trendsbox_history', JSON.stringify(pruned));
        }
      }
    }
  } catch (localErr) {
    console.warn('[DB Optimization] Error checking local history:', localErr);
  }

  return { deletedCount };
}
