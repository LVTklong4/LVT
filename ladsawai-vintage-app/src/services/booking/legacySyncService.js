import { supabase } from '@/lib/supabase';
import { formatBookingMonth } from '@/utils/thaiDateHelper';

/**
 * 🔄 Helper function to fetch CSV from Google Sheet
 */
export const fetchGoogleSheetCsv = async (sheetId, sheetName = null) => {
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (sheetName) {
    url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ไม่สามารถเข้าถึง Google Sheet (${sheetName || 'Main'}) ได้`);
  return await res.text();
};

/**
 * 🔄 Helper function to parse CSV lines safely
 */
export const parseCsvAdvancedSafely = (text) => {
  const p = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
};

export const normalizePhoneValue = (phoneStr) => {
  if (!phoneStr) return '';
  let clean = String(phoneStr).trim().replace(/[^0-9]/g, '');
  if (clean.length === 9 && !clean.startsWith('0')) return '0' + clean;
  if (clean.length === 8 && !clean.startsWith('0')) return '0' + clean;
  return clean || phoneStr;
};

export const normalizeDateIso = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return dateStr.trim();
};

export const parseMonthToIso = (monthStr, startDateStr) => {
  const thaiMonthMap = {
    'มกราคม': '01', 'ม.ค.': '01',
    'กุมภาพันธ์': '02', 'ก.พ.': '02',
    'มีนาคม': '03', 'มี.ค.': '03',
    'เมษายน': '04', 'เม.ย.': '04',
    'พฤษภาคม': '05', 'พ.ค.': '05',
    'มิถุนายน': '06', 'มิ.ย.': '06',
    'กรกฎาคม': '07', 'ก.ค.': '07',
    'สิงหาคม': '08', 'ส.ค.': '08',
    'กันยายน': '09', 'ก.ย.': '09',
    'ตุลาคม': '10', 'ต.ค.': '10',
    'พฤศจิกายน': '11', 'พ.ย.': '11',
    'ธันวาคม': '12', 'ธ.ค.': '12'
  };

  const raw = String(monthStr || '').trim();

  for (const [thMonth, monthNum] of Object.entries(thaiMonthMap)) {
    if (raw.includes(thMonth)) {
      const yearMatch = raw.match(/\b(25\d{2}|20\d{2})\b/);
      let year = '2026';
      if (yearMatch) {
        const yNum = parseInt(yearMatch[1], 10);
        year = yNum > 2400 ? String(yNum - 543) : String(yNum);
      } else if (startDateStr) {
        const sMatch = startDateStr.match(/\b(25\d{2}|20\d{2})\b/);
        if (sMatch) {
          const yNum = parseInt(sMatch[1], 10);
          year = yNum > 2400 ? String(yNum - 543) : String(yNum);
        }
      }
      return `${year}-${monthNum}`;
    }
  }

  const isoMatch = raw.match(/(\d{4})-(\d{2})/);
  if (isoMatch) {
    const yNum = parseInt(isoMatch[1], 10);
    const year = yNum > 2400 ? String(yNum - 543) : String(yNum);
    return `${year}-${isoMatch[2]}`;
  }

  if (startDateStr) {
    const sParts = startDateStr.split('-');
    if (sParts.length >= 2) {
      let yNum = parseInt(sParts[0], 10);
      let year = yNum > 2400 ? String(yNum - 543) : String(yNum);
      let m = sParts[1].padStart(2, '0');
      return `${year}-${m}`;
    }
  }

  return '2026-08';
};

/**
 * 🔄 Fetch & import all daily bookings from Google Sheet into Supabase
 */
export const syncDailyBookingsFromLegacy = async () => {
  // 1. Fetch ALL valid active monthly contract IDs from Supabase (with pagination)
  let allMonthlyIds = [];
  let fromIdx = 0;
  const pageSize = 1000;
  let hasMoreMb = true;
  while (hasMoreMb) {
    const { data: pageData, error: mbFetchErr } = await supabase
      .from('monthly_bookings')
      .select('id')
      .range(fromIdx, fromIdx + pageSize - 1);
    if (mbFetchErr) throw mbFetchErr;
    if (pageData && pageData.length > 0) {
      allMonthlyIds.push(...pageData.map(r => String(r.id).trim()));
      fromIdx += pageSize;
      if (pageData.length < pageSize) hasMoreMb = false;
    } else {
      hasMoreMb = false;
    }
  }
  const validMonthlyIds = new Set(allMonthlyIds);

  const SHEET_ID_DAILY = '1R6bNYPRo6yjDtgoazddobauTgvQVQdxA1n67C10L-4I';
  const csvText = await fetchGoogleSheetCsv(SHEET_ID_DAILY, 'Bookings');
  const rows = parseCsvAdvancedSafely(csvText);

  const itemsMap = new Map();
  const distinctDates = new Set();
  let rowIdx = 0;
  let skippedOrphanCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[1] || '';
    if (!rawDate) continue;

    const normalizedDate = normalizeDateIso(rawDate);
    if (!normalizedDate) continue;

    const rawStallName = row[2] || '';
    const stallName = rawStallName.replace(/[\[\]]/g, '').trim();
    const bookerName = row[3] || 'ไม่ระบุชื่อ';
    const product = row[4] || '';
    const type = (row[5] || 'รายวัน').trim();
    const elecUnit = parseFloat(row[6]) || 0;
    const elecPrice = parseFloat(row[7]) || 0;
    const stallPrice = parseFloat(row[8]) || 0;
    const totalPrice = parseFloat(row[9]) || 0;
    const paymentMethod = row[10] || 'Cash';
    const status = row[11] || 'ชำระแล้ว';
    const note = row[12] || '';
    const masterRefId = String(row[14] || '').trim();
    const storageFee = parseFloat(row[15]) || 0;

    let cleanType = type;
    if (!cleanType.includes('รายวัน') && !cleanType.includes('รายเดือน')) {
      cleanType = 'รายวัน';
    }

    const isMonthlyType = cleanType === 'รายเดือน' || cleanType.toLowerCase().includes('monthly');
    const masterContractId = masterRefId;

    // Strategy 1: Master ID Validation (Discard Orphaned Monthly Records)
    if (isMonthlyType) {
      if (masterContractId && !validMonthlyIds.has(masterContractId)) {
        skippedOrphanCount++;
        continue;
      }
    }

    distinctDates.add(normalizedDate);
    rowIdx++;

    const cleanStall = stallName.replace(/[\/\s]/g, '_');
    const cleanDate = normalizedDate.replace(/-/g, '');
    const uniqueId = `BK-${cleanDate}-${cleanStall || 'S'}`;

    // Deduplicate by Date + Stall to keep the most relevant entry
    itemsMap.set(`${normalizedDate}_${stallName}`, {
      id: uniqueId,
      date: normalizedDate,
      stall_name: stallName,
      stall_id: stallName,
      booker_name: bookerName,
      customer_name: bookerName,
      product: product,
      type: cleanType,
      elec_unit: elecUnit,
      elec_price: elecPrice,
      stall_price: stallPrice,
      total_price: totalPrice,
      price: totalPrice,
      payment_method: paymentMethod,
      status: status,
      note: note,
      master_id: masterContractId || null,
      storage_fee: storageFee
    });
  }

  const dailyItems = Array.from(itemsMap.values());
  if (dailyItems.length > 0) {
    // Upsert all daily items in chunks of 100
    for (let i = 0; i < dailyItems.length; i += 100) {
      const chunk = dailyItems.slice(i, i + 100);
      const { error: upsertErr } = await supabase.from('bookings').upsert(chunk);
      if (upsertErr) throw upsertErr;
    }
  }

  return {
    dailyCount: dailyItems.length,
    dateCount: distinctDates.size,
    skippedOrphanCount
  };
};

/**
 * 📦 Archive a specific month into Google Drive / Google Sheets via GAS Webhook
 */
export const archiveMonthToGoogleDrive = async ({ targetMonth, webhookUrl, purgeAfterArchive = false }) => {
  const monthThai = formatBookingMonth(targetMonth);

  // 1. Fetch Daily Bookings for target month (with pagination)
  const [yearStr, monthNumStr] = targetMonth.split('-');
  const lastDayNum = new Date(parseInt(yearStr, 10), parseInt(monthNumStr, 10), 0).getDate();
  const startDateIso = `${targetMonth}-01`;
  const endDateIso = `${targetMonth}-${String(lastDayNum).padStart(2, '0')}`;

  let monthDailyBookings = [];
  let fromB = 0;
  let hasMoreB = true;
  while (hasMoreB) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('date', startDateIso)
      .lte('date', endDateIso)
      .order('date', { ascending: true })
      .range(fromB, fromB + 999);
    if (error) throw error;
    if (data && data.length > 0) {
      monthDailyBookings.push(...data);
      fromB += 1000;
      if (data.length < 1000) hasMoreB = false;
    } else {
      hasMoreB = false;
    }
  }

  // 2. Fetch Monthly Bookings for target month
  const { data: monthMonthlyBookings, error: mmbErr } = await supabase
    .from('monthly_bookings')
    .select('*')
    .eq('booking_month', targetMonth);
  if (mmbErr) throw mmbErr;

  // 3. Fetch Transactions for target month
  const { data: monthTxns, error: mtxErr } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDateIso)
    .lte('date', endDateIso)
    .order('date', { ascending: true });
  if (mtxErr) throw mtxErr;

  if (monthDailyBookings.length === 0 && (!monthMonthlyBookings || monthMonthlyBookings.length === 0) && (!monthTxns || monthTxns.length === 0)) {
    throw new Error(`ไม่พบข้อมูลในรอบเดือน ${monthThai} ที่จะทำการจัดเก็บ`);
  }

  // 4. Send Payload to Google Apps Script Webhook
  const payload = {
    folderId: '1kmBElcZAAX0UbQ61cI3fbgbJHHzi6eXu',
    monthStr: targetMonth,
    monthThai: monthThai,
    dailyBookings: monthDailyBookings,
    monthlyBookings: monthMonthlyBookings || [],
    transactions: monthTxns || []
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Google Apps Script ส่งข้อผิดพลาดกลับมา');
  }

  // 5. If purge is requested, clean up daily bookings from Supabase
  let purgedCount = 0;
  if (purgeAfterArchive) {
    const { error: delErr, count: delCount } = await supabase
      .from('bookings')
      .delete({ count: 'exact' })
      .gte('date', startDateIso)
      .lte('date', endDateIso);
    if (delErr) throw delErr;
    purgedCount = delCount || monthDailyBookings.length;
  }

  return {
    result,
    monthThai,
    dailyCount: monthDailyBookings.length,
    monthlyCount: (monthMonthlyBookings || []).length,
    txnCount: (monthTxns || []).length,
    purgedCount
  };
};
