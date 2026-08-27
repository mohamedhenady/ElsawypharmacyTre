import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { AppUser } from '../types';
import {
  ShieldCheck,
  Calculator,
  Stethoscope,
  KeyRound,
  UserCheck,
  X,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, login } = useTreasury();
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectUser = (user: AppUser) => {
    setSelectedUser(user);
    setPinInput('');
    setErrorMsg('');
  };

  const handleConfirmLogin = (userToLogin?: AppUser) => {
    const target = userToLogin || selectedUser;
    if (!target) return;

    const result = login(target.id, pinInput || undefined);
    if (result.success) {
      setErrorMsg('');
      setSelectedUser(null);
      setPinInput('');
      onClose();
    } else {
      setErrorMsg(result.error || 'فشل تسجيل الدخول');
    }
  };

  const getRoleBadge = (role: AppUser['role']) => {
    switch (role) {
      case 'manager':
        return {
          label: 'المدير (كامل الصلاحيات)',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          color: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
        };
      case 'accountant':
        return {
          label: 'محاسب (داشبورد + موردين + مصروفات فقط)',
          icon: <Calculator className="w-4 h-4 text-blue-400" />,
          color: 'bg-blue-950/70 text-blue-300 border-blue-700/60'
        };
      case 'pharmacist':
        return {
          label: 'صيدلي (صلاحيات مخصصة من المدير)',
          icon: <Stethoscope className="w-4 h-4 text-purple-400" />,
          color: 'bg-purple-950/70 text-purple-300 border-purple-700/60'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 text-white border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">تبديل حساب المستخدم</h2>
              <p className="text-xs text-slate-400">الحساب الفعّال حالياً: <span className="text-emerald-400 font-semibold">{currentUser.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Users List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <p className="text-xs text-slate-400 mb-2">اختر الحساب المطلوب للتبديل والعمل بصلاحياته:</p>

          <div className="space-y-2.5">
            {users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const isSelected = selectedUser?.id === user.id;
              const badge = getRoleBadge(user.role);

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-950/30 border-emerald-600/70 shadow-sm'
                      : isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm border ${
                        user.role === 'manager'
                          ? 'bg-emerald-900/50 border-emerald-600 text-emerald-300'
                          : user.role === 'accountant'
                          ? 'bg-blue-900/50 border-blue-600 text-blue-300'
                          : 'bg-purple-900/50 border-purple-600 text-purple-300'
                      }`}>
                        {user.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{user.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-sm">
                              الحالي
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{user.jobTitle || 'موظف بالنظام'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-medium ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      {user.pin && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>محمي برمز PIN ({user.pin})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selected Account PIN Entry */}
                  {isSelected && !isCurrent && (
                    <div className="mt-3 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row items-center gap-2 animate-in fade-in" onClick={e => e.stopPropagation()}>
                      <div className="relative flex-1 w-full">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                        <input
                          type="password"
                          placeholder={user.pin ? `أدخل رمز PIN (الافتراضي: ${user.pin})` : 'أدخل رمز PIN'}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleConfirmLogin(user)}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleConfirmLogin(user)}
                        className="w-full sm:w-auto px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>دخول فوري</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Helper Notes */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300">💡 الحسابات الافتراضية الجاهزة:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-slate-300">
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                <span className="text-emerald-400 font-bold">المدير:</span> PIN: <code className="text-white bg-slate-900 px-1 rounded">1111</code>
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                <span className="text-blue-400 font-bold">المحاسب:</span> PIN: <code className="text-white bg-slate-900 px-1 rounded">2222</code>
              </div>
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700/60">
                <span className="text-purple-400 font-bold">الصيدلي:</span> PIN: <code className="text-white bg-slate-900 px-1 rounded">3333</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            الصلاحيات تتغير فوراً بمجرد تسجيل الدخول
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
