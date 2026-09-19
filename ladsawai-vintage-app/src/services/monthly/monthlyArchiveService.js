import { supabase } from '@/lib/supabase';

/**
 * Fetches CSV text from published Google Sheet url.
 */
export async function fetchGoogleSheetCsv(sheetId, sheetName = null) {
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (sheetName) {
    url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ไม่สามารถเข้าถึง Google Sheet (${sheetName || 'Main'}) ได้`);
  return await res.text();
}

/**
 * Parses raw CSV lines with support for quotes and linebreaks.
 */
export function parseCsvAdvancedSafely(text) {
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
}

export function normalizePhoneValue(phoneStr) {
  if (!phoneStr) return '';
  let clean = String(phoneStr).trim().replace(/[^0-9]/g, '');
  if (clean.length === 9 && !clean.startsWith('0')) return '0' + clean;
  if (clean.length === 8 && !clean.startsWith('0')) return '0' + clean;
  return clean || phoneStr;
}

export function normalizeDateIso(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return dateStr.trim();
}

export function parseMonthToIso(monthStr, startDateStr) {
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
}

/**
 * Imports and syncs monthly contracts and financial transactions from Google Sheets.
 */
export async function syncMonthlyAndFinanceFromSheets() {
  const SHEET_IDS = {
    MONTHLY: '1b6kBbOTfWqGHw9nyJikRCv7kvqml-7H-ZcgIMUtUniE',
    FINANCE: '1Xp-QrcyR-f5AnRcfOO7nb-sLoneqK31zI1daQgCmNrU'
  };

  // 1. Monthly contracts
  const monthlyText = await fetchGoogleSheetCsv(SHEET_IDS.MONTHLY);
  const monthlyRows = parseCsvAdvancedSafely(monthlyText);
  const monthlyMap = new Map();

  for (let i = 1; i < monthlyRows.length; i++) {
    const r = monthlyRows[i];
    const id = r[0];
    if (!id || id === 'Booking ID') continue;

    const startDate = r[2] || '';
    const bookingMonthRaw = r[13] || '';
    const normalizedMonth = parseMonthToIso(bookingMonthRaw, startDate);
    const bookerName = r[3] || 'ไม่ระบุชื่อ';
    const totalPrice = parseFloat(r[8]) || 0;
    const paidAmount = parseFloat(r[9]) || 0;
    const phoneFormatted = normalizePhoneValue(r[14]);
    const selectedDays = r[12] || '';
    const customerType = r[16] || 'Standard';
    const storageFee = parseFloat(r[17]) || 0;

    const rawStalls = r[4] || '';
    const cleanStalls = rawStalls.replace(/[\[\]]/g, '').trim();

    let cleanStallDetails = r[15] || '[]';
    if (cleanStallDetails.includes('[')) {
      try {
        const parsed = JSON.parse(cleanStallDetails);
        if (Array.isArray(parsed)) {
          cleanStallDetails = JSON.stringify(parsed.map(x => ({ ...x, name: (x.name || '').replace(/[\[\]]/g, '').trim() })));
        }
      } catch (e) {}
    }

    monthlyMap.set(id, {
      id: id,
      timestamp: new Date().toISOString(),
      start_date: startDate,
      booker_name: bookerName,
      customer_name: bookerName,
      stalls: cleanStalls,
      product: r[5] || '',
      status: r[6] || (paidAmount >= totalPrice && totalPrice > 0 ? 'ชำระแล้ว' : 'ค้างชำระ'),
      elec_unit: parseFloat(r[7]) || 0,
      total_price: totalPrice,
      grand_total: totalPrice,
      paid_amount: paidAmount,
      total_paid: paidAmount,
      note: r[10] || '',
      payment_method: r[11] || '',
      selected_days: selectedDays,
      booking_month: normalizedMonth,
      phone: phoneFormatted,
      stall_details: cleanStallDetails,
      customer_type: customerType,
      storage_fee: storageFee
    });
  }

  const monthlyItems = Array.from(monthlyMap.values());
  for (let i = 0; i < monthlyItems.length; i += 100) {
    const chunk = monthlyItems.slice(i, i + 100);
    await supabase.from('monthly_bookings').upsert(chunk);
  }

  // 2. Finance transactions
  const financeText = await fetchGoogleSheetCsv(SHEET_IDS.FINANCE);
  const financeRows = parseCsvAdvancedSafely(financeText);
  const txnMap = new Map();

  for (let i = 1; i < financeRows.length; i++) {
    const r = financeRows[i];
    const id = r[0];
    if (!id || id === 'Txn ID') continue;

    const ref = r[1] || '';
    const date = r[2] || '';
    const totalAmount = parseFloat(r[4]) || 0;
    const stallAmt = parseFloat(r[8]) || 0;
    const elecAmt = parseFloat(r[9]) || 0;
    const storageAmt = parseFloat(r[10]) || 0;
    const note = r[6] || '';
    const officer = r[7] || 'System';

    txnMap.set(id, {
      id: id,
      booking_ref: ref,
      date: date,
      category: r[3] || 'รายรับ',
      total_amount: totalAmount,
      method: r[5] || 'Cash',
      note: note,
      description: note,
      officer: officer,
      timestamp: new Date().toISOString(),
      stall_amt: stallAmt,
      elec_amt: elecAmt,
      storage_amt: storageAmt,
      bill_type: r[11] || '',
      slip_url: r[12] || ''
    });
  }

  const txnItems = Array.from(txnMap.values());
  for (let i = 0; i < txnItems.length; i += 100) {
    const chunk = txnItems.slice(i, i + 100);
    await supabase.from('transactions').upsert(chunk);
  }

  return { monthlyCount: monthlyItems.length, txnCount: txnItems.length };
}
