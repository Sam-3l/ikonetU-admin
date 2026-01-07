import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Filter, Trash2, Eye, Calendar, Briefcase, MapPin, Video as VideoIcon, Users as UsersIcon, Building } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "founder" | "investor" | "admin";
  avatarUrl?: string;
  createdAt: string;
  onboardingComplete: boolean;
  founderProfile?: {
    companyName?: string;
    sector?: string;
    stage?: string;
    location?: string;
    bio?: string;
  };
  investorProfile?: {
    firmName?: string;
    title?: string;
    sectors?: string[];
    stages?: string[];
  };
  stats?: {
    videoCount: number;
    matchCount: number;
    viewCount: number;
  };
}

function getRoleBadge(role: string) {
  switch (role) {
    case "founder": return <Badge variant="default" className="text-xs">Founder</Badge>;
    case "investor": return <Badge variant="secondary" className="text-xs">Investor</Badge>;
    case "admin": return <Badge className="bg-purple-500 text-xs">Admin</Badge>;
    default: return <Badge variant="outline" className="text-xs">{role}</Badge>;
  }
}

export default function UsersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { data: users, isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users/"],
    queryFn: async () => await api.get<AdminUser[]>("/api/admin/users/"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => api.delete(`/api/admin/users/${userId}/delete/`),
    onSuccess: () => {
      refetch();
      toast({ title: "User deactivated successfully" });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredUsers = users?.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return user.name.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower) || user.founderProfile?.companyName?.toLowerCase().includes(searchLower) || user.investorProfile?.firmName?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-slate-800/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (<Skeleton key={i} className="h-64 bg-slate-800/50" />))}
        </div>
      </div>
    );
  }

  const founderCount = users?.filter(u => u.role === "founder").length || 0;
  const investorCount = users?.filter(u => u.role === "investor").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-sm sm:text-base text-slate-400">{filteredUsers?.length || 0} users • {founderCount} founders • {investorCount} investors</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-900/50 border-slate-800 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all" className="text-white">All Users</SelectItem>
            <SelectItem value="founder" className="text-white">Founders</SelectItem>
            <SelectItem value="investor" className="text-white">Investors</SelectItem>
            <SelectItem value="admin" className="text-white">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!filteredUsers || filteredUsers.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <UsersIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-purple-500/5">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover border-2 border-purple-500/30" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{user.name.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{user.name}</h3>
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2">{getRoleBadge(user.role)}</div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {/* ROLE-SPECIFIC INFO */}
                  {user.role === "founder" && user.founderProfile && (
                    <div className="space-y-2">
                      {user.founderProfile.companyName && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.founderProfile.companyName}</span>
                        </div>
                      )}

                      {user.founderProfile.sector && user.founderProfile.stage && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Briefcase className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">
                            {user.founderProfile.sector} • {user.founderProfile.stage}
                          </span>
                        </div>
                      )}

                      {user.founderProfile.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.founderProfile.location}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {user.role === "investor" && user.investorProfile && (
                    <div className="space-y-2">
                      {user.investorProfile.firmName && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.investorProfile.firmName}</span>
                        </div>
                      )}

                      {user.investorProfile.title && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Briefcase className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.investorProfile.title}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* JOIN DATE */}
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* STATS — ALWAYS PINNED TO BOTTOM */}
                {user.stats &&
                  (user.stats.videoCount > 0 ||
                    user.stats.matchCount > 0 ||
                    user.stats.viewCount > 0) && (
                    <div className="mt-4 flex items-center justify-between gap-3 p-3 bg-slate-800/50 rounded-lg">
                      {user.role === "founder" && (
                        <>
                          <div className="flex flex-col items-center flex-1">
                            <VideoIcon className="h-4 w-4 text-blue-400 mb-1" />
                            <span className="text-white font-semibold text-sm">
                              {user.stats.videoCount}
                            </span>
                            <span className="text-xs text-slate-500">Videos</span>
                          </div>

                          <div className="h-8 w-px bg-slate-700" />
                        </>
                      )}

                      <div className="flex flex-col items-center flex-1">
                        <UsersIcon className="h-4 w-4 text-green-400 mb-1" />
                        <span className="text-white font-semibold text-sm">
                          {user.stats.matchCount}
                        </span>
                        <span className="text-xs text-slate-500">Matches</span>
                      </div>

                      {user.role === "founder" && (
                        <>
                          <div className="h-8 w-px bg-slate-700" />

                          <div className="flex flex-col items-center flex-1">
                            <Eye className="h-4 w-4 text-purple-400 mb-1" />
                            <span className="text-white font-semibold text-sm">
                              {user.stats.viewCount}
                            </span>
                            <span className="text-xs text-slate-500">Views</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                {user.role !== "admin" && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUserToDelete(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">This will deactivate the user's account.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)} className="bg-red-500 hover:bg-red-600 text-white">Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}