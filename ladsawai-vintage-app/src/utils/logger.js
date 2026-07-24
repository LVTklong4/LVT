import { supabase } from '@/lib/supabase';

// In-memory fallback log list in case database table is not yet created
let localLogsMemory = [];

/**
 * Log officer action to Supabase activity_logs table
 * @param {string} officerName - Name of officer performing action
 * @param {string} officerRole - Role of officer (SuperAdmin, Admin, Staff)
 * @param {string} actionType - Action category ('จองแผงค้า', 'ยกเลิกจอง', 'แจ้งลา', 'ย้ายล็อค', 'จดไฟเพิ่ม', 'คิวสำรอง')
 * @param {string} details - Human-readable details
 */
export async function logOfficerActivity(officerName, officerRole, actionType, details) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    officer_name: officerName || 'เจ้าหน้าที่',
    officer_role: officerRole || 'Staff',
    action_type: actionType,
    details: details || ''
  };

  // Add to local memory first
  localLogsMemory.unshift(logEntry);
  if (localLogsMemory.length > 200) {
    localLogsMemory.pop();
  }

  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert(logEntry);

    if (error) {
      console.warn('Unable to write to activity_logs table (using in-memory log):', error.message);
    }
  } catch (e) {
    console.warn('Activity logging error:', e.message);
  }

  return logEntry;
}

/**
 * Fetch recent activity logs from Supabase or fallback memory
 */
export async function fetchRecentActivityLogs(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return localLogsMemory.slice(0, limit);
    }

    // Merge DB logs with local memory to ensure latest local logs are visible immediately
    const dbIds = new Set(data.map(item => item.id));
    const unpersistedLocal = localLogsMemory.filter(item => !dbIds.has(item.id));
    const combined = [...unpersistedLocal, ...data];
    combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return combined.slice(0, limit);
  } catch (e) {
    console.warn('Error fetching activity logs:', e.message);
    return localLogsMemory.slice(0, limit);
  }
}
