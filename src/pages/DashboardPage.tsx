import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Video,
  TrendingUp,
  UserPlus,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalFounders: number;
  totalInvestors: number;
  totalVideos: number;
  activeVideos: number;
  pendingVideos: number;
  totalMatches: number;
  pendingReports: number;
  todaySignups: number;
  todayVideos: number;
  todayMatches: number;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: "purple" | "blue" | "green" | "orange" | "red" | "pink";
}

const colorVariants = {
  purple: "from-purple-500 to-purple-600",
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
  pink: "from-pink-500 to-pink-600",
};

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: StatCardProps) {
  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-purple-500/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl sm:text-4xl font-bold text-white">{value.toLocaleString()}</h3>
              {trend && (
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    trend.isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {trend.isPositive ? "+" : "-"}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
          </div>
          <div className={`p-2 sm:p-3 bg-gradient-to-br ${colorVariants[color]} rounded-xl flex-shrink-0`}>
            <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ title, description, icon: Icon, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-purple-500/5 text-left w-full"
    >
      <div className={`p-2 sm:p-3 bg-gradient-to-br ${colorVariants[color]} rounded-xl flex-shrink-0`}>
        <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white text-sm sm:text-base">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-400 truncate">{description}</p>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats/"],
    queryFn: () => api.get<DashboardStats>("/api/admin/stats/"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-400">Loading platform overview...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-28 sm:h-32 bg-slate-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-400">Real-time platform overview and statistics</p>
      </div>

      {/* Today's Activity */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          Today's Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="New Signups"
            value={stats?.todaySignups || 0}
            subtitle="Users joined today"
            icon={UserPlus}
            color="green"
          />
          <StatCard
            title="Videos Uploaded"
            value={stats?.todayVideos || 0}
            subtitle="New pitches today"
            icon={Video}
            color="blue"
          />
          <StatCard
            title="New Matches"
            value={stats?.todayMatches || 0}
            subtitle="Connections made today"
            icon={TrendingUp}
            color="purple"
          />
        </div>
      </div>

      {/* Platform Overview */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.totalFounders || 0} founders • ${stats?.totalInvestors || 0} investors`}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Total Videos"
            value={stats?.totalVideos || 0}
            subtitle={`${stats?.activeVideos || 0} active videos`}
            icon={Video}
            color="blue"
          />
          <StatCard
            title="Total Matches"
            value={stats?.totalMatches || 0}
            subtitle="Successful connections"
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Pending Items"
            value={(stats?.pendingVideos || 0) + (stats?.pendingReports || 0)}
            subtitle={`${stats?.pendingVideos || 0} videos • ${stats?.pendingReports || 0} reports`}
            icon={Clock}
            color="orange"
          />
        </div>
      </div>

      {/* Moderation Queue */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Moderation Queue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                <Video className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                Pending Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{stats?.pendingVideos || 0}</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">Awaiting approval</p>
                </div>
                <a
                  href="/videos"
                  className="px-3 sm:px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Review
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                Pending Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{stats?.pendingReports || 0}</p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">Need attention</p>
                </div>
                <a
                  href="/reports"
                  className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Review
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <QuickAction
            title="Manage Users"
            description="View and manage all platform users"
            icon={Users}
            onClick={() => (window.location.href = "/users")}
            color="purple"
          />
          <QuickAction
            title="Review Videos"
            description="Approve or reject pitch videos"
            icon={Video}
            onClick={() => (window.location.href = "/videos")}
            color="blue"
          />
          <QuickAction
            title="Handle Reports"
            description="Moderate flagged content"
            icon={AlertCircle}
            onClick={() => (window.location.href = "/reports")}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}