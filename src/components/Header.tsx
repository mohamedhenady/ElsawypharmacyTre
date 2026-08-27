import React from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency } from '../utils/formatters';
import {
  Menu,
  Building2,
  Calendar,
  PlusCircle,
  Printer,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  Phone,
  LayoutDashboard,
  TrendingUp,
  Truck,
  Receipt,
  Smartphone,
  UserCheck,
  Users,
  Briefcase,
  FileSpreadsheet,
  ShieldCheck,
  Calculator,
  Stethoscope,
  ArrowRightLeft
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickEntry: () => void;
  onOpenSettings: () => void;
  onOpenPrintReport: () => void;
  onToggleMobileSidebar: () => void;
  onOpenInstallModal?: () => void;
  onOpenSwitchUser?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickEntry,
  onOpenSettings,
  onOpenPrintReport,
  onToggleMobileSidebar,
  onOpenInstallModal,
  onOpenSwitchUser,
  activeTab,
  setActiveTab
}) => {
  const {
    pharmacyProfile,
    periods,
    currentPeriodId,
    setCurrentPeriodId,
    currentPeriod,
    summary,
    currentUser,
    hasPermission
  } = useTreasury();

  const getTabInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { label: 'لوحة الخزانة والتسوية', icon: LayoutDashboard };
      case 'income':
        return { label: 'الدخل والورديات اليومية', icon: TrendingUp };
      case 'suppliers':
        return { label: 'سداد الشركات والموردين', icon: Truck };
      case 'expenses':
        return { label: 'المصروفات والنثريات', icon: Receipt };
      case 'wallet':
        return { label: 'المحافظ والإنستاباي', icon: Smartphone };
      case 'personal':
        return { label: 'مسحوبات الشركاء والمسؤول', icon: UserCheck };
      case 'customers':
        return { label: 'ديون وحسابات العملاء', icon: Users };
      case 'employees':
        return { label: 'سلف وحسابات الموظفين', icon: Briefcase };
      case 'report':
        return { label: 'تقرير التسوية الشهري', icon: FileSpreadsheet };
      case 'users':
        return { label: 'إدارة المستخدمين والصلاحيات', icon: Users };
      case 'settings':
        return { label: 'بيانات وإعدادات الصيدلية', icon: SettingsIcon };
      default:
        return { label: 'الخزانة والتسوية', icon: LayoutDashboard };
    }
  };

  const currentTabInfo = getTabInfo();
  const TabIcon = currentTabInfo.icon;

  const getUserRoleBadge = () => {
    switch (currentUser.role) {
      case 'manager':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
          title: 'المدير العام',
          cls: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
        };
      case 'accountant':
        return {
          icon: <Calculator className="w-3.5 h-3.5 text-blue-600" />,
          title: 'محاسب مالي',
          cls: 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
        };
      case 'pharmacist':
        return {
          icon: <Stethoscope className="w-3.5 h-3.5 text-purple-600" />,
          title: 'صيدلي',
          cls: 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
        };
    }
  };

  const roleBadge = getUserRoleBadge();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs no-print">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Left section in RTL: Mobile Sidebar Toggle & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              id="btn-mobile-sidebar-toggle"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="فتح القائمة الجانبية"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Current Active Module Header */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <TabIcon className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate">
                  {currentTabInfo.label}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">
                  {pharmacyProfile.name} • دورة {currentPeriod.name}
                </p>
              </div>
            </div>
          </div>

          {/* Center / Actions section: User Selector, Period & Status */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Active User Switcher Pill */}
            {onOpenSwitchUser && (
              <button
                id="btn-header-switch-user"
                onClick={onOpenSwitchUser}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${roleBadge.cls}`}
                title="اضغط لتبديل حساب المستخدم النشط"
              >
                {roleBadge.icon}
                <span className="hidden sm:inline font-bold">{currentUser.name}</span>
                <span className="text-[10px] opacity-80">({roleBadge.title})</span>
                <ArrowRightLeft className="w-3 h-3 opacity-60 ml-0.5" />
              </button>
            )}

            {/* Period Selector Dropdown */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100/90 rounded-xl px-2 py-1 border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select
                id="period-select-dropdown"
                value={currentPeriodId}
                onChange={(e) => setCurrentPeriodId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer py-0.5"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isClosed ? '🔒' : '🟢'}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            {hasPermission('quickEntry') && (
              <button
                id="btn-quick-entry"
                onClick={onOpenQuickEntry}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                title="إضافة حركة سريعة"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden md:inline">حركة سريعة +</span>
                <span className="md:hidden">+</span>
              </button>
            )}

            {hasPermission('report') && (
              <button
                id="btn-print-report"
                onClick={onOpenPrintReport}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                title="عرض وطباعة التقرير المالي الشهري"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>التقرير</span>
              </button>
            )}

            {/* PWA Install Button */}
            {onOpenInstallModal && (
              <button
                id="btn-header-install-mobile"
                onClick={onOpenInstallModal}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                title="تثبيت التطبيق على الموبايل"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden xl:inline">تثبيت PWA</span>
              </button>
            )}

            {hasPermission('settings') && (
              <button
                id="btn-settings"
                onClick={onOpenSettings}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="إعدادات بيانات الصيدلية والتصنيفات"
              >
                <SettingsIcon className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};


