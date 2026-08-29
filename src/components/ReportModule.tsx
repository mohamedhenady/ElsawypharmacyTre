import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency, formatDateArabic } from '../utils/formatters';
import { 
  FileText, 
  Building, 
  MessageSquare, 
  FileSpreadsheet, 
  Smartphone, 
  CreditCard, 
  Users, 
  Briefcase, 
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Edit3,
  Vault,
  Coins,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { WhatsAppSummaryModal } from './WhatsAppSummaryModal';
import { ExcelExportModal } from './ExcelExportModal';
import { ExpenseDistributionChart } from './ExpenseDistributionChart';

interface ReportModuleProps {
  onOpenWhatsAppSummary?: () => void;
  onOpenExcelExport?: () => void;
}

export const ReportModule: React.FC<ReportModuleProps> = ({ onOpenWhatsAppSummary, onOpenExcelExport }) => {
  const [isLocalWhatsAppOpen, setIsLocalWhatsAppOpen] = useState(false);
  const [isLocalExcelOpen, setIsLocalExcelOpen] = useState(false);
  const [showDetailedTables, setShowDetailedTables] = useState(true);
  const [isEditCarriedOverOpen, setIsEditCarriedOverOpen] = useState(false);

  const {
    pharmacyProfile,
    currentPeriod,
    incomeRecords,
    supplierPayments,
    expenses,
    expenseCategories,
    walletTransactions,
    personalLedgers,
    customerDebts,
    employeeAdvances,
    drawerShifts,
    suppliers,
    parties,
    customers,
    employees,
    updatePeriod,
    getPeriodSummary
  } = useTreasury();

  const [carriedOverInput, setCarriedOverInput] = useState<string>(
    currentPeriod.customCarriedOver !== undefined ? String(currentPeriod.customCarriedOver) : ''
  );

  const handleSaveCarriedOver = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(carriedOverInput);
    if (!isNaN(val)) {
      updatePeriod(currentPeriod.id, { customCarriedOver: val });
    } else {
      updatePeriod(currentPeriod.id, { customCarriedOver: undefined });
    }
    setIsEditCarriedOverOpen(false);
  };

  const handleResetCarriedOverToAuto = () => {
    updatePeriod(currentPeriod.id, { customCarriedOver: undefined });
    setCarriedOverInput('');
    setIsEditCarriedOverOpen(false);
  };

  const summary = getPeriodSummary(currentPeriod.id);

  const periodIncome = incomeRecords.filter(r => r.periodId === currentPeriod.id);
  const periodSuppliers = supplierPayments.filter(r => r.periodId === currentPeriod.id);
  const periodExpenses = expenses.filter(r => r.periodId === currentPeriod.id);
  const periodWallet = walletTransactions.filter(r => r.periodId === currentPeriod.id);
  const periodPersonal = personalLedgers.filter(r => r.periodId === currentPeriod.id);
  const periodCustomerDebts = customerDebts.filter(r => r.periodId === currentPeriod.id);
  const periodAdvances = employeeAdvances.filter(r => r.periodId === currentPeriod.id);

  // Income channel breakdowns
  const cashIncome = periodIncome.reduce((sum, r) => sum + (Number(r.cashAmount) || 0), 0);
  const vodafoneIncome = periodIncome.reduce((sum, r) => sum + (Number(r.vodafoneCash) || 0), 0);
  const instapayIncome = periodIncome.reduce((sum, r) => sum + (Number(r.instaPay) || 0), 0);

  // Supplier payment method breakdown
  const suppliersCash = periodSuppliers.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const suppliersWallet = periodSuppliers.filter(s => s.paymentMethod === 'wallet').reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const suppliersInstapay = periodSuppliers.filter(s => s.paymentMethod === 'instapay').reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            التقرير المالي والميزان الختامي للشهر
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تقرير شامل ومفصل (تفصيلياً وإجمالياً) ومجهز للطباعة أو الحفظ كـ PDF لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDetailedTables(!showDetailedTables)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="تبديل عرض الجداول التفصيلية للحركات"
          >
            {showDetailedTables ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showDetailedTables ? 'إخفاء الجداول التفصيلية' : 'عرض الجداول التفصيلية'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenExcelExport) onOpenExcelExport();
              else setIsLocalExcelOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
            title="تخصيص وتصدير بيانات الحسابات Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>تصدير إكسيل Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenWhatsAppSummary) onOpenWhatsAppSummary();
              else setIsLocalWhatsAppOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>إرسال لواتساب الإدارة</span>
          </button>

          <PreparePrintButton
            label="تجهيز للطباعة / حفظ PDF"
            title="التقرير المالي والميزان الختامي للشهر"
            subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
            summaryStats={[
              { label: 'إجمالي دخل الشفتات', value: formatCurrency(summary.totalIncome, pharmacyProfile.currency) },
              { label: 'إجمالي مسددات الشركات', value: formatCurrency(summary.totalSupplierPayments, pharmacyProfile.currency) },
              { label: 'إجمالي المصروفات', value: formatCurrency(summary.totalExpenses, pharmacyProfile.currency) },
              { label: 'صافي الخزانة (المحسوب)', value: formatCurrency(summary.netTreasury, pharmacyProfile.currency) }
            ]}
          />
        </div>
      </div>

      <WhatsAppSummaryModal
        isOpen={isLocalWhatsAppOpen}
        onClose={() => setIsLocalWhatsAppOpen(false)}
      />

      <ExcelExportModal
        isOpen={isLocalExcelOpen}
        onClose={() => setIsLocalExcelOpen(false)}
      />

      {/* PRINTABLE REPORT CONTAINER */}
      <div className="printable-report bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Pharmacy Official Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6">
          <div className="flex items-center gap-4">
            {pharmacyProfile.logoUrl ? (
              <img
                src={pharmacyProfile.logoUrl}
                alt={pharmacyProfile.name}
                className="w-16 h-16 rounded-xl object-contain border border-slate-200 p-1"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-2xl">
                {pharmacyProfile.name.charAt(0) || 'ص'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900">{pharmacyProfile.name}</h1>
              {pharmacyProfile.slogan && (
                <p className="text-xs text-emerald-700 font-bold mt-0.5">{pharmacyProfile.slogan}</p>
              )}
              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3">
                {pharmacyProfile.address && <span>العنوان: {pharmacyProfile.address}</span>}
                {pharmacyProfile.phone && <span>الهاتف: {pharmacyProfile.phone}</span>}
                {pharmacyProfile.taxNumber && <span>الرقم الضريبي: {pharmacyProfile.taxNumber}</span>}
                {pharmacyProfile.commercialRecord && <span>السجل التجاري: {pharmacyProfile.commercialRecord}</span>}
              </div>
            </div>
          </div>

          <div className="text-left">
            <div className="inline-block bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-800">
              تقرير الحسابات والتسوية الشامل
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-1.5">
              فترة الحساب: <span className="font-bold text-slate-900">{currentPeriod.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </div>

        {/* Section 1: Executive Treasury Reconciliation & Totals */}
        <div>
          <h3 className="text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-emerald-600 mb-4">
            أولاً: ملخص حركة الخزينة والمطابقة النقدية (الإجماليات العامة)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-800">إجمالي الإيرادات</div>
              <div className="text-base font-black text-emerald-950 font-mono-num mt-1">
                {formatCurrency(summary.totalIncome, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">
                {periodIncome.length} يوم عمل / شفت
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
              <div className="text-[11px] font-bold text-rose-800">مسددات الموردين</div>
              <div className="text-base font-black text-rose-950 font-mono-num mt-1">
                {formatCurrency(summary.totalSupplierPayments, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-rose-700 mt-1">
                {periodSuppliers.length} فواتير ودفعات
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
              <div className="text-[11px] font-bold text-amber-800">المصروفات والنثريات</div>
              <div className="text-base font-black text-amber-950 font-mono-num mt-1">
                {formatCurrency(summary.totalExpenses, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-amber-700 mt-1">
                {periodExpenses.length} بند تشغيلي
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 relative group">
              <div className="text-[11px] font-bold text-blue-800 flex items-center justify-between">
                <span>المرحل من السابق</span>
                <div className="flex items-center gap-1">
                  {currentPeriod.customCarriedOver !== undefined ? (
                    <span className="text-[9px] px-1 py-0.2 bg-blue-200 text-blue-900 rounded font-bold">يدوي</span>
                  ) : (
                    <span className="text-[9px] px-1 py-0.2 bg-slate-200 text-slate-700 rounded font-medium">تلقائي</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCarriedOverInput(currentPeriod.customCarriedOver !== undefined ? String(currentPeriod.customCarriedOver) : String(summary.carriedOverBalance));
                      setIsEditCarriedOverOpen(true);
                    }}
                    className="no-print p-1 rounded-md text-blue-700 hover:text-blue-900 hover:bg-blue-200/60 transition-colors cursor-pointer"
                    title="تعديل أو إدخال المحول من شهر سابق يدوياً"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-base font-black text-blue-950 font-mono-num mt-1">
                {formatCurrency(summary.carriedOverBalance, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-blue-700 mt-1 flex items-center justify-between">
                <span>رصيد افتتاح الدورة</span>
                <button
                  type="button"
                  onClick={() => {
                    setCarriedOverInput(currentPeriod.customCarriedOver !== undefined ? String(currentPeriod.customCarriedOver) : String(summary.carriedOverBalance));
                    setIsEditCarriedOverOpen(true);
                  }}
                  className="no-print text-[9px] font-bold text-blue-800 underline hover:text-blue-950 cursor-pointer"
                >
                  إدخال يدوي
                </button>
              </div>
            </div>
          </div>

          {/* Equation Breakdown Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold">صافي رصيد الخزينة المحسوب:</span>
                <div className="text-base font-black text-slate-900 font-mono-num mt-0.5">
                  {formatCurrency(summary.netTreasury, pharmacyProfile.currency)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  (الإيراد - الموردين - المصروفات) + المرحل
                </div>
              </div>

              <div className="sm:border-r sm:pr-4 border-slate-200">
                <span className="text-slate-500 font-semibold">النقدية الفعلية بالدرج (العد):</span>
                <div className="text-base font-black text-slate-900 font-mono-num mt-0.5">
                  {currentPeriod.actualCashCounted !== undefined 
                    ? formatCurrency(summary.actualCashCounted, pharmacyProfile.currency) 
                    : <span className="text-slate-400 text-xs font-normal">لم يتم العد بعد</span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  النقدية المحسوبة المتوقعة: {formatCurrency(summary.expectedCash, pharmacyProfile.currency)}
                </div>
              </div>

              <div className="sm:border-r sm:pr-4 border-slate-200">
                <span className="text-slate-500 font-semibold">حالة المطابقة النقدية:</span>
                <div className="mt-1">
                  {summary.status === 'balanced' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ متزن تماماً (مطابق)
                    </span>
                  )}
                  {summary.status === 'surplus' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
                      + فائض نقدي ({formatCurrency(summary.difference, pharmacyProfile.currency)})
                    </span>
                  )}
                  {summary.status === 'deficit' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                      - عجز نقدي ({formatCurrency(Math.abs(summary.difference), pharmacyProfile.currency)})
                    </span>
                  )}
                  {summary.status === 'pending' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ⏳ بانتظار إدخال العد الفعلي
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Subsidiary Ledger Balances & Channels */}
        <div>
          <h3 className="text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-indigo-600 mb-4">
            ثانياً: أرصدة الحسابات المساعدة وقنوات السيولة (أين توجد الأموال؟)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>المحفظة الرقمية وانستا</span>
              </div>
              <div className="text-sm font-bold font-mono-num text-purple-900 mt-1">
                {formatCurrency(summary.walletNetBalance, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                دخول: {summary.walletIn} | خروج: {summary.walletOut}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>الشركاء والمسؤول</span>
              </div>
              <div className="text-sm font-bold font-mono-num text-blue-900 mt-1">
                {formatCurrency(summary.responsiblePersonNet, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                مسحوبات: {summary.responsiblePersonDebit} | سدادات: {summary.responsiblePersonCredit}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>ديون العملاء (الآجل)</span>
              </div>
              <div className="text-sm font-bold font-mono-num text-amber-900 mt-1">
                {formatCurrency(summary.customerDebtsNet, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                آجل جديد: {summary.customerDebtsDebit} | تحصيل: {summary.customerDebtsCredit}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                <span>سلف ومسحوبات الموظفين</span>
              </div>
              <div className="text-sm font-bold font-mono-num text-teal-900 mt-1">
                {formatCurrency(summary.employeeAdvancesNet, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                مسحوب: {summary.employeeAdvancesWithdrawn} | مردود: {summary.employeeAdvancesReturned}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Income & Liquidity Source Analysis */}
        <div>
          <h3 className="text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-teal-600 mb-4">
            ثالثاً: تفصيل مصادر الإيرادات وطرق التحصيل
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-slate-500 font-semibold">المقبوضات النقدية (كاش الدرج)</div>
                <div className="text-sm font-bold font-mono-num text-slate-900 mt-1">
                  {formatCurrency(cashIncome, pharmacyProfile.currency)}
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                {summary.totalIncome > 0 ? `${((cashIncome / summary.totalIncome) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-slate-500 font-semibold">مقبوضات فودافون كاش</div>
                <div className="text-sm font-bold font-mono-num text-rose-900 mt-1">
                  {formatCurrency(vodafoneIncome, pharmacyProfile.currency)}
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                {summary.totalIncome > 0 ? `${((vodafoneIncome / summary.totalIncome) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-slate-500 font-semibold">مقبوضات إنستاباي InstaPay</div>
                <div className="text-sm font-bold font-mono-num text-purple-900 mt-1">
                  {formatCurrency(instapayIncome, pharmacyProfile.currency)}
                </div>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                {summary.totalIncome > 0 ? `${((instapayIncome / summary.totalIncome) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Visual Expense Distribution Chart */}
        <div>
          <h3 className="text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-amber-600 mb-4">
            رابعاً: التحليل البياني لتوزيع المصروفات التشغيلية (Donut / Pie Chart)
          </h3>
          <ExpenseDistributionChart />
        </div>

        {/* Section 5: Summary of Suppliers & Expenses Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Top Suppliers */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>مسددات الموردين والشركات تفصيلاً:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                كاش: {suppliersCash} | محفظة: {suppliersWallet} | انستا: {suppliersInstapay}
              </span>
            </h4>
            <div className="space-y-1.5 text-xs">
              {suppliers.map(sup => {
                const total = periodSuppliers
                  .filter(s => s.supplierId === sup.id)
                  .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
                if (total === 0) return null;
                const count = periodSuppliers.filter(s => s.supplierId === sup.id).length;
                return (
                  <div key={sup.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{sup.name}</span>
                      <span className="text-[10px] text-slate-400 mr-2">({count} دفعات)</span>
                    </div>
                    <span className="font-bold font-mono-num text-slate-900">
                      {formatCurrency(total, pharmacyProfile.currency)}
                    </span>
                  </div>
                );
              })}
              {periodSuppliers.length === 0 && (
                <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-lg text-xs">
                  لا توجد مسددات موردين مسجلة في هذه الفترة
                </div>
              )}
            </div>
          </div>

          {/* Top Expense Categories Text Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">
              جدول بنود المصروفات التشغيلية تفصيلاً:
            </h4>
            <div className="space-y-1.5 text-xs">
              {expenseCategories.map(cat => {
                const total = periodExpenses
                  .filter(e => e.categoryId === cat.id)
                  .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                if (total === 0) return null;
                const count = periodExpenses.filter(e => e.categoryId === cat.id).length;
                return (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 mr-2">({count} حركات)</span>
                    </div>
                    <span className="font-bold font-mono-num text-slate-900">
                      {formatCurrency(total, pharmacyProfile.currency)}
                    </span>
                  </div>
                );
              })}
              {periodExpenses.length === 0 && (
                <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-lg text-xs">
                  لا توجد مصروفات مسجلة في هذه الفترة
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Section 6: Comprehensive Detailed Movement Tables (Collapsible / Printable) */}
        {showDetailedTables && (
          <div className="space-y-6 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-slate-800 mb-4 flex items-center justify-between">
              <span>خامساً: جدول تفريغ الحركات اليومية التفصيلي للشهر</span>
              <span className="text-[11px] text-slate-500 font-normal">
                سجل تفصيلي دقيق لكل عملية
              </span>
            </h3>

            {/* 1. Daily Income Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>سجل الإيرادات اليومية والشفتات ({periodIncome.length} سجل):</span>
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">التاريخ</th>
                      <th className="p-2">اليوم</th>
                      <th className="p-2">الشفت الصباحي</th>
                      <th className="p-2">الشفت المسائي</th>
                      <th className="p-2">كاش</th>
                      <th className="p-2">فودافون</th>
                      <th className="p-2">انستا</th>
                      <th className="p-2">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodIncome.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono">{r.date}</td>
                        <td className="p-2 font-semibold text-slate-800">{r.dayName || '-'}</td>
                        <td className="p-2 font-mono">{r.morningShift || 0}</td>
                        <td className="p-2 font-mono">{r.eveningShift || 0}</td>
                        <td className="p-2 font-mono text-emerald-800 font-semibold">{r.cashAmount || 0}</td>
                        <td className="p-2 font-mono text-rose-800">{r.vodafoneCash || 0}</td>
                        <td className="p-2 font-mono text-purple-800">{r.instaPay || 0}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{r.totalDayIncome || 0}</td>
                      </tr>
                    ))}
                    {periodIncome.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-3 text-center text-slate-400">لا توجد سجلات إيرادات</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Suppliers & Expenses Quick Detailed Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Suppliers Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>تفاصيل دفعات الموردين ({periodSuppliers.length} دفعة):</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">المورد</th>
                        <th className="p-2">المبلغ</th>
                        <th className="p-2">الطريقة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {periodSuppliers.map(s => {
                        const supName = suppliers.find(sup => sup.id === s.supplierId)?.name || s.supplierId;
                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{s.date}</td>
                            <td className="p-2 font-semibold text-slate-800">{supName}</td>
                            <td className="p-2 font-mono font-bold text-rose-900">{s.amount}</td>
                            <td className="p-2 text-[11px] text-slate-500">
                              {s.paymentMethod === 'cash' ? 'كاش' : s.paymentMethod === 'wallet' ? 'محفظة' : 'انستاباي'}
                            </td>
                          </tr>
                        );
                      })}
                      {periodSuppliers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">لا توجد مسددات موردين</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenses Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  <span>تفاصيل المصروفات التشغيلية ({periodExpenses.length} حركة):</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">البند</th>
                        <th className="p-2">المبلغ</th>
                        <th className="p-2">البيان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {periodExpenses.map(e => {
                        const catName = expenseCategories.find(c => c.id === e.categoryId)?.name || e.categoryId;
                        return (
                          <tr key={e.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{e.date}</td>
                            <td className="p-2 font-semibold text-slate-800">{catName}</td>
                            <td className="p-2 font-mono font-bold text-amber-900">{e.amount}</td>
                            <td className="p-2 text-[11px] text-slate-500 truncate max-w-[120px]">{e.notes || '-'}</td>
                          </tr>
                        );
                      })}
                      {periodExpenses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">لا توجد مصروفات مسجلة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Subsidiary Records (Wallets, Personal, Debts, Advances) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Debts */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>حركة ديون العملاء ({periodCustomerDebts.length} حركة):</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">العميل</th>
                        <th className="p-2">دين جديد</th>
                        <th className="p-2">سداد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {periodCustomerDebts.map(d => {
                        const custName = customers.find(c => c.id === d.customerId)?.name || d.customerId;
                        return (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{d.date}</td>
                            <td className="p-2 font-semibold text-slate-800">{custName}</td>
                            <td className="p-2 font-mono text-rose-700">{d.debit || 0}</td>
                            <td className="p-2 font-mono text-emerald-700">{d.credit || 0}</td>
                          </tr>
                        );
                      })}
                      {periodCustomerDebts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">لا توجد حركات ديون عملاء</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employee Advances */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span>حركة سلف الموظفين ({periodAdvances.length} حركة):</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">الموظف</th>
                        <th className="p-2">المسحوب</th>
                        <th className="p-2">المردود</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {periodAdvances.map(a => {
                        const empName = employees.find(e => e.id === a.employeeId)?.name || a.employeeId;
                        return (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{a.date}</td>
                            <td className="p-2 font-semibold text-slate-800">{empName}</td>
                            <td className="p-2 font-mono text-rose-700">{a.withdrawnAmount || 0}</td>
                            <td className="p-2 font-mono text-emerald-700">{a.returnedAmount || 0}</td>
                          </tr>
                        );
                      })}
                      {periodAdvances.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-slate-400">لا توجد سلف موظفين</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. Cash Drawer Shifts & Outflows Breakdown Table */}
            {drawerShifts.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Vault className="w-3.5 h-3.5 text-emerald-600" />
                  <span>سجل ورديات ومصروفات درج النقدية ({drawerShifts.length} وردية):</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">التاريخ والوردية</th>
                        <th className="p-2">الصيدلي المناوب</th>
                        <th className="p-2">الرصيد الافتتاحي</th>
                        <th className="p-2">المنصرف من الدرج</th>
                        <th className="p-2">المحول للخزانة</th>
                        <th className="p-2">المتروك بالدرج</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drawerShifts.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono">
                            {s.date} ({s.shiftType === 'morning' ? 'صباحي' : s.shiftType === 'evening' ? 'مسائي' : 'ليلي'})
                          </td>
                          <td className="p-2 font-semibold text-slate-800">{s.pharmacistName}</td>
                          <td className="p-2 font-mono">{formatCurrency(s.openingBalance, pharmacyProfile.currency)}</td>
                          <td className="p-2 font-mono text-rose-700 font-bold">
                            {formatCurrency(s.totalExpenses, pharmacyProfile.currency)}
                            <span className="text-[10px] text-slate-400 mr-1">({s.expenses.length} بند)</span>
                          </td>
                          <td className="p-2 font-mono text-emerald-700 font-bold">
                            {formatCurrency(s.transferredToVault, pharmacyProfile.currency)}
                          </td>
                          <td className="p-2 font-mono text-blue-700">
                            {formatCurrency(s.leftInDrawer, pharmacyProfile.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Official Signatures Footer */}
        <div className="pt-10 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs text-slate-700">
          <div>
            <div className="font-bold">المحاسب المسؤول</div>
            <div className="h-12"></div>
            <div className="text-[10px] text-slate-400">التوقيع: .....................</div>
          </div>

          <div>
            <div className="font-bold">مدير الفرع / الصيدلي</div>
            <div className="h-12"></div>
            <div className="text-[10px] text-slate-400">التوقيع: .....................</div>
          </div>

          <div>
            <div className="font-bold">اعتماد الشريك / الإدارة</div>
            <div className="h-12"></div>
            <div className="text-[10px] text-slate-400">التوقيع: .....................</div>
          </div>
        </div>

      </div>

      {/* EDIT CARRIED OVER MODAL */}
      {isEditCarriedOverOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">تعديل المحول من شهر سابق يدوياً</h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    الفترة: {currentPeriod.name}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveCarriedOver} className="p-5 space-y-4">
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold">💡 الرصيد الافتتاحي (المحول من الشهر السابق):</p>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  يمكنك تحديد رصيد الخزينة المرحل في بداية هذا الشهر يدوياً، أو تركه ليتم حسابه تلقائياً بناءً على إقفال الشهر السابق.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المبلغ المرحل من الشهر السابق (ج.م)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={carriedOverInput}
                    onChange={e => setCarriedOverInput(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono-num"
                  />
                  <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-500">
                    {pharmacyProfile.currency}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetCarriedOverToAuto}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة للحساب التلقائي</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditCarriedOverOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ الرصيد</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

