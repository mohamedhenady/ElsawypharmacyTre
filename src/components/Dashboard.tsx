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
  ArrowDownLeft,
  ArrowUpRight,
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
  ArrowRightLeft,
  MessageSquare,
  Smartphone,
  Share2,
  CalendarCheck2,
  Building2,
  ShieldCheck,
  RotateCcw,
  BadgePercent,
  PlusCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Scale,
  Equal,
  Minus,
  Plus,
  Activity,
  Layers,
  HelpCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickEntry: () => void;
  onOpenPrintReport: () => void;
  onOpenWhatsAppSummary?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenQuickEntry,
  onOpenPrintReport,
  onOpenWhatsAppSummary
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

  // Trend calculations (% change)
  const calcTrend = (currentVal: number, prevVal: number | undefined) => {
    if (prevVal === undefined || prevVal === 0) {
      return { pct: 0, direction: 'neutral' as const, isPositiveGrowth: true };
    }
    const diff = currentVal - prevVal;
    const pct = Math.round((Math.abs(diff) / prevVal) * 100);
    const direction = diff > 0 ? ('up' as const) : diff < 0 ? ('down' as const) : ('neutral' as const);
    return { pct, direction, isPositiveGrowth: diff >= 0 };
  };

  const incomeTrend = useMemo(() => calcTrend(summary.totalIncome, prevSummary?.totalIncome), [summary.totalIncome, prevSummary]);
  const supplierTrend = useMemo(() => calcTrend(summary.totalSupplierPayments, prevSummary?.totalSupplierPayments), [summary.totalSupplierPayments, prevSummary]);
  const expenseTrend = useMemo(() => calcTrend(summary.totalExpenses, prevSummary?.totalExpenses), [summary.totalExpenses, prevSummary]);
  const netTreasuryTrend = useMemo(() => calcTrend(summary.netTreasury, prevSummary?.netTreasury), [summary.netTreasury, prevSummary]);
  const expectedCashTrend = useMemo(() => calcTrend(summary.expectedCash, prevSummary?.expectedCash), [summary.expectedCash, prevSummary]);

  // Calculate denominations total
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
    if (confirm(`هل أنت متأكد من إقفال شهر ${currentPeriod.name} برصيد نقدي فعلي ${formatCurrency(cash, pharmacyProfile.currency)}؟`)) {
      closePeriod(currentPeriod.id, cash);
    }
  };

  const handleReopenMonth = () => {
    if (confirm(`هل تريد إعادة فتح شهر ${currentPeriod.name} للتعديل والتدقيق؟`)) {
      reopenPeriod(currentPeriod.id);
    }
  };

  // Get primary partner name
  const primaryParty = parties[0]?.name || 'د. حبيب';

  // Category expense breakdown for current period
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
      
      {/* 🏛️ EXECUTIVE TREASURY HEADER & APOTHECARY COMMAND BAR */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 relative"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Title & Status */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                  خزانة وميزانية {currentPeriod.name}
                </h1>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  currentPeriod.isClosed
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentPeriod.isClosed ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>{currentPeriod.isClosed ? 'شهر مقفل ومعتمد' : 'دورة جارية ومفتوحة'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
              title="معادلة التسوية"
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>معادلة التسوية</span>
              {showFormulaDetails ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>

            {onOpenWhatsAppSummary && (
              <button
                id="btn-dashboard-whatsapp"
                onClick={onOpenWhatsAppSummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
                title="إرسال ملخص واتساب"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>إشعار WhatsApp</span>
              </button>
            )}

            <button
              onClick={onOpenPrintReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
              title="طباعة الكشف"
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-slate-400" />
              <span>طباعة</span>
            </button>

            {currentPeriod.isClosed ? (
              <button
                onClick={handleReopenMonth}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>إعادة فتح</span>
              </button>
            ) : (
              <button
                onClick={handleCloseMonth}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>إقفال الشهر</span>
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
              className="mt-6 pt-6 border-t border-slate-800/90 text-xs text-slate-300 bg-slate-900/90 p-5 sm:p-6 rounded-2xl space-y-4 overflow-hidden"
            >
              <div className="font-black text-emerald-400 text-sm flex items-center gap-2 font-display">
                <Calculator className="w-4 h-4" />
                <span>المنظومة المحاسبية المعيارية لتسوية خزانة الصيدلية:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 leading-relaxed">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-emerald-300 font-bold mb-1.5 flex items-center justify-between">
                    <span>1. حساب صافي الخزانة (Net Treasury):</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">الرصيد الدفتري</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">صافي الخزانة = (إجمالي التسليمات - سداد الموردين - المصروفات) + الرصيد المرحل من الشهر السابق</div>
                  <div className="text-emerald-400 font-mono-num text-xs mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span>({formatNumber(summary.totalIncome)} - {formatNumber(summary.totalSupplierPayments)} - {formatNumber(summary.totalExpenses)}) + {formatNumber(summary.carriedOverBalance)} =</span>
                    <strong className="text-white text-sm">
                      <AnimatedCounter value={summary.netTreasury} /> {pharmacyProfile.currency}
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-blue-300 font-bold mb-1.5 flex items-center justify-between">
                    <span>2. حساب النقدي المتوقع بالدرج (Expected Cash):</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">هدف الجرد الحقيقي</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">النقدي المتوقع = صافي الخزانة - (رصيد المحفظة + مسحوبات الشركاء + ديون العملاء + سلف الموظفين)</div>
                  <div className="text-blue-400 font-mono-num text-xs mt-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span>{formatNumber(summary.netTreasury)} - ({formatNumber(summary.walletNetBalance)} + {formatNumber(summary.responsiblePersonNet)} + {formatNumber(summary.customerDebtsNet)} + {formatNumber(summary.employeeAdvancesNet)}) =</span>
                    <strong className="text-white text-sm">
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">The Treasury Equation</span>
            <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
              <Scale className="w-5 h-5 text-slate-700" />
              <span>معادلة صافي الخزانة وتدفقات الدورة المحاسبية</span>
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span>انقر على أي بطاقة لعرض السجل التفصيلي</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-bold">مؤشرات الاتجاه مقارنة بالشهر السابق</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Inflow */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('income')}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">إجمالي التسليمات (الدخل)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
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
              <div className="mt-2 flex items-center gap-1.5">
                {incomeTrend.direction === 'up' ? (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ArrowUp className="w-3 h-3 text-emerald-600" />
                    +{incomeTrend.pct}% عن الشهر السابق
                  </span>
                ) : incomeTrend.direction === 'down' ? (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                    <ArrowDown className="w-3 h-3 text-rose-600" />
                    -{incomeTrend.pct}% عن الشهر السابق
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    مستقر مع بداية الشهر
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-mono-num font-bold">
              <span className="text-emerald-800 bg-emerald-50/90 px-2.5 py-1 rounded-lg">
                صباحي: {formatNumber(summary.totalMorningIncome)}
              </span>
              <span className="text-blue-800 bg-blue-50/90 px-2.5 py-1 rounded-lg">
                مسائي: {formatNumber(summary.totalEveningIncome)}
              </span>
            </div>
          </motion.div>

          {/* Card 2: Supplier Outflow */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('suppliers')}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">سداد شركات الأدوية</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
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
              <div className="mt-2 flex items-center gap-1.5">
                {supplierTrend.direction === 'up' ? (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    <ArrowUp className="w-3 h-3 text-blue-600" />
                    +{supplierTrend.pct}% سداد للشركات
                  </span>
                ) : supplierTrend.direction === 'down' ? (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ArrowDown className="w-3 h-3 text-emerald-600" />
                    -{supplierTrend.pct}% مسددات أقل
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    دورة سداد منتظمة
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">شركات ومخازن الأدوية</span>
              <span className="text-blue-700 font-bold group-hover:translate-x-[-2px] transition-transform">سجل السداد ←</span>
            </div>
          </motion.div>

          {/* Card 3: Expenses Outflow */}
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('expenses')}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">المصروفات والنثريات</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
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
              <div className="mt-2 flex items-center gap-1.5">
                {expenseTrend.direction === 'up' ? (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    <ArrowUp className="w-3 h-3 text-amber-600" />
                    +{expenseTrend.pct}% في المصروفات
                  </span>
                ) : expenseTrend.direction === 'down' ? (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ArrowDown className="w-3 h-3 text-emerald-600" />
                    -{expenseTrend.pct}% توفير تشغيلي
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    ضمن الميزانية المعتادة
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">إيجار، كهرباء، ونثريات</span>
              <span className="text-amber-700 font-bold group-hover:translate-x-[-2px] transition-transform">بنود الصرف ←</span>
            </div>
          </motion.div>

          {/* Card 4: Net Treasury */}
          <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-md shadow-emerald-950/20 border border-emerald-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-200 uppercase tracking-wide">صافي الخزانة (المحسوب)</span>
                <span className="text-[10px] px-2.5 py-0.5 bg-emerald-950 text-emerald-300 rounded-full font-bold border border-emerald-700/60 shadow-xs">
                  دفتري
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono-num tracking-tight">
                  <AnimatedCounter value={summary.netTreasury} />
                  <span className="text-xs font-normal text-emerald-300 mr-1.5">{pharmacyProfile.currency}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[11px] text-emerald-300/90 font-medium flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  رصيد دورة الشهر الحالية
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-emerald-200">
              <span>المرحّل من الشهر السابق:</span>
              <span className="font-mono-num font-black text-white">{formatCurrency(summary.carriedOverBalance, pharmacyProfile.currency)}</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 🧭 LIQUIDITY CHANNELS & RECEIVABLES BREAKDOWN ("تتبع مسار السيولة") */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Liquidity Distribution</span>
            <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-700" />
              <span>توزيع السيولة النقدية والذمم المالية (أين تتوزع أموال الصيدلية؟)</span>
            </h3>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
            مجموع الذمم + الكاش المتوقع = <span className="font-mono-num font-black text-emerald-800"><AnimatedCounter value={summary.netTreasury} /> {pharmacyProfile.currency}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Channel 1: Digital Wallet / InstaPay */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('wallet')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
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
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-emerald-700">وارد: {formatNumber(summary.walletIn)}</span>
              <span className="text-rose-700">صادر: {formatNumber(summary.walletOut)}</span>
            </div>
          </motion.div>

          {/* Channel 2: Partner Accounts / Dr. Habib */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('personal')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
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
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-slate-600">مسحوب: {formatNumber(summary.responsiblePersonDebit)}</span>
              <span className="text-emerald-700">مودع: {formatNumber(summary.responsiblePersonCredit)}</span>
            </div>
          </motion.div>

          {/* Channel 3: Customer Receivables */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('customers')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
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
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-rose-700">جديد: {formatNumber(summary.customerDebtsDebit)}</span>
              <span className="text-emerald-700">مسدد: {formatNumber(summary.customerDebtsCredit)}</span>
            </div>
          </motion.div>

          {/* Channel 4: Employee Advances */}
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveTab('employees')}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
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
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-mono-num font-bold">
              <span className="text-rose-700">مسحوب: {formatNumber(summary.employeeAdvancesWithdrawn)}</span>
              <span className="text-emerald-700">مردود: {formatNumber(summary.employeeAdvancesReturned)}</span>
            </div>
          </motion.div>

          {/* Channel 5: Expected Cash in Drawer */}
          <motion.div 
            whileHover={{ y: -2, transition: { duration: 0.1 } }}
            className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-700" />
                  النقدي المتوقع بالدرج
                </span>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-200 text-emerald-950 rounded-full font-black">
                  هدف الجرد
                </span>
              </div>
              <div className="mt-3 text-xl font-black text-emerald-950 font-mono-num">
                <AnimatedCounter value={summary.expectedCash} />
                <span className="text-[11px] font-normal text-emerald-800 mr-1">{pharmacyProfile.currency}</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200 text-[10px] text-emerald-900 font-bold">
              المفترض وجوده كاش بالدرج الآن
            </div>
          </motion.div>

        </div>
      </div>

      {/* ⚖️ THE CASH COUNT & RECONCILIATION COMMAND SUITE (جرد الدرج الفعلي والتسوية الحية) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Physical Cash Verification</span>
            <h3 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              <span>جرد النقدية الفعلي ومطابقة الخزينة الحية</span>
            </h3>
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
          
          {/* Left / Input Section (Col 7) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label htmlFor="actual-cash-input" className="block text-xs font-bold text-slate-700">
                أدخل إجمالي المبلغ النقدي الفعلي المعدود بالدرج:
              </label>

              <form onSubmit={handleSaveActualCash} className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <div className="relative flex-1">
                  <input
                    id="actual-cash-input"
                    type="number"
                    step="any"
                    value={actualInput}
                    onChange={(e) => setActualInput(e.target.value)}
                    placeholder="مثال: 12500"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none text-xl font-black font-mono-num text-slate-900 bg-slate-50 focus:bg-white transition-all shadow-2xs"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 font-mono-num">
                    {pharmacyProfile.currency}
                  </span>
                </div>
                
                <button
                  type="submit"
                  id="btn-save-actual-cash"
                  className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-98"
                >
                  حفظ وتحديث المطابقة
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
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 overflow-hidden shadow-inner"
                >
                  <div className="text-xs font-black text-slate-800">حاسبة عد فئات النقدية السريعة:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {[200, 100, 50, 20, 10, 5, 1].map(denom => (
                      <div key={denom} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
                        <div className="text-xs font-black text-slate-800 mb-1">{denom} {pharmacyProfile.currency}</div>
                        <input
                          type="number"
                          min="0"
                          value={denominations[denom] || ''}
                          onChange={(e) => {
                            const c = parseInt(e.target.value) || 0;
                            setDenominations(prev => ({ ...prev, [denom]: c }));
                          }}
                          placeholder="0"
                          className="w-full text-center px-1 py-1 rounded-lg border border-slate-300 text-xs font-black font-mono-num focus:border-emerald-500 focus:outline-none"
                        />
                        <div className="text-[10px] text-slate-500 mt-1 font-mono-num font-bold">
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
                      className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                    >
                      اعتماد الإجمالي كنقدي فعلي
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              💡 <strong>قاعدة المحاسبة:</strong> الفارق = (النقدي الفعلي المعدود) - (النقدي المتوقع بالدرج). التطابق التام يعني دقة السجلات وانعدام العجز أو التداخل النقدي.
            </div>
          </div>

          {/* Right / Status Result Card (Col 5) */}
          <div className="lg:col-span-5">
            <motion.div
              layout
              className={`h-full p-6 sm:p-7 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                summary.status === 'balanced'
                  ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-md shadow-emerald-900/10'
                  : summary.status === 'surplus'
                  ? 'bg-blue-50/90 border-blue-500 text-blue-950 shadow-md shadow-blue-900/10'
                  : summary.status === 'deficit'
                  ? 'bg-rose-50/90 border-rose-500 text-rose-950 shadow-md shadow-rose-900/10'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wide">
                    {summary.status === 'balanced'
                      ? 'حالة التسوية: متطابق تماماً 🎯'
                      : summary.status === 'surplus'
                      ? 'حالة التسوية: يوجد زيادة نقدية بالدرج 📈'
                      : summary.status === 'deficit'
                      ? 'حالة التسوية: يوجد عجز في الخزينة ⚠️'
                      : 'حالة التسوية: بانتظار العد'}
                  </span>
                  {summary.status === 'balanced' && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 animate-pulse" />
                  )}
                  {summary.status === 'surplus' && (
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  )}
                  {summary.status === 'deficit' && (
                    <AlertOctagon className="w-6 h-6 text-rose-600" />
                  )}
                </div>

                <div className="text-3xl sm:text-4xl font-black font-mono-num tracking-tight mt-3">
                  {summary.status === 'balanced' ? (
                    '0.00 ' + pharmacyProfile.currency
                  ) : summary.difference > 0 ? (
                    `+${formatCurrency(summary.difference, pharmacyProfile.currency)}`
                  ) : (
                    `-${formatCurrency(Math.abs(summary.difference), pharmacyProfile.currency)}`
                  )}
                </div>

                <p className="text-xs mt-3 font-semibold leading-relaxed">
                  {summary.status === 'balanced' ? (
                    'الكاش الفعلي في الدرج يتطابق بدقة 100% مع النقدي المتوقع حسابياً.'
                  ) : summary.status === 'surplus' ? (
                    'المبلغ الفعلي أكبر من المتوقع بالدرج بمقدار الزيادة الموضحة أعلاه.'
                  ) : summary.status === 'deficit' ? (
                    'تنبيه محاسبي: الكاش الفعلي أقل من المتوقع. يرجى مراجعة تسليمات الشفتات وسداد الموردين والسلف.'
                  ) : (
                    'يرجى إدخال النقدي الفعلي لحساب الفارق واعتماد التسوية.'
                  )}
                </p>
              </div>

              {onOpenWhatsAppSummary && (
                <button
                  type="button"
                  onClick={onOpenWhatsAppSummary}
                  className="mt-5 w-full py-3 px-4 rounded-xl bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-900/15 active:scale-98"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <span>إرسال تقرير التسوية لواتساب الإدارة</span>
                </button>
              )}
            </motion.div>
          </div>

        </div>
      </div>

      {/* 📊 OPERATIONAL BREAKDOWNS & SHIFT ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Shift Handovers Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 font-display">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>حركة تسليم الشفتات والورديات (صباحي / مسائي)</span>
              </h4>
              <button
                onClick={() => setActiveTab('income')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                تسليم شفت جديد +
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100/90 shadow-2xs">
                <div className="text-xs text-emerald-900 font-bold flex items-center justify-between">
                  <span>الشفت الصباحي</span>
                  <span className="text-[10px] font-mono-num font-bold bg-emerald-200/70 px-1.5 py-0.5 rounded">({morningIncomePct}%)</span>
                </div>
                <div className="text-xl font-black text-emerald-950 font-mono-num mt-2">
                  <AnimatedCounter value={summary.totalMorningIncome} />
                  <span className="text-[10px] font-normal text-emerald-800 mr-1">{pharmacyProfile.currency}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/90 shadow-2xs">
                <div className="text-xs text-blue-900 font-bold flex items-center justify-between">
                  <span>الشفت المسائي</span>
                  <span className="text-[10px] font-mono-num font-bold bg-blue-200/70 px-1.5 py-0.5 rounded">({eveningIncomePct}%)</span>
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
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="h-full bg-emerald-600 transition-all duration-700"
                  style={{ width: `${morningIncomePct}%` }}
                  title={`الصباحي: ${morningIncomePct}%`}
                />
                <div
                  className="h-full bg-blue-600 transition-all duration-700"
                  style={{ width: `${eveningIncomePct}%` }}
                  title={`المسائي: ${eveningIncomePct}%`}
                />
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 leading-relaxed shadow-2xs">
            💡 <strong>توصية الجرد اليومي:</strong> تسجيل كاش كل شفت فور تسليم الوردية ومطابقته مع إجمالي فواتير نقطة البيع لضمان دقة كشف نهاية الشهر.
          </div>
        </div>

        {/* Expenses by Category Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 font-display">
                <Receipt className="w-4 h-4 text-amber-700" />
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
              <div className="space-y-3.5">
                {categoryTotals.slice(0, 5).map(cat => {
                  const pct = summary.totalExpenses > 0 ? Math.round((cat.total / summary.totalExpenses) * 100) : 0;
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num font-black text-slate-900">{formatCurrency(cat.total, pharmacyProfile.currency)}</span>
                          <span className="text-[10px] text-slate-400 font-mono-num font-bold">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-amber-600 rounded-full transition-all duration-700"
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
            <span className="font-mono-num font-black text-amber-950 text-sm">
              <AnimatedCounter value={summary.totalExpenses} /> {pharmacyProfile.currency}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
