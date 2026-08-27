import React, { useState } from 'react';
import { useTreasury } from '../context/TreasuryContext';
import { Customer } from '../types';
import { formatCurrency, formatNumber, formatDateArabic } from '../utils/formatters';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Smartphone,
  Share2,
  Users,
  AlertCircle,
  Phone,
  Home,
  CheckCircle2,
  ExternalLink,
  X,
  FileText
} from 'lucide-react';

interface CustomerDebtsWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtorsList: {
    customer: Customer;
    totalDebit: number;
    totalCredit: number;
    netDebt: number;
    lastDate?: string;
  }[];
}

export const CustomerDebtsWhatsAppModal: React.FC<CustomerDebtsWhatsAppModalProps> = ({
  isOpen,
  onClose,
  debtorsList
}) => {
  const { pharmacyProfile } = useTreasury();
  const [managerPhone, setManagerPhone] = useState<string>(
    pharmacyProfile.managerWhatsApp || pharmacyProfile.phone || '01012345678'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all_debtors' | 'over_limit'>('all_debtors');

  if (!isOpen) return null;

  const totalOutstanding = debtorsList.reduce((s, d) => s + d.netDebt, 0);

  const displayedList = filterType === 'over_limit'
    ? debtorsList.filter(d => d.customer.creditLimit && d.netDebt > d.customer.creditLimit)
    : debtorsList;

  const generateDebtsMessage = () => {
    const currency = pharmacyProfile.currency || 'ج.م';
    const todayFormatted = formatDateArabic(new Date().toISOString().split('T')[0]);
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    let msg = `*🏥 ${pharmacyProfile.name}*\n`;
    msg += `*📋 كشف صافي ديون العملاء والآجل المعلق*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 *تاريخ الاستخراج:* ${todayFormatted}\n`;
    msg += `⏰ *الوقت:* ${nowTime}\n`;
    msg += `👥 *إجمالي عدد العملاء المدينين:* ${debtorsList.length} عميل\n`;
    msg += `💰 *إجمالي صافي الديون المعلقة:* ${formatNumber(totalOutstanding)} ${currency}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `*تفاصيل صافي المديونية لكل عميل:*\n`;

    displayedList.forEach((d, idx) => {
      msg += `*${idx + 1}. ${d.customer.name}*\n`;
      if (d.customer.address) {
        msg += `   📍 العنوان: ${d.customer.address}\n`;
      }
      if (d.customer.phone) {
        msg += `   📞 الهاتف: ${d.customer.phone}\n`;
      }
      msg += `   💵 *صافي الدين: ${formatNumber(d.netDebt)} ${currency}*\n`;
      if (d.customer.creditLimit && d.netDebt > d.customer.creditLimit) {
        msg += `   ⚠️ _تجاوز الحد الائتماني (${formatNumber(d.customer.creditLimit)} ${currency})_\n`;
      }
      msg += `\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `_تم استخراج هذا التقرير آلياً عبر منظومة خزانة الصيدلية الذكية_ 🛡️`;

    return msg;
  };

  const handleCopy = () => {
    const text = generateDebtsMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToManager = (target: 'mobile' | 'web') => {
    const text = generateDebtsMessage();
    let cleanPhone = managerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    const encodedText = encodeURIComponent(text);
    const url = target === 'mobile'
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    window.open(url, '_blank');
  };

  const handleSendToSingleCustomer = (customer: Customer, netDebt: number) => {
    if (!customer.phone) {
      alert(`العميل "${customer.name}" لا يوجد له رقم هاتف مسجل في الدليل.`);
      return;
    }

    const currency = pharmacyProfile.currency || 'ج.م';
    const todayFormatted = formatDateArabic(new Date().toISOString().split('T')[0]);

    let cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '2' + cleanPhone;
    }

    const msg = `تحية طيبة لحضرتك من *${pharmacyProfile.name}* 🏥\n\nنود إحاطة سيادتكم بأن صافي رصيد الحساب الآجل طرفكم حتى تاريخ ${todayFormatted} هو:\n💰 *${formatNumber(netDebt)} ${currency}*\n\nشاكرين ومقدرين حسن تعاونكم الدائم معنا 🌹`;

    const encodedText = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-display">إرسال كشف صافي ديون العملاء عبر WhatsApp</h3>
              <p className="text-xs text-emerald-200">
                إشعار الإدارة بكافة العملاء الذين عليهم مديونيات معلقة ({debtorsList.length} عميل)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Stats Callout */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
              <div className="text-amber-800 font-bold text-[11px]">عدد العملاء المدينين</div>
              <div className="text-2xl font-black text-amber-950 font-mono-num mt-1">
                {debtorsList.length} <span className="text-xs font-normal">عميل</span>
              </div>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
              <div className="text-rose-800 font-bold text-[11px]">إجمالي صافي الديون المعلقة</div>
              <div className="text-2xl font-black text-rose-950 font-mono-num mt-1">
                {formatCurrency(totalOutstanding, pharmacyProfile.currency)}
              </div>
            </div>
          </div>

          {/* Target Phone Input */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              رقم واتساب الإدارة / المستلم:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="010xxxxxxxx"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono-num font-bold focus:border-emerald-600 focus:outline-none bg-white"
              />
              <span className="text-[11px] text-slate-500 font-semibold">
                (يمكن تغييره لأي رقم هاتف ترغب في إرسال التقرير إليه)
              </span>
            </div>
          </div>

          {/* WhatsApp Text Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">معاينة نص الرسالة المنسق للواتساب:</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم نسخ النص بنجاح!' : 'نسخ نص التقرير'}</span>
              </button>
            </div>
            <div className="p-4 bg-emerald-950/5 border border-emerald-800/20 rounded-2xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto select-all">
              {generateDebtsMessage()}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ التقرير'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendToManager('web')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="فتح واتساب ويب على الكمبيوتر"
            >
              <ExternalLink className="w-4 h-4 text-slate-300" />
              <span>WhatsApp Web</span>
            </button>

            <button
              onClick={() => handleSendToManager('mobile')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال فوري لواتساب الإدارة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
