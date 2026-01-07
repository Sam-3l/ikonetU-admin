import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Layout & Pages
import AdminLayout from "@/components/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import VideosPage from "@/pages/VideosPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";

// API
import { api, queryClient } from "@/lib/apiClient";

// Auth Context - Same as main app
interface User {
  id: string;
  email: string;
  name: string;
  role: "founder" | "investor" | "admin";
  avatarUrl?: string;
  onboardingComplete: boolean;
  createdAt: string;
}

interface AuthUser extends Omit<User, "password"> {}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Fetch current user data if token exists
  const { data, isLoading, refetch } = useQuery<{ user: AuthUser }>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No token');
      }
      return await api.get<{ user: AuthUser }>("/api/auth/me");
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!localStorage.getItem('auth_token'),
  });

  // Sync user state with query data and verify admin role
  useEffect(() => {
    if (data?.user) {
      // CRITICAL: Verify user is admin
      if (data.user.role !== "admin") {
        localStorage.removeItem("auth_token");
        setUser(null);
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive",
        });
        // Redirect to main app
        window.location.href = import.meta.env.VITE_MAIN_APP_URL || "https://ikonetu.com";
        return;
      }
      setUser(data.user);
      setIsInitialized(true);
    } else if (!isLoading) {
      setUser(null);
      setIsInitialized(true);
    }
  }, [data, isLoading, toast]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      localStorage.removeItem('auth_token');
      return await api.post<{ token: string; user: AuthUser }>("/api/auth/login", { email, password });
    },
    onSuccess: (data) => {
      // Verify admin role
      if (data.user.role !== "admin") {
        localStorage.removeItem('auth_token');
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive",
        });
        throw new Error("Admin access required");
      }
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      refetch();
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/auth/logout", {});
    },
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      setUser(null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || !isInitialized,
        isAuthenticated: !!user,
        login,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Main App Component
function AdminApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/videos" element={<VideosPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Root App with Providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AdminApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
export { useAuth };