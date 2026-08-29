import React, { useState, useEffect, useRef } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import {
  TrendingUp,
  Truck,
  Receipt,
  Smartphone,
  UserCheck,
  Users,
  Briefcase,
  X,
  Plus,
  CheckCheck,
  ShieldCheck,
  CornerDownLeft,
  Command
} from 'lucide-react';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({ isOpen, onClose }) => {
  const formRef = useRef<HTMLFormElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const {
    pharmacyProfile,
    currentPeriod,
    addIncomeRecord,
    addSupplierPayment,
    addExpense,
    addWalletTransaction,
    addPersonalLedger,
    addCustomerDebt,
    addEmployeeAdvance,
    suppliers,
    expenseCategories,
    parties,
    customers,
    employees,
    hasPermission
  } = useTreasury();

  const allTabs = [
    { id: 'income', perm: 'income' as const, label: 'دخل وردية', icon: TrendingUp, color: 'text-emerald-600' },
    { id: 'supplier', perm: 'suppliers' as const, label: 'سداد مورد', icon: Truck, color: 'text-rose-600' },
    { id: 'expense', perm: 'expenses' as const, label: 'مصروف نثريات', icon: Receipt, color: 'text-blue-600' },
    { id: 'wallet', perm: 'wallet' as const, label: 'محفظة/إنستاباي', icon: Smartphone, color: 'text-purple-600' },
    { id: 'personal', perm: 'personal' as const, label: 'مسحوبات شريك', icon: UserCheck, color: 'text-indigo-600' },
    { id: 'customer', perm: 'customers' as const, label: 'دين عميل', icon: Users, color: 'text-amber-600' },
    { id: 'employee', perm: 'employees' as const, label: 'سلفة موظف', icon: Briefcase, color: 'text-teal-600' }
  ];

  const tabs = allTabs.filter(t => hasPermission(t.perm));

  const [activeType, setActiveType] = useState<
    'income' | 'supplier' | 'expense' | 'wallet' | 'personal' | 'customer' | 'employee'
  >(() => (tabs[0]?.id as any) || 'income');

  // If activeType is not permitted, switch to first allowed tab
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === activeType)) {
      setActiveType(tabs[0].id as any);
    }
  }, [tabs, activeType]);

  // Auto-focus amount field on open or type switch
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeType]);

  // Keyboard shortcuts listener: Esc to close, Enter/Ctrl+Enter to save, Alt+1..7 to switch tabs
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape -> close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // Alt + Number (1-7) -> switch active tab
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        const index = parseInt(e.key, 10) - 1;
        if (tabs[index]) {
          e.preventDefault();
          setActiveType(tabs[index].id as any);
          return;
        }
      }

      // Ctrl+Enter or Cmd+Enter -> submit form immediately
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, tabs]);

  // Common fields
  const [date, setDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Income specific
  const [shiftType, setShiftType] = useState<'morning' | 'evening'>('morning');
  const [cashierName, setCashierName] = useState<string>('د. أحمد');
  const [posSales, setPosSales] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | 'visa'>('cash');

  // Supplier specific
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [repName, setRepName] = useState<string>('');
  const [supplierVerified, setSupplierVerified] = useState<boolean>(true);

  // Expense specific
  const [categoryId, setCategoryId] = useState<string>(expenseCategories[0]?.id || '');
  const [itemName, setItemName] = useState<string>('');

  // Wallet specific
  const [walletMethod, setWalletMethod] = useState<'instapay' | 'vodafone_cash' | 'bank_transfer' | 'orange_cash' | 'etisalat_cash' | 'wallet'>('instapay');
  const [walletDirection, setWalletDirection] = useState<'in' | 'out'>('in');
  const [walletTag, setWalletTag] = useState<string>('');

  // Personal Ledger specific
  const [partyId, setPartyId] = useState<string>(parties[0]?.id || '');
  const [personalType, setPersonalType] = useState<'debit' | 'credit'>('debit');
  const [subAccountTag, setSubAccountTag] = useState<string>('');

  // Customer debt specific
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || '');
  const [debtType, setDebtType] = useState<'debit' | 'credit'>('debit');

  // Employee advance specific
  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id || '');
  const [advanceType, setAdvanceType] = useState<'withdrawn' | 'returned'>('withdrawn');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (activeType === 'income') {
      addIncomeRecord({
        periodId: currentPeriod.id,
        date,
        shiftType,
        amount: amt,
        cashierName,
        posReportedSales: parseFloat(posSales) || undefined,
        paymentMethod,
        notes
      });
    } else if (activeType === 'supplier') {
      if (!supplierId) {
        alert('يرجى اختيار المورد');
        return;
      }
      addSupplierPayment({
        periodId: currentPeriod.id,
        supplierId,
        date,
        amount: amt,
        invoiceNumber,
        representativeName: repName,
        paymentMethod: paymentMethod === 'vodafone_cash' ? 'vodafone_cash' : paymentMethod === 'instapay' ? 'instapay' : 'cash',
        notes,
        verified: supplierVerified
      });
    } else if (activeType === 'expense') {
      if (!itemName.trim()) {
        alert('يرجى كتابة اسم البند');
        return;
      }
      addExpense({
        periodId: currentPeriod.id,
        date,
        categoryId: categoryId || expenseCategories[0]?.id || '',
        itemName,
        amount: amt,
        paymentMethod: paymentMethod === 'vodafone_cash' ? 'wallet' : paymentMethod === 'instapay' ? 'instapay' : 'cash',
        notes
      });
    } else if (activeType === 'wallet') {
      const cleanLabel = (walletTag.trim() || notes.trim());
      addWalletTransaction({
        periodId: currentPeriod.id,
        date,
        method: walletMethod,
        inAmount: walletDirection === 'in' ? amt : 0,
        outAmount: walletDirection === 'out' ? amt : 0,
        tag: cleanLabel,
        notes: cleanLabel
      });
    } else if (activeType === 'personal') {
      if (!partyId) {
        alert('يرجى اختيار الشريك / الطرف');
        return;
      }
      addPersonalLedger({
        periodId: currentPeriod.id,
        partyId,
        date,
        method: paymentMethod === 'instapay' ? 'instapay' : paymentMethod === 'vodafone_cash' ? 'wallet' : 'cash',
        debit: personalType === 'debit' ? amt : 0,
        credit: personalType === 'credit' ? amt : 0,
        subAccountTag,
        notes
      });
    } else if (activeType === 'customer') {
      if (!customerId) {
        alert('يرجى اختيار العميل');
        return;
      }
      addCustomerDebt({
        periodId: currentPeriod.id,
        customerId,
        date,
        debit: debtType === 'debit' ? amt : 0,
        credit: debtType === 'credit' ? amt : 0,
        notes
      });
    } else if (activeType === 'employee') {
      if (!employeeId) {
        alert('يرجى اختيار الموظف');
        return;
      }
      addEmployeeAdvance({
        periodId: currentPeriod.id,
        employeeId,
        date,
        method: paymentMethod === 'vodafone_cash' ? 'wallet' : paymentMethod === 'instapay' ? 'instapay' : 'cash',
        withdrawnAmount: advanceType === 'withdrawn' ? amt : 0,
        returnedAmount: advanceType === 'returned' ? amt : 0,
        notes
      });
    }

    setAmount('');
    setNotes('');
    setItemName('');
    setInvoiceNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>تسجيل حركة مالية سريعة</span>
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono font-bold border border-slate-200">
                <kbd>Enter ↵</kbd> للحفظ | <kbd>Esc</kbd> للإغلاق
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              إضافة قيد مباشر لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            title="إغلاق (Esc)"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Esc</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 my-4 bg-slate-100 p-1.5 rounded-2xl">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isSel = activeType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id as any)}
                title={`التبويب ${tab.label} (Alt+${idx + 1})`}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer relative group ${
                  isSel
                    ? 'bg-white text-slate-900 shadow-xs scale-102'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="absolute top-1 left-1 text-[9px] font-mono text-slate-400 opacity-60 group-hover:opacity-100">
                  {idx + 1}
                </span>
                <Icon className={`w-4 h-4 ${isSel ? tab.color : 'text-slate-400'}`} />
                <span className="text-[11px] truncate w-full text-center">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المطلوب ({pharmacyProfile.currency}):
              </label>
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-500 focus:border-emerald-700 focus:outline-none text-lg font-bold font-mono-num bg-emerald-50/20 text-slate-900"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

          </div>

          {/* Conditional inputs per type */}
          {activeType === 'income' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الشفت:</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as 'morning' | 'evening')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="morning">صباحي (Morning)</option>
                  <option value="evening">مسائي (Evening)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الكاشير / الصيدلي:</label>
                <input
                  type="text"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="cash">نقدي (كاش)</option>
                  <option value="vodafone_cash">فودافون كاش</option>
                  <option value="instapay">انستاباي</option>
                  <option value="visa">فيزا</option>
                </select>
              </div>
            </div>
          )}

          {activeType === 'supplier' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد / الشركة:</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة / الإيصال:</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="اختياري"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المندوب / المحصل:</label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="اختياري"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Accountant Verification Checkbox */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={supplierVerified}
                    onChange={(e) => setSupplierVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    تم التحقق ومطابقة السداد بواسطة المحاسب
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  supplierVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {supplierVerified ? 'متحقق منه' : 'قيد المراجعة'}
                </span>
              </div>
            </div>
          )}

          {activeType === 'expense' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم البند (نص حر):</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="مثال: نظافة، بوفيه، أكياس، إيجار..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف:</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeType === 'wallet' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setWalletDirection('in')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      walletDirection === 'in' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    داخل (In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletDirection('out')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      walletDirection === 'out' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    خارج (Out)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القناة / الطريقة:</label>
                <select
                  value={walletMethod}
                  onChange={(e) => setWalletMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                >
                  <option value="instapay">انستاباي</option>
                  <option value="vodafone_cash">فودافون كاش</option>
                  <option value="orange_cash">أورنج كاش</option>
                  <option value="etisalat_cash">اتصالات كاش</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">الملاحظات والبيان (الوسم - اختياري):</label>
                  <span className="text-[10px] text-slate-400">يمكن تركه فارغاً</span>
                </div>
                <input
                  type="text"
                  value={walletTag}
                  onChange={(e) => setWalletTag(e.target.value)}
                  placeholder="اكتب الملاحظة أو اختر وسماً سريعاً (أو اتركه فارغاً)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-purple-600 focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">وسوم وملاحظات مقترحة:</span>
                  {['تحويل دخل', 'سداد مورد', 'د. حبيب', 'استبدال كاش', 'عميل', 'مصاريف تحويل'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setWalletTag(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        walletTag === tag ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {walletTag && (
                    <button
                      type="button"
                      onClick={() => setWalletTag('')}
                      className="text-[10px] text-rose-500 hover:underline px-1 cursor-pointer"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeType === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع القيد:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setPersonalType('debit')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      personalType === 'debit' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    سحب (مدين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonalType('credit')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      personalType === 'credit' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    رد (دائن)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحساب / الشريك:</label>
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بند فرعي (مثل: مصباح):</label>
                <input
                  type="text"
                  value={subAccountTag}
                  onChange={(e) => setSubAccountTag(e.target.value)}
                  placeholder="اختياري"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>
          )}

          {activeType === 'customer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setDebtType('debit')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      debtType === 'debit' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    دين جديد (مدين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType('credit')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      debtType === 'credit' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    سداد دين (دائن)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العميل:</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.address ? `(${c.address})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeType === 'employee' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setAdvanceType('withdrawn')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      advanceType === 'withdrawn' ? 'bg-rose-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    سحب سلفة
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceType('returned')}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${
                      advanceType === 'returned' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    خصم / رد سلفة
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الموظف:</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} {emp.jobTitle ? `(${emp.jobTitle})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes (for other types) */}
          {activeType !== 'wallet' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وبيان الحركة:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي تفاصيل أو أرقام فواتير أو أسماء..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-xs bg-white"
              />
            </div>
          )}

          {/* Submit & Shortcut hints footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono">
                <CornerDownLeft className="w-3 h-3 text-emerald-600" />
                <span>Enter</span>
              </span>
              <span className="hidden sm:inline">للحفظ المباشر</span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono">
                <span>Esc</span>
              </span>
              <span className="hidden sm:inline">للإغلاق</span>
            </div>

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                title="إلغاء وإغلاق (Esc)"
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>إلغاء</span>
                <kbd className="text-[10px] bg-slate-200/80 px-1 py-0.2 rounded text-slate-500 font-mono">Esc</kbd>
              </button>
              <button
                type="submit"
                title="حفظ وتسجيل الحركة (Enter)"
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <span>حفظ وتسجيل الحركة</span>
                <kbd className="text-[10px] bg-emerald-700/80 text-emerald-100 px-1.5 py-0.2 rounded font-mono font-bold">↵ Enter</kbd>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
