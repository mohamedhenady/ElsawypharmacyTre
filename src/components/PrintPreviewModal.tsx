import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import {
  Printer,
  ExternalLink,
  Download,
  X,
  FileText,
  Sliders,
  Check,
  Building,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  PrintDocumentData,
  buildPrintableHtmlDocument,
  openPrintWindow,
  downloadPrintableHtml
} from '../utils/printHelper';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  summaryStats?: { label: string; value: string | number }[];
  contentHtml?: string;
  children?: React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  summaryStats,
  contentHtml,
  children
}) => {
  const { pharmacyProfile, currentPeriod, currentUser } = useTreasury();

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fontSize, setFontSize] = useState<'compact' | 'normal' | 'large'>('normal');
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const getEffectiveHtml = (): string => {
    if (contentHtml) return contentHtml;
    // Attempt to extract from DOM if available
    const tableContainer = document.querySelector('.printable-table-container, .printable-report');
    if (tableContainer) {
      const cloned = tableContainer.cloneNode(true) as HTMLElement;
      // remove no-print items
      cloned.querySelectorAll('.no-print, .no-print-action, button, input, select').forEach(el => el.remove());
      return cloned.innerHTML;
    }
    return '';
  };

  const getDocData = (): PrintDocumentData => {
    return {
      title,
      subtitle,
      periodName: currentPeriod.name,
      pharmacyName: pharmacyProfile.name || 'صيدلية النور والشفاء',
      pharmacySlogan: pharmacyProfile.slogan,
      pharmacyPhone: pharmacyProfile.phone,
      pharmacyAddress: pharmacyProfile.address,
      pharmacyLogoUrl: pharmacyProfile.logoUrl,
      userName: currentUser.name,
      summaryStats,
      contentHtml: getEffectiveHtml(),
      customNotes,
      showHeader,
      showSignatures,
      orientation,
      fontSize
    };
  };

  const handleDirectPrint = () => {
    setIsPrinting(true);
    // Safe multi-step printing
    try {
      // First try standard window.print()
      window.focus();
      window.print();
    } catch (e) {
      console.warn('Direct print failed, switching to standalone print window:', e);
      openPrintWindow(getDocData());
    } finally {
      setTimeout(() => setIsPrinting(false), 500);
    }
  };

  const handleOpenStandalone = () => {
    openPrintWindow(getDocData());
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml(getDocData());
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm overflow-hidden animate-in fade-in">
      
      {/* Top Modal Header Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0 shadow-lg no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                استوديو تجهيز ومعاينة الطباعة
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                A4 جاهز
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {title} • {pharmacyProfile.name} ({currentPeriod.name})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showSettings
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="تخصيص الخيارات"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خيارات التقرير</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHtml}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تنزيل كملف للطباعة والأرشفة"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">تنزيل التقرير</span>
          </button>

          <button
            type="button"
            onClick={handleOpenStandalone}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="فتح في نافذة مستقلة للطباعة المباشرة بأعلى جودة"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>نافذة طباعة مستقلة</span>
          </button>

          <button
            type="button"
            onClick={handleDirectPrint}
            disabled={isPrinting}
            className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            title="إرسال أمر الطباعة للمتصفح الآن"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>طباعة فورية</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer mr-1"
            title="إغلاق المعاينة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional Customize Drawer */}
      {showSettings && (
        <div className="bg-slate-800 text-white border-b border-slate-700 px-4 sm:px-6 py-3 animate-in slide-in-from-top-2 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-6xl mx-auto text-xs">
            
            {/* Page Orientation */}
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">اتجاه الصفحة على الورق:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                    orientation === 'portrait'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  عمودي (Portrait)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                    orientation === 'landscape'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  عرضي (Landscape)
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">حجم الخط للورق:</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setFontSize('compact')}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                    fontSize === 'compact'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  مضغوط
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('normal')}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                    fontSize === 'normal'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  قياسي
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg font-bold transition-colors cursor-pointer text-center ${
                    fontSize === 'large'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  كبير
                </button>
              </div>
            </div>

            {/* Element Toggles */}
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">عناصر المستند:</label>
              <div className="flex gap-3 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>الترويسة الرسمية</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) => setShowSignatures(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>خانات التوقيع</span>
                </label>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">ملاحظة ختامية بالتقرير:</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="أضف ملاحظة أو توجيه يظهر أسفل المطبوعة..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>
        </div>
      )}

      {/* Main Preview Work Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950/40">
        
        {/* The Simulated A4 Paper Sheet */}
        <div
          id="printable-a4-sheet"
          className={`bg-white text-slate-900 shadow-2xl rounded-sm transition-all duration-300 my-auto ${
            orientation === 'landscape'
              ? 'w-full max-w-[297mm] min-h-[210mm] p-6 sm:p-10'
              : 'w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-12'
          }`}
          style={{
            fontSize: fontSize === 'compact' ? '9pt' : fontSize === 'large' ? '12pt' : '10.5pt'
          }}
        >
          
          {/* Header */}
          {showHeader && (
            <div className="border-b-2 border-slate-900 pb-4 mb-5 text-right">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {pharmacyProfile.logoUrl ? (
                    <img
                      src={pharmacyProfile.logoUrl}
                      alt={pharmacyProfile.name}
                      className="w-14 h-14 object-contain rounded-lg border border-slate-300 p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-black text-xl border border-emerald-900">
                      {pharmacyProfile.name.charAt(0) || 'ص'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-black text-slate-950 tracking-tight">
                      {pharmacyProfile.name || 'صيدلية النور والشفاء'}
                    </h1>
                    {pharmacyProfile.slogan && (
                      <p className="text-xs text-emerald-800 font-bold mt-0.5">{pharmacyProfile.slogan}</p>
                    )}
                    <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-x-4">
                      {pharmacyProfile.address && <span>📍 {pharmacyProfile.address}</span>}
                      {pharmacyProfile.phone && <span>📞 {pharmacyProfile.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-left border-r-2 border-slate-300 pr-4">
                  <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black">
                    {title}
                  </div>
                  {subtitle && <div className="text-xs font-bold text-slate-700 mt-1">{subtitle}</div>}
                  <div className="text-xs text-slate-700 font-semibold mt-1">
                    الفترة المحاسبية: <strong className="text-slate-950">{currentPeriod.name}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    تاريخ الطباعة: {currentDate} ({currentTime}) | المستخدم: {currentUser.name}
                  </div>
                </div>
              </div>

              {/* Summary Stats Grid */}
              {summaryStats && summaryStats.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {summaryStats.map((stat, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-300 text-center">
                      <div className="text-[10px] font-bold text-slate-600">{stat.label}</div>
                      <div className="text-xs font-black text-slate-950 font-mono-num mt-0.5">{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Report Body / Content */}
          <div className="space-y-4 printable-content-body">
            {children ? (
              children
            ) : contentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                جاري تجهيز وعرض بيانات التقرير...
              </div>
            )}
          </div>

          {/* Custom Notes */}
          {customNotes && (
            <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800">
              <strong className="block text-slate-900 font-bold mb-1">ملاحظات التقرير:</strong>
              <p className="whitespace-pre-line">{customNotes}</p>
            </div>
          )}

          {/* Signatures */}
          {showSignatures && (
            <div className="mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
              <div>
                <div className="font-bold">المحاسب المسؤول</div>
                <div className="h-10"></div>
                <div className="text-[10px] text-slate-500">التوقيع: .....................</div>
              </div>
              <div>
                <div className="font-bold">الصيدلي / أمين الخزينة</div>
                <div className="h-10"></div>
                <div className="text-[10px] text-slate-500">التوقيع: .....................</div>
              </div>
              <div>
                <div className="font-bold">اعتماد الإدارة / الشريك</div>
                <div className="h-10"></div>
                <div className="text-[10px] text-slate-500">التوقيع: .....................</div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
