import React from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import { FileText, CheckCircle2, AlertTriangle, Building, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';

export const ReportModule: React.FC = () => {
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
    suppliers,
    parties,
    customers,
    employees,
    getPeriodSummary
  } = useTreasury();

  const summary = getPeriodSummary(currentPeriod.id);

  const periodIncome = incomeRecords.filter(r => r.periodId === currentPeriod.id);
  const periodSuppliers = supplierPayments.filter(r => r.periodId === currentPeriod.id);
  const periodExpenses = expenses.filter(r => r.periodId === currentPeriod.id);

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
            تقرير رسمي مفصل ومجهز للطباعة أو الحفظ كـ PDF لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <PreparePrintButton
          label="تجهيز للطباعة / حفظ PDF"
          title="التقرير المالي والميزان الختامي للشهر"
          subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
          summaryStats={[
            { label: 'إجمالي دخل الشفتات', value: formatCurrency(summary.totalIncome, pharmacyProfile.currency) },
            { label: 'إجمالي مسددات الشركات', value: formatCurrency(summary.totalSuppliers, pharmacyProfile.currency) },
            { label: 'إجمالي المصروفات', value: formatCurrency(summary.totalExpenses, pharmacyProfile.currency) },
            { label: 'الرصيد المحاسبي المتبقي', value: formatCurrency(summary.theoreticalEndingBalance, pharmacyProfile.currency) }
          ]}
        />
      </div>

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
              </div>
            </div>
          </div>

          <div className="text-left">
            <div className="inline-block bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-xs font-bold text-slate-800">
              تقرير الحسابات الختامي
            </div>
            <div className="text-xs text-slate-600 font-semibold mt-1.5">
              فترة الحساب: <span className="font-bold text-slate-900">{currentPeriod.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}
            </div>
          </div>
        </div>

        {/* Section 1: Executive Treasury Reconciliation */}
        <div>
          <h3 className="text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-emerald-600 mb-4">
            أولاً: ملخص حركة الخزينة والمطابقة النقدية
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-800">إجمالي الإيرادات</div>
              <div className="text-base font-black text-emerald-950 font-mono-num mt-1">
                {formatCurrency(summary.totalIncome, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">
                (كاش + فودافون + انستا)
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
              <div className="text-[11px] font-bold text-rose-800">مسددات الموردين</div>
              <div className="text-base font-black text-rose-950 font-mono-num mt-1">
                {formatCurrency(summary.totalSuppliers, pharmacyProfile.currency)}
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

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
              <div className="text-[11px] font-bold text-blue-800">المرحل من السابق</div>
              <div className="text-base font-black text-blue-950 font-mono-num mt-1">
                {formatCurrency(summary.carriedOver, pharmacyProfile.currency)}
              </div>
              <div className="text-[10px] text-blue-700 mt-1">
                رصيد افتتاح الدورة
              </div>
            </div>
          </div>

          {/* Equation Breakdown Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-semibold">صافي رصيد الخزينة = (الإيراد - الموردين - المصروفات) + المرحل :</span>
                <div className="text-lg font-black text-slate-900 font-mono-num mt-0.5">
                  {formatCurrency(summary.netTreasury, pharmacyProfile.currency)}
                </div>
              </div>

              <div className="text-left sm:border-r sm:pr-4 border-slate-200">
                <span className="text-slate-500 font-semibold">النقدية الفعلية بالدرج (العد):</span>
                <div className="text-lg font-black text-slate-900 font-mono-num mt-0.5">
                  {formatCurrency(summary.actualCashInDrawer, pharmacyProfile.currency)}
                </div>
              </div>

              <div className="text-left sm:border-r sm:pr-4 border-slate-200">
                <span className="text-slate-500 font-semibold">حالة المطابقة:</span>
                <div className="mt-1">
                  {summary.reconciliationStatus === 'balanced' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ متزن تماماً (مطابق)
                    </span>
                  )}
                  {summary.reconciliationStatus === 'surplus' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
                      + فائض نقدي ({formatCurrency(summary.variance, pharmacyProfile.currency)})
                    </span>
                  )}
                  {summary.reconciliationStatus === 'deficit' && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                      - عجز نقدي ({formatCurrency(Math.abs(summary.variance), pharmacyProfile.currency)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Subsidiary Ledger Balances */}
        <div>
          <h3 className="text-sm font-black text-slate-900 bg-slate-100 p-2.5 rounded-lg border-r-4 border-indigo-600 mb-4">
            ثانياً: أرصدة الحسابات المساعدة المرتبطة
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">المحفظة الرقمية وانستا</div>
              <div className="text-sm font-bold font-mono-num text-purple-900 mt-1">
                {formatCurrency(summary.netWallet, pharmacyProfile.currency)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">الشركاء والمسؤول (د. حبيب)</div>
              <div className="text-sm font-bold font-mono-num text-blue-900 mt-1">
                {formatCurrency(summary.netPersonal, pharmacyProfile.currency)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">ديون العملاء (الآجل)</div>
              <div className="text-sm font-bold font-mono-num text-amber-900 mt-1">
                {formatCurrency(summary.netCustomerDebts, pharmacyProfile.currency)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold">سلف ومسحوبات الموظفين</div>
              <div className="text-sm font-bold font-mono-num text-teal-900 mt-1">
                {formatCurrency(summary.netEmployeeAdvances, pharmacyProfile.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Summary of Suppliers & Expenses Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Top Suppliers */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">
              أعلى الموردين استلاماً للدفعات هذا الشهر:
            </h4>
            <div className="space-y-1.5 text-xs">
              {suppliers.map(sup => {
                const total = periodSuppliers
                  .filter(s => s.supplierId === sup.id)
                  .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
                if (total === 0) return null;
                return (
                  <div key={sup.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">{sup.name}</span>
                    <span className="font-bold font-mono-num text-slate-900">
                      {formatCurrency(total, pharmacyProfile.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Expense Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">
              توزيع المصروفات التشغيلية حسب التصنيف:
            </h4>
            <div className="space-y-1.5 text-xs">
              {expenseCategories.map(cat => {
                const total = periodExpenses
                  .filter(e => e.categoryId === cat.id)
                  .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                if (total === 0) return null;
                return (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="font-bold font-mono-num text-slate-900">
                      {formatCurrency(total, pharmacyProfile.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

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

    </div>
  );
};
