import * as XLSX from 'xlsx';
import {
  PharmacyProfile,
  AccountingPeriod,
  IncomeRecord,
  SupplierPayment,
  Supplier,
  ExpenseRecord,
  ExpenseCategory,
  WalletTransaction,
  Party,
  PersonalLedgerRecord,
  Customer,
  CustomerDebtRecord,
  Employee,
  EmployeeAdvanceRecord,
  ReconciliationSummary
} from '../types';
import { formatDateArabic } from './formatters';

export interface ExcelExportSheetSelection {
  summary: boolean;
  income: boolean;
  suppliers: boolean;
  expenses: boolean;
  wallet: boolean;
  personal: boolean;
  customers: boolean;
  employees: boolean;
  masterData: boolean;
}

export type ExcelPeriodScope = 'current' | 'all' | 'selected' | 'custom_range';

export interface ExcelExportOptions {
  periodScope: ExcelPeriodScope;
  selectedPeriodId?: string;
  dateFrom?: string;
  dateTo?: string;
  selectedSheets: ExcelExportSheetSelection;
  includeHeaderMetadata: boolean;
  includeSubtotals: boolean;
  customFileName?: string;
  verifiedOnlySuppliers?: boolean;
}

export interface TreasuryDataset {
  pharmacyProfile: PharmacyProfile;
  periods: AccountingPeriod[];
  currentPeriod: AccountingPeriod;
  incomeRecords: IncomeRecord[];
  suppliers: Supplier[];
  supplierPayments: SupplierPayment[];
  expenseCategories: ExpenseCategory[];
  expenses: ExpenseRecord[];
  walletTransactions: WalletTransaction[];
  parties: Party[];
  personalLedgers: PersonalLedgerRecord[];
  customers: Customer[];
  customerDebts: CustomerDebtRecord[];
  employees: Employee[];
  employeeAdvances: EmployeeAdvanceRecord[];
  getPeriodSummary: (periodId: string) => ReconciliationSummary;
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Filter items by date or period scope
 */
function filterByScope<T extends { periodId: string; date?: string }>(
  items: T[],
  options: ExcelExportOptions,
  currentPeriodId: string
): T[] {
  if (options.periodScope === 'current') {
    return items.filter(i => i.periodId === currentPeriodId);
  }
  if (options.periodScope === 'selected' && options.selectedPeriodId) {
    return items.filter(i => i.periodId === options.selectedPeriodId);
  }
  if (options.periodScope === 'custom_range') {
    return items.filter(i => {
      if (!i.date) return true;
      if (options.dateFrom && i.date < options.dateFrom) return false;
      if (options.dateTo && i.date > options.dateTo) return false;
      return true;
    });
  }
  // 'all'
  return items;
}

/**
 * Auto calculates column widths based on cell content length
 */
function calculateColWidths(rows: any[][]): Array<{ wch: number }> {
  const colWidths: number[] = [];
  rows.forEach(row => {
    row.forEach((cell, colIndex) => {
      const valStr = cell !== null && cell !== undefined ? String(cell) : '';
      // Arabic characters take more visual width, calculate safely
      const len = Math.max(valStr.length + 3, 10);
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 8, len);
    });
  });
  return colWidths.map(w => ({ wch: Math.min(w, 50) }));
}

/**
 * Main export function to generate and download a customized multi-sheet Excel file
 */
