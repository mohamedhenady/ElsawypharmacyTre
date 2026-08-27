import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
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
  CheckCircle,
  AlertOctagon,
  Calculator,
  Lock,
  Unlock,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRightLeft,
  CalendarCheck2
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenQuickEntry: () => void;
  onOpenPrintReport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenQuickEntry,
  onOpenPrintReport
}) => {
  const {
    pharmacyProfile,
    currentPeriod,
    summary,
    updatePeriod,
    closePeriod,
    reopenPeriod,
    expenseCategories,
    expenses,
    incomeRecords,
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
      alert('يرجى إدخال رقم صحيح');
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
    if (confirm(`هل أنت متأكد من إقفال شهر ${currentPeriod.name} برصيد فعلي قدره ${formatCurrency(cash, pharmacyProfile.currency)}؟`)) {
      closePeriod(currentPeriod.id, cash);
    }
  };

  const handleReopenMonth = () => {
    if (confirm(`هل تريد إعادة فتح شهر ${currentPeriod.name} للتعديل؟`)) {
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner / Period Header */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                لوحة التسوية المحاسبية
              </span>
              <span className="text-xs text-slate-400">
                {currentPeriod.isClosed ? 'شهر مقفل ومعتمد' : 'شهر مفتوح للعمليات'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
              تقرير خزانة شهر {currentPeriod.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              نظام مطابقة الخزانة النقدية مع حركات الدخل، سداد الموردين، المصروفات، المحافظ الرقمية، حسابات الشركاء، ديون العملاء وسلف الموظفين.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-emerald-400" />
              <span>معادلة التسوية</span>
              {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {currentPeriod.isClosed ? (
              <button
                onClick={handleReopenMonth}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>إعادة فتح الشهر</span>
              </button>
            ) : (
              <button
                onClick={handleCloseMonth}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>إقفال واعتماد الشهر</span>
              </button>
            )}

            <button
              onClick={onOpenPrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4 text-slate-300" />
              <span>طباعة كشف الخزانة</span>
            </button>
          </div>
        </div>

        {/* Formula Explainer Drawer (Collapsible) */}
        {showFormulaDetails && (
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl space-y-2">
            <div className="font-bold text-emerald-400 text-sm">منطق تسوية الخزانة الصيدلانية:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 font-mono-num leading-relaxed">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-sans font-semibold mb-1">1. حساب صافي الخزانة:</div>
                <div className="text-white">صافي الخزانة = (إجمالي التسليمات - سداد الموردين - المصروفات) + الرصيد المرحل من الشهر السابق</div>
                <div className="text-emerald-400 mt-1">
                  ({formatNumber(summary.totalIncome)} - {formatNumber(summary.totalSupplierPayments)} - {formatNumber(summary.totalExpenses)}) + {formatNumber(summary.carriedOverBalance)} = <strong className="text-white">{formatNumber(summary.netTreasury)} {pharmacyProfile.currency}</strong>
                </div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-sans font-semibold mb-1">2. حساب النقدي المتوقع بالدرج (فين الفلوس):</div>
                <div className="text-white">النقدي المتوقع = صافي الخزانة - (رصيد المحفظة + رصيد الشركاء + ديون العملاء + سلف الموظفين)</div>
                <div className="text-emerald-400 mt-1">
                  {formatNumber(summary.netTreasury)} - ({formatNumber(summary.walletNetBalance)} + {formatNumber(summary.responsiblePersonNet)} + {formatNumber(summary.customerDebtsNet)} + {formatNumber(summary.employeeAdvancesNet)}) = <strong className="text-white">{formatNumber(summary.expectedCash)} {pharmacyProfile.currency}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income Card */}
        <div
          onClick={() => setActiveTab('income')}
          className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">إجمالي التسليمات (الدخل)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono-num tracking-tight">
              {formatCurrency(summary.totalIncome, pharmacyProfile.currency)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                صباحي: {formatNumber(summary.totalMorningIncome)}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium">
                مسائي: {formatNumber(summary.totalEveningIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Payments Card */}
        <div
          onClick={() => setActiveTab('suppliers')}
          className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">سداد الموردين والشركات</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono-num tracking-tight">
              {formatCurrency(summary.totalSupplierPayments, pharmacyProfile.currency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
              <span>مدفوعات شركات الأدوية</span>
              <span className="text-blue-600 font-medium">عرض التفاصيل ←</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div
          onClick={() => setActiveTab('expenses')}
          className="bg-white rounded-xl p-5 border border-slate-200 hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">إجمالي المصروفات والنثريات</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono-num tracking-tight">
              {formatCurrency(summary.totalExpenses, pharmacyProfile.currency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
              <span>نظافة، بوفيه، إيجارات، فواتير</span>
              <span className="text-amber-600 font-medium">عرض البنود ←</span>
            </div>
          </div>
        </div>

        {/* Net Treasury (صافي الخزانة) */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">صافي الخزانة (المحسوب)</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950/40 text-emerald-200 rounded-full font-semibold">
              شامل المرحّل
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono-num tracking-tight">
              {formatCurrency(summary.netTreasury, pharmacyProfile.currency)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-emerald-100">
              <span>المرحّل من الشهر السابق:</span>
              <span className="font-bold">{formatCurrency(summary.carriedOverBalance, pharmacyProfile.currency)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: WHERE IS THE MONEY? (فين الفلوس؟) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <span>توزيع السيولة النقدية (فين الفلوس؟)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              توزيع صافي الخزانة ({formatCurrency(summary.netTreasury, pharmacyProfile.currency)}) على المحافظ، الديون، السلف، والنقدي المتوقع.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            إجمالي العناصر = صافي الخزانة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* 1. Wallet & InstaPay */}
          <div
            onClick={() => setActiveTab('wallet')}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-white transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-purple-600" />
                المحفظة وانستاباي
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-purple-600">تفاصيل</span>
            </div>
            <div className="mt-2.5 text-xl font-bold text-slate-900 font-mono-num">
              {formatCurrency(summary.walletNetBalance, pharmacyProfile.currency)}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
              <span className="text-emerald-700 font-medium">داخل: {formatNumber(summary.walletIn)}</span>
              <span className="text-rose-700 font-medium">خارج: {formatNumber(summary.walletOut)}</span>
            </div>
          </div>

          {/* 2. Responsible Person / Dr. Habib */}
          <div
            onClick={() => setActiveTab('personal')}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-white transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                حساب {primaryParty}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-blue-600">تفاصيل</span>
            </div>
            <div className="mt-2.5 text-xl font-bold text-slate-900 font-mono-num">
              {formatCurrency(summary.responsiblePersonNet, pharmacyProfile.currency)}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
              <span>مدين: {formatNumber(summary.responsiblePersonDebit)}</span>
              <span>دائن: {formatNumber(summary.responsiblePersonCredit)}</span>
            </div>
          </div>

          {/* 3. Customer Debts */}
          <div
            onClick={() => setActiveTab('customers')}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-white transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                ديون العملاء (صافي)
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-amber-600">تفاصيل</span>
            </div>
            <div className="mt-2.5 text-xl font-bold text-slate-900 font-mono-num">
              {formatCurrency(summary.customerDebtsNet, pharmacyProfile.currency)}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
              <span>جديد: {formatNumber(summary.customerDebtsDebit)}</span>
              <span>مسدد: {formatNumber(summary.customerDebtsCredit)}</span>
            </div>
          </div>

          {/* 4. Employee Advances */}
          <div
            onClick={() => setActiveTab('employees')}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-white transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-teal-600" />
                سلف الموظفين (صافي)
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-teal-600">تفاصيل</span>
            </div>
            <div className="mt-2.5 text-xl font-bold text-slate-900 font-mono-num">
              {formatCurrency(summary.employeeAdvancesNet, pharmacyProfile.currency)}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
              <span>مسحوب: {formatNumber(summary.employeeAdvancesWithdrawn)}</span>
              <span>مردود: {formatNumber(summary.employeeAdvancesReturned)}</span>
            </div>
          </div>

          {/* 5. Expected Cash in Drawer */}
          <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-700" />
                النقدي المتوقع بالدرج
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold">
                هدف التسوية
              </span>
            </div>
            <div className="mt-2.5 text-xl font-black text-emerald-950 font-mono-num">
              {formatCurrency(summary.expectedCash, pharmacyProfile.currency)}
            </div>
            <div className="mt-1.5 text-[10px] text-emerald-800 font-medium truncate">
              المفروض يكون كاش فعلي
            </div>
          </div>

        </div>
      </div>

      {/* SECTION: CASH COUNT & RECONCILIATION RESULT (عجز / زيادة / تطابق) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Actual Cash Input Box */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="actual-cash-input" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-700" />
                <span>النقدي الفعلي المعدود (كاش الدرج):</span>
              </label>
              <button
                type="button"
                onClick={() => setShowDenominations(!showDenominations)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                {showDenominations ? 'إخفاء حاسبة الفئات النقدية' : 'حاسبة فئات النقدية (200, 100, 50...)'}
              </button>
            </div>

            <form onSubmit={handleSaveActualCash} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="actual-cash-input"
                  type="number"
                  step="any"
                  value={actualInput}
                  onChange={(e) => setActualInput(e.target.value)}
                  placeholder="أدخل المبلغ بعد عد كاش الدرج..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:outline-none text-lg font-bold font-mono-num text-slate-900"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {pharmacyProfile.currency}
                </span>
              </div>
              <button
                type="submit"
                id="btn-save-actual-cash"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                تحديث المطابقة
              </button>
            </form>

            {/* Denominations Counter Box */}
            {showDenominations && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2">حاسبة عد الفئات الورقية والنقدية:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[200, 100, 50, 20, 10, 5, 1].map(denom => (
                    <div key={denom} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <div className="text-xs font-bold text-slate-800 mb-1">{denom} {pharmacyProfile.currency}</div>
                      <input
                        type="number"
                        min="0"
                        value={denominations[denom] || ''}
                        onChange={(e) => {
                          const c = parseInt(e.target.value) || 0;
                          setDenominations(prev => ({ ...prev, [denom]: c }));
                        }}
                        placeholder="عدد"
                        className="w-full text-center px-1 py-1 rounded border border-slate-300 text-xs font-bold font-mono-num"
                      />
                      <div className="text-[10px] text-slate-500 mt-1 font-mono-num">
                        ={formatNumber((denominations[denom] || 0) * denom)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-800">
                    إجمالي الفئات: <span className="font-mono-num text-sm text-emerald-700">{formatCurrency(denomTotal, pharmacyProfile.currency)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyDenominations}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    اعتماد الإجمالي كنقدي فعلي
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reconciliation Result Callout */}
          <div className="w-full lg:w-96">
            <div
              className={`p-5 rounded-2xl border-2 transition-all ${
                summary.status === 'balanced'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  : summary.status === 'surplus'
                  ? 'bg-blue-50 border-blue-500 text-blue-950'
                  : summary.status === 'deficit'
                  ? 'bg-rose-50 border-rose-500 text-rose-950 animate-pulse'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">
                  {summary.status === 'balanced'
                    ? 'حالة التسوية: متطابق تماماً'
                    : summary.status === 'surplus'
                    ? 'حالة التسوية: يوجد زيادة بالدرج'
                    : summary.status === 'deficit'
                    ? 'حالة التسوية: يوجد عجز بالخزانة'
                    : 'حالة التسوية: بانتظار العد'}
                </span>
                {summary.status === 'balanced' && (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                )}
                {summary.status === 'surplus' && (
                  <Sparkles className="w-6 h-6 text-blue-600" />
                )}
                {summary.status === 'deficit' && (
                  <AlertOctagon className="w-6 h-6 text-rose-600" />
                )}
              </div>

              <div className="text-3xl font-black font-mono-num tracking-tight mt-2">
                {summary.status === 'balanced' ? (
                  '0.00 ' + pharmacyProfile.currency
                ) : summary.difference > 0 ? (
                  `+${formatCurrency(summary.difference, pharmacyProfile.currency)}`
                ) : (
                  `-${formatCurrency(Math.abs(summary.difference), pharmacyProfile.currency)}`
                )}
              </div>

              <div className="text-xs mt-2 font-medium">
                {summary.status === 'balanced' ? (
                  'الكاش الفعلي في الدرج يتطابق 100% مع النقدي المتوقع الحسابي.'
                ) : summary.status === 'surplus' ? (
                  'المبلغ المعدود أكبر من المتوقع بمقدار الزيادة الموضحة أعلاه.'
                ) : summary.status === 'deficit' ? (
                  'تنبيه فوري: الكاش الفعلي أقل من المتوقع! يرجى مراجعة تسليمات الشفتات وسداد الموردين والسلف.'
                ) : (
                  'يرجى إدخال النقدي الفعلي لحساب الفارق والتسوية.'
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Analytics & Quick Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Expenses Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>توزيع المصروفات حسب التصنيف (لهذا الشهر)</span>
            </h4>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
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
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-slate-900">{formatCurrency(cat.total, pharmacyProfile.currency)}</span>
                        <span className="text-[10px] text-slate-400 font-mono-num">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Shift Summary & Shift Delivery */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>حركة تسليم الشفتات اليومية</span>
              </h4>
              <button
                onClick={() => setActiveTab('income')}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                تسليم شفت جديد +
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-xs text-emerald-800 font-medium">إجمالي الشفت الصباحي</div>
                <div className="text-xl font-bold text-emerald-950 font-mono-num mt-1">
                  {formatCurrency(summary.totalMorningIncome, pharmacyProfile.currency)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="text-xs text-blue-800 font-medium">إجمالي الشفت المسائي</div>
                <div className="text-xl font-bold text-blue-950 font-mono-num mt-1">
                  {formatCurrency(summary.totalEveningIncome, pharmacyProfile.currency)}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-semibold text-slate-800 mb-1">تسجيلات الدخل الأخيرة:</div>
              {incomeRecords.filter(r => r.periodId === currentPeriod.id).slice(0, 3).map(rec => (
                <div key={rec.id} className="flex items-center justify-between py-1 border-b border-slate-200 last:border-0 text-[11px]">
                  <span>{rec.date} ({rec.shiftType === 'morning' ? 'صباحي' : 'مسائي'}) - {rec.cashierName || 'كاشير'}</span>
                  <span className="font-bold font-mono-num">{formatCurrency(rec.amount, pharmacyProfile.currency)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">تحتاج إضافة سداد مورد أو سلفة أو مصروف؟</span>
            <button
              onClick={onOpenQuickEntry}
              className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>إدخال سريع</span>
              <span>←</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
