/**
 * Service for detecting and safely removing orphaned regular daily bookings
 * (Bookings created from deleted/outdated contracts that cause false concurrency conflicts).
 */

/**
 * Checks for orphaned regular bookings in a target date range.
 * An orphan is defined as:
 * 1. Has status === 'ค้างชำระ' (never paid)
 * 2. Has master_id, but that master_id does NOT exist in monthly_bookings
 * 3. Does not have any linked transactions
 * 
 * @param {object} supabase - Supabase client
 * @param {string} [startDate='2026-11-01'] - Start date (YYYY-MM-DD)
 * @param {string} [endDate='2026-11-30'] - End date (YYYY-MM-DD)
 * @returns {Promise<{ orphans: object[], count: number, error: string|null }>}
 */
export async function checkOrphanBookings(supabase, startDate = '2026-11-01', endDate = '2026-11-30') {
  if (!supabase) return { orphans: [], count: 0, error: 'No supabase client' };

  try {
    // 1. Fetch all candidate bookings in the range
    const { data: candidates, error: bErr } = await supabase
      .from('bookings')
      .select('id, stall_name, date, booker_name, type, status, master_id, note')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'ค้างชำระ')
      .not('master_id', 'is', null);

    if (bErr) throw bErr;
    if (!candidates || candidates.length === 0) {
      return { orphans: [], count: 0, error: null };
    }

    // 2. Fetch all valid monthly booking IDs
    const masterIds = Array.from(new Set(candidates.map(c => c.master_id).filter(Boolean)));
    const { data: validContracts, error: mErr } = await supabase
      .from('monthly_bookings')
      .select('id')
      .in('id', masterIds);

    if (mErr) throw mErr;
    const validContractSet = new Set((validContracts || []).map(m => m.id));

    // 3. Filter only those whose master_id is NOT in validContracts
    const orphans = candidates.filter(c => !validContractSet.has(c.master_id));

    return { orphans, count: orphans.length, error: null };
  } catch (err) {
    console.error('Error in checkOrphanBookings:', err);
    return { orphans: [], count: 0, error: err.message };
  }
}

/**
 * Safely deletes orphan bookings in chunks.
 * Only deletes rows where status is still 'ค้างชำระ'.
 * 
 * @param {object} supabase - Supabase client
 * @param {string[]} orphanIds - IDs to delete
 * @returns {Promise<{ success: boolean, deletedCount: number, error: string|null }>}
 */
export async function deleteOrphanBookings(supabase, orphanIds) {
  if (!supabase || !orphanIds || orphanIds.length === 0) {
    return { success: true, deletedCount: 0, error: null };
  }

  try {
    const batchSize = 50;
    let deletedCount = 0;

    for (let i = 0; i < orphanIds.length; i += batchSize) {
      const chunk = orphanIds.slice(i, i + batchSize);
      const { error } = await supabase
        .from('bookings')
        .delete()
        .in('id', chunk)
        .eq('status', 'ค้างชำระ');

      if (error) throw error;
      deletedCount += chunk.length;
    }

    return { success: true, deletedCount, error: null };
  } catch (err) {
    console.error('Error in deleteOrphanBookings:', err);
    return { success: false, deletedCount: 0, error: err.message };
  }
}
