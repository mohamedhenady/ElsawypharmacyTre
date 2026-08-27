import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { PharmacyProfile } from '../types';
import {
  Building2,
  Save,
  Image,
  Sparkles,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Lock,
  Unlock,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Plus,
  Smartphone,
  HardDriveDownload
} from 'lucide-react';

interface SettingsModuleProps {
  onOpenInstallModal?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onOpenInstallModal }) => {
  const {
    pharmacyProfile,
    updatePharmacyProfile,
    periods,
    currentPeriodId,
    setCurrentPeriodId,
    addPeriod,
    updatePeriod,
    closePeriod,
    reopenPeriod,
    resetToDemoData,
    exportDataJson,
    importDataJson
  } = useTreasury();

  // Form State for Pharmacy Profile
  const [name, setName] = useState(pharmacyProfile.name);
  const [slogan, setSlogan] = useState(pharmacyProfile.slogan || '');
  const [logoUrl, setLogoUrl] = useState(pharmacyProfile.logoUrl || '');
  const [currency, setCurrency] = useState(pharmacyProfile.currency);
  const [phone, setPhone] = useState(pharmacyProfile.phone || '');
  const [managerWhatsApp, setManagerWhatsApp] = useState(pharmacyProfile.managerWhatsApp || pharmacyProfile.phone || '');
  const [address, setAddress] = useState(pharmacyProfile.address || '');
  const [taxNumber, setTaxNumber] = useState(pharmacyProfile.taxNumber || '');
  const [commercialReg, setCommercialReg] = useState(pharmacyProfile.commercialRecord || '');
  const [managerName, setManagerName] = useState(pharmacyProfile.managerName || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Month / Period State
  const [showAddPeriodModal, setShowAddPeriodModal] = useState(false);
  const [newPeriodId, setNewPeriodId] = useState('');
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodCarried, setNewPeriodCarried] = useState('');

  // Sample Logo Presets
  const sampleLogos = [
    { name: 'شعار الصيدلية الأخضر', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80' },
    { name: 'شعار الكبسولة الطبية', url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=150&auto=format&fit=crop&q=80' },
    { name: 'شعار العناية الصحية', url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=150&auto=format&fit=crop&q=80' }
  ];

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePharmacyProfile({
      name: name.trim() || 'صيدلية النور والشفاء',
      slogan: slogan.trim(),
      logoUrl: logoUrl.trim(),
      currency: currency.trim() || 'ج.م',
      phone: phone.trim(),
      managerWhatsApp: managerWhatsApp.trim(),
      address: address.trim(),
      taxNumber: taxNumber.trim(),
      commercialRecord: commercialReg.trim(),
      managerName: managerName.trim()
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodId.trim() || !newPeriodName.trim()) return;

    addPeriod({
      id: newPeriodId.trim(),
      name: newPeriodName.trim(),
      carriedOverBalance: parseFloat(newPeriodCarried) || 0,
      isClosed: false
    });

    setShowAddPeriodModal(false);
    setNewPeriodId('');
    setNewPeriodName('');
    setNewPeriodCarried('');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = importDataJson(text);
          if (success) {
            alert('تم استرجاع البيانات بنجاح!');
          } else {
            alert('ملف البيانات غير صالح');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>بيانات الصيدلية وإعدادات النظام</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تخصيص اسم الصيدلية، الشعار، اللوجو، الفترات المحاسبية وإدارة النسخ الاحتياطي
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ بيانات الصيدلية بنجاح!</span>
          </div>
        )}
      </div>

      {/* SECTION 1: PHARMACY BRANDING & PROFILE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>الهوية البصرية والبيانات الأساسية للصيدلية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تظهر هذه البيانات في رأس البرنامج، كشوف الحسابات، وتقارير التسوية المطبوعة.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          
          {/* Logo & Visual Identity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 items-center">
            
            {/* Logo Preview */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-xs font-bold text-slate-700 mb-2">معاينة اللوجو الحالي</div>
              {logoUrl ? (
                <div className="relative group">
                  <img
                    src={logoUrl}
                    alt={name}
                    className="w-24 h-24 rounded-2xl object-contain border-2 border-emerald-500 bg-white p-1 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center cursor-pointer shadow"
                    title="حذف اللوجو"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-3xl font-black shadow-sm">
                  {name.charAt(0) || 'ص'}
                </div>
              )}
            </div>

            {/* Logo Input / Upload */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط صورة اللوجو (Logo URL):
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  أو رفع صورة من جهازك:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-xs text-slate-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {/* Sample presets */}
              <div>
                <span className="text-[11px] text-slate-500 ml-2">نماذج شعارات جاهزة للتجربة:</span>
                <div className="inline-flex gap-2 mt-1">
                  {sampleLogos.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLogoUrl(s.url)}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 cursor-pointer"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Text Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الصيدلية الأساسي <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: صيدلية النور والشفاء"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                شعار / عبارة الصيدلية (Slogan):
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="مثال: رعاية صحية متكاملة لخدمتكم 24 ساعة"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عملة الحسابات:
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="ج.م أو ر.س أو $"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أرقام الهاتف / الخط الساخن:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678 - 0223456789"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>رقم واتساب الإدارة (للإشعارات الفورية):</span>
                <span className="text-[10px] text-emerald-700 font-normal">WhatsApp 💬</span>
              </label>
              <input
                type="tel"
                value={managerWhatsApp}
                onChange={(e) => setManagerWhatsApp(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm font-mono font-bold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان الصيدلية والمنطقة:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="شارع الجمهورية - أمام المستشفى العام"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الصيدلي المسؤول / المدير:
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="د. أحمد عبد الرحمن"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الرقم الضريبي (اختياري):
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="xxx-xxx-xxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم السجل التجاري (اختياري):
              </label>
              <input
                type="text"
                value={commercialReg}
                onChange={(e) => setCommercialReg(e.target.value)}
                placeholder="12345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:outline-none text-sm bg-white"
              />
            </div>

          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ بيانات وتعديلات الصيدلية</span>
            </button>
          </div>

        </form>
      </div>

      {/* SECTION 2: PERIODS & MONTHS MANAGEMENT */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>إدارة الأشهر والدورات المحاسبية</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              التبديل بين الأشهر، إقفال واعتماد شهر مالي، أو ترحيل رصيد الشهر السابق لشهر جديد.
            </p>
          </div>

          <button
            onClick={() => setShowAddPeriodModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            + إضافة شهر مالي جديد
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {periods.map(p => {
            const isCurrent = p.id === currentPeriodId;
            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    {p.isClosed ? (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> مقفل
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> مفتوح
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    <div>كود الفترة: <span className="font-mono text-slate-700">{p.id}</span></div>
                    <div>المرحل من السابق: <span className="font-mono font-bold text-slate-800">{p.carriedOverBalance} {currency}</span></div>
                    {p.actualCashCounted !== undefined && (
                      <div>العد الفعلي: <span className="font-mono font-bold text-emerald-700">{p.actualCashCounted} {currency}</span></div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between">
                  {!isCurrent ? (
                    <button
                      onClick={() => setCurrentPeriodId(p.id)}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      تفعيل وعرض هذا الشهر ←
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-800">الشهر النشط حالياً ✓</span>
                  )}

                  {p.isClosed ? (
                    <button
                      onClick={() => reopenPeriod(p.id)}
                      className="text-[11px] text-amber-700 hover:underline cursor-pointer"
                    >
                      إلغاء الإقفال
                    </button>
                  ) : (
                    <button
                      onClick={() => closePeriod(p.id)}
                      className="text-[11px] text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      إقفال الشهر
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: BACKUP, RESTORE & DATA SAFETY */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>النسخ الاحتياطي واستعادة البيانات (Backup & Restore)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            يتم حفظ كافة الحركات محلياً في متصفحك. يمكنك تنزيل نسخة احتياطية من كافة الحركات في ملف JSON أو استعادتها.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Export JSON */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-xs text-slate-800 mb-1">تصدير نسخة احتياطية (JSON)</div>
              <p className="text-[11px] text-slate-500">
                حفظ كافة المعاملات والموردين والحسابات في ملف على جهازك.
              </p>
            </div>
            <button
              onClick={exportDataJson}
              className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل ملف النسخة الاحتياطية</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-xs text-slate-800 mb-1">استرجاع نسخة احتياطية</div>
              <p className="text-[11px] text-slate-500">
                رفع ملف JSON محفوظ مسبقاً لاستعادة كافة الحركات.
              </p>
            </div>
            <label className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>اختيار ملف للاسترجاع</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset to Demo Data */}
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-xs text-rose-900 mb-1">استعادة البيانات التجريبية (Reset)</div>
              <p className="text-[11px] text-rose-700/80">
                إعادة ضبط النظام وملء بيانات شهر مارس 2026 النموذجية.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من استعادة البيانات النموذجية الأولية؟ سيتم مسح التعديلات غير المصدرة.')) {
                  resetToDemoData();
                }
              }}
              className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استعادة البيانات النموذجية</span>
            </button>
          </div>

        </div>
      </div>

      {/* SECTION 4: MOBILE INSTALLATION & PWA */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-2xl border border-emerald-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>تثبيت النظام على الموبايل كـ تطبيق أصلي (PWA)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
                  متاح الآن 📱
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                تثبيت النظام على الشاشة الرئيسية لأجهزة Android و iPhone والكمبيوتر بدون الحاجة لمتجر تطبيقات
              </p>
            </div>
          </div>

          {onOpenInstallModal && (
            <button
              id="btn-settings-open-install-guide"
              onClick={onOpenInstallModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>دليل ونافذة التثبيت السريع</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-emerald-300 mb-1">1. على هواتف آيفون (Safari)</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              اضغط زر المشاركة (Share) ثم اختر "إضافة إلى الصفحة الرئيسية" (Add to Home Screen).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-emerald-300 mb-1">2. على هواتف أندرويد (Chrome)</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              اضغط زر القائمة (⋮) ثم اضغط "تثبيت التطبيق" أو استخدم زر التثبيت في شريط العنوان.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-emerald-300 mb-1">3. على الكمبيوتر (Chrome / Edge)</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              اضغط على أيقونة التثبيت في شريط الرابط لتشغيل النظام في نافذة مستقلة مع أيقونة على سطح المكتب.
            </p>
          </div>
        </div>
      </div>

      {/* Add Period Modal */}
      {showAddPeriodModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>إضافة شهر / دورة محاسبية جديدة</span>
            </h3>

            <form onSubmit={handleCreatePeriod} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">كود الشهر (YYYY-MM):</label>
                <input
                  type="text"
                  required
                  value={newPeriodId}
                  onChange={(e) => setNewPeriodId(e.target.value)}
                  placeholder="2026-04"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشهر المعروض:</label>
                <input
                  type="text"
                  required
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  placeholder="أبريل 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد المرحل من الشهر السابق ({currency}):</label>
                <input
                  type="number"
                  step="any"
                  value={newPeriodCarried}
                  onChange={(e) => setNewPeriodCarried(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPeriodModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  إنشاء الشهر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
