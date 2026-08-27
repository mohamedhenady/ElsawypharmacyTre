import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  PharmacyProfile,
  AccountingPeriod,
  ExpenseCategory,
  Supplier,
  Party,
  Customer,
  Employee,
  IncomeRecord,
  SupplierPayment,
  ExpenseRecord,
  WalletTransaction,
  PersonalLedgerRecord,
  CustomerDebtRecord,
  EmployeeAdvanceRecord,
  AuditLog,
  ReconciliationSummary,
  AppUser,
  UserPermissions,
  UserRole
} from '../types';
import {
  initialPharmacyProfile,
  initialPeriods,
  initialExpenseCategories,
  initialSuppliers,
  initialParties,
  initialCustomers,
  initialEmployees,
  initialIncomeRecords,
  initialSupplierPayments,
  initialExpenses,
  initialWalletTransactions,
  initialPersonalLedgers,
  initialCustomerDebts,
  initialEmployeeAdvances,
  initialAuditLogs,
  initialUsers
} from '../data/initialData';

export const computeUserPermissions = (user: AppUser): UserPermissions => {
  if (user.role === 'manager') {
    return {
      dashboard: true,
      income: true,
      suppliers: true,
      expenses: true,
      wallet: true,
      personal: true,
      customers: true,
      employees: true,
      report: true,
      profile: true,
      settings: true,
      users: true,
      quickEntry: true,
      closePeriod: true,
      deleteRecords: true,
    };
  }

  if (user.role === 'accountant') {
    // المحاسب: الداشبورد + سداد الشركات + المصروفات فقط
    return {
      dashboard: true,
      income: false,
      suppliers: true,
      expenses: true,
      wallet: false,
      personal: false,
      customers: false,
      employees: false,
      report: false,
      profile: true,
      settings: false,
      users: false,
      quickEntry: true, // allows quick entry for suppliers & expenses
      closePeriod: false,
      deleteRecords: false,
    };
  }

  // الصيدلي: يتم تحديد صلاحياته من حساب المدير فقط
  const custom = user.customPermissions || {};
  return {
    dashboard: !!custom.dashboard,
    income: custom.income !== undefined ? !!custom.income : true,
    suppliers: !!custom.suppliers,
    expenses: !!custom.expenses,
    wallet: !!custom.wallet,
    personal: !!custom.personal,
    customers: custom.customers !== undefined ? !!custom.customers : true,
    employees: !!custom.employees,
    report: !!custom.report,
    profile: true,
    settings: !!custom.settings,
    users: false, // إدارة المستخدمين محصورة في المدير
    quickEntry: custom.quickEntry !== undefined ? !!custom.quickEntry : true,
    closePeriod: false, // إقفال الشهر محصور في المدير
    deleteRecords: !!custom.deleteRecords,
  };
};

interface TreasuryContextType {
  pharmacyProfile: PharmacyProfile;
  updatePharmacyProfile: (profile: Partial<PharmacyProfile>) => void;
  
  periods: AccountingPeriod[];
  currentPeriodId: string;
  setCurrentPeriodId: (id: string) => void;
  currentPeriod: AccountingPeriod;
  addPeriod: (year: number, month: number, name: string, notes?: string) => void;
  updatePeriod: (id: string, updates: Partial<AccountingPeriod>) => void;
  deletePeriod: (id: string) => void;
  closePeriod: (id: string, actualCash: number) => void;
  reopenPeriod: (id: string) => void;

  expenseCategories: ExpenseCategory[];
  addExpenseCategory: (name: string, color?: string) => void;
  updateExpenseCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  deleteExpenseCategory: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  parties: Party[];
  addParty: (party: Omit<Party, 'id'>) => void;
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Transactions
  incomeRecords: IncomeRecord[];
  addIncomeRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => void;
  updateIncomeRecord: (id: string, updates: Partial<IncomeRecord>) => void;
  deleteIncomeRecord: (id: string) => void;

  supplierPayments: SupplierPayment[];
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id' | 'createdAt'>) => void;
  updateSupplierPayment: (id: string, updates: Partial<SupplierPayment>) => void;
  deleteSupplierPayment: (id: string) => void;
  toggleSupplierPaymentVerification: (id: string, customVerifiedBy?: string) => void;
  bulkVerifySupplierPayments: (ids: string[], verify: boolean) => void;

  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;

