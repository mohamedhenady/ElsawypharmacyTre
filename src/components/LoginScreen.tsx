import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { AppUser } from '../types';
import {
  ShieldCheck,
  Calculator,
  Stethoscope,
  Lock,
  LogIn,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { users, login, pharmacyProfile } = useTreasury();
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(() => {
    // Default to first user or manager
    return users.find(u => u.role === 'manager') || users[0] || null;
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getRoleBadge = (role: AppUser['role']) => {
    switch (role) {
      case 'manager':
        return {
          title: 'المدير العام',
          label: 'كامل الصلاحيات والإشراف',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
          activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30'
        };
      case 'accountant':
        return {
          title: 'محاسب مالي',
          label: 'الخزانة، الموردين والمصروفات',
          icon: <Calculator className="w-4 h-4 text-blue-400" />,
          color: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
          activeBorder: 'border-blue-500 ring-2 ring-blue-500/30'
        };
      case 'pharmacist':
        return {
          title: 'صيدلي وردية',
          label: 'الدخل والورديات والديون',
          icon: <Stethoscope className="w-4 h-4 text-purple-400" />,
          color: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
          activeBorder: 'border-purple-500 ring-2 ring-purple-500/30'
        };
    }
  };

  const handleSelectUser = (user: AppUser) => {
    setSelectedUser(user);
    setPinInput('');
    setErrorMsg('');
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
  };

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setErrorMsg('يرجى اختيار المستخدم أولاً');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      const res = login(selectedUser.id, pinInput);
      if (!res.success) {
        setErrorMsg(res.error || 'رمز PIN غير صحيح');
        setIsSubmitting(false);
      }
      // On success, isAuthenticated becomes true and App re-renders the dashboard
    }, 200);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      
      {/* Background Decorative glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-4xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left / Info Side Panel (4 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 border-b lg:border-b-0 lg:border-l border-slate-800 flex flex-col justify-between">
          <div>
            {/* Pharmacy Logo & Branding */}
            <div className="flex items-center gap-3 mb-6">
              {pharmacyProfile.logoUrl ? (
                <img
                  src={pharmacyProfile.logoUrl}
                  alt={pharmacyProfile.name}
                  className="w-12 h-12 rounded-2xl object-contain bg-slate-800 p-1.5 border border-slate-700 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {pharmacyProfile.name || 'صيدلية النور والشفاء'}
                </h1>
                <p className="text-xs text-emerald-400 font-medium">
                  منظومة الخزانة والتسوية المحاسبية
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">تسجيل دخول آمن ومحمي</strong>
                  <span>البيانات المالية والخزائن مشفرة ومحفوظة، ولا يتم فتح لوحة التحكم إلا بعد تأكيد الهوية.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold">صلاحيات مخصصة لكل دور</strong>
                  <span>حساب المدير، المحاسب المالي، والصيدلي كلٌّ بحسب صلاحيات عمله.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick PIN Hint */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              الرمز الافتراضي: <strong className="text-emerald-400 font-mono">1234</strong>
            </span>
            <span className="text-slate-500">نظام محلي مشفر</span>
          </div>
        </div>

        {/* Right / Login Action Form (7 cols on lg) */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <span>تسجيل الدخول إلى النظام</span>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </h2>
            <p className="text-xs text-slate-400">
              اختر حسابك وأدخل رمز المرور السريع (PIN) للبدء:
            </p>
          </div>

          {/* Step 1: Users Grid */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              1. اختر حساب المستخدم:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {users.map((user) => {
                const badge = getRoleBadge(user.role);
                const isSelected = selectedUser?.id === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? `${badge.activeBorder} bg-slate-800/90 text-white shadow-lg`
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 border ${badge.color}`}>
                        {user.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-white">
                          {user.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                          {badge.icon}
                          <span>{badge.title}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: PIN Input & Keypad */}
          {selectedUser && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2. رمز PIN السريع لحساب ({selectedUser.name}):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showPin ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>إخفاء</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>إظهار</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setErrorMsg('');
                    }}
                    maxLength={6}
                    placeholder="••••"
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-center text-xl tracking-widest font-mono text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>

                {errorMsg && (
                  <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/40 p-2 rounded-lg border border-rose-800/50">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Number Keypad for Fast Touch/Mobile input */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinDigit(num)}
                    className="py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-white font-mono text-sm font-bold border border-slate-700/50 active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700/40 cursor-pointer"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit('0')}
                  className="py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-white font-mono text-sm font-bold border border-slate-700/50 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700/40 cursor-pointer"
                >
                  ⌫
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري التحقق...' : 'دخول إلى لوحة الخزانة'}</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
