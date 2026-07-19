'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBooking } from './BookingContext';
import {
  dayNamesShort,
  monthNamesFull,
  getModalDateFormat
} from '@/utils/thaiDateHelper';

const StorageContext = createContext();

export function StorageProvider({ children }) {
  const { adminUser, showAlert } = useBooking();

  // UI state
  const [showStorageMgmtModal, setShowStorageMgmtModal] = useState(false);
  const [showStoragePrintModal, setShowStoragePrintModal] = useState(false);
  const [isStorageCheckout, setIsStorageCheckout] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(false);

  // Storage Data state
  const [storageList, setStorageList] = useState([]);
  const [storageMap, setStorageMap] = useState({});

  // Receipt Printing State
  const [storagePrintItem, setStoragePrintItem] = useState(null);
  const [storagePrintStartDate, setStoragePrintStartDate] = useState('');
  const [storagePrintEndDate, setStoragePrintEndDate] = useState('');
  const [storagePrintOwner, setStoragePrintOwner] = useState('');
  const [storagePrintStall, setStoragePrintStall] = useState('');
  const [storagePrintNote, setStoragePrintNote] = useState('');
  const [storagePrintFee, setStoragePrintFee] = useState(0);
  const [storagePrintPayment, setStoragePrintPayment] = useState('เงินสด');

  // Form states for the check-in modal
  const [storageForm, setStorageForm] = useState({
    id: '',
    stall_name: '',
    owner_name: '',
    phone: '',
    start_date: new Date().toISOString().split('T')[0],
    weeks: 1,
    payImmediately: true,
    paymentMethod: 'เงินสด',
    note: '',
    status: 'Active'
  });

  const parseNumber = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const formatPrice = (val) => {
    const num = parseNumber(val);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchAllStorage = async () => {
    setLoadingStorage(true);
    try {
      const { data, error } = await supabase
        .from('storage')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setStorageList(data || []);

      // Build active storage map by stall name
      const activeMap = {};
      data?.forEach(item => {
        if (item.status === 'Active' && item.stall_name) {
          activeMap[item.stall_name] = item;
        }
      });
      setStorageMap(activeMap);
    } catch (e) {
      console.error("Error fetching storage:", e);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    fetchAllStorage();
  }, []);


  // 1. Save new storage deposit (แจ้งฝากของ)
  const handleSaveStorage = async (payloadData) => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    setLoadingStorage(true);
    try {
      const id = payloadData.id || `ST-${Date.now()}`;
      const weeks = parseNumber(payloadData.weeks || 1);
      
      // Calculate end date based on weeks (weeks * 7 days)
      const start = new Date(payloadData.start_date);
      const end = new Date(start);
      end.setDate(start.getDate() + (weeks * 7));
      const calculatedEndDate = end.toISOString().split('T')[0];
      const fee = weeks * 160; // 160 Baht per week

      const payload = {
        id,
        stall_name: payloadData.stall_name.trim(),
        owner_name: payloadData.owner_name.trim(),
        phone: payloadData.phone.trim(),
        start_date: payloadData.start_date,
        end_date: calculatedEndDate,
        status: payloadData.status || 'Active',
        note: payloadData.note || '',
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase.from('storage').upsert(payload);
      if (error) throw error;

      // If user chose to pay upfront
      if (payloadData.payImmediately) {
        const txnId = `TXN-${Date.now()}`;
        const txnData = {
          id: txnId,
          booking_ref: id,
          date: payloadData.start_date,
          category: 'ค่าฝากของ',
          total_amount: fee,
          method: payloadData.paymentMethod || 'เงินสด',
          note: `ชำระค่าฝากของสะสม ล็อค ${payload.stall_name} (${weeks} สัปดาห์)`,
          officer: adminUser.name,
          timestamp: new Date().toISOString(),
          stall_amt: 0,
          elec_amt: 0,
          storage_amt: fee,
          bill_type: 'Storage'
        };

        const { error: txnError } = await supabase.from('transactions').insert(txnData);
        if (txnError) throw txnError;

        // Auto print receipt directly
        handlePrintStorageReceipt(payload, {
          startDate: payload.start_date,
          endDate: payload.end_date,
          fee: fee,
          payment: payloadData.paymentMethod || 'เงินสด'
        });
      }

      showAlert("บันทึกข้อมูลฝากของสำเร็จ", "สำเร็จ");
      fetchAllStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการบันทึก: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // 2. Extend / Renew Storage (ต่ออายุ)
  const handleRenewStorage = async ({ item, weeksCount, paymentMethod }) => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    setLoadingStorage(true);
    try {
      const weeks = parseNumber(weeksCount);
      const fee = weeks * 160;

      // New start date is the old end date
      const oldEndDate = item.end_date || new Date().toISOString().split('T')[0];
      const start = new Date(oldEndDate);
      const nextStartDate = oldEndDate;

      const end = new Date(start);
      end.setDate(start.getDate() + (weeks * 7));
      const calculatedEndDate = end.toISOString().split('T')[0];

      // Update storage record
      const { error: updateErr } = await supabase
        .from('storage')
        .update({
          end_date: calculatedEndDate,
          timestamp: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateErr) throw updateErr;

      // Log transaction
      const txnId = `TXN-${Date.now()}`;
      const txnData = {
        id: txnId,
        booking_ref: item.id,
        date: nextStartDate,
        category: 'ค่าฝากของ',
        total_amount: fee,
        method: paymentMethod || 'เงินสด',
        note: `ชำระค่าต่ออายุฝากของ ล็อค ${item.stall_name} (+${weeks} สัปดาห์)`,
        officer: adminUser.name,
        timestamp: new Date().toISOString(),
        stall_amt: 0,
        elec_amt: 0,
        storage_amt: fee,
        bill_type: 'Storage'
      };

      const { error: txnError } = await supabase.from('transactions').insert(txnData);
      if (txnError) throw txnError;

      // Print ticket directly
      handlePrintStorageReceipt(item, {
        startDate: nextStartDate,
        endDate: calculatedEndDate,
        fee: fee,
        payment: paymentMethod || 'เงินสด'
      });

      showAlert("ต่ออายุการฝากของสำเร็จ", "สำเร็จ");
      fetchAllStorage();
    } catch (e) {
      console.error(e);
      showAlert("เกิดข้อผิดพลาดในการต่ออายุ: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // 3. Checkout Storage (เช็คออก)
  const handleCheckoutStorage = async ({ id, endDate, fee, paymentMethod, note }) => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }
    setLoadingStorage(true);
    try {
      const { error: storageError } = await supabase
        .from('storage')
        .update({
          status: 'Completed',
          end_date: endDate || new Date().toISOString().split('T')[0],
          note: note || ''
        })
        .eq('id', id);

      if (storageError) throw storageError;

      // If fee > 0, log final payment transaction
      const feeNum = parseNumber(fee);
      if (feeNum > 0) {
        const txnId = `TXN-${Date.now()}`;
        const stallName = storagePrintItem?.stall_name || '';
        const txnData = {
          id: txnId,
          booking_ref: id,
          date: endDate || new Date().toISOString().split('T')[0],
          category: 'ค่าฝากของ',
          total_amount: feeNum,
          method: paymentMethod || 'เงินสด',
          note: `ชำระค่าฝากของสะสมตอนเช็คออก ล็อค ${stallName}`,
          officer: adminUser.name,
          timestamp: new Date().toISOString(),
          stall_amt: 0,
          elec_amt: 0,
          storage_amt: feeNum,
          bill_type: 'Storage'
        };

        const { error: txnError } = await supabase.from('transactions').insert(txnData);
        if (txnError) throw txnError;
      }

      showAlert("บันทึกการชำระเงินและสิ้นสุดการฝากเรียบร้อย", "สำเร็จ");
      setShowStoragePrintModal(false);
      fetchAllStorage();
    } catch (e) {
      console.error("Storage checkout error:", e);
      showAlert("เกิดข้อผิดพลาดในการเช็คเอาท์: " + e.message, "ข้อผิดพลาด", true);
    } finally {
      setLoadingStorage(false);
    }
  };

  // 4. Checkin Revert / Toggle status with 24h Lock Policy
  const handleToggleStorageStatus = async (item) => {
    if (!adminUser) {
      showAlert("กรุณาเข้าสู่ระบบก่อนทำรายการ", "แจ้งเตือน", true);
      return;
    }

    if (item.status !== 'Active') {
      setLoadingStorage(true);
      try {
        const { data: txns, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('booking_ref', item.id)
          .eq('category', 'ค่าฝากของ')
          .order('timestamp', { ascending: false });

        if (txError) throw txError;

        const latestTx = txns?.[0];
        if (latestTx) {
          const txTime = new Date(latestTx.timestamp);
          const now = new Date();
          const hoursDiff = (now - txTime) / (1000 * 60 * 60);

          if (hoursDiff > 24) {
            showAlert(
              `ขออภัย! รายการชำระเงินค่าฝากของนี้ทำรายการเกิน 24 ชั่วโมงแล้ว (${hoursDiff.toFixed(1)} ชม.)
` +
              `เพื่อความปลอดภัยทางบัญชี ไม่สามารถยกเลิกเช็คออกหรือคืนเงินได้`,
              "ระงับการดำเนินการ",
              true
            );
            return;
          }

          // Delete checkout transaction if within 24h
          const { error: delErr } = await supabase
            .from('transactions')
            .delete()
            .eq('id', latestTx.id);

          if (delErr) throw delErr;
        }

        // Update storage status back to Active
        const { error: updErr } = await supabase
          .from('storage')
          .update({
            status: 'Active',
            end_date: null
          })
          .eq('id', item.id);

        if (updErr) throw updErr;

        showAlert("ยกเลิกการเช็คเอาท์และคืนสถานะกล่องฝากของเป็นปกติเรียบร้อย", "สำเร็จ");
        fetchAllStorage();
      } catch (e) {
        console.error(e);
        showAlert("เกิดข้อผิดพลาดในการดึงสถานะคืน: " + e.message, "ข้อผิดพลาด", true);
      } finally {
        setLoadingStorage(false);
      }
    }
  };

  // 5. Print Ticket window
  const handlePrintStorageReceipt = (item = null, overrideSettings = {}) => {
    const printItem = item || storagePrintItem;
    if (!printItem) return;

    const startDate = overrideSettings.startDate || (item ? item.start_date : storagePrintStartDate) || printItem.start_date;
    const endDate = overrideSettings.endDate || (item ? item.end_date : storagePrintEndDate) || printItem.end_date;
    
    // Calculate fee
    let feeVal = 160;
    if (overrideSettings.fee !== undefined) {
      feeVal = parseNumber(overrideSettings.fee);
    } else if (!item && storagePrintFee) {
      feeVal = parseNumber(storagePrintFee);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      if (diffTime > 0) {
        const weeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) || 1;
        feeVal = weeks * 160;
      }
    }

    const paymentVal = overrideSettings.payment || (item ? 'เงินสด' : storagePrintPayment);
    const paymentText = paymentVal === 'โอนเงิน' ? 'โอนจ่าย' : 'เงินสด';
    
    const ownerName = printItem.owner_name || '';
    
    const cleanStallName = (name) => {
      if (!name) return '';
      return name.replace(/[\[\]]/g, '').trim();
    };
    const stallText = cleanStallName(printItem.stall_name);
    const noteText = printItem.note || '';

    const now = new Date();
    const formattedTransaction = now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('th-TH', { hour12: false });

    const empCode = adminUser?.employee_id || adminUser?.name || 'lvt-admin';

    const formatDateWithDay = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const dayName = dayNamesShort[d.getDay()] || '';
      return `${dayName} ${d.getDate()} ${monthNamesFull[d.getMonth()]} ${d.getFullYear() + 543}`;
    };

    const startFormatted = formatDateWithDay(startDate);
    const endFormatted = formatDateWithDay(endDate);

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      showAlert('กรุณาอนุญาตให้ป๊อปอัปทำงานเพื่อสั่งพิมพ์ตั๋ว', 'แจ้งเตือน', true);
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>พิมพ์ตั๋วฝากของ</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Sarabun', sans-serif;
              width: 72mm;
              margin: 0 auto;
              padding: 4mm 2mm;
              background: #fff;
              color: #000;
              font-size: 11pt;
              line-height: 1.4;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .logo {
              width: 32mm;
              height: auto;
              margin: 0 auto 2mm auto;
              display: block;
            }
            .divider {
              border-top: 1.5px dashed #000;
              margin: 3mm 0;
            }
            .title {
              font-size: 13pt;
              font-weight: 800;
              margin: 2mm 0 1mm 0;
            }
            .subtitle {
              font-size: 9.5pt;
              font-weight: bold;
              color: #000;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
            .info-table td {
              padding: 1.2mm 0;
              vertical-align: top;
              font-size: 10.5pt;
            }
            .info-table td.label {
              width: 40%;
              white-space: nowrap;
            }
            .info-table td.val {
              text-align: right;
              font-weight: bold;
            }
            .total-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2mm 0;
            }
            .total-table td {
              padding: 1.5mm 0;
            }
            .total-table td.label {
              text-align: right;
              font-size: 11pt;
              font-weight: bold;
              padding-right: 2mm;
            }
            .total-table td.val {
              text-align: right;
              font-size: 13pt;
              font-weight: 800;
            }
            .terms {
              font-size: 8.5pt;
              line-height: 1.35;
              text-align: left;
              margin: 3mm 0;
            }
            .terms-title {
              font-weight: bold;
              margin-bottom: 1mm;
            }
            .terms ol {
              margin: 0;
              padding-left: 4.5mm;
            }
            .terms li {
              margin-bottom: 1mm;
            }
            .footer {
              margin-top: 4mm;
              font-size: 9.5pt;
              text-align: center;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <img class="logo" src="https://img2.pic.in.th/pic/Profile-Alpha_0.png" alt="Logo" />
            <div class="title">ตลาดนัดลาดสวายวินเทจ</div>
            <div class="subtitle">เลขที่ 52/34 หมู่ 5</div>
            <div class="subtitle">ต.ลาดสวาย อ.ลำลูกกา จ.ปทุมธานี 12150</div>
            <div class="subtitle">โทร: 0-92-869-7774 , 0-92-869-7775</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="center bold" style="font-size: 12pt; margin-bottom: 2mm;">ตั๋ว/ใบเสร็จ (ฝากของ)</div>
          
          <table class="info-table">
            <tr>
              <td class="label">วันที่ทำรายการ :</td>
              <td style="text-align: right;">${formattedTransaction}</td>
            </tr>
            <tr>
              <td class="label">รหัสพนักงาน :</td>
              <td style="text-align: right; font-family: monospace; font-size: 9pt;">${empCode}</td>
            </tr>
            <tr>
              <td class="label">วันที่เริ่ม :</td>
              <td style="text-align: right;" class="bold">${startFormatted}</td>
            </tr>
            <tr>
              <td class="label">วันที่สิ้นสุด :</td>
              <td style="text-align: right;" class="bold">${endFormatted}</td>
            </tr>
            <tr>
              <td class="label">ชื่อผู้ฝาก :</td>
              <td style="text-align: right;" class="bold">${ownerName}</td>
            </tr>
            <tr>
              <td class="label">วางของไว้ล็อค :</td>
              <td style="text-align: right;" class="bold">${stallText}</td>
            </tr>
            <tr>
              <td class="label">ค่าฝากของ :</td>
              <td style="text-align: right;" class="bold">${formatPrice(feeVal)}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <table class="info-table">
            <tr>
              <td class="label" style="width: 30%;">รายการที่ฝาก :</td>
              <td style="text-align: left;" class="bold">${noteText || '-'}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <table class="total-table">
            <tr>
              <td class="label">รวมเป็นเงินทั้งสิ้น :</td>
              <td class="val">${formatPrice(feeVal)}</td>
            </tr>
            <tr>
              <td class="label">การชำระเงิน [${paymentText}] :</td>
              <td class="val">${formatPrice(feeVal)}</td>
            </tr>
          </table>
          
          <div class="divider"></div>
          
          <div class="terms">
            <div class="terms-title">รายละเอียดและเงื่อนไขการฝากของมีดังต่อไปนี้</div>
            <ol>
              <li>การฝากของในที่นี้หมายถึง การเช่าพื้นที่วางของเท่านั้น</li>
              <li>ทางตลาดฯ ไม่รับผิดชอบความเสียหาย สูญหายที่เกิดขึ้นทุกกรณี</li>
              <li>ในวันที่มีนัด หากลูกค้าไม่มาทำการค้า ทางตลาดมีสิทธิ์ในการย้ายของไปไว้ที่อื่นทุกกรณี และหากของที่ฝากมีขนาดใหญ่ ไม่สามารถเคลื่อนย้ายได้สะดวก ทางตลาดฯ คิดค่าล็อคในนัดนั้น</li>
              <li>เมื่อสิ้นสุดระยะเวลาฝากของ และไม่ได้ทำการต่อระยะเวลาฝากของ หากลูกค้าไม่มารับหรือมารับในภายหลัง ทางตลาดฯ คิดค่าฝากของย้อนหลัง</li>
              <li>การชำระค่าฝากของ ถือว่าลูกค้าได้รับทราบรายละเอียดและเงื่อนไขการฝากของดังกล่าวแล้ว และจะปฏิบัติตามอย่างเคร่งครัด</li>
            </ol>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div class="bold">สอบถามข้อมูลการฝากของได้ที่</div>
            <div class="bold" style="margin-top: 1mm; font-size: 10.5pt;">@ladsawaivintage</div>
            <div style="font-size: 8pt; color: #555; margin-top: 3mm;">Power by PJMJK</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setShowStoragePrintModal(false);
  };

  return (
    <StorageContext.Provider value={{
      showStorageMgmtModal,
      setShowStorageMgmtModal,
      showStoragePrintModal,
      setShowStoragePrintModal,
      isStorageCheckout,
      setIsStorageCheckout,
      loadingStorage,
      setLoadingStorage,
      storageList,
      storageMap,
      storageForm,
      setStorageForm,
      storagePrintItem,
      setStoragePrintItem,
      storagePrintStartDate,
      setStoragePrintStartDate,
      storagePrintEndDate,
      setStoragePrintEndDate,
      storagePrintOwner,
      setStoragePrintOwner,
      storagePrintStall,
      setStoragePrintStall,
      storagePrintNote,
      setStoragePrintNote,
      storagePrintFee,
      setStoragePrintFee,
      storagePrintPayment,
      setStoragePrintPayment,
      fetchAllStorage,
      handleSaveStorage,
      handleRenewStorage,
      handleCheckoutStorage,
      handleToggleStorageStatus,
      handlePrintStorageReceipt,
      parseNumber,
      formatPrice
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  return useContext(StorageContext);
}