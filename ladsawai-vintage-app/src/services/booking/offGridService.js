import { supabase } from '@/lib/supabase';

/**
 * Service for off-grid (นอกผัง) booking operations
 */

export async function saveOffGridBooking({
  targetId,
  selectedDate,
  stallName,
  bookerName,
  product,
  elecUnit,
  elecPrice,
  stallPrice,
  totalVal,
  finalPaymentMethod,
  status,
  customerType,
  note,
  editMode,
  adminUser
}) {
  const formattedNote = `[ประเภท: ${customerType}] ${note.trim()}`.trim();

  const bookingData = {
    id: targetId,
    date: selectedDate,
    stall_name: stallName.trim(),
    booker_name: bookerName.trim(),
    product: product.trim(),
    type: 'นอกผัง',
    elec_unit: parseFloat(elecUnit) || 0,
    elec_price: parseFloat(elecPrice) || 0,
    stall_price: parseFloat(stallPrice) || 0,
    total_price: totalVal,
    payment_method: finalPaymentMethod,
    status: status,
    note: formattedNote,
    storage_fee: 0
  };

  // 1. Save Booking
  const { error: saveError } = await supabase
    .from('bookings')
    .upsert(bookingData);

  if (saveError) throw saveError;

  // 2. Record Transaction if Paid
  if (status === 'ชำระแล้ว') {
    if (editMode) {
      await supabase.from('transactions').delete().eq('booking_ref', targetId);
    }

    const txnId = `TXN-OFF-${Date.now()}`;
    const txnData = {
      id: txnId,
      booking_ref: targetId,
      date: selectedDate,
      category: 'ค่าล็อครายวัน',
      total_amount: totalVal,
      method: finalPaymentMethod,
      note: `ชำระเงินล็อคนอกผัง ${stallName.trim()}`,
      officer: adminUser?.name || adminUser?.employee_id || 'lvt-admin',
      timestamp: new Date().toISOString(),
      stall_amt: parseFloat(stallPrice) || 0,
      elec_amt: parseFloat(elecPrice) || 0,
      storage_amt: 0,
      bill_type: 'General'
    };

    const { error: txnError } = await supabase
      .from('transactions')
      .insert(txnData);

    if (txnError) throw txnError;
  } else {
    if (editMode) {
      await supabase.from('transactions').delete().eq('booking_ref', targetId);
    }
  }

  return bookingData;
}

export async function deleteOffGridBooking(id) {
  const { error: bookingErr } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  if (bookingErr) throw bookingErr;

  const { error: txnErr } = await supabase
    .from('transactions')
    .delete()
    .eq('booking_ref', id);
  if (txnErr) throw txnErr;

  return true;
}
