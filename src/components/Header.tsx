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
  Database,
  ShieldCheck,
  Calculator,
  Stethoscope,
  ArrowRightLeft,
  User,
  LogOut,
  MessageSquare,
  Wifi,
  WifiOff
} from 'lucide-react';

interface HeaderProps {
  onOpenQuickEntry: () => void;
  onOpenSettings: () => void;
  onOpenPrintReport: () => void;
  onOpenWhatsAppSummary?: () => void;
  onOpenExcelExport?: () => void;
  onToggleMobileSidebar: () => void;
  onOpenInstallModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickEntry,
  onOpenSettings,
  onOpenPrintReport,
  onOpenWhatsAppSummary,
  onOpenExcelExport,
  onToggleMobileSidebar,
  onOpenInstallModal,
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
    logout,
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
      case 'profile':
        return { label: 'الملف الشخصي والحساب', icon: User };
      case 'users':
        return { label: 'إدارة المستخدمين والصلاحيات', icon: Users };
      case 'settings':
        return { label: 'بيانات وإعدادات الصيدلية', icon: SettingsIcon };
      case 'backup':
        return { label: 'النسخ الاحتياطي وأمان البيانات', icon: Database };
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

          {/* Center / Actions section: Period & Status */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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

            {/* Excel Export Quick Button */}
            {onOpenExcelExport && (
              <button
                id="btn-header-excel-export"
                onClick={onOpenExcelExport}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                title="تخصيص وتصدير بيانات الحسابات Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span className="hidden lg:inline">تصدير Excel</span>
              </button>
            )}

            {/* WhatsApp Summary Quick Button */}
            {onOpenWhatsAppSummary && (
              <button
                id="btn-header-whatsapp"
                onClick={onOpenWhatsAppSummary}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors cursor-pointer"
                title="إرسال ملخص مالي يومي لواتساب الإدارة"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            {/* Profile Tab Quick Button */}
            <button
              id="btn-header-profile"
              onClick={() => setActiveTab('profile')}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="الملف الشخصي والحساب"
            >
              <User className="w-4 h-4" />
            </button>

            {hasPermission('settings') && (
              <button
                id="btn-settings"
                onClick={onOpenSettings}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="إعدادات بيانات الصيدلية والتصنيفات"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            )}

            {/* Logout Quick Button */}
            <button
              id="btn-header-logout"
              onClick={logout}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
              title="تسجيل الخروج وقفل الجلسة"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};


