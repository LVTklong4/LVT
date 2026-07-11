// Thai Date & Locale Helpers for LVT Booking System

export const dayNamesShort = {
  0: 'อาทิตย์',
  1: 'จันทร์',
  2: 'อังคาร',
  3: 'พุธ',
  4: 'พฤหัสฯ',
  5: 'ศุกร์',
  6: 'เสาร์'
};

export const monthNamesShort = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const monthNamesFull = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const getThaiShortYear = (date) => {
  if (!date) return '';
  const beYear = date.getFullYear() + 543;
  return String(beYear).slice(-2);
};

export const getModalDateFormat = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = dayNamesShort[d.getDay()];
  const dateNum = d.getDate();
  const month = monthNamesFull[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ที่ ${dateNum} ${month} ${year}`;
};

export const getBookingMonthStr = (startDate) => {
  if (!startDate) return '';
  const d = new Date(startDate);
  const dateThai = new Date(d.getFullYear() + 543, d.getMonth(), 1);
  return dateThai.toString();
};

export const formatDateWithDay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const dayName = dayNamesShort[d.getDay()] || '';
  return `${dayName} ที่ ${d.getDate()} ${monthNamesFull[d.getMonth()]} ${d.getFullYear() + 543}`;
};

export const parseBookingMonthToDate = (monthStr) => {
  if (!monthStr) return new Date(0);
  const parts = monthStr.split(' ');
  if (parts.length < 4) return new Date(monthStr);
  const monthsMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const month = monthsMap[parts[1]] !== undefined ? monthsMap[parts[1]] : 0;
  const year = parseInt(parts[3]) - 543;
  return new Date(year, month, 1);
};

export const sortThaiMonthsDescending = (monthsArray) => {
  const monthsMap = {
    'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
    'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
    'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
  };
  return [...monthsArray].sort((a, b) => {
    const partsA = a.split(' ');
    const partsB = b.split(' ');
    const monthA = monthsMap[partsA[0]] || 0;
    const yearA = parseInt(partsA[1]) || 0;
    const monthB = monthsMap[partsB[0]] || 0;
    const yearB = parseInt(partsB[1]) || 0;
    const valA = yearA * 12 + monthA;
    const valB = yearB * 12 + monthB;
    return valB - valA;
  });
};

export const formatBookingMonth = (monthStr) => {
  if (!monthStr) return '-';
  const parts = monthStr.split(' ');
  if (parts.length < 4) return monthStr;
  const monthAbbr = parts[1];
  const yearStr = parts[3];
  const monthsMap = {
    Jan: 'มกราคม', Feb: 'กุมภาพันธ์', Mar: 'มีนาคม', Apr: 'เมษายน',
    May: 'พฤษภาคม', Jun: 'มิถุนายน', Jul: 'กรกฎาคม', Aug: 'สิงหาคม',
    Sep: 'กันยายน', Oct: 'ตุลาคม', Nov: 'พฤศจิกายน', Dec: 'ธันวาคม'
  };
  const thaiMonth = monthsMap[monthAbbr] || monthAbbr;
  return `${thaiMonth} ${yearStr}`;
};

export const computeNextMonthThai = (monthYearStr) => {
  if (!monthYearStr) return '';
  const parts = monthYearStr.split(' ');
  if (parts.length < 2) return '';
  const monthsMap = {
    'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
    'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
    'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
  };
  const mIdx = monthsMap[parts[0]];
  const yearCE = parseInt(parts[1]) - 543;
  if (mIdx === undefined || isNaN(yearCE)) return '';
  
  const nextDate = new Date(yearCE, mIdx + 1, 1);
  return `${monthNamesFull[nextDate.getMonth()]} ${nextDate.getFullYear() + 543}`;
};
