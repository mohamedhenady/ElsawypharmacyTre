import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { PersonalLedgerRecord, Party } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Filter,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Split
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

export const PersonalLedgerModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    parties,
    personalLedgers,
    addPersonalLedger,
    updatePersonalLedger,
    deletePersonalLedger,
    addParty,
    updateParty,
    deleteParty
  } = useTreasury();

  const [selectedPartyId, setSelectedPartyId] = useState<string>(parties[0]?.id || '');
  const [filterSubTag, setFilterSubTag] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showPartyModal, setShowPartyModal] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyRole, setNewPartyRole] = useState<Party['role']>('partner');
  const [newPartyPhone, setNewPartyPhone] = useState('');

  // Form State
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [formPartyId, setFormPartyId] = useState<string>(parties[0]?.id || '');
  const [formType, setFormType] = useState<'debit' | 'credit'>('debit');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formMethod, setFormMethod] = useState<PersonalLedgerRecord['method']>('cash');
  const [formSubTag, setFormSubTag] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const periodLedgers = personalLedgers.filter(r => r.periodId === currentPeriod.id);

  // Filtered by selected party if specified
  const filteredLedgers = periodLedgers.filter(r => {
    if (selectedPartyId && r.partyId !== selectedPartyId) return false;
    if (filterSubTag !== 'all' && r.subAccountTag !== filterSubTag) return false;
    return true;
  });

  const totalDebit = periodLedgers.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCredit = periodLedgers.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const totalNet = totalDebit - totalCredit;

  // Selected party totals
  const selectedPartyDebit = periodLedgers
    .filter(r => r.partyId === selectedPartyId)
    .reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const selectedPartyCredit = periodLedgers
    .filter(r => r.partyId === selectedPartyId)
    .reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const selectedPartyNet = selectedPartyDebit - selectedPartyCredit;

  // Running balance calculation for the selected view
  const sortedForRunning = [...filteredLedgers].sort((a, b) => a.date.localeCompare(b.date));
  let runningAcc = 0;
  const runningMap = new Map<string, number>();
  sortedForRunning.forEach(r => {
    runningAcc += (Number(r.debit) || 0) - (Number(r.credit) || 0);
    runningMap.set(r.id, runningAcc);
  });

  // Extract unique sub tags (like "مصباح")
  const uniqueSubTags = Array.from(new Set(periodLedgers.map(r => r.subAccountTag).filter(Boolean))) as string[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    const debitAmt = formType === 'debit' ? amt : 0;
    const creditAmt = formType === 'credit' ? amt : 0;

    if (editingId) {
      updatePersonalLedger(editingId, {
        partyId: formPartyId,
        date: formDate,
        method: formMethod,
        debit: debitAmt,
        credit: creditAmt,
        subAccountTag: formSubTag,
        notes: formNotes
      });
      setEditingId(null);
    } else {
      addPersonalLedger({
        periodId: currentPeriod.id,
        partyId: formPartyId,
        date: formDate,
        method: formMethod,
        debit: debitAmt,
        credit: creditAmt,
        subAccountTag: formSubTag,
        notes: formNotes
      });
    }

    setFormAmount('');
    setFormNotes('');
    setFormSubTag('');
    setShowAddForm(false);
  };

  const handleEdit = (rec: PersonalLedgerRecord) => {
    setEditingId(rec.id);
    setFormPartyId(rec.partyId);
    setFormDate(rec.date);
    setFormMethod(rec.method);
    if (rec.debit > 0) {
      setFormType('debit');
      setFormAmount(String(rec.debit));
    } else {
      setFormType('credit');
      setFormAmount(String(rec.credit));
    }
    setFormSubTag(rec.subAccountTag || '');
    setFormNotes(rec.notes || '');
    setShowAddForm(true);
  };

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    addParty({
      name: newPartyName.trim(),
      role: newPartyRole,
      phone: newPartyPhone.trim()
    });
    setNewPartyName('');
    setNewPartyPhone('');
    setShowPartyModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header */}
      <PrintHeader
        title={
          selectedPartyId
            ? `كشف حساب الشريك / الطرف: ${parties.find(p => p.id === selectedPartyId)?.name || ''}`
            : 'تقرير الحسابات الجارية ومسحوبات الشركاء'
        }
        summaryStats={
          selectedPartyId
            ? [
                { label: 'اسم الشريك / الطرف', value: parties.find(p => p.id === selectedPartyId)?.name || '-' },
                { label: 'إجمالي المسحوب (مدين)', value: formatCurrency(selectedPartyDebit, pharmacyProfile.currency) },
                { label: 'إجمالي المردود (دائن)', value: formatCurrency(selectedPartyCredit, pharmacyProfile.currency) },
                { label: 'صافي الرصيد', value: formatCurrency(selectedPartyNet, pharmacyProfile.currency) }
              ]
            : [
                { label: 'إجمالي السحب والمسحوبات (مدين)', value: formatCurrency(totalDebit, pharmacyProfile.currency) },
                { label: 'إجمالي المسدد والمردود (دائن)', value: formatCurrency(totalCredit, pharmacyProfile.currency) },
                { label: 'صافي الحسابات الجارية', value: formatCurrency(totalNet, pharmacyProfile.currency) }
              ]
        }
      />

      {/* Top Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">كشف حساب الشركاء والمسؤول (Personal Ledger)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة مسحوبات وسلف ورديات الشركاء (د. حبيب، مصباح، الأطراف المرتبطة) لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreparePrintButton
            label="تجهيز للطباعة"
            title={
              selectedPartyId
                ? `كشف حساب الشريك / الطرف: ${parties.find(p => p.id === selectedPartyId)?.name || ''}`
                : 'تقرير الحسابات الجارية ومسحوبات الشركاء'
            }
            subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
            summaryStats={
              selectedPartyId
                ? [
                    { label: 'اسم الشريك / الطرف', value: parties.find(p => p.id === selectedPartyId)?.name || '-' },
                    { label: 'إجمالي المسحوب (مدين)', value: formatCurrency(selectedPartyDebit, pharmacyProfile.currency) },
                    { label: 'إجمالي المردود (دائن)', value: formatCurrency(selectedPartyCredit, pharmacyProfile.currency) },
                    { label: 'صافي الرصيد', value: formatCurrency(selectedPartyNet, pharmacyProfile.currency) }
                  ]
                : [
                    { label: 'إجمالي السحب والمسحوبات (مدين)', value: formatCurrency(totalDebit, pharmacyProfile.currency) },
                    { label: 'إجمالي المسدد والمردود (دائن)', value: formatCurrency(totalCredit, pharmacyProfile.currency) },
                    { label: 'صافي الحسابات الجارية', value: formatCurrency(totalNet, pharmacyProfile.currency) }
                  ]
            }
          />
          <button
            onClick={() => setShowPartyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            + إضافة شريك / طرف
          </button>
          
          <button
            onClick={() => {
              setEditingId(null);
              setFormAmount('');
              setFormNotes('');
              setFormSubTag('');
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            + تسجيل قيد جاري (سحب / رد)
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              إجمالي السحب والمسحوبات (مدين Debit)
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
            {formatCurrency(totalDebit, pharmacyProfile.currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              إجمالي المسدد والمردود (دائن Credit)
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
            {formatCurrency(totalCredit, pharmacyProfile.currency)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
            <span>صافي رصيد الشركاء والمسؤول</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">يغذي الداشبورد</span>
          </div>
          <div className="text-2xl font-black text-white font-mono-num mt-2">
            {formatCurrency(totalNet, pharmacyProfile.currency)}
          </div>
        </div>
      </div>

      {/* Party Switcher Tabs */}
      <div className="no-print flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setSelectedPartyId('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedPartyId === ''
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          كافة الشركاء والحسابات ({periodLedgers.length})
        </button>

        {parties.map(party => {
          const count = periodLedgers.filter(r => r.partyId === party.id).length;
          const isSel = selectedPartyId === party.id;
          return (
            <button
              key={party.id}
              onClick={() => setSelectedPartyId(party.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSel
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{party.name}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <div className="no-print bg-slate-50 p-5 rounded-2xl border-2 border-blue-500 shadow-sm animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>{editingId ? 'تعديل قيد جاري' : 'تسجيل سحب أو رد بحساب الشريك / المسؤول'}</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نوع القيد:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('debit')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    formType === 'debit'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🔴 سحب / مدين (عليه)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('credit')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    formType === 'credit'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  🟢 سداد / دائن (له)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الحساب / الشريك:</label>
              <select
                required
                value={formPartyId}
                onChange={(e) => setFormPartyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm font-bold bg-white"
              >
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
                placeholder="مثال: 3000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-base font-bold font-mono-num bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">طريقة السحب / السداد:</label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value as PersonalLedgerRecord['method'])}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm bg-white"
              >
                <option value="cash">نقدي (كاش من الدرج)</option>
                <option value="instapay">انستاباي (InstaPay)</option>
                <option value="wallet">محفظة رقمية</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                بند فرعي / تصنيف (مثل "مصباح"):
              </label>
              <input
                type="text"
                list="subtags-list"
                value={formSubTag}
                onChange={(e) => setFormSubTag(e.target.value)}
                placeholder="مثال: مصباح، تحويل بنكي خاص..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm bg-white"
              />
              <datalist id="subtags-list">
                <option value="مصباح" />
                <option value="مسحوبات شخصية" />
                <option value="سداد نقدي" />
                <option value="د. حبيب - انستا" />
              </datalist>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات:</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="أي تفاصيل حول هذا السحب أو السداد..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm bg-white"
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
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {editingId ? 'حفظ التعديلات' : 'تسجيل القيد الجاري'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-tag filter if exists */}
      {uniqueSubTags.length > 0 && (
        <div className="no-print flex items-center gap-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <Split className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">تصفية حسب البند الفرعي:</span>
          <select
            value={filterSubTag}
            onChange={(e) => setFilterSubTag(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            <option value="all">كافة البنود الفرعية</option>
            {uniqueSubTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      )}

      {/* Transactions Table */}
      <div className="printable-table-container bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">اسم الشريك / الطرف</th>
                <th className="py-3 px-4">الطريقة</th>
                <th className="py-3 px-4 text-rose-700 print:text-black">مسحوب / مدين (Debit)</th>
                <th className="py-3 px-4 text-emerald-700 print:text-black">مسدد / دائن (Credit)</th>
                <th className="py-3 px-4">الرصيد الجاري</th>
                <th className="py-3 px-4">البند الفرعي والملاحظات</th>
                <th className="py-3 px-4 text-center no-print-action">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    لا توجد حركات مسجلة لهذا الحساب في هذا الشهر.
                  </td>
                </tr>
              ) : (
                filteredLedgers.map(r => {
                  const party = parties.find(p => p.id === r.partyId);
                  const running = runningMap.get(r.id) ?? 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        {formatDateArabic(r.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        {party?.name || 'الشريك'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {r.method === 'cash' ? 'نقدي (كاش)' : r.method === 'instapay' ? 'انستاباي' : r.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-700 font-mono-num text-sm">
                        {r.debit > 0 ? formatCurrency(r.debit, pharmacyProfile.currency) : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-700 font-mono-num text-sm">
                        {r.credit > 0 ? formatCurrency(r.credit, pharmacyProfile.currency) : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800 font-mono-num">
                        {formatCurrency(running, pharmacyProfile.currency)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {r.subAccountTag && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[11px] ml-1">
                            {r.subAccountTag}
                          </span>
                        )}
                        {r.notes || ''}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center no-print-action">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا القيد الجاري؟')) {
                                deletePersonalLedger(r.id);
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
            {filteredLedgers.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                  <td colSpan={3} className="py-2.5 px-4 text-right">المجموع الكلي:</td>
                  <td className="py-2.5 px-4 font-mono-num font-black text-rose-800 print:text-black">
                    {formatCurrency(filteredLedgers.reduce((s, r) => s + (Number(r.debit) || 0), 0), pharmacyProfile.currency)}
                  </td>
                  <td className="py-2.5 px-4 font-mono-num font-black text-emerald-800 print:text-black">
                    {formatCurrency(filteredLedgers.reduce((s, r) => s + (Number(r.credit) || 0), 0), pharmacyProfile.currency)}
                  </td>
                  <td colSpan={3} className="py-2.5 px-4 no-print-action"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Party Modal */}
      {showPartyModal && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>إضافة طرف / شريك جديد للحسابات</span>
            </h3>

            <form onSubmit={handleCreateParty} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم:</label>
                <input
                  type="text"
                  required
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  placeholder="مثال: د. حبيب، د. مصباح، د. أشرف..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصفة / الدور:</label>
                <select
                  value={newPartyRole}
                  onChange={(e) => setNewPartyRole(e.target.value as Party['role'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="partner">شريك رئيسي</option>
                  <option value="responsible">شخص مسؤول / عهدة</option>
                  <option value="sub_account">حساب فرعي مرتبط</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل:</label>
                <input
                  type="text"
                  value={newPartyPhone}
                  onChange={(e) => setNewPartyPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPartyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ الطرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Signatures */}
      <PrintSignatures />

    </div>
  );
};
