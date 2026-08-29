import React, { useState, useMemo } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { WalletTransaction } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  Check,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

const METHOD_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  instapay: {
    label: 'انستاباي (InstaPay)',
    badge: 'bg-purple-50 text-purple-900 border-purple-200',
    dot: 'bg-purple-500'
  },
  vodafone_cash: {
    label: 'فودافون كاش',
    badge: 'bg-rose-50 text-rose-900 border-rose-200',
    dot: 'bg-rose-500'
  },
  orange_cash: {
    label: 'أورنج كاش',
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    dot: 'bg-amber-500'
  },
  etisalat_cash: {
    label: 'اتصالات كاش',
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  bank_transfer: {
    label: 'تحويل بنكي',
    badge: 'bg-blue-50 text-blue-900 border-blue-200',
    dot: 'bg-blue-500'
  },
  wallet: {
    label: 'محفظة إلكترونية',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-500'
  }
};

const SUGGESTED_TAGS = [
  'تحويل دخل',
  'سداد مورد',
  'د. حبيب',
  'استبدال كاش',
  'مبيعات توصيل ديجيتال',
  'سداد عميل',
  'مصاريف تحويل',
  'سحب شريك'
];

const getArabicDayName = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[d.getDay()];
  } catch {
    return '';
  }
};

// Unified helper to extract note / tag label
const getTxLabel = (t: WalletTransaction): { primary: string; secondary?: string; isBlank: boolean } => {
  const note = (t.notes || '').trim();
  const tag = (t.tag || '').trim();

  if (!note && !tag) {
    return { primary: '', isBlank: true };
  }

  if (note && tag && note.toLowerCase() !== tag.toLowerCase()) {
    return { primary: note, secondary: tag, isBlank: false };
  }

  return { primary: note || tag, isBlank: false };
};