export function exportTreasuryToExcel(
  dataset: TreasuryDataset,
  options: ExcelExportOptions
): { success: boolean; fileName: string; sheetsCount: number; recordsCount: number } {
  const {
    pharmacyProfile,
    periods,
    currentPeriod,
    incomeRecords,
    suppliers,
    supplierPayments,
    expenseCategories,
    expenses,
    walletTransactions,
    parties,
    personalLedgers,
    customers,
    customerDebts,
    employees,
    employeeAdvances,
    getPeriodSummary
  } = dataset;

  const wb = XLSX.utils.book_new();
  let totalRecordsExported = 0;
  let sheetsCount = 0;

  // Determine active period name for header
  let targetPeriodName = currentPeriod.name;
  if (options.periodScope === 'all') {
    targetPeriodName = 'كافة الفترات المسجلة';
  } else if (options.periodScope === 'selected' && options.selectedPeriodId) {
    const found = periods.find(p => p.id === options.selectedPeriodId);
    targetPeriodName = found ? found.name : options.selectedPeriodId;
  } else if (options.periodScope === 'custom_range') {
    targetPeriodName = `الفترة من ${options.dateFrom || 'البداية'} إلى ${options.dateTo || 'النهاية'}`;
  }

  // Filter datasets
  const filteredIncome = filterByScope(incomeRecords, options, currentPeriod.id);
  let filteredSuppliers = filterByScope(supplierPayments, options, currentPeriod.id);
  if (options.verifiedOnlySuppliers) {
    filteredSuppliers = filteredSuppliers.filter(s => s.verified);
  }
  const filteredExpenses = filterByScope(expenses, options, currentPeriod.id);
  const filteredWallet = filterByScope(walletTransactions, options, currentPeriod.id);
  const filteredPersonal = filterByScope(personalLedgers, options, currentPeriod.id);
  const filteredDebts = filterByScope(customerDebts, options, currentPeriod.id);
  const filteredAdvances = filterByScope(employeeAdvances, options, currentPeriod.id);

  // Helper to create Header block
  const createMetadataBlock = (sheetTitle: string): any[][] => {
    if (!options.includeHeaderMetadata) return [];
    return [
      [`🏥 ${pharmacyProfile.name} - منظومة إدارة الخزينة والحسابات`],
      [`📋 الشيت: ${sheetTitle}`, `الفترة: ${targetPeriodName}`, `تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}`],
      [`العملة: ${pharmacyProfile.currency}`, `المدير المسؤول: ${pharmacyProfile.managerName || 'غير محدد'}`, `الهاتف: ${pharmacyProfile.phone || 'غير مسجل'}`],
      [] // empty line
    ];
  };

  // --------------------------------------------------------------------------
  // 1. SUMMARY SHEET (الملخص المالي الشامل والتسوية)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.summary) {
    const targetPeriod = options.periodScope === 'selected' && options.selectedPeriodId
      ? (periods.find(p => p.id === options.selectedPeriodId) || currentPeriod)
      : currentPeriod;

    const sumData = getPeriodSummary(targetPeriod.id);

    const summaryRows: any[][] = [
      ...createMetadataBlock('الملخص المالي الشامل وتسوية الخزانة'),
      ['════════════════════════════════════════════════════════════════════════════════════'],
      ['أولاً: معادلة صافي الخزانة والحركة المحاسبية للدورة', '', '', ''],
      ['════════════════════════════════════════════════════════════════════════════════════'],
      ['البند المالي', 'المبلغ بالعملة (' + pharmacyProfile.currency + ')', 'النوع / الاتجاه', 'ملاحظات وتفاصيل'],
      ['إجمالي تسليمات الورديات (الدخل الصافي)', sumData.totalIncome, 'وارد (+)', `صباحي: ${sumData.totalMorningIncome} | مسائي: ${sumData.totalEveningIncome}`],
      ['إجمالي مسددات شركات ومخازن الأدوية', sumData.totalSupplierPayments, 'صادر (-)', 'فواتير وسندات سداد الأدوية'],
      ['إجمالي المصروفات والنثريات العامة', sumData.totalExpenses, 'صادر (-)', 'إيجار، كهرباء، نثريات، وصيانة'],
      ['صافي حركة الدورة (قبل الترحيل)', sumData.netMonthIncome, sumData.netMonthIncome >= 0 ? 'فائض (+)' : 'عجز (-)', 'الدخل - (الموردين + المصروفات)'],
      ['الرصيد المرحل من الشهر السابق', sumData.carriedOverBalance, 'رصيد سابق (+)', 'مرحل من الدورة السابقة'],
      ['صافي الخزانة النهائي (Net Treasury)', sumData.netTreasury, 'الرصيد الدفتري (=)', 'صافي حركة الشهر + الرصيد المرحل'],
      [],
      ['════════════════════════════════════════════════════════════════════════════════════'],
      ['ثانياً: توزيع السيولة النقدية والذمم المالية (أين ذهبت السيولة؟)', '', '', ''],
      ['════════════════════════════════════════════════════════════════════════════════════'],
      ['القناة المالية / الحساب', 'المبلغ بالعملة (' + pharmacyProfile.currency + ')', 'الحالة / الرصيد', 'المسار والتفاصيل'],
      ['رصيد المحافظ الإلكترونية وإنستاباي', sumData.walletNetBalance, 'رصيد رقمي', `وارد: ${sumData.walletIn} | صادر: ${sumData.walletOut}`],
      ['مسحوبات الشركاء والإدارة', sumData.responsiblePersonNet, 'ذمم شركاء', `مسحوب: ${sumData.responsiblePersonDebit} | مودع: ${sumData.responsiblePersonCredit}`],
      ['ديون وشكك العملاء (أجل الصيدلية)', sumData.customerDebtsNet, 'ذمم عملاء', `دين جديد: ${sumData.customerDebtsDebit} | مسدد: ${sumData.customerDebtsCredit}`],
      ['سلف وحسابات الموظفين والصيادلة', sumData.employeeAdvancesNet, 'سلف معلقة', `مسحوب: ${sumData.employeeAdvancesWithdrawn} | مستقطع: ${sumData.employeeAdvancesReturned}`],
      ['مجموع الذمم والمحافظ المخصومة', (sumData.walletNetBalance + sumData.responsiblePersonNet + sumData.customerDebtsNet + sumData.employeeAdvancesNet), 'إجمالي المحتجزات (-)', 'تُخصم من صافي الخزانة لحساب الكاش'],
      [],
      ['════════════════════════════════════════════════════════════════════════════════════'],
      ['ثالثاً: جرد النقدية الفعلي ومطابقة الخزينة الحية', '', '', ''],
      ['════════════════════════════════════════════════════════════════════════════════════'],
      ['بند المطابقة', 'القيمة (' + pharmacyProfile.currency + ')', 'الحالة والتقييم', 'البيان'],
      ['النقدي المتوقع بالدرج (Expected Cash)', sumData.expectedCash, 'الهدف الدفتري', 'صافي الخزانة - (المحافظ + الشركاء + العملاء + السلف)'],
      ['النقدي الفعلي المعدود بالدرج (Actual Cash)', sumData.actualCashCounted, 'الواقع الفعلي', 'المبلغ المحصي يدوياً في الدرج'],
      ['الفارق النقدي (الفعلي - المتوقع)', sumData.difference, sumData.difference === 0 ? 'مطابق تماماً' : sumData.difference > 0 ? 'زيادة نقدية (+)' : 'عجز في الخزينة (-)', sumData.difference === 0 ? 'لا يوجد عجز أو زيادة' : `فارق بمقدار ${Math.abs(sumData.difference)}`],
      ['حالة الدورة المالية', targetPeriod.isClosed ? 'دورة مقفلة ومعتمدة' : 'دورة جارية ومفتوحة', targetPeriod.isClosed ? 'مغلق' : 'نشط', targetPeriod.closedAt ? `أقفلت بتاريخ ${targetPeriod.closedAt}` : 'قيد المتابعة']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = calculateColWidths(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص المالي والتسوية');
    sheetsCount++;
  }

  // --------------------------------------------------------------------------
  // 2. INCOME SHEET (تسليمات الورديات والدخل)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.income) {
    const shiftNames: Record<string, string> = {
      morning: 'صباحي',
      evening: 'مسائي',
      night: 'ليلي',
      other: 'أخرى'
    };

    const incomeRows: any[][] = [
      ...createMetadataBlock('تسليمات الورديات ودخل الصيدلية'),
      ['م', 'التاريخ', 'الوقت', 'نوع الوردية', 'المسؤول / الكاشير', 'المبلغ (' + pharmacyProfile.currency + ')', 'البيان والملاحظات', 'كود الدورة']
    ];

    let totalIncome = 0;
    let morningTotal = 0;
    let eveningTotal = 0;

    filteredIncome.forEach((item, index) => {
      const amt = Number(item.amount) || 0;
      totalIncome += amt;
      if (item.shiftType === 'morning') morningTotal += amt;
      if (item.shiftType === 'evening') eveningTotal += amt;

      incomeRows.push([
        index + 1,
        item.date,
        item.time || '-',
        shiftNames[item.shiftType] || item.shiftType,
        item.cashierName || 'غير محدد',
        amt,
        item.notes || '-',
        item.periodId
      ]);
    });

    if (options.includeSubtotals) {
      incomeRows.push([]);
      incomeRows.push(['', '', '', '', 'الإجمالي الكلي للتسليمات', totalIncome, `صباحي: ${morningTotal} | مسائي: ${eveningTotal}`, '']);
    }

    const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows);
    wsIncome['!cols'] = calculateColWidths(incomeRows);
    XLSX.utils.book_append_sheet(wb, wsIncome, 'تسليمات الورديات');
    sheetsCount++;
    totalRecordsExported += filteredIncome.length;
  }

  // --------------------------------------------------------------------------
  // 3. SUPPLIERS SHEET (سداد شركات الأدوية)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.suppliers) {
    const supplierMap = new Map<string, string>(suppliers.map(s => [s.id, s.name]));
    const methodNames: Record<string, string> = {
      cash: 'كاش نقدي',
      instapay: 'إنستاباي',
      wallet: 'محفظة إلكترونية',
      vodafone_cash: 'فودافون كاش',
      orange_cash: 'أورانج كاش',
      etisalat_cash: 'اتصالات كاش',
      bank_transfer: 'تحويل بنكي',
      other: 'أخرى'
    };

    const supplierRows: any[][] = [
      ...createMetadataBlock('سجل سداد شركات ومخازن الأدوية'),
      ['م', 'التاريخ', 'اسم الشركة / المورد', 'رقم الفاتورة / الإذن', 'طريقة السداد', 'المبلغ المسدد (' + pharmacyProfile.currency + ')', 'حالة المراجعة', 'تمت المراجعة بواسطة', 'تاريخ المراجعة', 'الملاحظات', 'كود الدورة']
    ];

    let totalSuppliers = 0;
    const supplierTotals = new Map<string, number>();

    filteredSuppliers.forEach((item, index) => {
      const amt = Number(item.amount) || 0;
      totalSuppliers += amt;
      const sName = supplierMap.get(item.supplierId) || 'مورد غير مسجل';
      supplierTotals.set(sName, (supplierTotals.get(sName) || 0) + amt);

      supplierRows.push([
        index + 1,
        item.date,
        sName,
        item.invoiceNumber || '-',
        methodNames[item.paymentMethod] || item.paymentMethod,
        amt,
        item.verified ? 'تم التحقق ✓' : 'قيد المراجعة',
        item.verifiedBy || '-',
        item.verifiedAt ? formatDateArabic(item.verifiedAt.split('T')[0]) : '-',
        item.notes || '-',
        item.periodId
      ]);
    });

    if (options.includeSubtotals) {
      supplierRows.push([]);
      supplierRows.push(['', '', '', '', 'إجمالي المسدد للشركات والمخازن', totalSuppliers, '', '', '', '', '']);
      
      // Breakdown summary
      supplierRows.push([]);
      supplierRows.push(['═══ ملخص المسدد لكل شركة ═══', '', '', '', '', '', '', '', '', '', '']);
      supplierRows.push(['اسم الشركة', 'إجمالي المسدد (' + pharmacyProfile.currency + ')', 'النسبة من الإجمالي', '', '', '', '', '', '', '', '']);
      Array.from(supplierTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, val]) => {
          const pct = totalSuppliers > 0 ? ((val / totalSuppliers) * 100).toFixed(1) + '%' : '0%';
          supplierRows.push([name, val, pct, '', '', '', '', '', '', '', '']);
        });
    }

    const wsSuppliers = XLSX.utils.aoa_to_sheet(supplierRows);
    wsSuppliers['!cols'] = calculateColWidths(supplierRows);
    XLSX.utils.book_append_sheet(wb, wsSuppliers, 'سداد شركات الأدوية');
    sheetsCount++;
    totalRecordsExported += filteredSuppliers.length;
  }

  // --------------------------------------------------------------------------
  // 4. EXPENSES SHEET (المصروفات والنثريات)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.expenses) {
    const categoryMap = new Map<string, string>(expenseCategories.map(c => [c.id, c.name]));
    const methodNames: Record<string, string> = {
      cash: 'كاش نقدي',
      instapay: 'إنستاباي',
      wallet: 'محفظة إلكترونية',
      vodafone_cash: 'فودافون كاش',
      orange_cash: 'أورانج كاش',
      etisalat_cash: 'اتصالات كاش',
      bank_transfer: 'تحويل بنكي',
      other: 'أخرى'
    };

    const expenseRows: any[][] = [
      ...createMetadataBlock('المصروفات التشغيلية والنثريات'),
      ['م', 'التاريخ', 'بند الصرف / البيان', 'التصنيف', 'طريقة الصرف', 'المبلغ (' + pharmacyProfile.currency + ')', 'الملاحظات والبيان', 'كود الدورة']
    ];

    let totalExpenses = 0;
    const categoryTotals = new Map<string, number>();

    filteredExpenses.forEach((item, index) => {
      const amt = Number(item.amount) || 0;
      totalExpenses += amt;
      const catName = categoryMap.get(item.categoryId) || 'نثريات عامة';
      categoryTotals.set(catName, (categoryTotals.get(catName) || 0) + amt);

      expenseRows.push([
        index + 1,
        item.date,
        item.itemName,
        catName,
        methodNames[item.paymentMethod] || item.paymentMethod,
        amt,
        item.notes || '-',
        item.periodId
      ]);
    });

    if (options.includeSubtotals) {
      expenseRows.push([]);
      expenseRows.push(['', '', '', '', 'إجمالي المصروفات والنثريات', totalExpenses, '', '']);
      
      // Category Breakdown Table
      expenseRows.push([]);
      expenseRows.push(['═══ تفصيل المصروفات حسب التصنيف ═══', '', '', '', '', '', '', '']);
      expenseRows.push(['التصنيف', 'إجمالي المنصرف (' + pharmacyProfile.currency + ')', 'النسبة المئوية', '', '', '', '', '']);
      Array.from(categoryTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, val]) => {
          const pct = totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(1) + '%' : '0%';
          expenseRows.push([name, val, pct, '', '', '', '', '']);
        });
    }

    const wsExpenses = XLSX.utils.aoa_to_sheet(expenseRows);
    wsExpenses['!cols'] = calculateColWidths(expenseRows);
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'المصروفات والنثريات');
    sheetsCount++;
    totalRecordsExported += filteredExpenses.length;
  }

  // --------------------------------------------------------------------------
  // 5. DIGITAL WALLET & INSTAPAY SHEET (المحافظ والإنستاباي)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.wallet) {
    const channelNames: Record<string, string> = {
      instapay: 'إنستاباي InstaPay',
      vodafone_cash: 'فودافون كاش Vodafone',
      orange_cash: 'أورانج كاش Orange',
      etisalat_cash: 'اتصالات كاش Etisalat',
      wallet: 'محفظة ذكية عامة',
      bank_transfer: 'تحويل بنكي'
    };

    const walletRows: any[][] = [
      ...createMetadataBlock('حركات المحافظ الإلكترونية وإنستاباي'),
      ['م', 'التاريخ', 'القناة / المحفظة', 'وارد / إيداع (' + pharmacyProfile.currency + ')', 'صادر / تحويل (' + pharmacyProfile.currency + ')', 'صافي الحركة', 'الوسم / التصنيف', 'الملاحظات والبيان', 'كود الدورة']
    ];

    let totalIn = 0;
    let totalOut = 0;

    filteredWallet.forEach((item, index) => {
      const inVal = Number(item.inAmount) || 0;
      const outVal = Number(item.outAmount) || 0;
      totalIn += inVal;
      totalOut += outVal;
      const net = inVal - outVal;

      walletRows.push([
        index + 1,
        item.date,
        channelNames[item.method] || item.method,
        inVal,
        outVal,
        net,
        item.tag || '-',
        item.notes || '-',
        item.periodId
      ]);
    });

    if (options.includeSubtotals) {
      walletRows.push([]);
      walletRows.push(['', '', 'الإجمالي الكلي', totalIn, totalOut, totalIn - totalOut, 'صافي الرصيد بالمحفظة', '']);
    }

    const wsWallet = XLSX.utils.aoa_to_sheet(walletRows);
    wsWallet['!cols'] = calculateColWidths(walletRows);
    XLSX.utils.book_append_sheet(wb, wsWallet, 'المحافظ وإنستاباي');
    sheetsCount++;
    totalRecordsExported += filteredWallet.length;
  }

  // --------------------------------------------------------------------------
  // 6. PARTNERS & RESPONSIBLE SHEET (مسحوبات الشركاء والإدارة)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.personal) {
    const partyMap = new Map<string, string>(parties.map(p => [p.id, p.name]));
    const methodNames: Record<string, string> = {
      cash: 'كاش نقدي',
      instapay: 'إنستاباي',
      wallet: 'محفظة إلكترونية',
      other: 'أخرى'
    };

    const personalRows: any[][] = [
      ...createMetadataBlock('مسحوبات وحسابات الشركاء والإدارة'),
      ['م', 'التاريخ', 'اسم الشريك / المسؤول', 'الحساب الفرعي / الوسم', 'طريقة المعاملة', 'مسحوب / مدين (' + pharmacyProfile.currency + ')', 'مودع ومسدد / دائن (' + pharmacyProfile.currency + ')', 'صافي الحركة', 'الملاحظات والبيان', 'كود الدورة']
    ];

    let totalDebit = 0;
    let totalCredit = 0;
    const partnerDebitMap = new Map<string, number>();
    const partnerCreditMap = new Map<string, number>();

    filteredPersonal.forEach((item, index) => {
      const debitVal = Number(item.debit) || 0;
      const creditVal = Number(item.credit) || 0;
      totalDebit += debitVal;
      totalCredit += creditVal;
      const net = debitVal - creditVal;
      const pName = partyMap.get(item.partyId) || 'شريك غير محدد';

      partnerDebitMap.set(pName, (partnerDebitMap.get(pName) || 0) + debitVal);
      partnerCreditMap.set(pName, (partnerCreditMap.get(pName) || 0) + creditVal);

      personalRows.push([
        index + 1,
        item.date,
        pName,
        item.subAccountTag || '-',
        methodNames[item.method] || item.method,
        debitVal,
        creditVal,
        net,
        item.notes || '-',
        item.periodId
      ]);
    });

    if (options.includeSubtotals) {
      personalRows.push([]);
      personalRows.push(['', '', '', '', 'الإجمالي الكلي', totalDebit, totalCredit, totalDebit - totalCredit, 'صافي رصيد مسحوبات الشركاء', '']);
      
      // Breakdown by partner
      personalRows.push([]);
      personalRows.push(['═══ كشف حساب كل شريك ═══', '', '', '', '', '', '', '', '', '']);
      personalRows.push(['اسم الشريك', 'إجمالي المسحوب (مدين)', 'إجمالي المودع (دائن)', 'صافي المستحق', '', '', '', '', '', '']);
      parties.forEach(p => {
        const d = partnerDebitMap.get(p.name) || 0;
        const c = partnerCreditMap.get(p.name) || 0;
        if (d > 0 || c > 0) {
          personalRows.push([p.name, d, c, d - c, '', '', '', '', '', '']);
        }
      });
    }

    const wsPersonal = XLSX.utils.aoa_to_sheet(personalRows);
    wsPersonal['!cols'] = calculateColWidths(personalRows);
    XLSX.utils.book_append_sheet(wb, wsPersonal, 'مسحوبات الشركاء');
    sheetsCount++;
    totalRecordsExported += filteredPersonal.length;
  }

  // --------------------------------------------------------------------------
  // 7. CUSTOMER DEBTS SHEET (ديون وشكك العملاء)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.customers) {
    const customerMap = new Map<string, Customer>(customers.map(c => [c.id, c]));

    const debtRows: any[][] = [
      ...createMetadataBlock('ديون وحسابات شكك العملاء (أجل الصيدلية)'),
      ['م', 'التاريخ', 'اسم العميل', 'العنوان / الشقة', 'رقم الهاتف', 'دين جديد / مسحوب (' + pharmacyProfile.currency + ')', 'سداد نقدي / دائن (' + pharmacyProfile.currency + ')', 'صافي الحركة', 'الملاحظات والبيان', 'كود الدورة']
    ];

    let totalDebit = 0;
    let totalCredit = 0;
    const custDebits = new Map<string, number>();
    const custCredits = new Map<string, number>();

    filteredDebts.forEach((item, index) => {
      const debitVal = Number(item.debit) || 0;
      const creditVal = Number(item.credit) || 0;
      totalDebit += debitVal;
      totalCredit += creditVal;
      const net = debitVal - creditVal;
      const cust = customerMap.get(item.customerId);
      const cName = cust ? cust.name : 'عميل غير مسجل';

      custDebits.set(item.customerId, (custDebits.get(item.customerId) || 0) + debitVal);
      custCredits.set(item.customerId, (custCredits.get(item.customerId) || 0) + creditVal);

      debtRows.push([
        index + 1,
        item.date,
        cName,
        cust?.address || '-',
        cust?.phone || '-',
        debitVal,
        creditVal,
        net,
        item.notes || '-',
        item.periodId
      ]);
    });

    if (options.includeSubtotals) {
      debtRows.push([]);
      debtRows.push(['', '', '', '', 'الإجمالي الكلي', totalDebit, totalCredit, totalDebit - totalCredit, 'صافي مديونيات العملاء المتبقية', '']);
      
      // Customer Balances Summary Table
      debtRows.push([]);
      debtRows.push(['═══ أرصدة العملاء الحالية ═══', '', '', '', '', '', '', '', '', '']);
      debtRows.push(['اسم العميل', 'العنوان', 'الهاتف', 'إجمالي المسحوب', 'إجمالي المسدد', 'الرصيد المتبقي عليه', 'الحد الائتماني', '', '', '']);
      customers.forEach(c => {
        const d = custDebits.get(c.id) || 0;
        const cr = custCredits.get(c.id) || 0;
        const balance = d - cr;
        if (d > 0 || cr > 0 || (c.creditLimit && c.creditLimit > 0)) {
          debtRows.push([c.name, c.address || '-', c.phone || '-', d, cr, balance, c.creditLimit || 'غير محدد', '', '', '']);
        }
      });
    }

    const wsDebts = XLSX.utils.aoa_to_sheet(debtRows);
    wsDebts['!cols'] = calculateColWidths(debtRows);
    XLSX.utils.book_append_sheet(wb, wsDebts, 'ديون العملاء');
    sheetsCount++;
    totalRecordsExported += filteredDebts.length;
  }

  // --------------------------------------------------------------------------
  // 8. EMPLOYEE ADVANCES SHEET (سلف وحسابات الموظفين)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.employees) {
    const employeeMap = new Map<string, Employee>(employees.map(e => [e.id, e]));
    const methodNames: Record<string, string> = {
      cash: 'كاش نقدي',
      wallet: 'محفظة إلكترونية',
      instapay: 'إنستاباي'
    };

    const advanceRows: any[][] = [
      ...createMetadataBlock('سلف وحسابات الصيادلة والموظفين'),
      ['م', 'التاريخ', 'اسم الموظف / الصيدلي', 'المسمى الوظيفي', 'طريقة الصرف', 'سلفة مسحوبة (' + pharmacyProfile.currency + ')', 'مردود / مستقطع (' + pharmacyProfile.currency + ')', 'صافي السلفة', 'البيان والسبب', 'كود الدورة']
    ];

    let totalWithdrawn = 0;
    let totalReturned = 0;
    const empWithdrawn = new Map<string, number>();
    const empReturned = new Map<string, number>();

    filteredAdvances.forEach((item, index) => {
      const wVal = Number(item.withdrawnAmount) || 0;
      const rVal = Number(item.returnedAmount) || 0;
      totalWithdrawn += wVal;
      totalReturned += rVal;
      const net = wVal - rVal;
      const emp = employeeMap.get(item.employeeId);
      const eName = emp ? emp.name : 'موظف غير مسجل';

      empWithdrawn.set(item.employeeId, (empWithdrawn.get(item.employeeId) || 0) + wVal);
      empReturned.set(item.employeeId, (empReturned.get(item.employeeId) || 0) + rVal);

      advanceRows.push([
        index + 1,
        item.date,
        eName,
        emp?.jobTitle || 'صيدلي',
        methodNames[item.method] || item.method,
        wVal,
        rVal,
        net,
        item.notes || '-',
        item.periodId
      ]);
    });

    if (options.includeSubtotals) {
      advanceRows.push([]);
      advanceRows.push(['', '', '', '', 'الإجمالي الكلي', totalWithdrawn, totalReturned, totalWithdrawn - totalReturned, 'صافي السلف المعلقة', '']);
      
      // Summary per employee
      advanceRows.push([]);
      advanceRows.push(['═══ أرصدة سلف الموظفين ═══', '', '', '', '', '', '', '', '', '']);
      advanceRows.push(['اسم الموظف', 'المسمى الوظيفي', 'الهاتف', 'إجمالي المسحوب', 'إجمالي المردود', 'المتبقي عليه', 'الحد الأقصى للسلفة', '', '', '']);
      employees.forEach(e => {
        const w = empWithdrawn.get(e.id) || 0;
        const r = empReturned.get(e.id) || 0;
        const bal = w - r;
        if (w > 0 || r > 0 || (e.maxAdvanceLimit && e.maxAdvanceLimit > 0)) {
          advanceRows.push([e.name, e.jobTitle || '-', e.phone || '-', w, r, bal, e.maxAdvanceLimit || 'غير محدد', '', '', '']);
        }
      });
    }

    const wsAdvances = XLSX.utils.aoa_to_sheet(advanceRows);
    wsAdvances['!cols'] = calculateColWidths(advanceRows);
    XLSX.utils.book_append_sheet(wb, wsAdvances, 'سلف الموظفين');
    sheetsCount++;
    totalRecordsExported += filteredAdvances.length;
  }

  // --------------------------------------------------------------------------
  // 9. MASTER DATA DIRECTORY SHEET (دليل الحسابات والبيانات الأساسية)
  // --------------------------------------------------------------------------
  if (options.selectedSheets.masterData) {
    const masterRows: any[][] = [
      ...createMetadataBlock('دليل الحسابات وجهات التعامل المسجلة'),
      ['═══ 1. دليل شركات ومخازن الأدوية ═══'],
      ['م', 'اسم الشركة', 'اسم المندوب', 'رقم الهاتف', 'العنوان', 'ملاحظات'],
      ...suppliers.map((s, idx) => [idx + 1, s.name, s.representativeName || '-', s.phone || '-', s.address || '-', s.notes || '-']),
      [],
      ['═══ 2. دليل العملاء ═══'],
      ['م', 'اسم العميل', 'العنوان / الشقة', 'الهاتف', 'الحد الائتماني', 'ملاحظات'],
      ...customers.map((c, idx) => [idx + 1, c.name, c.address || '-', c.phone || '-', c.creditLimit || '-', c.notes || '-']),
      [],
      ['═══ 3. دليل الصيادلة والموظفين ═══'],
      ['م', 'اسم الموظف', 'المسمى الوظيفي', 'الهاتف', 'أقصى حد للسلفة', 'ملاحظات'],
      ...employees.map((e, idx) => [idx + 1, e.name, e.jobTitle || '-', e.phone || '-', e.maxAdvanceLimit || '-', e.notes || '-']),
      [],
      ['═══ 4. تصنيفات المصروفات ═══'],
      ['م', 'اسم التصنيف', 'كود التصنيف'],
      ...expenseCategories.map((ec, idx) => [idx + 1, ec.name, ec.id]),
      [],
      ['═══ 5. سجل الدورات المالية ═══'],
      ['كود الدورة', 'اسم الشهر / الدورة', 'الحالة', 'النقدي الفعلي المحصي', 'تاريخ الإقفال'],
      ...periods.map(p => [p.id, p.name, p.isClosed ? 'مقفلة' : 'مفتوحة وجارية', p.actualCashCounted || 0, p.closedAt || '-'])
    ];

    const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
    wsMaster['!cols'] = calculateColWidths(masterRows);
    XLSX.utils.book_append_sheet(wb, wsMaster, 'دليل الحسابات والجهات');
    sheetsCount++;
  }

  // Generate clean filename
  const cleanPharmacyName = pharmacyProfile.name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'Pharmacy';
  const cleanPeriod = targetPeriodName.replace(/[/\\?%*:|"<>]/g, '-').trim();
  const timeStamp = new Date().toISOString().split('T')[0];
  const finalFileName = options.customFileName?.trim() 
    ? (options.customFileName.endsWith('.xlsx') ? options.customFileName : `${options.customFileName}.xlsx`)
    : `تقرير_خزينة_${cleanPharmacyName}_${cleanPeriod}_${timeStamp}.xlsx`;

  // Write file & trigger browser download
  XLSX.writeFile(wb, finalFileName);

  return {
    success: true,
    fileName: finalFileName,
    sheetsCount,
    recordsCount: totalRecordsExported
  };
}

/**
 * Quick 1-click exporter for the current active period
 */
export function exportCurrentPeriodFullExcel(dataset: TreasuryDataset): void {
  exportTreasuryToExcel(dataset, {
    periodScope: 'current',
    selectedSheets: {
      summary: true,
      income: true,
      suppliers: true,
      expenses: true,
      wallet: true,
      personal: true,
      customers: true,
      employees: true,
      masterData: true
    },
    includeHeaderMetadata: true,
    includeSubtotals: true
  });
}
