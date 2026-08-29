import React, { useState, useMemo } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency } from '../utils/formatters';
import { DrawerShift, DrawerExpenseCategory, ShiftType } from '../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import {
  Vault,
  Clock,
  User,
  PlusCircle,
  Trash2,
  Lock,
  Unlock,
  Printer,
  Calendar,
  Layers,
  ArrowDownRight,
  TrendingDown,
  Coins,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Truck,
  Briefcase,
  Users,
  Search,
  History,
  RotateCcw,
  CreditCard,
  Calculator,
  ArrowUpRight,
  BadgeDollarSign,
  ShieldCheck,
  UserCheck,
  Check,
  AlertTriangle,
  Wallet
} from 'lucide-react';

export const DrawerModule: React.FC = () => {
  const {
    pharmacyProfile,
    drawerShifts,
    activeShift,
    openShift,
    addDrawerExpense,
    removeDrawerExpense,
    addInstaPayTransfer,
    removeInstaPayTransfer,
    addWalletTransfer,
    removeWalletTransfer,
    closeShift,
    reopenShift,
    deleteDrawerShift,
    approveAndDistributeShift,
    lastClosedShift,
    suppliers,
    employees,
    customers,
    customerDebts,
    expenseCategories,
    parties,
    currentUser,
    users,
    addCustomer,
    addSupplier
  } = useTreasury();

  const isManager = currentUser.role === 'manager';

  const [activeSubTab, setActiveSubTab] = useState<'current' | 'review' | 'history'>('current');
  const [selectedShiftForReceipt, setSelectedShiftForReceipt] = useState<DrawerShift | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // List of registered pharmacists for shift duty (ONLY from registered system users)
  const registeredPharmacists = useMemo(() => {
    return users
      .filter(u => u.role === 'pharmacist' || u.role === 'manager')
      .map(u => ({
        id: u.id,
        name: u.name,
        role: u.role === 'manager' ? 'المدير العام' : (u.jobTitle || 'صيدلي')
      }));
  }, [users]);

  // New Shift Form State
  const defaultOpeningBal = lastClosedShift ? lastClosedShift.leftInDrawer : 500;
  const [newShiftType, setNewShiftType] = useState<ShiftType>('morning');
  const [newShiftDate, setNewShiftDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newShiftTime, setNewShiftTime] = useState<string>(
    new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  );
  const [newShiftDay, setNewShiftDay] = useState<string>(
    new Date().toLocaleDateString('ar-EG', { weekday: 'long' })
  );
  
  // Default pharmacist selection to current logged in user or first pharmacist
  const [selectedPharmacistName, setSelectedPharmacistName] = useState<string>(() => {
    const match = registeredPharmacists.find(p => p.name === currentUser.name || p.id === currentUser.id);
    return match ? match.name : (registeredPharmacists[0]?.name || 'د. حسن');
  });

  const [newOpeningBalance, setNewOpeningBalance] = useState<string>(String(defaultOpeningBal));
  const [newShiftNotes, setNewShiftNotes] = useState<string>('');

  // Add Cash Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<DrawerExpenseCategory>('general');
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseTargetId, setExpenseTargetId] = useState<string>('');
  const [expenseNotes, setExpenseNotes] = useState<string>('');

  // Quick New Customer inline creation state
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [newCustomerAddress, setNewCustomerAddress] = useState<string>('');

  // Quick New Supplier inline creation state
  const [newSupplierName, setNewSupplierName] = useState<string>('');
  const [newSupplierPhone, setNewSupplierPhone] = useState<string>('');

  // Calculate real-time net debt for all customers (from initial balance + customerDebts records)
  const customerDebtMap = useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach(c => {
      map[c.id] = Number(c.balance) || 0;
    });
    customerDebts.forEach(d => {
      if (d.customerId) {
        const debit = Number(d.debit) || 0;
        const credit = Number(d.credit) || 0;
        map[d.customerId] = (map[d.customerId] || 0) + (debit - credit);
      }
    });
    return map;
  }, [customers, customerDebts]);

  // Find selected customer for debt alert note
  const selectedCustomerInfo = useMemo(() => {
    if (expenseCategory !== 'customer_debt' || !expenseTargetId || expenseTargetId === 'NEW_CUSTOMER') return null;
    const cust = customers.find(c => c.id === expenseTargetId) || null;
    if (!cust) return null;
    return {
      ...cust,
      currentNetDebt: customerDebtMap[cust.id] || 0
    };
  }, [expenseCategory, expenseTargetId, customers, customerDebtMap]);

  // Add InstaPay Transfer Form State
  const [instaAmount, setInstaAmount] = useState<string>('');
  const [instaSender, setInstaSender] = useState<string>('');
  const [instaNotes, setInstaNotes] = useState<string>('');

  // Add Digital Wallet (Vodafone Cash / Wallets) Transfer Form State
  const [walletAmount, setWalletAmount] = useState<string>('');
  const [walletSender, setWalletSender] = useState<string>('');
  const [walletNotes, setWalletNotes] = useState<string>('');

  // Close Shift Form State
  const [transferredToVaultInput, setTransferredToVaultInput] = useState<string>('');
  const [leftInDrawerInput, setLeftInDrawerInput] = useState<string>('500');
  const [distributeToModules, setDistributeToModules] = useState<boolean>(true);
  const [lockAccountOnClose, setLockAccountOnClose] = useState<boolean>(true);
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState<boolean>(false);

  // History Search & Filter State
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historyFilterPharmacist, setHistoryFilterPharmacist] = useState<string>('all');
  const [historyFilterApproval, setHistoryFilterApproval] = useState<'all' | 'pending' | 'approved'>('all');

  // Pending shifts count (closed shifts waiting for manager approval & distribution)
  const pendingReviewShifts = useMemo(() => {
    return drawerShifts.filter(s => s.status === 'closed' && !s.isApprovedByManager);
  }, [drawerShifts]);

  // State for focused entry mode: Expenses, InstaPay, Digital Wallets, Settlement
  const [activeEntryMode, setActiveEntryMode] = useState<'expense' | 'instapay' | 'wallet' | 'settlement'>('expense');

  // Helper to format pharmacist title cleanly without duplication
  const getFormattedPharmacistName = (name?: string) => {
    if (!name) return '';
    const trimmed = name.trim();
    if (trimmed.startsWith('د.') || trimmed.startsWith('دكتور') || trimmed.startsWith('دكتورة') || trimmed.startsWith('أ.')) {
      return trimmed;
    }
    return `د. ${trimmed}`;
  };

  // Handle Opening a new Shift
  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmacistName.trim()) {
      alert('يرجى اختيار اسم الصيدلي المناوب المسجل');
      return;
    }
    const bal = parseFloat(newOpeningBalance) || 0;
    const foundPharm = registeredPharmacists.find(p => p.name === selectedPharmacistName);

    openShift({
      date: newShiftDate,
      time: newShiftTime,
      dayName: newShiftDay,
      pharmacistName: selectedPharmacistName,
      pharmacistId: foundPharm?.id || currentUser.id,
      shiftType: newShiftType,
      openingBalance: bal,
      notes: newShiftNotes
    });
    setTransferredToVaultInput('');
    setLeftInDrawerInput(String(bal > 0 ? bal : 500));
  };

  // Handle Adding Cash Expense Item to active shift
  const handleAddExpenseItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!amountNum || amountNum <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    let resolvedTargetId = expenseTargetId;
    let resolvedTitle = expenseTitle.trim();

    // 1. Handle New Customer creation
    if (expenseCategory === 'customer_debt') {
      if (expenseTargetId === 'NEW_CUSTOMER') {
        if (!newCustomerName.trim()) {
          alert('يرجى كتابة اسم العميل الجديد');
          return;
        }
        // Create new customer record
        const createdCust = addCustomer({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
          address: newCustomerAddress.trim() || undefined,
          balance: 0,
          notes: 'تم تسجيله كعميل جديد عبر وردية الدرج'
        });
        resolvedTargetId = createdCust.id;
        resolvedTitle = `دين عميل: ${newCustomerName.trim()}`;
      } else if (!resolvedTitle) {
        const cust = customers.find(c => c.id === expenseTargetId);
        resolvedTitle = cust ? `دين عميل: ${cust.name}` : 'دين عميل';
      }
    }

    // 2. Handle New Supplier creation
    else if (expenseCategory === 'supplier') {
      if (expenseTargetId === 'NEW_SUPPLIER') {
        if (!newSupplierName.trim()) {
          alert('يرجى كتابة اسم الشركة أو المورد الجديد');
          return;
        }
        const createdSup = addSupplier({
          name: newSupplierName.trim(),
          phone: newSupplierPhone.trim() || undefined,
          companyType: 'أدوية',
          balance: 0
        });
        resolvedTargetId = createdSup.id;
        resolvedTitle = `سداد شركة ${newSupplierName.trim()}`;
      } else if (!resolvedTitle) {
        const supp = suppliers.find(s => s.id === expenseTargetId);
        resolvedTitle = supp ? `سداد شركة ${supp.name}` : 'سداد شركة / مورد';
      }
    }

    // 3. Other categories fallback titles
    else if (!resolvedTitle) {
      if (expenseCategory === 'employee_advance') {
        const emp = employees.find(e => e.id === expenseTargetId);
        resolvedTitle = emp ? `سلفة: ${emp.name}` : 'سلفة موظف';
      } else if (expenseCategory === 'partner_withdrawal') {
        const part = parties.find(p => p.id === expenseTargetId);
        resolvedTitle = part ? `مسحوبات: ${part.name}` : 'مسحوبات مسؤول/شريك';
      } else {
        const cat = expenseCategories.find(c => c.id === expenseTargetId);
        resolvedTitle = cat ? `مصروف: ${cat.name}` : 'مصروف ونثريات';
      }
    }

    addDrawerExpense({
      title: resolvedTitle,
      amount: amountNum,
      category: expenseCategory,
      targetEntityId: resolvedTargetId && resolvedTargetId !== 'NEW_CUSTOMER' && resolvedTargetId !== 'NEW_SUPPLIER' ? resolvedTargetId : undefined,
      notes: expenseNotes.trim() || undefined
    });

    // Reset inputs
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseTargetId('');
    setExpenseNotes('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setNewSupplierName('');
    setNewSupplierPhone('');
  };

  // Handle Adding InstaPay Transfer to active shift
  const handleAddInstaPay = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(instaAmount);
    if (!amountNum || amountNum <= 0) {
      alert('يرجى إدخال مبلغ تحويل إنستاباي');
      return;
    }

    addInstaPayTransfer({
      amount: amountNum,
      sender: instaSender.trim() || 'تحويل إنستاباي عميل',
      method: 'instapay',
      notes: instaNotes.trim() || undefined
    });

    // Reset
    setInstaAmount('');
    setInstaSender('');
    setInstaNotes('');
  };

  // Handle Adding Digital Wallet Transfer (Vodafone Cash / Smart Wallets) to active shift
  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(walletAmount);
    if (!amountNum || amountNum <= 0) {
      alert('يرجى إدخال مبلغ تحويل المحفظة');
      return;
    }

    addWalletTransfer({
      amount: amountNum,
      sender: walletSender.trim() || 'تحويل محفظة كاش',
      notes: walletNotes.trim() || undefined
    });

    // Reset
    setWalletAmount('');
    setWalletSender('');
    setWalletNotes('');
  };

  // Handle Closing the Shift
  const handleExecuteCloseShift = () => {
    if (!activeShift) return;
    const transferred = parseFloat(transferredToVaultInput) || 0;
    const leftInDrawer = parseFloat(leftInDrawerInput) || 0;

    const closed = closeShift({
      leftInDrawer,
      transferredToVault: transferred,
      distributeToModules,
      lockAccountOnClose,
      notes: closeNotes
    });

    setIsConfirmCloseModalOpen(false);
    if (closed) {
      setSelectedShiftForReceipt(closed);
      setIsReceiptModalOpen(true);
    }
  };

  // Active shift calculations
  const activeCashExpenses = activeShift ? activeShift.totalExpenses || 0 : 0;
  const activeInstaPay = activeShift
    ? activeShift.totalInstaPay !== undefined
      ? activeShift.totalInstaPay
      : (activeShift.instaPayTransfers || []).reduce((s, t) => s + (Number(t.amount) || 0), 0)
    : 0;
  const activeWallet = activeShift
    ? activeShift.totalWallet !== undefined
      ? activeShift.totalWallet
      : (activeShift.walletTransfers || []).reduce((s, t) => s + (Number(t.amount) || 0), 0)
    : 0;
  const activeTransferred = parseFloat(transferredToVaultInput) || 0;
  const activeLeft = parseFloat(leftInDrawerInput) || 0;

  // Total shift sales: Expenses + InstaPay + Wallets + Left in drawer + Transferred to vault
  const computedShiftSales = activeCashExpenses + activeInstaPay + activeWallet + activeLeft + activeTransferred;

  // Filtered History
  const filteredHistory = useMemo(() => {
    return drawerShifts.filter(shift => {
      const matchSearch =
        shift.pharmacistName.toLowerCase().includes(historySearch.toLowerCase()) ||
        shift.date.includes(historySearch) ||
        (shift.notes && shift.notes.toLowerCase().includes(historySearch.toLowerCase()));

      const matchType = historyFilterType === 'all' || shift.shiftType === historyFilterType;
      const matchPharmacist =
        historyFilterPharmacist === 'all' ||
        shift.pharmacistName === historyFilterPharmacist;

      return matchSearch && matchType && matchPharmacist;
    });
  }, [drawerShifts, historySearch, historyFilterType, historyFilterPharmacist]);

  // Unique pharmacists for history filter
  const uniquePharmacists = useMemo(() => {
    const names = new Set<string>();
    drawerShifts.forEach(s => names.add(s.pharmacistName));
    return Array.from(names);
  }, [drawerShifts]);

  // Totals for history
  const historyStats = useMemo(() => {
    return filteredHistory.reduce(
      (acc, s) => {
        const sInsta = s.totalInstaPay !== undefined ? s.totalInstaPay : (s.instaPayTransfers || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const sWallet = s.totalWallet !== undefined ? s.totalWallet : (s.walletTransfers || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const sExpenses = s.totalExpenses || 0;
        const sLeft = s.leftInDrawer || 0;
        const sVault = s.transferredToVault || 0;
        const sSales = s.totalSales !== undefined && s.totalSales > 0 ? s.totalSales : (sExpenses + sInsta + sWallet + sLeft + sVault);

        acc.totalShifts += 1;
        acc.totalExpenses += sExpenses;
        acc.totalInstaPay += sInsta;
        acc.totalWallet += sWallet;
        acc.totalSales += sSales;
        acc.totalTransferred += sVault;
        acc.totalLeftInDrawer += sLeft;
        return acc;
      },
      { totalShifts: 0, totalExpenses: 0, totalInstaPay: 0, totalWallet: 0, totalSales: 0, totalTransferred: 0, totalLeftInDrawer: 0 }
    );
  }, [filteredHistory]);

  return (
    <div className="space-y-6">
      {/* Module Header with Sub-tabs */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Vault className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                مصروفات وإقفال درج النقدية
              </h1>
              {activeShift ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  وردية مفتوحة حالياً
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <Lock className="w-3 h-3" />
                  الدرج مقفل
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              تسجيل منصرفات الدرج وتحويلات إنستاباي، تحويل النقدية للخزانة، وتوليد ريسيت الوردية والمبيعات
            </p>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('current')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'current'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>الوردية الحالية للدرج</span>
          </button>

          {isManager && (
            <button
              onClick={() => setActiveSubTab('review')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                activeSubTab === 'review'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>مراجعة واعتماد الورديات</span>
              {pendingReviewShifts.length > 0 && (
                <span className="bg-amber-400 text-purple-950 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingReviewShifts.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-teal-600" />
            <span>سجل وأرشيف الورديات ({drawerShifts.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE CURRENT SHIFT */}
      {activeSubTab === 'current' && (
        <>
          {!activeShift ? (
            /* No Active Shift -> Form to Start New Shift */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">بدء وفتح وردية درج نقدية جديدة</h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      أدخل بيانات الشفت والصيدلي المناوب ورصيد استلام الدرج لبدء التسجيل
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleStartShift} className="p-5 sm:p-6 space-y-5">
                {/* 1. Shift Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    أولاً: بيانات الشفت (نوع الوردية)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewShiftType('morning')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newShiftType === 'morning'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">☀️</span>
                      <span className="text-xs font-bold">وردية صباحية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewShiftType('evening')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newShiftType === 'evening'
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">🌆</span>
                      <span className="text-xs font-bold">وردية مسائية</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewShiftType('night')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newShiftType === 'night'
                          ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">🌙</span>
                      <span className="text-xs font-bold">وردية ليلية</span>
                    </button>
                  </div>
                </div>

                {/* 2. Pharmacist In Charge (Registered Only) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>الصيدلي المناوب المسجل *</span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      (الصيادلة المصرح لهم فقط)
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      id="select-shift-pharmacist"
                      value={selectedPharmacistName}
                      onChange={e => setSelectedPharmacistName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                    >
                      <option value="">-- اختر الصيدلي المناوب --</option>
                      {registeredPharmacists.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.role || 'صيدلي'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    يتم تسجيل العمليات تحت اسم الصيدلي المختار بدقة لمطابقة العهدة والإقفال.
                  </p>
                </div>

                {/* 3. Date, Day, Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={newShiftDate}
                      onChange={e => setNewShiftDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اليوم
                    </label>
                    <input
                      type="text"
                      value={newShiftDay}
                      onChange={e => setNewShiftDay(e.target.value)}
                      placeholder="مثال: الجمعة"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      الوقت
                    </label>
                    <input
                      type="text"
                      value={newShiftTime}
                      onChange={e => setNewShiftTime(e.target.value)}
                      placeholder="09:00 ص"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* 4. Opening Balance - Note that it's for reference only */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-600" />
                      القيمة الافتتاحية للشفت (رصيد استلام الدرج)
                    </label>
                    {lastClosedShift && (
                      <span className="text-[11px] text-slate-600 font-medium">
                        (المتروك بالدرج سابقاً: {formatCurrency(lastClosedShift.leftInDrawer, pharmacyProfile.currency)})
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newOpeningBalance}
                      onChange={e => setNewOpeningBalance(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:border-emerald-600 outline-none"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                      {pharmacyProfile.currency}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      الرصيد الافتتاحي هو رقم مرجعي لاستلام الدرج والتسليم فقط، ولا يدخل في العمليات الحسابية لحساب مبيعات الوردية.
                    </span>
                  </div>
                </div>

                {/* 5. Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ملاحظات افتتاحية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newShiftNotes}
                    onChange={e => setNewShiftNotes(e.target.value)}
                    placeholder="أي ملاحظات تخص استلام الدرج أو تسليم العهدة..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>تأكيد فتح وردية الدرج وبدء التسجيل</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Active Shift in Progress -> Ultra-Focused Fast Entry & Compact Summary View */
            <div className="space-y-4">
              {/* 1. Compact Consolidated Top Shift Summary Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Pharmacist Meta & Status */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-black text-slate-900">
                          {getFormattedPharmacistName(activeShift.pharmacistName)}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                          <span>
                            {activeShift.shiftType === 'morning'
                              ? '☀️ وردية صباحية'
                              : activeShift.shiftType === 'evening'
                              ? '🌆 وردية مسائية'
                              : '🌙 وردية ليلية'}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          (استلام عهدة: <strong className="text-slate-700">{formatCurrency(activeShift.openingBalance || 0, pharmacyProfile.currency)}</strong>)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{activeShift.dayName || ''} {activeShift.date}</span>
                        <span>•</span>
                        <span>بدء: {activeShift.time || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Compact Live Financials & Direct Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
                    {/* Live Metric: Cash Expenses */}
                    <div className="px-2.5 py-1.5 bg-rose-50 rounded-xl border border-rose-100 flex-1 sm:flex-initial text-center sm:text-right">
                      <span className="text-[10px] font-bold text-rose-600 block">
                        منصرف كاش ({activeShift.expenses.length})
                      </span>
                      <span className="text-xs sm:text-sm font-black text-rose-700 font-mono-num">
                        {formatCurrency(activeCashExpenses, pharmacyProfile.currency)}
                      </span>
                    </div>

                    {/* Live Metric: InstaPay */}
                    <div className="px-2.5 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 flex-1 sm:flex-initial text-center sm:text-right">
                      <span className="text-[10px] font-bold text-indigo-600 block">
                        إنستاباي ({(activeShift.instaPayTransfers || []).length})
                      </span>
                      <span className="text-xs sm:text-sm font-black text-indigo-700 font-mono-num">
                        {formatCurrency(activeInstaPay, pharmacyProfile.currency)}
                      </span>
                    </div>

                    {/* Live Metric: Wallet Transfers */}
                    <div className="px-2.5 py-1.5 bg-sky-50 rounded-xl border border-sky-100 flex-1 sm:flex-initial text-center sm:text-right">
                      <span className="text-[10px] font-bold text-sky-700 block">
                        المحفظة ({(activeShift.walletTransfers || []).length})
                      </span>
                      <span className="text-xs sm:text-sm font-black text-sky-800 font-mono-num">
                        {formatCurrency(activeWallet, pharmacyProfile.currency)}
                      </span>
                    </div>

                    {/* Live Metric: Computed Sales */}
                    <div className="px-2.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 flex-1 sm:flex-initial text-center sm:text-right">
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        مبيعات تقديرية
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-800 font-mono-num">
                        {formatCurrency(computedShiftSales, pharmacyProfile.currency)}
                      </span>
                    </div>

                    {/* Direct Shift Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShiftForReceipt({
                            ...activeShift,
                            leftInDrawer: activeLeft,
                            transferredToVault: activeTransferred,
                            totalSales: computedShiftSales
                          });
                          setIsReceiptModalOpen(true);
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="معاينة وطباعة الريسيت"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsConfirmCloseModalOpen(true)}
                        className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>إقفال الوردية</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Fast Focused Mode Switcher (4 Modes) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveEntryMode('expense')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeEntryMode === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 shrink-0" />
                  <span>منصرف نقدي</span>
                  {activeShift.expenses.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeEntryMode === 'expense' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {activeShift.expenses.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEntryMode('instapay')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeEntryMode === 'instapay'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>تحويلات إنستاباي</span>
                  {(activeShift.instaPayTransfers || []).length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeEntryMode === 'instapay' ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {(activeShift.instaPayTransfers || []).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEntryMode('wallet')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeEntryMode === 'wallet'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>تحويلات المحفظة</span>
                  {(activeShift.walletTransfers || []).length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeEntryMode === 'wallet' ? 'bg-white text-sky-700' : 'bg-sky-100 text-sky-800'
                    }`}>
                      {(activeShift.walletTransfers || []).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEntryMode('settlement')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeEntryMode === 'settlement'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <Calculator className="w-4 h-4 shrink-0" />
                  <span>إقفال وتسوية</span>
                </button>
              </div>

              {/* 3. Fast Focused Entry Workspace */}
              <div className="space-y-4">
                
                {/* Mode 1: Cash Outflows & Expense Entry */}
                {activeEntryMode === 'expense' && (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
                      
                      {/* Compact Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                            <ArrowDownRight className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>تسجيل منصرف نقدي من الدرج</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-normal hidden sm:inline-block">
                                خصم فوري ومباشر
                              </span>
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <span className="text-[11px] text-slate-500">إجمالي منصرف الشفت:</span>
                          <span className="text-xs sm:text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 font-mono-num">
                            {formatCurrency(activeCashExpenses, pharmacyProfile.currency)}
                          </span>
                        </div>
                      </div>

                      <form onSubmit={handleAddExpenseItem} className="space-y-2.5">
                        
                        {/* 1. Fast Category Switcher (Pills) */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/90">
                          {[
                            { id: 'supplier', label: 'مورد/مخزن', icon: Truck },
                            { id: 'general', label: 'مصروف/نثريات', icon: Receipt },
                            { id: 'employee_advance', label: 'سلفة موظف', icon: Briefcase },
                            { id: 'customer_debt', label: 'دين عميل', icon: Users },
                            { id: 'partner_withdrawal', label: 'مسحوبات شريك', icon: User }
                          ].map(item => {
                            const Icon = item.icon;
                            const isSel = expenseCategory === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setExpenseCategory(item.id as DrawerExpenseCategory);
                                  setExpenseTargetId('');
                                }}
                                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                                  isSel
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-700 hover:bg-white/80 hover:text-slate-900'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* 2. Target Selectors & Category-Specific Context Bar */}
                        {expenseCategory === 'supplier' && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-100">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700">
                                الشركة / المخزن المسجل:
                              </label>
                              {expenseTargetId && expenseTargetId !== 'NEW_SUPPLIER' && (
                                (() => {
                                  const supp = suppliers.find(s => s.id === expenseTargetId);
                                  return supp?.balance ? (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${supp.balance > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                                      {supp.balance > 0 ? `له سابقاً: ${supp.balance} ج.م` : `رصيدنا: ${Math.abs(supp.balance)} ج.م`}
                                    </span>
                                  ) : null;
                                })()
                              )}
                            </div>
                            <select
                              value={expenseTargetId}
                              onChange={e => {
                                const val = e.target.value;
                                setExpenseTargetId(val);
                                if (val === 'NEW_SUPPLIER') {
                                  setExpenseTitle(newSupplierName.trim() ? `سداد شركة ${newSupplierName.trim()}` : 'سداد شركة / مورد جديد');
                                } else {
                                  const sup = suppliers.find(s => s.id === val);
                                  if (sup) setExpenseTitle(`سداد شركة ${sup.name}`);
                                }
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-rose-500 outline-none"
                            >
                              <option value="">-- اختر مورد من القائمة --</option>
                              <option value="NEW_SUPPLIER" className="font-bold text-indigo-700 bg-indigo-50">
                                ➕ مورد / شركة جديدة (كتابة اسم مباشر)
                              </option>
                              {suppliers.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.companyType || 'أدوية'}) {s.balance ? `[رصيده: ${s.balance} ج.م]` : ''}
                                </option>
                              ))}
                            </select>

                            {/* Inline New Supplier Form */}
                            {expenseTargetId === 'NEW_SUPPLIER' && (
                              <div className="p-2 bg-indigo-50/90 border border-indigo-200 rounded-lg space-y-1.5 animate-in fade-in duration-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">
                                      اسم الشركة / المورد *
                                    </label>
                                    <input
                                      type="text"
                                      value={newSupplierName}
                                      onChange={e => {
                                        setNewSupplierName(e.target.value);
                                        setExpenseTitle(e.target.value.trim() ? `سداد شركة ${e.target.value.trim()}` : 'سداد شركة / مورد جديد');
                                      }}
                                      placeholder="مثال: مخزن الدواء الحديث..."
                                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">
                                      رقم الهاتف / المندوب (اختياري)
                                    </label>
                                    <input
                                      type="tel"
                                      value={newSupplierPhone}
                                      onChange={e => setNewSupplierPhone(e.target.value)}
                                      placeholder="010xxxxxxxx"
                                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* General Expense Quick Presets */}
                        {expenseCategory === 'general' && (
                          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500">تصنيفات شائعة:</span>
                            {[
                              'نثريات وضيافة',
                              'أدوات نظافة ومطهرات',
                              'صيانة وكهرباء',
                              'مطبوعات وأكياس',
                              'إنترنت وفواتير',
                              'بوفيه ومشروبات',
                              'صدقة وتبرعات'
                            ].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setExpenseTitle(preset)}
                                className="px-2 py-0.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-md text-[11px] font-bold transition-colors cursor-pointer active:scale-95"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        )}

                        {expenseCategory === 'employee_advance' && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-in fade-in duration-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              اختر الموظف / الصيدلي:
                            </label>
                            <select
                              value={expenseTargetId}
                              onChange={e => {
                                setExpenseTargetId(e.target.value);
                                const emp = employees.find(em => em.id === e.target.value);
                                if (emp) setExpenseTitle(`سلفة: ${emp.name}`);
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-rose-500 outline-none"
                            >
                              <option value="">-- اختر موظف من القائمة --</option>
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Customer Debt Mode with REAL-TIME PREVIOUS DEBT ALERT */}
                        {expenseCategory === 'customer_debt' && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-100">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700">
                                اختر العميل لتسجيل الدين:
                              </label>
                              {selectedCustomerInfo && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono-num ${
                                  selectedCustomerInfo.currentNetDebt > 0
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                }`}>
                                  {selectedCustomerInfo.currentNetDebt > 0
                                    ? `مديونية سابقة: ${formatCurrency(selectedCustomerInfo.currentNetDebt, pharmacyProfile.currency)}`
                                    : 'الحساب خالص'}
                                </span>
                              )}
                            </div>

                            <select
                              value={expenseTargetId}
                              onChange={e => {
                                const val = e.target.value;
                                setExpenseTargetId(val);
                                if (val === 'NEW_CUSTOMER') {
                                  setExpenseTitle(newCustomerName.trim() ? `دين عميل: ${newCustomerName.trim()}` : 'دين عميل جديد');
                                } else {
                                  const c = customers.find(cu => cu.id === val);
                                  if (c) setExpenseTitle(`دين عميل: ${c.name}`);
                                }
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-rose-500 outline-none"
                            >
                              <option value="">-- اختر عميل من الدفتر --</option>
                              <option value="NEW_CUSTOMER" className="font-bold text-indigo-700 bg-indigo-50">
                                ➕ عميل جديد (كتابة اسم فوري ورقم هاتف)
                              </option>
                              {customers.map(c => {
                                const debt = customerDebtMap[c.id] || 0;
                                return (
                                  <option key={c.id} value={c.id}>
                                    {c.name} {c.phone ? `(${c.phone})` : ''} {debt > 0 ? `⚠️ [عليه دين سابق: ${debt} ج.م]` : ''}
                                  </option>
                                );
                              })}
                            </select>

                            {/* 🚨 PREVIOUS DEBT NOTIFICATION BANNER (تنبيه المديونية السابقة لإبلاغ العميل) */}
                            {selectedCustomerInfo && (
                              <div className={`p-2.5 rounded-xl border transition-all animate-in fade-in slide-in-from-top-1 duration-150 ${
                                selectedCustomerInfo.currentNetDebt > 0
                                  ? 'bg-amber-500/10 border-amber-400 text-amber-950'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              }`}>
                                <div className="flex items-start gap-2">
                                  {selectedCustomerInfo.currentNetDebt > 0 ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                      <span className="font-bold text-xs">
                                        {selectedCustomerInfo.currentNetDebt > 0
                                          ? `📢 تنبيه لإبلاغ العميل (${selectedCustomerInfo.name}) بالمديونية السابقة:`
                                          : `حساب العميل (${selectedCustomerInfo.name}):`}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-md font-mono-num font-black text-xs ${
                                        selectedCustomerInfo.currentNetDebt > 0
                                          ? 'bg-amber-500 text-white shadow-2xs'
                                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                      }`}>
                                        {selectedCustomerInfo.currentNetDebt > 0
                                          ? `عليه دين سابق: ${formatCurrency(selectedCustomerInfo.currentNetDebt, pharmacyProfile.currency)}`
                                          : 'خالص الحساب (ليس عليه أي دين سابق)'}
                                      </span>
                                    </div>
                                    {selectedCustomerInfo.currentNetDebt > 0 && (
                                      <p className="text-[11px] text-amber-900 font-medium mt-1">
                                        💡 يُرجى إبلاغ العميل بمبلغ الدين السابق قبل تسليمه الطلب الجديد. (سيكون إجمالي حسابه بعد هذا البند: <strong className="font-black font-mono-num underline">{formatCurrency(selectedCustomerInfo.currentNetDebt + (parseFloat(expenseAmount) || 0), pharmacyProfile.currency)}</strong>)
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Inline New Customer Form */}
                            {expenseTargetId === 'NEW_CUSTOMER' && (
                              <div className="p-2 bg-indigo-50/90 border border-indigo-200 rounded-lg space-y-1.5 animate-in fade-in duration-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>تسجيل عميل جديد مباشرة:</span>
                                  </div>
                                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                                    حساب جديد
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">
                                      اسم العميل الجديد *
                                    </label>
                                    <input
                                      type="text"
                                      value={newCustomerName}
                                      onChange={e => {
                                        setNewCustomerName(e.target.value);
                                        setExpenseTitle(e.target.value.trim() ? `دين عميل: ${e.target.value.trim()}` : 'دين عميل جديد');
                                      }}
                                      placeholder="مثال: أ/ محمد عبد الرحمن..."
                                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-indigo-900 mb-0.5">
                                      رقم هاتف العميل (اختياري)
                                    </label>
                                    <input
                                      type="tel"
                                      value={newCustomerPhone}
                                      onChange={e => setNewCustomerPhone(e.target.value)}
                                      placeholder="مثال: 01012345678"
                                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {expenseCategory === 'partner_withdrawal' && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-in fade-in duration-100">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              اختر الشريك / الدكتور:
                            </label>
                            <select
                              value={expenseTargetId}
                              onChange={e => {
                                setExpenseTargetId(e.target.value);
                                const p = parties.find(pa => pa.id === e.target.value);
                                if (p) setExpenseTitle(`مسحوبات: ${p.name}`);
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:border-rose-500 outline-none"
                            >
                              <option value="">-- اختر الشريك / الطرف --</option>
                              {parties.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.role})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* 3. Primary Fast Input Bar: Title, Amount, Notes & Submit */}
                        <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            
                            {/* Title / Description */}
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                بيان المنصرف *
                              </label>
                              <input
                                type="text"
                                value={expenseTitle}
                                onChange={e => setExpenseTitle(e.target.value)}
                                placeholder="مثلاً: سداد المتحدة، نثريات..."
                                required
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:border-rose-500 outline-none"
                              />
                            </div>

                            {/* Amount */}
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                المبلغ (ج.م) *
                              </label>
                              <input
                                type="number"
                                step="any"
                                min="0.1"
                                value={expenseAmount}
                                onChange={e => setExpenseAmount(e.target.value)}
                                required
                                placeholder="0.00"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-rose-600 focus:border-rose-500 outline-none font-mono-num"
                              />
                            </div>

                            {/* Notes */}
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                ملاحظات (اختياري)
                              </label>
                              <input
                                type="text"
                                value={expenseNotes}
                                onChange={e => setExpenseNotes(e.target.value)}
                                placeholder="تفاصيل أو رقم سند..."
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:border-rose-500 outline-none"
                              />
                            </div>

                            {/* Submit Button */}
                            <div className="sm:col-span-2 flex items-end">
                              <button
                                type="submit"
                                title="إضافة المنصرف فوراً (Enter)"
                                className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                              >
                                <PlusCircle className="w-4 h-4 shrink-0" />
                                <span>إضافة</span>
                                <kbd className="text-[9px] bg-rose-700/90 text-rose-100 px-1 py-0.2 rounded font-mono">↵ Enter</kbd>
                              </button>
                            </div>
                          </div>

                          {/* Quick Amount Chips */}
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-400">مبالغ سريعة:</span>
                            {[10, 20, 50, 100, 200, 500, 1000].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setExpenseAmount(String(val))}
                                className="px-2 py-0.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 rounded-md text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                              >
                                +{val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </form>

                      {/* Compact Table of Cash Outflows */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700">
                            المنصرفات المسجلة بالشفت ({activeShift.expenses.length}):
                          </span>
                        </div>
                        {activeShift.expenses.length === 0 ? (
                          <div className="py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                            <Receipt className="w-5 h-5 mx-auto mb-1 opacity-50 text-slate-400" />
                            <p className="text-xs font-bold text-slate-500">لا توجد منصرفات نقدية مسجلة بعد بالوردية</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                                  <th className="py-2 px-2.5 font-bold w-8 text-center">#</th>
                                  <th className="py-2 px-2.5 font-bold">النوع</th>
                                  <th className="py-2 px-2.5 font-bold">بيان المنصرف</th>
                                  <th className="py-2 px-2.5 font-bold">الملاحظات</th>
                                  <th className="py-2 px-2.5 font-bold text-left">المبلغ</th>
                                  <th className="py-2 px-2 text-center w-10">حذف</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {activeShift.expenses.map((item, idx) => (
                                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-2 px-2.5 font-bold text-slate-400 text-center">{idx + 1}</td>
                                    <td className="py-2 px-2.5">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        item.category === 'customer_debt'
                                          ? 'bg-amber-100 text-amber-800'
                                          : item.category === 'supplier'
                                          ? 'bg-blue-100 text-blue-800'
                                          : item.category === 'employee_advance'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {item.category === 'supplier'
                                          ? 'مورد/مخزن'
                                          : item.category === 'employee_advance'
                                          ? 'سلفة'
                                          : item.category === 'customer_debt'
                                          ? 'دين'
                                          : item.category === 'partner_withdrawal'
                                          ? 'مسحوبات'
                                          : 'مصروف'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2.5 font-bold text-slate-900">{item.title}</td>
                                    <td className="py-2 px-2.5 text-slate-500 text-[11px]">{item.notes || '—'}</td>
                                    <td className="py-2 px-2.5 font-black text-rose-600 font-mono-num text-left">
                                      {formatCurrency(item.amount, pharmacyProfile.currency)}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeDrawerExpense(item.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="حذف هذا البند"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 2: InstaPay Entry */}
                {activeEntryMode === 'instapay' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>تحويلات إنستاباي (InstaPay)</span>
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              تسجيل تحويلات إنستاباي الخاصة بمبيعات الوردية لترحيلها للمحافظ ومطابقة الحسابات
                            </p>
                          </div>
                        </div>
                        <div className="text-left bg-indigo-50/80 px-3 py-1.5 rounded-xl border border-indigo-100">
                          <span className="text-[10px] text-indigo-700 font-bold block">إجمالي إنستاباي بالوردية</span>
                          <span className="text-sm font-black text-indigo-900 font-mono-num">
                            {formatCurrency(activeInstaPay, pharmacyProfile.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Fast Entry Form for InstaPay */}
                      <form onSubmit={handleAddInstaPay} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              مبلغ التحويل (ج.م) *
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              value={instaAmount}
                              onChange={e => setInstaAmount(e.target.value)}
                              placeholder="0.00"
                              required
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-black text-indigo-700 focus:border-indigo-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              اسم العميل / المحول (أو رقم العملية)
                            </label>
                            <input
                              type="text"
                              value={instaSender}
                              onChange={e => setInstaSender(e.target.value)}
                              placeholder="مثال: أحمد، إنستاباي صيدلية، 010..."
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3 flex items-end">
                            <button
                              type="submit"
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>تسجيل إنستاباي</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Amount Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400">مبالغ سريعة:</span>
                          {[50, 100, 150, 200, 300, 500, 1000].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setInstaAmount(String(val))}
                              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              +{val}
                            </button>
                          ))}
                        </div>
                      </form>

                      {/* InstaPay Transfers List */}
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-2">
                          تحويلات إنستاباي المسجلة بالشفت ({(activeShift.instaPayTransfers || []).length}):
                        </span>
                        {(activeShift.instaPayTransfers || []).length === 0 ? (
                          <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                            <Smartphone className="w-6 h-6 mx-auto mb-1 opacity-50 text-slate-400" />
                            <p className="text-xs font-bold text-slate-600">لا توجد تحويلات إنستاباي مسجلة بعد بالوردية</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {(activeShift.instaPayTransfers || []).map((t, idx) => (
                              <div
                                key={t.id}
                                className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 truncate block">
                                      {t.sender || 'عميل إنستاباي'}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(t.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-indigo-700 font-mono-num text-sm">
                                    {formatCurrency(t.amount, pharmacyProfile.currency)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeInstaPayTransfer(t.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="حذف التحويل"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 3: Digital Wallets (Vodafone Cash & Wallets) Entry */}
                {activeEntryMode === 'wallet' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>تحويلات المحفظة الإلكترونية (فودافون كاش / أورنج / اتصالات / محافظ بنكية)</span>
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              بند مجمع كامل لتسجيل كافة تحويلات المحافظ الإلكترونية الخاصة بمبيعات الوردية
                            </p>
                          </div>
                        </div>
                        <div className="text-left bg-sky-50/80 px-3 py-1.5 rounded-xl border border-sky-100">
                          <span className="text-[10px] text-sky-700 font-bold block">إجمالي المحفظة بالوردية</span>
                          <span className="text-sm font-black text-sky-900 font-mono-num">
                            {formatCurrency(activeWallet, pharmacyProfile.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Fast Entry Form for Wallet */}
                      <form onSubmit={handleAddWallet} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              مبلغ تحويل المحفظة (ج.م) *
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              value={walletAmount}
                              onChange={e => setWalletAmount(e.target.value)}
                              placeholder="0.00"
                              required
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-black text-sky-700 focus:border-sky-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              اسم العميل / رقم المحفظة المحول منها
                            </label>
                            <input
                              type="text"
                              value={walletSender}
                              onChange={e => setWalletSender(e.target.value)}
                              placeholder="مثال: فودافون كاش 010...، عميل أحمد..."
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:border-sky-500 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3 flex items-end">
                            <button
                              type="submit"
                              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>تسجيل بالمحفظة</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Amount Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400">مبالغ سريعة:</span>
                          {[50, 100, 150, 200, 300, 500, 1000].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setWalletAmount(String(val))}
                              className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-slate-200 text-slate-700 hover:text-sky-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              +{val}
                            </button>
                          ))}
                        </div>
                      </form>

                      {/* Wallet Transfers List */}
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-2">
                          تحويلات المحفظة المسجلة بالشفت ({(activeShift.walletTransfers || []).length}):
                        </span>
                        {(activeShift.walletTransfers || []).length === 0 ? (
                          <div className="p-5 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                            <Wallet className="w-6 h-6 mx-auto mb-1 opacity-50 text-slate-400" />
                            <p className="text-xs font-bold text-slate-600">لا توجد تحويلات محفظة مسجلة بعد بالوردية</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {(activeShift.walletTransfers || []).map((w, idx) => (
                              <div
                                key={w.id}
                                className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 truncate block">
                                      {w.sender || 'تحويل محفظة'}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(w.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sky-700 font-mono-num text-sm">
                                    {formatCurrency(w.amount, pharmacyProfile.currency)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeWalletTransfer(w.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="حذف تحويل المحفظة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 4: Settlement & Closing Workspace */}
                {activeEntryMode === 'settlement' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 max-w-3xl mx-auto">
                      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                          <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            تسوية مبيعات وإقفال درج الوردية
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            إدخال النقدية المحولة للخزانة والمتروكة بالدرج لحساب إجمالي المبيعات
                          </p>
                        </div>
                      </div>

                      {/* Deductions & Summary Box (Cash + InstaPay + Wallets) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
                          <span className="text-slate-500 block text-[11px]">المنصرفات النقدية:</span>
                          <span className="text-sm font-black text-rose-700 font-mono-num">
                            {formatCurrency(activeCashExpenses, pharmacyProfile.currency)}
                          </span>
                        </div>
                        <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
                          <span className="text-slate-500 block text-[11px]">تحويلات إنستاباي:</span>
                          <span className="text-sm font-black text-indigo-700 font-mono-num">
                            {formatCurrency(activeInstaPay, pharmacyProfile.currency)}
                          </span>
                        </div>
                        <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100">
                          <span className="text-slate-500 block text-[11px]">تحويلات المحفظة:</span>
                          <span className="text-sm font-black text-sky-700 font-mono-num">
                            {formatCurrency(activeWallet, pharmacyProfile.currency)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">إجمالي الاستقطاعات:</span>
                          <span className="text-sm font-black text-slate-900 font-mono-num">
                            {formatCurrency(activeCashExpenses + activeInstaPay + activeWallet, pharmacyProfile.currency)}
                          </span>
                        </div>
                      </div>

                      {/* The 2 Closing Input Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* 1. Transferred Cash to Treasury */}
                        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
                          <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <Vault className="w-4 h-4 text-emerald-700" />
                            المحول إلى الخزانة نقدي باليد *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={transferredToVaultInput}
                              onChange={e => setTransferredToVaultInput(e.target.value)}
                              placeholder="0.00"
                              className="w-full px-3.5 py-3 bg-white border border-emerald-300 rounded-xl text-base font-black text-emerald-950 focus:border-emerald-600 outline-none"
                            />
                            <span className="absolute left-3 top-3.5 text-xs font-bold text-emerald-700">
                              {pharmacyProfile.currency}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            المبلغ الفعلي المسلم باليد للخزانة من مبيعات الوردية
                          </p>
                        </div>

                        {/* 2. Left In Drawer */}
                        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
                          <label className="block text-xs font-bold text-blue-950 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-blue-700" />
                            المتروك بالدرج (رصيد الوردية القادمة) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={leftInDrawerInput}
                              onChange={e => setLeftInDrawerInput(e.target.value)}
                              placeholder="500.00"
                              className="w-full px-3.5 py-3 bg-white border border-blue-300 rounded-xl text-base font-black text-blue-950 focus:border-blue-600 outline-none"
                            />
                            <span className="absolute left-3 top-3.5 text-xs font-bold text-blue-700">
                              {pharmacyProfile.currency}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            الفكة المتروكة بالدرج وتكون رصيد استلام الوردية القادمة
                          </p>
                        </div>
                      </div>

                      {/* Gross Sales Highlight Box */}
                      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-slate-300 text-xs">
                          <span className="font-bold">إجمالي مبيعات الوردية (Gross Sales):</span>
                          <span className="text-2xl font-black text-emerald-400 font-mono-num">
                            {formatCurrency(computedShiftSales, pharmacyProfile.currency)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-700">
                          <p>= كاش منصرف ({formatCurrency(activeCashExpenses, pharmacyProfile.currency)}) + إنستاباي ({formatCurrency(activeInstaPay, pharmacyProfile.currency)}) + المحفظة ({formatCurrency(activeWallet, pharmacyProfile.currency)}) + المتروك ({formatCurrency(activeLeft, pharmacyProfile.currency)}) + للخزينة ({formatCurrency(activeTransferred, pharmacyProfile.currency)})</p>
                        </div>
                      </div>

                      {/* Trigger Close Button */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsConfirmCloseModalOpen(true)}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          <span>تأكيد إقفال الوردية الحالية</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShiftForReceipt({
                              ...activeShift,
                              leftInDrawer: activeLeft,
                              transferredToVault: activeTransferred,
                              totalSales: computedShiftSales
                            });
                            setIsReceiptModalOpen(true);
                          }}
                          className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                          <span>معاينة ريسيت الوردية</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 2: MANAGER REVIEW & DISTRIBUTION */}
      {activeSubTab === 'review' && isManager && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Manager Review Top Explanation Card */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 border border-purple-800/60 rounded-2xl p-5 sm:p-6 text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">مراجعة واعتماد الورديات المقفلة</h2>
                    <span className="text-xs bg-purple-500/30 text-purple-200 font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">
                      صلاحية الإدارة 🔒
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
                    الورديات المقفلة لا ترحل مباشرة إلى باقي الموديلات (الخزانة، المحافظ، سداد الموردين، سلف الموظفين) إلا بعد قيام المدير بمراجعة البنود والضغط على «تأكيد التحويل والترحيل».
                  </p>
                </div>
              </div>

              {pendingReviewShifts.length > 0 && (
                <div className="bg-purple-900/60 border border-purple-500/40 px-4 py-3 rounded-xl flex items-center gap-3">
                  <span className="text-2xl font-black text-amber-300">{pendingReviewShifts.length}</span>
                  <div className="text-xs">
                    <span className="font-bold text-white block">ورديات بانتظار الاعتماد</span>
                    <span className="text-purple-300 text-[11px]">جاهزة للمراجعة والترحيل</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending Shifts List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  قائمة الورديات المقفلة المعلقة (بانتظار التأكيد والتحويل للموديلات)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {pendingReviewShifts.length} وردية معلقة
              </span>
            </div>

            {pendingReviewShifts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">لا توجد ورديات معلقة بانتظار الاعتماد</p>
                <p className="text-xs text-slate-500">
                  جميع الورديات المقفلة تم مراجعتها واعتماد ترحيلها بنجاح إلى الموديلات المحاسبية.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReviewShifts.map((shift) => {
                  const sSales = shift.totalSales || ((shift.totalExpenses || 0) + (shift.totalInstaPay || 0) + (shift.leftInDrawer || 0) + (shift.transferredToVault || 0));

                  return (
                    <div key={shift.id} className="p-4 sm:p-5 hover:bg-purple-50/20 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Shift Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm sm:text-base">
                              د. {shift.pharmacistName}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              بانتظار تأكيد المدير
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                              {shift.shiftType === 'morning' ? '☀️ صباحية' : shift.shiftType === 'evening' ? '🌆 مسائية' : '🌙 ليلية'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>التاريخ: <strong className="text-slate-800">{shift.date}</strong></span>
                            <span>•</span>
                            <span>الوقت: <strong className="text-slate-800">{shift.time || '—'}</strong></span>
                            {shift.notes && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 italic">ملاحظات: {shift.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Shift Financials breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-500 block text-[11px]">إجمالي المبيعات</span>
                            <span className="font-black text-emerald-700 font-mono-num text-sm">
                              {formatCurrency(sSales, pharmacyProfile.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">محول للخزانة</span>
                            <span className="font-black text-slate-900 font-mono-num text-sm">
                              {formatCurrency(shift.transferredToVault, pharmacyProfile.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">إنستاباي</span>
                            <span className="font-black text-indigo-700 font-mono-num text-sm">
                              {formatCurrency(shift.totalInstaPay || 0, pharmacyProfile.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">المحفظة</span>
                            <span className="font-black text-sky-700 font-mono-num text-sm">
                              {formatCurrency(shift.totalWallet || 0, pharmacyProfile.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">منصرفات الدرج</span>
                            <span className="font-black text-rose-700 font-mono-num text-sm">
                              {formatCurrency(shift.totalExpenses, pharmacyProfile.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedShiftForReceipt(shift);
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            title="معاينة وطباعة الريسيت"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>معاينة الريسيت</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`تأكيد مراجعة وردية د. ${shift.pharmacistName} وترحيل إجمالي النقدية للخزانة وإنستاباي للمحافظ وباقي المصروفات للموديلات؟`)) {
                                approveAndDistributeShift(shift.id);
                              }
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>تأكيد التحويل والترحيل</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SHIFTS HISTORY & ARCHIVE */}
      {activeSubTab === 'history' && (
        <div className="space-y-5">
          {/* History Filters & Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">إجمالي الورديات المؤرشفة</span>
              <h3 className="text-xl font-black text-slate-900 mt-1">{historyStats.totalShifts}</h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">إجمالي مبيعات الورديات</span>
              <h3 className="text-xl font-black text-emerald-600 mt-1 font-mono-num">
                {formatCurrency(historyStats.totalSales, pharmacyProfile.currency)}
              </h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">إجمالي المحول للخزانة</span>
              <h3 className="text-xl font-black text-slate-900 mt-1 font-mono-num">
                {formatCurrency(historyStats.totalTransferred, pharmacyProfile.currency)}
              </h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">المتروك بالدرج (الرصيد الأخير)</span>
              <h3 className="text-xl font-black text-blue-600 mt-1 font-mono-num">
                {formatCurrency(lastClosedShift ? lastClosedShift.leftInDrawer : 0, pharmacyProfile.currency)}
              </h3>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="بحث بالتاريخ، الصيدلي، أو الملاحظة..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={historyFilterApproval}
                onChange={e => setHistoryFilterApproval(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
              >
                <option value="all">كل حالات الاعتماد</option>
                <option value="pending">معلقة (بانتظار التأكيد)</option>
                <option value="approved">معتمدة ومرحلة للموديلات</option>
              </select>

              <select
                value={historyFilterType}
                onChange={e => setHistoryFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
              >
                <option value="all">كل أنواع الورديات</option>
                <option value="morning">صباحية</option>
                <option value="evening">مسائية</option>
                <option value="night">ليلية</option>
              </select>

              <select
                value={historyFilterPharmacist}
                onChange={e => setHistoryFilterPharmacist(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
              >
                <option value="all">كل الصيادلة</option>
                {uniquePharmacists.map(name => (
                  <option key={name} value={name}>
                    د. {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* History Shifts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Vault className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
                <p className="text-sm font-bold text-slate-700">لا توجد ورديات سابقة مطابقة للبحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                      <th className="p-3.5">الوردية والتاريخ</th>
                      <th className="p-3.5">الصيدلي المناوب</th>
                      <th className="p-3.5">حالة الاعتماد</th>
                      <th className="p-3.5">إجمالي المبيعات</th>
                      <th className="p-3.5">المصروفات النقدية</th>
                      <th className="p-3.5">إنستاباي</th>
                      <th className="p-3.5">المحفظة</th>
                      <th className="p-3.5">المحول للخزانة</th>
                      <th className="p-3.5">المتروك بالدرج</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map(shift => {
                      const sSales = shift.totalSales || ((shift.totalExpenses || 0) + (shift.totalInstaPay || 0) + (shift.totalWallet || 0) + (shift.leftInDrawer || 0) + (shift.transferredToVault || 0));
                      const isApproved = !!shift.isApprovedByManager;

                      return (
                        <tr key={shift.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>
                                {shift.shiftType === 'morning'
                                  ? '☀️ صباحية'
                                  : shift.shiftType === 'evening'
                                  ? '🌆 مسائية'
                                  : '🌙 ليلية'}
                              </span>
                              <span className="text-slate-400 font-normal">|</span>
                              <span>{shift.date}</span>
                              {shift.dayName && <span className="text-slate-500">({shift.dayName})</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              الوقت: {shift.time || '—'}
                            </div>
                          </td>

                          <td className="p-3.5 font-bold text-slate-800">
                            د. {shift.pharmacistName}
                          </td>

                          <td className="p-3.5">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                معتمدة ومرحلة
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                بانتظار تأكيد المدير
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 font-black text-emerald-700 font-mono-num text-sm">
                            {formatCurrency(sSales, pharmacyProfile.currency)}
                          </td>

                          <td className="p-3.5">
                            <span className="font-black text-rose-600 font-mono-num">
                              {formatCurrency(shift.totalExpenses, pharmacyProfile.currency)}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              ({shift.expenses.length} بند)
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-black text-indigo-600 font-mono-num">
                              {formatCurrency(shift.totalInstaPay || 0, pharmacyProfile.currency)}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              ({(shift.instaPayTransfers || []).length} تحويل)
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-black text-sky-700 font-mono-num">
                              {formatCurrency(shift.totalWallet || 0, pharmacyProfile.currency)}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              ({(shift.walletTransfers || []).length} تحويل)
                            </span>
                          </td>

                          <td className="p-3.5 font-black text-slate-900 font-mono-num">
                            {formatCurrency(shift.transferredToVault, pharmacyProfile.currency)}
                          </td>

                          <td className="p-3.5 font-black text-blue-700 font-mono-num">
                            {formatCurrency(shift.leftInDrawer, pharmacyProfile.currency)}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isManager && !isApproved && (
                                <button
                                  onClick={() => {
                                    if (confirm(`تأكيد مراجعة وردية د. ${shift.pharmacistName} وترحيلها للموديلات؟`)) {
                                      approveAndDistributeShift(shift.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                                  title="تأكيد التحويل والترحيل للموديلات"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedShiftForReceipt(shift);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="طباعة الريسيت الحراري"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`هل تريد إعادة فتح وردية ${shift.pharmacistName} بتاريخ ${shift.date}؟`)) {
                                    reopenShift(shift.id);
                                    setActiveSubTab('current');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="إعادة فتح الوردية للتعديل"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف وردية ${shift.pharmacistName} من الأرشيف نهائياً؟`)) {
                                    deleteDrawerShift(shift.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف الوردية من الأرشيف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM SHIFT CLOSE MODAL */}
      {isConfirmCloseModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">تأكيد إقفال وردية درج النقدية</h3>
                  <p className="text-xs text-emerald-100">
                    مراجعة المبالغ والمبيعات قبل الترحيل النهائي للخزانة وإصدار الريسيت
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">الصيدلي:</span>
                  <span className="font-bold text-slate-900">د. {activeShift.pharmacistName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الوردية والتاريخ:</span>
                  <span className="font-bold">
                    {activeShift.shiftType === 'morning' ? 'صباحية' : activeShift.shiftType === 'evening' ? 'مسائية' : 'ليلية'} ({activeShift.date})
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>إجمالي المنصرف من الدرج:</span>
                  <span className="font-bold font-mono-num">
                    {formatCurrency(activeCashExpenses, pharmacyProfile.currency)} ({activeShift.expenses.length} بند)
                  </span>
                </div>
                <div className="flex justify-between text-indigo-600">
                  <span>تحويلات إنستاباي:</span>
                  <span className="font-bold font-mono-num">
                    {formatCurrency(activeInstaPay, pharmacyProfile.currency)} ({(activeShift.instaPayTransfers || []).length} تحويل)
                  </span>
                </div>
                <div className="flex justify-between text-sky-700">
                  <span>تحويلات المحفظة:</span>
                  <span className="font-bold font-mono-num">
                    {formatCurrency(activeWallet, pharmacyProfile.currency)} ({(activeShift.walletTransfers || []).length} تحويل)
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold">
                  <span>المحول للخزانة (نقداً باليد):</span>
                  <span className="font-mono-num">{formatCurrency(activeTransferred, pharmacyProfile.currency)}</span>
                </div>
                <div className="flex justify-between text-blue-800 font-bold">
                  <span>المتروك بالدرج (رصيد تالي):</span>
                  <span className="font-mono-num">{formatCurrency(activeLeft, pharmacyProfile.currency)}</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-300 flex justify-between font-black text-emerald-800 text-sm">
                  <span>إجمالي المبيعات المحسوبة:</span>
                  <span className="font-mono-num text-base">{formatCurrency(computedShiftSales, pharmacyProfile.currency)}</span>
                </div>
              </div>

              {/* Account Lock On Close Checkbox */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAccountOnClose}
                    onChange={e => setLockAccountOnClose(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      إقفال الجلسة وتأمين الحساب فوراً بعد إغلاق الوردية
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      يقوم بتسجيل خروج الصيدلي الحالي فوراً لتمكين الصيدلي التالي من تسجيل دخوله بكلمة المرور الخاصة به.
                    </span>
                  </div>
                </label>
              </div>

              {/* Automatic Distribution Checkbox */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={distributeToModules}
                    onChange={e => setDistributeToModules(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-950 block">
                      طلب ترحيل وتوزيع المبالغ والمنصرفات للموديلات
                    </span>
                    <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                      توضع الوردية بقائمة مراجعة المدير لتأكيد ترحيل النقدية للخزانة والمحافظ والمصروفات.
                    </span>
                  </div>
                </label>
              </div>

              {/* Closing Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات الإقفال النهائية (اختياري)
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  placeholder="أي ملاحظات تخص الوردية والتسليم..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmCloseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCloseShift}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد الإقفال وعرض الريسيت</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL RECEIPT MODAL */}
      <ThermalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedShiftForReceipt(null);
        }}
        shift={selectedShiftForReceipt}
      />
    </div>
  );
};
