/**
 * Concurrency & Race Condition Prevention Service
 * Provides real-time checks to prevent double booking of stalls.
 */

/**
 * Normalizes stall name by removing brackets and extra whitespace.
 */
export function cleanStallName(name) {
  if (!name) return '';
  return String(name).replace(/[\[\]]/g, '').trim();
}

/**
 * Extracts all individual stall names from a potentially comma-separated string.
 */
export function extractStallNames(stallField) {
  if (!stallField) return [];
  if (Array.isArray(stallField)) {
    return stallField.map(s => (typeof s === 'object' ? cleanStallName(s.name) : cleanStallName(s))).filter(Boolean);
  }
  return String(stallField)
    .split(',')
    .map(cleanStallName)
    .filter(Boolean);
}

/**
 * Performs a fresh real-time database query to verify whether requested stalls are available on the specified date.
 * 
 * @param {object} params
 * @param {object} params.supabase - Supabase client
 * @param {string} params.date - Target booking date (YYYY-MM-DD)
 * @param {string[]|string} params.stalls - Stall name or array of stall names/objects
 * @param {string} [params.excludeBookingId] - Booking ID to ignore (e.g., when editing existing booking)
 * @param {string} [params.excludeMasterId] - Master ID to ignore (when modifying regular/monthly grouped records)
 * @returns {Promise<{ isAvailable: boolean, conflictStall: string|null, conflictBooking: object|null, error: string|null }>}
 */
export async function checkStallsAvailability({
  supabase,
  date,
  stalls,
  excludeBookingId = null,
  excludeMasterId = null
}) {
  if (!supabase || !date || !stalls) {
    return { isAvailable: true, conflictStall: null, conflictBooking: null, error: 'Missing parameters' };
  }

  const requestedStalls = extractStallNames(stalls);
  if (requestedStalls.length === 0) {
    return { isAvailable: true, conflictStall: null, conflictBooking: null, error: null };
  }

  try {
    const { data: activeBookings, error } = await supabase
      .from('bookings')
      .select('id, date, stall_name, booker_name, product, status, master_id')
      .eq('date', date)
      .neq('status', 'ลา');

    if (error) {
      console.warn('⚠️ Warning checking stall availability:', error.message);
      // Do not block if read fails due to temporary network glitch
      return { isAvailable: true, conflictStall: null, conflictBooking: null, error: error.message };
    }

    if (!activeBookings || activeBookings.length === 0) {
      return { isAvailable: true, conflictStall: null, conflictBooking: null, error: null };
    }

    for (const b of activeBookings) {
      // Exclude self when updating
      if (excludeBookingId && b.id === excludeBookingId) continue;
      if (excludeMasterId && b.master_id === excludeMasterId) continue;

      const bookedStalls = extractStallNames(b.stall_name);
      for (const reqStall of requestedStalls) {
        if (bookedStalls.includes(reqStall)) {
          return {
            isAvailable: false,
            conflictStall: reqStall,
            conflictBooking: b,
            error: null
          };
        }
      }
    }

    return { isAvailable: true, conflictStall: null, conflictBooking: null, error: null };
  } catch (err) {
    console.warn('⚠️ Exception in checkStallsAvailability:', err);
    return { isAvailable: true, conflictStall: null, conflictBooking: null, error: err.message };
  }
}
