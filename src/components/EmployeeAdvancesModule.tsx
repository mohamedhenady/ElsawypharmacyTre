import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { Employee, EmployeeAdvanceRecord } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Filter,
  UserPlus,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

export const EmployeeAdvancesModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    employees,
    employeeAdvances,
    addEmployeeAdvance,
    updateEmployeeAdvance,
    deleteEmployeeAdvance,
    addEmployee,
    updateEmployee,
    deleteEmployee
  } = useTreasury();

  const [activeSubTab, setActiveSubTab] = useState<'advances' | 'master' | 'statement'>('advances');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // Advance Form State
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [editingAdvanceId, setEditingAdvanceId] = useState<string | null>(null);
  const [advDate, setAdvDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [advEmployeeId, setAdvEmployeeId] = useState<string>(employees[0]?.id || '');
  const [advType, setAdvType] = useState<'withdrawn' | 'returned'>('withdrawn');
  const [advAmount, setAdvAmount] = useState<string>('');
  const [advMethod, setAdvMethod] = useState<EmployeeAdvanceRecord['method']>('cash');
  const [advNotes, setAdvNotes] = useState<string>('');

  // Employee Master Modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [empName, setEmpName] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empLimit, setEmpLimit] = useState('');
  const [empNotes, setEmpNotes] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const periodAdvances = employeeAdvances.filter(a => a.periodId === currentPeriod.id);

  const totalWithdrawn = periodAdvances.reduce((s, a) => s + (Number(a.withdrawnAmount) || 0), 0);
  const totalReturned = periodAdvances.reduce((s, a) => s + (Number(a.returnedAmount) || 0), 0);
  const totalNet = totalWithdrawn - totalReturned;

  const filteredAdvances = periodAdvances.filter(a => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const emp = employees.find(e => e.id === a.employeeId);
      const eName = emp?.name.toLowerCase() || '';
      const notes = a.notes?.toLowerCase() || '';
      if (!eName.includes(q) && !notes.includes(q)) return false;
    }
    return true;
  });

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(advAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!advEmployeeId) {
      alert('يرجى اختيار الموظف');
      return;
    }

    const withdrawn = advType === 'withdrawn' ? amt : 0;
    const returned = advType === 'returned' ? amt : 0;

    if (editingAdvanceId) {
      updateEmployeeAdvance(editingAdvanceId, {
        employeeId: advEmployeeId,
        date: advDate,
        method: advMethod,
        withdrawnAmount: withdrawn,
        returnedAmount: returned,
        notes: advNotes
      });
      setEditingAdvanceId(null);
    } else {
      addEmployeeAdvance({
        periodId: currentPeriod.id,
        employeeId: advEmployeeId,
        date: advDate,
        method: advMethod,
        withdrawnAmount: withdrawn,
        returnedAmount: returned,
        notes: advNotes
      });
    }

    setAdvAmount('');
    setAdvNotes('');
    setShowAdvanceForm(false);
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) return;

    if (editingEmployeeId) {
      updateEmployee(editingEmployeeId, {
        name: empName,
        jobTitle: empTitle,
        phone: empPhone,
        maxAdvanceLimit: parseFloat(empLimit) || undefined,
        notes: empNotes
      });
      setEditingEmployeeId(null);
    } else {
      addEmployee({
        name: empName,
        jobTitle: empTitle,
        phone: empPhone,
        maxAdvanceLimit: parseFloat(empLimit) || undefined,
        notes: empNotes
      });
    }

    setEmpName('');
    setEmpTitle('');
    setEmpPhone('');
    setEmpLimit('');
    setEmpNotes('');
    setShowEmployeeModal(false);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setEmpName(emp.name);
    setEmpTitle(emp.jobTitle || '');
    setEmpPhone(emp.phone || '');
    setEmpLimit(emp.maxAdvanceLimit ? String(emp.maxAdvanceLimit) : '');
    setEmpNotes(emp.notes || '');
    setShowEmployeeModal(true);
  };

  const openEditAdvance = (a: EmployeeAdvanceRecord) => {
    setEditingAdvanceId(a.id);
    setAdvEmployeeId(a.employeeId);
    setAdvDate(a.date);
    setAdvMethod(a.method);
    if (a.withdrawnAmount > 0) {
      setAdvType('withdrawn');
      setAdvAmount(String(a.withdrawnAmount));
    } else {
      setAdvType('returned');
      setAdvAmount(String(a.returnedAmount));
    }
    setAdvNotes(a.notes || '');
    setShowAdvanceForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header */}
      <PrintHeader
        title={
          activeSubTab === 'advances'
            ? 'تقرير سلف ومسحوبات فريق العمل والموظفين'
            : activeSubTab === 'master'
            ? 'دليل بيانات ورواتب ومسحوبات الموظفين'
            : `كشف حساب سلف الموظف: ${employees.find(e => e.id === selectedEmployeeId)?.name || ''}`
        }
        summaryStats={
          activeSubTab === 'statement'
            ? [
                { label: 'اسم الموظف', value: employees.find(e => e.id === selectedEmployeeId)?.name || '-' },
                { label: 'المسمى الوظيفي', value: employees.find(e => e.id === selectedEmployeeId)?.jobTitle || '-' },
                {
                  label: 'صافي السلفة المستحقة',
                  value: formatCurrency(
                    employeeAdvances
                      .filter(a => a.employeeId === selectedEmployeeId)
                      .reduce((s, a) => s + (Number(a.withdrawnAmount) || 0) - (Number(a.returnedAmount) || 0), 0),
                    pharmacyProfile.currency
                  )
                }
              ]
            : [
                { label: 'إجمالي المسحوب (سلف)', value: formatCurrency(totalWithdrawn, pharmacyProfile.currency) },
                { label: 'إجمالي المسدد والمخصوم', value: formatCurrency(totalReturned, pharmacyProfile.currency) },
                { label: 'صافي السلف للشهر', value: formatCurrency(totalNet, pharmacyProfile.currency) }
              ]
        }
      />

      {/* Top Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Briefcase className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">سلف ومسحوبات فريق العمل والموظفين</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل السلف المسحوبة وتوريدات الخصم والمردودات لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreparePrintButton
            label="تجهيز للطباعة"
            title={
              activeSubTab === 'advances'
                ? 'تقرير سلف ومسحوبات فريق العمل والموظفين'
                : activeSubTab === 'master'
                ? 'دليل بيانات ورواتب ومسحوبات الموظفين'
                : `كشف حساب سلف الموظف: ${employees.find(e => e.id === selectedEmployeeId)?.name || ''}`
            }
            subtitle={`الفترة المحاسبية: ${currentPeriod.name}`}
            summaryStats={
              activeSubTab === 'statement'
                ? [
                    { label: 'اسم الموظف', value: employees.find(e => e.id === selectedEmployeeId)?.name || '-' },
                    { label: 'المسمى الوظيفي', value: employees.find(e => e.id === selectedEmployeeId)?.jobTitle || '-' },
                    {
                      label: 'صافي السلفة المستحقة',
                      value: formatCurrency(
                        employeeAdvances
                          .filter(a => a.employeeId === selectedEmployeeId)
                          .reduce((s, a) => s + (Number(a.withdrawnAmount) || 0) - (Number(a.returnedAmount) || 0), 0),
                        pharmacyProfile.currency
                      )
                    }
                  ]
                : [
                    { label: 'إجمالي المسحوب (سلف)', value: formatCurrency(totalWithdrawn, pharmacyProfile.currency) },
                    { label: 'إجمالي المسدد والمخصوم', value: formatCurrency(totalReturned, pharmacyProfile.currency) },
                    { label: 'صافي السلف للشهر', value: formatCurrency(totalNet, pharmacyProfile.currency) }
                  ]
            }
          />
          <button
            onClick={() => {
              setEditingEmployeeId(null);
              setEmpName('');
              setEmpTitle('');
              setEmpPhone('');
              setEmpLimit('');
              setEmpNotes('');
              setShowEmployeeModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            + إضافة موظف جديد
          </button>
          
          <button
            onClick={() => {
              setEditingAdvanceId(null);
              setAdvAmount('');
              setAdvNotes('');
              setShowAdvanceForm(!showAdvanceForm);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            + تسجيل سلفة / خصم
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('advances')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'advances'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          سجل حركات السلف ({periodAdvances.length})
        </button>

        <button
          onClick={() => setActiveSubTab('master')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'master'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          دليل الموظفين ({employees.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('statement');
            if (!selectedEmployeeId && employees.length > 0) {
              setSelectedEmployeeId(employees[0].id);
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'statement'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          كشف حساب موظف تفصيلي
        </button>
      </div>

      {/* SUB-TAB 1: ADVANCES */}
      {activeSubTab === 'advances' && (
        <div className="space-y-4">
          
          {/* Summary Cards */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  إجمالي المسحوب (سلف)
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
                {formatCurrency(totalWithdrawn, pharmacyProfile.currency)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  إجمالي المردود أو المخصوم
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono-num mt-2">
                {formatCurrency(totalReturned, pharmacyProfile.currency)}
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-teal-100">
                <span>صافي سلف ومسحوبات الموظفين</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">يغذي الداشبورد</span>
              </div>
              <div className="text-2xl font-black text-white font-mono-num mt-2">
                {formatCurrency(totalNet, pharmacyProfile.currency)}
              </div>
            </div>
          </div>

          {/* Add / Edit Form */}
          {showAdvanceForm && (
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-teal-500 shadow-sm animate-in fade-in">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                <span>{editingAdvanceId ? 'تعديل سلفة موظف' : 'تسجيل سلفة جديدة أو رد سلفة'}</span>
              </h3>

              <form onSubmit={handleAdvanceSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdvType('withdrawn')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        advType === 'withdrawn'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🔴 سحب سلفة جديدة
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdvType('returned')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        advType === 'returned'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      🟢 رد / خصم من الراتب
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموظف:</label>
                  <select
                    required
                    value={advEmployeeId}
                    onChange={(e) => setAdvEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-sm font-bold bg-white"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} {e.jobTitle ? `(${e.jobTitle})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ ({pharmacyProfile.currency}):</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
                    placeholder="مثال: 500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-base font-bold font-mono-num bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-sm font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة التسليم:</label>
                  <select
                    value={advMethod}
                    onChange={(e) => setAdvMethod(e.target.value as EmployeeAdvanceRecord['method'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-sm bg-white"
                  >
                    <option value="cash">نقدي (كاش من الدرج)</option>
                    <option value="wallet">محفظة رقمية (فودافون كاش)</option>
                    <option value="instapay">انستاباي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات (مثال: سلفة، عجز شفت):</label>
                  <input
                    type="text"
                    value={advNotes}
                    onChange={(e) => setAdvNotes(e.target.value)}
                    placeholder="سبب السلفة أو توضيح..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-sm bg-white"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanceForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingAdvanceId ? 'حفظ التعديلات' : 'تسجيل الحركة'}
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
              placeholder="بحث باسم الموظف أو سبب السلفة (عجز شفت، سلفة راتب...)..."
              className="text-xs w-full focus:outline-none text-slate-800"
            />
          </div>

          {/* Advances Table */}
          <div className="printable-table-container bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">اسم الموظف</th>
                    <th className="py-3 px-4">طريقة التسليم</th>
                    <th className="py-3 px-4 text-rose-700 print:text-black">سلفة مسحوبة</th>
                    <th className="py-3 px-4 text-emerald-700 print:text-black">تم رده / خصمه</th>
                    <th className="py-3 px-4">الملاحظات</th>
                    <th className="py-3 px-4 text-center no-print-action">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAdvances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        لا توجد سلف مسجلة للموظفين في هذا الشهر.
                      </td>
                    </tr>
                  ) : (
                    filteredAdvances.map(a => {
                      const emp = employees.find(e => e.id === a.employeeId);
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                            {formatDateArabic(a.date)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                            {emp?.name || 'موظف'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                              {a.method === 'cash' ? 'نقدي (درج)' : a.method === 'wallet' ? 'محفظة' : 'انستاباي'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-700 font-mono-num text-sm">
                            {a.withdrawnAmount > 0 ? formatCurrency(a.withdrawnAmount, pharmacyProfile.currency) : '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-700 font-mono-num text-sm">
                            {a.returnedAmount > 0 ? formatCurrency(a.returnedAmount, pharmacyProfile.currency) : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {a.notes || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center no-print-action">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditAdvance(a)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                                title="تعديل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من حذف حركة السلفة هذه؟')) {
                                    deleteEmployeeAdvance(a.id);
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
                {filteredAdvances.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                      <td colSpan={3} className="py-2.5 px-4 text-right">المجموع الكلي:</td>
                      <td className="py-2.5 px-4 font-mono-num font-black text-rose-800 print:text-black">
                        {formatCurrency(filteredAdvances.reduce((s, a) => s + (Number(a.withdrawnAmount) || 0), 0), pharmacyProfile.currency)}
                      </td>
                      <td className="py-2.5 px-4 font-mono-num font-black text-emerald-800 print:text-black">
                        {formatCurrency(filteredAdvances.reduce((s, a) => s + (Number(a.returnedAmount) || 0), 0), pharmacyProfile.currency)}
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

      {/* SUB-TAB 2: EMPLOYEES MASTER DIRECTORY */}
      {activeSubTab === 'master' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => {
            const advs = employeeAdvances.filter(a => a.employeeId === emp.id);
            const totalWith = advs.reduce((s, a) => s + (Number(a.withdrawnAmount) || 0), 0);
            const totalRet = advs.reduce((s, a) => s + (Number(a.returnedAmount) || 0), 0);
            const netBalance = totalWith - totalRet;

            return (
              <div key={emp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{emp.name}</h4>
                      {emp.jobTitle && (
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">
                          الوظيفة: {emp.jobTitle}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditEmployee(emp)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الموظف "${emp.name}"؟`)) {
                            deleteEmployee(emp.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {emp.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    {emp.maxAdvanceLimit && (
                      <div className="text-slate-500">
                        الحد الأقصى للسلفة: {formatCurrency(emp.maxAdvanceLimit, pharmacyProfile.currency)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">صافي السلفة المستحقة:</div>
                    <div className={`text-sm font-bold font-mono-num ${netBalance > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                      {formatCurrency(netBalance, pharmacyProfile.currency)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmployeeId(emp.id);
                      setActiveSubTab('statement');
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-teal-700 underline cursor-pointer"
                  >
                    كشف الحساب ←
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 3: EMPLOYEE STATEMENT OF ACCOUNT */}
      {activeSubTab === 'statement' && (
        <div className="printable-table-container bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 no-print">اختر الموظف:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="no-print px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none text-sm font-bold bg-white"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} {e.jobTitle ? `(${e.jobTitle})` : ''}</option>
                ))}
              </select>
            </div>

            {selectedEmployeeId && (
              <div className="text-xs text-slate-500">
                صافي السلفة المستحقة على الموظف:{' '}
                <strong className="text-rose-700 font-mono-num text-sm print:text-black">
                  {formatCurrency(
                    employeeAdvances
                      .filter(a => a.employeeId === selectedEmployeeId)
                      .reduce((s, a) => s + (Number(a.withdrawnAmount) || 0) - (Number(a.returnedAmount) || 0), 0),
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
                  <th className="py-2.5 px-3 text-rose-700 print:text-black">سلفة مسحوبة</th>
                  <th className="py-2.5 px-3 text-emerald-700 print:text-black">مردود / مخصوم</th>
                  <th className="py-2.5 px-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {employeeAdvances
                  .filter(a => a.employeeId === selectedEmployeeId)
                  .map(a => (
                    <tr key={a.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{formatDateArabic(a.date)}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{a.periodId}</td>
                      <td className="py-2.5 px-3 font-bold font-mono-num text-rose-700 print:text-black">
                        {a.withdrawnAmount > 0 ? formatCurrency(a.withdrawnAmount, pharmacyProfile.currency) : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold font-mono-num text-emerald-700 print:text-black">
                        {a.returnedAmount > 0 ? formatCurrency(a.returnedAmount, pharmacyProfile.currency) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{a.notes || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              <span>{editingEmployeeId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد بالفريق'}</span>
            </h3>

            <form onSubmit={handleEmployeeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف:</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="مثال: أحمد سعيد، د. محمد عبد الله..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي / الشفت:</label>
                <input
                  type="text"
                  value={empTitle}
                  onChange={(e) => setEmpTitle(e.target.value)}
                  placeholder="مثال: مساعد صيدلي صباحي، صيدلي مسائي، مسؤول دليفري..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأقصى للسلفة ({pharmacyProfile.currency}):</label>
                <input
                  type="number"
                  value={empLimit}
                  onChange={(e) => setEmpLimit(e.target.value)}
                  placeholder="مثال: 1500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات:</label>
                <textarea
                  rows={2}
                  value={empNotes}
                  onChange={(e) => setEmpNotes(e.target.value)}
                  placeholder="تفاصيل الراتب، شروط الخصم..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ الموظف
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
