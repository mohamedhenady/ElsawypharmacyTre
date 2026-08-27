import React, { useState } from 'react';
import { useTreasury, computeUserPermissions } from '../context/TreasuryContext';
import { AppUser, UserPermissions } from '../types';
import { formatCurrency, formatDateArabic } from '../utils/formatters';
import {
  User,
  ShieldCheck,
  Calculator,
  Stethoscope,
  KeyRound,
  Lock,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Save,
  Activity,
  SlidersHorizontal,
  History,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export const ProfileModule: React.FC = () => {
  const {
    currentUser,
    updateUser,
    logout,
    auditLogs,
    pharmacyProfile,
    currentPeriod,
    incomeRecords,
    supplierPayments,
    expenses
  } = useTreasury();

  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [jobTitle, setJobTitle] = useState(currentUser.jobTitle || '');

  // PIN change state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  const permissions = computeUserPermissions(currentUser);

  const getRoleDetails = (role: AppUser['role']) => {
    switch (role) {
      case 'manager':
        return {
          title: 'المدير العام والمشرف المالي',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          desc: 'يمتلك كامل الصلاحيات الإدارية، إقفال الشهور، حذف العمليات، وإدارة صلاحيات الصيادلة والمحاسبين.'
        };
      case 'accountant':
        return {
          title: 'محاسب مالي معتمد',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: <Calculator className="w-5 h-5 text-blue-600" />,
          desc: 'مسؤول عن مراجعة الخزانة، تسليمات الدخل، سداد الموردين، المصروفات، وإعداد التقرير المالي الشهري.'
        };
      case 'pharmacist':
        return {
          title: 'صيدلي وردية',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <Stethoscope className="w-5 h-5 text-purple-600" />,
          desc: 'مسؤول عن تسجيل دخل الورديات اليومية، ديون وحسابات العملاء، والحركات السريعة المعتمدة.'
        };
    }
  };

  const roleDetails = getRoleDetails(currentUser.role);

  // User activity stats
  const userAuditLogs = auditLogs.filter(log => 
    log.details.includes(currentUser.name) || log.action === currentUser.name
  ).slice(0, 10);

  const handleUpdateBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUser(currentUser.id, {
      name: name.trim(),
      username: username.trim() || name.toLowerCase().replace(/\s+/g, ''),
      phone: phone.trim(),
      jobTitle: jobTitle.trim()
    });

    setSaveSuccessMsg('تم حفظ وتحديث بيانات الملف الشخصي بنجاح');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinErrorMsg('');
    setPinSuccessMsg('');

    if (currentUser.pin && currentPinInput !== currentUser.pin) {
      setPinErrorMsg('رمز PIN الحالي غير صحيح!');
      return;
    }

    if (!newPinInput || newPinInput.length < 4) {
      setPinErrorMsg('يجب أن يتكون رمز PIN الجديد من 4 إلى 6 أرقام على الأقل');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinErrorMsg('رمز PIN الجديد وتأكيده غير متطابقين!');
      return;
    }

    updateUser(currentUser.id, { pin: newPinInput });
    setPinSuccessMsg('تم تغيير رمز PIN بنجاح! استخدم الرمز الجديد في الجلسات القادمة.');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => {
      setPinSuccessMsg('');
      setShowPinForm(false);
    }, 3000);
  };

  const permissionItems: { key: keyof UserPermissions; label: string }[] = [
    { key: 'dashboard', label: 'لوحة الخزانة والتسوية' },
    { key: 'income', label: 'الدخل والورديات' },
    { key: 'suppliers', label: 'سداد الشركات والموردين' },
    { key: 'expenses', label: 'المصروفات والنثريات' },
    { key: 'wallet', label: 'المحافظ والإنستاباي' },
    { key: 'personal', label: 'حساب الشركاء والمسؤول' },
    { key: 'customers', label: 'ديون العملاء' },
    { key: 'employees', label: 'سلف وحسابات الموظفين' },
    { key: 'report', label: 'تقرير التسوية الشهري والطباعة' },
    { key: 'quickEntry', label: 'إضافة حركة سريعة' },
    { key: 'closePeriod', label: 'إقفال وإعادة فتح الشهور' },
    { key: 'users', label: 'إدارة المستخدمين والصلاحيات' },
    { key: 'deleteRecords', label: 'حذف وتعديل السجلات القديمة' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & User Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-700/80 relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            
            {/* User Avatar Bubble */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-xl shadow-emerald-950/50 border-2 border-emerald-400/40 shrink-0">
              {currentUser.name.slice(0, 2)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {currentUser.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleDetails.badgeColor}`}>
                  {roleDetails.icon}
                  <span>{roleDetails.title}</span>
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  اسم المستخدم: <strong className="text-white font-mono">{currentUser.username}</strong>
                </span>
                {currentUser.jobTitle && (
                  <span className="text-slate-400">• {currentUser.jobTitle}</span>
                )}
                {currentUser.lastActive && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    آخر نشاط: {formatDateArabic(currentUser.lastActive)}
                  </span>
                )}
              </p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/30"
              title="تسجيل الخروج والعودة لشاشة الدخول"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Profile Grid (2 Columns on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right / Column 1: Basic Information & PIN management (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Edit Profile Information Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">البيانات الأساسية للمستخدم</h2>
                  <p className="text-xs text-slate-500">تعديل الاسم والمسمى الوظيفي ورقم الهاتف</p>
                </div>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBasicInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المستخدم (Username):
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المسمى الوظيفي:
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: مسؤول الخزانة / صيدلي أول"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف / التواصل:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>

          {/* Security & PIN Code Management Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">الأمان ورمز الدخول السريع (PIN)</h2>
                  <p className="text-xs text-slate-500">حماية الحساب وتغيير رمز الدخول المكون من أرقام</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPinForm(!showPinForm)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {showPinForm ? 'إلغاء' : 'تغيير رمز PIN'}
              </button>
            </div>

            {!showPinForm ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">رمز PIN الحالي:</span>
                    <span className="text-xs text-slate-500 font-mono tracking-widest">
                      {currentUser.pin ? '••••••' : 'لم يتم تعيين رمز'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinForm(true)}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  تعديل الرمز ↗
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePin} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {pinErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{pinErrorMsg}</span>
                  </div>
                )}

                {pinSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pinSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {currentUser.pin && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        رمز PIN الحالي:
                      </label>
                      <input
                        type="password"
                        value={currentPinInput}
                        onChange={(e) => setCurrentPinInput(e.target.value)}
                        placeholder="أدخل الرمز الحالي"
                        maxLength={6}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">رمز PIN الجديد:</label>
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          {showNewPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showNewPin ? 'إخفاء' : 'إظهار'}</span>
                        </button>
                      </div>
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="4 إلى 6 أرقام"
                        maxLength={6}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        تأكيد رمز PIN الجديد:
                      </label>
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="أعد كتابة الرمز"
                        maxLength={6}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPinForm(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>تأكيد تغيير الرمز</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Left / Column 2: Permissions & Role Details & Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* User Role & Permissions Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">صلاحيات الحساب الحالية</h2>
                <p className="text-xs text-slate-500">نطاق الوصول الممنوح لحسابك على النظام</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4 text-xs text-slate-600 leading-relaxed">
              {roleDetails.desc}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">الشاشات والوظائف المتاحة:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {permissionItems.map(item => {
                  const isAllowed = !!permissions[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                        isAllowed
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {isAllowed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">مغلق</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current System & Period Summary Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">سياق العمل الحالي</h2>
                <p className="text-xs text-slate-500">بيانات الصيدلية والفترة المحاسبية النشطة</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">اسم الصيدلية:</span>
                <span className="font-bold text-slate-900">{pharmacyProfile.name}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">الفترة المحاسبية النشطة:</span>
                <span className="font-bold text-emerald-700">{currentPeriod.name}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">العملة المعتمدة:</span>
                <span className="font-bold text-slate-900">{pharmacyProfile.currency}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">حالة الفترة:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  currentPeriod.isClosed ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentPeriod.isClosed ? 'مقفل' : '🟢 مفتوحة للتسجيل'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* User Activity & Audit History Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">سجل النشاط والعمليات الأخيرة</h2>
              <p className="text-xs text-slate-500">الحركات والعمليات المسجلة على النظام</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {userAuditLogs.length > 0 ? `${userAuditLogs.length} حركة مسجلة` : 'لا توجد حركات حديثة'}
          </span>
        </div>

        {userAuditLogs.length > 0 ? (
          <div className="space-y-2.5">
            {userAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4 text-xs transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    <Activity className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{log.details}</span>
                    <span className="text-[11px] text-slate-500">{log.action}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                  {formatDateArabic(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <span>لا توجد حركات مسجلة مؤخراً في هذا الحساب</span>
          </div>
        )}
      </div>

    </div>
  );
};
