
import { useState } from "react";
import { DashboardStats } from "@/services/dashboardService";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BookingChartsProps {
  stats: DashboardStats;
}

export function BookingCharts({ stats }: BookingChartsProps) {
  const [chartTab, setChartTab] = useState("month");
  
  // For pie chart
  const pieColors = ["#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777"];
  
  const weekdayData = stats.bookingsByWeekday || [];
  const monthData = stats.bookingsByMonth || [];
  
  // Convert to percentage for pie chart
  const totalWeekdayBookings = weekdayData.reduce((sum, item) => sum + item.count, 0);
  const pieData = weekdayData.map(item => ({
    name: item.day,
    value: totalWeekdayBookings > 0 ? Math.round((item.count / totalWeekdayBookings) * 100) : 0
  }));
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking Distribution</CardTitle>
          <CardDescription>
            View your booking patterns over time
          </CardDescription>
          <Tabs value={chartTab} onValueChange={setChartTab} className="mt-2">
            <TabsList>
              <TabsTrigger value="month">By Month</TabsTrigger>
              <TabsTrigger value="day">By Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                main: { color: "#2563eb" }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartTab === "month" ? monthData : weekdayData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey={chartTab === "month" ? "month" : "day"} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-main)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekday Distribution</CardTitle>
          <CardDescription>
            Percentage of bookings by day of week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                monday: { color: "#2563eb" },
                tuesday: { color: "#4f46e5" },
                wednesday: { color: "#7c3aed" },
                thursday: { color: "#9333ea" },
                friday: { color: "#c026d3" },
                saturday: { color: "#db2777" },
                sunday: { color: "#e11d48" }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({name, value}) => `${name}: ${value}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
