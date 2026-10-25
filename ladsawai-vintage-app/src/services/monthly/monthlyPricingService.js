import { parseNumber } from '@/utils/numberHelper';

/**
 * Determines whether a booking or day selection is a full 3-day package (Wed, Sat, Sun).
 * Handles Thai strings ("พุธ,เสาร์,อาทิตย์"), English strings ("wed,sat,sun"), object format, and stall_details JSON.
 */
export function checkIsFullPackage(booking) {
  if (!booking) return false;

  // 1. Check stall_details array
  try {
    const details = Array.isArray(booking.stall_details)
      ? booking.stall_details
      : JSON.parse(booking.stall_details || '[]');
    const allDays = new Set();
    details.forEach(st => {
      if (Array.isArray(st.days)) {
        st.days.forEach(d => allDays.add(d));
      }
    });
    if (allDays.has(3) && allDays.has(6) && allDays.has(0)) return true;
  } catch (e) {}

  // 2. Check selected_days object format
  if (typeof booking.selected_days === 'object' && booking.selected_days !== null) {
    return Boolean(booking.selected_days.wed && booking.selected_days.sat && booking.selected_days.sun);
  }

  // 3. Check selected_days string or day arrays
  const daysStr = String(booking.selected_days || '').toLowerCase();
  const hasWed = daysStr.includes('wed') || daysStr.includes('พุธ') || (Array.isArray(booking.stalls_wed) && booking.stalls_wed.length > 0);
  const hasSat = daysStr.includes('sat') || daysStr.includes('เสาร์') || (Array.isArray(booking.stalls_sat) && booking.stalls_sat.length > 0);
  const hasSun = daysStr.includes('sun') || daysStr.includes('อาทิตย์') || (Array.isArray(booking.stalls_sun) && booking.stalls_sun.length > 0);

  return hasWed && hasSat && hasSun;
}

/**
 * Calculates stall price for a specific day of week considering monthly customer type and packages.
 * @param {Object} stall - Stall master record (price_wed, price_sat, price_sun, price_month)
 * @param {number} dayOfWeek - 3: Wed, 6: Sat, 0: Sun
 * @param {string} customerType - 'Standard' | 'Regular' | 'VIP' | 'Room'
 * @param {boolean} isFullPackage - true if all 3 days (Wed, Sat, Sun) are selected
 */
export function calculateStallDayPrice(stall, dayOfWeek, customerType = 'Standard', isFullPackage = false) {
  if (!stall) return 0;
  if (customerType === 'VIP' || customerType === 'Room') return 0;

  let price = parseNumber(stall.price_wed);
  if (dayOfWeek === 6) price = parseNumber(stall.price_sat);
  if (dayOfWeek === 0) price = parseNumber(stall.price_sun);

  if (customerType === 'Standard' && isFullPackage && parseNumber(stall.price_month) > 0) {
    const normalSum = parseNumber(stall.price_wed) + parseNumber(stall.price_sat) + parseNumber(stall.price_sun);
    const packageSum = 3 * parseNumber(stall.price_month);
    const weeklyDiscount = Math.max(0, normalSum - packageSum);
    const satDiscount = weeklyDiscount >= 100 ? 50 : weeklyDiscount;
    const sunDiscount = weeklyDiscount >= 100 ? (weeklyDiscount - 50) : 0;

    if (dayOfWeek === 3) price = parseNumber(stall.price_wed);
    else if (dayOfWeek === 6) price = Math.max(0, parseNumber(stall.price_sat) - satDiscount);
    else if (dayOfWeek === 0) price = Math.max(0, parseNumber(stall.price_sun) - sunDiscount);
  }

  return price;
}

/**
 * Calculates monthly billing summary for given trading days, stalls, electricity, and storage fees.
 */
export function calculateMonthlySummary({
  startDate,
  selectedDays = { wed: true, sat: true, sun: true },
  stallsWed = [],
  stallsSat = [],
  stallsSun = [],
  stallsMaster = [],
  customerType = 'Standard',
  elecUnit = 0,
  storageFee = 0,
  customPrice = ''
}) {
  if (!startDate) {
    return {
      totalPrice: 0,
      grandTotal: 0,
      rawStallTotal: 0,
      wedCount: 0,
      satCount: 0,
      sunCount: 0,
      totalElecCharged: 0,
      totalElecFee: 0,
      totalElecPrice: 0,
      totalStorageFee: 0,
      storageFeeVal: 0,
      wedStallsPrice: 0,
      satStallsPrice: 0,
      sunStallsPrice: 0,
      wedTotal: 0,
      satTotal: 0,
      sunTotal: 0,
      isFullPackage: false
    };
  }

  const start = new Date(startDate);
  const year = start.getFullYear();
  const month = start.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  let wedCount = 0;
  let satCount = 0;
  let sunCount = 0;
  let totalElecCharged = 0;

  for (let d = 1; d <= lastDay; d++) {
    const currentD = new Date(year, month, d);
    const dayOfWeek = currentD.getDay();
    let hasTradingDay = false;

    if (dayOfWeek === 3 && selectedDays.wed) {
      wedCount++;
      hasTradingDay = true;
    }
    if (dayOfWeek === 6 && selectedDays.sat) {
      satCount++;
      hasTradingDay = true;
    }
    if (dayOfWeek === 0 && selectedDays.sun) {
      sunCount++;
      hasTradingDay = true;
    }

    if (hasTradingDay && (stallsWed.length > 0 || stallsSat.length > 0 || stallsSun.length > 0)) {
      totalElecCharged++;
    }
  }

  const isFullPackage = selectedDays.wed && selectedDays.sat && selectedDays.sun;

  const sumStallPrices = (stallsList, dayOfWeek) => {
    return stallsList.reduce((sum, name) => {
      const sMaster = stallsMaster.find(s => s.name === name);
      return sum + calculateStallDayPrice(sMaster, dayOfWeek, customerType, isFullPackage);
    }, 0);
  };

  const wedPricePerDay = sumStallPrices(stallsWed, 3);
  const satPricePerDay = sumStallPrices(stallsSat, 6);
  const sunPricePerDay = sumStallPrices(stallsSun, 0);

  const wedTotal = wedCount * wedPricePerDay;
  const satTotal = satCount * satPricePerDay;
  const sunTotal = sunCount * sunPricePerDay;

  const rawStallTotal = wedTotal + satTotal + sunTotal;
  const totalElecFee = totalElecCharged * parseNumber(elecUnit) * 10;
  const totalStorageFee = parseNumber(storageFee);

  let finalPrice = rawStallTotal + totalElecFee + totalStorageFee;
  if (customPrice !== '' && !isNaN(parseFloat(customPrice))) {
    finalPrice = parseFloat(customPrice);
  }

  return {
    totalPrice: finalPrice,
    grandTotal: finalPrice,
    rawStallTotal,
    wedCount,
    satCount,
    sunCount,
    totalElecCharged,
    totalElecFee,
    totalElecPrice: totalElecFee,
    totalStorageFee,
    storageFeeVal: totalStorageFee,
    wedStallsPrice: wedPricePerDay,
    satStallsPrice: satPricePerDay,
    sunStallsPrice: sunPricePerDay,
    wedTotal,
    satTotal,
    sunTotal,
    isFullPackage
  };
}
