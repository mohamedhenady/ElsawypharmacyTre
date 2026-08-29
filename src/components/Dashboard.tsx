import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { AnimatedCounter } from './AnimatedCounter';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Truck,
  Receipt,
  Wallet,
  UserCheck,
  Users,
  Briefcase,
  Coins,
  CheckCircle2,
  AlertOctagon,
  Calculator,
  Lock,
  Unlock,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CalendarCheck2,
  ShieldCheck,
  Clock,
  ArrowUp,
  ArrowDown,
  Scale,
  MessageSquare,
  ArrowUpRight,
  FileSpreadsheet,
  Vault
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickEntry: () => void;
  onOpenPrintReport: () => void;
  onOpenWhatsAppSummary?: () => void;
  onOpenExcelExport?: () => void;
}

interface TrendInfo {
  pct: number;
  direction: 'up' | 'down' | 'neutral';
  isPositive: boolean;
  text: string;
}

const TrendBadge: React.FC<{ trend: TrendInfo; neutralLabel?: string }> = ({ trend, neutralLabel }) => {
  if (trend.direction === 'neutral') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
        <span>{neutralLabel || trend.text}</span>
      </span>
    );
  }

  const isPositive = trend.isPositive;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
        isPositive
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
      }`}
    >
      {trend.direction === 'up' ? (
        <ArrowUp className="w-3 h-3 shrink-0" />
      ) : (
        <ArrowDown className="w-3 h-3 shrink-0" />
      )}
      <span>{trend.text}</span>
    </span>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenQuickEntry,
  onOpenPrintReport,
  onOpenWhatsAppSummary,
  onOpenExcelExport
}) => {
  const {
    pharmacyProfile,
    currentPeriod,
    periods,
    summary,
    getPeriodSummary,
    updatePeriod,
    closePeriod,
    reopenPeriod,
    expenseCategories,
    expenses,
    parties
  } = useTreasury();

  const [actualInput, setActualInput] = useState<string>(
    currentPeriod.actualCashCounted !== undefined ? String(currentPeriod.actualCashCounted) : ''
  );
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0
  });

  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // Compute trend metrics comparing current period with previous period
  const previousPeriod = useMemo(() => {
    const currentIndex = periods.findIndex(p => p.id === currentPeriod.id);
    if (currentIndex > 0) {
      return periods[currentIndex - 1];
    }
    return null;
  }, [periods, currentPeriod.id]);

  const prevSummary = useMemo(() => {
    if (previousPeriod) {
      return getPeriodSummary(previousPeriod.id);
    }
    return null;
  }, [previousPeriod, getPeriodSummary]);

  // Comprehensive Trend calculation helper
  const calcTrend = (currentVal: number, prevVal: number | undefined, options?: { inverse?: boolean }): TrendInfo => {
    if (prevVal === undefined || prevVal === 0) {
      if (currentVal > 0) {
        return { pct: 100, direction: 'up', isPositive: !options?.inverse, text: 'جديد هذا الشهر' };
      }
      return { pct: 0, direction: 'neutral', isPositive: true, text: 'بداية الدورة' };
    }
    const diff = currentVal - prevVal;
    if (Math.abs(diff) < 0.01) {
      return { pct: 0, direction: 'neutral', isPositive: true, text: 'مستقر مع الشهر السابق' };
    }
    const pct = Math.round((Math.abs(diff) / Math.abs(prevVal)) * 100);
    const direction: 'up' | 'down' = diff > 0 ? 'up' : 'down';
    const isPositive = options?.inverse ? diff <= 0 : diff >= 0;
    const sign = diff > 0 ? '+' : '-';
    return {
      pct,
      direction,
      isPositive,
      text: `${sign}${pct}% عن الشهر السابق`
    };
  };

  // Trend indicators for all financial values
  const incomeTrend = useMemo(() => calcTrend(summary.totalIncome, prevSummary?.totalIncome), [summary.totalIncome, prevSummary]);
  const supplierTrend = useMemo(() => calcTrend(summary.totalSupplierPayments, prevSummary?.totalSupplierPayments), [summary.totalSupplierPayments, prevSummary]);
  const expenseTrend = useMemo(() => calcTrend(summary.totalExpenses, prevSummary?.totalExpenses, { inverse: true }), [summary.totalExpenses, prevSummary]);
  const netTreasuryTrend = useMemo(() => calcTrend(summary.netTreasury, prevSummary?.netTreasury), [summary.netTreasury, prevSummary]);
  const walletTrend = useMemo(() => calcTrend(summary.walletNetBalance, prevSummary?.walletNetBalance), [summary.walletNetBalance, prevSummary]);
  const partnerTrend = useMemo(() => calcTrend(summary.responsiblePersonNet, prevSummary?.responsiblePersonNet), [summary.responsiblePersonNet, prevSummary]);
  const customerTrend = useMemo(() => calcTrend(summary.customerDebtsNet, prevSummary?.customerDebtsNet, { inverse: true }), [summary.customerDebtsNet, prevSummary]);
  const employeeTrend = useMemo(() => calcTrend(summary.employeeAdvancesNet, prevSummary?.employeeAdvancesNet, { inverse: true }), [summary.employeeAdvancesNet, prevSummary]);
  const expectedCashTrend = useMemo(() => calcTrend(summary.expectedCash, prevSummary?.expectedCash), [summary.expectedCash, prevSummary]);

  // Denominations total calculation
  const denomTotal = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + (Number(denom) * (Number(count) || 0)),
    0
  );

  const handleApplyDenominations = () => {
    setActualInput(String(denomTotal));
    updatePeriod(currentPeriod.id, { actualCashCounted: denomTotal });
    if (Math.abs(denomTotal - summary.expectedCash) < 0.01) {
      triggerConfetti();
    }
  };

  const handleSaveActualCash = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(actualInput);
    if (isNaN(val)) {
      alert('يرجى إدخال مبلغ صحيح بالأرقام');
      return;
    }
    updatePeriod(currentPeriod.id, { actualCashCounted: val });
    if (Math.abs(val - summary.expectedCash) < 0.01) {
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const handleCloseMonth = () => {
    const cash = parseFloat(actualInput) || summary.actualCashCounted || 0;
    if (confirm(`هل أنت متأكد من إقفال دورة ${currentPeriod.name} برصيد نقدي فعلي ${formatCurrency(cash, pharmacyProfile.currency)}؟`)) {
      closePeriod(currentPeriod.id, cash);
    }
  };

  const handleReopenMonth = () => {
    if (confirm(`هل تريد إعادة فتح دورة ${currentPeriod.name} للتعديل والتدقيق؟`)) {
      reopenPeriod(currentPeriod.id);
    }
  };

  // Get primary partner name
  const primaryParty = parties[0]?.name || 'د. حبيب';

  // Category expense breakdown
  const periodExpenses = expenses.filter(e => e.periodId === currentPeriod.id);
  const categoryTotals = expenseCategories.map(cat => {
    const total = periodExpenses
      .filter(e => e.categoryId === cat.id)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Income proportions
  const totalIncomeCalc = summary.totalIncome || 1;
  const morningIncomePct = Math.round((summary.totalMorningIncome / totalIncomeCalc) * 100) || 0;
  const eveningIncomePct = Math.round((summary.totalEveningIncome / totalIncomeCalc) * 100) || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* 🏛️ MODERN EXECUTIVE HERO HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Title & Period Badge */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
                  خزانة وميزانية {currentPeriod.name}
                </h1>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  currentPeriod.isClosed
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${currentPeriod.isClosed ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>{currentPeriod.isClosed ? 'دورة مقفلة ومعتمدة' : 'دورة جارية ومفتوحة'}</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {pharmacyProfile.name} • متابعة التدفقات النقدية ومطابقة رصيد الدرج الحي
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('drawer')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="إدارة شفتات ودرج النقدية وإقفال الورديات"
            >
              <Vault className="w-3.5 h-3.5" />
              <span>درج النقدية والورديات</span>
            </button>

            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              title="معادلة التسوية"
            >
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>معادلة التسوية</span>
              {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {onOpenExcelExport && (
              <button
                id="btn-dashboard-excel-export"
                onClick={onOpenExcelExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                title="تخصيص وتصدير بيانات الحسابات Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>
            )}

            {onOpenWhatsAppSummary && (
              <button
                id="btn-dashboard-whatsapp"
                onClick={onOpenWhatsAppSummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                title="إرسال ملخص واتساب"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>إشعار WhatsApp</span>
              </button>
            )}

            <button
              onClick={onOpenPrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="طباعة الكشف"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة الكشف</span>
            </button>

            {currentPeriod.isClosed ? (
              <button
                onClick={handleReopenMonth}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>إعادة فتح</span>
              </button>
            ) : (
              <button
                onClick={handleCloseMonth}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>إقفال الدورة</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Formula Explainer Drawer */}
        <AnimatePresence>
          {showFormulaDetails && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-600 space-y-4 overflow-hidden"
            >
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2 font-display">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>المنظومة المحاسبية المعيارية لتسوية خزانة الصيدلية:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-emerald-800 font-bold mb-1.5 flex items-center justify-between">
                    <span>1. حساب صافي الخزانة (Net Treasury):</span>
                    <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold">الرصيد الدفتري</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">صافي الخزانة = (إجمالي التسليمات - سداد الموردين - المصروفات) + الرصيد المرحل من الشهر السابق</div>
                  <div className="text-emerald-800 font-mono-num text-xs mt-2 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 flex-wrap">
                    <span>({formatNumber(summary.totalIncome)} - {formatNumber(summary.totalSupplierPayments)} - {formatNumber(summary.totalExpenses)}) + {formatNumber(summary.carriedOverBalance)} =</span>
                    <strong className="text-slate-900 text-sm font-black">
                      <AnimatedCounter value={summary.netTreasury} /> {pharmacyProfile.currency}
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-blue-800 font-bold mb-1.5 flex items-center justify-between">
                    <span>2. حساب النقدي المتوقع بالدرج (Expected Cash):</span>
                    <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold">هدف الجرد الحقيقي</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">النقدي المتوقع = صافي الخزانة - (رصيد المحفظة + مسحوبات الشركاء + ديون العملاء + سلف الموظفين)</div>
                  <div className="text-blue-800 font-mono-num text-xs mt-2 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 flex-wrap">
                    <span>{formatNumber(summary.netTreasury)} - ({formatNumber(summary.walletNetBalance)} + {formatNumber(summary.responsiblePersonNet)} + {formatNumber(summary.customerDebtsNet)} + {formatNumber(summary.employeeAdvancesNet)}) =</span>
                    <strong className="text-slate-900 text-sm font-black">
                      <AnimatedCounter value={summary.expectedCash} /> {pharmacyProfile.currency}
                    </strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 📐 THE MASTER ACCOUNTING EQUATION RAIL WITH TREND INDICATORS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              <span>معادلة صافي الخزانة وتدفقات الدورة المحاسبية</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              التدفقات الرئيسية الداخلة والخارجة من خزانة الصيدلية خلال هذا الشهر
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span className="text-emerald-700 font-bold">مؤشرات اتجاه دقيقة مقارنة بالدورة السابقة</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Inflow */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('income')}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">إجمالي التسليمات (الدخل)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-num tracking-tight">
                  <AnimatedCounter value={summary.totalIncome} />
                  <span className="text-xs font-normal text-slate-500 mr-1.5">{pharmacyProfile.currency}</span>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="mt-2.5">
                <TrendBadge trend={incomeTrend} />
              </div>
            </div>
            
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-mono-num font-bold">
              <span className="text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                صباحي: {formatNumber(summary.totalMorningIncome)}
              </span>
              <span className="text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg">
                مسائي: {formatNumber(summary.totalEveningIncome)}
              </span>
            </div>
          </motion.div>

          {/* Card 2: Supplier Outflow */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('suppliers')}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">سداد شركات الأدوية</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-num tracking-tight">
                  <AnimatedCounter value={summary.totalSupplierPayments} />
                  <span className="text-xs font-normal text-slate-500 mr-1.5">{pharmacyProfile.currency}</span>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="mt-2.5">
                <TrendBadge trend={supplierTrend} />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">شركات ومخازن الأدوية</span>
              <span className="text-blue-700 font-bold group-hover:translate-x-[-2px] transition-transform">سجل السداد ←</span>
            </div>
          </motion.div>

          {/* Card 3: Expenses Outflow */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('expenses')}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-amber-500 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">المصروفات والنثريات</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-num tracking-tight">
                  <AnimatedCounter value={summary.totalExpenses} />
                  <span className="text-xs font-normal text-slate-500 mr-1.5">{pharmacyProfile.currency}</span>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="mt-2.5">
                <TrendBadge trend={expenseTrend} />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">إيجار، كهرباء، ونثريات</span>
              <span className="text-amber-700 font-bold group-hover:translate-x-[-2px] transition-transform">بنود الصرف ←</span>
            </div>
          </motion.div>

          {/* Card 4: Net Treasury */}
          <motion.div 
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 border-2 border-emerald-300 text-slate-900 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">صافي الخزانة (المحسوب)</span>
                <span className="text-[10px] px-2.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full font-bold border border-emerald-300">
                  دفتري
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono-num tracking-tight">
                  <AnimatedCounter value={summary.netTreasury} />
                  <span className="text-xs font-normal text-emerald-800 mr-1.5">{pharmacyProfile.currency}</span>
                </div>
              </div>

              <div className="mt-2.5">
                <TrendBadge trend={netTreasuryTrend} />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-emerald-900">
              <span>المرحّل من الشهر السابق:</span>
              <span className="font-mono-num font-bold text-emerald-950">{formatCurrency(summary.carriedOverBalance, pharmacyProfile.currency)}</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 🧭 LIQUIDITY CHANNELS & RECEIVABLES BREAKDOWN WITH TREND INDICATORS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <span>توزيع السيولة النقدية والذمم المالية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              مسار أموال الصيدلية الموزعة بين المحافظ الإلكترونية، الشركاء، والعملاء
            </p>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 shrink-0">
            مجموع الذمم + الكاش المتوقع = <span className="font-mono-num font-black text-emerald-800"><AnimatedCounter value={summary.netTreasury} /> {pharmacyProfile.currency}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Channel 1: Digital Wallet / InstaPay */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('wallet')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-purple-600" />
                  المحفظة وإنستاباي
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-purple-700 font-bold">كشف</span>
              </div>
              <div className="mt-3 text-xl font-black text-slate-900 font-mono-num">
                <AnimatedCounter value={summary.walletNetBalance} />
                <span className="text-[11px] font-normal text-slate-500 mr-1">{pharmacyProfile.currency}</span>
              </div>
              <div className="mt-2">
                <TrendBadge trend={walletTrend} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-emerald-700">وارد: {formatNumber(summary.walletIn)}</span>
              <span className="text-rose-700">صادر: {formatNumber(summary.walletOut)}</span>
            </div>
          </motion.div>

          {/* Channel 2: Partner Accounts / Dr. Habib */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('personal')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  حساب {primaryParty}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-700 font-bold">كشف</span>
              </div>
              <div className="mt-3 text-xl font-black text-slate-900 font-mono-num">
                <AnimatedCounter value={summary.responsiblePersonNet} />
                <span className="text-[11px] font-normal text-slate-500 mr-1">{pharmacyProfile.currency}</span>
              </div>
              <div className="mt-2">
                <TrendBadge trend={partnerTrend} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-slate-600">مسحوب: {formatNumber(summary.responsiblePersonDebit)}</span>
              <span className="text-emerald-700">مودع: {formatNumber(summary.responsiblePersonCredit)}</span>
            </div>
          </motion.div>

          {/* Channel 3: Customer Receivables */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('customers')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" />
                  ديون وشكك العملاء
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-amber-700 font-bold">كشف</span>
              </div>
              <div className="mt-3 text-xl font-black text-slate-900 font-mono-num">
                <AnimatedCounter value={summary.customerDebtsNet} />
                <span className="text-[11px] font-normal text-slate-500 mr-1">{pharmacyProfile.currency}</span>
              </div>
              <div className="mt-2">
                <TrendBadge trend={customerTrend} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-rose-700">جديد: {formatNumber(summary.customerDebtsDebit)}</span>
              <span className="text-emerald-700">مسدد: {formatNumber(summary.customerDebtsCredit)}</span>
            </div>
          </motion.div>

          {/* Channel 4: Employee Advances */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('employees')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  سلف الموظفين والصيادلة
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-teal-700 font-bold">كشف</span>
              </div>
              <div className="mt-3 text-xl font-black text-slate-900 font-mono-num">
                <AnimatedCounter value={summary.employeeAdvancesNet} />
                <span className="text-[11px] font-normal text-slate-500 mr-1">{pharmacyProfile.currency}</span>
              </div>
              <div className="mt-2">
                <TrendBadge trend={employeeTrend} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-rose-700">مسحوب: {formatNumber(summary.employeeAdvancesWithdrawn)}</span>
              <span className="text-emerald-700">مردود: {formatNumber(summary.employeeAdvancesReturned)}</span>
            </div>
          </motion.div>

          {/* Channel 5: Expected Cash in Drawer */}
          <motion.div 
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-700" />
                  النقدي المتوقع بالدرج
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-200 text-emerald-950 rounded-full font-bold">
                  هدف الجرد
                </span>
              </div>
              <div className="mt-3 text-xl font-black text-emerald-950 font-mono-num">
                <AnimatedCounter value={summary.expectedCash} />
                <span className="text-[11px] font-normal text-emerald-800 mr-1">{pharmacyProfile.currency}</span>
              </div>
              <div className="mt-2">
                <TrendBadge trend={expectedCashTrend} />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200 text-[10px] text-emerald-900 font-bold">
              المفترض وجوده كاش بالدرج الآن
            </div>
          </motion.div>

        </div>
      </div>

      {/* ⚖️ SIMPLIFIED & ELEGANT CASH RECONCILIATION SUITE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>جرد النقدية الفعلي ومطابقة الخزينة الحية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              أدخل المبلغ الفعلي الموجود في الدرج لحساب الفارق والتأكد من عدم وجود عجز
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDenominations(!showDenominations)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer transition-colors"
          >
            {showDenominations ? 'إخفاء حاسبة الفئات النقدية' : 'حاسبة فئات النقدية (200، 100، 50...)'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Input Section */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label htmlFor="actual-cash-input" className="block text-xs font-bold text-slate-700">
                المبلغ النقدي الفعلي المعدود بالدرج:
              </label>

              <form onSubmit={handleSaveActualCash} className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="actual-cash-input"
                    type="number"
                    step="any"
                    value={actualInput}
                    onChange={(e) => setActualInput(e.target.value)}
                    placeholder="أدخل المبلغ الفعلي"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:outline-hidden text-xl font-black font-mono-num text-slate-900 bg-slate-50 focus:bg-white transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono-num">
                    {pharmacyProfile.currency}
                  </span>
                </div>
                
                <button
                  type="submit"
                  id="btn-save-actual-cash"
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  حفظ ومطابقة
                </button>
              </form>
            </div>

            {/* Denominations matrix */}
            <AnimatePresence>
              {showDenominations && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 overflow-hidden"
                >
                  <div className="text-xs font-bold text-slate-800">حاسبة عد فئات النقدية السريعة:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {[200, 100, 50, 20, 10, 5, 1].map(denom => (
                      <div key={denom} className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                        <div className="text-xs font-bold text-slate-700 mb-1">{denom} {pharmacyProfile.currency}</div>
                        <input
                          type="number"
                          min="0"
                          value={denominations[denom] || ''}
                          onChange={(e) => {
                            const c = parseInt(e.target.value) || 0;
                            setDenominations(prev => ({ ...prev, [denom]: c }));
                          }}
                          placeholder="0"
                          className="w-full text-center px-1 py-1 rounded-lg border border-slate-200 text-xs font-bold font-mono-num focus:border-emerald-500 focus:outline-hidden"
                        />
                        <div className="text-[10px] text-slate-400 mt-1 font-mono-num font-bold">
                          ={formatNumber((denominations[denom] || 0) * denom)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-800">
                      إجمالي الفئات: <span className="font-mono-num font-black text-sm text-emerald-800">{formatCurrency(denomTotal, pharmacyProfile.currency)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyDenominations}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      اعتماد الإجمالي كنقدي فعلي
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              💡 <strong>قاعدة المحاسبة:</strong> الفارق = (النقدي الفعلي المعدود بالدرج) - (النقدي المتوقع حسابياً). التطابق يعني انعدام العجز ودقة السجلات.
            </div>
          </div>

          {/* Simplified Status Result Card */}
          <div className="lg:col-span-5">
            <motion.div
              layout
              className={`h-full p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                summary.status === 'balanced'
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : summary.status === 'surplus'
                  ? 'bg-blue-50/70 border-blue-300 text-blue-950'
                  : summary.status === 'deficit'
                  ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold tracking-wide">
                    {summary.status === 'balanced'
                      ? 'حالة التسوية: متطابق تماماً'
                      : summary.status === 'surplus'
                      ? 'حالة التسوية: زيادة نقدية بالدرج'
                      : summary.status === 'deficit'
                      ? 'حالة التسوية: عجز في الخزينة'
                      : 'بانتظار إدخال العد الفعلي'}
                  </span>
                  {summary.status === 'balanced' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {summary.status === 'surplus' && (
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  )}
                  {summary.status === 'deficit' && (
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                  )}
                </div>

                <div className="text-2xl sm:text-3xl font-black font-mono-num tracking-tight mt-2">
                  {summary.status === 'balanced' ? (
                    '0.00 ' + pharmacyProfile.currency
                  ) : summary.difference > 0 ? (
                    `+${formatCurrency(summary.difference, pharmacyProfile.currency)}`
                  ) : (
                    `-${formatCurrency(Math.abs(summary.difference), pharmacyProfile.currency)}`
                  )}
                </div>

                <p className="text-xs mt-2.5 font-medium leading-relaxed opacity-90">
                  {summary.status === 'balanced' ? (
                    'الكاش الفعلي في الدرج يتطابق بدقة مع النقدي المتوقع دفترياً.'
                  ) : summary.status === 'surplus' ? (
                    'المبلغ الفعلي أكبر من المتوقع بالدرج بمقدار الزيادة الموضحة أعلاه.'
                  ) : summary.status === 'deficit' ? (
                    'تنبيه: الكاش الفعلي أقل من المتوقع. يرجى مراجعة تسليمات الشفتات وسداد الموردين.'
                  ) : (
                    'يرجى إدخال النقدي الفعلي لحساب الفارق واعتماد التسوية.'
                  )}
                </p>
              </div>

              {onOpenWhatsAppSummary && (
                <button
                  type="button"
                  onClick={onOpenWhatsAppSummary}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>إرسال تقرير التسوية إلى WhatsApp</span>
                </button>
              )}
            </motion.div>
          </div>

        </div>
      </div>

      {/* 📊 OPERATIONAL BREAKDOWNS & SHIFT ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Shift Handovers Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>تسليم الورديات والشفتات (صباحي / مسائي)</span>
              </h4>
              <button
                onClick={() => setActiveTab('income')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                تسليم شفت جديد +
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-xs text-emerald-900 font-bold flex items-center justify-between">
                  <span>الشفت الصباحي</span>
                  <span className="text-[10px] font-mono-num font-bold bg-emerald-200/60 px-1.5 py-0.5 rounded">({morningIncomePct}%)</span>
                </div>
                <div className="text-xl font-black text-emerald-950 font-mono-num mt-2">
                  <AnimatedCounter value={summary.totalMorningIncome} />
                  <span className="text-[10px] font-normal text-emerald-800 mr-1">{pharmacyProfile.currency}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <div className="text-xs text-blue-900 font-bold flex items-center justify-between">
                  <span>الشفت المسائي</span>
                  <span className="text-[10px] font-mono-num font-bold bg-blue-200/60 px-1.5 py-0.5 rounded">({eveningIncomePct}%)</span>
                </div>
                <div className="text-xl font-black text-blue-950 font-mono-num mt-2">
                  <AnimatedCounter value={summary.totalEveningIncome} />
                  <span className="text-[10px] font-normal text-blue-800 mr-1">{pharmacyProfile.currency}</span>
                </div>
              </div>
            </div>

            {/* Visual Shift Proportion Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>نسبة تسليمات الشفتات:</span>
                <span className="font-mono-num font-bold text-slate-700">إجمالي الدخل: {formatCurrency(summary.totalIncome, pharmacyProfile.currency)}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${morningIncomePct}%` }}
                  title={`الصباحي: ${morningIncomePct}%`}
                />
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${eveningIncomePct}%` }}
                  title={`المسائي: ${eveningIncomePct}%`}
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
            💡 <strong>توصية:</strong> تسجيل كاش كل شفت فور تسليم الوردية ومطابقته مع إجمالي فواتير نقطة البيع لضمان دقة كشف نهاية الشهر.
          </div>
        </div>

        {/* Expenses by Category Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-display">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>توزيع المصروفات التشغيلية والنثريات</span>
              </h4>
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                عرض الكل ({periodExpenses.length} حركة)
              </button>
            </div>

            {categoryTotals.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                لا توجد مصروفات مسجلة لهذا الشهر حتى الآن.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryTotals.slice(0, 5).map(cat => {
                  const pct = summary.totalExpenses > 0 ? Math.round((cat.total / summary.totalExpenses) * 100) : 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num font-black text-slate-900">{formatCurrency(cat.total, pharmacyProfile.currency)}</span>
                          <span className="text-[10px] text-slate-400 font-mono-num font-bold">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">إجمالي المصروفات المنصرفة:</span>
            <span className="font-mono-num font-black text-slate-900 text-sm">
              <AnimatedCounter value={summary.totalExpenses} /> {pharmacyProfile.currency}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
