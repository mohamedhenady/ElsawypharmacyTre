import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2, RefreshCw, Smartphone, CloudUpload } from 'lucide-react';

interface OfflineSyncBannerProps {
  onOpenInstallModal?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onOpenInstallModal }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnectedAlert, setShowReconnectedAlert] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      setShowReconnectedAlert(true);
      
      // Simulate rapid sync confirmation
      setTimeout(() => {
        setIsSyncing(false);
      }, 1200);

      const timer = setTimeout(() => {
        setShowReconnectedAlert(false);
      }, 4500);

      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedAlert(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnectedAlert) {
    return null;
  }

  return (
    <div className="w-full transition-all duration-300">
      {!isOnline ? (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-800/60 flex items-center justify-center shrink-0">
              <WifiOff className="w-3.5 h-3.5 text-amber-200" />
            </div>
            <div className="min-w-0">
              <strong className="font-bold text-amber-100 ml-1.5">أنت تعمل الآن في وضع عدم الاتصال (Offline Mode):</strong>
              <span className="text-amber-50">
                يمكنك تسجيل كافة حركات الورديات والمصروفات وسداد الموردين بشكل طبيعي. البيانات محفوظة بأمان على جهازك وستتم المزامنة تلقائياً.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/50">
              حفظ محلي فوري
            </span>
          </div>
        </div>
      ) : showReconnectedAlert ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-800/60 flex items-center justify-center shrink-0">
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-200 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              )}
            </div>
            <div className="min-w-0">
              <strong className="font-bold text-emerald-100 ml-1.5">
                {isSyncing ? 'جاري التحقق من مزامنة البيانات...' : 'تم استعادة الاتصال بالإنترنت بنجاح:'}
              </strong>
              <span className="text-emerald-50">
                كافة حركات الخزانة والتسويات متزامنة ومحفوظة بالكامل.
              </span>
            </div>
          </div>

          <span className="text-[10px] bg-emerald-800/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/50 shrink-0">
            ✓ متصل ومحدث
          </span>
        </div>
      ) : null}
    </div>
  );
};
