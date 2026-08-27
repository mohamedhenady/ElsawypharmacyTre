import React, { useState } from 'react';
import { useTreasury, computeUserPermissions } from '../context/TreasuryContext';
import { AppUser, UserPermissions, UserRole } from '../types';
import {
  ShieldCheck,
  Calculator,
  Stethoscope,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRightLeft,
  Check,
  X,
  Phone,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Building2,
  Receipt,
  UserCheck,
  CreditCard,
  FileText,
  Zap,
  SlidersHorizontal
} from 'lucide-react';

const PERMISSION_CONFIG: {
  key: keyof UserPermissions;
  label: string;
  desc: string;
  icon: React.ReactNode;
  category: 'core' | 'finance' | 'ledger' | 'reports';
}[] = [
  {
    key: 'dashboard',
    label: 'لوحة الخزانة والتسوية',
    desc: 'عرض بطاقات الإجماليات، صافي الخزانة، الرصيد المرحل ومطابقة الدرج',
    icon: <LayoutDashboard className="w-4 h-4 text-emerald-500" />,
    category: 'core'
  },
  {
    key: 'income',
    label: 'الدخل والورديات',
    desc: 'تسجيل دخل الورديات الصباحية والمسائية وتعديل الكشوفات',
    icon: <TrendingUp className="w-4 h-4 text-teal-500" />,
    category: 'finance'
  },
  {
    key: 'suppliers',
    label: 'سداد الشركات والموردين',
    desc: 'تسجيل مدفوعات شركات الأدوية والمخازن وأرقام الفواتير',
    icon: <Building2 className="w-4 h-4 text-blue-500" />,
    category: 'finance'
  },
  {
    key: 'expenses',
    label: 'المصروفات والنثريات',
    desc: 'تسجيل النثريات اليومية (نظافة، بوفيه، كهرباء، صيانة)',
    icon: <Receipt className="w-4 h-4 text-amber-500" />,
    category: 'finance'
  },
  {
    key: 'wallet',
    label: 'المحافظ والإنستاباي',
    desc: 'سجل تحويلات فودافون كاش وإنستاباي والتحويلات البنكية',
    icon: <Wallet className="w-4 h-4 text-violet-500" />,
    category: 'finance'
  },
  {
    key: 'customers',
    label: 'ديون وحسابات العملاء',
    desc: 'تسجيل الديون الجديدة على العملاء وتوثيق السدادات النقدية',
    icon: <CreditCard className="w-4 h-4 text-rose-500" />,
    category: 'ledger'
  },
  {
    key: 'personal',
    label: 'مسحوبات الشركاء والمسؤول',
    desc: 'متابعة جاري الشركاء والمسؤولين والمسحوبات الشخصية',
    icon: <UserCheck className="w-4 h-4 text-cyan-500" />,
    category: 'ledger'
  },
  {
    key: 'employees',
    label: 'سلف وحسابات الموظفين',
    desc: 'تسجيل سلف الموظفين والخصومات وتسوية المرتبات',
    icon: <Users className="w-4 h-4 text-indigo-500" />,
    category: 'ledger'
  },
  {
    key: 'report',
    label: 'تقرير التسوية الشهري والطباعة',
    desc: 'عرض التقرير النهائي وطباعة كشف مطابقة الخزانة',
    icon: <FileText className="w-4 h-4 text-emerald-600" />,
    category: 'reports'
  },
  {
    key: 'quickEntry',
    label: 'إضافة حركة سريعة (⚡)',
    desc: 'استخدام نافذة الحركة السريعة لتدوين المعاملات بضغطة واحدة',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    category: 'core'
  },
  {
    key: 'deleteRecords',
    label: 'حذف السجلات والعمليات',
    desc: 'السماح بحذف القيود والسجلات المالية المسجلة',
    icon: <Trash2 className="w-4 h-4 text-red-500" />,
    category: 'core'
  }
];

