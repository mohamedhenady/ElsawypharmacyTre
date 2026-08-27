import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { Customer, CustomerDebtRecord } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Filter,
  UserPlus,
  Home,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

export const CustomerDebtsModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    customers,
    customerDebts,
    addCustomerDebt,
    updateCustomerDebt,
    deleteCustomerDebt,
    addCustomer,
    updateCustomer,
    deleteCustomer
  } = useTreasury();

  const [activeSubTab, setActiveSubTab] = useState<'debts' | 'master' | 'statement'>('debts');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Form State for debt movement
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [debtDate, setDebtDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [debtCustomerId, setDebtCustomerId] = useState<string>(customers[0]?.id || '');
  const [debtType, setDebtType] = useState<'debit' | 'credit'>('debit');
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [debtNotes, setDebtNotes] = useState<string>('');

  // Master Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custLimit, setCustLimit] = useState('');
  const [custNotes, setCustNotes] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const periodDebts = customerDebts.filter(d => d.periodId === currentPeriod.id);

  const totalDebit = periodDebts.reduce((s, d) => s + (Number(d.debit) || 0), 0);
  const totalCredit = periodDebts.reduce((s, d) => s + (Number(d.credit) || 0), 0);
  const totalNet = totalDebit - totalCredit;

  const filteredDebts = periodDebts.filter(d => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const c = customers.find(cust => cust.id === d.customerId);
      const cName = c?.name.toLowerCase() || '';
      const cAddr = c?.address?.toLowerCase() || '';
      const notes = d.notes?.toLowerCase() || '';
      if (!cName.includes(q) && !cAddr.includes(q) && !notes.includes(q)) return false;
    }
    return true;
  });

  const handleDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(debtAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!debtCustomerId) {
      alert('يرجى اختيار العميل');
      return;
    }

    const debitAmt = debtType === 'debit' ? amt : 0;
    const creditAmt = debtType === 'credit' ? amt : 0;

    if (editingDebtId) {
      updateCustomerDebt(editingDebtId, {
        customerId: debtCustomerId,
        date: debtDate,
        debit: debitAmt,
        credit: creditAmt,
        notes: debtNotes
      });
      setEditingDebtId(null);
    } else {
      addCustomerDebt({
        periodId: currentPeriod.id,
        customerId: debtCustomerId,
        date: debtDate,
        debit: debitAmt,
        credit: creditAmt,
        notes: debtNotes
      });
    }

    setDebtAmount('');
    setDebtNotes('');
    setShowDebtForm(false);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    if (editingCustomerId) {
      updateCustomer(editingCustomerId, {
        name: custName,
        address: custAddress,
        phone: custPhone,
        creditLimit: parseFloat(custLimit) || undefined,
        notes: custNotes
      });
      setEditingCustomerId(null);
    } else {
      addCustomer({
        name: custName,
        address: custAddress,
        phone: custPhone,
        creditLimit: parseFloat(custLimit) || undefined,
        notes: custNotes
      });
    }

    setCustName('');
    setCustAddress('');
    setCustPhone('');
    setCustLimit('');
    setCustNotes('');
    setShowCustomerModal(false);
  };

  const openEditCustomer = (c: Customer) => {
    setEditingCustomerId(c.id);
    setCustName(c.name);
    setCustAddress(c.address || '');
    setCustPhone(c.phone || '');
    setCustLimit(c.creditLimit ? String(c.creditLimit) : '');
    setCustNotes(c.notes || '');
    setShowCustomerModal(true);
  };

  const openEditDebt = (d: CustomerDebtRecord) => {
    setEditingDebtId(d.id);
    setDebtCustomerId(d.customerId);
    setDebtDate(d.date);
    if (d.debit > 0) {
      setDebtType('debit');
      setDebtAmount(String(d.debit));
    } else {
      setDebtType('credit');
      setDebtAmount(String(d.credit));
    }
    setDebtNotes(d.notes || '');
    setShowDebtForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header */}
      <PrintHeader
        title={
          activeSubTab === 'debts'
            ? 'تقرير ديون وسدادات العملاء (نوتة الآجل)'
            : activeSubTab === 'master'
            ? 'دليل بيانات وعناوين العملاء والديون'
            : `كشف حساب عميل: ${customers.find(c => c.id === selectedCustomerId)?.name || ''}`
        }
        summaryStats={
          activeSubTab === 'statement'
            ? [
                { label: 'اسم العميل', value: customers.find(c => c.id === selectedCustomerId)?.name || '-' },
                { label: 'العنوان', value: customers.find(c => c.id === selectedCustomerId)?.address || '-' },
                {
                  label: 'صافي المديونية',
                  value: formatCurrency(
                    customerDebts
                      .filter(d => d.customerId === selectedCustomerId)
                      .reduce((s, d) => s + (Number(d.debit) || 0) - (Number(d.credit) || 0), 0),
                    pharmacyProfile.currency
                  )
                }
              ]
            : [
                { label: 'إجمالي الديون الجديدة (مدين)', value: formatCurrency(totalDebit, pharmacyProfile.currency) },
                { label: 'إجمالي السدادات (دائن)', value: formatCurrency(totalCredit, pharmacyProfile.currency) },
                { label: 'صافي ديون العملاء', value: formatCurrency(totalNet, pharmacyProfile.currency) }
              ]
        }
      />

      {/* Top Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">ديون وحسابات العملاء (نوتة الأجل)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة ديون وسدادات أهالي المنطقة والعملاء (مثل: الشيخ زيزو، 163 شقة 51...) لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreparePrintButton
            label="تجهيز للطباعة"
            title={
              activeSubTab === 'statement'
                ? `كشف حساب ديون العميل: ${customers.find(c => c.id === selectedCustomerId)?.name || ''}`
                : activeSubTab === 'master'
                ? 'دليل بيانات وعناوين العملاء والديون'
                : 'كشف ديون وسدادات العملاء (نوتة الأجل)'
            }
            subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
            summaryStats={
              activeSubTab === 'statement'
                ? [
                    { label: 'اسم العميل', value: customers.find(c => c.id === selectedCustomerId)?.name || '-' },
                    { label: 'العنوان', value: customers.find(c => c.id === selectedCustomerId)?.address || '-' },
                    {
                      label: 'صافي المديونية',
                      value: formatCurrency(
                        customerDebts
                          .filter(d => d.customerId === selectedCustomerId)
                          .reduce((s, d) => s + (Number(d.debit) || 0) - (Number(d.credit) || 0), 0),
                        pharmacyProfile.currency
                      )
                    }
                  ]
                : [
                    { label: 'إجمالي الديون الجديدة (مدين)', value: formatCurrency(totalDebit, pharmacyProfile.currency) },
                    { label: 'إجمالي السدادات (دائن)', value: formatCurrency(totalCredit, pharmacyProfile.currency) },
                    { label: 'صافي ديون العملاء', value: formatCurrency(totalNet, pharmacyProfile.currency) }
                  ]
            }
          />
          <button
            onClick={() => {
              setEditingCustomerId(null);
              setCustName('');
              setCustAddress('');
              setCustPhone('');
              setCustLimit('');
              setCustNotes('');
              setShowCustomerModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            + إضافة عميل جديد
          </button>
          
          <button
            onClick={() => {
              setEditingDebtId(null);
              setDebtAmount('');
              setDebtNotes('');
              setShowDebtForm(!showDebtForm);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            + تسجيل حركة دين / سداد
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('debts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'debts'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          سجل حركات الشهر ({periodDebts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('master')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'master'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          دليل العملاء وعناوين الشقق ({customers.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('statement');
            if (!selectedCustomerId && customers.length > 0) {
              setSelectedCustomerId(customers[0].id);
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'statement'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          كشف حساب عميل تفصيلي
        </button>
      </div>

      {/* SUB-TAB 1: DEBTS MOVEMENTS */}
      {activeSubTab === 'debts' && (
        <div className="space-y-4">
          
          {/* Summary Cards */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  ديون جديدة (مدين)
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
                  سدادات محصلة (دائن)
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
                {formatCurrency(totalCredit, pharmacyProfile.currency)}
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-100">
                <span>صافي ديون العملاء للشهر</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">يغذي الداشبورد</span>
              </div>
              <div className="text-2xl font-black text-white font-mono-num mt-2">
                {formatCurrency(totalNet, pharmacyProfile.currency)}
              </div>
            </div>
          </div>

          {/* Add / Edit Movement Form */}
          {showDebtForm && (
            <div className="no-print bg-slate-50 p-5 rounded-2xl border-2 border-amber-500 shadow-sm animate-in fade-in">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>{editingDebtId ? 'تعديل حركة دين' : 'تسجيل دين جديد أو سداد لعميل'}</span>
              </h3>

              <form onSubmit={handleDebtSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDebtType('debit')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        debtType === 'debit'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🔴 دين جديد على العميل
                    </button>
                    <button
                      type="button"
                      onClick={() => setDebtType('credit')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        debtType === 'credit'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🟢 سداد من العميل
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العميل:</label>
                  <select
                    required
                    value={debtCustomerId}
                    onChange={(e) => setDebtCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm font-bold bg-white"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.address ? `(${c.address})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ ({pharmacyProfile.currency}):</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="مثال: 450"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-base font-bold font-mono-num bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={debtDate}
                    onChange={(e) => setDebtDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm font-semibold bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات / أصناف الأدوية:</label>
                  <input
                    type="text"
                    value={debtNotes}
                    onChange={(e) => setDebtNotes(e.target.value)}
                    placeholder="مثال: أدوية ضغط وسكر، حقن، سداد كاش..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm bg-white"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDebtForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingDebtId ? 'حفظ التعديلات' : 'تسجيل الحركة'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search Bar */}
          <div className="no-print flex items-center gap-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم العميل، العنوان (مثل 163 شقة 51) أو الأصناف..."
              className="text-xs w-full focus:outline-none text-slate-800"
            />
          </div>

          {/* Movements Table */}
          <div className="printable-table-container bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">اسم العميل</th>
                    <th className="py-3 px-4">العنوان / الشقة</th>
                    <th className="py-3 px-4 text-rose-700 print:text-black">دين جديد (مدين)</th>
                    <th className="py-3 px-4 text-emerald-700 print:text-black">سداد (دائن)</th>
                    <th className="py-3 px-4">ملاحظات والأصناف</th>
                    <th className="py-3 px-4 text-center no-print-action">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredDebts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        لا توجد حركات ديون عملاء مسجلة مطابقة في هذا الشهر.
                      </td>
                    </tr>
                  ) : (
                    filteredDebts.map(d => {
                      const cust = customers.find(c => c.id === d.customerId);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                            {formatDateArabic(d.date)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                            {cust?.name || 'عميل'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                            {cust?.address ? (
                              <span className="flex items-center gap-1">
                                <Home className="w-3.5 h-3.5 text-slate-400" />
                                {cust.address}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-700 font-mono-num text-sm">
                            {d.debit > 0 ? formatCurrency(d.debit, pharmacyProfile.currency) : '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-700 font-mono-num text-sm">
                            {d.credit > 0 ? formatCurrency(d.credit, pharmacyProfile.currency) : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {d.notes || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center no-print-action">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditDebt(d)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="تعديل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من حذف حركة الدين هذه؟')) {
                                    deleteCustomerDebt(d.id);
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
                {filteredDebts.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                      <td colSpan={3} className="py-2.5 px-4 text-right">المجموع الكلي:</td>
                      <td className="py-2.5 px-4 font-mono-num font-black text-rose-800 print:text-black">
                        {formatCurrency(filteredDebts.reduce((s, d) => s + (Number(d.debit) || 0), 0), pharmacyProfile.currency)}
                      </td>
                      <td className="py-2.5 px-4 font-mono-num font-black text-emerald-800 print:text-black">
                        {formatCurrency(filteredDebts.reduce((s, d) => s + (Number(d.credit) || 0), 0), pharmacyProfile.currency)}
                      </td>
                      <td colSpan={2} className="py-2.5 px-4 no-print-action"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: CUSTOMERS MASTER DIRECTORY */}
      {activeSubTab === 'master' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => {
            const debits = customerDebts.filter(d => d.customerId === c.id);
            const totalDeb = debits.reduce((s, d) => s + (Number(d.debit) || 0), 0);
            const totalCred = debits.reduce((s, d) => s + (Number(d.credit) || 0), 0);
            const currentBalance = totalDeb - totalCred;

            return (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                      {c.address && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Home className="w-3 h-3 text-slate-400" />
                          العنوان: {c.address}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCustomer(c)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف العميل "${c.name}"؟`)) {
                            deleteCustomer(c.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {c.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.creditLimit && (
                      <div className="text-slate-500">
                        الحد الائتماني: {formatCurrency(c.creditLimit, pharmacyProfile.currency)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">إجمالي المديونية الحالية:</div>
                    <div className={`text-sm font-bold font-mono-num ${currentBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {formatCurrency(currentBalance, pharmacyProfile.currency)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomerId(c.id);
                      setActiveSubTab('statement');
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-amber-700 underline cursor-pointer"
                  >
                    كشف الحساب ←
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 3: CUSTOMER STATEMENT OF ACCOUNT */}
      {activeSubTab === 'statement' && (
        <div className="printable-table-container bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 no-print">اختر العميل:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="no-print px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-600 focus:outline-none text-sm font-bold bg-white"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.address ? `(${c.address})` : ''}</option>
                ))}
              </select>
            </div>

            {selectedCustomerId && (
              <div className="text-xs text-slate-500">
                رصيد مديونية العميل الحالي:{' '}
                <strong className="text-rose-700 font-mono-num text-sm print:text-black">
                  {formatCurrency(
                    customerDebts
                      .filter(d => d.customerId === selectedCustomerId)
                      .reduce((s, d) => s + (Number(d.debit) || 0) - (Number(d.credit) || 0), 0),
                    pharmacyProfile.currency
                  )}
                </strong>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">الشهر</th>
                  <th className="py-2.5 px-3 text-rose-700 print:text-black">دين جديد (مدين)</th>
                  <th className="py-2.5 px-3 text-emerald-700 print:text-black">سداد (دائن)</th>
                  <th className="py-2.5 px-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customerDebts
                  .filter(d => d.customerId === selectedCustomerId)
                  .map(d => (
                    <tr key={d.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{formatDateArabic(d.date)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{d.periodId}</td>
                      <td className="py-2.5 px-3 font-bold font-mono-num text-rose-700 print:text-black">
                        {d.debit > 0 ? formatCurrency(d.debit, pharmacyProfile.currency) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono-num text-emerald-700 print:text-black">
                        {d.credit > 0 ? formatCurrency(d.credit, pharmacyProfile.currency) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{d.notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              <span>{editingCustomerId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد بنوتة الآجل'}</span>
            </h3>

            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل / اللقب:</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="مثال: الشيخ زيزو، مدام نادية الباشا..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان / رقم العمارة والشقة:</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="مثال: 163 شقة 51، عمارة 12 الدور 3..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل والدليفري:</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحد الائتماني الأقصى ({pharmacyProfile.currency}):</label>
                <input
                  type="number"
                  value={custLimit}
                  onChange={(e) => setCustLimit(e.target.value)}
                  placeholder="مثال: 3000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات خاصة بالعميل:</label>
                <textarea
                  rows={2}
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="مواعيد السداد، أمراض مزمنة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ العميل
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
