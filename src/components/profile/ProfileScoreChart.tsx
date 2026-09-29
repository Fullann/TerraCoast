import React from "react";
import { TrendingUp, BarChart3, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";

interface ProfileScoreChartProps {
  data: Array<Record<string, any>>;
  isOwnProfile: boolean;
  userKey: string;
  currentUserKey: string;
  showCompareLine: boolean;
  onPointClick: (dataPoint: any) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-900 border-2 border-slate-600 border-b-4 border-b-slate-700 rounded-2xl px-4 py-3 shadow-xl text-white min-w-[140px]">
      <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{entry.name}</span>
          <span
            className="text-sm font-black font-mono"
            style={{ color: entry.color }}
          >
            {entry.value} pts
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;
  return (
    <div className="flex items-center justify-center gap-5 mt-4">
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full border-2 shadow-sm"
            style={{ backgroundColor: entry.color, borderColor: entry.color }}
          />
          <span className="text-xs font-black text-slate-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export const ProfileScoreChart: React.FC<ProfileScoreChartProps> = ({
  data,
  isOwnProfile,
  userKey,
  currentUserKey,
  showCompareLine,
  onPointClick,
}) => {
  const { t } = useLanguage();

  if (!data || data.length === 0) return null;

  const handleChartClick = (chartEvent: any) => {
    if (chartEvent && chartEvent.activePayload && chartEvent.activePayload.length > 0) {
      onPointClick(chartEvent.activePayload[0].payload);
    }
  };

  // Calculate stats from the data
  const primaryKey = isOwnProfile ? currentUserKey : userKey;
  const values = data.map((d) => d[primaryKey] || 0).filter((v) => typeof v === "number");
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const avgVal = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const totalVal = values.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm overflow-hidden">
      {/* En-tête avec Mini-Stats */}
      <div className="p-5 sm:p-6 pb-0 sm:pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 border-2 border-blue-200 border-b-4 border-b-blue-300 flex items-center justify-center text-blue-600 shadow-sm">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>{t("profile.progressChart")}</span>
          </h2>
          <span className="text-xs font-black text-slate-400 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            7 derniers jours
          </span>
        </div>

        {/* Mini stat cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 sm:p-3.5 text-center border-2 border-blue-200 border-b-4 border-b-blue-300 hover:scale-[1.02] transition-transform">
            <div className="w-7 h-7 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center mx-auto mb-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-lg sm:text-xl font-black text-blue-700 font-mono leading-tight">
              {totalVal.toLocaleString()}
            </p>
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 mt-0.5">
              Total semaine
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-3 sm:p-3.5 text-center border-2 border-emerald-200 border-b-4 border-b-emerald-300 hover:scale-[1.02] transition-transform">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-lg sm:text-xl font-black text-emerald-700 font-mono leading-tight">
              {avgVal.toLocaleString()}
            </p>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mt-0.5">
              Moy. / jour
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3 sm:p-3.5 text-center border-2 border-amber-200 border-b-4 border-b-amber-300 hover:scale-[1.02] transition-transform">
            <div className="w-7 h-7 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-1.5">
              <span className="text-sm">🔥</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-amber-700 font-mono leading-tight">
              {maxVal.toLocaleString()}
            </p>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mt-0.5">
              Record du jour
            </p>
          </div>
        </div>
      </div>

      {/* Graphique Zone (Area Chart) */}
      <div className="px-2 sm:px-4 pb-5">
        <div className="w-full h-[280px] sm:h-[320px] lg:h-[360px] bg-gradient-to-b from-slate-50/80 to-white rounded-2xl border border-slate-200/60 p-2 sm:p-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              onClick={handleChartClick}
            >
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#e2e8f0"
                strokeOpacity={0.6}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                style={{ fontSize: "11px", fontWeight: 700 }}
                tick={{ fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: "11px", fontWeight: 700 }}
                tick={{ fill: "#64748b" }}
                domain={[0, "auto"]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Legend content={<CustomLegend />} />
              <Area
                type="monotone"
                dataKey={isOwnProfile ? currentUserKey : userKey}
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorPrimary)"
                dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8, fill: "#3b82f6", stroke: "#fff", strokeWidth: 3 }}
                animationDuration={1200}
              />
              {!isOwnProfile && showCompareLine && (
                <Area
                  type="monotone"
                  dataKey={currentUserKey}
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="6 4"
                  fill="url(#colorSecondary)"
                  dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }}
                  animationDuration={1200}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-center text-[11px] font-semibold text-slate-400 mt-3">
          Cliquez sur un point pour voir le détail de la journée
        </p>
      </div>
    </div>
  );
};
