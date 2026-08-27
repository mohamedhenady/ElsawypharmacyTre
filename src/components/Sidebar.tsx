import React from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency } from '../utils/formatters';
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
  PlusCircle,
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRightLeft,
  ShieldCheck,
  Calculator,
  Stethoscope,
  UserCog
} from 'lucide-react';
import { UserPermissions } from '../types';

interface NavItem {
  id: string;
  permKey: keyof UserPermissions;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenQuickEntry: () => void;
  onOpenSettings: () => void;
  onOpenPrintReport: () => void;
  onOpenInstallModal?: () => void;
  onOpenSwitchUser?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  onOpenQuickEntry,
  onOpenSettings,
  onOpenPrintReport,
  onOpenInstallModal,
  onOpenSwitchUser
}) => {
  const {
    pharmacyProfile,
    periods,
    currentPeriodId,
    setCurrentPeriodId,
    currentPeriod,
    summary,
    incomeRecords,
    supplierPayments,
    expenses,
    walletTransactions,
    personalLedgers,
    customerDebts,
    employeeAdvances,
    currentUser,
    hasPermission
  } = useTreasury();

  const countIncome = incomeRecords.filter(r => r.periodId === currentPeriodId).length;
  const countSuppliers = supplierPayments.filter(r => r.periodId === currentPeriodId).length;
  const countExpenses = expenses.filter(r => r.periodId === currentPeriodId).length;
  const countWallet = walletTransactions.filter(r => r.periodId === currentPeriodId).length;
  const countPersonal = personalLedgers.filter(r => r.periodId === currentPeriodId).length;
  const countCustomers = customerDebts.filter(r => r.periodId === currentPeriodId).length;
  const countEmployees = employeeAdvances.filter(r => r.periodId === currentPeriodId).length;

  const rawNavGroups: NavGroup[] = [
    {
      groupTitle: 'الرئيسية',
      items: [
        {
          id: 'dashboard',
          permKey: 'dashboard' as keyof UserPermissions,
          label: 'لوحة الخزانة والتسوية',
          shortLabel: 'الرئيسية',
          icon: LayoutDashboard
        }
      ]
    },
    {
      groupTitle: 'حركات الخزانة اليومية',
      items: [
        {
          id: 'income',
          permKey: 'income' as keyof UserPermissions,
          label: 'الدخل والورديات',
          shortLabel: 'الدخل',
          icon: TrendingUp,
          count: countIncome,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        },
        {
          id: 'suppliers',
          permKey: 'suppliers' as keyof UserPermissions,
          label: 'سداد الشركات والموردين',
          shortLabel: 'الموردين',
          icon: Truck,
          count: countSuppliers,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        },
        {
          id: 'expenses',
          permKey: 'expenses' as keyof UserPermissions,
          label: 'المصروفات والنثريات',
          shortLabel: 'المصروفات',
          icon: Receipt,
          count: countExpenses,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
        {
          id: 'wallet',
          permKey: 'wallet' as keyof UserPermissions,
          label: 'المحافظ والإنستاباي',
          shortLabel: 'المحفظة',
          icon: Smartphone,
          count: countWallet,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        }
      ]
    },
    {
      groupTitle: 'الذمم والحسابات',
      items: [
        {
          id: 'personal',
          permKey: 'personal' as keyof UserPermissions,
          label: 'مسحوبات الشركاء والمسؤول',
          shortLabel: 'الشركاء',
          icon: UserCheck,
          count: countPersonal,
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        },
        {
          id: 'customers',
          permKey: 'customers' as keyof UserPermissions,
          label: 'ديون وحسابات العملاء',
          shortLabel: 'العملاء',
          icon: Users,
          count: countCustomers,
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
        },
        {
          id: 'employees',
          permKey: 'employees' as keyof UserPermissions,
          label: 'سلف وحسابات الموظفين',
          shortLabel: 'الموظفين',
          icon: Briefcase,
          count: countEmployees,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        }
      ]
    },
    {
      groupTitle: 'التقارير والإدارة',
      items: [
        {
          id: 'report',
          permKey: 'report' as keyof UserPermissions,
          label: 'تقرير التسوية الشهري',
          shortLabel: 'التقرير',
          icon: FileSpreadsheet
        },
        {
          id: 'users',
          permKey: 'users' as keyof UserPermissions,
          label: 'المستخدمين والصلاحيات',
          shortLabel: 'المستخدمين',
          icon: UserCog
        },
        {
          id: 'settings',
          permKey: 'settings' as keyof UserPermissions,
          label: 'بيانات الصيدلية والإعدادات',
          shortLabel: 'الإعدادات',
          icon: Settings
        }
      ]
    }
  ];

  // Filter items based on active user's permissions
  const navGroups = rawNavGroups
    .map(g => ({
      ...g,
      items: g.items.filter(item => hasPermission(item.permKey))
    }))
    .filter(g => g.items.length > 0);

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const getUserBadge = () => {
    switch (currentUser.role) {
      case 'manager':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
          title: 'المدير العام',
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
        };
      case 'accountant':
        return {
          icon: <Calculator className="w-3.5 h-3.5 text-blue-400" />,
          title: 'محاسب مالي',
          color: 'bg-blue-950/80 text-blue-300 border-blue-700/60'
        };
      case 'pharmacist':
        return {
          icon: <Stethoscope className="w-3.5 h-3.5 text-purple-400" />,
          title: 'صيدلي وردية',
          color: 'bg-purple-950/80 text-purple-300 border-purple-700/60'
        };
    }
  };

  const userBadge = getUserBadge();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      
      {/* Top Header / Branding */}
      <div className={`p-4 border-b border-slate-800/80 flex items-center justify-between transition-all ${
        isCollapsed ? 'p-3 flex-col gap-2' : ''
      }`}>
        <div
          onClick={() => hasPermission('dashboard') && handleItemClick('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {pharmacyProfile.logoUrl ? (
            <img
              src={pharmacyProfile.logoUrl}
              alt={pharmacyProfile.name}
              className="w-10 h-10 rounded-xl object-contain bg-slate-800 p-1 border border-slate-700 shrink-0 group-hover:border-emerald-500 transition-colors"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 shrink-0 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          )}

          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-base font-bold text-white tracking-tight truncate leading-tight group-hover:text-emerald-400 transition-colors">
                {pharmacyProfile.name || 'صيدلية النور والشفاء'}
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium truncate mt-0.5">
                نظام إدارة الخزانة والتسوية
              </p>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button
          id="btn-close-mobile-sidebar"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active User Account Switcher Card */}
      <div className={`border-b border-slate-800/80 bg-slate-950/60 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {!isCollapsed ? (
          <div
            onClick={onOpenSwitchUser}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
            title="انقر لتبديل حساب المستخدم"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 border ${
                currentUser.role === 'manager'
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600/50'
                  : currentUser.role === 'accountant'
                  ? 'bg-blue-900/60 text-blue-300 border-blue-600/50'
                  : 'bg-purple-900/60 text-purple-300 border-purple-600/50'
              }`}>
                {currentUser.name.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                  {userBadge.icon}
                  <span>{userBadge.title}</span>
                </div>
              </div>
            </div>

            <span className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white transition-colors shrink-0">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        ) : (
          <div
            onClick={onOpenSwitchUser}
            className="flex justify-center cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title={`المستخدم: ${currentUser.name} (${userBadge.title}) - انقر للتبديل`}
          >
            <span className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs border ${
              currentUser.role === 'manager'
                ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600/50'
                : currentUser.role === 'accountant'
                ? 'bg-blue-900/60 text-blue-300 border-blue-600/50'
                : 'bg-purple-900/60 text-purple-300 border-purple-600/50'
            }`}>
              {currentUser.name.slice(0, 2)}
            </span>
          </div>
        )}
      </div>

      {/* Period Selection & Status Widget */}
      <div className={`border-b border-slate-800/80 bg-slate-950/40 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                الفترة المحاسبية
              </span>
              {currentPeriod.isClosed ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  <Lock className="w-2.5 h-2.5" /> مقفل
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                  🟢 نشط
                </span>
              )}
            </div>

            <select
              id="sidebar-period-select"
              value={currentPeriodId}
              onChange={(e) => setCurrentPeriodId(e.target.value)}
              className="w-full bg-slate-800 text-xs font-semibold text-white rounded-lg border border-slate-700 py-1.5 px-2.5 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isClosed ? '(مقفل)' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex justify-center" title={`الفترة: ${currentPeriod.name}`}>
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400 border border-slate-700">
              {currentPeriod.month}
            </span>
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      {hasPermission('quickEntry') && (
        <div className={isCollapsed ? 'p-2' : 'p-3'}>
          <button
            id="btn-sidebar-quick-entry"
            onClick={onOpenQuickEntry}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950/30 transition-all cursor-pointer active:scale-98 ${
              isCollapsed ? 'px-0' : 'px-3 text-xs'
            }`}
            title="حركة سريعة (دخل، سداد، مصروف، دين)"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>حركة سريعة +</span>}
          </button>
        </div>
      )}

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 scrollbar-thin scrollbar-thumb-slate-700">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && group.groupTitle && (
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.groupTitle}
              </div>
            )}
            
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-item-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center px-2' : 'justify-between'
                  } ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border ${
                        isActive
                          ? 'bg-emerald-900/60 text-emerald-100 border-emerald-700/50'
                          : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* PWA Mobile Install Quick Button */}
        {onOpenInstallModal && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              id="sidebar-btn-install-mobile"
              onClick={() => {
                onOpenInstallModal();
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 transition-all cursor-pointer ${
                isCollapsed ? 'justify-center px-2' : 'justify-between'
              }`}
              title="تثبيت التطبيق على الموبايل كـ PWA"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                {!isCollapsed && <span>تثبيت على الموبايل</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-500/40 font-bold">
                  PWA 📱
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Drawer Bottom Balance Pulse Widget */}
      {!isCollapsed && hasPermission('dashboard') && (
        <div className="p-3 mx-2 mb-2 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">حالة الدرج الفعلي:</span>
            {summary.status === 'balanced' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> متطابق
              </span>
            ) : summary.status === 'surplus' ? (
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> +{formatCurrency(summary.difference, pharmacyProfile.currency)}
              </span>
            ) : summary.status === 'deficit' ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> -{formatCurrency(Math.abs(summary.difference), pharmacyProfile.currency)}
              </span>
            ) : (
              <span className="text-amber-400 font-bold">بانتظار العد</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>صافي الخزانة:</span>
            <span className="font-bold text-white">{formatCurrency(summary.netTreasuryWithCarriedOver, pharmacyProfile.currency)}</span>
          </div>
        </div>
      )}

      {/* Collapse / Expand Toggle Button (Desktop) */}
      <div className="p-2 border-t border-slate-800 hidden lg:flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
        {!isCollapsed && (
          <span className="text-[11px] px-2 text-slate-500 font-medium">تصغير القائمة</span>
        )}
        <button
          id="btn-toggle-sidebar-collapse"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer mx-auto"
          title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside
        id="desktop-sidebar"
        className={`hidden lg:block shrink-0 bg-slate-900 border-l border-slate-800 z-30 transition-all duration-200 h-screen sticky top-0 no-print ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Backdrop & Overlay */}
      {isMobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity no-print"
        />
      )}

      {/* 3. Mobile Slide-Over Sidebar Drawer */}
      <div
        id="mobile-sidebar-drawer"
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-slate-900 z-50 shadow-2xl transition-transform duration-300 ease-in-out no-print ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
