import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { ExpenseRecord, PaymentMethod } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Filter,
  PieChart as PieIcon,
  Tag,
  FolderPlus
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

export const ExpensesModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    expenses,
    expenseCategories,
    addExpense,
    updateExpense,
    deleteExpense,
    addExpenseCategory,
    deleteExpenseCategory
  } = useTreasury();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form State
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [formCategory, setFormCategory] = useState<string>(expenseCategories[0]?.id || '');
  const [formItemName, setFormItemName] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('cash');
  const [formNotes, setFormNotes] = useState<string>('');

  const periodExpenses = expenses.filter(e => e.periodId === currentPeriod.id);

  const totalExpenses = periodExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const filteredExpenses = periodExpenses.filter(e => {
    if (filterCategory !== 'all' && e.categoryId !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = e.itemName.toLowerCase().includes(q);
      const matchNotes = e.notes?.toLowerCase().includes(q);
      const matchDate = e.date.includes(q);
      if (!matchName && !matchNotes && !matchDate) return false;
    }
    return true;
  });

  const categoryTotals = expenseCategories.map(cat => {
    const sum = periodExpenses
      .filter(e => e.categoryId === cat.id)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { ...cat, sum };
  }).sort((a, b) => b.sum - a.sum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }
    if (!formItemName.trim()) {
      alert('يرجى إدخال اسم البند');
      return;
    }

    if (editingId) {
      updateExpense(editingId, {
        date: formDate,
        categoryId: formCategory,
        itemName: formItemName,
        amount: amt,
        paymentMethod: formMethod,
        notes: formNotes
      });
      setEditingId(null);
    } else {
      addExpense({
        periodId: currentPeriod.id,
        date: formDate,
        categoryId: formCategory,
        itemName: formItemName,
        amount: amt,
        paymentMethod: formMethod,
        notes: formNotes
      });
    }

    setFormItemName('');
    setFormAmount('');
    setFormNotes('');
    setShowAddForm(false);
  };

  const handleEdit = (exp: ExpenseRecord) => {
    setEditingId(exp.id);
    setFormDate(exp.date);
    setFormCategory(exp.categoryId);
    setFormItemName(exp.itemName);
    setFormAmount(String(exp.amount));
    setFormMethod(exp.paymentMethod);
    setFormNotes(exp.notes || '');
    setShowAddForm(true);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addExpenseCategory(newCatName.trim());
    setNewCatName('');
    setShowCategoryModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header */}
      <PrintHeader
        title="تقرير المصروفات والنثريات التشغيلية"
        summaryStats={[
          { label: 'إجمالي المصروفات', value: formatCurrency(totalExpenses, pharmacyProfile.currency) },
          { label: 'عدد البنود', value: `${filteredExpenses.length} بند` },
          { label: 'أعلى تصنيف صرف', value: categoryTotals[0]?.name || '-' }
        ]}
      />

      {/* Top Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Receipt className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">المصروفات والنثريات التشغيلية</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل وتصنيف كافة بنود المصروفات (بوفيه، نظافة، أكياس، كهرباء، إيجار، ضرائب...) لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreparePrintButton
            label="تجهيز للطباعة"
            title="تقرير المصروفات والنثريات التشغيلية"
            subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
            summaryStats={[
              { label: 'إجمالي المصروفات', value: formatCurrency(totalExpenses, pharmacyProfile.currency) },
              { label: 'عدد البنود', value: `${filteredExpenses.length} بند` },
              { label: 'أعلى تصنيف صرف', value: categoryTotals[0]?.name || '-' }
            ]}
          />
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            + إدارة التصنيفات
          </button>
          
          <button
            onClick={() => {
              setEditingId(null);
              setFormItemName('');
              setFormAmount('');
              setFormNotes('');
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            + تسجيل مصروف جديد
          </button>
        </div>
      </div>

      {/* Top Stat Banner */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-amber-100 font-semibold">إجمالي المصروفات لشهر {currentPeriod.name}</span>
            <div className="text-3xl font-black font-mono-num mt-1">
              {formatCurrency(totalExpenses, pharmacyProfile.currency)}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-amber-100/90">
            عدد الحركات المسجلة: <strong>{periodExpenses.length} حركة</strong>
          </div>
        </div>

        {/* Top 2 Categories Preview */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
            <span>أعلى تصنيفات الصرف هذا الشهر:</span>
            <span className="text-slate-400 font-normal text-[11px]">نسبة من الإجمالي</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryTotals.slice(0, 3).map(cat => {
              const pct = totalExpenses > 0 ? Math.round((cat.sum / totalExpenses) * 100) : 0;
              return (
                <div key={cat.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-700 truncate">{cat.name}</div>
                  <div className="text-sm font-bold text-amber-800 font-mono-num mt-1">
                    {formatCurrency(cat.sum, pharmacyProfile.currency)}
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Add / Edit Expense Form */}
      {showAddForm && (
        <div className="no-print bg-slate-50 p-5 rounded-2xl border-2 border-amber-500 shadow-sm animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            <span>{editingId ? 'تعديل بند المصروف' : 'تسجيل مصروف جديد'}</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم البند / الوصف:</label>
              <input
                type="text"
                required
                value={formItemName}
                onChange={(e) => setFormItemName(e.target.value)}
                placeholder="مثال: أكياس مطبوعة، قهوة وشاي، نظافة، لازق..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف:</label>
              <select
                required
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm font-bold bg-white"
              >
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ ({pharmacyProfile.currency}):</label>
              <input
                type="number"
                step="any"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="مثال: 150"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-base font-bold font-mono-num bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع:</label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm bg-white"
              >
                <option value="cash">نقدي (كاش من الدرج)</option>
                <option value="wallet">محفظة رقمية (فودافون كاش...)</option>
                <option value="instapay">انستاباي (InstaPay)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="اسم المستلم أو الفاتورة..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm bg-white"
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
                className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {editingId ? 'حفظ التعديلات' : 'تسجيل المصروف'}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في بنود المصروفات أو الملاحظات..."
            className="text-xs w-full sm:w-64 focus:outline-none text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">تصفية بالتصنيف:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">جميع التصنيفات ({periodExpenses.length})</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="printable-table-container bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">اسم البند والبيان</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">المبلغ</th>
                <th className="py-3 px-4">طريقة الصرف</th>
                <th className="py-3 px-4">الملاحظات</th>
                <th className="py-3 px-4 text-center no-print-action">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    لا توجد مصروفات مسجلة مطابقة في هذا الشهر.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => {
                  const cat = expenseCategories.find(c => c.id === exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        {formatDateArabic(exp.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        {exp.itemName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          {cat?.name || 'عام'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-black text-slate-900 font-mono-num text-sm">
                        {formatCurrency(exp.amount, pharmacyProfile.currency)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {exp.paymentMethod === 'cash' ? 'كاش (درج)' : exp.paymentMethod === 'wallet' ? 'محفظة' : 'انستاباي'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {exp.notes || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center no-print-action">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(exp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                                deleteExpense(exp.id);
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
                  );
                })
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-4 text-right">المجموع الكلي:</td>
                  <td className="py-2.5 px-4 font-mono-num font-black text-sm">
                    {formatCurrency(filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), pharmacyProfile.currency)}
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 no-print-action"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-600" />
              <span>إدارة تصنيفات المصروفات</span>
            </h3>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="اسم التصنيف الجديد (مثال: صيانة)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-amber-600 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                + إضافة
              </button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {expenseCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-800">{cat.name}</span>
                  {expenseCategories.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`هل تريد حذف تصنيف "${cat.name}"؟`)) {
                          deleteExpenseCategory(cat.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Signatures */}
      <PrintSignatures />

    </div>
  );
};
