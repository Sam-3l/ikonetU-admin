import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Calendar,
  User,
  FileText,
} from "lucide-react";

interface Report {
  id: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  reportedUser?: {
    id: string;
    name: string;
    email: string;
  };
  video?: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    url: string;
  };
  resolvedByName?: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-500 flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "reviewed":
      return <Badge className="bg-blue-500 text-xs">Reviewed</Badge>;
    case "resolved":
      return (
        <Badge className="bg-green-500 flex items-center gap-1 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          Resolved
        </Badge>
      );
    case "dismissed":
      return <Badge variant="secondary" className="text-xs">Dismissed</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch reports
  const { data: reports, isLoading, refetch } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports/", statusFilter],
    queryFn: () => {
      const url =
        statusFilter === "all"
          ? "/api/admin/reports/"
          : `/api/admin/reports/?status=${statusFilter}`;
      return api.get<Report[]>(url);
    },
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      return api.put(`/api/admin/reports/${reportId}/`, { status });
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Report updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return api.delete(`/api/admin/reports/${reportId}/delete/`);
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Report deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingCount = reports?.filter((r) => r.status === "pending").length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-slate-800/50" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 bg-slate-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Report Management</h1>
        <p className="text-sm sm:text-base text-slate-400">
          {reports?.length || 0} total • {pendingCount} pending
        </p>
      </div>

      {/* Filter */}
      <div className="w-full">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white">
              All Reports
            </SelectItem>
            <SelectItem value="pending" className="text-white">
              Pending ({pendingCount})
            </SelectItem>
            <SelectItem value="reviewed" className="text-white">
              Reviewed
            </SelectItem>
            <SelectItem value="resolved" className="text-white">
              Resolved
            </SelectItem>
            <SelectItem value="dismissed" className="text-white">
              Dismissed
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      {!reports || reports.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(report.status)}
                      <Badge variant="outline" className="text-xs">{report.reason}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p className="text-slate-300">
                        <span className="text-slate-500">Reported by:</span>{" "}
                        <span className="font-medium break-words">{report.reporter.name}</span>
                      </p>
                      <p className="text-slate-500 break-all">{report.reporter.email}</p>
                      
                      {report.reportedUser && (
                        <>
                          <p className="text-slate-300">
                            <span className="text-slate-500">Reported user:</span>{" "}
                            <span className="font-medium break-words">{report.reportedUser.name}</span>
                          </p>
                          <p className="text-slate-500 break-all">{report.reportedUser.email}</p>
                        </>
                      )}
                      
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs">{new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {report.description && (
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-white">Description:</p>
                      </div>
                      <p className="text-sm text-slate-300 break-words">{report.description}</p>
                    </div>
                  )}

                  {/* Video Info */}
                  {report.video && (
                    <div className="border-t border-slate-800 pt-4">
                      <p className="text-sm font-medium text-white mb-2">Reported Video:</p>
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        {report.video.thumbnailUrl && (
                          <img
                            src={report.video.thumbnailUrl}
                            alt={report.video.title}
                            className="w-full sm:w-24 h-auto sm:h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white break-words">{report.video.title}</p>
                          <a
                            href={report.video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1"
                          >
                            <Eye className="h-3 w-3 flex-shrink-0" />
                            View Video
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions - Only for pending */}
                  {report.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateReportMutation.mutate({
                            reportId: report.id,
                            status: "reviewed",
                          })
                        }
                        disabled={updateReportMutation.isPending}
                        className="w-full sm:w-auto border-slate-700 text-slate-300 text-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-xs"
                        onClick={() =>
                          updateReportMutation.mutate({
                            reportId: report.id,
                            status: "resolved",
                          })
                        }
                        disabled={updateReportMutation.isPending}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto text-xs"
                        onClick={() =>
                          updateReportMutation.mutate({
                            reportId: report.id,
                            status: "dismissed",
                          })
                        }
                        disabled={updateReportMutation.isPending}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReportMutation.mutate(report.id)}
                        disabled={deleteReportMutation.isPending}
                        className="w-full sm:w-auto text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Resolution Info */}
                  {report.resolvedByName && report.resolvedAt && (
                    <div className="border-t border-slate-800 pt-4">
                      <p className="text-xs text-slate-500 break-words">
                        Resolved by{" "}
                        <span className="font-medium text-slate-400">{report.resolvedByName}</span> on{" "}
                        {new Date(report.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}