export type ShiftType = 'morning' | 'evening' | 'night' | 'other';
export type PaymentMethod = 'cash' | 'instapay' | 'wallet' | 'vodafone_cash' | 'orange_cash' | 'etisalat_cash' | 'bank_transfer' | 'other';

export interface PharmacyProfile {
  name: string;
  slogan: string;
  logoUrl: string;
  phone: string;
  managerWhatsApp?: string;
  address: string;
  taxNumber?: string;
  commercialRecord?: string;
  currency: string;
  managerName: string;
}

export interface AccountingPeriod {
  id: string; // e.g. "2026-08"
  year: number;
  month: number;
  name: string; // e.g. "أغسطس 2026"
  isClosed: boolean;
  actualCashCounted?: number;
  customCarriedOver?: number; // Override if needed
  notes?: string;
  closedAt?: string;
}

export interface IncomeRecord {
  id: string;
  periodId: string;
  date: string;
  time?: string;
  shiftType: ShiftType;
  amount: number;
  cashierName?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  representativeName?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  periodId: string;
  supplierId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
  verified?: boolean; // تم التحقق من صحة ومطابقة السداد بواسطة المحاسب
  verifiedAt?: string; // توقيت التحقق
  verifiedBy?: string; // اسم المحاسب أو المسؤول المعتمد
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface ExpenseRecord {
  id: string;
  periodId: string;
  categoryId: string;
  itemName: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  periodId: string;
  date: string;
  method: 'instapay' | 'wallet' | 'vodafone_cash' | 'orange_cash' | 'etisalat_cash' | 'bank_transfer';
  inAmount: number;
  outAmount: number;
  tag?: string; // الملاحظات والوسم - اختياري ويمكن أن يترك فارغاً
  notes?: string; // الملاحظات والبيان - اختياري
  createdAt: string;
}

export interface Party {
  id: string;
  name: string;
  role: 'partner' | 'responsible' | 'sub_account' | 'other';
  phone?: string;
  notes?: string;
}

export interface PersonalLedgerRecord {
  id: string;
  periodId: string;
  partyId: string;
  date: string;
  method: 'cash' | 'instapay' | 'wallet' | 'other';
  debit: number; // مسحوب (عليه)
  credit: number; // مسدد / مرجع (له)
  subAccountTag?: string; // e.g., "مصباح"
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  address?: string; // e.g. "163 شقة 51"
  phone?: string;
  notes?: string;
  creditLimit?: number;
  createdAt: string;
}

export interface CustomerDebtRecord {
  id: string;
  periodId: string;
  customerId: string;
  date: string;
  debit: number; // دين جديد على العميل
  credit: number; // سداد من العميل
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  jobTitle?: string;
  phone?: string;
  maxAdvanceLimit?: number;
  notes?: string;
  createdAt: string;
}

export interface EmployeeAdvanceRecord {
  id: string;
  periodId: string;
  employeeId: string;
  date: string;
  method: 'cash' | 'wallet' | 'instapay';
  withdrawnAmount: number; // مسحوب
  returnedAmount: number; // تم رده أو خصمه من المرتب
  notes?: string; // e.g., "سلفة", "عجز شفت"
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'close_period' | 'settings_update';
  entity: string;
  details: string;
  amount?: number;
}

// Cash Drawer Shift & Expenses Management
export type DrawerExpenseCategory = 
  | 'supplier' // سداد شركات وموردين
  | 'expense' // مصاريف وتشغيل ونثريات
  | 'employee_advance' // سلف ومسحوبات موظفين
  | 'customer_debt' // دين عميل / آجل
  | 'wallet_instapay' // نقود غير ممسوكة باليد (محافظ / انستاباي)
  | 'partner_withdrawal' // مسحوبات شركاء ومسؤول
  | 'general'; // نثريات ومصروفات أخرى عامة

export interface DrawerExpenseItem {
  id: string;
  shiftId: string;
  title: string;
  amount: number;
  category: DrawerExpenseCategory;
  targetEntityId?: string; // supplierId, categoryId, employeeId, customerId, partyId
  paymentMethod?: 'cash' | 'wallet' | 'instapay';
  notes?: string;
  createdAt: string;
}

export interface InstaPayTransfer {
  id: string;
  shiftId: string;
  amount: number;
  sender?: string; // اسم الراسل أو ملاحظة
  method?: 'instapay';
  time?: string;
  notes?: string;
  createdAt: string;
}

export interface WalletTransfer {
  id: string;
  shiftId: string;
  amount: number;
  sender?: string; // اسم الراسل أو ملاحظة
  time?: string;
  notes?: string;
  createdAt: string;
}

export interface DrawerShift {
  id: string;
  periodId: string;
  date: string; // YYYY-MM-DD
  time?: string;
  dayName?: string; // السبت، الأحد...
  pharmacistName: string;
  pharmacistId?: string;
  shiftType: ShiftType; // 'morning' | 'evening' | 'night' | 'other'
  openingBalance: number; // رصيد الدرج الافتتاحي (رقم مرجعي لاستلام العهدة فقط - لا يدخل في العمليات الحسابية)
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  
  // Expenses recorded in the drawer during this shift (صدقة، مسحوبات، مصروفات، موردين)
  expenses: DrawerExpenseItem[];
  totalExpenses: number; // إجمالي المصروفات النقدية
  
