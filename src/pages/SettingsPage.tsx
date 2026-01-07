import { useState } from "react";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Bell, Lock, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pendingVideoAlerts, setPendingVideoAlerts] = useState(true);
  const [reportAlerts, setReportAlerts] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your admin account and preferences</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5 text-purple-500" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your admin account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-2 border-purple-500/30">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                {user?.name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{user?.name}</h3>
              <p className="text-slate-400">{user?.email}</p>
              <Badge className="mt-2 bg-purple-500 hover:bg-purple-600">Administrator</Badge>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={user?.name || ""}
                disabled
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Email Address</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-purple-500" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage how you receive alerts and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Email Notifications</Label>
              <p className="text-sm text-slate-400">Receive notifications via email</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <Separator className="bg-slate-800" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Pending Video Alerts</Label>
              <p className="text-sm text-slate-400">
                Get notified when new videos need approval
              </p>
            </div>
            <Switch checked={pendingVideoAlerts} onCheckedChange={setPendingVideoAlerts} />
          </div>

          <Separator className="bg-slate-800" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Report Alerts</Label>
              <p className="text-sm text-slate-400">
                Get notified about new content reports
              </p>
            </div>
            <Switch checked={reportAlerts} onCheckedChange={setReportAlerts} />
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="h-5 w-5 text-purple-500" />
            Security
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
            Change Password
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Last updated: Never
          </p>
        </CardContent>
      </Card>

      {/* System Info Card */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="h-5 w-5 text-purple-500" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Admin Portal Version</p>
              <p className="text-white font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-slate-500">Last Login</p>
              <p className="text-white font-medium">Just now</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}