export const UsersManagementModule: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    updatePharmacistPermissions
  } = useTreasury();

  const isManager = currentUser.role === 'manager';

  const [selectedPharmacistId, setSelectedPharmacistId] = useState<string>(() => {
    const firstPharm = users.find(u => u.role === 'pharmacist');
    return firstPharm ? firstPharm.id : '';
  });

  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    role: UserRole;
    pin: string;
    jobTitle: string;
    phone: string;
  }>({
    name: '',
    username: '',
    role: 'pharmacist',
    pin: '1234',
    jobTitle: 'صيدلي وردية',
    phone: ''
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: `user_${Math.floor(Math.random() * 1000)}`,
      role: 'pharmacist',
      pin: '1234',
      jobTitle: 'صيدلي وردية',
      phone: ''
    });
    setShowAddUserModal(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      pin: user.pin || '',
      jobTitle: user.jobTitle || '',
      phone: user.phone || ''
    });
    setShowAddUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        pin: formData.pin,
        jobTitle: formData.jobTitle,
        phone: formData.phone
      });
    } else {
      addUser({
        name: formData.name,
        username: formData.username || `user_${Date.now()}`,
        role: formData.role,
        pin: formData.pin || '1234',
        jobTitle: formData.jobTitle,
        phone: formData.phone,
        avatarColor: formData.role === 'manager' ? 'emerald' : formData.role === 'accountant' ? 'blue' : 'purple'
      });
    }
    setShowAddUserModal(false);
  };

  const currentPharmacist = users.find(u => u.id === selectedPharmacistId) || users.find(u => u.role === 'pharmacist');

  const handleTogglePharmacistPerm = (permKey: keyof UserPermissions) => {
    if (!currentPharmacist) return;
    const currentVal = currentPharmacist.customPermissions?.[permKey] ?? false;
    updatePharmacistPermissions(currentPharmacist.id, {
      [permKey]: !currentVal
    });
  };

  const handleSetPresetPharmacist = (presetType: 'shift' | 'full' | 'minimal') => {
    if (!currentPharmacist) return;
    if (presetType === 'shift') {
      // قياسي: وردية صيدلية (الدخل + العملاء + حركة سريعة)
      updatePharmacistPermissions(currentPharmacist.id, {
        dashboard: false,
        income: true,
        suppliers: false,
        expenses: false,
        wallet: false,
        personal: false,
        customers: true,
        employees: false,
        report: false,
        settings: false,
        users: false,
        quickEntry: true,
        closePeriod: false,
        deleteRecords: false
      });
    } else if (presetType === 'full') {
      // صيدلي مسؤول رئيسي
      updatePharmacistPermissions(currentPharmacist.id, {
        dashboard: true,
        income: true,
        suppliers: true,
        expenses: true,
        wallet: true,
        personal: true,
        customers: true,
        employees: true,
        report: true,
        settings: false,
        users: false,
        quickEntry: true,
        closePeriod: false,
        deleteRecords: false
      });
    } else if (presetType === 'minimal') {
      // حركة سريعة فقط
      updatePharmacistPermissions(currentPharmacist.id, {
        dashboard: false,
        income: true,
        suppliers: false,
        expenses: false,
        wallet: false,
        personal: false,
        customers: false,
        employees: false,
        report: false,
        settings: false,
        users: false,
        quickEntry: true,
        closePeriod: false,
        deleteRecords: false
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner with Policy Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white">إدارة الحسابات وهيكل الصلاحيات</h1>
                <span className="text-xs bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/40">
                  نظام الأمان النشط
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                توزيع الأدوار المحاسبية بدقة لضمان سرية الحسابات وسلامة الخزانة: المدير بكامل الصلاحيات، المحاسب للداشبورد والموردين والمصروفات فقط، والصيدلي بصلاحيات مخصصة يتحكم بها المدير.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isManager && (
              <button
                id="btn-add-new-user"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Roles Policy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-700/80">
          {/* Manager Role Card */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>1. حساب المدير (Admin)</span>
              </span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">
                كامل الصلاحيات 100%
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              يمتلك التحكم الشامل في كافة شاشات النظام، إقفال الفترات، تعديل وحذف البيانات، وإدارة وتحديد صلاحيات جميع الصيادلة.
            </p>
          </div>

          {/* Accountant Role Card */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-700/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span>2. حساب المحاسب (Accountant)</span>
              </span>
              <span className="text-[10px] bg-blue-500/30 text-blue-200 font-bold px-1.5 py-0.5 rounded border border-blue-500/40">
                محدد وثابت
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80 leading-relaxed">
              يقتصر وصوله حصرياً على: <strong className="text-white">الداشبورد</strong> + <strong className="text-white">سداد الشركات</strong> + <strong className="text-white">المصروفات</strong>. وباقي الأقسام محجوبة تماماً.
            </p>
          </div>

          {/* Pharmacist Role Card */}
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-700/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-purple-400" />
                <span>3. حساب الصيدلي (Pharmacist)</span>
              </span>
              <span className="text-[10px] bg-purple-500/30 text-purple-200 font-bold px-1.5 py-0.5 rounded border border-purple-500/40">
                بتحكم المدير فقط
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 leading-relaxed">
              يتم ضبط وتحديد صلاحياته لكل شاشة على حدة بواسطة المدير فقط من خلال مصفوفة التبديل التفاعلية بالأسفل.
            </p>
          </div>
        </div>
      </div>

      {/* System Users List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-800">المستخدمون المسجلون بالنظام ({users.length})</h2>
          </div>
          <span className="text-xs text-slate-500">
            اضغط على زر التبديل لتسجيل الدخول الفوري بأي حساب
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((user) => {
            const isCurrent = user.id === currentUser.id;
            const perms = computeUserPermissions(user);
            const activePermsCount = Object.values(perms).filter(Boolean).length;

            return (
              <div
                key={user.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isCurrent ? 'bg-emerald-50/40' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-base border shadow-xs ${
                    user.role === 'manager'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : user.role === 'accountant'
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-purple-100 border-purple-300 text-purple-800'
                  }`}>
                    {user.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">{user.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                          الحساب النشط حالياً ✓
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        user.role === 'manager'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : user.role === 'accountant'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-purple-50 text-purple-800 border-purple-300'
                      }`}>
                        {user.role === 'manager' && '👑 مدير النظام'}
                        {user.role === 'accountant' && '📊 محاسب مالي'}
                        {user.role === 'pharmacist' && '💊 صيدلي وردية'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>اسم المستخدم: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{user.username}</code></span>
                      <span>•</span>
                      <span>رمز PIN: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{user.pin}</code></span>
                      {user.jobTitle && (
                        <>
                          <span>•</span>
                          <span>{user.jobTitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions Summary & Actions */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      الصلاحيات المفعلة:
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      user.role === 'manager'
                        ? 'bg-emerald-100 text-emerald-800'
                        : user.role === 'accountant'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role === 'manager' ? 'كاملة (12/12)' : `${activePermsCount} صلاحية`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCurrent && (
                      <button
                        id={`btn-switch-user-${user.id}`}
                        onClick={() => setCurrentUser(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        title="التبديل إلى هذا الحساب"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>تبديل</span>
                      </button>
                    )}

                    {isManager && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="تعديل بيانات المستخدم"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {users.length > 1 && user.id !== currentUser.id && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف حساب "${user.name}"؟`)) {
                                deleteUser(user.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف المستخدم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PHARMACIST PERMISSION MATRIX (Controlled by Manager only) */}
      <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-purple-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">مصفوفة صلاحيات حساب الصيدلي</h3>
                <span className="text-[10px] bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full">
                  تحكم المدير المباشر 🔒
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                حدد الشاشات والأذونات المسموح للصيدلي الوصول إليها عند تسجيل دخوله
              </p>
            </div>
          </div>

          {/* Pharmacist selector if multiple */}
          {users.filter(u => u.role === 'pharmacist').length > 1 && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-purple-500/30 text-xs">
              <span className="text-purple-300">اختر الصيدلي:</span>
              <select
                value={selectedPharmacistId}
                onChange={(e) => setSelectedPharmacistId(e.target.value)}
                className="bg-slate-900 text-white text-xs rounded px-2 py-1 border border-purple-500/50 focus:outline-hidden"
              >
                {users.filter(u => u.role === 'pharmacist').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {currentPharmacist ? (
          <div className="p-5 space-y-5">
            {/* Quick Templates Bar */}
            {isManager && (
              <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-purple-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>نماذج سريعة لضبط صلاحيات الصيدلي بضغطة زر:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSetPresetPharmacist('shift')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    نموذج وردية قياسي (الدخل + العملاء + حركة سريعة)
                  </button>
                  <button
                    onClick={() => handleSetPresetPharmacist('full')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    صيدلي رئيسي (شامل)
                  </button>
                  <button
                    onClick={() => handleSetPresetPharmacist('minimal')}
                    className="px-3 py-1.5 bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    إدخال دخل وحركة سريعة فقط
                  </button>
                </div>
              </div>
            )}

            {!isManager && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>أنت تستعرض هذه الشاشة كـ ({currentUser.name}). لتعديل الصلاحيات يرجى التبديل لحساب المدير العام.</span>
              </div>
            )}

            {/* Permission Toggles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PERMISSION_CONFIG.map((perm) => {
                const isEnabled = !!currentPharmacist.customPermissions?.[perm.key];

                return (
                  <div
                    key={perm.key}
                    onClick={() => isManager && handleTogglePharmacistPerm(perm.key)}
                    className={`p-4 rounded-xl border transition-all select-none flex flex-col justify-between ${
                      isEnabled
                        ? 'bg-purple-50/60 border-purple-400/80 shadow-xs'
                        : 'bg-slate-50/50 border-slate-200 opacity-75'
                    } ${isManager ? 'cursor-pointer hover:border-purple-500' : 'cursor-default'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          isEnabled ? 'bg-purple-100 border-purple-300' : 'bg-slate-200/70 border-slate-300'
                        }`}>
                          {perm.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">{perm.label}</h4>
                          <span className={`text-[10px] font-semibold ${
                            isEnabled ? 'text-purple-700' : 'text-slate-500'
                          }`}>
                            {isEnabled ? 'مفعلة للصيدلي ✓' : 'معطلة ✕'}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        isEnabled ? 'bg-purple-600' : 'bg-slate-300'
                      }`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isEnabled ? 'translate-x-0' : '-translate-x-5'
                        }`} />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                      {perm.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            لم يتم العثور على حساب صيدلي مسجل. يمكنك إضافة حساب صيدلي جديد من زر "إضافة مستخدم".
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}</span>
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. إبراهيم فؤاد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الدور / الحساب</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="pharmacist">صيدلي (صلاحيات مخصصة)</option>
                    <option value="accountant">محاسب (داشبورد + شركات + مصروفات)</option>
                    <option value="manager">مدير (كامل الصلاحيات)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز PIN للدخول السريع</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 4321"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden font-mono text-center font-bold tracking-widest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    placeholder="مثال: صيدلي وردية مسائية"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    placeholder="010..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المستخدم (لتسجيل الدخول)</label>
                <input
                  type="text"
                  required
                  placeholder="pharm_1"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إضافة الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
