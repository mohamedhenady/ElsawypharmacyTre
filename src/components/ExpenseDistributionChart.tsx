import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Sector
} from 'recharts';
import { useTreasury } from '../context/TreasuryContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  Receipt,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';

interface ExpenseSliceData {
  id: string;
  name: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
}

// Sophisticated, distinct color palette for financial categories
const CHART_COLORS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#dc2626', // Rose
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#be185d', // Pink
  '#64748b'  // Slate
];

interface ExpenseDistributionChartProps {
  periodId?: string;
  className?: string;
}

// Custom active shape for the Donut hover state
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 drop-shadow-md"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 9}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

export const ExpenseDistributionChart: React.FC<ExpenseDistributionChartProps> = ({
  periodId,
  className = ''
}) => {
  const {
    currentPeriod,
    expenses,
    expenseCategories,
    pharmacyProfile
  } = useTreasury();

  const activePeriodId = periodId || currentPeriod.id;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Compute expenses data by category
  const { chartData, totalExpenses, topCategory, totalRecordsCount } = useMemo(() => {
    const periodExpenses = expenses.filter(e => e.periodId === activePeriodId);
    const total = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const categoryMap: { [key: string]: { name: string; amount: number; count: number } } = {};

    // Initialize with known categories
    expenseCategories.forEach(cat => {
      categoryMap[cat.id] = { name: cat.name, amount: 0, count: 0 };
    });

    // Populate data
    periodExpenses.forEach(exp => {
      const catId = exp.categoryId || 'other';
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          name: expenseCategories.find(c => c.id === catId)?.name || 'أخرى / غير مصنف',
          amount: 0,
          count: 0
        };
      }
      categoryMap[catId].amount += Number(exp.amount) || 0;
      categoryMap[catId].count += 1;
    });

    // Filter categories with amounts > 0 and sort descending
    const data: ExpenseSliceData[] = Object.entries(categoryMap)
      .filter(([_, cat]) => cat.amount > 0)
      .map(([id, cat], index) => ({
        id,
        name: cat.name,
        value: cat.amount,
        count: cat.count,
        percentage: total > 0 ? (cat.amount / total) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const top = data.length > 0 ? data[0] : null;

    return {
      chartData: data,
      totalExpenses: total,
      topCategory: top,
      totalRecordsCount: periodExpenses.length
    };
  }, [expenses, expenseCategories, activePeriodId]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Custom interactive Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ExpenseSliceData = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[170px] z-50">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-700">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-slate-100">{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-400">المبلغ:</span>
              <span className="font-mono-num font-black text-emerald-400 text-sm">
                {formatCurrency(data.value, pharmacyProfile.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-400">النسبة المئوية:</span>
              <span className="font-mono-num font-bold text-amber-300">
                {data.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-400">عدد العمليات:</span>
              <span className="font-mono-num text-slate-300">
                {data.count} عملية
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={`p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
          <Receipt className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-slate-700">لا توجد مصروفات مسجلة في هذه الدورة حتى الآن</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">
          عند إضافة أي مصروفات أو نثريات ستظهر إحصائيات التوزيع البياني الدائري هنا تلقائياً.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              توزيع المصروفات التشغيلية والنثريات حسب التصنيف
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 mr-10">
            رسم بياني دائري (Donut Chart) يوضح نسب وأحجام بنود الصرف المختلفة
          </p>
        </div>

        {/* Quick Highlights */}
        {topCategory && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs self-start sm:self-auto">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              أعلى بند: <strong>{topCategory.name}</strong> ({topCategory.percentage.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      {/* Grid: Chart + Detailed Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left/Top: Recharts Donut Chart */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[280px]">
          <div className="w-full h-[260px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  cursor="pointer"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              إجمالي المصروفات
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 font-mono-num mt-0.5">
              {formatCurrency(totalExpenses, pharmacyProfile.currency)}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {totalRecordsCount} بند مسجل
            </div>
          </div>
        </div>

        {/* Right/Bottom: Category Legend & Values List */}
        <div className="lg:col-span-6 space-y-2">
          <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center justify-between">
            <span>التصنيف المحاسبي</span>
            <span>القيمة والنسبة</span>
          </div>

          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {chartData.map((item, index) => {
              const isHovered = activeIndex === index;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isHovered
                      ? 'bg-slate-50 border-slate-300 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Category Name & Color Indicator */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs transition-transform"
                      style={{
                        backgroundColor: item.color,
                        transform: isHovered ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.count} حركة مصروفات
                      </div>
                    </div>
                  </div>

                  {/* Amount & Percentage Progress */}
                  <div className="text-left shrink-0">
                    <div className="text-xs font-black text-slate-900 font-mono-num">
                      {formatCurrency(item.value, pharmacyProfile.currency)}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, item.percentage)}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 font-mono-num">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
