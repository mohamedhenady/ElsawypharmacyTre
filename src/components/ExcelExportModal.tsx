import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTreasury } from '../context/TreasuryContext';
import {
  FileSpreadsheet,
  Download,
  X,
  Check,
  Calendar,
  Layers,
  Settings2,
  TrendingUp,
  Truck,
  Receipt,
  Wallet,
  UserCheck,
  Users,
  Briefcase,
  Database,
  FileText,
  Sparkles,
  CheckSquare,
  Square,
  ShieldCheck,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExcelExportOptions,
  ExcelExportSheetSelection,
  ExcelPeriodScope,
  exportTreasuryToExcel
} from '../utils/excelExport';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSheetKey?: keyof ExcelExportSheetSelection;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  defaultSheetKey
}) => {
  const {
    pharmacyProfile,
    periods,
    currentPeriod,
    incomeRecords,
    suppliers,
    supplierPayments,
    expenseCategories,
    expenses,
    walletTransactions,
    parties,
    personalLedgers,
    customers,
    customerDebts,
    employees,
    employeeAdvances,
    getPeriodSummary
  } = useTreasury();

  // Period scope state
  const [periodScope, setPeriodScope] = useState<ExcelPeriodScope>('current');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(currentPeriod.id);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Selected sheets state
  const [sheets, setSheets] = useState<ExcelExportSheetSelection>({
    summary: true,
    income: true,
    suppliers: true,
    expenses: true,
    wallet: true,
    personal: true,
    customers: true,
    employees: true,
    masterData: true
  });

  // Formatting options
  const [includeHeaderMetadata, setIncludeHeaderMetadata] = useState<boolean>(true);
  const [includeSubtotals, setIncludeSubtotals] = useState<boolean>(true);
  const [verifiedOnlySuppliers, setVerifiedOnlySuppliers] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessInfo, setExportSuccessInfo] = useState<{
    fileName: string;
    sheetsCount: number;
    recordsCount: number;
  } | null>(null);

  // When opened with a defaultSheetKey, focus on that or keep all enabled
  React.useEffect(() => {
    if (isOpen && defaultSheetKey) {
      // Optional: keep everything active or emphasize default
    }
  }, [isOpen, defaultSheetKey]);

  // Toggle all sheets
  const handleSelectAll = (select: boolean) => {
    setSheets({
      summary: select,
      income: select,
      suppliers: select,
      expenses: select,
      wallet: select,
      personal: select,
      customers: select,
      employees: select,
      masterData: select
    });
  };

  // Preset filters
  const applyPreset = (preset: 'core' | 'receivables' | 'all') => {
    if (preset === 'all') {
      handleSelectAll(true);
    } else if (preset === 'core') {
      setSheets({
        summary: true,
        income: true,
        suppliers: true,
        expenses: true,
        wallet: false,
        personal: false,
        customers: false,
        employees: false,
        masterData: false
      });
    } else if (preset === 'receivables') {
      setSheets({
        summary: false,
        income: false,
        suppliers: false,
        expenses: false,
        wallet: true,
        personal: true,
        customers: true,
        employees: true,
        masterData: false
      });
    }
  };

  const selectedSheetsCount = Object.values(sheets).filter(Boolean).length;

  // Compute estimated records count based on scope
  const estimatedRecords = useMemo(() => {
    const filterItem = (item: { periodId: string; date?: string }) => {
      if (periodScope === 'current') return item.periodId === currentPeriod.id;
      if (periodScope === 'selected') return item.periodId === selectedPeriodId;
      if (periodScope === 'custom_range') {
        if (!item.date) return true;
        if (dateFrom && item.date < dateFrom) return false;
        if (dateTo && item.date > dateTo) return false;
        return true;
      }
      return true;
    };

    let count = 0;
    if (sheets.income) count += incomeRecords.filter(filterItem).length;
    if (sheets.suppliers) {
      let sups = supplierPayments.filter(filterItem);
      if (verifiedOnlySuppliers) sups = sups.filter(s => s.verified);
      count += sups.length;
    }
    if (sheets.expenses) count += expenses.filter(filterItem).length;
    if (sheets.wallet) count += walletTransactions.filter(filterItem).length;
    if (sheets.personal) count += personalLedgers.filter(filterItem).length;
    if (sheets.customers) count += customerDebts.filter(filterItem).length;
    if (sheets.employees) count += employeeAdvances.filter(filterItem).length;
    if (sheets.masterData) count += (suppliers.length + customers.length + employees.length);
    return count;
  }, [
    periodScope,
    selectedPeriodId,
    dateFrom,
    dateTo,
    sheets,
    verifiedOnlySuppliers,
    incomeRecords,
    supplierPayments,
    expenses,
    walletTransactions,
    personalLedgers,
    customerDebts,
    employeeAdvances,
    suppliers,
    customers,
    employees,
    currentPeriod.id
  ]);

  // Execute export
  const handleRunExport = () => {
    if (selectedSheetsCount === 0) {
      alert('يرجى تحديد شيت واحد على الأقل للتصدير');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExcelExportOptions = {
        periodScope,
        selectedPeriodId: periodScope === 'selected' ? selectedPeriodId : undefined,
        dateFrom: periodScope === 'custom_range' ? dateFrom : undefined,
        dateTo: periodScope === 'custom_range' ? dateTo : undefined,
        selectedSheets: sheets,
        includeHeaderMetadata,
        includeSubtotals,
        verifiedOnlySuppliers,
        customFileName: customFileName.trim() || undefined
      };

      const result = exportTreasuryToExcel(
        {
          pharmacyProfile,
          periods,
          currentPeriod,
          incomeRecords,
          suppliers,
          supplierPayments,
          expenseCategories,
          expenses,
          walletTransactions,
          parties,
          personalLedgers,
          customers,
          customerDebts,
          employees,
          employeeAdvances,
          getPeriodSummary
        },
        options
      );

      setExportSuccessInfo(result);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}

      setTimeout(() => {
        setIsExporting(false);
      }, 600);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير ملف الإكسيل. يرجى المحاولة مرة أخرى.');
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-display">تخصيص تصدير جداول Excel</h2>
                <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  .xlsx منسق
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                تصدير كافة الحسابات والبيانات في شيتات منفصلة ومنسقة بدقة واحترافية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* SUCCESS NOTIFICATION BANNER */}
          {exportSuccessInfo && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-900">تم تجهيز وتنزيل ملف الإكسيل بنجاح!</div>
                  <div className="text-emerald-700 mt-0.5 font-mono-num">
                    الملف: <strong>{exportSuccessInfo.fileName}</strong> ({exportSuccessInfo.sheetsCount} شيتات مفصلة • {exportSuccessInfo.recordsCount} حركة مسجلة)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExportSuccessInfo(null)}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-bold"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* 1. PERIOD & SCOPE SELECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>1. نطاق الفترة والحسابات المراد تصديرها:</span>
              </label>
              <span className="text-[11px] text-slate-500">الدورة الحالية: {currentPeriod.name}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'current', label: 'الشهر الحالي فقط', desc: currentPeriod.name },
                { id: 'all', label: 'كافة الشهور والدورات', desc: `${periods.length} فترات مسجلة` },
                { id: 'selected', label: 'شهر محدد مخصص', desc: 'اختيار من القائمة' },
                { id: 'custom_range', label: 'نطاق تواريخ مخصص', desc: 'من تاريخ إلى تاريخ' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPeriodScope(opt.id as ExcelPeriodScope)}
                  className={`p-3 rounded-2xl text-right border transition-all cursor-pointer flex flex-col justify-between ${
                    periodScope === opt.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* Sub-inputs when 'selected' or 'custom_range' */}
            {periodScope === 'selected' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 animate-in fade-in">
                <span className="text-xs font-bold text-slate-700 shrink-0">اختر الدورة المالية:</span>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                >
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isClosed ? '(مقفلة)' : '(جارية)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodScope === 'custom_range' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">من تاريخ:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. SHEETS SELECTION & PRESETS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>2. تحديد الشيتات والأقسام المراد تصديرها ({selectedSheetsCount} من 9):</span>
              </label>

              {/* Presets */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('core')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  الماليات الأساسية
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('receivables')}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  الذمم والمحافظ
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>

            {/* Sheets Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Sheet 1: Summary */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.summary
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.summary}
                  onChange={(e) => setSheets(prev => ({ ...prev, summary: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الملخص والتسوية</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">معادلة الخزانة وجرد الكاش</div>
                </div>
              </label>

              {/* Sheet 2: Income */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.income
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.income}
                  onChange={(e) => setSheets(prev => ({ ...prev, income: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تسليمات الورديات</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">الدخل والشفتات الصباحي/المسائي</div>
                </div>
              </label>

              {/* Sheet 3: Suppliers */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.suppliers
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.suppliers}
                  onChange={(e) => setSheets(prev => ({ ...prev, suppliers: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>سداد شركات الأدوية</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">سندات وفواتير المخازن</div>
                </div>
              </label>

              {/* Sheet 4: Expenses */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.expenses
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.expenses}
                  onChange={(e) => setSheets(prev => ({ ...prev, expenses: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    <span>المصروفات والنثريات</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">الإيجار، الكهرباء والتشغيل</div>
                </div>
              </label>

              {/* Sheet 5: Digital Wallet */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.wallet
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.wallet}
                  onChange={(e) => setSheets(prev => ({ ...prev, wallet: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-purple-600" />
                    <span>المحافظ وإنستاباي</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">فودافون كاش، إنستا، بنك</div>
                </div>
              </label>

              {/* Sheet 6: Partners */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.personal
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.personal}
                  onChange={(e) => setSheets(prev => ({ ...prev, personal: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>مسحوبات الشركاء</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">حسابات الإدارة والمسؤولين</div>
                </div>
              </label>

              {/* Sheet 7: Customer Debts */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.customers
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.customers}
                  onChange={(e) => setSheets(prev => ({ ...prev, customers: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>ديون وشكك العملاء</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">أجل العملاء والسداد</div>
                </div>
              </label>

              {/* Sheet 8: Employee Advances */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.employees
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.employees}
                  onChange={(e) => setSheets(prev => ({ ...prev, employees: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                    <span>سلف الموظفين</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">سلف الصيادلة والمستقطعات</div>
                </div>
              </label>

              {/* Sheet 9: Master Data */}
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  sheets.masterData
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={sheets.masterData}
                  onChange={(e) => setSheets(prev => ({ ...prev, masterData: e.target.checked }))}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-600" />
                    <span>دليل الحسابات والجهات</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">دليل الموردين، العملاء، والبيانات</div>
                </div>
              </label>

            </div>
          </div>

          {/* 3. FORMATTING & ADVANCED PREFERENCES */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              <span>3. خيارات التنسيق والبيانات المتقدمة:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeaderMetadata}
                  onChange={(e) => setIncludeHeaderMetadata(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">تضمين ترويسة وبيانات الصيدلية الرسمية والتاريخ</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSubtotals}
                  onChange={(e) => setIncludeSubtotals(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">تضمين صفوف الإجماليات وملخصات البنود في كل شيت</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnlySuppliers}
                  onChange={(e) => setVerifiedOnlySuppliers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">تصدير فواتير الشركات المتحقق منها ومراجعتها فقط</span>
              </label>
            </div>

            {/* Custom file name input */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                تسمية ملف الإكسيل (اختياري - يترك فارغاً للتسمية التلقائية):
              </label>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder={`تقرير_خزينة_${pharmacyProfile.name}_${currentPeriod.name}`}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* ESTIMATED SUMMARY BOX */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                سيتم تصدير <strong>{selectedSheetsCount}</strong> شيتات مفصلة، بإجمالي تقديري <strong>{estimatedRecords}</strong> عملية وسجل محاسبي.
              </span>
            </div>
            <div className="text-[11px] font-bold text-emerald-700 shrink-0">
              الصيغة: Microsoft Excel (.xlsx) جاهز للطباعة والتحليل
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isExporting || selectedSheetsCount === 0}
              onClick={handleRunExport}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'جاري إنشاء ملف Excel...' : 'تصدير وتحميل ملف Excel الآن'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
