import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { Supplier, SupplierPayment, PaymentMethod } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  Filter,
  FileText,
  Phone,
  Building,
  User,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  CheckCheck,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { PreparePrintButton } from './PreparePrintButton';
import { PrintHeader, PrintSignatures } from './PrintHeader';

export const SuppliersModule: React.FC = () => {
  const {
    pharmacyProfile,
    currentPeriod,
    suppliers,
    supplierPayments,
    addSupplierPayment,
    updateSupplierPayment,
    deleteSupplierPayment,
    toggleSupplierPaymentVerification,
    bulkVerifySupplierPayments,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    currentUser
  } = useTreasury();

  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'master' | 'statement'>('payments');
  const [selectedSupplierForStatement, setSelectedSupplierForStatement] = useState<string>('');
  
  // Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    return today.startsWith(currentPeriod.id) ? today : `${currentPeriod.id}-01`;
  });
  const [paySupplierId, setPaySupplierId] = useState<string>(suppliers[0]?.id || '');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payInvoice, setPayInvoice] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [payVerified, setPayVerified] = useState<boolean>(true);

  // Supplier Master Form State
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supName, setSupName] = useState<string>('');
  const [supRep, setSupRep] = useState<string>('');
  const [supPhone, setSupPhone] = useState<string>('');
  const [supAddress, setSupAddress] = useState<string>('');
  const [supNotes, setSupNotes] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');

  const periodPayments = supplierPayments.filter(p => p.periodId === currentPeriod.id);
  const totalPeriodPaid = periodPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const verifiedPayments = periodPayments.filter(p => !!p.verified);
  const unverifiedPayments = periodPayments.filter(p => !p.verified);
  const totalVerifiedPaid = verifiedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalUnverifiedPaid = unverifiedPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const filteredPayments = periodPayments.filter(p => {
    if (filterSupplier !== 'all' && p.supplierId !== filterSupplier) return false;
    if (filterVerified === 'verified' && !p.verified) return false;
    if (filterVerified === 'unverified' && p.verified) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = suppliers.find(s => s.id === p.supplierId)?.name.toLowerCase() || '';
      const notes = p.notes?.toLowerCase() || '';
      const inv = p.invoiceNumber?.toLowerCase() || '';
      const verBy = p.verifiedBy?.toLowerCase() || '';
      if (!sName.includes(q) && !notes.includes(q) && !inv.includes(q) && !verBy.includes(q)) return false;
    }
    return true;
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!paySupplierId) {
      alert('يرجى اختيار المورد');
      return;
    }

    const verifier = currentUser?.name || 'المحاسب المسؤول';
    const verDate = payVerified ? new Date().toISOString() : undefined;

    if (editingPaymentId) {
      const existing = supplierPayments.find(p => p.id === editingPaymentId);
      updateSupplierPayment(editingPaymentId, {
        supplierId: paySupplierId,
        date: payDate,
        amount: amt,
        paymentMethod: payMethod,
        invoiceNumber: payInvoice,
        notes: payNotes,
        verified: payVerified,
        verifiedAt: payVerified ? (existing?.verifiedAt || verDate) : undefined,
        verifiedBy: payVerified ? (existing?.verifiedBy || verifier) : undefined
      });
      setEditingPaymentId(null);
    } else {
      addSupplierPayment({
        periodId: currentPeriod.id,
        supplierId: paySupplierId,
        date: payDate,
        amount: amt,
        paymentMethod: payMethod,
        invoiceNumber: payInvoice,
        notes: payNotes,
        verified: payVerified,
        verifiedAt: payVerified ? verDate : undefined,
        verifiedBy: payVerified ? verifier : undefined
      });
    }

    setPayAmount('');
    setPayInvoice('');
    setPayNotes('');
    setPayVerified(true);
    setShowPaymentForm(false);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      alert('يرجى إدخال اسم المورد أو الشركة');
      return;
    }

    if (editingSupplierId) {
      updateSupplier(editingSupplierId, {
        name: supName,
        representativeName: supRep,
        phone: supPhone,
        address: supAddress,
        notes: supNotes
      });
      setEditingSupplierId(null);
    } else {
      addSupplier({
        name: supName,
        representativeName: supRep,
        phone: supPhone,
        address: supAddress,
        notes: supNotes
      });
    }

    setSupName('');
    setSupRep('');
    setSupPhone('');
    setSupAddress('');
    setSupNotes('');
    setShowSupplierModal(false);
  };

  const openEditSupplier = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setSupName(sup.name);
    setSupRep(sup.representativeName || '');
    setSupPhone(sup.phone || '');
    setSupAddress(sup.address || '');
    setSupNotes(sup.notes || '');
    setShowSupplierModal(true);
  };

  const openEditPayment = (p: SupplierPayment) => {
    setEditingPaymentId(p.id);
    setPaySupplierId(p.supplierId);
    setPayDate(p.date);
    setPayAmount(String(p.amount));
    setPayMethod(p.paymentMethod);
    setPayInvoice(p.invoiceNumber || '');
    setPayNotes(p.notes || '');
    setPayVerified(p.verified ?? true);
    setShowPaymentForm(true);
  };

  const currentStatementSupplier = suppliers.find(s => s.id === selectedSupplierForStatement);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Official Print Header */}
      <PrintHeader
        title={
          activeSubTab === 'statement' && currentStatementSupplier
            ? `كشف حساب مورد تفصيلي: ${currentStatementSupplier.name}`
            : activeSubTab === 'master'
            ? 'دليل شركات وموردي الأدوية المعتمد'
            : 'كشف سداد الموردين وشركات الأدوية'
        }
        subtitle={
          activeSubTab === 'statement' && currentStatementSupplier?.phone
            ? `هاتف التواصل: ${currentStatementSupplier.phone}`
            : undefined
        }
        summaryStats={
          activeSubTab === 'payments'
            ? [
                { label: 'إجمالي المسدد', value: formatCurrency(totalPeriodPaid, pharmacyProfile.currency) },
                { label: 'تم التحقق', value: `${verifiedPayments.length} دفعة (${formatCurrency(totalVerifiedPaid, pharmacyProfile.currency)})` },
                { label: 'قيد المراجعة', value: `${unverifiedPayments.length} دفعة` },
                { label: 'عدد الموردين', value: `${suppliers.length} مورد` }
              ]
            : undefined
        }
      />

      {/* Top Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">سداد الموردين وشركات الأدوية</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة فواتير ومسددات شركات التوزيع (ابن سينا، المتحدة، فارما أوفرسيز...) والتحقق المحاسبي لشهر <strong className="text-slate-800">{currentPeriod.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PreparePrintButton
            label="تجهيز للطباعة"
            title={
              activeSubTab === 'statement' && currentStatementSupplier
                ? `كشف حساب مورد: ${currentStatementSupplier.name}`
                : activeSubTab === 'master'
                ? 'دليل شركات وموردي الأدوية المعتمد'
                : 'كشف سداد الموردين وشركات الأدوية'
            }
            subtitle={
              activeSubTab === 'statement' && currentStatementSupplier?.phone
                ? `هاتف التواصل: ${currentStatementSupplier.phone}`
                : `الفترة المحاسبية: ${currentPeriod.name}`
            }
            summaryStats={
              activeSubTab === 'payments'
                ? [
                    { label: 'إجمالي المسدد', value: formatCurrency(totalPeriodPaid, pharmacyProfile.currency) },
                    { label: 'تم التحقق', value: `${verifiedPayments.length} دفعة` },
                    { label: 'قيد المراجعة', value: `${unverifiedPayments.length} دفعة` },
                    { label: 'عدد الموردين', value: `${suppliers.length} مورد` }
                  ]
                : undefined
            }
          />
          <button
            onClick={() => {
              setEditingSupplierId(null);
              setSupName('');
              setSupRep('');
              setSupPhone('');
              setSupAddress('');
              setSupNotes('');
              setShowSupplierModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            + إضافة مورد جديد
          </button>
          
          <button
            onClick={() => {
              setEditingPaymentId(null);
              setPayAmount('');
              setPayNotes('');
              setPayVerified(true);
              setShowPaymentForm(!showPaymentForm);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            + تسجيل دفعة سداد
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'payments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          سجل حركات السداد ({periodPayments.length})
        </button>

        <button
          onClick={() => setActiveSubTab('master')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'master'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          دليل الموردين المعتمد ({suppliers.length})
        </button>

        <button
          onClick={() => {
            setActiveSubTab('statement');
            if (!selectedSupplierForStatement && suppliers.length > 0) {
              setSelectedSupplierForStatement(suppliers[0].id);
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'statement'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          كشف حساب مورد تفصيلي
        </button>
      </div>

      {/* SUB-TAB 1: PAYMENTS LIST */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stat-card-print">
            {/* Total Paid */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">إجمالي مدفوعات الموردين:</span>
                <div className="text-xl font-black text-slate-900 font-mono-num mt-1">
                  {formatCurrency(totalPeriodPaid, pharmacyProfile.currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  إجمالي {periodPayments.length} حركة سداد
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            {/* Verified Payments */}
            <div 
              onClick={() => setFilterVerified(filterVerified === 'verified' ? 'all' : 'verified')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                filterVerified === 'verified'
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-200'
                  : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-800">تم التحقق والمطابقة:</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {verifiedPayments.length} دفعة
                    </span>
                  </div>
                  <div className="text-xl font-black text-emerald-700 font-mono-num mt-1">
                    {formatCurrency(totalVerifiedPaid, pharmacyProfile.currency)}
                  </div>
                  <div className="text-[11px] text-emerald-600/80 mt-0.5">
                    معتمدة محاسبياً بنسبة {periodPayments.length > 0 ? Math.round((verifiedPayments.length / periodPayments.length) * 100) : 0}%
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Unverified / Pending Review */}
            <div 
              onClick={() => setFilterVerified(filterVerified === 'unverified' ? 'all' : 'unverified')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                filterVerified === 'unverified'
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-800">قيد المراجعة والتحقق:</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      {unverifiedPayments.length} دفعة
                    </span>
                  </div>
                  <div className="text-xl font-black text-amber-700 font-mono-num mt-1">
                    {formatCurrency(totalUnverifiedPaid, pharmacyProfile.currency)}
                  </div>
                  <div className="text-[11px] text-amber-600/80 mt-0.5">
                    تحتاج تدقيق الفاتورة من المحاسب
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form (Create / Edit) */}
          {showPaymentForm && (
            <div className="no-print bg-slate-50 p-5 rounded-2xl border-2 border-blue-500 shadow-sm animate-in fade-in">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>{editingPaymentId ? 'تعديل دفعة سداد مورد' : 'تسجيل دفعة سداد جديدة لمورد'}</span>
              </h3>

              <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المورد / شركة التوزيع:</label>
                  <select
                    required
                    value={paySupplierId}
                    onChange={(e) => setPaySupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm font-bold bg-white"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ السداد:</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المسدد ({pharmacyProfile.currency}):</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="مثال: 12500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-base font-black font-mono-num bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع:</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm font-semibold bg-white"
                  >
                    <option value="cash">نقدي (كاش من الدرج) 💵</option>
                    <option value="instapay">انستاباي ⚡</option>
                    <option value="wallet">محفظة إلكترونية 📱</option>
                    <option value="bank_transfer">تحويل بنكي 🏦</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة / الإيصال:</label>
                  <input
                    type="text"
                    value={payInvoice}
                    onChange={(e) => setPayInvoice(e.target.value)}
                    placeholder="مثال: INV-98421"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات:</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="اسم المندوب أو تفاصيل الشحنة..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm bg-white"
                  />
                </div>

                {/* Accountant Verification Checkbox */}
                <div className="sm:col-span-2 lg:col-span-3 bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={payVerified}
                      onChange={(e) => setPayVerified(e.target.checked)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          تم التحقق من صحة ومطابقة السداد بواسطة المحاسب
                        </span>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        تأكيد صحة خروج المبلغ، مطابقة إيصال الاستلام أو الفاتورة مع المندوب والشركة
                      </span>
                    </div>
                  </label>
                  <div>
                    {payVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>معتمد ومتحقق منه</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>قيد المراجعة</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {editingPaymentId ? 'حفظ التعديلات' : 'تسجيل السداد'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Bar */}
          <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            
            {/* Search & Supplier Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالمورد، الفاتورة، المحاسب..."
                  className="text-xs w-full sm:w-56 bg-transparent focus:outline-none text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold focus:outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">جميع الموردين ({suppliers.length})</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Verification Status Filter Tabs & Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setFilterVerified('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filterVerified === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  الكل ({periodPayments.length})
                </button>
                <button
                  onClick={() => setFilterVerified('verified')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterVerified === 'verified'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>تم التحقق ({verifiedPayments.length})</span>
                </button>
                <button
                  onClick={() => setFilterVerified('unverified')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterVerified === 'unverified'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>قيد المراجعة ({unverifiedPayments.length})</span>
                </button>
              </div>

              {/* Bulk Verify Button if any pending */}
              {unverifiedPayments.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`هل تريد تأكيد والتحقق من صحة جميع المدفوعات المعلقة (${unverifiedPayments.length} دفعة) دفعة واحدة؟`)) {
                      bulkVerifySupplierPayments(unverifiedPayments.map(p => p.id), true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="اعتماد وتأكيد كل المدفوعات المعلقة"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>اعتماد الكل ({unverifiedPayments.length})</span>
                </button>
              )}
            </div>

          </div>

          {/* Payments Table */}
          <div className="printable-table-container bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                    <th className="py-3 px-4 w-44">حالة التحقق والاعتماد</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">اسم المورد / الشركة</th>
                    <th className="py-3 px-4">المبلغ المسدد</th>
                    <th className="py-3 px-4">طريقة السداد</th>
                    <th className="py-3 px-4">رقم الفاتورة</th>
                    <th className="py-3 px-4">الملاحظات</th>
                    <th className="py-3 px-4 text-center no-print-action">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Filter className="w-6 h-6 text-slate-300" />
                          <span>لا توجد مدفوعات موردين مطابقة لخيارات الفلترة الحالية.</span>
                          {(filterVerified !== 'all' || filterSupplier !== 'all' || searchQuery) && (
                            <button
                              onClick={() => {
                                setFilterVerified('all');
                                setFilterSupplier('all');
                                setSearchQuery('');
                              }}
                              className="text-xs text-blue-600 font-bold hover:underline mt-1"
                            >
                              إعادة ضبط الفلاتر
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => {
                      const sup = suppliers.find(s => s.id === p.supplierId);
                      const isVerified = !!p.verified;

                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !isVerified ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          {/* Verification Column with interactive toggle & tag */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleSupplierPaymentVerification(p.id)}
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                                  isVerified
                                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                    : 'border-2 border-slate-300 hover:border-emerald-500 bg-white'
                                }`}
                                title={isVerified ? 'تم التحقق (انقر لإلغاء التحقق)' : 'انقر للتحقق واعتماد السداد'}
                              >
                                {isVerified && <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </button>

                              {isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>تم التحقق</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 print:border-amber-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  <span>قيد المراجعة</span>
                                </span>
                              )}
                            </div>
                            {isVerified && p.verifiedBy && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 mr-7">
                                المحاسب: {p.verifiedBy}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                            {formatDateArabic(p.date)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                            <span className="flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-blue-500 no-print" />
                              {sup?.name || 'مورد غير معروف'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-black text-slate-900 font-mono-num text-sm">
                            {formatCurrency(p.amount, pharmacyProfile.currency)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 print:border print:border-slate-300">
                              {p.paymentMethod === 'cash' ? 'نقدي (كاش)' : p.paymentMethod === 'instapay' ? 'انستاباي' : p.paymentMethod === 'wallet' ? 'محفظة' : 'تحويل'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono-num">
                            {p.invoiceNumber ? (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[11px] print:border print:border-slate-300">
                                {p.invoiceNumber}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {p.notes || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center no-print-action">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleSupplierPaymentVerification(p.id)}
                                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                  isVerified
                                    ? 'text-emerald-700 hover:bg-emerald-50'
                                    : 'text-amber-700 hover:bg-amber-50'
                                }`}
                                title={isVerified ? 'إلغاء التحقق' : 'تأكيد والتحقق'}
                              >
                                {isVerified ? (
                                  <RotateCcw className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                                ) : (
                                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                                )}
                              </button>
                              <button
                                onClick={() => openEditPayment(p)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="تعديل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('هل تريد حذف دفعة السداد هذه؟')) {
                                    deleteSupplierPayment(p.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredPayments.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300">
                      <td colSpan={3} className="py-2.5 px-4 text-right">
                        المجموع ({filteredPayments.length} حركة - {filteredPayments.filter(p => !!p.verified).length} محققة):
                      </td>
                      <td className="py-2.5 px-4 font-mono-num font-black text-sm">
                        {formatCurrency(filteredPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0), pharmacyProfile.currency)}
                      </td>
                      <td colSpan={4} className="py-2.5 px-4 no-print-action"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: SUPPLIERS MASTER DIRECTORY */}
      {activeSubTab === 'master' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(sup => {
              const totalPaidEver = supplierPayments
                .filter(p => p.supplierId === sup.id)
                .reduce((s, p) => s + (Number(p.amount) || 0), 0);

              const paidThisMonth = supplierPayments
                .filter(p => p.supplierId === sup.id && p.periodId === currentPeriod.id)
                .reduce((s, p) => s + (Number(p.amount) || 0), 0);

              return (
                <div key={sup.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-blue-600" />
                        {sup.name}
                      </h4>
                      {sup.representativeName && (
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>المندوب: {sup.representativeName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 no-print">
                      <button
                        onClick={() => openEditSupplier(sup)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="تعديل المورد"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف مورد "${sup.name}"؟`)) {
                            deleteSupplier(sup.id);
                          }
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="حذف المورد"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {sup.phone && (
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-mono-num">{sup.phone}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">مدفوع هذا الشهر</span>
                      <span className="font-bold font-mono-num text-slate-800">
                        {formatCurrency(paidThisMonth, pharmacyProfile.currency)}
                      </span>
                    </div>
                    <div className="bg-blue-50/60 p-2 rounded-lg">
                      <span className="text-[10px] text-blue-700 block">إجمالي المسدد</span>
                      <span className="font-bold font-mono-num text-blue-900">
                        {formatCurrency(totalPaidEver, pharmacyProfile.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between no-print">
                    <button
                      onClick={() => {
                        setSelectedSupplierForStatement(sup.id);
                        setActiveSubTab('statement');
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-blue-700 underline cursor-pointer"
                    >
                      كشف الحساب ←
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STATEMENT OF ACCOUNT */}
      {activeSubTab === 'statement' && (
        <div className="printable-table-container bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="no-print flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">اختر المورد:</label>
              <select
                value={selectedSupplierForStatement}
                onChange={(e) => setSelectedSupplierForStatement(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none text-sm font-bold bg-white"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {selectedSupplierForStatement && (
              <div className="text-xs text-slate-600">
                إجمالي المدفوعات المسجلة للمورد عبر كل الفترات:{' '}
                <strong className="text-slate-950 font-mono-num text-sm">
                  {formatCurrency(
                    supplierPayments
                      .filter(p => p.supplierId === selectedSupplierForStatement)
                      .reduce((s, p) => s + (Number(p.amount) || 0), 0),
                    pharmacyProfile.currency
                  )}
                </strong>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 print:bg-slate-100 print:text-black">
                  <th className="py-2.5 px-3">التحقق</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">الشهر / الفترة</th>
                  <th className="py-2.5 px-3">المبلغ المسدد</th>
                  <th className="py-2.5 px-3">طريقة الدفع</th>
                  <th className="py-2.5 px-3">رقم الفاتورة</th>
                  <th className="py-2.5 px-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {supplierPayments
                  .filter(p => p.supplierId === selectedSupplierForStatement)
                  .map(p => {
                    const isVerified = !!p.verified;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ تم التحقق
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ⏳ قيد المراجعة
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">{formatDateArabic(p.date)}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{p.periodId}</td>
                        <td className="py-2.5 px-3 font-bold font-mono-num text-blue-900 text-sm">
                          {formatCurrency(p.amount, pharmacyProfile.currency)}
                        </td>
                        <td className="py-2.5 px-3">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 font-mono-num">{p.invoiceNumber || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.notes || '-'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Modal (Create / Edit Master) */}
      {showSupplierModal && (
        <div className="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>{editingSupplierId ? 'تعديل بيانات المورد' : 'إضافة مورد / شركة جديدة'}</span>
            </h3>

            <form onSubmit={handleSupplierSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة / المورد:</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="مثال: شركة ابن سينا فارما"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المندوب المسؤول:</label>
                <input
                  type="text"
                  value={supRep}
                  onChange={(e) => setSupRep(e.target.value)}
                  placeholder="مثال: أ. سامح فؤاد"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل:</label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="مثال: 01001122334"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان / الفرع:</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="مثال: مخازن المنطقة الصناعية"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                <textarea
                  rows={2}
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  placeholder="شروط السداد، الخصم التجاري..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Signatures */}
      <PrintSignatures />

    </div>
  );
};