export const WalletModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    walletTransactions,
    addWalletTransaction,
    updateWalletTransaction,
    deleteWalletTransaction
  } = useTreasury();

  // Filters State
  // 1. Direction / Net Mode: 'all' | 'in' | 'out'
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  // 2. Tag / Note Filter: 'all' | 'empty' | string (specific tag/note)
  const [filterTag, setFilterTag] = useState<string>('all');
  // 3. Method Filter
  const [filterMethod, setFilterMethod] = useState<string>('all');
  // 4. Search Query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 5. Sorting
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [formMethod, setFormMethod] = useState<WalletTransaction['method']>('instapay');
  const [formTxType, setFormTxType] = useState<'in' | 'out'>('in');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Transactions belonging to active period
  const periodTxs = useMemo(() => {
    return walletTransactions.filter(t => t.periodId === currentPeriod.id);
  }, [walletTransactions, currentPeriod.id]);

  // Overall Month Totals
  const totalIn = useMemo(() => periodTxs.reduce((s, t) => s + (Number(t.inAmount) || 0), 0), [periodTxs]);
  const totalOut = useMemo(() => periodTxs.reduce((s, t) => s + (Number(t.outAmount) || 0), 0), [periodTxs]);
  const netWallet = totalIn - totalOut;

  // Dynamic tags/notes summary in this month
  const tagBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; inTotal: number; outTotal: number; net: number }>();
    let emptyCount = 0;
    let emptyIn = 0;
    let emptyOut = 0;

    periodTxs.forEach(t => {
      const { primary, secondary, isBlank } = getTxLabel(t);
      const inAmt = Number(t.inAmount) || 0;
      const outAmt = Number(t.outAmount) || 0;

      if (isBlank) {
        emptyCount++;
        emptyIn += inAmt;
        emptyOut += outAmt;
      } else {
        // Register primary label
        const existing = map.get(primary) || { count: 0, inTotal: 0, outTotal: 0, net: 0 };
        existing.count += 1;
        existing.inTotal += inAmt;
        existing.outTotal += outAmt;
        existing.net = existing.inTotal - existing.outTotal;
        map.set(primary, existing);

        // Also register secondary if different
        if (secondary && secondary !== primary && !map.has(secondary)) {
          map.set(secondary, { count: 1, inTotal: inAmt, outTotal: outAmt, net: inAmt - outAmt });
        }
      }
    });

    const tagsList = Array.from(map.entries()).map(([name, stats]) => ({
      name,
      ...stats
    })).sort((a, b) => b.count - a.count);

    return {
      tagsList,
      emptyStats: {
        count: emptyCount,
        inTotal: emptyIn,
        outTotal: emptyOut,
        net: emptyIn - emptyOut
      }
    };
  }, [periodTxs]);

  // Running Balances Map (Calculated on all period transactions sorted chronologically)
  const runningMap = useMemo(() => {
    const sortedChronological = [...periodTxs].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.id.localeCompare(b.id);
    });

    let runningAcc = 0;
    const map = new Map<string, number>();
    sortedChronological.forEach(t => {
      runningAcc += (Number(t.inAmount) || 0) - (Number(t.outAmount) || 0);
      map.set(t.id, runningAcc);
    });
    return map;
  }, [periodTxs]);

  // Filtering Logic
  const filteredTxs = useMemo(() => {
    return periodTxs.filter(t => {
      // 1. Direction Filter
      if (filterType === 'in' && !(Number(t.inAmount) > 0)) return false;
      if (filterType === 'out' && !(Number(t.outAmount) > 0)) return false;

      // 2. Method Filter
      if (filterMethod !== 'all' && t.method !== filterMethod) return false;

      // 3. Tag / Note Filter
      if (filterTag !== 'all') {
        const { primary, secondary, isBlank } = getTxLabel(t);
        if (filterTag === 'empty') {
          if (!isBlank) return false;
        } else {
          // match specific tag/note
          const matchPrimary = primary.toLowerCase() === filterTag.toLowerCase() || primary.toLowerCase().includes(filterTag.toLowerCase());
          const matchSecondary = secondary ? (secondary.toLowerCase() === filterTag.toLowerCase() || secondary.toLowerCase().includes(filterTag.toLowerCase())) : false;
          if (!matchPrimary && !matchSecondary) return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const { primary, secondary } = getTxLabel(t);
        const matchLabel = primary.toLowerCase().includes(q) || (secondary ? secondary.toLowerCase().includes(q) : false);
        const matchDate = t.date.includes(q);
        const matchMethod = (METHOD_CONFIG[t.method]?.label || t.method).toLowerCase().includes(q);
        const matchIn = String(t.inAmount || '').includes(q);
        const matchOut = String(t.outAmount || '').includes(q);
        if (!matchLabel && !matchDate && !matchMethod && !matchIn && !matchOut) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      if (sortBy === 'amount_desc') {
        const maxA = Math.max(Number(a.inAmount) || 0, Number(a.outAmount) || 0);
        const maxB = Math.max(Number(b.inAmount) || 0, Number(b.outAmount) || 0);
        return maxB - maxA;
      }
      if (sortBy === 'amount_asc') {
        const maxA = Math.max(Number(a.inAmount) || 0, Number(a.outAmount) || 0);
        const maxB = Math.max(Number(b.inAmount) || 0, Number(b.outAmount) || 0);
        return maxA - maxB;
      }
      return 0;
    });
  }, [periodTxs, filterType, filterMethod, filterTag, searchQuery, sortBy]);

  // Statistics for Current Filtered View
  const filteredIn = useMemo(() => filteredTxs.reduce((s, t) => s + (Number(t.inAmount) || 0), 0), [filteredTxs]);
  const filteredOut = useMemo(() => filteredTxs.reduce((s, t) => s + (Number(t.outAmount) || 0), 0), [filteredTxs]);
  const filteredNet = filteredIn - filteredOut;
  const filteredInCount = useMemo(() => filteredTxs.filter(t => Number(t.inAmount) > 0).length, [filteredTxs]);
  const filteredOutCount = useMemo(() => filteredTxs.filter(t => Number(t.outAmount) > 0).length, [filteredTxs]);

  const hasActiveFilters = filterType !== 'all' || filterTag !== 'all' || filterMethod !== 'all' || searchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setFilterType('all');
    setFilterTag('all');
    setFilterMethod('all');
    setSearchQuery('');
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    const inAmt = formTxType === 'in' ? amt : 0;
    const outAmt = formTxType === 'out' ? amt : 0;
    const cleanLabel = formNotes.trim();

    if (editingId) {
      updateWalletTransaction(editingId, {
        date: formDate,
        method: formMethod,
        inAmount: inAmt,
        outAmount: outAmt,
        tag: cleanLabel,
        notes: cleanLabel
      });
      setEditingId(null);
    } else {
      addWalletTransaction({
        periodId: currentPeriod.id,
        date: formDate,
        method: formMethod,
        inAmount: inAmt,
        outAmount: outAmt,
        tag: cleanLabel,
        notes: cleanLabel
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
    const { primary, secondary } = getTxLabel(tx);
    setFormNotes(primary || secondary || '');
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header */}
      <PrintHeader
        title="كشف حساب المحفظة الرقمية وإنستاباي (Digital Ledger)"
        summaryStats={[
          { label: 'إجمالي الداخل (تحويلات مستلمة)', value: formatCurrency(filteredIn, pharmacyProfile.currency) },
          { label: 'إجمالي الخارج (تحويلات مرسلة)', value: formatCurrency(filteredOut, pharmacyProfile.currency) },
          { label: 'صافي الرصيد للفترة', value: formatCurrency(filteredNet, pharmacyProfile.currency) },
          { label: 'عدد الحركات', value: `${filteredTxs.length} حركة` }
        ]}
      />

      {/* Top Banner & Action Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shadow-2xs">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
                <span>المحفظة الرقمية وإنستاباي</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-800 border border-purple-200">
                  InstaPay & Wallets
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة حركات الدخول والخروج والوسوم والملاحظات لشهر <strong className="text-slate-800 font-semibold">{currentPeriod.name}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreparePrintButton
            label="طباعة الكشف"
            title="كشف حساب المحافظ الإلكترونية ومدفوعات إنستاباي"
            subtitle={`الفترة: ${currentPeriod.name} ${hasActiveFilters ? '(نتائج مفلترة)' : ''}`}
            summaryStats={[
              { label: 'إجمالي الداخل', value: formatCurrency(filteredIn, pharmacyProfile.currency) },
              { label: 'إجمالي الخارج', value: formatCurrency(filteredOut, pharmacyProfile.currency) },
              { label: 'صافي الحركات', value: formatCurrency(filteredNet, pharmacyProfile.currency) },
              { label: 'عدد العمليات', value: `${filteredTxs.length} عملية` }
            ]}
          />
          <button
            onClick={() => {
              if (showAddForm && !editingId) {
                setShowAddForm(false);
              } else {
                setEditingId(null);
                setFormAmount('');
                setFormNotes('');
                setShowAddForm(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل حركة جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Dynamic Totals (Inflow, Outflow, Net) */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total In */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </span>
              إجمالي الداخل (استلام تحويل)
            </span>
            <span className="text-[11px] font-mono-num font-semibold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-md">
              {filteredInCount} عملية
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2.5">
            +{formatCurrency(filteredIn, pharmacyProfile.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>إجمالي الشهر:</span>
            <span className="font-mono-num font-semibold text-slate-700">{formatCurrency(totalIn, pharmacyProfile.currency)}</span>
          </div>
        </div>

        {/* Total Out */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5 text-rose-800 font-bold">
              <span className="p-1 rounded-md bg-rose-50 text-rose-600 border border-rose-100">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              إجمالي الخارج (سداد وتحويل)
            </span>
            <span className="text-[11px] font-mono-num font-semibold text-rose-700 bg-rose-50/70 px-2 py-0.5 rounded-md">
              {filteredOutCount} عملية
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2.5">
            -{formatCurrency(filteredOut, pharmacyProfile.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>إجمالي الشهر:</span>
            <span className="font-mono-num font-semibold text-slate-700">{formatCurrency(totalOut, pharmacyProfile.currency)}</span>
          </div>
        </div>

        {/* Net Balance (الصافي بينهما) */}
        <div className={`p-4.5 rounded-2xl border shadow-xs relative overflow-hidden transition-all ${
          filteredNet >= 0
            ? 'bg-linear-to-br from-purple-800 via-indigo-800 to-purple-900 text-white border-purple-700'
            : 'bg-linear-to-br from-rose-800 via-red-800 to-rose-900 text-white border-rose-700'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-purple-100">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              الصافي بينهما (الداخل - الخارج)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
              {hasActiveFilters ? 'صافي مفلتر' : 'صافي الرصيد'}
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono-num mt-2.5 tracking-tight">
            {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, pharmacyProfile.currency)}
          </div>
          <div className="text-[11px] text-purple-200/90 mt-1 flex items-center justify-between">
            <span>{filteredNet >= 0 ? 'فائض نقدي متراكم بالرصيد' : 'عجز / سحب زائد من الرصيد'}</span>
            <span className="font-mono-num text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
              المجمل: {formatCurrency(netWallet, pharmacyProfile.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Modal or Expandable Panel */}
      {showAddForm && (
        <div className="no-print bg-slate-50/90 p-5 sm:p-6 rounded-2xl border-2 border-purple-500/70 shadow-md animate-in fade-in transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-600 text-white">
                <Smartphone className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'تعديل بيانات حركة المحفظة' : 'تسجيل حركة محفظة / إنستاباي جديدة'}
              </h3>
            </div>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type: In / Out */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الحركة:</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setFormTxType('in')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      formTxType === 'in'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    🟢 داخل (وارد)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTxType('out')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      formTxType === 'out'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    🔴 خارج (صادر)
                  </button>
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">القناة / الطريقة:</label>
                <select
                  value={formMethod}
                  onChange={(e) => setFormMethod(e.target.value as WalletTransaction['method'])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-xs font-bold bg-white"
                >
                  <option value="instapay">انستاباي (InstaPay)</option>
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="orange_cash">أورنج كاش (Orange Cash)</option>
                  <option value="etisalat_cash">اتصالات كاش (Etisalat Cash)</option>
                  <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                  <option value="wallet">محفظة إلكترونية عامة</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المبلغ ({pharmacyProfile.currency}):</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="مثال: 1500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-sm font-black font-mono-num bg-white"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">التاريخ:</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none text-xs font-bold bg-white"
                />
              </div>
            </div>

            {/* Unified Note / Tag Input (can be empty!) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>الملاحظات والبيان (الوسم):</span>
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  اختياري - يمكن أن يترك فارغاً تماماً
                </span>
              </div>
              
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="اكتب اسم العميل، الشركة، الطبيب، أو رقم الحوالة... أو اختر وسماً سريعاً بالأسفل (أو اتركه فارغاً)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none text-xs font-medium bg-white text-slate-900"
              />

              {/* Quick Suggestion Chips */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">وسوم وملاحظات مقترحة سريعة:</span>
                {SUGGESTED_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFormNotes(tag)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      formNotes.trim() === tag
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {formNotes && (
                  <button
                    type="button"
                    onClick={() => setFormNotes('')}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-2 py-0.5 hover:underline cursor-pointer"
                  >
                    مسح وتفريغ
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {editingId ? 'حفظ التعديلات' : 'تسجيل الحركة الآن'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comprehensive Filter Control Center */}
      <div className="no-print space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Row 1: Direction Filter (دخول / خروج / الصافي) + Search + Method + Tag Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* 1. Direction Filter: دخول / خروج / الصافي بينهما */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل (عرض الصافي)
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'in'
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>دخول فقط (وارد)</span>
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'out'
                  ? 'bg-rose-600 text-white shadow-2xs font-black'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>خروج فقط (صادر)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الملاحظات، الوسم، المبلغ، أو التاريخ..."
              className="w-full pr-9 pl-8 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters: Note/Tag + Channel + Sorting */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Filter by Tag / Notes */}
            <div className="relative">
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:border-purple-600 focus:outline-none cursor-pointer"
              >
                <option value="all">🏷️ جميع الملاحظات والوسوم ({periodTxs.length})</option>
                {tagBreakdown.emptyStats.count > 0 && (
                  <option value="empty">
                    ⚪ بدون ملاحظات (فارغة) - {tagBreakdown.emptyStats.count} حركة
                  </option>
                )}
                {tagBreakdown.tagsList.map(tag => (
                  <option key={tag.name} value={tag.name}>
                    🏷️ {tag.name} ({tag.count} حركة | صافي: {tag.net >= 0 ? '+' : ''}{formatNumber(tag.net)} {pharmacyProfile.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Method */}
            <div className="relative">
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:border-purple-600 focus:outline-none cursor-pointer"
              >
                <option value="all">💳 جميع القنوات</option>
                <option value="instapay">انستاباي (InstaPay)</option>
                <option value="vodafone_cash">فودافون كاش</option>
                <option value="orange_cash">أورنج كاش</option>
                <option value="etisalat_cash">اتصالات كاش</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="wallet">محفظة إلكترونية</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-700 focus:border-purple-600 focus:outline-none cursor-pointer"
              >
                <option value="date_desc">التاريخ (الأحدث)</option>
                <option value="date_asc">التاريخ (الأقدم)</option>
                <option value="amount_desc">المبلغ (الأعلى)</option>
                <option value="amount_asc">المبلغ (الأقل)</option>
              </select>
            </div>

            {/* Reset Filters button if any active */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                title="إلغاء جميع الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>عرض الكل</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Interactive Quick Tag Chips with Net Balances */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            فلترة سريعة بالوسم:
          </span>

          {/* Chip for ALL */}
          <button
            onClick={() => setFilterTag('all')}
            className={`text-xs font-bold px-3 py-1 rounded-xl shrink-0 border transition-all cursor-pointer ${
              filterTag === 'all'
                ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            الكل ({periodTxs.length})
          </button>

          {/* Dynamic chips for each distinct tag in this month */}
          {tagBreakdown.tagsList.map(tag => {
            const isSelected = filterTag === tag.name;
            const netPositive = tag.net >= 0;
            return (
              <button
                key={tag.name}
                onClick={() => setFilterTag(isSelected ? 'all' : tag.name)}
                className={`text-xs font-bold px-3 py-1 rounded-xl shrink-0 border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                }`}
              >
                <span className="truncate max-w-[120px]">{tag.name}</span>
                <span className={`text-[10px] font-mono-num px-1.5 py-0.2 rounded font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : netPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {netPositive ? '+' : ''}{formatNumber(tag.net)}
                </span>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}

          {/* Empty notes chip if any exist */}
          {tagBreakdown.emptyStats.count > 0 && (
            <button
              onClick={() => setFilterTag(filterTag === 'empty' ? 'all' : 'empty')}
              className={`text-xs font-bold px-3 py-1 rounded-xl shrink-0 border flex items-center gap-1.5 transition-all cursor-pointer ${
                filterTag === 'empty'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-dashed border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>بدون ملاحظة ({tagBreakdown.emptyStats.count})</span>
              <span className={`text-[10px] font-mono-num px-1.5 py-0.2 rounded font-bold ${
                filterTag === 'empty' ? 'bg-white/20 text-white' : 'text-slate-500'
              }`}>
                {tagBreakdown.emptyStats.net >= 0 ? '+' : ''}{formatNumber(tagBreakdown.emptyStats.net)}
              </span>
            </button>
          )}
        </div>

        {/* Active Filter Notification / Indicator Banner */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-purple-950 font-bold">
              <Info className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                عرض نتائج الفلترة المخصصة:
                {filterTag !== 'all' && (
                  <span className="mr-1.5 text-purple-800">
                    الوسم: [<strong>{filterTag === 'empty' ? 'بدون ملاحظات' : filterTag}</strong>]
                  </span>
                )}
                {filterType !== 'all' && (
                  <span className="mr-1.5 text-purple-800">
                    النوع: [<strong>{filterType === 'in' ? 'دخول فقط' : 'خروج فقط'}</strong>]
                  </span>
                )}
                {filterMethod !== 'all' && (
                  <span className="mr-1.5 text-purple-800">
                    القناة: [<strong>{METHOD_CONFIG[filterMethod]?.label || filterMethod}</strong>]
                  </span>
                )}
                {searchQuery && (
                  <span className="mr-1.5 text-purple-800">
                    بحث: &ldquo;<strong>{searchQuery}</strong>&rdquo;
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono-num font-bold text-xs">
              <span className="text-emerald-700">وارد: +{formatNumber(filteredIn)}</span>
              <span className="text-rose-700">صادر: -{formatNumber(filteredOut)}</span>
              <span className={`px-2 py-0.5 rounded-md ${filteredNet >= 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                الصافي: {filteredNet >= 0 ? '+' : ''}{formatNumber(filteredNet)} {pharmacyProfile.currency}
              </span>
              <button
                onClick={resetAllFilters}
                className="text-purple-700 hover:text-purple-950 underline font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Ledger Table (Optimized for effortless reading and review) */}
      <div className="printable-table-container bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-black text-slate-700 print:bg-slate-100 print:text-black">
                <th className="py-3.5 px-3 text-center w-12">#</th>
                <th className="py-3.5 px-4 whitespace-nowrap">التاريخ واليوم</th>
                <th className="py-3.5 px-4 whitespace-nowrap">القناة / المحفظة</th>
                <th className="py-3.5 px-4">الملاحظات والبيان (الوسم)</th>
                <th className="py-3.5 px-4 text-emerald-800 print:text-black whitespace-nowrap text-left">داخل (+ وارد)</th>
                <th className="py-3.5 px-4 text-rose-800 print:text-black whitespace-nowrap text-left">خارج (- صادر)</th>
                <th className="py-3.5 px-4 text-slate-800 whitespace-nowrap text-left">الرصيد التراكمي</th>
                <th className="py-3.5 px-3 text-center no-print-action w-20">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="p-3 bg-slate-50 rounded-2xl w-fit mx-auto border border-slate-200">
                        <Smartphone className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-600 text-sm">لا توجد حركات تطابق خيارات الفلترة المحددة</p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters ? 'جرب إلغاء الفلاتر أو تغيير نص البحث' : 'قم بإضافة أول حركة محفظة أو إنستاباي لهذا الشهر'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetAllFilters}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          إلغاء الفلاتر وعرض الكل
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTxs.map((t, idx) => {
                  const running = runningMap.get(t.id) ?? 0;
                  const { primary, secondary, isBlank } = getTxLabel(t);
                  const dayName = getArabicDayName(t.date);
                  const methodConf = METHOD_CONFIG[t.method] || METHOD_CONFIG.wallet;
                  const hasIn = Number(t.inAmount) > 0;
                  const hasOut = Number(t.outAmount) > 0;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasIn ? 'hover:bg-emerald-50/20' : 'hover:bg-rose-50/20'
                      }`}
                    >
                      {/* # Index */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono-num text-[11px] font-bold">
                        {idx + 1}
                      </td>

                      {/* Date & Day */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono-num text-xs">
                          {formatDateArabic(t.date)}
                        </div>
                        {dayName && (
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {dayName}
                          </div>
                        )}
                      </td>

                      {/* Method Channel */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${methodConf.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${methodConf.dot}`} />
                          <span>{methodConf.label}</span>
                        </span>
                      </td>

                      {/* Unified Notes / Tag Label (Clear, high readability) */}
                      <td className="py-3 px-4">
                        {isBlank ? (
                          <div className="flex items-center gap-1 text-slate-300">
                            <span className="font-mono text-sm font-light">—</span>
                            <span className="text-[10px] text-slate-400 italic">بدون ملاحظات</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              {primary}
                            </span>
                            {secondary && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 font-medium">
                                {secondary}
                              </span>
                            )}
                            {/* Quick Filter Clicker */}
                            {filterTag !== primary && (
                              <button
                                onClick={() => setFilterTag(primary)}
                                className="no-print opacity-0 group-hover:opacity-100 hover:opacity-100 text-[10px] text-slate-400 hover:text-purple-700 transition-opacity p-0.5 cursor-pointer"
                                title={`فلترة حسب "${primary}"`}
                              >
                                <Tag className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Inflow (+ وارد) */}
                      <td className="py-3 px-4 whitespace-nowrap text-left">
                        {hasIn ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-black font-mono-num text-xs tracking-tight">
                            +{formatNumber(t.inAmount)} {pharmacyProfile.currency}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm">—</span>
                        )}
                      </td>

                      {/* Outflow (- صادر) */}
                      <td className="py-3 px-4 whitespace-nowrap text-left">
                        {hasOut ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/80 font-black font-mono-num text-xs tracking-tight">
                            -{formatNumber(t.outAmount)} {pharmacyProfile.currency}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm">—</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 whitespace-nowrap text-left">
                        <span className="font-bold text-slate-900 font-mono-num text-xs">
                          {formatCurrency(running, pharmacyProfile.currency)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 whitespace-nowrap text-center no-print-action">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="تعديل الحركة"
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
                            title="حذف الحركة"
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

            {/* Total / Summary Footer Row */}
            {filteredTxs.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300 print:bg-slate-200">
                  <td colSpan={4} className="py-3 px-4 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">المجموع للكشف الحالي:</span>
                      <span className="text-[11px] font-normal text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                        {filteredTxs.length} حركة مطابقة
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-left font-mono-num font-black text-emerald-800 print:text-black">
                    +{formatCurrency(filteredIn, pharmacyProfile.currency)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono-num font-black text-rose-800 print:text-black">
                    -{formatCurrency(filteredOut, pharmacyProfile.currency)}
                  </td>
                  <td className="py-3 px-4 text-left font-mono-num font-black text-slate-900">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-slate-500">الصافي بينهما:</span>
                      <span className={`${filteredNet >= 0 ? 'text-emerald-800' : 'text-rose-800'} text-xs`}>
                        {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, pharmacyProfile.currency)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 no-print-action"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Official Signatures for Auditing and Print */}
      <PrintSignatures />

    </div>
  );
};
