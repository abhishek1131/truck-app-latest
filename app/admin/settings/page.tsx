"use client"

import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, DollarSign, Shield, Save, Upload, Download } from "lucide-react"
import { useState } from "react"

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [platformSettings, setPlatformSettings] = useState({
    platformName: "TruXtoK",
    platformDescription: "Stock Smarter. Profit Harder.",
    supportEmail: "support@truxtok.com",
    adminEmail: "admin@truxtok.com",
    maintenanceMode: false,
    allowRegistrations: true,
  })

  const [commissionSettings, setCommissionSettings] = useState({
    defaultCommissionRate: 3.0,
    technicianCreditRate: 25.0,
    minimumOrderValue: 10.0,
    maximumOrderValue: 10000.0,
    autoApproveOrders: true,
    requireOrderApproval: false,
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    creditNotifications: true,
    systemAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
  })

  const [securitySettings, setSecuritySettings] = useState({
    requireTwoFactor: false,
    sessionTimeout: 24,
    passwordMinLength: 8,
    requireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  })

  const handleSavePlatform = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Platform settings updated",
        description: "Your platform settings have been successfully saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update platform settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCommission = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Commission settings updated",
        description: "Your commission settings have been successfully saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update commission settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Notification settings updated",
        description: "Your notification settings have been successfully saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Security settings updated",
        description: "Your security settings have been successfully saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Navigation>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#10294B] mb-2">Platform Settings</h1>
            <p className="text-gray-600">Configure and manage your TruXtoK platform</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export Config
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Import Config
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="commission" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Commission
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-[#E3253D]" />
                Platform Configuration
              </CardTitle>
              <CardDescription>Basic platform settings and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={platformSettings.platformName}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={platformSettings.supportEmail}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformDescription">Platform Description</Label>
                <Textarea
                  id="platformDescription"
                  value={platformSettings.platformDescription}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platformDescription: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={platformSettings.adminEmail}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, adminEmail: e.target.value })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#10294B]">Platform Controls</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Temporarily disable platform access</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setPlatformSettings({ ...platformSettings, maintenanceMode: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowRegistrations">Allow New Registrations</Label>
                      <p className="text-sm text-gray-600">Enable new technician registrations</p>
                    </div>
                    <Switch
                      id="allowRegistrations"
                      checked={platformSettings.allowRegistrations}
                      onCheckedChange={(checked) =>
                        setPlatformSettings({ ...platformSettings, allowRegistrations: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSavePlatform} disabled={isSaving} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Platform Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#E3253D]" />
                Commission & Credit Settings
              </CardTitle>
              <CardDescription>Configure commission rates and credit calculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCommissionRate">Default Commission Rate (%)</Label>
                  <Input
                    id="defaultCommissionRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionSettings.defaultCommissionRate}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        defaultCommissionRate: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technicianCreditRate">Technician Credit Rate (%)</Label>
                  <Input
                    id="technicianCreditRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionSettings.technicianCreditRate}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        technicianCreditRate: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderValue">Minimum Order Value ($)</Label>
                  <Input
                    id="minimumOrderValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={commissionSettings.minimumOrderValue}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        minimumOrderValue: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximumOrderValue">Maximum Order Value ($)</Label>
                  <Input
                    id="maximumOrderValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={commissionSettings.maximumOrderValue}
                    onChange={(e) =>
                      setCommissionSettings({
                        ...commissionSettings,
                        maximumOrderValue: Number.parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#10294B]">Order Processing</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoApproveOrders">Auto-approve Orders</Label>
                      <p className="text-sm text-gray-600">Automatically approve orders under limits</p>
                    </div>
                    <Switch
                      id="autoApproveOrders"
                      checked={commissionSettings.autoApproveOrders}
                      onCheckedChange={(checked) =>
                        setCommissionSettings({ ...commissionSettings, autoApproveOrders: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireOrderApproval">Require Manual Approval</Label>
                      <p className="text-sm text-gray-600">All orders require admin approval</p>
                    </div>
                    <Switch
                      id="requireOrderApproval"
                      checked={commissionSettings.requireOrderApproval}
                      onCheckedChange={(checked) =>
                        setCommissionSettings({ ...commissionSettings, requireOrderApproval: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveCommission} disabled={isSaving} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Commission Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#E3253D]" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure platform security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-[#10294B] mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="Enter your current password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="Enter your new password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm your new password" />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSecurity} disabled={isSaving} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Navigation>
  )
}
