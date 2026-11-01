/**
 * BroadcastSync Utility
 * Fast, zero-quota cross-tab / multi-screen synchronization via the HTML5 BroadcastChannel API.
 * Ideal for multi-monitor setups (e.g. Screen 1 Admin Cashier + Screen 2 Kiosk Customer Display)
 * on the same browser instance without consuming Supabase egress or API quotas.
 */

export const BROADCAST_CHANNEL_NAME = 'lvt_booking_sync';

export const SYNC_EVENT_TYPES = {
  BOOKING_MUTATION: 'BOOKING_MUTATION',
  MONTHLY_MUTATION: 'MONTHLY_MUTATION',
  MANUAL_REFRESH: 'MANUAL_REFRESH'
};

/**
 * Broadcasts a sync event across all open tabs/windows in the same browser.
 * Safely executes only in client browser environments with BroadcastChannel support.
 */
export function broadcastBookingSync({
  type = SYNC_EVENT_TYPES.BOOKING_MUTATION,
  date = null,
  meta = null
} = {}) {
  if (typeof window === 'undefined') return;

  const payload = {
    type,
    date,
    meta,
    timestamp: Date.now()
  };

  // 1. Cross-tab synchronization via BroadcastChannel
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    } catch (err) {
      console.warn('[BroadcastSync] Error broadcasting message:', err);
    }
  }

  // 2. Same-window / Local tab event dispatch (BroadcastChannel does NOT fire on the posting window)
  try {
    window.dispatchEvent(new CustomEvent('lvt_booking_sync_local', {
      detail: payload
    }));
  } catch (err) {
    console.warn('[BroadcastSync] Error dispatching local sync event:', err);
  }
}
