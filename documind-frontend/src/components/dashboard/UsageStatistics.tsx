import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { UsersIcon, FileTextIcon, ClockIcon, ZapIcon } from "./DashboardIcons";

// Mock data - replace with actual API call
const dailyUsageData = [
  { day: "Mon", documents: 45, queries: 120, users: 12 },
  { day: "Tue", documents: 52, queries: 145, users: 15 },
  { day: "Wed", documents: 48, queries: 138, users: 14 },
  { day: "Thu", documents: 61, queries: 162, users: 18 },
  { day: "Fri", documents: 55, queries: 150, users: 16 },
  { day: "Sat", documents: 32, queries: 85, users: 8 },
  { day: "Sun", documents: 28, queries: 72, users: 6 },
];

const monthlyUsageData = [
  { month: "Jan", documents: 1240, queries: 3420, users: 45 },
  { month: "Feb", documents: 1380, queries: 3850, users: 52 },
  { month: "Mar", documents: 1520, queries: 4120, users: 58 },
  { month: "Apr", documents: 1680, queries: 4560, users: 64 },
  { month: "May", documents: 1820, queries: 4890, users: 71 },
  { month: "Jun", documents: 1950, queries: 5210, users: 78 },
];

const chartConfig = {
  documents: {
    label: "Documents",
    color: "hsl(var(--chart-1))",
  },
  queries: {
    label: "Queries",
    color: "hsl(var(--chart-2))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-3))",
  },
};

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="p-5 rounded-xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:border-[#d4d4d4] dark:hover:border-[#404040] transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] text-[#737373] dark:text-[#a3a3a3] font-medium">{title}</span>
        <div className="text-[#737373] dark:text-[#a3a3a3]">{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-[#171717] dark:text-[#fafafa] mb-2 tracking-tight">{value}</p>
      <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">
        <span className={cn(
          "font-semibold",
          change > 0 ? "text-green-500" : "text-red-500"
        )}>
          {change > 0 ? "+" : ""}{change}%
        </span>{" "}
        from last period
      </p>
    </div>
  );
}

export function UsageStatistics() {
  // TODO: Replace with actual API call
  const stats = {
    totalDocuments: "12,450",
    totalQueries: "34,820",
    activeUsers: "156",
    avgResponseTime: "1.2s",
  };

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
          Usage Statistics
        </h2>
        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
          Platform usage metrics and analytics (Admin view)
        </p>
      </div>
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Documents"
            value={stats.totalDocuments}
            change={12.5}
            icon={<FileTextIcon className="h-4 w-4" />}
          />
          <StatCard
            title="Total Queries"
            value={stats.totalQueries}
            change={18.3}
            icon={<ZapIcon className="h-4 w-4" />}
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            change={8.7}
            icon={<UsersIcon className="h-4 w-4" />}
          />
          <StatCard
            title="Avg Response Time"
            value={stats.avgResponseTime}
            change={-5.2}
            icon={<ClockIcon className="h-4 w-4" />}
          />
        </div>

        {/* Charts */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-full grid-cols-2 bg-[#f5f5f5] dark:bg-[#262626] p-1 rounded-lg">
            <TabsTrigger value="daily" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-[#171717]">Daily</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-[#171717]">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-6 w-full">
            <div className="w-full">
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={dailyUsageData}
                    margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                  >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-[#262626]" />
                  <XAxis
                    dataKey="day"
                    stroke="#737373"
                    className="dark:stroke-[#a3a3a3]"
                    fontSize={12}
                  />
                  <YAxis stroke="#737373" className="dark:stroke-[#a3a3a3]" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="documents"
                    fill="#171717"
                    className="dark:fill-[#fafafa]"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="queries"
                    fill="#737373"
                    className="dark:fill-[#a3a3a3]"
                    radius={[6, 6, 0, 0]}
                  />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </TabsContent>
          <TabsContent value="monthly" className="mt-6 w-full">
            <div className="w-full">
              <ChartContainer config={chartConfig} className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={monthlyUsageData}
                    margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                  >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-[#262626]" />
                  <XAxis
                    dataKey="month"
                    stroke="#737373"
                    className="dark:stroke-[#a3a3a3]"
                    fontSize={12}
                  />
                  <YAxis stroke="#737373" className="dark:stroke-[#a3a3a3]" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="documents"
                    stroke="#171717"
                    className="dark:stroke-[#fafafa]"
                    strokeWidth={2.5}
                    dot={{ fill: "#171717", r: 4 }}
                    className="dark:[&_circle]:fill-[#fafafa]"
                  />
                  <Line
                    type="monotone"
                    dataKey="queries"
                    stroke="#737373"
                    className="dark:stroke-[#a3a3a3]"
                    strokeWidth={2.5}
                    dot={{ fill: "#737373", r: 4 }}
                    className="dark:[&_circle]:fill-[#a3a3a3]"
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#525252"
                    className="dark:stroke-[#737373]"
                    strokeWidth={2.5}
                    dot={{ fill: "#525252", r: 4 }}
                    className="dark:[&_circle]:fill-[#737373]"
                  />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