  walletTransactions: WalletTransaction[];
  addWalletTransaction: (tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => void;
  updateWalletTransaction: (id: string, updates: Partial<WalletTransaction>) => void;
  deleteWalletTransaction: (id: string) => void;

  personalLedgers: PersonalLedgerRecord[];
  addPersonalLedger: (record: Omit<PersonalLedgerRecord, 'id' | 'createdAt'>) => void;
  updatePersonalLedger: (id: string, updates: Partial<PersonalLedgerRecord>) => void;
  deletePersonalLedger: (id: string) => void;

  customerDebts: CustomerDebtRecord[];
  addCustomerDebt: (record: Omit<CustomerDebtRecord, 'id' | 'createdAt'>) => void;
  updateCustomerDebt: (id: string, updates: Partial<CustomerDebtRecord>) => void;
  deleteCustomerDebt: (id: string) => void;

  employeeAdvances: EmployeeAdvanceRecord[];
  addEmployeeAdvance: (record: Omit<EmployeeAdvanceRecord, 'id' | 'createdAt'>) => void;
  updateEmployeeAdvance: (id: string, updates: Partial<EmployeeAdvanceRecord>) => void;
  deleteEmployeeAdvance: (id: string) => void;

  // Calculated Reconciliation
  summary: ReconciliationSummary;
  getPeriodSummary: (periodId: string) => ReconciliationSummary;

  auditLogs: AuditLog[];
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
  resetToDefaults: () => void;

  // User Authentication & Permissions
  users: AppUser[];
  currentUser: AppUser;
  currentUserPermissions: UserPermissions;
  isAuthenticated: boolean;
  setCurrentUser: (user: AppUser) => void;
  login: (identifier: string, pin?: string) => { success: boolean; error?: string };
  logout: () => void;
  lockSession: () => void;
  addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  updatePharmacistPermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  hasPermission: (permissionKey: keyof UserPermissions) => boolean;
}

const TreasuryContext = createContext<TreasuryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'PHARMACY_TREASURY_APP_STATE_V2';

export const TreasuryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialData
  const [pharmacyProfile, setPharmacyProfile] = useState<PharmacyProfile>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_profile`);
      return saved ? JSON.parse(saved) : initialPharmacyProfile;
    } catch {
      return initialPharmacyProfile;
    }
  });

  const [periods, setPeriods] = useState<AccountingPeriod[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_periods`);
      return saved ? JSON.parse(saved) : initialPeriods;
    } catch {
      return initialPeriods;
    }
  });

  const [currentPeriodId, setCurrentPeriodId] = useState<string>(() => {
    return periods.find(p => !p.isClosed)?.id || periods[periods.length - 1]?.id || '2026-08';
  });

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_categories`);
      return saved ? JSON.parse(saved) : initialExpenseCategories;
    } catch {
      return initialExpenseCategories;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_suppliers`);
      return saved ? JSON.parse(saved) : initialSuppliers;
    } catch {
      return initialSuppliers;
    }
  });

  const [parties, setParties] = useState<Party[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_parties`);
      return saved ? JSON.parse(saved) : initialParties;
    } catch {
      return initialParties;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customers`);
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_employees`);
      return saved ? JSON.parse(saved) : initialEmployees;
    } catch {
      return initialEmployees;
    }
  });

  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_income`);
      return saved ? JSON.parse(saved) : initialIncomeRecords;
    } catch {
      return initialIncomeRecords;
    }
  });

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_spayments`);
      return saved ? JSON.parse(saved) : initialSupplierPayments;
    } catch {
      return initialSupplierPayments;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_expenses`);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_wallet`);
      return saved ? JSON.parse(saved) : initialWalletTransactions;
    } catch {
      return initialWalletTransactions;
    }
  });

  const [personalLedgers, setPersonalLedgers] = useState<PersonalLedgerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_personal`);
      return saved ? JSON.parse(saved) : initialPersonalLedgers;
    } catch {
      return initialPersonalLedgers;
    }
  });

  const [customerDebts, setCustomerDebts] = useState<CustomerDebtRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cdebts`);
      return saved ? JSON.parse(saved) : initialCustomerDebts;
    } catch {
      return initialCustomerDebts;
    }
  });

  const [employeeAdvances, setEmployeeAdvances] = useState<EmployeeAdvanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_eadvances`);
      return saved ? JSON.parse(saved) : initialEmployeeAdvances;
    } catch {
      return initialEmployeeAdvances;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_logs`);
      return saved ? JSON.parse(saved) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_users`);
      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_current_user_id`);
      return saved || 'user-manager';
    } catch {
      return 'user-manager';
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const sessionAuth = sessionStorage.getItem('PHARMACY_SESSION_AUTHENTICATED');
      return sessionAuth === 'true';
    } catch {
      return false;
    }
  });

  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || users[0] || initialUsers[0];
  }, [users, currentUserId]);

  const currentUserPermissions = useMemo(() => {
    return computeUserPermissions(currentUser);
  }, [currentUser]);

  const hasPermission = useCallback((permissionKey: keyof UserPermissions): boolean => {
    return !!currentUserPermissions[permissionKey];
  }, [currentUserPermissions]);

  // Debounced Sync to local storage for high performance
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(pharmacyProfile));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_periods`, JSON.stringify(periods));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_categories`, JSON.stringify(expenseCategories));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_parties`, JSON.stringify(parties));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_customers`, JSON.stringify(customers));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_employees`, JSON.stringify(employees));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_income`, JSON.stringify(incomeRecords));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_spayments`, JSON.stringify(supplierPayments));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenses`, JSON.stringify(expenses));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_wallet`, JSON.stringify(walletTransactions));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_personal`, JSON.stringify(personalLedgers));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_cdebts`, JSON.stringify(customerDebts));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_eadvances`, JSON.stringify(employeeAdvances));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_logs`, JSON.stringify(auditLogs));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_current_user_id`, currentUserId);
      } catch (e) {
        console.warn('Storage sync error:', e);
      }
    }, 120);

    return () => clearTimeout(timeout);
  }, [
    pharmacyProfile,
    periods,
    expenseCategories,
    suppliers,
    parties,
    customers,
    employees,
    incomeRecords,
    supplierPayments,
    expenses,
    walletTransactions,
    personalLedgers,
    customerDebts,
    employeeAdvances,
    auditLogs,
    users,
    currentUserId
  ]);

  const addAuditLog = (action: AuditLog['action'], entity: string, details: string, amount?: number) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      details,
      amount
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 100)]);
  };

  const updatePharmacyProfile = (updates: Partial<PharmacyProfile>) => {
    setPharmacyProfile(prev => ({ ...prev, ...updates }));
    addAuditLog('settings_update', 'بيانات الصيدلية', 'تم تحديث بيانات وشعار الصيدلية');
  };

  const currentPeriod = useMemo(() => {
    return periods.find(p => p.id === currentPeriodId) || periods[0] || {
      id: '2026-08',
      year: 2026,
      month: 8,
      name: 'أغسطس 2026',
      isClosed: false
    };
  }, [periods, currentPeriodId]);

  // Reconciliation Computation for any period
  const getPeriodSummary = (periodId: string): ReconciliationSummary => {
    const period = periods.find(p => p.id === periodId) || currentPeriod;
    
    // Period index to find previous month
    const sortedPeriods = [...periods].sort((a, b) => a.id.localeCompare(b.id));
    const currentIndex = sortedPeriods.findIndex(p => p.id === periodId);
    let calculatedCarriedOver = 0;
    
    if (period.customCarriedOver !== undefined) {
      calculatedCarriedOver = period.customCarriedOver;
    } else if (currentIndex > 0) {
      const prevPeriod = sortedPeriods[currentIndex - 1];
      // compute prev period net treasury
      const prevIncomes = incomeRecords.filter(r => r.periodId === prevPeriod.id).reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const prevSuppliers = supplierPayments.filter(r => r.periodId === prevPeriod.id).reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const prevExpenses = expenses.filter(r => r.periodId === prevPeriod.id).reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const prevNetMonth = prevIncomes - (prevSuppliers + prevExpenses);
      const prevCarried = prevPeriod.customCarriedOver || 0;
      calculatedCarriedOver = prevNetMonth + prevCarried;
    }

    // 1. Income
    const periodIncomes = incomeRecords.filter(r => r.periodId === periodId);
    let totalMorningIncome = 0;
    let totalEveningIncome = 0;
    let totalOtherIncome = 0;

    periodIncomes.forEach(r => {
      const amt = Number(r.amount) || 0;
      if (r.shiftType === 'morning') totalMorningIncome += amt;
      else if (r.shiftType === 'evening') totalEveningIncome += amt;
      else totalOtherIncome += amt;
    });
    const totalIncome = totalMorningIncome + totalEveningIncome + totalOtherIncome;

    // 2. Suppliers
    const periodSuppliers = supplierPayments.filter(r => r.periodId === periodId);
    const totalSupplierPayments = periodSuppliers.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    // 3. Expenses
    const periodExpenses = expenses.filter(r => r.periodId === periodId);
    const totalExpenses = periodExpenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    // 4. Net Month Income
    const netMonthIncome = totalIncome - (totalSupplierPayments + totalExpenses);

    // 5 & 6. Carried Over & Net Treasury
    const carriedOverBalance = calculatedCarriedOver;
    const netTreasury = netMonthIncome + carriedOverBalance;

    // 7. Wallet & InstaPay
    const periodWallets = walletTransactions.filter(r => r.periodId === periodId);
    const walletIn = periodWallets.reduce((s, r) => s + (Number(r.inAmount) || 0), 0);
    const walletOut = periodWallets.reduce((s, r) => s + (Number(r.outAmount) || 0), 0);
    const walletNetBalance = walletIn - walletOut;

    // 8. Responsible Person / Partner Ledger
    const periodLedgers = personalLedgers.filter(r => r.periodId === periodId);
    const responsiblePersonDebit = periodLedgers.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const responsiblePersonCredit = periodLedgers.reduce((s, r) => s + (Number(r.credit) || 0), 0);
    const responsiblePersonNet = responsiblePersonDebit - responsiblePersonCredit;

    // 9. Customer Debts
    const periodCustomerDebts = customerDebts.filter(r => r.periodId === periodId);
    const customerDebtsDebit = periodCustomerDebts.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const customerDebtsCredit = periodCustomerDebts.reduce((s, r) => s + (Number(r.credit) || 0), 0);
    const customerDebtsNet = customerDebtsDebit - customerDebtsCredit;

    // 10. Employee Advances
    const periodAdvances = employeeAdvances.filter(r => r.periodId === periodId);
    const employeeAdvancesWithdrawn = periodAdvances.reduce((s, r) => s + (Number(r.withdrawnAmount) || 0), 0);
    const employeeAdvancesReturned = periodAdvances.reduce((s, r) => s + (Number(r.returnedAmount) || 0), 0);
    const employeeAdvancesNet = employeeAdvancesWithdrawn - employeeAdvancesReturned;

    // 11. Expected Cash
    const expectedCash = netTreasury - (walletNetBalance + responsiblePersonNet + customerDebtsNet + employeeAdvancesNet);

    // 12. Actual Cash Counted
    const actualCashCounted = period.actualCashCounted !== undefined ? period.actualCashCounted : 0;

    // 13. Difference
    const difference = actualCashCounted - expectedCash;
    let status: ReconciliationSummary['status'] = 'pending';
    if (period.actualCashCounted !== undefined) {
      if (Math.abs(difference) < 0.01) status = 'balanced';
      else if (difference > 0) status = 'surplus';
      else status = 'deficit';
    }

    return {
      period,
      totalMorningIncome,
      totalEveningIncome,
      totalOtherIncome,
      totalIncome,
      totalSupplierPayments,
      totalExpenses,
      netMonthIncome,
      carriedOverBalance,
      netTreasury,
      walletIn,
      walletOut,
      walletNetBalance,
      responsiblePersonDebit,
      responsiblePersonCredit,
      responsiblePersonNet,
      customerDebtsDebit,
      customerDebtsCredit,
      customerDebtsNet,
      employeeAdvancesWithdrawn,
      employeeAdvancesReturned,
      employeeAdvancesNet,
      expectedCash,
      actualCashCounted,
      difference,
      status
    };
  };

  const summary = useMemo(() => {
    return getPeriodSummary(currentPeriodId);
  }, [
    currentPeriodId,
    periods,
    incomeRecords,
    supplierPayments,
    expenses,
    walletTransactions,
    personalLedgers,
    customerDebts,
    employeeAdvances
  ]);

  // Period actions
  const addPeriod = (year: number, month: number, name: string, notes?: string) => {
    const id = `${year}-${String(month).padStart(2, '0')}`;
    if (periods.some(p => p.id === id)) {
      alert('هذه الفترة موجودة بالفعل!');
      return;
    }
    const newPeriod: AccountingPeriod = {
      id,
      year,
      month,
      name,
      isClosed: false,
      notes: notes || ''
    };
    setPeriods(prev => [...prev, newPeriod]);
    setCurrentPeriodId(id);
    addAuditLog('create', 'فترة جديدة', `تم إنشاء دورة محاسبية جديدة: ${name}`);
  };

  const updatePeriod = (id: string, updates: Partial<AccountingPeriod>) => {
    setPeriods(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addAuditLog('update', 'الفترة المحاسبية', `تحديث بيانات الفترة ${id}`);
  };

  const deletePeriod = (id: string) => {
    if (periods.length <= 1) {
      alert('لا يمكن حذف الفترة الوحيدة المتبقية في النظام.');
      return;
    }
    setPeriods(prev => prev.filter(p => p.id !== id));
    if (currentPeriodId === id) {
      const remaining = periods.filter(p => p.id !== id);
      setCurrentPeriodId(remaining[remaining.length - 1].id);
    }
    addAuditLog('delete', 'الفترة المحاسبية', `تم حذف الفترة ${id}`);
  };

  const closePeriod = (id: string, actualCash: number) => {
    setPeriods(prev => prev.map(p => p.id === id ? {
      ...p,
      isClosed: true,
      actualCashCounted: actualCash,
      closedAt: new Date().toISOString()
    } : p));
    addAuditLog('close_period', 'إقفال شهر', `تم إقفال الفترة ${id} برصيد فعلي ${actualCash} ج.م`);
  };

  const reopenPeriod = (id: string) => {
    setPeriods(prev => prev.map(p => p.id === id ? {
      ...p,
      isClosed: false,
      closedAt: undefined
    } : p));
    addAuditLog('update', 'إعادة فتح شهر', `تم إعادة فتح الفترة ${id} للتعديل`);
  };

  // Master Categories
  const addExpenseCategory = (name: string, color = 'emerald') => {
    const newCat: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name,
      color
    };
    setExpenseCategories(prev => [...prev, newCat]);
    addAuditLog('create', 'تصنيف مصروفات', `إضافة تصنيف: ${name}`);
  };

  const updateExpenseCategory = (id: string, updates: Partial<ExpenseCategory>) => {
    setExpenseCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteExpenseCategory = (id: string) => {
    setExpenseCategories(prev => prev.filter(c => c.id !== id));
    addAuditLog('delete', 'تصنيف مصروفات', `حذف تصنيف`);
  };

  // Suppliers
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setSuppliers(prev => [...prev, newSup]);
    addAuditLog('create', 'مورد جديد', `إضافة مورد: ${supplier.name}`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    addAuditLog('delete', 'مورد', `حذف مورد`);
  };

  // Parties
  const addParty = (party: Omit<Party, 'id'>) => {
    const newP: Party = {
      ...party,
      id: `party-${Date.now()}`
    };
    setParties(prev => [...prev, newP]);
    addAuditLog('create', 'شريك/طرف مسؤول', `إضافة طرف: ${party.name}`);
  };

  const updateParty = (id: string, updates: Partial<Party>) => {
    setParties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteParty = (id: string) => {
    setParties(prev => prev.filter(p => p.id !== id));
  };

  // Customers
  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newC: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [...prev, newC]);
    addAuditLog('create', 'عميل جديد', `إضافة عميل: ${customer.name}`);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    addAuditLog('delete', 'عميل', `حذف عميل`);
  };

  // Employees
  const addEmployee = (emp: Omit<Employee, 'id' | 'createdAt'>) => {
    const newE: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setEmployees(prev => [...prev, newE]);
    addAuditLog('create', 'موظف جديد', `إضافة موظف: ${emp.name}`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    addAuditLog('delete', 'موظف', `حذف موظف`);
  };

  // Income transactions
  const addIncomeRecord = (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
    const newR: IncomeRecord = {
      ...record,
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setIncomeRecords(prev => [newR, ...prev]);
    addAuditLog('create', 'تسليم دخل', `تسليم شفت ${record.shiftType === 'morning' ? 'صباحي' : 'مسائي'} بقيمة ${record.amount} ج.م`, record.amount);
  };

  const updateIncomeRecord = (id: string, updates: Partial<IncomeRecord>) => {
    setIncomeRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    addAuditLog('update', 'تسليم دخل', `تعديل سجل دخل`);
  };

  const deleteIncomeRecord = (id: string) => {
    setIncomeRecords(prev => prev.filter(r => r.id !== id));
    addAuditLog('delete', 'تسليم دخل', `حذف سجل دخل`);
  };

  // Supplier payments
  const addSupplierPayment = (payment: Omit<SupplierPayment, 'id' | 'createdAt'>) => {
    const newP: SupplierPayment = {
      ...payment,
      id: `sp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setSupplierPayments(prev => [newP, ...prev]);
    const supName = suppliers.find(s => s.id === payment.supplierId)?.name || 'مورد';
    addAuditLog('create', 'سداد مورد', `سداد مبلغ ${payment.amount} ج.م لـ ${supName}`, payment.amount);
  };

  const updateSupplierPayment = (id: string, updates: Partial<SupplierPayment>) => {
    setSupplierPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addAuditLog('update', 'سداد مورد', `تعديل سداد مورد`);
  };

  const deleteSupplierPayment = (id: string) => {
    setSupplierPayments(prev => prev.filter(p => p.id !== id));
    addAuditLog('delete', 'سداد مورد', `حذف سداد مورد`);
  };

  const toggleSupplierPaymentVerification = (id: string, customVerifiedBy?: string) => {
    const payment = supplierPayments.find(p => p.id === id);
    if (!payment) return;
    const isNowVerified = !payment.verified;
    const verifier = customVerifiedBy || currentUser.name || 'المحاسب المسؤول';
    const timestamp = isNowVerified ? new Date().toISOString() : undefined;

    setSupplierPayments(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        verified: isNowVerified,
        verifiedAt: timestamp,
        verifiedBy: isNowVerified ? verifier : undefined
      };
    }));

    const supName = suppliers.find(s => s.id === payment.supplierId)?.name || 'مورد';
    addAuditLog(
      'update',
      'التحقق من سداد المورد',
      isNowVerified
        ? `تم التحقق وتأكيد سداد مبلغ ${payment.amount} ج.م لشركة/مورد (${supName}) بواسطة ${verifier}`
        : `تم إلغاء التحقق من سداد (${supName})`,
      payment.amount
    );
  };

  const bulkVerifySupplierPayments = (ids: string[], verify: boolean) => {
    const verifier = currentUser.name || 'المحاسب المسؤول';
    const timestamp = verify ? new Date().toISOString() : undefined;

    setSupplierPayments(prev => prev.map(p => {
      if (!ids.includes(p.id)) return p;
      return {
        ...p,
        verified: verify,
        verifiedAt: timestamp,
        verifiedBy: verify ? verifier : undefined
      };
    }));

    addAuditLog(
      'update',
      'تحقق جماعي للموردين',
      verify
        ? `تم التحقق وتأكيد ${ids.length} دفعة سداد للموردين دفعة واحدة بواسطة ${verifier}`
        : `تم إلغاء تأكيد ${ids.length} دفعة سداد للموردين`
    );
  };

  // Expenses
  const addExpense = (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newE: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newE, ...prev]);
    addAuditLog('create', 'مصروفات', `تسجيل مصروف ${expense.itemName} بقيمة ${expense.amount} ج.م`, expense.amount);
  };

  const updateExpense = (id: string, updates: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addAuditLog('update', 'مصروفات', `تعديل بند مصروف`);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    addAuditLog('delete', 'مصروفات', `حذف بند مصروف`);
  };

  // Wallet
  const addWalletTransaction = (tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
    const newT: WalletTransaction = {
      ...tx,
      id: `wal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setWalletTransactions(prev => [newT, ...prev]);
    const details = tx.inAmount > 0 ? `دخول محفظة ${tx.inAmount} ج.م (${tx.tag})` : `خروج محفظة ${tx.outAmount} ج.م (${tx.tag})`;
    addAuditLog('create', 'المحفظة الرقمية', details, tx.inAmount || tx.outAmount);
  };

  const updateWalletTransaction = (id: string, updates: Partial<WalletTransaction>) => {
    setWalletTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    addAuditLog('update', 'المحفظة الرقمية', `تعديل حركة محفظة`);
  };

  const deleteWalletTransaction = (id: string) => {
    setWalletTransactions(prev => prev.filter(t => t.id !== id));
    addAuditLog('delete', 'المحفظة الرقمية', `حذف حركة محفظة`);
  };

  // Personal Ledgers
  const addPersonalLedger = (record: Omit<PersonalLedgerRecord, 'id' | 'createdAt'>) => {
    const newR: PersonalLedgerRecord = {
      ...record,
      id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setPersonalLedgers(prev => [newR, ...prev]);
    const pName = parties.find(p => p.id === record.partyId)?.name || 'الطرف المسؤول';
    const desc = record.debit > 0 ? `سحب (مدين) ${record.debit} ج.م على ${pName}` : `سداد/رد (دائن) ${record.credit} ج.م من ${pName}`;
    addAuditLog('create', 'حساب الشركاء/المسؤول', desc, record.debit || record.credit);
  };

  const updatePersonalLedger = (id: string, updates: Partial<PersonalLedgerRecord>) => {
    setPersonalLedgers(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    addAuditLog('update', 'حساب الشركاء/المسؤول', `تعديل قيد جاري`);
  };

  const deletePersonalLedger = (id: string) => {
    setPersonalLedgers(prev => prev.filter(r => r.id !== id));
    addAuditLog('delete', 'حساب الشركاء/المسؤول', `حذف قيد جاري`);
  };

  // Customer Debts
  const addCustomerDebt = (record: Omit<CustomerDebtRecord, 'id' | 'createdAt'>) => {
    const newR: CustomerDebtRecord = {
      ...record,
      id: `cd-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setCustomerDebts(prev => [newR, ...prev]);
    const cName = customers.find(c => c.id === record.customerId)?.name || 'العميل';
    const desc = record.debit > 0 ? `دين جديد ${record.debit} ج.م على ${cName}` : `سداد ${record.credit} ج.م من ${cName}`;
    addAuditLog('create', 'ديون العملاء', desc, record.debit || record.credit);
  };

  const updateCustomerDebt = (id: string, updates: Partial<CustomerDebtRecord>) => {
    setCustomerDebts(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    addAuditLog('update', 'ديون العملاء', `تعديل حركة دين`);
  };

  const deleteCustomerDebt = (id: string) => {
    setCustomerDebts(prev => prev.filter(r => r.id !== id));
    addAuditLog('delete', 'ديون العملاء', `حذف حركة دين`);
  };

  // Employee Advances
  const addEmployeeAdvance = (record: Omit<EmployeeAdvanceRecord, 'id' | 'createdAt'>) => {
    const newR: EmployeeAdvanceRecord = {
      ...record,
      id: `ea-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setEmployeeAdvances(prev => [newR, ...prev]);
    const empName = employees.find(e => e.id === record.employeeId)?.name || 'الموظف';
    const desc = record.withdrawnAmount > 0 ? `سلفة مسحوبة ${record.withdrawnAmount} ج.م لـ ${empName}` : `رد/خصم سلفة ${record.returnedAmount} ج.م لـ ${empName}`;
    addAuditLog('create', 'سلف الموظفين', desc, record.withdrawnAmount || record.returnedAmount);
  };

  const updateEmployeeAdvance = (id: string, updates: Partial<EmployeeAdvanceRecord>) => {
    setEmployeeAdvances(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    addAuditLog('update', 'سلف الموظفين', `تعديل سلفة موظف`);
  };

  const deleteEmployeeAdvance = (id: string) => {
    setEmployeeAdvances(prev => prev.filter(r => r.id !== id));
    addAuditLog('delete', 'سلف الموظفين', `حذف سلفة موظف`);
  };

  // Export / Import / Reset
  const exportDataJson = (): string => {
    const fullBackup = {
      pharmacyProfile,
      periods,
      expenseCategories,
      suppliers,
      parties,
      customers,
      employees,
      incomeRecords,
      supplierPayments,
      expenses,
      walletTransactions,
      personalLedgers,
      customerDebts,
      employeeAdvances,
      auditLogs,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.pharmacyProfile) setPharmacyProfile(data.pharmacyProfile);
      if (data.periods) setPeriods(data.periods);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.parties) setParties(data.parties);
      if (data.customers) setCustomers(data.customers);
      if (data.employees) setEmployees(data.employees);
      if (data.incomeRecords) setIncomeRecords(data.incomeRecords);
      if (data.supplierPayments) setSupplierPayments(data.supplierPayments);
      if (data.expenses) setExpenses(data.expenses);
      if (data.walletTransactions) setWalletTransactions(data.walletTransactions);
      if (data.personalLedgers) setPersonalLedgers(data.personalLedgers);
      if (data.customerDebts) setCustomerDebts(data.customerDebts);
      if (data.employeeAdvances) setEmployeeAdvances(data.employeeAdvances);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      addAuditLog('settings_update', 'استرجاع نسخة احتياطية', 'تم استرجاع البيانات بنجاح من ملف خارجي');
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  };

  // User Management & Authentication
  const setCurrentUser = (user: AppUser) => {
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('PHARMACY_SESSION_AUTHENTICATED', 'true');
    } catch {
      // ignore
    }
    addAuditLog('settings_update', 'تبديل المستخدم', `تم تسجيل الدخول بحساب: ${user.name} (${user.role})`);
  };

  const login = (identifier: string, pin?: string): { success: boolean; error?: string } => {
    const user = users.find(u => 
      u.id === identifier || 
      u.username.toLowerCase() === identifier.toLowerCase() ||
      u.name.toLowerCase() === identifier.toLowerCase()
    );

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    if (user.pin && user.pin !== pin) {
      return { success: false, error: 'رمز PIN غير صحيح' };
    }

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('PHARMACY_SESSION_AUTHENTICATED', 'true');
    } catch {
      // ignore
    }

    // update lastActive
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, lastActive: new Date().toISOString() } : u));
    addAuditLog('settings_update', 'تسجيل دخول', `تسجيل دخول ناجح: ${user.name}`);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('PHARMACY_SESSION_AUTHENTICATED');
    } catch {
      // ignore
    }
    addAuditLog('settings_update', 'تسجيل خروج', `تسجيل خروج المستخدم: ${currentUser.name}`);
  };

  const lockSession = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('PHARMACY_SESSION_AUTHENTICATED');
    } catch {
      // ignore
    }
  };

  const addUser = (user: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customPermissions: user.role === 'pharmacist' ? (user.customPermissions || {
        dashboard: false,
        income: true,
        suppliers: false,
        expenses: false,
        wallet: false,
        personal: false,
        customers: true,
        employees: false,
        report: false,
        settings: false,
        users: false,
        quickEntry: true,
        closePeriod: false,
        deleteRecords: false
      }) : undefined
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('create', 'إدارة المستخدمين', `إضافة مستخدم جديد: ${newUser.name} (${newUser.role})`);
  };

  const updateUser = (id: string, updates: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    addAuditLog('update', 'إدارة المستخدمين', `تحديث بيانات المستخدم`);
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1) return;
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.role === 'manager') {
      const managersCount = users.filter(u => u.role === 'manager').length;
      if (managersCount <= 1) {
        alert('لا يمكن حذف المدير الوحيد في النظام!');
        return;
      }
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUserId === id) {
      const remaining = users.filter(u => u.id !== id);
      if (remaining.length > 0) {
        setCurrentUserId(remaining[0].id);
      }
    }
    addAuditLog('delete', 'إدارة المستخدمين', `حذف مستخدم`);
  };

  // المدير يحدد صلاحيات الصيدلي بدقة
  const updatePharmacistPermissions = (userId: string, permissions: Partial<UserPermissions>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const existing = u.customPermissions || {};
        return {
          ...u,
          customPermissions: {
            ...existing,
            ...permissions
          }
        };
      }
      return u;
    }));
    const targetUser = users.find(u => u.id === userId);
    addAuditLog('update', 'تعديل الصلاحيات', `قام المدير بتعديل صلاحيات الصيدلي: ${targetUser?.name || userId}`);
  };

  const resetToDefaults = () => {
    setPharmacyProfile(initialPharmacyProfile);
    setPeriods(initialPeriods);
    setCurrentPeriodId('2026-08');
    setExpenseCategories(initialExpenseCategories);
    setSuppliers(initialSuppliers);
    setParties(initialParties);
    setCustomers(initialCustomers);
    setEmployees(initialEmployees);
    setIncomeRecords(initialIncomeRecords);
    setSupplierPayments(initialSupplierPayments);
    setExpenses(initialExpenses);
    setWalletTransactions(initialWalletTransactions);
    setPersonalLedgers(initialPersonalLedgers);
    setCustomerDebts(initialCustomerDebts);
    setEmployeeAdvances(initialEmployeeAdvances);
    setAuditLogs(initialAuditLogs);
    setUsers(initialUsers);
    setCurrentUserId('user-manager');
    addAuditLog('settings_update', 'استعادة المصنع', 'تمت استعادة البيانات الافتراضية');
  };

  return (
    <TreasuryContext.Provider
      value={{
        pharmacyProfile,
        updatePharmacyProfile,
        periods,
        currentPeriodId,
        setCurrentPeriodId,
        currentPeriod,
        addPeriod,
        updatePeriod,
        deletePeriod,
        closePeriod,
        reopenPeriod,
        expenseCategories,
        addExpenseCategory,
        updateExpenseCategory,
        deleteExpenseCategory,
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        parties,
        addParty,
        updateParty,
        deleteParty,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        incomeRecords,
        addIncomeRecord,
        updateIncomeRecord,
        deleteIncomeRecord,
        supplierPayments,
        addSupplierPayment,
        updateSupplierPayment,
        deleteSupplierPayment,
        toggleSupplierPaymentVerification,
        bulkVerifySupplierPayments,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        walletTransactions,
        addWalletTransaction,
        updateWalletTransaction,
        deleteWalletTransaction,
        personalLedgers,
        addPersonalLedger,
        updatePersonalLedger,
        deletePersonalLedger,
        customerDebts,
        addCustomerDebt,
        updateCustomerDebt,
        deleteCustomerDebt,
        employeeAdvances,
        addEmployeeAdvance,
        updateEmployeeAdvance,
        deleteEmployeeAdvance,
        summary,
        getPeriodSummary,
        auditLogs,
        exportDataJson,
        importDataJson,
        resetToDefaults,
        users,
        currentUser,
        currentUserPermissions,
        isAuthenticated,
        setCurrentUser,
        login,
        logout,
        lockSession,
        addUser,
        updateUser,
        deleteUser,
        updatePharmacistPermissions,
        hasPermission
      }}
    >
      {children}
    </TreasuryContext.Provider>
  );
};

export const useTreasury = () => {
  const context = useContext(TreasuryContext);
  if (!context) {
    throw new Error('useTreasury must be used within a TreasuryProvider');
  }
  return context;
};
