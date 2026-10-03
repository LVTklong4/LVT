/**
 * Utility functions for capturing, copying, and sharing receipt images.
 * Uses html-to-image to render DOM elements via SVG foreignObject,
 * completely supporting modern CSS color functions (oklch, lab, etc.) without parsing errors.
 */
import { toBlob } from 'html-to-image';

/**
 * Normalizes payment method text to friendly Thai language.
 */
export function normalizePaymentMethodThai(method) {
  if (!method) return 'เงินสด';
  const m = String(method).trim().toLowerCase();
  if (m === 'cash' || m.includes('เงินสด')) return 'เงินสด';
  if (m === 'transfer' || m.includes('โอน')) return 'โอนเงิน';
  return method;
}

/**
 * Copies receipt image directly to the clipboard (works seamlessly on Desktop/Chrome/Edge/Mac).
 */
export async function copyReceiptImage(element) {
  if (!element) throw new Error('ไม่พบข้อมูลใบเสร็จ');

  const blob = await toBlob(element, {
    pixelRatio: 2.5, // Crisp 2.5x resolution for 80mm receipts
    backgroundColor: '#ffffff',
    cacheBust: true
  });

  if (!blob) throw new Error('ไม่สามารถแปลงใบเสร็จเป็นรูปภาพได้');

  // Clipboard API
  if (typeof window !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return { type: 'clipboard', message: 'คัดลอกรูปใบเสร็จแล้ว สามารถกดวาง (Ctrl+V) ใน Line ได้ทันที' };
    } catch (err) {
      console.warn('Clipboard write error:', err);
      throw new Error('ไม่สามารถเข้าถึงคลิปบอร์ดได้: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  }

  throw new Error('เบราว์เซอร์นี้ไม่รองรับการคัดลอกรูปภาพลงคลิปบอร์ดโดยตรง');
}

/**
 * Shares receipt image via native Web Share API (Mobile Line, WhatsApp, Photos, AirDrop).
 * NOTE: Per user request, this does NOT download files to disk on fallback to save device storage.
 */
export async function shareReceiptImage(element, filename = `receipt-${Date.now()}.png`) {
  if (!element) throw new Error('ไม่พบข้อมูลใบเสร็จ');

  const blob = await toBlob(element, {
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
    cacheBust: true
  });

  if (!blob) throw new Error('ไม่สามารถแปลงรูปภาพได้');

  const file = new File([blob], filename, { type: 'image/png' });

  // Mobile Web Share API
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'ใบเสร็จรับเงิน ลาดสวายวินเทจ',
        text: 'ใบเสร็จรับเงิน ตลาดลาดสวายวินเทจ'
      });
      return { type: 'share', message: 'แชร์รูปภาพใบเสร็จเรียบร้อย' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { type: 'cancelled', message: 'ยกเลิกการแชร์' };
      }
      throw err;
    }
  }

  // If navigator.share is unsupported (e.g. on Desktop PC), copy to clipboard instead of downloading
  if (typeof window !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return { type: 'clipboard', message: 'อุปกรณ์นี้ไม่รองรับการแชร์โดยตรง ระบบได้คัดลอกรูปภาพแล้ว กดวาง (Ctrl+V) ใน Line ได้เลยครับ' };
    } catch (e) {}
  }

  throw new Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการแชร์รูปภาพ กรุณาใช้ปุ่ม "คัดลอกรูป" เพื่อส่งใน Line');
}

// Backward-compatible alias
export const shareOrCopyReceiptImage = shareReceiptImage;
