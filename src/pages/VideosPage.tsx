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
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Eye,
  Heart,
  Calendar,
  User,
  Building,
} from "lucide-react";

interface AdminVideo {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string;
  duration: number;
  status: "processing" | "active" | "rejected" | "archived";
  is_current: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  founder: {
    id: string;
    name: string;
    email: string;
    company_name?: string;
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-500 flex items-center gap-1 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-yellow-500 flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="flex items-center gap-1 text-xs">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

export default function VideosPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  // Fetch videos
  const { data: videos, isLoading, refetch } = useQuery<AdminVideo[]>({
    queryKey: ["/api/admin/videos/", statusFilter],
    queryFn: () => {
      const url =
        statusFilter === "all"
          ? "/api/admin/videos/"
          : `/api/admin/videos/?status=${statusFilter}`;
      return api.get<AdminVideo[]>(url);
    },
  });

  // Approve video mutation
  const approveMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return api.put(`/api/admin/videos/${videoId}/approve/`, {});
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Video approved successfully!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject video mutation
  const rejectMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return api.put(`/api/admin/videos/${videoId}/reject/`, {});
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Video rejected" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingCount = videos?.filter((v) => v.status === "processing").length || 0;
  const activeCount = videos?.filter((v) => v.status === "active").length || 0;
  const rejectedCount = videos?.filter((v) => v.status === "rejected").length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-slate-800/50" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 bg-slate-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Video Moderation</h1>
        <p className="text-sm sm:text-base text-slate-400">
          {videos?.length || 0} total • {pendingCount} pending • {activeCount} active •{" "}
          {rejectedCount} rejected
        </p>
      </div>

      {/* Filter */}
      <div className="w-full sm:w-48">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-slate-900/50 border-slate-800 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white">
              All Videos
            </SelectItem>
            <SelectItem value="processing" className="text-white">
              Pending ({pendingCount})
            </SelectItem>
            <SelectItem value="active" className="text-white">
              Active ({activeCount})
            </SelectItem>
            <SelectItem value="rejected" className="text-white">
              Rejected ({rejectedCount})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Videos Grid */}
      {!videos || videos.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <Play className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No videos found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all overflow-hidden"
            >
              <CardContent className="p-0">
                {/* Video Player */}
                <div className="relative bg-black aspect-video group">
                  {playingVideo === video.id ? (
                    <video
                      src={video.url}
                      poster={video.thumbnail_url || undefined}
                      controls
                      autoPlay
                      controlsList="nodownload"
                      className="w-full h-full"
                      preload="metadata"
                    />
                  ) : (
                    <>
                      {/* Show video frame by default */}
                      <video
                        src={video.url}
                        poster={video.thumbnail_url || undefined}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <button
                        onClick={() => setPlayingVideo(video.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="p-4 bg-white rounded-full shadow-lg">
                          <Play className="h-8 w-8 text-black" />
                        </div>
                      </button>
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(video.status)}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-black/70 px-2 py-1 rounded text-white text-xs">
                        {video.duration}s
                      </div>
                    </>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4 space-y-4">
                  {/* Title & Founder */}
                  <div>
                    <h3 className="font-semibold text-white text-base sm:text-lg mb-2 break-words">{video.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words">{video.founder.name}</span>
                      </div>
                      {video.founder.company_name && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 flex-shrink-0" />
                            <span className="break-words">{video.founder.company_name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 flex-shrink-0" />
                      <span>{video.view_count} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 flex-shrink-0" />
                      <span>{video.like_count} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {video.status === "processing" && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs"
                        onClick={() => approveMutation.mutate(video.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs"
                        onClick={() => rejectMutation.mutate(video.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
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