/**
 * Utility functions for capturing, copying, downloading, and sharing receipt images.
 * Uses html2canvas to convert receipt DOM elements into high-definition PNG images.
 */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Captures an HTML element as a canvas with crisp high-DPI resolution.
 */
async function captureElementToCanvas(element) {
  const html2canvas = (await import('html2canvas')).default;
  return await html2canvas(element, {
    scale: 2.5, // High resolution for crisp receipt text
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false
  });
}

/**
 * Copies receipt image directly to the clipboard (works seamlessly on Desktop/Chrome/Edge/Mac).
 * Fallback to file download if clipboard writing is unsupported or restricted.
 */
export async function copyReceiptImage(element, filename = `receipt-${Date.now()}.png`) {
  if (!element) throw new Error('ไม่พบข้อมูลใบเสร็จ');

  const canvas = await captureElementToCanvas(element);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('ไม่สามารถแปลงใบเสร็จเป็นรูปภาพได้'));
        return;
      }

      // Try Clipboard API
      try {
        if (typeof window !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve({ type: 'clipboard', message: 'คัดลอกรูปใบเสร็จแล้ว สามารถกดวาง (Ctrl+V) ใน Line ได้ทันที' });
          return;
        }
      } catch (err) {
        console.warn('Clipboard write failed, falling back to download:', err);
      }

      // Fallback: Download file
      try {
        downloadBlob(blob, filename);
        resolve({ type: 'download', message: 'ดาวน์โหลดรูปใบเสร็จเรียบร้อยแล้ว' });
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Downloads receipt image as a PNG file.
 */
export async function downloadReceiptImage(element, filename = `receipt-${Date.now()}.png`) {
  if (!element) throw new Error('ไม่พบข้อมูลใบเสร็จ');
  const canvas = await captureElementToCanvas(element);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('ไม่สามารถแปลงรูปภาพได้'));
      downloadBlob(blob, filename);
      resolve({ type: 'download', message: 'ดาวน์โหลดรูปภาพใบเสร็จเรียบร้อย' });
    }, 'image/png');
  });
}

/**
 * Mobile-friendly share: triggers Web Share API if supported, or copies to clipboard / downloads.
 */
export async function shareOrCopyReceiptImage(element, filename = `receipt-${Date.now()}.png`) {
  if (!element) throw new Error('ไม่พบข้อมูลใบเสร็จ');
  const canvas = await captureElementToCanvas(element);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('ไม่สามารถแปลงรูปภาพได้'));

      const file = new File([blob], filename, { type: 'image/png' });

      // Mobile Web Share API
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'ใบเสร็จรับเงิน ลาดสวายวินเทจ',
            text: 'ใบเสร็จรับเงิน ตลาดลาดสวายวินเทจ'
          });
          resolve({ type: 'share', message: 'แชร์รูปภาพใบเสร็จเรียบร้อย' });
          return;
        } catch (err) {
          if (err.name === 'AbortError') {
            resolve({ type: 'cancelled', message: 'ยกเลิกการแชร์' });
            return;
          }
        }
      }

      // Desktop Clipboard API
      try {
        if (typeof window !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve({ type: 'clipboard', message: 'คัดลอกรูปใบเสร็จแล้ว สามารถกดวาง (Ctrl+V) ใน Line ได้ทันที' });
          return;
        }
      } catch (err) {
        console.warn('Clipboard write fallback to download:', err);
      }

      // Fallback
      downloadBlob(blob, filename);
      resolve({ type: 'download', message: 'ดาวน์โหลดรูปใบเสร็จเรียบร้อย' });
    }, 'image/png');
  });
}
