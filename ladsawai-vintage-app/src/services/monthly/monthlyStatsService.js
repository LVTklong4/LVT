/**
 * Calculates summary statistics for monthly bookings list:
 * - totalCust: Total customer count
 * - foodCust: Food zone customer count
 * - genCust: General zone customer count
 * - foodStalls: Food stalls count
 * - genStalls: General stalls count
 * - wedStalls: Wednesday locked stalls count
 * - satStalls: Saturday locked stalls count
 * - sunStalls: Sunday locked stalls count
 */
export function calculateMonthlySummaryStats(monthlyList = [], stalls = []) {
  const stallMap = new Map();
  if (Array.isArray(stalls)) {
    stalls.forEach(s => {
      if (s && s.name) {
        stallMap.set(s.name, s);
        stallMap.set(s.name.replace(/[\[\]]/g, '').trim(), s);
      }
    });
  }

  let totalCust = monthlyList.length;
  let foodCust = 0;
  let genCust = 0;
  let wedStalls = 0;
  let satStalls = 0;
  let sunStalls = 0;
  let foodStalls = 0;
  let genStalls = 0;

  monthlyList.forEach(item => {
    let stallDetailsList = [];
    try {
      if (typeof item.stall_details === 'string' && item.stall_details.startsWith('[')) {
        stallDetailsList = JSON.parse(item.stall_details);
      } else if (Array.isArray(item.stall_details)) {
        stallDetailsList = item.stall_details;
      }
    } catch {
      stallDetailsList = [];
    }

    const rawStallNames = (item.stalls || '')
      .replace(/[\[\]]/g, '')
      .split(/[,+]/)
      .map(x => x.trim())
      .filter(Boolean);

    // Active days
    const activeDays = [];
    const selDaysStr = String(item.selected_days || '').toLowerCase();
    if (selDaysStr.includes('wed') || selDaysStr.includes('พุธ') || (item.stalls_wed && item.stalls_wed.length > 0)) activeDays.push(3);
    if (selDaysStr.includes('sat') || selDaysStr.includes('เสาร์') || (item.stalls_sat && item.stalls_sat.length > 0)) activeDays.push(6);
    if (selDaysStr.includes('sun') || selDaysStr.includes('อาทิตย์') || (item.stalls_sun && item.stalls_sun.length > 0)) activeDays.push(0);

    if (activeDays.length === 0) {
      rawStallNames.forEach(name => {
        if (name.startsWith('ส') && !activeDays.includes(6)) activeDays.push(6);
        if (name.startsWith('อ') && !activeDays.includes(0)) activeDays.push(0);
        if (name.startsWith('พ') && !activeDays.includes(3)) activeDays.push(3);
      });
    }
    if (activeDays.length === 0) activeDays.push(6);

    let itemWed = 0;
    let itemSat = 0;
    let itemSun = 0;

    if (stallDetailsList && stallDetailsList.length > 0) {
      stallDetailsList.forEach(s => {
        const days = s.days || [];
        if (days.includes(3)) itemWed++;
        if (days.includes(6)) itemSat++;
        if (days.includes(0)) itemSun++;
      });
    } else {
      rawStallNames.forEach(name => {
        let hasPrefix = false;
        if (name.startsWith('พ')) { itemWed++; hasPrefix = true; }
        if (name.startsWith('ส')) { itemSat++; hasPrefix = true; }
        if (name.startsWith('อ')) { itemSun++; hasPrefix = true; }

        if (!hasPrefix) {
          if (activeDays.includes(3)) itemWed++;
          if (activeDays.includes(6)) itemSat++;
          if (activeDays.includes(0)) itemSun++;
        }
      });
    }

    wedStalls += itemWed;
    satStalls += itemSat;
    sunStalls += itemSun;

    // Check food vs general
    let isFood = false;
    const allStallNames = stallDetailsList.length > 0 ? stallDetailsList.map(s => s.name) : rawStallNames;
    for (const name of allStallNames) {
      const cleanName = name.replace(/^[พสอ]/, '').replace(/[\[\]]/g, '').trim();
      const st = stallMap.get(cleanName) || stallMap.get(name);
      if (
        cleanName.startsWith('F') ||
        (st && ((st.type && st.type.includes('อาหาร')) || (st.zone && st.zone.includes('อาหาร'))))
      ) {
        isFood = true;
        break;
      }
    }
    if (!isFood && item.product) {
      const p = item.product.toLowerCase();
      if (
        p.includes('อาหาร') || p.includes('กิน') || p.includes('น้ำ') ||
        p.includes('ส้มโอ') || p.includes('ลูกชิ้น') || p.includes('ฝรั่ง') ||
        p.includes('ขนม') || p.includes('กาแฟ') || p.includes('food') ||
        p.includes('เครื่องดื่ม') || p.includes('ก๋วยเตี๋ยว') || p.includes('ไก่') ||
        p.includes('หมู') || p.includes('ปลา') || p.includes('ยำ') || p.includes('ทอด')
      ) {
        isFood = true;
      }
    }

    const stallCount = (stallDetailsList.length > 0 ? stallDetailsList.length : rawStallNames.length) || 1;
    if (isFood) {
      foodCust++;
      foodStalls += stallCount;
    } else {
      genCust++;
      genStalls += stallCount;
    }
  });

  return {
    totalCust,
    foodCust,
    genCust,
    foodStalls,
    genStalls,
    wedStalls,
    satStalls,
    sunStalls
  };
}
