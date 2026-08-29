import React, { useState, useRef } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency } from '../utils/formatters';
import {
  Database,
  Download,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldCheck,
  FileJson,
  History,
  Trash2,
  RefreshCw,
  Share2,
  FileText,
  CheckCircle2,
  Info,
  Lock,
  Sparkles,
  PlusCircle,
  Eye,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { BackupSnapshot } from '../types';
import { ExcelExportModal } from './ExcelExportModal';

export const BackupModule: React.FC = () => {
  const {
    pharmacyProfile,
    periods,
    currentPeriod,
    summary,
    incomeRecords,
    supplierPayments,
    expenses,
    walletTransactions,
    personalLedgers,
    customerDebts,
    employeeAdvances,
    downloadBackupFile,
    exportDataJson,
    importDataJson,
    inspectBackupJson,
    localSnapshots,
    createLocalSnapshot,
    restoreLocalSnapshot,
    deleteLocalSnapshot,
    clearAllSnapshots,
    lastBackupTime,
    resetToDefaults
  } = useTreasury();

  // Local state for copy notification
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [snapshotLabel, setSnapshotLabel] = useState<string>('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState<boolean>(false);

  // File import & inspection state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [inspectionResult, setInspectionResult] = useState<{
    isValid: boolean;
    error?: string;
    metadata?: any;
  } | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [pastedJson, setPastedJson] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState<boolean>(false);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);

  // Total operations count
  const totalOperations =
    incomeRecords.length +
    supplierPayments.length +
    expenses.length +
    walletTransactions.length +
    personalLedgers.length +
    customerDebts.length +
    employeeAdvances.length;

  // Approximate database size
  const rawJson = exportDataJson();
  const dbSizeBytes = new Blob([rawJson]).size;
  const dbSizeKb = (dbSizeBytes / 1024).toFixed(1);

  const showSuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    setActionErrorMessage(null);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  const showError = (msg: string) => {
    setActionErrorMessage(msg);
    setActionSuccessMessage(null);
    setTimeout(() => {
      setActionErrorMessage(null);
    }, 5000);
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      const json = exportDataJson();
      await navigator.clipboard.writeText(json);
      setIsCopied(true);
      showSuccess('تم نسخ كود النسخة الاحتياطية بالكامل للحافظة بنجاح');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      showError('تعذر النسخ التلقائي للحافظة، يرجى استخدام زر تنزيل الملف');
    }
  };

  // Trigger file download
  const handleDownloadBackup = () => {
    downloadBackupFile();
    showSuccess('تم تنزيل ملف النسخة الاحتياطية على جهازك بنجاح');
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedFileContent(content);
      const inspection = inspectBackupJson(content);
      setInspectionResult(inspection);
      if (!inspection.isValid) {
        showError(inspection.error || 'الملف المحدد غير صالح كنسخة احتياطية');
      }
    };
    reader.onerror = () => {
      showError('فشل قراءة الملف المحدد');
    };
    reader.readAsText(file);
    // Reset file input value so user can re-select same file if needed
    e.target.value = '';
  };

  // Handle pasted JSON inspection
  const handleInspectPastedJson = () => {
    if (!pastedJson.trim()) {
      showError('يرجى لصق نص النسخة الاحتياطية أولاً');
      return;
    }
    const inspection = inspectBackupJson(pastedJson);
    setInspectionResult(inspection);
    setSelectedFileName('كود يدوي ملصوق');
    setSelectedFileContent(pastedJson);
    setIsPasteModalOpen(false);
    if (!inspection.isValid) {
      showError(inspection.error || 'الكود الملصوق غير صالح');
    } else {
      showSuccess('تم التحقق من كود النسخة بنجاح! راجع التفاصيل أدناه قبل التأكيد');
    }
  };

  // Execute restore from file or paste
  const handleExecuteRestore = () => {
    if (!selectedFileContent) return;
    const success = importDataJson(selectedFileContent);
    if (success) {
      showSuccess('تم استرجاع البيانات بنجاح، وتم أخذ نقطة أمان احتياطية للتراجع');
      setSelectedFileContent(null);
      setSelectedFileName('');
      setInspectionResult(null);
      setIsConfirmingRestore(false);
    } else {
      showError('حدث خطأ أثناء استعادة البيانات، تأكد من صحة الملف');
    }
  };

  // Create manual snapshot
  const handleCreateSnapshot = () => {
    const label = snapshotLabel.trim() || `لقطة يدوية (${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})`;
    createLocalSnapshot(label, 'manual');
    setSnapshotLabel('');
    setIsCreatingSnapshot(false);
    showSuccess(`تم حفظ لقطة أمان محلية جديدة: "${label}"`);
  };

  // Restore snapshot with confirmation
  const handleRestoreSnapshot = (snap: BackupSnapshot) => {
    if (window.confirm(`هل أنت متأكد من استرجاع اللقطة المحفوظة بتاريخ (${new Date(snap.timestamp).toLocaleString('ar-EG')})؟ سيقوم النظام بحفظ نقطة أمان للبيانات الحالية قبل الاسترجاع.`)) {
      const ok = restoreLocalSnapshot(snap.id);
      if (ok) {
        showSuccess(`تم استرجاع اللقطة "${snap.label}" بنجاح`);
      } else {
        showError('تعذر استرجاع اللقطة المحددة');
      }
    }
  };

  // Share summary via WhatsApp
  const handleShareWhatsApp = () => {
    const dateStr = new Date().toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const text = `*تقرير النسخ الاحتياطي وحفظ البيانات* 🛡️
صيدلية: ${pharmacyProfile.name}
التاريخ: ${dateStr}
الدورة الحالية: ${currentPeriod.name}
-----------------------------
📊 *إحصائيات الحركات المحفوظة:*
- إجمالي العمليات المسجلة: ${totalOperations} حركة
- حركات الدخل: ${incomeRecords.length}
- سداد الشركات والموردين: ${supplierPayments.length}
- المصروفات والنثريات: ${expenses.length}
- عمليات المحفظة والإنستاباي: ${walletTransactions.length}
- الشهور المالية المحفوظة: ${periods.length} دورة
-----------------------------
💰 *الرصيد النقدي الحالي:*
- النقدية المتوقعة بالخزينة: ${formatCurrency(summary.expectedCash)}
- صافي الخزانة للشهر: ${formatCurrency(summary.netTreasury)}
-----------------------------
🔒 تم أخذ وتوثيق نسخة احتياطية آمنة في النظام.`;

    const encoded = encodeURIComponent(text);
    const targetPhone = pharmacyProfile.phone ? pharmacyProfile.phone.replace(/[^0-9]/g, '') : '';
    const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const getReasonBadge = (reason: BackupSnapshot['reason']) => {
    switch (reason) {
      case 'pre_restore':
        return {
          label: 'نقطة أمان قبل استرجاع',
          cls: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      case 'auto':
        return {
          label: 'تلقائي من النظام',
          cls: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'period_close':
        return {
          label: 'إقفال شهر مالي',
          cls: 'bg-purple-100 text-purple-800 border-purple-300'
        };
      case 'manual':
      default:
        return {
          label: 'لقطة يدوية',
          cls: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Toast Notification Messages */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{actionErrorMessage}</span>
          </div>
          <button
            onClick={() => setActionErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HERO STATUS BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 shadow-md border border-slate-700">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>نظام حماية وسلامة بيانات الخزانة نشط 100%</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              النسخ الاحتياطي واستعادة البيانات
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              كافة حسابات صيدلية <span className="text-white font-bold">{pharmacyProfile.name}</span> مخزنة ومحمية محلياً في متصفحك. يمكنك تنزيل نسخة احتياطية كاملة إلى جهازك في أي لحظة أو استعادتها بكل أمان.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] text-slate-300 font-medium">إجمالي الحركات</span>
              <span className="text-lg sm:text-xl font-black text-white mt-1">
                {totalOperations.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-400">حركة</span>
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] text-slate-300 font-medium">الفترات والشهور</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
                {periods.length} <span className="text-xs font-normal text-slate-400">دورات</span>
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] text-slate-300 font-medium">حجم البيانات</span>
              <span className="text-lg sm:text-xl font-black text-teal-300 mt-1">
                {dbSizeKb} <span className="text-xs font-normal text-slate-400">KB</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status ticker at bottom of hero */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              آخر تصدير خارجي:{' '}
              {lastBackupTime ? new Date(lastBackupTime).toLocaleString('ar-EG') : 'لم يتم التصدير اليوم بعد'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>نظام تخزين محلي غير معتمد على خوادم خارجية (Offline-Ready)</span>
          </div>
        </div>
      </div>

      {/* MAIN TWO ACTION COLUMNS: EXPORT vs RESTORE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUMN 1: EXPORT & DOWNLOAD */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">تصدير وتنزيل نسخة احتياطية</h2>
                  <p className="text-xs text-slate-500">حفظ كافة البيانات والحسابات في ملف مستقل بجهازك</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                JSON كامل
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              تتضمن النسخة المصدرة كافة الدفاتر المحاسبية: الدخل اليومي، سداد الموردين، المصروفات، معاملات المحفظة والإنستاباي، مسحوبات الشركاء، ديون العملاء، سلف الموظفين، وإعدادات الصيدلية وصلاحيات المستخدمين.
            </p>

            {/* Main Action Buttons */}
            <div className="space-y-3">
              <button
                id="btn-download-full-backup"
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-5 h-5 shrink-0" />
                <span>تنزيل ملف النسخة الاحتياطية الآن (.JSON)</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  id="btn-copy-backup-json"
                  onClick={handleCopyJson}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{isCopied ? 'تم النسخ بنجاح!' : 'نسخ الكود للحافظة'}</span>
                </button>

                <button
                  id="btn-share-backup-whatsapp"
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span>مشاركة الملخص لواتساب</span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup Information Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>محتويات ملف النسخة الاحتياطية:</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px] text-slate-600 pt-1">
              <div>• {incomeRecords.length} سجل دخل وورديات</div>
              <div>• {supplierPayments.length} سداد للشركات</div>
              <div>• {expenses.length} مصروف ونثرية</div>
              <div>• {walletTransactions.length} حركة محفظة وإنستاباي</div>
              <div>• {customerDebts.length} حركة ديون عملاء</div>
              <div>• {employeeAdvances.length} حركة سلف موظفين</div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: RESTORE & IMPORT */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">استرجاع واستيراد نسخة سابقة</h2>
                  <p className="text-xs text-slate-500">استعادة البيانات من ملف محفوظ مع معاينة ذكية مسبقة</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                معاينة آمنة
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              يمكنك رفع ملف نسخة احتياطية سبق تنزيله. يقوم النظام أولاً بفحص الملف وعرض تفاصيله (اسم الصيدلية، تاريخ النسخة، عدد العمليات) قبل التطبيق، ويقوم بحفظ نقطة أمان تلقائية للبيانات الحالية لضمان إمكانية التراجع.
            </p>

            {/* Upload or Paste Options */}
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                id="btn-select-restore-file"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Upload className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>اختيار ملف نسخة احتياطية للاسترجاع (.JSON)</span>
              </button>

              <button
                id="btn-open-paste-json-modal"
                onClick={() => setIsPasteModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>أو لصق كود النسخة الاحتياطية كنص</span>
              </button>
            </div>
          </div>

          {/* INSPECTION PREVIEW MODAL / CARD */}
          {inspectionResult && inspectionResult.isValid && inspectionResult.metadata && (
            <div className="p-4.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-blue-200 pb-2">
                <div className="font-bold text-blue-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>معاينة محتويات الملف قبل الاسترجاع</span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  {selectedFileName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-blue-100">
                  <span className="text-slate-500 block text-[10px]">الصيدلية</span>
                  <span className="font-bold text-slate-900">{inspectionResult.metadata.pharmacyName}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-blue-100">
                  <span className="text-slate-500 block text-[10px]">تاريخ النسخة</span>
                  <span className="font-bold text-slate-900">
                    {inspectionResult.metadata.exportedAt ? new Date(inspectionResult.metadata.exportedAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-blue-100">
                  <span className="text-slate-500 block text-[10px]">إجمالي الحركات</span>
                  <span className="font-bold text-emerald-700">{inspectionResult.metadata.totalRecords} حركة</span>
                </div>
              </div>

              <div className="text-[11px] text-blue-950 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>تأكيد آمن:</strong> سيتم أخذ نقطة أمان تلقائية لبياناتك الحالية قبل تطبيق هذا الملف، حتى تتمكن من التراجع في أي وقت إذا رغبت.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-confirm-restore-file"
                  onClick={handleExecuteRestore}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد واستعادة البيانات الآن</span>
                </button>
                <button
                  onClick={() => {
                    setInspectionResult(null);
                    setSelectedFileContent(null);
                    setSelectedFileName('');
                  }}
                  className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Safety Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              استعادة النسخة تؤدي إلى تحديث بيانات الخزانة بالملف المرفوع. بفضل نظام نقاط الأمان التلقائي، يمكنك دائماً الرجوع للبيانات السابقة من قسم "لقطات الأمان المحلية" أدناه.
            </p>
          </div>
        </div>

      </div>

      {/* SECTION 2.5: FORMATTED EXCEL EXPORT (.XLSX) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير محاسبي مخصص • Microsoft Excel (.xlsx)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            تصدير تقارير وبيانات الخزانة إلى ملفات Excel منسقة
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            توليد شيتات Excel مستقلة ومنظمة بعناية (الملخص المالي، تسليمات الشفتات، سداد الشركات، المصروفات، المحافظ والإنستاباي، والذمم) مع دعم تخصيص الفترة وتحديد الشيتات المرغوبة.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            id="btn-open-excel-customizer"
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تخصيص وتصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Excel Customization Modal */}
      <ExcelExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />

      {/* SECTION 3: LOCAL AUTOMATIC & MANUAL SNAPSHOTS TIMELINE */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                لقطات الأمان والاستعادة المحلية (Local Snapshots)
              </h3>
              <p className="text-xs text-slate-500">
                نقاط استعادة تلقائية ويدوية محفوظة في متصفحك للتراجع السريع بنقرة واحدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCreatingSnapshot ? (
              <button
                id="btn-new-local-snapshot"
                onClick={() => setIsCreatingSnapshot(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنشاء نقطة استعادة فورية</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <input
                  type="text"
                  placeholder="اسم أو سبب اللقطة (اختياري)..."
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:border-purple-500 w-48 sm:w-60"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSnapshot()}
                  autoFocus
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 cursor-pointer"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setIsCreatingSnapshot(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Snapshots Table / List */}
        {localSnapshots.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">لا توجد لقطات أمان محلية مسجلة بعد</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              يتم إنشاء اللقطات تلقائياً عند إجراء تصدير أو قبل استرجاع نسخة، ويمكنك إنشاء لقطة يدوية الآن.
            </p>
            <button
              onClick={() => handleCreateSnapshot()}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              إنشاء أول لقطة أمان الآن
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
            {localSnapshots.map((snap) => {
              const badge = getReasonBadge(snap.reason);
              const dateObj = new Date(snap.timestamp);
              const dateStr = dateObj.toLocaleDateString('ar-EG');
              const timeStr = dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div
                  key={snap.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-mono text-xs">
                      <FileJson className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">{snap.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {timeStr}
                        </span>
                        <span>• {snap.recordsCount} حركة</span>
                        {snap.sizeBytes && <span>• {(snap.sizeBytes / 1024).toFixed(1)} KB</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="استرجاع هذه النقطة الزمنية"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>استرجاع هذه النقطة</span>
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([snap.dataJson], { type: 'application/json;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `لقطة_${snap.label.replace(/\s+/g, '_')}_${dateStr}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                      title="تنزيل اللقطة كملف"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف لقطة الأمان هذه؟')) {
                          deleteLocalSnapshot(snap.id);
                          showSuccess('تم حذف لقطة الأمان');
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                      title="حذف هذه اللقطة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: SAFETY BEST PRACTICES FOR PHARMACIES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">أسبوعياً: فلاشة USB أو Drive</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              يُنصح بتنزيل ملف النسخة كل يوم جمعة أو نهاية كل شهر مالي ووضعه على فلاشة USB خارجية أو Google Drive الخاص بالصيدلية لضمان الحماية الدائمة.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">نقل الحسابات لجهاز آخر</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              إذا أردت نقل حسابات الخزانة من جهاز الكمبيوتر إلى الموبايل أو العكس، فقط قم بتنزيل ملف النسخة هنا، ثم افتح النظام على الجهاز الآخر واضغط "استرجاع نسخة".
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">سرية البيانات وخصوصيتها</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              بياناتك وأرقام خزينتك سرية تماماً ولا تغادر جهازك أبداً؛ حيث تعتمد المنظومة على التخزين المحلي الآمن داخل المتصفح دون إرسالها لخوادم خارجية.
            </p>
          </div>
        </div>
      </div>

      {/* PASTE JSON MODAL */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>لصق كود النسخة الاحتياطية (JSON)</span>
              </h3>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              الصق نص أو كود ملف النسخة الاحتياطية في المربع أدناه للتحقق منه ومعاينته قبل الاستعادة:
            </p>

            <textarea
              rows={8}
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              placeholder='{"appName": "Pharmacy Treasury App", ...}'
              className="w-full p-3 font-mono text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleInspectPastedJson}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                فحص ومعاينة الكود
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
