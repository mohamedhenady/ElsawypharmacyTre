import React, { useState } from 'react';
import { Printer, Eye, FileSpreadsheet } from 'lucide-react';
import { PrintPreviewModal } from './PrintPreviewModal';

export interface PreparePrintButtonProps {
  label?: string;
  title?: string;
  subtitle?: string;
  summaryStats?: { label: string; value: string | number }[];
  contentHtml?: string;
  renderPreviewContent?: () => React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'dark';
}

export const PreparePrintButton: React.FC<PreparePrintButtonProps> = ({
  label = 'تجهيز للطباعة',
  title = 'تقرير مالي',
  subtitle,
  summaryStats,
  contentHtml,
  renderPreviewContent,
  onClick,
  className = '',
  variant = 'dark'
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [capturedHtml, setCapturedHtml] = useState<string>('');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
      return;
    }

    // Capture the nearest table or report container for preview if no custom renderer is passed
    if (!renderPreviewContent && !contentHtml) {
      const container = document.querySelector('.printable-table-container, .printable-report, main table');
      if (container) {
        const clone = container.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.no-print, .no-print-action, button, input, select').forEach(el => el.remove());
        setCapturedHtml(clone.innerHTML);
      }
    }

    setIsPreviewOpen(true);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs';
      case 'secondary':
        return 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs';
      case 'dark':
      default:
        return 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs';
    }
  };

  return (
    <>
      <button
        id="btn-prepare-print"
        type="button"
        onClick={handleClick}
        title="تجهيز ومعاينة التقرير للطباعة على ورق A4 أو الحفظ كـ PDF"
        className={`no-print inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 ${getVariantStyles()} ${className}`}
      >
        <Printer className="w-4 h-4 text-emerald-400" />
        <span>{label}</span>
      </button>

      {/* Print Preview & Preparation Studio Modal */}
      {isPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={title}
          subtitle={subtitle}
          summaryStats={summaryStats}
          contentHtml={contentHtml || capturedHtml}
        >
          {renderPreviewContent ? renderPreviewContent() : undefined}
        </PrintPreviewModal>
      )}
    </>
  );
};
