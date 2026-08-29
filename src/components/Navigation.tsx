import React from 'react';
import { useTreasury } from '../context/TreasuryContext';
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  Receipt,
  Smartphone,
  UserCheck,
  Users,
  Briefcase,
  FileSpreadsheet,
  Settings,
  User,
  Vault
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentPeriodId,
    incomeRecords,
    supplierPayments,
    expenses,
    walletTransactions,
    personalLedgers,
    customerDebts,
    employeeAdvances,
    drawerShifts,
    activeShift
  } = useTreasury();

  const countIncome = incomeRecords.filter(r => r.periodId === currentPeriodId).length;
  const countSuppliers = supplierPayments.filter(r => r.periodId === currentPeriodId).length;
  const countExpenses = expenses.filter(r => r.periodId === currentPeriodId).length;
  const countWallet = walletTransactions.filter(r => r.periodId === currentPeriodId).length;
  const countPersonal = personalLedgers.filter(r => r.periodId === currentPeriodId).length;
  const countCustomers = customerDebts.filter(r => r.periodId === currentPeriodId).length;
  const countEmployees = employeeAdvances.filter(r => r.periodId === currentPeriodId).length;
  const countDrawer = drawerShifts.length + (activeShift ? 1 : 0);

  const navItems = [
    {
      id: 'dashboard',
      label: 'لوحة الخزانة والتسوية',
      icon: LayoutDashboard,
      highlight: true
    },
    {
      id: 'drawer',
      label: 'مصروفات درج النقدية والورديات',
      icon: Vault,
      count: activeShift ? 1 : undefined,
      highlight: true
    },
    {
      id: 'income',
      label: 'الدخل والتسليمات',
      icon: TrendingUp,
      count: countIncome
    },
    {
      id: 'suppliers',
      label: 'سداد الموردين',
      icon: Truck,
      count: countSuppliers
    },
    {
      id: 'expenses',
      label: 'المصروفات والنثريات',
      icon: Receipt,
      count: countExpenses
    },
    {
      id: 'wallet',
      label: 'المحفظة وانستاباي',
      icon: Smartphone,
      count: countWallet
    },
    {
      id: 'personal',
      label: 'حساب الشركاء / المسؤول',
      icon: UserCheck,
      count: countPersonal
    },
    {
      id: 'customers',
      label: 'ديون العملاء',
      icon: Users,
      count: countCustomers
    },
    {
      id: 'employees',
      label: 'سلف الموظفين',
      icon: Briefcase,
      count: countEmployees
    },
    {
      id: 'report',
      label: 'تقرير التسوية الشهري',
      icon: FileSpreadsheet
    },
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: User
    },
    {
      id: 'settings',
      label: 'بيانات الصيدلية والإعدادات',
      icon: Settings
    }
  ];

  return (
    <nav className="bg-slate-900 text-slate-300 border-b border-slate-800 sticky top-[73px] z-20 no-print shadow-sm overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-1 py-1.5 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-emerald-950/60 text-emerald-100'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