  // InstaPay transfers (تحويلات إنستاباي بالوردية)
  instaPayTransfers?: InstaPayTransfer[];
  totalInstaPay?: number; // إجمالي تحويلات إنستاباي

  // Digital Wallets transfers (تحويلات المحفظة الإلكترونية بالوردية - فودافون كاش / المحافظ)
  walletTransfers?: WalletTransfer[];
  totalWallet?: number; // إجمالي تحويلات المحفظة الإلكترونية
  
  // Shift Sales / Income (إجمالي مبيعات الشفت = المصروفات + انستا + المحفظة + المتروك + المحول للخزينة)
  totalSales?: number;
  
  // Closing values
  leftInDrawer: number; // المبلغ المتروك في الدرج (رصيد الوردية القادمة)
  transferredToVault: number; // مبلغ النقدية المحول للخزينة نقدي باليد
  notes?: string;
  
  // Manager Review & Distribution state
  isApprovedByManager?: boolean; // هل تم اعتماد الوردية من قبل المدير
  approvedAt?: string; // تاريخ ووقت اعتماد المدير
  approvedBy?: string; // اسم المدير الذي اعتمد الوردية
  distributedToModules?: boolean; // هل تم ترحيل وتوزيع البنود على موديولات التطبيق (الخزانة، الموردين، السلف، الديون...)
}

export interface ReconciliationSummary {
  period: AccountingPeriod;
  totalMorningIncome: number;
  totalEveningIncome: number;
  totalOtherIncome: number;
  totalIncome: number;
  
  totalSupplierPayments: number;
  totalExpenses: number;
  netMonthIncome: number; // totalIncome - (suppliers + expenses)
  carriedOverBalance: number; // from previous month
  netTreasury: number; // netMonthIncome + carriedOverBalance (صافي الخزانة)
  
  // Where is the money? (فين الفلوس)
  walletIn: number;
  walletOut: number;
  walletNetBalance: number; // in - out
  
  responsiblePersonDebit: number;
  responsiblePersonCredit: number;
  responsiblePersonNet: number; // debit - credit
  
  customerDebtsDebit: number;
  customerDebtsCredit: number;
  customerDebtsNet: number; // debit - credit
  
  employeeAdvancesWithdrawn: number;
  employeeAdvancesReturned: number;
  employeeAdvancesNet: number; // withdrawn - returned
  
  expectedCash: number; // netTreasury - (walletNet + responsibleNet + customerNet + employeeNet)
  actualCashCounted: number;
  difference: number; // actual - expected
  status: 'balanced' | 'surplus' | 'deficit' | 'pending';
}

// User Roles & Access Control
export type UserRole = 'manager' | 'accountant' | 'pharmacist';

export interface UserPermissions {
  dashboard: boolean; // لوحة الخزانة والتسوية
  drawer: boolean; // مصروفات وورديات درج النقدية
  income: boolean; // الدخل والورديات
  suppliers: boolean; // سداد الشركات والموردين
  expenses: boolean; // المصروفات والنثريات
  wallet: boolean; // المحافظ والإنستاباي
  personal: boolean; // مسحوبات الشركاء والمسؤول
  customers: boolean; // ديون وحسابات العملاء
  employees: boolean; // سلف وحسابات الموظفين
  report: boolean; // تقرير التسوية الشهري والطباعة
  profile: boolean; // الصفحة الشخصية للمستخدم وتعديل بياناته
  settings: boolean; // إعدادات وبيانات الصيدلية
  users: boolean; // إدارة المستخدمين وتحديد الصلاحيات (المدير فقط)
  quickEntry: boolean; // إضافة حركة سريعة
  closePeriod: boolean; // إقفال وإعادة فتح الشهور (المدير فقط)
  deleteRecords: boolean; // حذف العمليات والسجلات القديمة
  backup: boolean; // النسخ الاحتياطي واستعادة البيانات
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  pin: string; // رمز الدخول السريع (مثال: 1234)
  jobTitle?: string;
  avatarColor?: string;
  phone?: string;
  createdAt: string;
  lastActive?: string;
  customPermissions?: Partial<UserPermissions>; // صلاحيات مخصصة يحددها المدير للصيدلي
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  reason: 'manual' | 'auto' | 'pre_restore' | 'period_close';
  recordsCount: number;
  dataJson: string;
  sizeBytes?: number;
}

export interface BackupPackage {
  appName: string;
  version: string;
  exportedAt: string;
  pharmacyProfile: PharmacyProfile;
  periods: AccountingPeriod[];
  currentPeriodId: string;
  expenseCategories: ExpenseCategory[];
  suppliers: Supplier[];
  parties: Party[];
  customers: Customer[];
  employees: Employee[];
  incomeRecords: IncomeRecord[];
  supplierPayments: SupplierPayment[];
  expenses: ExpenseRecord[];
  walletTransactions: WalletTransaction[];
  personalLedgers: PersonalLedgerRecord[];
  customerDebts: CustomerDebtRecord[];
  employeeAdvances: EmployeeAdvanceRecord[];
  drawerShifts?: DrawerShift[];
  auditLogs: AuditLog[];
  users: AppUser[];
  stats?: {
    totalRecords: number;
    periodsCount: number;
    suppliersCount: number;
    expensesCount: number;
    incomeCount: number;
    walletCount: number;
  };
}

