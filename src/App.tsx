import React, { useState, useEffect } from 'react';
import { TreasuryProvider, useTreasury } from './context/TreasuryContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ProfileModule } from './components/ProfileModule';
import { Dashboard } from './components/Dashboard';
import { IncomeModule } from './components/IncomeModule';
import { SuppliersModule } from './components/SuppliersModule';
import { ExpensesModule } from './components/ExpensesModule';
import { WalletModule } from './components/WalletModule';
import { PersonalLedgerModule } from './components/PersonalLedgerModule';
import { CustomerDebtsModule } from './components/CustomerDebtsModule';
import { EmployeeAdvancesModule } from './components/EmployeeAdvancesModule';
import { SettingsModule } from './components/SettingsModule';
import { ReportModule } from './components/ReportModule';
import { UsersManagementModule } from './components/UsersManagementModule';
import { QuickEntryModal } from './components/QuickEntryModal';
import { WhatsAppSummaryModal } from './components/WhatsAppSummaryModal';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { usePWAInstall, PWAInstallModal } from './components/PWAInstallModal';
import { Smartphone, Download, X, ShieldAlert } from 'lucide-react';
import { UserPermissions } from './types';

export const MainApp: React.FC = () => {
  const { currentUser, currentUserPermissions, hasPermission, isAuthenticated, logout } = useTreasury();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState<boolean>(false);
  const [isWhatsAppSummaryOpen, setIsWhatsAppSummaryOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [dismissedMobileBanner, setDismissedMobileBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem('PWA_BANNER_DISMISSED') === 'true';
    } catch {
      return false;
    }
  });

  const pwa = usePWAInstall();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('PHARMACY_SIDEBAR_COLLAPSED') === 'true';
    } catch {
      return false;
    }
  });

  // Automatically ensure active tab is allowed for current user
  useEffect(() => {
    const tabPermKey = activeTab as keyof UserPermissions;
    if (tabPermKey in currentUserPermissions && !hasPermission(tabPermKey)) {
      // Find first allowed tab
      const candidateTabs: (keyof UserPermissions)[] = [
        'dashboard',
        'suppliers',
        'expenses',
        'income',
        'customers',
        'wallet',
        'personal',
        'employees',
        'report',
        'profile',
        'settings'
      ];
      const fallback = candidateTabs.find(tab => hasPermission(tab)) || 'dashboard';
      setActiveTab(fallback);
    }
  }, [currentUser.id, currentUserPermissions, activeTab, hasPermission]);

  // If not authenticated, do not show any data and display the login screen interface
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleToggleSidebarCollapse = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    try {
      localStorage.setItem('PHARMACY_SIDEBAR_COLLAPSED', String(collapsed));
    } catch {
      // ignore
    }
  };

  const handleDismissBanner = () => {
    setDismissedMobileBanner(true);
    try {
      localStorage.setItem('PWA_BANNER_DISMISSED', 'true');
    } catch {
      // ignore
    }
  };

  const isTabPermitted = hasPermission(activeTab as keyof UserPermissions);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 font-sans antialiased flex selection:bg-emerald-500 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={handleToggleSidebarCollapse}
        onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
        onOpenSettings={() => setActiveTab('settings')}
        onOpenPrintReport={() => setActiveTab('report')}
        onOpenWhatsAppSummary={() => setIsWhatsAppSummaryOpen(true)}
        onOpenInstallModal={() => pwa.openInstallGuide()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Offline Awareness & Sync Banner */}
        <OfflineSyncBanner onOpenInstallModal={() => pwa.openInstallGuide()} />

        {/* Smart Mobile PWA Banner */}
        {!pwa.isStandalone && !dismissedMobileBanner && (
          <div
            id="mobile-pwa-banner"
            className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-4 py-2 text-xs flex items-center justify-between gap-2 shadow-xs border-b border-emerald-700/60 no-print"
          >
            <div
              onClick={() => pwa.promptInstall()}
              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 hover:opacity-90 transition-opacity"
            >
              <Smartphone className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="truncate font-medium">
                تثبيت نظام الخزانة كتطبيق على هاتفك لسهولة وسرعة الوصول
              </span>
              <span className="hidden sm:inline-block bg-emerald-500/40 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 shrink-0">
                تثبيت الآن
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                id="btn-banner-install"
                onClick={() => pwa.promptInstall()}
                className="bg-white text-emerald-900 font-bold px-2.5 py-1 rounded-lg text-[11px] hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                تثبيت
              </button>
              <button
                id="btn-close-pwa-banner"
                onClick={handleDismissBanner}
                className="p-1 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <Header
          onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenPrintReport={() => setActiveTab('report')}
          onOpenWhatsAppSummary={() => setIsWhatsAppSummaryOpen(true)}
          onOpenInstallModal={() => pwa.openInstallGuide()}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic Module View */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 max-w-7xl w-full mx-auto">
          {!isTabPermitted ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm max-w-lg mx-auto mt-10">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">غير مصرح بالوصول</h2>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                حسابك الحالي ({currentUser.name} - {currentUser.role}) لا يمتلك صلاحية الدخول لهذه الشاشة. يرجى تسجيل الدخول بحساب يمتلك الصلاحية أو مراجعة المدير.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  العودة للرئيسية
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  setActiveTab={setActiveTab}
                  onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
                  onOpenPrintReport={() => setActiveTab('report')}
                  onOpenWhatsAppSummary={() => setIsWhatsAppSummaryOpen(true)}
                />
              )}

              {activeTab === 'income' && <IncomeModule />}

              {activeTab === 'suppliers' && <SuppliersModule />}

              {activeTab === 'expenses' && <ExpensesModule />}

              {activeTab === 'wallet' && <WalletModule />}

              {activeTab === 'personal' && <PersonalLedgerModule />}

              {activeTab === 'customers' && <CustomerDebtsModule />}

              {activeTab === 'employees' && <EmployeeAdvancesModule />}

              {activeTab === 'report' && (
                <ReportModule onOpenWhatsAppSummary={() => setIsWhatsAppSummaryOpen(true)} />
              )}

              {activeTab === 'profile' && (
                <ProfileModule />
              )}

              {activeTab === 'users' && <UsersManagementModule />}

              {activeTab === 'settings' && (
                <SettingsModule onOpenInstallModal={() => pwa.openInstallGuide()} />
              )}
            </>
          )}
        </main>

        {/* Floating Quick Action Button on Mobile */}
        {hasPermission('quickEntry') && (
          <div className="sm:hidden fixed bottom-5 left-5 z-40 no-print">
            <button
              onClick={() => setIsQuickEntryOpen(true)}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-transform active:scale-95"
              title="حركة سريعة"
            >
              +
            </button>
          </div>
        )}

        {/* Quick Entry Modal */}
        <QuickEntryModal
          isOpen={isQuickEntryOpen}
          onClose={() => setIsQuickEntryOpen(false)}
        />

        {/* WhatsApp Summary Modal */}
        <WhatsAppSummaryModal
          isOpen={isWhatsAppSummaryOpen}
          onClose={() => setIsWhatsAppSummaryOpen(false)}
        />

        {/* PWA Mobile Install Modal */}
        <PWAInstallModal
          isOpen={pwa.isModalOpen}
          onClose={() => pwa.setIsModalOpen(false)}
          onNativeInstall={() => pwa.promptInstall()}
          platform={pwa.platform}
          isStandalone={pwa.isStandalone}
        />

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 no-print mt-auto">
          <div className="px-4 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>نظام إدارة الخزانة والتسوية المحاسبية للصيدلية</span>
            <span className="text-[11px] text-slate-400">حفظ فوري ومحلي للبيانات</span>
          </div>
        </footer>

      </div>

    </div>
  );
};

export default function App() {
  return (
    <TreasuryProvider>
      <MainApp />
    </TreasuryProvider>
  );
}

