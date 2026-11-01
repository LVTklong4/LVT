/**
 * Service for copying daily stall bookings from a previous date to a target date.
 */

import { cleanStallName, extractStallNames } from '@/services/booking/concurrencyService';

/**
 * Fetches bookings from sourceDate suitable for copying.
 * Excludes cancelled or 'ลา' records.
 * 
 * @param {object} supabase
 * @param {string} sourceDate - YYYY-MM-DD
 * @returns {Promise<{ bookings: object[], count: number, error: string|null }>}
 */
export async function getCopyableBookings(supabase, sourceDate) {
  if (!supabase || !sourceDate) return { bookings: [], count: 0, error: 'Missing parameters' };

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', sourceDate)
      .neq('status', 'ลา');

    if (error) throw error;
    return { bookings: data || [], count: (data || []).length, error: null };
  } catch (err) {
    console.error('Error fetching copyable bookings:', err);
    return { bookings: [], count: 0, error: err.message };
  }
}

/**
 * Copies bookings from sourceDate to targetDate.
 * Skips any stall that is already booked on targetDate to prevent overwriting.
 * 
 * @param {object} params
 * @param {object} params.supabase
 * @param {string} params.sourceDate - YYYY-MM-DD
 * @param {string} params.targetDate - YYYY-MM-DD
 * @param {object} [params.adminUser]
 * @returns {Promise<{ success: boolean, copiedCount: number, skippedCount: number, error: string|null }>}
 */
export async function copyBookingsBetweenDates({
  supabase,
  sourceDate,
  targetDate,
  adminUser
}) {
  if (!supabase || !sourceDate || !targetDate) {
    return { success: false, copiedCount: 0, skippedCount: 0, error: 'Missing required parameters' };
  }

  if (sourceDate === targetDate) {
    return { success: false, copiedCount: 0, skippedCount: 0, error: 'วันที่ต้นทางและปลายทางต้องไม่ใช่วันเดียวกัน' };
  }

  try {
    // 1. Fetch source bookings
    const { data: sourceBookings, error: srcErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', sourceDate)
      .neq('status', 'ลา');

    if (srcErr) throw srcErr;
    if (!sourceBookings || sourceBookings.length === 0) {
      return { success: false, copiedCount: 0, skippedCount: 0, error: 'ไม่พบข้อมูลการจองในวันที่ต้นทาง' };
    }

    // 2. Fetch existing bookings on targetDate to identify already occupied stalls
    const { data: existingTargetBookings, error: tgtErr } = await supabase
      .from('bookings')
      .select('stall_name, status')
      .eq('date', targetDate)
      .neq('status', 'ลา');

    if (tgtErr) throw tgtErr;

    const occupiedStallsSet = new Set();
    (existingTargetBookings || []).forEach(b => {
      const names = extractStallNames(b.stall_name);
      names.forEach(n => occupiedStallsSet.add(n));
    });

    // 3. Prepare new booking objects, skipping occupied stalls
    const now = Date.now();
    const newBookings = [];
    let skippedCount = 0;

    sourceBookings.forEach((b, idx) => {
      const reqStalls = extractStallNames(b.stall_name);
      // If any stall in this booking is already occupied on target date, skip
      const isConflicting = reqStalls.some(st => occupiedStallsSet.has(st));
      if (isConflicting) {
        skippedCount++;
        return;
      }

      // Mark stalls as occupied for subsequent iterations in the same batch
      reqStalls.forEach(st => occupiedStallsSet.add(st));

      const newId = `B-${now}-${idx}-${cleanStallName(reqStalls[0] || 'STALL')}`;
      newBookings.push({
        id: newId,
        date: targetDate,
        stall_name: b.stall_name,
        booker_name: b.booker_name || '',
        product: b.product || '',
        type: b.type || 'รายวัน',
        elec_unit: b.elec_unit || 0,
        elec_price: b.elec_price || 0,
        stall_price: b.stall_price || 0,
        total_price: b.total_price || 0,
        payment_method: 'เงินสด',
        status: 'ค้างชำระ',
        note: b.note ? `คัดลอกจาก ${sourceDate}: ${b.note}` : `คัดลอกจาก ${sourceDate}`,
        storage_fee: 0,
        master_id: null
      });
    });

    if (newBookings.length === 0) {
      return {
        success: true,
        copiedCount: 0,
        skippedCount,
        error: 'ทุกล็อคในวันที่ปลายทางมีผู้จองอยู่แล้ว จึงไม่มีรายการที่ต้องคัดลอก'
      };
    }

    // 4. Insert in chunks
    const batchSize = 40;
    for (let i = 0; i < newBookings.length; i += batchSize) {
      const chunk = newBookings.slice(i, i + batchSize);
      const { error: insErr } = await supabase
        .from('bookings')
        .insert(chunk);

      if (insErr) throw insErr;
    }

    return {
      success: true,
      copiedCount: newBookings.length,
      skippedCount,
      error: null
    };
  } catch (err) {
    console.error('Error copying bookings between dates:', err);
    return { success: false, copiedCount: 0, skippedCount: 0, error: err.message };
  }
}
