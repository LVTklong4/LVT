'use client';

import React from 'react';

/**
 * 🖨️ PRINTABLE REMITTANCE FORM A4 (Only visible during print)
 * Dual control daily cash settlement & remittance slip
 * Redesigned for high legibility, professional accounting layout, and crisp A4 portrait printing
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
    <div className="hidden print:block w-full max-w-[210mm] mx-auto bg-white text-black p-2 font-sans text-xs leading-normal">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .print-tabular {
            font-variant-numeric: tabular-nums;
          }
        }
      `}} />

      {/* Header with Title & Metadata */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2.5 mb-2.5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide leading-tight text-black">ตลาดนัดลาดสวายวินเทจ</h1>
            <h2 className="text-sm font-bold text-gray-900 leading-tight mt-0.5">
              ใบนำส่งเงินและสรุปการปิดยอดประจำวัน (Daily Cash Settlement & Remittance Form)
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              ระบบควบคุมการเงินและการตรวจนับเงินสดประจำวัน (Dual Control Remittance)
            </p>
          </div>
        </div>
        <div className="text-right text-xs leading-relaxed shrink-0">
          <p><span className="font-bold text-gray-700">วันที่ปิดยอด:</span> <span className="font-black text-sm text-black ml-1">{selectedDate}</span></p>
          <p><span className="font-bold text-gray-700">เลขที่เอกสาร:</span> <span className="font-mono font-semibold ml-1">CLS-{selectedDate ? selectedDate.split('-').join('') : ''}</span></p>
          <p><span className="font-bold text-gray-700">ผู้บันทึก:</span> <span className="font-bold ml-1">{summary?.existingClosing?.closed_by || 'Admin'}</span></p>
          <p className="text-gray-500 text-[10px] mt-0.5">พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
        </div>
      </div>

      {summary && (
        <div className="flex flex-col gap-3">
          {/* Operational Statistics Strip */}
          <div className="bg-gray-100 border border-gray-400 rounded px-3 py-1.5 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">สถิติแผงค้า:</span>
              <span>แผงทั้งหมด <strong className="text-black">275</strong> แผง</span>
              <span className="text-gray-400 font-bold">|</span>
              <span>จอง/เปิดใช้งาน <strong className="text-black">{summary.occupancy?.booked || 0}</strong> แผง</span>
              <span className="text-gray-400 font-bold">|</span>
              <span>แผงว่าง <strong className="text-black">{summary.occupancy?.available ?? (275 - (summary.occupancy?.booked || 0))}</strong> แผง</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">เงินโอนเข้าบัญชี:</span>
              <span><strong className="text-blue-900">{summary.transferTxnCount || 0}</strong> รายการ</span>
              <span>(รวม <strong className="text-blue-900 font-mono">{(summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0).toLocaleString()} ฿</strong>)</span>
            </div>
          </div>

          {/* 1. Revenue Summary Table */}
          <div>
            <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-1">
              <h3 className="font-black text-sm text-black">
                1. สรุปรายรับแยกตามประเภท (Daily Revenues)
              </h3>
              <span className="text-[11px] text-gray-600 font-medium">หน่วย: บาท (THB)</span>
            </div>
            <table className="w-full text-left border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-200 font-bold border-b border-gray-400 text-gray-900">
                  <th className="py-1.5 px-3 border-r border-gray-400">หมวดหมู่รายการ</th>
                  <th className="py-1.5 px-3 text-right border-r border-gray-400 w-36">เงินสด (บาท)</th>
                  <th className="py-1.5 px-3 text-right border-r border-gray-400 w-36">โอนเงิน (บาท)</th>
                  <th className="py-1.5 px-3 text-right w-40">ยอดรวมสุทธิ (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-1 px-3 border-r border-gray-300 font-medium">1. ค่าจองแผงรายวัน (Daily Stalls)</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.dailyStall?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.dailyStall?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right font-bold font-mono">{(summary.breakdown?.dailyStall?.total ?? summary.dailyStallIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-1 px-3 border-r border-gray-300 font-medium">2. ค่างวดรายเดือน (ชำระในวัน)</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.monthly?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.monthly?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right font-bold font-mono">{(summary.breakdown?.monthly?.total ?? summary.monthlyIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-1 px-3 border-r border-gray-300 font-medium">3. บัตรตั๋ว & ค่าไฟคลองถม</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.klongthom?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.klongthom?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right font-bold font-mono">{(summary.breakdown?.klongthom?.total ?? summary.klongthomIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-1 px-3 border-r border-gray-300 font-medium">4. ค่าบริการฝากของ (Storage)</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.storage?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.storage?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right font-bold font-mono">{(summary.breakdown?.storage?.total ?? summary.storageIncome ?? 0).toLocaleString()} ฿</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-1 px-3 border-r border-gray-300 font-medium">5. รายรับอื่นๆ (Other Income)</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.otherIncome?.cash ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right border-r border-gray-300 font-mono">{(summary.breakdown?.otherIncome?.transfer ?? 0).toLocaleString()} ฿</td>
                  <td className="py-1 px-3 text-right font-bold font-mono">{(summary.breakdown?.otherIncome?.total ?? summary.otherIncome ?? 0).toLocaleString()} ฿</td>
                </tr>

                {/* Optional Carry Forward Row */}
                {summary.carryForward && summary.carryForward.total !== 0 && (
                  <tr className="border-b border-gray-300 bg-amber-50/70">
                    <td className="py-1 px-3 border-r border-gray-300 font-medium text-amber-950">
                      6. ยกยอดรายรับที่ค้างปิดยอดสะสม (Unclosed Carry-Forward)
                    </td>
                    <td className="py-1 px-3 text-right border-r border-gray-300 font-mono font-semibold text-amber-950">
                      {(summary.carryForward.cash ?? 0).toLocaleString()} ฿
                    </td>
                    <td className="py-1 px-3 text-right border-r border-gray-300 font-mono font-semibold text-amber-950">
                      {(summary.carryForward.transfer ?? 0).toLocaleString()} ฿
                    </td>
                    <td className="py-1 px-3 text-right font-bold font-mono text-amber-950">
                      {(summary.carryForward.total ?? 0).toLocaleString()} ฿
                    </td>
                  </tr>
                )}

                <tr className="border-b border-black font-black bg-gray-100 text-gray-900">
                  <td className="py-1.5 px-3 border-r border-gray-400">รวมรายรับทั้งหมด (Gross Revenue)</td>
                  <td className="py-1.5 px-3 text-right border-r border-gray-400 font-bold font-mono text-green-800">
                    {(summary.breakdown?.totalIncome?.cash ?? summary.cashIn ?? 0).toLocaleString()} ฿
                  </td>
                  <td className="py-1.5 px-3 text-right border-r border-gray-400 font-bold font-mono text-blue-800">
                    {(summary.breakdown?.totalIncome?.transfer ?? summary.transferIn ?? 0).toLocaleString()} ฿
                  </td>
                  <td className="py-1.5 px-3 text-right font-black font-mono text-xs text-black">
                    {(summary.breakdown?.totalIncome?.total ?? summary.totalIncome ?? 0).toLocaleString()} ฿
                  </td>
                </tr>
                <tr className="border-b-2 border-black font-bold text-red-700 bg-red-50/50">
                  <td className="py-1 px-3 border-r border-gray-400">หัก: รายจ่ายประจำวัน (Total Expenses)</td>
                  <td className="py-1 px-3 text-right border-r border-gray-400 font-mono">
                    -{(summary.breakdown?.expenses?.cash ?? summary.cashOut ?? 0).toLocaleString()} ฿
                  </td>
                  <td className="py-1 px-3 text-right border-r border-gray-400 font-mono">
                    -{(summary.breakdown?.expenses?.transfer ?? summary.transferOut ?? 0).toLocaleString()} ฿
                  </td>
                  <td className="py-1 px-3 text-right font-mono font-bold">
                    -{(summary.breakdown?.expenses?.total ?? summary.totalExpenses ?? 0).toLocaleString()} ฿
                  </td>
                </tr>
                <tr className="bg-emerald-50/80 font-black border-b-2 border-black">
                  <td className="py-1.5 px-3 border-r border-gray-400 text-gray-900 font-extrabold">
                    รายรับสุทธิประจำวัน (Net Daily Inflow)
                  </td>
                  <td className="py-1.5 px-3 text-right border-r border-gray-400 font-mono font-black text-emerald-900">
                    {(summary.cashIn - summary.cashOut).toLocaleString()} ฿
                  </td>
                  <td className="py-1.5 px-3 text-right border-r border-gray-400 font-mono font-black text-blue-900">
                    {(summary.transferIn - summary.transferOut).toLocaleString()} ฿
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-sm text-black">
                    {((summary.cashIn - summary.cashOut) + (summary.transferIn - summary.transferOut)).toLocaleString()} ฿
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Cash Reconciliation & Denominations (2 Columns) */}
          <div>
            <div className="border-b-2 border-black pb-1 mb-1">
              <h3 className="font-black text-sm text-black">
                2. การกระทบยอดเงินสดและการตรวจนับ (Cash Reconciliation & Denomination Count)
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* Left Column: Reconciliation */}
              <table className="w-full border-collapse border border-gray-400">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-1 px-2.5 font-bold border-r border-gray-300 bg-gray-50 text-gray-800">
                      เงินทอนเริ่มต้น (Opening Float)
                    </td>
                    <td className="py-1 px-2.5 text-right font-bold font-mono text-gray-900">
                      {floatVal.toLocaleString()} ฿
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-1 px-2.5 font-bold border-r border-gray-300 bg-gray-50 text-gray-800">
                      เงินสดรับรวม (Cash In)
                    </td>
                    <td className="py-1 px-2.5 text-right font-bold font-mono text-emerald-800">
                      +{cashIn.toLocaleString()} ฿
                    </td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-1 px-2.5 font-bold border-r border-gray-300 bg-gray-50 text-gray-800">
                      เงินสดจ่ายรวม (Cash Out)
                    </td>
                    <td className="py-1 px-2.5 text-right font-bold font-mono text-red-700">
                      -{cashOut.toLocaleString()} ฿
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400 font-bold bg-gray-100">
                    <td className="py-1.5 px-2.5 border-r border-gray-400 text-gray-900">
                      เงินสดที่ควรมีในลิ้นชัก (Expected Cash)
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-black font-mono text-xs text-black">
                      {expectedCashInDrawer.toLocaleString()} ฿
                    </td>
                  </tr>
                  <tr className="border-b border-black font-black bg-emerald-50/50">
                    <td className="py-1.5 px-2.5 border-r border-gray-400 text-gray-900">
                      ยอดเงินสดนับนำส่งจริง (Counted Cash Remitted)
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-black font-mono text-xs text-emerald-900">
                      {countedCashVal !== null ? countedCashVal.toLocaleString() : '0'} ฿
                    </td>
                  </tr>
                  <tr className="font-bold bg-white">
                    <td className="py-1.5 px-2.5 border-r border-gray-300 text-gray-900">
                      ผลต่างเงินขาด / เงินเกิน (Shortage / Surplus)
                    </td>
                    <td className={`py-1.5 px-2.5 text-right font-black font-mono text-xs ${
                      shortageSurplus === 0 ? 'text-emerald-800' : shortageSurplus < 0 ? 'text-red-700' : 'text-blue-800'
                    }`}>
                      {shortageSurplus > 0 ? '+' : ''}{shortageSurplus.toLocaleString()} ฿
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Right Column: Denominations */}
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-200 font-bold border-b border-gray-400 text-gray-900 text-center">
                    <th className="py-1 px-2 border-r border-gray-400 text-left">ชนิดธนบัตร / เหรียญ</th>
                    <th className="py-1 px-2 border-r border-gray-400 w-20">จำนวน</th>
                    <th className="py-1 px-2 text-right w-28">จำนวนเงิน (บาท)</th>
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
                    <tr key={i} className="border-b border-gray-300">
                      <td className="py-0.5 px-2 border-r border-gray-300 font-medium">{row.label}</td>
                      <td className="py-0.5 px-2 text-center border-r border-gray-300 text-gray-800 font-mono">
                        {row.count !== '-' ? (row.count || '-') : '-'}
                      </td>
                      <td className="py-0.5 px-2 text-right font-semibold font-mono">
                        {(row.amt !== undefined ? row.amt : (parseNum(row.count) * row.mult) || 0).toLocaleString()} ฿
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-black border-t-2 border-black">
                    <td colSpan={2} className="py-1 px-2 border-r border-gray-400 text-right text-gray-900">
                      รวมเงินสดตรวจนับได้จริง
                    </td>
                    <td className="py-1 px-2 text-right font-black font-mono text-xs text-emerald-900">
                      {countedCashVal !== null ? countedCashVal.toLocaleString() : '0'} ฿
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>
          </div>

          {/* 3. Expense Itemization Table */}
          <div>
            <div className="flex justify-between items-center border-b-2 border-black pb-1 mb-1">
              <h3 className="font-black text-sm text-black">
                3. รายการแจกแจงรายจ่ายประจำวัน (Daily Expense Itemization)
              </h3>
              <span className="text-[11px] font-bold text-gray-700">
                {summary.expenseItems?.length ? `${summary.expenseItems.length} รายการ` : 'ไม่มีรายการ'}
              </span>
            </div>
            {summary.expenseItems && summary.expenseItems.length > 0 ? (
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-200 font-bold border-b border-gray-400 text-gray-900">
                    <th className="py-1 px-2 border-r border-gray-400 w-10 text-center">#</th>
                    <th className="py-1 px-2 border-r border-gray-400">รายการ / คำอธิบายรายจ่าย</th>
                    <th className="py-1 px-2 border-r border-gray-400 w-32">หมวดหมู่</th>
                    <th className="py-1 px-2 border-r border-gray-400 w-24 text-center">ช่องทางจ่าย</th>
                    <th className="py-1 px-2 text-right w-28">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.expenseItems.map((exp, idx) => (
                    <tr key={exp.id || idx} className="border-b border-gray-300">
                      <td className="py-0.5 px-2 border-r border-gray-300 text-center text-gray-600 font-mono">{idx + 1}</td>
                      <td className="py-0.5 px-2 border-r border-gray-300 font-medium">{exp.description}</td>
                      <td className="py-0.5 px-2 border-r border-gray-300 text-gray-700">{exp.category}</td>
                      <td className="py-0.5 px-2 border-r border-gray-300 text-center font-bold">
                        {exp.method}
                      </td>
                      <td className="py-0.5 px-2 text-right font-bold font-mono text-red-700">-{exp.amount.toLocaleString()} ฿</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-black border-t-2 border-black">
                    <td colSpan={4} className="py-1 px-2 border-r border-gray-400 text-right text-gray-900">รวมรายจ่ายทั้งสิ้น (Total Expenses)</td>
                    <td className="py-1 px-2 text-right font-black font-mono text-red-700">-{summary.totalExpenses.toLocaleString()} ฿</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="py-2 px-4 text-center text-gray-500 border border-gray-300 rounded text-xs italic bg-gray-50">
                — ไม่มีรายการรายจ่ายในวันที่เลือก —
              </div>
            )}
          </div>

          {/* Discrepancy Note */}
          {discrepancyNote && (
            <div className="border border-amber-300 p-2 rounded bg-amber-50/70 text-xs">
              <strong className="font-bold text-amber-950">หมายเหตุ / เหตุผลเงินขาด-เกิน: </strong>
              <span className="text-amber-900">{discrepancyNote}</span>
            </div>
          )}

          {/* 4. Signature Area (3 Columns - Dual Control Chain) */}
          <div className="pt-3 mt-1 border-t-2 border-black">
            <p className="text-xs font-black text-gray-800 text-center mb-3 tracking-wide uppercase">
              การลงนามรับรองความถูกต้อง (Sign-off & Dual Control Chain)
            </p>
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              
              {/* 1. Cashier */}
              <div className="flex flex-col items-center">
                <div className="h-8 flex flex-col justify-start">
                  <p className="font-bold text-gray-900 text-xs">1. เจ้าหน้าที่ผู้นำส่งเงิน</p>
                  <p className="text-[10px] text-gray-600">(ผู้จัดทำ / Cashier)</p>
                </div>
                <div className="w-48 border-b-2 border-dashed border-gray-500 my-3"></div>
                <div>
                  <p className="text-xs text-gray-800">( ................................................................ )</p>
                  <p className="text-[10px] text-gray-600 mt-1">วันที่ .......... / .......... / ................</p>
                </div>
              </div>

              {/* 2. Accountant / Receiver */}
              <div className="flex flex-col items-center">
                <div className="h-8 flex flex-col justify-start">
                  <p className="font-bold text-gray-900 text-xs">2. ฝ่ายการเงิน / บัญชี</p>
                  <p className="text-[10px] text-gray-600">(ผู้ตรวจนับรับเงินสด / Receiver)</p>
                </div>
                <div className="w-48 border-b-2 border-dashed border-gray-500 my-3"></div>
                <div>
                  <p className="text-xs text-gray-800">( ................................................................ )</p>
                  <p className="text-[10px] text-gray-600 mt-1">วันที่ .......... / .......... / ................</p>
                </div>
              </div>

              {/* 3. Market Manager / Owner */}
              <div className="flex flex-col items-center">
                <div className="h-8 flex flex-col justify-start">
                  <p className="font-bold text-gray-900 text-xs">3. ผู้ตรวจสอบ / ผู้จัดการตลาด</p>
                  <p className="text-[10px] text-gray-600">(ผู้อนุมัติ / Approved by)</p>
                </div>
                <div className="w-48 border-b-2 border-dashed border-gray-500 my-3"></div>
                <div>
                  <p className="text-xs text-gray-800">( ................................................................ )</p>
                  <p className="text-[10px] text-gray-600 mt-1">วันที่ .......... / .......... / ................</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
