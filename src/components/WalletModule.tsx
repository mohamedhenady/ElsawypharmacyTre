import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { WalletTransaction } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Tag
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

export const WalletModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    walletTransactions,
    addWalletTransaction,
    updateWalletTransaction,
    deleteWalletTransaction,
    parties
  } = useTreasury();

  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [formMethod, setFormMethod] = useState<WalletTransaction['method']>('instapay');
  const [formTxType, setFormTxType] = useState<'in' | 'out'>('in');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formTag, setFormTag] = useState<string>('عام');
  const [formNotes, setFormNotes] = useState<string>('');

  const periodTxs = walletTransactions.filter(t => t.periodId === currentPeriod.id);

  const totalIn = periodTxs.reduce((s, t) => s + (Number(t.inAmount) || 0), 0);
  const totalOut = periodTxs.reduce((s, t) => s + (Number(t.outAmount) || 0), 0);
  const netWallet = totalIn - totalOut;

  // Filtered
  const filteredTxs = periodTxs.filter(t => {
    if (filterMethod !== 'all' && t.method !== filterMethod) return false;
    if (filterTag !== 'all' && t.tag !== filterTag) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTag = t.tag.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchDate = t.date.includes(q);
      if (!matchTag && !matchNotes && !matchDate) return false;
    }
    return true;
  });

  // Calculate Running Balances (sorted chronologically)
  const sortedForRunning = [...periodTxs].sort((a, b) => a.date.localeCompare(b.date));
  let runningAcc = 0;
  const runningMap = new Map<string, number>();
  sortedForRunning.forEach(t => {
    runningAcc += (Number(t.inAmount) || 0) - (Number(t.outAmount) || 0);
    runningMap.set(t.id, runningAcc);
  });

  const availableTags = [
    'د. حبيب',
    'مصباح',
    'محول لنقدي',
    'استبدال كاش',
    'سداد مورد',
    'مبيعات توصيل ديجيتال',
    'سداد عميل',
    'مصروف',
    'عام'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    const inAmt = formTxType === 'in' ? amt : 0;
    const outAmt = formTxType === 'out' ? amt : 0;

    if (editingId) {
      updateWalletTransaction(editingId, {
        date: formDate,
        method: formMethod,
        inAmount: inAmt,
        outAmount: outAmt,
        tag: formTag,
        notes: formNotes
      });
      setEditingId(null);
    } else {
      addWalletTransaction({
        periodId: currentPeriod.id,
        date: formDate,
        method: formMethod,
        inAmount: inAmt,
        outAmount: outAmt,
        tag: formTag,
        notes: formNotes
      });
    }

    setFormAmount('');
    setFormNotes('');
    setShowAddForm(false);
  };

  const handleEdit = (tx: WalletTransaction) => {
    setEditingId(tx.id);
    setFormDate(tx.date);
    setFormMethod(tx.method);
    if (tx.inAmount > 0) {
      setFormTxType('in');
      setFormAmount(String(tx.inAmount));
    } else {
      setFormTxType('out');
      setFormAmount(String(tx.outAmount));
    }
    setFormTag(tx.tag);
    setFormNotes(tx.notes || '');
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header */}
      <PrintHeader
        title="تقرير حركة المحفظة الرقمية وانستاباي"
        summaryStats={[
          { label: 'إجمالي الداخل (تحويلات مستلمة)', value: formatCurrency(totalIn, pharmacyProfile.currency) },
          { label: 'إجمالي الخارج (تحويلات مرسلة)', value: formatCurrency(totalOut, pharmacyProfile.currency) },
          { label: 'صافي الرصيد', value: formatCurrency(netWallet, pharmacyProfile.currency) }
        ]}
      />

      {/* Top Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Smartphone className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">المحفظة الرقمية وانستاباي (InstaPay & Wallets)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل حركات الدخول والخروج عبر انستاباي وفودافون كاش وتصنيفها لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreparePrintButton
            label="تجهيز للطباعة"
            title="تقرير المحافظ الإلكترونية ومدفوعات انستاباي"
            subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
            summaryStats={[
              { label: 'إجمالي الداخل (تحويلات مستلمة)', value: formatCurrency(totalIn, pharmacyProfile.currency) },
              { label: 'إجمالي الخارج (مدفوعات ومسحوبات)', value: formatCurrency(totalOut, pharmacyProfile.currency) },
              { label: 'صافي حركة المحفظة', value: formatCurrency(netWallet, pharmacyProfile.currency) },
              { label: 'عدد الحركات', value: `${periodTxs.length} حركة` }
            ]}
          />
          <button
            onClick={() => {
              setEditingId(null);
              setFormAmount('');
              setFormNotes('');
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            + تسجيل حركة محفظة / انستا
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              إجمالي الداخل (تحويلات مستلمة)
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
            {formatCurrency(totalIn, pharmacyProfile.currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              إجمالي الخارج (تحويلات مرسلة)
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
            {formatCurrency(totalOut, pharmacyProfile.currency)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-100">
            <span>صافي رصيد المحفظة والانستا</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">يغذي الداشبورد</span>
          </div>
          <div className="text-2xl font-black text-white font-mono-num mt-2">
            {formatCurrency(netWallet, pharmacyProfile.currency)}
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <div className="no-print bg-slate-50 p-5 rounded-2xl border-2 border-purple-500 shadow-sm animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" />
            <span>{editingId ? 'تعديل حركة المحفظة' : 'تسجيل حركة محفظة / انستاباي جديدة'}</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormTxType('in')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    formTxType === 'in'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🟢 داخل (استلام تحويل)
                </button>
                <button
                  type="button"
                  onClick={() => setFormTxType('out')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    formTxType === 'out'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🔴 خارج (تحويل مرسل)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع / القناة:</label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value as WalletTransaction['method'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-sm font-bold bg-white"
              >
                <option value="instapay">انستاباي (InstaPay)</option>
                <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                <option value="orange_cash">أورنج كاش (Orange Cash)</option>
                <option value="etisalat_cash">اتصالات كاش (Etisalat Cash)</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="wallet">محفظة إلكترونية أخرى</option>
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
                placeholder="مثال: 1500"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-base font-bold font-mono-num bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الوسم / التصنيف المنظم (Tag):</label>
              <input
                type="text"
                list="wallet-tags-list"
                value={formTag}
                onChange={(e) => setFormTag(e.target.value)}
                placeholder="اختر أو اكتب وسماً..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-sm font-bold bg-white"
              />
              <datalist id="wallet-tags-list">
                {availableTags.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات توضيحية:</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="اسم العميل أو رقم العملية..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-sm bg-white"
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
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {editingId ? 'حفظ التعديلات' : 'تسجيل الحركة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الملاحظات أو الوسم..."
            className="text-xs w-full sm:w-64 focus:outline-none text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">جميع الوسوم (Tags)</option>
            {availableTags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="printable-table-container bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">القناة / الطريقة</th>
                <th className="py-3 px-4">الوسم والتصنيف (Tag)</th>
                <th className="py-3 px-4 text-emerald-700 print:text-black">داخل (In)</th>
                <th className="py-3 px-4 text-rose-700 print:text-black">خارج (Out)</th>
                <th className="py-3 px-4">الرصيد الجاري</th>
                <th className="py-3 px-4">الملاحظات</th>
                <th className="py-3 px-4 text-center no-print-action">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    لا توجد حركات محفظة مسجلة في هذا الشهر.
                  </td>
                </tr>
              ) : (
                filteredTxs.map(t => {
                  const running = runningMap.get(t.id) ?? 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        {formatDateArabic(t.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
                          {t.method === 'instapay' ? 'انستاباي' : t.method === 'vodafone_cash' ? 'فودافون كاش' : t.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {t.tag}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-700 font-mono-num text-sm">
                        {t.inAmount > 0 ? `+${formatCurrency(t.inAmount, pharmacyProfile.currency)}` : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-700 font-mono-num text-sm">
                        {t.outAmount > 0 ? `-${formatCurrency(t.outAmount, pharmacyProfile.currency)}` : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800 font-mono-num">
                        {formatCurrency(running, pharmacyProfile.currency)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {t.notes || '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center no-print-action">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف حركة المحفظة هذه؟')) {
                                deleteWalletTransaction(t.id);
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
            {filteredTxs.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-4 text-right">المجموع الكلي:</td>
                  <td className="py-2.5 px-4 font-mono-num font-black text-emerald-800 print:text-black">
                    +{formatCurrency(filteredTxs.reduce((s, t) => s + (Number(t.inAmount) || 0), 0), pharmacyProfile.currency)}
                  </td>
                  <td className="py-2.5 px-4 font-mono-num font-black text-rose-800 print:text-black">
                    -{formatCurrency(filteredTxs.reduce((s, t) => s + (Number(t.outAmount) || 0), 0), pharmacyProfile.currency)}
                  </td>
                  <td className="py-2.5 px-4 font-mono-num font-black">
                    {formatCurrency(netWallet, pharmacyProfile.currency)}
                  </td>
                  <td colSpan={2} className="py-2.5 px-4 no-print-action"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Official Signatures */}
      <PrintSignatures />

    </div>
  );
};
