import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { ShiftType } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sun,
  Moon,
  Clock,
  User,
  Search,
  Filter
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

export const IncomeModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    incomeRecords,
    addIncomeRecord,
    updateIncomeRecord,
    deleteIncomeRecord,
    employees
  } = useTreasury();

  const [filterShift, setFilterShift] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [formTime, setFormTime] = useState<string>('15:30');
  const [formShift, setFormShift] = useState<ShiftType>('morning');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCashier, setFormCashier] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const periodRecords = incomeRecords.filter(r => r.periodId === currentPeriod.id);

  const filteredRecords = periodRecords.filter(r => {
    if (filterShift !== 'all' && r.shiftType !== filterShift) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCashier = r.cashierName?.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      const matchDate = r.date.includes(q);
      if (!matchCashier && !matchNotes && !matchDate) return false;
    }
    return true;
  });

  const totalMorning = periodRecords
    .filter(r => r.shiftType === 'morning')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const totalEvening = periodRecords
    .filter(r => r.shiftType === 'evening')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const totalGrand = totalMorning + totalEvening + periodRecords
    .filter(r => r.shiftType !== 'morning' && r.shiftType !== 'evening')
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (editingId) {
      updateIncomeRecord(editingId, {
        date: formDate,
        time: formTime,
        shiftType: formShift,
        amount: amountNum,
        cashierName: formCashier,
        notes: formNotes
      });
      setEditingId(null);
    } else {
      addIncomeRecord({
        periodId: currentPeriod.id,
        date: formDate,
        time: formTime,
        shiftType: formShift,
        amount: amountNum,
        cashierName: formCashier,
        notes: formNotes
      });
    }

    // Reset Form
    setFormAmount('');
    setFormNotes('');
    setShowAddForm(false);
  };

  const handleEdit = (rec: typeof periodRecords[0]) => {
    setEditingId(rec.id);
    setFormDate(rec.date);
    setFormTime(rec.time || '15:30');
    setFormShift(rec.shiftType);
    setFormAmount(String(rec.amount));
    setFormCashier(rec.cashierName || '');
    setFormNotes(rec.notes || '');
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header (Visible only on print) */}
      <PrintHeader
        title="كشف تسليمات الدخل والورديات اليومية"
        summaryStats={[
          { label: 'إجمالي الدخل', value: formatCurrency(totalGrand, pharmacyProfile.currency) },
          { label: 'إجمالي الصباحي', value: formatCurrency(totalMorning, pharmacyProfile.currency) },
          { label: 'إجمالي المسائي', value: formatCurrency(totalEvening, pharmacyProfile.currency) },
          { label: 'عدد التسليمات', value: `${periodRecords.length} تسليم` }
        ]}
      />

      {/* Header & Stats Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">موديول الدخل وتسليمات الشفتات</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل وتتبع تسليمات الشفت الصباحي والمسائي لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <PreparePrintButton
            label="تجهيز للطباعة"
            title="تقرير تسليمات وإيرادات الشفتات"
            subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
            summaryStats={[
              { label: 'إجمالي الشفت الصباحي', value: formatCurrency(totalMorning, pharmacyProfile.currency) },
              { label: 'إجمالي الشفت المسائي', value: formatCurrency(totalEvening, pharmacyProfile.currency) },
              { label: 'إجمالي تسليمات الشهر', value: formatCurrency(totalGrand, pharmacyProfile.currency) },
              { label: 'عدد التسليمات', value: `${periodRecords.length} تسليم` }
            ]}
          />
          <button
            onClick={() => {
              setEditingId(null);
              setFormAmount('');
              setFormNotes('');
              setShowAddForm(!showAddForm);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'إلغاء الإدخال' : 'تسليم شفت جديد'}</span>
          </button>
        </div>
      </div>

      {/* 3 Calculated Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs stat-card-print">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              إجمالي الشفت الصباحي
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-200">
              {periodRecords.filter(r => r.shiftType === 'morning').length} تسليم
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
            {formatCurrency(totalMorning, pharmacyProfile.currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs stat-card-print">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-800">
            <span className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-500" />
              إجمالي الشفت المسائي
            </span>
            <span className="text-[10px] bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded font-bold border border-indigo-200">
              {periodRecords.filter(r => r.shiftType === 'evening').length} تسليم
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
            {formatCurrency(totalEvening, pharmacyProfile.currency)}
          </div>
        </div>

        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-xs stat-card-print print:bg-slate-100 print:text-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-100 print:text-slate-700">
            <span>إجمالي تسليمات الشهر (الكل)</span>
            <span className="text-[10px] bg-emerald-950/40 text-white px-2 py-0.5 rounded font-bold print:bg-slate-200 print:text-slate-900">
              {periodRecords.length} حركة
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono-num mt-2 print:text-slate-950">
            {formatCurrency(totalGrand, pharmacyProfile.currency)}
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal / Box */}
      {showAddForm && (
        <div className="no-print bg-slate-50 p-5 rounded-2xl border-2 border-emerald-500 shadow-sm animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>{editingId ? 'تعديل حركة تسليم دخل' : 'تسجيل تسليم شفت جديد'}</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الوقت:</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع الشفت:</label>
              <select
                value={formShift}
                onChange={(e) => setFormShift(e.target.value as ShiftType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm font-semibold bg-white"
              >
                <option value="morning">صباحي ☀️</option>
                <option value="evening">مسائي 🌙</option>
                <option value="night">ليلي / سهر 🌌</option>
                <option value="other">أخرى / تسليم استثنائي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المسلم ({pharmacyProfile.currency}):
              </label>
              <input
                type="number"
                step="any"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="مثال: 4500"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-base font-bold font-mono-num bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الكاشير / الصيدلي المسؤول:</label>
              <input
                type="text"
                list="cashiers-list"
                value={formCashier}
                onChange={(e) => setFormCashier(e.target.value)}
                placeholder="اسم الكاشير أو المسؤول..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
              <datalist id="cashiers-list">
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات (اختياري):</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="أي ملاحظات حول الشفت..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {editingId ? 'حفظ التعديلات' : 'تسجيل الدخل بالخزانة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالكاشير أو التاريخ أو الملاحظات..."
            className="text-xs w-full sm:w-64 focus:outline-none text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">تصفية بالشفت:</span>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">جميع الشفتات ({periodRecords.length})</option>
            <option value="morning">الصباحي فقط</option>
            <option value="evening">المسائي فقط</option>
            <option value="night">الليلي فقط</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="printable-table-container bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">نوع الشفت</th>
                <th className="py-3 px-4">الكاشير / المستلم</th>
                <th className="py-3 px-4">المبلغ المسلم</th>
                <th className="py-3 px-4">الملاحظات</th>
                <th className="py-3 px-4 text-center no-print-action">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    لا توجد سجلات دخل مطابقة للبحث في هذا الشهر.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 no-print" />
                        <span>{formatDateArabic(rec.date)}</span>
                        {rec.time && <span className="text-slate-500 text-[10px]">({rec.time})</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {rec.shiftType === 'morning' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 print:border-slate-300">
                          <Sun className="w-3 h-3 text-amber-600 no-print" />
                          صباحي
                        </span>
                      ) : rec.shiftType === 'evening' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 print:border-slate-300">
                          <Moon className="w-3 h-3 text-indigo-600 no-print" />
                          مسائي
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 print:border-slate-300">
                          {rec.shiftType}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {rec.cashierName ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 no-print" />
                          {rec.cashierName}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-black text-slate-900 font-mono-num text-sm">
                      {formatCurrency(rec.amount, pharmacyProfile.currency)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {rec.notes || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center no-print-action">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(rec)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                              deleteIncomeRecord(rec.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-4 text-right">المجموع الإجمالي:</td>
                  <td className="py-2.5 px-4 font-mono-num font-black text-sm">
                    {formatCurrency(filteredRecords.reduce((s, r) => s + (Number(r.amount) || 0), 0), pharmacyProfile.currency)}
                  </td>
                  <td colSpan={2} className="py-2.5 px-4 no-print-action"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Official Print Signatures */}
      <PrintSignatures />

    </div>
  );
};
