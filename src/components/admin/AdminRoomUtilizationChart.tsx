
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { LoadingContent } from "@/components/ui/loading-spinner";

interface AdminRoomUtilizationChartProps {
  data: {
    roomName: string;
    utilizationPercent: number;
  }[];
}

export function AdminRoomUtilizationChart({ data }: AdminRoomUtilizationChartProps) {
  if (!data.length) {
    return <LoadingContent className="h-[250px]" timeout={5000} />;
  }

  const getBarColor = (percent: number) => {
    if (percent >= 75) return "#D946EF"; // High utilization
    if (percent >= 50) return "#8B5CF6"; // Medium utilization
    return "#7E69AB"; // Low utilization
  };

  return (
    <div className="h-[250px]">
      <ChartContainer
        config={{
          main: { color: "#8B5CF6" }
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
          >
            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <YAxis 
              dataKey="roomName" 
              type="category" 
              axisLine={false}
              tickLine={false}
              width={100}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
            />
            <Tooltip 
              content={<ChartTooltipContent />}
              formatter={(value: number) => [`${value}%`, 'Utilization']}
            />
            <Bar dataKey="utilizationPercent" name="Utilization" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.utilizationPercent)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export default AdminRoomUtilizationChart;
