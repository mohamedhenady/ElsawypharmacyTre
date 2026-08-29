import React, { useRef } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { DrawerShift } from '../types';
import { Printer, X, Share2, Check, Copy } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: DrawerShift | null;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  shift
}) => {
  const { pharmacyProfile } = useTreasury();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !shift) return null;

  const shiftTypeName =
    shift.shiftType === 'morning'
      ? 'صباحية'
      : shift.shiftType === 'evening'
      ? 'مسائية'
      : 'ليلية';

  // Calculate items for the receipt
  const expensesList = [...(shift.expenses || [])];
  const instaTotal =
    shift.totalInstaPay !== undefined
      ? shift.totalInstaPay
      : (shift.instaPayTransfers || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const walletTotal =
    shift.totalWallet !== undefined
      ? shift.totalWallet
      : (shift.walletTransfers || []).reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // Combined receipt rows
  interface ReceiptRowItem {
    id: string;
    title: string;
    amount: number;
    notes?: string;
  }

  const receiptRows: ReceiptRowItem[] = [];

  // Add expenses
  expensesList.forEach(exp => {
    receiptRows.push({
      id: exp.id,
      title: exp.title,
      amount: Number(exp.amount) || 0,
      notes: exp.notes
    });
  });

  // If there are insta transfers, add row "انستا"
  if (instaTotal > 0) {
    receiptRows.push({
      id: 'instapay-total-row',
      title: 'انستا',
      amount: instaTotal,
      notes: `${(shift.instaPayTransfers || []).length} تحويل إنستاباي`
    });
  }

  // If there are wallet transfers, add row "محفظة"
  if (walletTotal > 0) {
    receiptRows.push({
      id: 'wallet-total-row',
      title: 'محفظة',
      amount: walletTotal,
      notes: `${(shift.walletTransfers || []).length} تحويل محفظة`
    });
  }

  const totalDeductions = receiptRows.reduce((sum, r) => sum + r.amount, 0);
  const leftInDrawer = Number(shift.leftInDrawer) || 0;
  const transferredToVault = Number(shift.transferredToVault) || 0;
  const totalSales =
    shift.totalSales !== undefined && shift.totalSales > 0
      ? shift.totalSales
      : totalDeductions + leftInDrawer + transferredToVault;

  // Format date/day
  const shiftDateStr = shift.date || new Date().toISOString().split('T')[0];
  const shiftDayStr = shift.dayName || 'الوردية';

  // Format closed timestamp (AM 06:07 8/29/2026)
  const formatReceiptTimestamp = () => {
    const d = shift.closedAt ? new Date(shift.closedAt) : new Date();
    const hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${ampm} ${String(h12).padStart(2, '0')}:${minutes} ${month}/${day}/${year}`;
  };

  const numberFormatter = (val: number) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const generateReceiptText = () => {
    let text = `================================\n`;
    text += `       ${pharmacyProfile.name || 'صيدلية الصاوي'}\n`;
    text += `--------------------------------\n`;
    text += `      ${shiftDateStr} - ${shiftDayStr}\n`;
    text += `       د. ${shift.pharmacistName} | ${shiftTypeName}\n`;
    text += `--------------------------------\n`;
    text += `           المصروفات            \n\n`;

    receiptRows.forEach((r, idx) => {
      text += `${idx + 1}   ${r.title.padEnd(16, ' ')}   ${numberFormatter(r.amount)}\n`;
    });

    text += `--------------------------------\n`;
    text += `المصروفات          ${numberFormatter(totalDeductions)}\n`;
    text += `المتروك            ${numberFormatter(leftInDrawer)}\n`;
    text += `للخزينة            ${numberFormatter(transferredToVault)}\n`;
    text += `================================\n`;
    text += `المبيعات           ${numberFormatter(totalSales)}\n`;
    text += `--------------------------------\n`;
    text += `       ${formatReceiptTimestamp()}\n`;
    text += `================================\n`;
    return text;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    try {
      const text = generateReceiptText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy text', e);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReceiptText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      id="thermal-receipt-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="thermal-receipt-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[94vh] text-slate-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">إيصال الوردية الحراري (POS Receipt)</h3>
              <p className="text-[11px] text-slate-400">مطابق تماماً لنموذج طابعة الفواتير والريسيت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Paper Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/90 flex items-center justify-center flex-1">
          <div
            ref={receiptRef}
            id="printable-thermal-receipt"
            className="bg-white text-black p-6 rounded-md shadow-lg w-full max-w-[320px] text-sm font-mono border border-slate-300 print:shadow-none print:border-none print:max-w-full print:p-2 print:m-0"
            style={{
              fontFamily: "'Courier New', Courier, 'Cascadia Mono', 'Liberation Mono', monospace",
              color: '#000000',
              lineHeight: '1.4'
            }}
          >
            {/* Header: Pharmacy Name */}
            <div className="text-center pb-2">
              <h2 className="text-xl font-black tracking-normal text-black font-sans">
                {pharmacyProfile.name || 'صيدلية الصاوي'}
              </h2>
            </div>

            {/* Top Dashed Divider */}
            <div className="text-center text-black overflow-hidden font-bold select-none text-xs tracking-tighter">
              ------------------------------------------------
            </div>

            {/* Date, Day, Pharmacist & Shift */}
            <div className="py-2 text-center text-black space-y-1">
              <div className="font-bold text-sm">
                {shiftDateStr} - {shiftDayStr}
              </div>
              <div className="font-bold text-sm">
                د. {shift.pharmacistName} | {shiftTypeName}
              </div>
            </div>

            {/* Dashed Divider */}
            <div className="text-center text-black overflow-hidden font-bold select-none text-xs tracking-tighter">
              ------------------------------------------------
            </div>

            {/* Expenses Header */}
            <div className="text-center font-bold text-sm py-2">
              المصروفات
            </div>

            {/* Numbered Rows */}
            {receiptRows.length === 0 ? (
              <div className="py-2 text-center text-xs text-gray-500 italic">
                لا توجد مصروفات
              </div>
            ) : (
              <div className="py-1 space-y-1.5 text-xs font-bold">
                {receiptRows.map((item, idx) => (
                  <div key={item.id || idx} className="grid grid-cols-12 items-center">
                    <span className="col-span-2 text-right">{idx + 1}</span>
                    <span className="col-span-6 text-center truncate">{item.title}</span>
                    <span className="col-span-4 text-left font-black">{numberFormatter(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Dashed Divider */}
            <div className="text-center text-black overflow-hidden font-bold select-none text-xs tracking-tighter pt-2">
              ------------------------------------------------
            </div>

            {/* Summary Lines */}
            <div className="py-2.5 space-y-1.5 text-sm font-bold">
              <div className="flex justify-between items-center">
                <span>المصروفات</span>
                <span className="font-black text-base">{numberFormatter(totalDeductions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>المتروك</span>
                <span className="font-black text-base">{numberFormatter(leftInDrawer)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>للخزينة</span>
                <span className="font-black text-base">{numberFormatter(transferredToVault)}</span>
              </div>
            </div>

            {/* Double Solid Line Separator */}
            <div className="border-t-2 border-b-2 border-black my-1 py-0.5"></div>

            {/* Gross Shift Sales */}
            <div className="py-2 flex justify-between items-center text-base font-black">
              <span>المبيعات</span>
              <span className="text-xl tracking-tight font-black">{numberFormatter(totalSales)}</span>
            </div>

            {/* Bottom Dashed Divider */}
            <div className="text-center text-black overflow-hidden font-bold select-none text-xs tracking-tighter">
              ------------------------------------------------
            </div>

            {/* Timestamp Footer */}
            <div className="text-center text-xs font-bold pt-2.5 text-black">
              {formatReceiptTimestamp()}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الريسيت (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
