
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { LoadingContent } from "@/components/ui/loading-spinner";

interface AdminBookingsByRoomChartProps {
  data: {
    roomName: string;
    bookingCount: number;
  }[];
}

export function AdminBookingsByRoomChart({ data }: AdminBookingsByRoomChartProps) {
  if (!data.length) {
    return <LoadingContent className="h-[250px]" timeout={5000} />;
  }

  return (
    <div className="h-[250px]">
      <ChartContainer
        config={{
          main: { color: "#9b87f5" }
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
          >
            <XAxis type="number" />
            <YAxis 
              dataKey="roomName" 
              type="category" 
              axisLine={false}
              tickLine={false}
              width={100}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey="bookingCount" name="Bookings" fill="var(--color-main)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

export default AdminBookingsByRoomChart;
