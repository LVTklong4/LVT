'use client';

import React, { useState, useEffect } from 'react';
import { fetchRecentActivityLogs } from '@/utils/logger';
import { X, ShieldAlert, Search, RefreshCw, Clock, User, FileText } from 'lucide-react';

export default function ActivityLogsModal({ show, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ทั้งหมด');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchRecentActivityLogs(100);
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      loadLogs();
    }
  }, [show]);

  if (!show) return null;

  const filteredLogs = logs.filter(item => {
    const matchesSearch = 
      (item.officer_name && item.officer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.details && item.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.action_type && item.action_type.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesAction = filterAction === 'ทั้งหมด' || item.action_type === filterAction;
    return matchesSearch && matchesAction;
  });

  const formatLogTime = (isoString) => {
    if (!isoString) return '-';
    const dateObj = new Date(isoString);
    return dateObj.toLocaleString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadgeColor = (type) => {
    switch (type) {
      case 'จองแผงค้า':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ยกเลิกจอง':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'แจ้งลา':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ย้ายล็อค':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'จดไฟเพิ่ม':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'คิวสำรอง':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border-2 border-[#8B4513] overflow-hidden animate-pop-in">
        
        {/* Header */}
        <div className="bg-[#FAEBD7] border-b-2 border-[#8B4513] text-[#4A3B32] px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#8B4513]" />
            <h3 className="font-extrabold text-base">ประวัติการทำงานของทีมงาน (Audit Logs)</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-[#8B4513] p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Filter */}
        <div className="p-4 bg-[#FAF6EE] border-b border-[#8B4513]/10 flex flex-wrap gap-2 justify-between items-center text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อแอดมิน, รายละเอียด, หรือการทำงาน..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#8B4513]/30 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="py-1.5 px-3 bg-white border border-[#8B4513]/30 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#8B4513]"
            >
              <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
              <option value="จองแผงค้า">จองแผงค้า</option>
              <option value="ยกเลิกจอง">ยกเลิกจอง</option>
              <option value="แจ้งลา">แจ้งลา</option>
              <option value="ย้ายล็อค">ย้ายล็อค</option>
              <option value="จดไฟเพิ่ม">จดไฟเพิ่ม</option>
              <option value="คิวสำรอง">คิวสำรอง</option>
            </select>
          </div>

          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1.5 bg-[#8B4513] hover:bg-[#5D4037] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
          </button>
        </div>

        {/* Logs Table / List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-gray-400 font-bold text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#8B4513]" />
              กำลังโหลดข้อมูลประวัติ...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold text-xs">
              ไม่พบประวัติการทำงานตรงกับคำค้นหา
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-[#FFFDF9] border border-[#8B4513]/20 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:border-[#8B4513]/40 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${getActionBadgeColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                      <span className="font-extrabold text-xs text-[#5D4037] flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#8B4513]" />
                        {log.officer_name} <span className="text-[10px] font-normal text-gray-500">({log.officer_role})</span>
                      </span>
                    </div>

                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {log.details}
                    </p>
                  </div>

                  <div className="text-[11px] font-mono font-bold text-gray-500 flex items-center gap-1 shrink-0 bg-amber-50/60 px-2.5 py-1 rounded-lg border border-amber-100">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    {formatLogTime(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAEBD7] border-t-2 border-[#8B4513] px-4 py-2.5 flex justify-between items-center text-xs font-bold text-[#5D4037]">
          <span>แสดงสูงสุด 100 รายการล่าสุด</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
