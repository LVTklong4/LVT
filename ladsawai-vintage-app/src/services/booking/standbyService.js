/**
 * Standby Waitlist Service
 * Pure logic and database operations for managing standby queues.
 */

/**
 * Fetches all standby waitlist entries ordered by creation date descending.
 */
export async function fetchStandbyList(supabase) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('standby_waitlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching standby list:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Inserts a new standby queue entry.
 */
export async function createStandbyQueueItem(supabase, itemData) {
  if (!supabase) throw new Error("Supabase client is required");

  const newItem = {
    id: `STB-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...itemData
  };

  const { error } = await supabase
    .from('standby_waitlist')
    .insert(newItem);

  if (error) {
    console.warn('Error saving standby waitlist entry:', error.message);
    throw error;
  }

  return newItem;
}

/**
 * Updates status of a standby queue entry.
 */
export async function updateStandbyQueueStatus(supabase, id, status) {
  if (!supabase || !id) throw new Error("Missing client or ID");

  const { error } = await supabase
    .from('standby_waitlist')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.warn('Error updating standby status:', error.message);
    throw error;
  }

  return { id, status };
}

/**
 * Deletes a standby queue entry by ID.
 */
export async function deleteStandbyQueueItem(supabase, id) {
  if (!supabase || !id) throw new Error("Missing client or ID");

  const { error } = await supabase
    .from('standby_waitlist')
    .delete()
    .eq('id', id);

  if (error) {
    console.warn('Error deleting standby queue:', error.message);
    throw error;
  }

  return { id };
}
