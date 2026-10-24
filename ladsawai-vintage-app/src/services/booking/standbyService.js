/**
 * Standby Waitlist Service
 * Pure logic and database operations for managing standby queues.
 * Includes resilient localStorage caching and offline/schema-missing fallback.
 */

const LOCAL_STORAGE_KEY = 'lvt_standby_waitlist';

function getLocalStandbyList() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Error reading standby waitlist from localStorage:', e);
    return [];
  }
}

function saveLocalStandbyList(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving standby waitlist to localStorage:', e);
  }
}

/**
 * Fetches all standby waitlist entries ordered by creation date descending.
 */
export async function fetchStandbyList(supabase) {
  const localItems = getLocalStandbyList();
  if (!supabase) return localItems;

  try {
    const { data, error } = await supabase
      .from('standby_waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching standby list from Supabase, using local fallback:', error.message);
      return localItems;
    }

    if (data && data.length > 0) {
      saveLocalStandbyList(data);
      return data;
    }

    return localItems;
  } catch (err) {
    console.warn('Supabase fetchStandbyList failed, using local fallback:', err);
    return localItems;
  }
}

/**
 * Inserts a new standby queue entry.
 */
export async function createStandbyQueueItem(supabase, itemData) {
  const newItem = {
    id: `STB-${Date.now()}`,
    created_at: new Date().toISOString(),
    ...itemData
  };

  // 1. Immediately store into local fallback to ensure zero data loss
  const currentList = getLocalStandbyList();
  saveLocalStandbyList([newItem, ...currentList.filter(i => i.id !== newItem.id)]);

  if (!supabase) return newItem;

  // 2. Persist to Supabase if table is present
  try {
    const { error } = await supabase
      .from('standby_waitlist')
      .insert(newItem);

    if (error) {
      console.warn('Supabase standby insert warning (saved safely in local fallback):', error.message);
      // Fallback is already saved, do not throw so user can continue without disruption
      return newItem;
    }
  } catch (err) {
    console.warn('Supabase insert failed, retained in local fallback:', err);
  }

  return newItem;
}

/**
 * Updates status of a standby queue entry.
 */
export async function updateStandbyQueueStatus(supabase, id, status) {
  if (!id) throw new Error("Missing ID");

  // 1. Update in local storage
  const currentList = getLocalStandbyList();
  saveLocalStandbyList(currentList.map(item => item.id === id ? { ...item, status } : item));

  if (!supabase) return { id, status };

  // 2. Update in Supabase
  try {
    const { error } = await supabase
      .from('standby_waitlist')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.warn('Supabase update standby status warning (saved safely in local fallback):', error.message);
    }
  } catch (err) {
    console.warn('Supabase update failed, retained in local fallback:', err);
  }

  return { id, status };
}

/**
 * Deletes a standby queue entry by ID.
 */
export async function deleteStandbyQueueItem(supabase, id) {
  if (!id) throw new Error("Missing ID");

  // 1. Remove from local storage
  const currentList = getLocalStandbyList();
  saveLocalStandbyList(currentList.filter(item => item.id !== id));

  if (!supabase) return { id };

  // 2. Remove from Supabase
  try {
    const { error } = await supabase
      .from('standby_waitlist')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete standby queue warning (removed from local fallback):', error.message);
    }
  } catch (err) {
    console.warn('Supabase delete failed, removed from local fallback:', err);
  }

  return { id };
}
