import React from "react";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border border-blue-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <TrendingUp className="w-7 h-7 mr-3 text-blue-600" aria-hidden="true" />
        {t("profile.progressChart")}
      </h2>

      <div className="w-full h-[300px] sm:h-[350px] lg:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            onClick={handleChartClick}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: "11px", fontWeight: 500 }}
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: "11px", fontWeight: 500 }}
              tick={{ fill: "#6b7280" }}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.95)",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                padding: "12px 16px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: any) => [`${value} pts`, ""]}
            />
            <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "13px" }} />
            <Line
              type="monotone"
              dataKey={isOwnProfile ? currentUserKey : userKey}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{ r: 7 }}
              animationDuration={1000}
            />
            {!isOwnProfile && showCompareLine && (
              <Line
                type="monotone"
                dataKey={currentUserKey}
                stroke="#10b981"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: "#10b981", r: 5 }}
                activeDot={{ r: 7 }}
                animationDuration={1000}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
