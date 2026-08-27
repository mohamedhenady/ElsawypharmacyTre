import React, { useState, useMemo } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency, formatDateArabic, formatNumber } from '../utils/formatters';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Smartphone,
  Share2,
  Calendar,
  Layers,
  Sparkles,
  Building2,
  User,
  Clock,
  TrendingUp,
  Truck,
  Receipt,
  Coins,
  X,
  PhoneCall,
  Save,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({
  isOpen,
  onClose,
  defaultDate
}) => {
  const {
    pharmacyProfile,
    updatePharmacyProfile,
    currentPeriod,
    incomeRecords,
    supplierPayments,
    expenses,
    walletTransactions,
    customerDebts,
    employeeAdvances,
    suppliers,
    expenseCategories,
    currentUser,
    summary
  } = useTreasury();

  // Find latest date in records or today
  const latestDate = useMemo(() => {
    if (defaultDate) return defaultDate;
    const allDates = [
      ...incomeRecords.map(r => r.date),
      ...supplierPayments.map(r => r.date),
      ...expenses.map(r => r.date)
    ].sort();
    return allDates[allDates.length - 1] || new Date().toISOString().split('T')[0];
  }, [defaultDate, incomeRecords, supplierPayments, expenses]);

  const [selectedDate, setSelectedDate] = useState<string>(latestDate);
  const [reportType, setReportType] = useState<'daily' | 'shift' | 'monthly'>('daily');
  const [selectedShift, setSelectedShift] = useState<'all' | 'morning' | 'evening' | 'night'>('all');
  const [managerPhone, setManagerPhone] = useState<string>(
    pharmacyProfile.managerWhatsApp || pharmacyProfile.phone || '01012345678'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [savePhoneSuccess, setSavePhoneSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter records by selected date / period
  const dayIncome = incomeRecords.filter(r => r.date === selectedDate);
  const filteredIncome = reportType === 'shift' && selectedShift !== 'all'
    ? dayIncome.filter(r => r.shiftType === selectedShift)
    : dayIncome;

  const totalDayIncome = filteredIncome.reduce((sum, r) => sum + r.amount, 0);

  const dayPayments = supplierPayments.filter(r => r.date === selectedDate);
  const totalDayPayments = dayPayments.reduce((sum, r) => sum + r.amount, 0);

  const dayExpenses = expenses.filter(r => r.date === selectedDate);
  const totalDayExpenses = dayExpenses.reduce((sum, r) => sum + r.amount, 0);

  const dayWallet = walletTransactions.filter(r => r.date === selectedDate);
  const totalWalletIn = dayWallet.filter(w => w.type === 'cash_in' || w.type === 'instapay_in').reduce((s, w) => s + w.amount, 0);
  const totalWalletOut = dayWallet.filter(w => w.type === 'cash_out' || w.type === 'instapay_out').reduce((s, w) => s + w.amount, 0);

  const dayDebts = customerDebts.filter(d => d.date === selectedDate);
  const totalDebtsAdded = dayDebts.filter(d => d.type === 'debt_add').reduce((s, d) => s + d.amount, 0);
  const totalDebtsCollected = dayDebts.filter(d => d.type === 'debt_payment').reduce((s, d) => s + d.amount, 0);

  const dayAdvances = employeeAdvances.filter(a => a.date === selectedDate);
  const totalAdvances = dayAdvances.reduce((s, a) => s + a.amount, 0);

  const netDayCashFlow = totalDayIncome - (totalDayPayments + totalDayExpenses);

  // Generate WhatsApp Markdown Text
  const generateWhatsAppMessage = () => {
    const currency = pharmacyProfile.currency || 'ج.م';
    const dateFormatted = formatDateArabic(selectedDate);
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    let msg = `*🏥 ${pharmacyProfile.name}*\n`;
    msg += `*📊 ملخص مالي فوري - إشعار الإدارة*\n`;
    msg += `━━━━━━━━━━━━━━━━━━\n`;

    if (reportType === 'daily') {
      msg += `📅 *تاريخ اليوم:* ${dateFormatted}\n`;
      msg += `⏰ *وقت الإرسال:* ${nowTime}\n`;
      msg += `👤 *المسؤول المرسل:* ${currentUser.name} (${currentUser.role === 'manager' ? 'المدير' : currentUser.role === 'accountant' ? 'المحاسب' : 'الصيدلي'})\n\n`;

      msg += `*💰 إجمالي الدخل والمبيعات:* ${formatNumber(totalDayIncome)} ${currency}\n`;
      if (filteredIncome.length > 0) {
        filteredIncome.forEach(inc => {
          const shiftTitle = inc.shiftType === 'morning' ? 'صباحية' : inc.shiftType === 'evening' ? 'مسائية' : inc.shiftType === 'night' ? 'ليلية' : 'إضافية';
          msg += `   ▫️ وردية ${shiftTitle}: ${formatNumber(inc.amount)} ${currency} ${inc.cashierName ? `(${inc.cashierName})` : ''}\n`;
        });
      }

      msg += `\n*🚚 إجمالي سداد الشركات والموردين:* ${formatNumber(totalDayPayments)} ${currency}\n`;
      if (dayPayments.length > 0) {
        dayPayments.slice(0, 5).forEach(p => {
          const sup = suppliers.find(s => s.id === p.supplierId);
          msg += `   ▫️ ${sup ? sup.name : 'مورد'}: ${formatNumber(p.amount)} ${currency} ${p.notes ? `(${p.notes})` : ''}\n`;
        });
        if (dayPayments.length > 5) {
          msg += `   ▫️ _وعدد ${dayPayments.length - 5} سدادات أخرى..._\n`;
        }
      }

      msg += `\n*🧾 إجمالي المصروفات والنثريات:* ${formatNumber(totalDayExpenses)} ${currency}\n`;
      if (dayExpenses.length > 0) {
        dayExpenses.slice(0, 4).forEach(exp => {
          const cat = expenseCategories.find(c => c.id === exp.categoryId);
          msg += `   ▫️ ${cat ? cat.name : 'مصروف'}: ${formatNumber(exp.amount)} ${currency} - ${exp.description}\n`;
        });
      }

      if (totalDebtsCollected > 0 || totalDebtsAdded > 0 || totalAdvances > 0) {
        msg += `\n*👥 حركات أخرى:* \n`;
        if (totalDebtsCollected > 0) msg += `   ▫️ تحصيل ديون عملاء: ${formatNumber(totalDebtsCollected)} ${currency}\n`;
        if (totalDebtsAdded > 0) msg += `   ▫️ آجل وديون جديدة: ${formatNumber(totalDebtsAdded)} ${currency}\n`;
        if (totalAdvances > 0) msg += `   ▫️ سلف موظفين: ${formatNumber(totalAdvances)} ${currency}\n`;
      }

      msg += `\n━━━━━━━━━━━━━━━━━━\n`;
      msg += `*📈 صافي السيولة لليوم:* ${netDayCashFlow >= 0 ? '+' : ''}${formatNumber(netDayCashFlow)} ${currency}\n`;
      msg += `*🏦 رصيد الخزينة النهائي الحالي:* ${formatNumber(summary.expectedCash)} ${currency}\n`;
      if (currentPeriod.actualCashCounted !== undefined) {
        msg += `*💵 الفعلي الموجود بالدرج:* ${formatNumber(currentPeriod.actualCashCounted)} ${currency} (${summary.difference === 0 ? '✅ مطابق تماماً' : summary.difference > 0 ? `زيادة +${formatNumber(summary.difference)}` : `عجز ${formatNumber(summary.difference)}`})\n`;
      }

    } else if (reportType === 'shift') {
      const shiftName = selectedShift === 'morning' ? 'الصباحية' : selectedShift === 'evening' ? 'المسائية' : selectedShift === 'night' ? 'الليلية' : 'جميع الورديات';
      msg += `📅 *التاريخ:* ${dateFormatted}\n`;
      msg += `🌅 *الوردية:* ${shiftName}\n`;
      msg += `👤 *المسؤول:* ${currentUser.name}\n\n`;
      msg += `*💰 دخل الوردية:* ${formatNumber(totalDayIncome)} ${currency}\n`;
      msg += `*🚚 مدفوعات الموردين في الوردية:* ${formatNumber(totalDayPayments)} ${currency}\n`;
      msg += `*🧾 مصروفات الوردية:* ${formatNumber(totalDayExpenses)} ${currency}\n`;
      msg += `*💵 صافي نقدية الوردية المسلمة:* ${formatNumber(netDayCashFlow)} ${currency}\n`;

    } else {
      // Monthly summary
      msg += `📅 *تقرير الفترة المحاسبية:* ${currentPeriod.name}\n`;
      msg += `👤 *المسؤول:* ${currentUser.name}\n\n`;
      msg += `*💰 إجمالي دخل الشهر:* ${formatNumber(summary.totalIncome)} ${currency}\n`;
      msg += `*🚚 إجمالي المسدد للموردين:* ${formatNumber(summary.totalSupplierPayments)} ${currency}\n`;
      msg += `*🧾 إجمالي المصروفات والنثريات:* ${formatNumber(summary.totalExpenses)} ${currency}\n`;
      msg += `*💼 حساب الشركاء/المسحوبات:* ${formatNumber(summary.totalPersonal)} ${currency}\n`;
      msg += `*🏦 الرصيد الدفتري المتوقع للخزينة:* ${formatNumber(summary.expectedCash)} ${currency}\n`;
      if (currentPeriod.actualCashCounted !== undefined) {
        msg += `*💵 الرصيد الفعلي المعدود:* ${formatNumber(currentPeriod.actualCashCounted)} ${currency}\n`;
        msg += `*⚖️ حالة المطابقة:* ${summary.difference === 0 ? '✅ مطابقة 100%' : summary.difference > 0 ? `فائض +${formatNumber(summary.difference)}` : `عجز ${formatNumber(summary.difference)}`}\n`;
      }
    }

    msg += `\n_تم الإنشاء عبر منظومة خزانة الصيدلية الذكية_`;
    return msg;
  };

  const whatsappMessage = generateWhatsAppMessage();

  // Normalize phone number for wa.me link
  const getCleanPhone = (phone: string) => {
    let clean = phone.replace(/[^0-9+]/g, '');
    if (clean.startsWith('01') && clean.length === 11) {
      // Egyptian mobile number like 01012345678 -> 201012345678
      clean = '2' + clean;
    } else if (clean.startsWith('+')) {
      clean = clean.substring(1);
    }
    return clean;
  };

  const handleSendWhatsApp = (isWeb = false) => {
    const cleanNumber = getCleanPhone(managerPhone);
    const encodedText = encodeURIComponent(whatsappMessage);
    const url = isWeb
      ? `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`
      : `https://wa.me/${cleanNumber}?text=${encodedText}`;

    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = whatsappMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ملخص مالي - ${pharmacyProfile.name}`,
          text: whatsappMessage
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyText();
    }
  };

  const handleSavePhoneAsDefault = () => {
    if (!managerPhone.trim()) return;
    updatePharmacyProfile({ managerWhatsApp: managerPhone.trim() });
    setSavePhoneSuccess(true);
    setTimeout(() => setSavePhoneSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-100 border border-white/20 shadow-inner">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>إشعار ملخص مالي لواتساب الإدارة</span>
                <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  فوري
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90">
                إرسال تقرير الخزانة والدخل والمدفوعات بضغطة زر واحدة لهاتف المدير
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Filter & Configuration Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
            
            {/* Report Type Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">نوع الإشعار والملخص:</span>
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setReportType('daily')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportType === 'daily'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📅 ملخص يوم كامل
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('shift')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportType === 'shift'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌅 ملخص وردية
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('monthly')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reportType === 'monthly'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📊 إجمالي الشهر
                </button>
              </div>
            </div>

            {/* Date and Shift selection row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تاريخ اليوم المراد تلخيصه:</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {reportType === 'shift' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الوردية:</span>
                  </label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">جميع ورديات اليوم</option>
                    <option value="morning">الوردية الصباحية</option>
                    <option value="evening">الوردية المسائية</option>
                    <option value="night">الوردية الليلية</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>رقم واتساب الإدارة / المدير:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="tel"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSavePhoneAsDefault}
                      title="حفظ كرقم افتراضي"
                      className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                  {savePhoneSuccess && (
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                      ✓ تم حفظ الرقم الافتراضي بنجاح
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Real-time WhatsApp Message Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>معاينة الرسالة (شكل الإشعار في واتساب):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {whatsappMessage.length} حرف
              </span>
            </div>

            {/* WhatsApp Chat Bubble Mockup */}
            <div className="bg-[#e5ddd5] p-3 sm:p-4 rounded-2xl border border-slate-300 shadow-inner relative overflow-hidden">
              
              {/* WhatsApp background pattern feel */}
              <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-md border border-emerald-100 max-w-full text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-wrap selection:bg-emerald-200">
                {whatsappMessage}
              </div>

              <div className="mt-2 text-[10px] text-slate-500 text-left font-mono">
                ✓✓ تم التنسيق بصيغة WhatsApp Markdown
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] text-emerald-700 font-bold block mb-0.5">دخل اليوم</span>
              <span className="text-xs sm:text-sm font-black text-emerald-950 font-mono">
                {formatCurrency(totalDayIncome)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] text-blue-700 font-bold block mb-0.5">سداد الموردين</span>
              <span className="text-xs sm:text-sm font-black text-blue-950 font-mono">
                {formatCurrency(totalDayPayments)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[10px] text-rose-700 font-bold block mb-0.5">المصروفات</span>
              <span className="text-xs sm:text-sm font-black text-rose-950 font-mono">
                {formatCurrency(totalDayExpenses)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-700 font-bold block mb-0.5">رصيد الخزينة</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                {formatCurrency(summary.expectedCash)}
              </span>
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم نسخ الرسالة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>نسخ التقرير</span>
                </>
              )}
            </button>

            {/* Native Mobile Share Button if available */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="مشاركة عبر تطبيقات الهاتف"
              >
                <Share2 className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">مشاركة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp Web Button */}
            <button
              type="button"
              onClick={() => handleSendWhatsApp(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="فتح في WhatsApp Web للكمبيوتر"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span>WhatsApp Web</span>
            </button>

            {/* Direct Send via WhatsApp App */}
            <button
              type="button"
              onClick={() => handleSendWhatsApp(false)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-white" />
              <span>إرسال لواتساب الإدارة فوراً</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
