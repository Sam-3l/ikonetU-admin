import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  Trash2,
  Eye,
  Calendar,
  Briefcase,
  MapPin,
  Video as VideoIcon,
  Users as UsersIcon,
  Building,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "founder" | "investor" | "admin";
  avatar_url?: string;
  created_at: string;
  onboarding_complete: boolean;
  founder_profile?: {
    company_name?: string;
    sector?: string;
    stage?: string;
    location?: string;
    bio?: string;
  };
  investor_profile?: {
    firm_name?: string;
    title?: string;
    sectors?: string[];
    stages?: string[];
  };
  stats?: {
    video_count: number;
    match_count: number;
    view_count: number;
  };
}

function getRoleBadge(role: string) {
  switch (role) {
    case "founder":
      return <Badge variant="default" className="text-xs">Founder</Badge>;
    case "investor":
      return <Badge variant="secondary" className="text-xs">Investor</Badge>;
    case "admin":
      return <Badge className="bg-purple-500 text-xs">Admin</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{role}</Badge>;
  }
}

export default function UsersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Fetch ALL users
  const { data: users, isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users/"],
    queryFn: () => api.get<AdminUser[]>("/api/admin/users/"),
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/api/admin/users/${userId}/delete/`);
    },
    onSuccess: () => {
      refetch();
      toast({ title: "User deactivated successfully" });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // CLIENT-SIDE FILTERING
  const filteredUsers = users?.filter((user) => {
    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = user.name.toLowerCase().includes(searchLower);
      const matchesEmail = user.email.toLowerCase().includes(searchLower);
      const matchesCompany = user.founder_profile?.company_name?.toLowerCase().includes(searchLower);
      const matchesFirm = user.investor_profile?.firm_name?.toLowerCase().includes(searchLower);
      
      return matchesName || matchesEmail || matchesCompany || matchesFirm;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-slate-800/50" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 bg-slate-800/50" />
          ))}
        </div>
      </div>
    );
  }

  const founderCount = users?.filter(u => u.role === "founder").length || 0;
  const investorCount = users?.filter(u => u.role === "investor").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-sm sm:text-base text-slate-400">
          {filteredUsers?.length || 0} users • {founderCount} founders • {investorCount} investors
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
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

      {/* Users Grid */}
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
            <Card
              key={user.id}
              className="bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-purple-500/5"
            >
              <CardContent className="p-6">
                {/* User Header */}
                <div className="flex items-start gap-4 mb-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-purple-500/30"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{user.name}</h3>
                    <p className="text-sm text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2">{getRoleBadge(user.role)}</div>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-2 mb-4">
                  {user.role === "founder" && user.founder_profile && (
                    <>
                      {user.founder_profile.company_name && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.founder_profile.company_name}</span>
                        </div>
                      )}
                      {user.founder_profile.sector && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Briefcase className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.founder_profile.sector} • {user.founder_profile.stage}</span>
                        </div>
                      )}
                      {user.founder_profile.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.founder_profile.location}</span>
                        </div>
                      )}
                    </>
                  )}
                  {user.role === "investor" && user.investor_profile && (
                    <>
                      {user.investor_profile.firm_name && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Building className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.investor_profile.firm_name}</span>
                        </div>
                      )}
                      {user.investor_profile.title && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Briefcase className="h-4 w-4 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{user.investor_profile.title}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Stats */}
                {user.stats && (user.stats.video_count > 0 || user.stats.match_count > 0 || user.stats.view_count > 0) && (
                  <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-slate-800/50 rounded-lg">
                    {user.role === 'founder' && (
                      <>
                        <div className="flex flex-col items-center flex-1">
                          <div className="flex items-center gap-1 text-blue-400 mb-1">
                            <VideoIcon className="h-4 w-4" />
                          </div>
                          <span className="text-white font-semibold text-sm">{user.stats.video_count}</span>
                          <span className="text-xs text-slate-500">Videos</span>
                        </div>
                        <div className="h-8 w-px bg-slate-700" />
                      </>
                    )}
                    <div className="flex flex-col items-center flex-1">
                      <div className="flex items-center gap-1 text-green-400 mb-1">
                        <UsersIcon className="h-4 w-4" />
                      </div>
                      <span className="text-white font-semibold text-sm">{user.stats.match_count}</span>
                      <span className="text-xs text-slate-500">Matches</span>
                    </div>
                    {user.role === 'founder' && (
                      <>
                        <div className="h-8 w-px bg-slate-700" />
                        <div className="flex flex-col items-center flex-1">
                          <div className="flex items-center gap-1 text-purple-400 mb-1">
                            <Eye className="h-4 w-4" />
                          </div>
                          <span className="text-white font-semibold text-sm">{user.stats.view_count}</span>
                          <span className="text-xs text-slate-500">Views</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-700 text-slate-300 hover:text-white text-xs"
                    onClick={() => setSelectedUser(user)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  {user.role !== "admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUserToDelete(user.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete profile information and activity
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-purple-500/30"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white break-words">{selectedUser.name}</h3>
                  <p className="text-slate-400 break-all">{selectedUser.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {getRoleBadge(selectedUser.role)}
                    {!selectedUser.onboarding_complete && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500 text-xs">
                        Onboarding Incomplete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {selectedUser.role === "founder" && selectedUser.founder_profile && (
                  <>
                    {selectedUser.founder_profile.company_name && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Company</p>
                        <p className="text-white break-words">{selectedUser.founder_profile.company_name}</p>
                      </div>
                    )}
                    {selectedUser.founder_profile.sector && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Sector & Stage</p>
                        <p className="text-white">
                          {selectedUser.founder_profile.sector} • {selectedUser.founder_profile.stage}
                        </p>
                      </div>
                    )}
                    {selectedUser.founder_profile.location && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Location</p>
                        <p className="text-white">{selectedUser.founder_profile.location}</p>
                      </div>
                    )}
                    {selectedUser.founder_profile.bio && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Bio</p>
                        <p className="text-slate-300 break-words">{selectedUser.founder_profile.bio}</p>
                      </div>
                    )}
                  </>
                )}
                {selectedUser.role === "investor" && selectedUser.investor_profile && (
                  <>
                    {selectedUser.investor_profile.firm_name && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Firm</p>
                        <p className="text-white break-words">{selectedUser.investor_profile.firm_name}</p>
                      </div>
                    )}
                    {selectedUser.investor_profile.title && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Title</p>
                        <p className="text-white">{selectedUser.investor_profile.title}</p>
                      </div>
                    )}
                    {selectedUser.investor_profile.sectors && selectedUser.investor_profile.sectors.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Investment Sectors</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.investor_profile.sectors.map((sector) => (
                            <Badge key={sector} variant="secondary" className="text-xs">
                              {sector}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedUser.investor_profile.stages && selectedUser.investor_profile.stages.length > 0 && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Investment Stages</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.investor_profile.stages.map((stage) => (
                            <Badge key={stage} variant="secondary" className="text-xs">
                              {stage}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <p className="text-sm text-slate-500 mb-1">Account Created</p>
                  <p className="text-white">{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Activity Stats */}
              {selectedUser.stats && (selectedUser.stats.video_count > 0 || selectedUser.stats.match_count > 0 || selectedUser.stats.view_count > 0) && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-lg">
                  {selectedUser.role === 'founder' && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                        <VideoIcon className="h-5 w-5" />
                      </div>
                      <p className="text-2xl font-bold text-white">{selectedUser.stats.video_count}</p>
                      <p className="text-sm text-slate-400">Videos</p>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedUser.stats.match_count}</p>
                    <p className="text-sm text-slate-400">Matches</p>
                  </div>
                  {selectedUser.role === 'founder' && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                        <Eye className="h-5 w-5" />
                      </div>
                      <p className="text-2xl font-bold text-white">{selectedUser.stats.view_count}</p>
                      <p className="text-sm text-slate-400">Views</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)} className="border-slate-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will deactivate the user's account. They will no longer be able to log in or access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}