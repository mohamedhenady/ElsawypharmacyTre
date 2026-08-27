import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  HardDriveDownload,
  Info,
  ChevronLeft
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAInstallHook {
  isInstallable: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop';
  promptInstall: () => Promise<void>;
  openInstallGuide: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export function usePWAInstall(): PWAInstallHook {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect Standalone (already installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Capture Chrome/Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsModalOpen(false);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  const openInstallGuide = () => {
    setIsModalOpen(true);
  };

  return {
    isInstallable: !isStandalone,
    isStandalone,
    platform,
    promptInstall,
    openInstallGuide,
    isModalOpen,
    setIsModalOpen
  };
}

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  platform: 'ios' | 'android' | 'desktop';
  isStandalone: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  platform,
  isStandalone
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="pwa-install-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="pwa-install-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-5 relative">
          <button
            id="btn-close-install-modal"
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/icon.svg"
                alt="أيقونة التطبيق"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  تطبيق هاتف PWA
                </span>
                {isStandalone && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    ✓ مثبت مسبقاً
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                تثبيت نظام الخزانة على الهاتف
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                استخدم النظام كتطبيق أصلي سريع بدون شريط متصفح
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
              <Zap className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
              <div className="text-[11px] font-bold">سرعة فائقة</div>
              <div className="text-[9px] text-emerald-700">فتح فوري بضغطة</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900">
              <Smartphone className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <div className="text-[11px] font-bold">شاشة كاملة</div>
              <div className="text-[9px] text-blue-700">تجربة تطبيق حقيقي</div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-900">
              <ShieldCheck className="w-5 h-5 mx-auto text-purple-600 mb-1" />
              <div className="text-[11px] font-bold">حفظ آمن</div>
              <div className="text-[9px] text-purple-700">بياناتك محفوظة</div>
            </div>
          </div>

          {/* Already installed state */}
          {isStandalone ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block text-sm">التطبيق مثبت ويعمل حالياً كـ PWA!</span>
                يمكنك الوصول إليه دائماً من شاشة هاتفك الرئيسية كأي تطبيق عادي.
              </div>
            </div>
          ) : (
            <>
              {/* Direct Install Button if supported by browser prompt */}
              {onNativeInstall && platform === 'android' && (
                <div className="space-y-2">
                  <button
                    id="btn-trigger-native-install"
                    onClick={onNativeInstall}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-700/20 transition-all cursor-pointer active:scale-98"
                  >
                    <HardDriveDownload className="w-5 h-5" />
                    <span>تثبيت التطبيق على جهازي الآن</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-500">
                    أو اتبع الخطوات أدناه في حالة عدم ظهور نافذة التثبيت التلقائية
                  </p>
                </div>
              )}

              {/* Step by Step Platform Instructions */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>
                    {platform === 'ios'
                      ? 'خطوات التثبيت على الآيفون والآيباد (iPhone / Safari)'
                      : platform === 'android'
                      ? 'خطوات التثبيت على أندرويد (Chrome / Samsung / Edge)'
                      : 'خطوات التثبيت على الكمبيوتر أو المتصفح'}
                  </span>
                </div>

                {platform === 'ios' ? (
                  <ol className="space-y-3 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <div>
                        افتح الرابط في متصفح <strong>Safari</strong>، ثم اضغط على زر <strong>المشاركة (Share)</strong>{' '}
                        <Share2 className="w-4 h-4 inline-block text-blue-600 mx-1" /> أسفل الشاشة.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <div>
                        اسحب قائمة الخيارات لأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>{' '}
                        <PlusSquare className="w-4 h-4 inline-block text-emerald-700 mx-1" />.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <div>
                        اضغط على <strong>"إضافة" (Add)</strong> في أعلى الزاوية. سيظهر التطبيق فوراً على شاشة هاتفك الرئيسية.
                      </div>
                    </li>
                  </ol>
                ) : platform === 'android' ? (
                  <ol className="space-y-3 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <div>
                        في متصفح <strong>Google Chrome</strong>، اضغط على زر القائمة (<strong>الثلاث نقاط ⋮</strong>) في الزاوية العلوية.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <div>
                        اختر <strong>"تثبيت التطبيق" (Install App)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية"</strong>.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <div>
                        أكد بالضغط على <strong>"تثبيت" (Install)</strong>، وسيصبح النظام متاحاً كتطبيق منفصل على هاتفك.
                      </div>
                    </li>
                  </ol>
                ) : (
                  <ol className="space-y-3 text-xs text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <div>
                        في شريط عنوان المتصفح (Chrome / Edge)، اضغط على أيقونة <strong>التثبيت</strong>{' '}
                        <HardDriveDownload className="w-4 h-4 inline-block text-emerald-600 mx-1" /> بجانب شريط الرابط.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <div>
                        أو اضغط على زر المتصفح (⋮) ثم اختر <strong>"تثبيت نظام خزانة الصيدلية"</strong>.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <div>
                        سيتم تشغيل البرنامج في نافذة مستقلة وسريعة مع اختصار على سطح المكتب.
                      </div>
                    </li>
                  </ol>
                )}
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            يدعم جميع أنظمة التشغيل (iOS, Android, Windows, Mac)
          </span>
          <button
            id="btn-dismiss-install-modal"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
