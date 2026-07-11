// Number and parsing helpers for LVT Booking System

export const parseNumber = (val) => {
  const num = parseFloat(String(val));
  return isNaN(num) ? 0 : num;
};

export const cleanStallName = (name) => {
  if (!name) return '';
  return String(name)
    .split(',')
    .map(s => s.trim().replace(/^\[|\]$/g, ''))
    .join(', ');
};

export const extractAmountFromText = (text) => {
  if (!text) return '';
  const lines = text.split('\n');
  let matchedAmount = '';
  const amtRegex = /[0-9,]+\.[0-9]{2}/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Search for keywords related to total or price
    if (line.includes('ยอดเงิน') || line.includes('จำนวนเงิน') || line.includes('ยอดชำระ') || line.includes('THB') || line.includes('โอนสำเร็จ')) {
      const match = line.match(amtRegex);
      if (match) {
        matchedAmount = match[0].replace(/,/g, '');
        break;
      }
    }
  }
  if (!matchedAmount) {
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(amtRegex);
      if (match) {
        matchedAmount = match[0].replace(/,/g, '');
        break;
      }
    }
  }
  return matchedAmount;
};
