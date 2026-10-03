'use client';

import React from 'react';

/**
 * 🖨️ PRINTABLE REMITTANCE FORM A4 (Only visible during print)
 * Dual control daily cash settlement & remittance slip
 */
export default function DailyClosingRemittancePrint({
  summary,
  selectedDate,
  floatVal = 0,
  cashIn = 0,
  cashOut = 0,
  expectedCashInDrawer = 0,
  countedCashVal = null,
  shortageSurplus = 0,
  denominations = {},
  discrepancyNote = ''
}) {
  const parseNum = (val) => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  return (
    <div className="hidden print:block fixed inset-0 bg-white text-black p-6 text-[11px] font-sans">
      {/* Header with Title & Metadata */}
      <div className="flex justify-between items-start border-b-2 border-black pb-2.5 mb-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain shrink-0" />
          <div>
            <h1 className="text-base font-black uppercase tracking-wide leading-tight">ตลาดนัดลาดสวายวินเทจ</h1>
            <h2 className="text-xs font-bold text-gray-800 leading-tight mt-0.5">
              ใบนำส่งเงินและสรุปการปิดยอดประจำวัน (Daily Cash Settlement & Remittance Form)
            </h2>
            <p className="text-[10px] text-gray-600 mt-0.5">
              ระบบควบคุมการเงินและการตรวจนับเงินสดประจำวัน (Dual Control Remittance)
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] leading-tight">
          <p><span className="font-bold">วันที่ปิดยอด:</span> <span className="font-black text-xs">{selectedDate}</span></p>
          <p><span className="font-bold">เลขที่เอกสาร:</span> CLS-{selectedDate ? selectedDate.split('-').join('') : ''}</p>
          <p><span className="font-bold">ผู้บันทึก:</span> {summary?.existingClosing?.closed_by || 'Admin'}</p>
          <p className="text-gray-500 text-[9px] mt-0.5">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
        </div>
      </div>

      {summary && (
        <div className="flex flex-col gap-3">
          {/* Operational Statistics Strip */}
          <div className="bg-gray-50 border border-gray-300 rounded px-3 py-1.5 flex justify-between items-center text-[10px]">
            <div>
              <span className="font-bold text-gray-700">สถิติแผงค้า: </span>
              <span>แผงทั้งหมด <strong>275</strong> แผง</span>
              <span className="mx-1.5 text-gray-400">|</span>
              <span>จอง/เปิดใช้งาน <strong>{summary.occupancy?.booked || 0}</strong> แผง</span>
              <span className="mx-1.5 text-gray-400">|</span>
              <span>แผงว่าง <strong>{summary.occupancy?.available ?? (275 - (summary.occupancy?.booked || 0))}</strong> แผง</span>
            </div>
            <div>
              <span className="font-bold text-gray-700">เงินโอนเข้าบัญชี: </span>
              <span><strong>{summary.transferTxnCount || 0}</strong> รายการ (รวม <strong>{(summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0).toLocaleString()} ฿</strong>)</span>
            </div>
          </div>

          {/* 1. Revenue Summary Table */}
          <div>
            <h3 className="font-bold text-xs border-b border-gray-400 pb-0.5 mb-1 flex items-center gap-1">
              1. สรุปรายรับแยกตามประเภท (Daily Revenues)
            </h3>
            <table className="w-full text-left border-collapse border border-gray-300 text-[10px]">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-gray-300">
                  <th className="p-1 border-r border-gray-300">หมวดหมู่รายการ</th>
                  <th className="p-1 text-right border-r border-gray-300 w-28">เงินสด (บาท)</th>
                  <th className="p-1 text-right border-r border-gray-300 w-28">โอนเงิน (บาท)</th>
                  <th className="p-1 text-right w-32">ยอดรวมสุทธิ (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-1 border-r border-gray-200">1. ค่าจองแผงรายวัน (Daily Stalls)</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.dailyStall?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.dailyStall?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right font-bold">{(summary.breakdown?.dailyStall?.total ?? summary.dailyStallIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-1 border-r border-gray-200">2. ค่างวดรายเดือน (ชำระในวัน)</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.monthly?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.monthly?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right font-bold">{(summary.breakdown?.monthly?.total ?? summary.monthlyIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-1 border-r border-gray-200">3. บัตรตั๋ว & ค่าไฟคลองถม</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.klongthom?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.klongthom?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right font-bold">{(summary.breakdown?.klongthom?.total ?? summary.klongthomIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-1 border-r border-gray-200">4. ค่าบริการฝากของ (Storage)</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.storage?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.storage?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right font-bold">{(summary.breakdown?.storage?.total ?? summary.storageIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-1 border-r border-gray-200">5. รายรับอื่นๆ (Other Income)</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.otherIncome?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right border-r border-gray-200">{(summary.breakdown?.otherIncome?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right font-bold">{(summary.breakdown?.otherIncome?.total ?? summary.otherIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-black font-black bg-gray-50">
                  <td className="p-1 border-r border-gray-300">รวมรายรับทั้งหมด (Gross Revenue)</td>
                  <td className="p-1 text-right border-r border-gray-300 font-bold text-green-700">{(summary.breakdown?.totalIncome?.cash ?? summary.cashIn ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right border-r border-gray-300 font-bold text-blue-700">{(summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right font-black text-xs">{(summary.breakdown?.totalIncome?.total ?? summary.totalIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-black font-bold text-red-700">
                  <td className="p-1 border-r border-gray-300">หัก: รายจ่ายประจำวัน (Total Expenses)</td>
                  <td className="p-1 text-right border-r border-gray-300 font-bold">-{(summary.breakdown?.expenses?.cash ?? summary.cashOut ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right border-r border-gray-300 font-bold">-{(summary.breakdown?.expenses?.transfer ?? summary.transferOut ?? 0).toLocaleString()} ฿</td>
                  <td className="p-1 text-right font-bold">-{(summary.breakdown?.expenses?.total ?? summary.totalExpenses ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="bg-gray-100 font-black">
                  <td className="p-1 border-r border-gray-300 text-gray-800">รายรับสุทธิประจำวัน (Net Daily Inflow)</td>
                  <td className="p-1 text-right border-r border-gray-300 font-black text-green-800">
                    {(summary.cashIn - summary.cashOut).toLocaleString()} ฿
                  </td>
                  <td className="p-1 text-right border-r border-gray-300 font-black text-blue-800">
                    {(summary.transferIn - summary.transferOut).toLocaleString()} ฿
                  </td>
                  <td className="p-1 text-right font-black text-xs text-gray-900">
                    {((summary.cashIn - summary.cashOut) + (summary.transferIn - summary.transferOut)).toLocaleString()} ฿
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Cash Reconciliation & Denominations (2 Columns) */}
          <div>
            <h3 className="font-bold text-xs border-b border-gray-400 pb-0.5 mb-1">
              2. การกระทบยอดเงินสดและการตรวจนับ (Cash Reconciliation & Denomination Count)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              
              {/* Left Column: Reconciliation */}
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 font-bold border-r border-gray-300 bg-gray-50">เงินทอนเริ่มต้น (Opening Float)</td>
                    <td className="p-1 text-right font-bold">{floatVal.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 font-bold border-r border-gray-300 bg-gray-50">เงินสดรับรวม (Cash In)</td>
                    <td className="p-1 text-right font-bold text-green-700">+{cashIn.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-1 font-bold border-r border-gray-300 bg-gray-50">เงินสดจ่ายรวม (Cash Out)</td>
                    <td className="p-1 text-right font-bold text-red-700">-{cashOut.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-gray-300 font-bold bg-gray-100">
                    <td className="p-1 border-r border-gray-300">เงินสดที่ควรมีในลิ้นชัก (Expected Cash)</td>
                    <td className="p-1 text-right font-black">{expectedCashInDrawer.toLocaleString()} ฿</td>
                  </tr>
                  <tr className="border-b border-black font-black bg-gray-50">
                    <td className="p-1 border-r border-gray-300">ยอดเงินสดนับนำส่งจริง (Counted Cash Remitted)</td>
                    <td className="p-1 text-right font-black text-xs">
                      {countedCashVal !== null ? countedCashVal.toLocaleString() : '0'} ฿
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td className="p-1 border-r border-gray-300">ผลต่างเงินขาด / เงินเกิน (Shortage / Surplus)</td>
                    <td className={`p-1 text-right font-black ${
                      shortageSurplus === 0 ? 'text-green-700' : shortageSurplus < 0 ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {shortageSurplus > 0 ? '+' : ''}{shortageSurplus.toLocaleString()} ฿
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Right Column: Denominations */}
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-gray-300 text-center">
                    <th className="p-1 border-r border-gray-300 text-left">ชนิดธนบัตร / เหรียญ</th>
                    <th className="p-1 border-r border-gray-300 w-16">จำนวน</th>
                    <th className="p-1 text-right w-24">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'ธนบัตร 1,000 บาท', count: denominations.b1000, mult: 1000 },
                    { label: 'ธนบัตร 500 บาท', count: denominations.b500, mult: 500 },
                    { label: 'ธนบัตร 100 บาท', count: denominations.b100, mult: 100 },
                    { label: 'ธนบัตร 50 บาท', count: denominations.b50, mult: 50 },
                    { label: 'ธนบัตร 20 บาท', count: denominations.b20, mult: 20 },
                    { label: 'เหรียญกษาปณ์รวม', count: '-', amt: parseNum(denominations.coins) }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="p-0.5 px-1 border-r border-gray-200">{row.label}</td>
                      <td className="p-0.5 px-1 text-center border-r border-gray-200 text-gray-700">
                        {row.count !== '-' ? (row.count || '-') : '-'}
                      </td>
                      <td className="p-0.5 px-1 text-right font-semibold">
                        {(row.amt !== undefined ? row.amt : (parseNum(row.count) * row.mult) || 0).toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-black border-t border-black">
                    <td colSpan={2} className="p-1 border-r border-gray-300 text-right">รวมเงินสดตรวจนับได้จริง</td>
                    <td className="p-1 text-right font-black text-xs text-green-800">
                      {countedCashVal !== null ? countedCashVal.toLocaleString() : '0'} ฿
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>
          </div>

          {/* 3. Expense Itemization Table */}
          <div>
            <h3 className="font-bold text-xs border-b border-gray-400 pb-0.5 mb-1 flex justify-between items-center">
              <span>3. รายการแจกแจงรายจ่ายประจำวัน (Daily Expense Itemization)</span>
              <span className="text-[10px] font-bold text-gray-600">
                {summary.expenseItems?.length ? `${summary.expenseItems.length} รายการ` : 'ไม่มีรายการ'}
              </span>
            </h3>
            {summary.expenseItems && summary.expenseItems.length > 0 ? (
              <table className="w-full border-collapse border border-gray-300 text-[10px]">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-gray-300">
                    <th className="p-1 border-r border-gray-300 w-8 text-center">#</th>
                    <th className="p-1 border-r border-gray-300">รายการ / คำอธิบายรายจ่าย</th>
                    <th className="p-1 border-r border-gray-300 w-28">หมวดหมู่</th>
                    <th className="p-1 border-r border-gray-300 w-20 text-center">ช่องทางจ่าย</th>
                    <th className="p-1 text-right w-24">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.expenseItems.map((exp, idx) => (
                    <tr key={exp.id || idx} className="border-b border-gray-200">
                      <td className="p-1 border-r border-gray-200 text-center text-gray-500">{idx + 1}</td>
                      <td className="p-1 border-r border-gray-200 font-medium">{exp.description}</td>
                      <td className="p-1 border-r border-gray-200 text-gray-600">{exp.category}</td>
                      <td className="p-1 border-r border-gray-200 text-center font-bold">
                        {exp.method}
                      </td>
                      <td className="p-1 text-right font-bold text-red-700">-{exp.amount.toLocaleString()} ฿</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-black border-t border-black">
                    <td colSpan={4} className="p-1 border-r border-gray-300 text-right">รวมรายจ่ายทั้งสิ้น (Total Expenses)</td>
                    <td className="p-1 text-right font-black text-red-700">-{summary.totalExpenses.toLocaleString()} ฿</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="p-1 text-center text-gray-500 border border-gray-200 rounded text-[10px] italic">
                — ไม่มีรายการรายจ่ายในวันที่เลือก —
              </div>
            )}
          </div>

          {/* Discrepancy Note */}
          {discrepancyNote && (
            <div className="border border-gray-300 p-1.5 rounded bg-gray-50 text-[10px]">
              <strong className="font-bold text-gray-800">หมายเหตุ / เหตุผลเงินขาด-เกิน: </strong>
              <span>{discrepancyNote}</span>
            </div>
          )}

          {/* 4. Signature Area (3 Columns - Dual Control Chain) */}
          <div className="pt-3 mt-1 border-t-2 border-gray-400">
            <p className="text-[10px] font-bold text-gray-600 text-center mb-3">
              การลงนามรับรองความถูกต้อง (Sign-off & Dual Control Chain)
            </p>
            <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
              
              {/* 1. Cashier */}
              <div className="flex flex-col items-center gap-7">
                <div>
                  <p className="font-bold text-gray-900">1. เจ้าหน้าที่ผู้นำส่งเงิน</p>
                  <p className="text-[9px] text-gray-500">(ผู้จัดทำ / Cashier)</p>
                </div>
                <div className="w-36 border-b border-black"></div>
                <div>
                  <p className="text-[9px]">( ................................................................ )</p>
                  <p className="text-[8px] text-gray-500 mt-0.5">วันที่ .......... / .......... / ................</p>
                </div>
              </div>

              {/* 2. Accountant / Receiver */}
              <div className="flex flex-col items-center gap-7">
                <div>
                  <p className="font-bold text-gray-900">2. ฝ่ายการเงิน / บัญชี</p>
                  <p className="text-[9px] text-gray-500">(ผู้ตรวจนับรับเงินสด / Receiver)</p>
                </div>
                <div className="w-36 border-b border-black"></div>
                <div>
                  <p className="text-[9px]">( ................................................................ )</p>
                  <p className="text-[8px] text-gray-500 mt-0.5">วันที่ .......... / .......... / ................</p>
                </div>
              </div>

              {/* 3. Market Manager / Owner */}
              <div className="flex flex-col items-center gap-7">
                <div>
                  <p className="font-bold text-gray-900">3. ผู้ตรวจสอบ / ผู้จัดการตลาด</p>
                  <p className="text-[9px] text-gray-500">(ผู้อนุมัติ / Approved by)</p>
                </div>
                <div className="w-36 border-b border-black"></div>
                <div>
                  <p className="text-[9px]">( ................................................................ )</p>
                  <p className="text-[8px] text-gray-500 mt-0.5">วันที่ .......... / .......... / ................</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
