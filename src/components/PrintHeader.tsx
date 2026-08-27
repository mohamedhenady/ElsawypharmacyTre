import React from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { formatDateArabic } from '../utils/formatters';

interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  periodName?: string;
  summaryStats?: { label: string; value: string | number }[];
}

export const PrintHeader: React.FC<PrintHeaderProps> = ({
  title,
  subtitle,
  periodName,
  summaryStats
}) => {
  const { pharmacyProfile, currentPeriod, currentUser } = useTreasury();
  const effectivePeriodName = periodName || currentPeriod.name;
  const printDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const printTime = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="print-only mb-6 border-b-2 border-slate-900 pb-4 text-right">
      {/* Top Pharmacy Information */}
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

        {/* Report Metadata Box */}
        <div className="text-left border-r-2 border-slate-300 pr-4">
          <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black">
            {title}
          </div>
          {subtitle && <div className="text-xs font-bold text-slate-700 mt-1">{subtitle}</div>}
          <div className="text-xs text-slate-700 font-semibold mt-1">
            الفترة المحاسبية: <strong className="text-slate-950">{effectivePeriodName}</strong>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            تاريخ الطباعة: {printDate} ({printTime}) | المستخدم: {currentUser.name}
          </div>
        </div>
      </div>

      {/* Summary Badges if provided */}
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
  );
};

export const PrintSignatures: React.FC = () => {
  return (
    <div className="print-only mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
      <div>
        <div className="font-bold">المحاسب المسؤول</div>
        <div className="h-10"></div>
        <div className="text-[10px] text-slate-500">التوقيع: .....................</div>
      </div>

      <div>
        <div className="font-bold">الصيدلي / الكاشير</div>
        <div className="h-10"></div>
        <div className="text-[10px] text-slate-500">التوقيع: .....................</div>
      </div>

      <div>
        <div className="font-bold">اعتماد الإدارة / الشريك</div>
        <div className="h-10"></div>
        <div className="text-[10px] text-slate-500">التوقيع: .....................</div>
      </div>
    </div>
  );
};
