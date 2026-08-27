import { formatCurrency, formatDateArabic } from './formatters';

export interface PrintDocumentData {
  title: string;
  subtitle?: string;
  periodName: string;
  pharmacyName: string;
  pharmacySlogan?: string;
  pharmacyPhone?: string;
  pharmacyAddress?: string;
  pharmacyLogoUrl?: string;
  userName?: string;
  summaryStats?: { label: string; value: string | number }[];
  contentHtml: string;
  customNotes?: string;
  showSignatures?: boolean;
  showHeader?: boolean;
  orientation?: 'portrait' | 'landscape';
  fontSize?: 'compact' | 'normal' | 'large';
}

/**
 * Builds a standalone, self-contained HTML string ready for printing
 */
export function buildPrintableHtmlDocument(data: PrintDocumentData): string {
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const fontSizes = {
    compact: '9pt',
    normal: '10.5pt',
    large: '12pt'
  };

  const currentFontSize = fontSizes[data.fontSize || 'normal'];
  const isLandscape = data.orientation === 'landscape';

  const statsHtml = data.summaryStats && data.summaryStats.length > 0
    ? `
      <div class="stats-grid">
        ${data.summaryStats.map(s => `
          <div class="stat-box">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value font-mono">${s.value}</div>
          </div>
        `).join('')}
      </div>
    `
    : '';

  const signaturesHtml = data.showSignatures !== false
    ? `
      <div class="signatures-grid">
        <div class="sig-col">
          <div class="sig-title">المحاسب المسؤول</div>
          <div class="sig-space"></div>
          <div class="sig-line">التوقيع: .....................</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">الصيدلي / أمين الخزينة</div>
          <div class="sig-space"></div>
          <div class="sig-line">التوقيع: .....................</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">اعتماد الإدارة / الشريك</div>
          <div class="sig-space"></div>
          <div class="sig-line">التوقيع: .....................</div>
        </div>
      </div>
    `
    : '';

  const notesHtml = data.customNotes
    ? `
      <div class="notes-box">
        <strong>ملاحظات التقرير:</strong>
        <p>${data.customNotes.replace(/\n/g, '<br/>')}</p>
      </div>
    `
    : '';

  const headerHtml = data.showHeader !== false
    ? `
      <header class="doc-header">
        <div class="pharmacy-info">
          ${data.pharmacyLogoUrl 
            ? `<img src="${data.pharmacyLogoUrl}" alt="Logo" class="pharmacy-logo" />` 
            : `<div class="pharmacy-badge">${(data.pharmacyName || 'ص').charAt(0)}</div>`
          }
          <div>
            <h1 class="pharmacy-name">${data.pharmacyName || 'صيدلية النور والشفاء'}</h1>
            ${data.pharmacySlogan ? `<p class="pharmacy-slogan">${data.pharmacySlogan}</p>` : ''}
            <div class="pharmacy-meta">
              ${data.pharmacyAddress ? `<span>📍 ${data.pharmacyAddress}</span>` : ''}
              ${data.pharmacyPhone ? `<span>📞 ${data.pharmacyPhone}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="report-meta">
          <div class="report-title-badge">${data.title}</div>
          ${data.subtitle ? `<div class="report-subtitle">${data.subtitle}</div>` : ''}
          <div class="report-period">الفترة: <strong>${data.periodName}</strong></div>
          <div class="report-time">تاريخ الطباعة: ${currentDate} (${currentTime})</div>
          ${data.userName ? `<div class="report-user">المستخدم: ${data.userName}</div>` : ''}
        </div>
      </header>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - ${data.pharmacyName || 'التقرير المالي'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');
    
    @page {
      size: A4 ${isLandscape ? 'landscape' : 'portrait'};
      margin: 10mm 10mm 12mm 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      font-size: ${currentFontSize};
      line-height: 1.45;
      padding: 15px;
      direction: rtl;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace;
      font-variant-numeric: tabular-nums;
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 15px;
      gap: 15px;
    }

    .pharmacy-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pharmacy-logo {
      width: 55px;
      height: 55px;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      padding: 2px;
    }

    .pharmacy-badge {
      width: 48px;
      height: 48px;
      background-color: #065f46;
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
    }

    .pharmacy-name {
      font-size: 16pt;
      font-weight: 900;
      color: #020617;
      line-height: 1.2;
    }

    .pharmacy-slogan {
      font-size: 8.5pt;
      font-weight: 700;
      color: #047857;
      margin-top: 2px;
    }

    .pharmacy-meta {
      font-size: 8pt;
      color: #475569;
      margin-top: 3px;
      display: flex;
      gap: 12px;
    }

    .report-meta {
      text-align: left;
      border-right: 2px solid #cbd5e1;
      padding-right: 12px;
      min-width: 200px;
    }

    .report-title-badge {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 9.5pt;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .report-subtitle {
      font-size: 8.5pt;
      font-weight: 700;
      color: #334155;
    }

    .report-period {
      font-size: 8.5pt;
      color: #1e293b;
      margin-top: 2px;
    }

    .report-time, .report-user {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 1px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
      margin-bottom: 15px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
    }

    .stat-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }

    .stat-label {
      font-size: 8pt;
      font-weight: 700;
      color: #475569;
    }

    .stat-value {
      font-size: 10.5pt;
      font-weight: 800;
      color: #020617;
      margin-top: 2px;
    }

    .content-area {
      margin-top: 10px;
      margin-bottom: 15px;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: ${currentFontSize};
      margin-top: 6px;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    thead {
      display: table-header-group;
    }

    th, td {
      border: 1px solid #94a3b8 !important;
      padding: 6px 8px !important;
      text-align: right;
    }

    th {
      background-color: #f1f5f9 !important;
      font-weight: 800 !important;
      color: #0f172a !important;
    }

    tfoot tr {
      background-color: #e2e8f0 !important;
      font-weight: 800 !important;
    }

    .notes-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 8.5pt;
      margin-top: 15px;
      margin-bottom: 15px;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1.5px solid #94a3b8;
      text-align: center;
      page-break-inside: avoid;
    }

    .sig-title {
      font-weight: 800;
      font-size: 9pt;
      color: #0f172a;
    }

    .sig-space {
      height: 35px;
    }

    .sig-line {
      font-size: 8pt;
      color: #64748b;
    }

    /* Screen preview toolbar when viewed standalone */
    @media screen {
      body {
        background-color: #f1f5f9;
        padding: 20px;
      }
      .page-wrapper {
        max-width: ${isLandscape ? '297mm' : '210mm'};
        margin: 0 auto;
        background: #ffffff;
        padding: 20mm 15mm;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        border-radius: 4px;
      }
      .print-actions-bar {
        max-width: ${isLandscape ? '297mm' : '210mm'};
        margin: 0 auto 15px auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #0f172a;
        color: #ffffff;
        padding: 10px 16px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .btn-print {
        background: #059669;
        color: #ffffff;
        border: none;
        padding: 8px 18px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 13px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .btn-close {
        background: #334155;
        color: #ffffff;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 13px;
        cursor: pointer;
      }
    }

    @media print {
      .print-actions-bar {
        display: none !important;
      }
      body {
        padding: 0 !important;
        background: #ffffff !important;
      }
      .page-wrapper {
        padding: 0 !important;
        box-shadow: none !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions-bar no-print">
    <div>
      <span style="font-weight: 800; font-size: 14px;">🖨️ تجهيز التقرير للطباعة</span>
      <span style="color: #94a3b8; font-size: 11px; margin-right: 8px;">(${data.title})</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        <span>إرسال للطباعة الآن</span>
      </button>
      <button class="btn-close" onclick="window.close()">
        <span>إغلاق النافذة</span>
      </button>
    </div>
  </div>

  <div class="page-wrapper">
    ${headerHtml}
    ${statsHtml}
    <div class="content-area">
      ${data.contentHtml}
    </div>
    ${notesHtml}
    ${signaturesHtml}
  </div>

  <script>
    // Auto-trigger print if loaded directly in a new window
    window.addEventListener('load', function() {
      setTimeout(function() {
        // give browser a moment to render fonts
      }, 300);
    });
  </script>
</body>
</html>`;
}

/**
 * Opens a dedicated printable window and invokes printing reliably
 */
export function openPrintWindow(data: PrintDocumentData): boolean {
  try {
    const html = buildPrintableHtmlDocument(data);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Popups might be blocked, fallback to blob URL or direct print
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.target = '_blank';
      tempLink.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return true;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Focus and suggest printing
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (err) {
        console.warn('Auto-print error on new window, user can click print button in document:', err);
      }
    }, 500);

    return true;
  } catch (error) {
    console.error('Failed to open print window:', error);
    // Fallback: direct window print
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Downloads the formatted report as a standalone HTML file
 */
export function downloadPrintableHtml(data: PrintDocumentData, filename?: string): void {
  const html = buildPrintableHtmlDocument(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cleanTitle = data.title.replace(/[\/\\?%*:|"<>]/g, '-');
  a.href = url;
  a.download = filename || `${cleanTitle}_${data.periodName}_تقرير.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
