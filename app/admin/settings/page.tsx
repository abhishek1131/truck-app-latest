"use client";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Building,
  DollarSign,
  Shield,
  Save,
  Upload,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [platformSettings, setPlatformSettings] = useState({
    platformName: "TruXtoK",
    platformDescription: "Stock Smarter. Profit Harder.",
    supportEmail: "support@truxtok.com",
    adminEmail: "admin@truxtok.com",
    maintenanceMode: false,
    allowRegistrations: true,
  });
  const [commissionSettings, setCommissionSettings] = useState({
    defaultCommissionRate: 3.0,
    technicianCreditRate: 25.0,
    minimumOrderValue: 10.0,
    maximumOrderValue: 10000.0,
    autoApproveOrders: true,
    requireOrderApproval: false,
  });
  const [securitySettings, setSecuritySettings] = useState({
    requireTwoFactor: false,
    sessionTimeout: 24,
    passwordMinLength: 8,
    requireSpecialChars: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token || user?.role !== "admin") {
        setError("Admin access required");
        return;
      }

      try {
        const response = await fetch("/api/admin/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success && result.data) {
          const cleanString = (value: any) => {
            if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
              return value.slice(1, -1);
            }
            return value === "null" ? null : value;
          };

          setPlatformSettings({
            platformName: cleanString(result.data.platform.platformName),
            platformDescription: cleanString(result.data.platform.platformDescription),
            supportEmail: cleanString(result.data.platform.supportEmail),
            adminEmail: cleanString(result.data.platform.adminEmail),
            maintenanceMode: result.data.platform.maintenanceMode === "true",
            allowRegistrations: result.data.platform.allowRegistrations === "true",
          });

          setCommissionSettings({
            defaultCommissionRate: Number.parseFloat(result.data.commission.defaultCommissionRate),
            technicianCreditRate: Number.parseFloat(result.data.commission.technicianCreditRate),
            minimumOrderValue: Number.parseFloat(result.data.commission.minimumOrderValue),
            maximumOrderValue: Number.parseFloat(result.data.commission.maximumOrderValue),
            autoApproveOrders: result.data.commission.autoApproveOrders === true || result.data.commission.autoApproveOrders === "true",
            requireOrderApproval: result.data.commission.requireOrderApproval === false || result.data.commission.requireOrderApproval === "false",
          });

          setSecuritySettings({
            requireTwoFactor: result.data.security.requireTwoFactor === "true",
            sessionTimeout: result.data.security.sessionTimeout === "null" ? 24 : Number.parseInt(result.data.security.sessionTimeout),
            passwordMinLength: result.data.security.passwordMinLength === "null" ? 8 : Number.parseInt(result.data.security.passwordMinLength),
            requireSpecialChars: result.data.security.requireSpecialChars === "true",
            maxLoginAttempts: result.data.security.maxLoginAttempts === "null" ? 5 : Number.parseInt(result.data.security.maxLoginAttempts),
            lockoutDuration: result.data.security.lockoutDuration === "null" ? 30 : Number.parseInt(result.data.security.lockoutDuration),
          });
        } else {
          setError(result.error || "Failed to fetch settings");
        }
      } catch (error) {
        setError("Error fetching settings");
        console.error("Fetch settings error:", error);
      }
    };

    fetchSettings();
  }, [token, user]);

  const validatePlatformSettings = (settings: { platformName: any; platformDescription: any; supportEmail: any; adminEmail: any; maintenanceMode: any; allowRegistrations: any; }) => ({
    platformName: settings.platformName.trim(),
    platformDescription: settings.platformDescription.trim(),
    supportEmail: settings.supportEmail.trim(),
    adminEmail: settings.adminEmail.trim(),
    maintenanceMode: Boolean(settings.maintenanceMode),
    allowRegistrations: Boolean(settings.allowRegistrations),
  });

  const handleSavePlatform = async () => {
    setIsSaving(true);
    setError("");
    try {
      const validatedSettings = validatePlatformSettings(platformSettings);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validatedSettings.supportEmail)) {
        setError("Invalid support email format");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validatedSettings.adminEmail)) {
        setError("Invalid admin email format");
        return;
      }

      const payload = {
        category: "platform",
        settings: validatedSettings,
      };
      console.log("Sending payload:", JSON.stringify(payload));

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        setPlatformSettings(validatedSettings);
        toast({
          title: "Platform settings updated",
          description: "Your platform settings have been successfully saved.",
        });
      } else {
        setError(result.error || "Failed to update platform settings");
      }
    } catch (error) {
      setError("Failed to update platform settings");
      console.error("Save platform settings error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCommission = async () => {
    setIsSaving(true);
    setError("");
    try {
      if (
        commissionSettings.defaultCommissionRate < 0 ||
        commissionSettings.defaultCommissionRate > 100 ||
        commissionSettings.technicianCreditRate < 0 ||
        commissionSettings.technicianCreditRate > 100 ||
        commissionSettings.minimumOrderValue < 0 ||
        commissionSettings.maximumOrderValue <
          commissionSettings.minimumOrderValue
      ) {
        setError("Invalid commission settings");
        return;
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: "commission",
          settings: commissionSettings,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Commission settings updated",
          description: "Your commission settings have been successfully saved.",
        });
      } else {
        setError(result.error || "Failed to update commission settings");
      }
    } catch (error) {
      setError("Failed to update commission settings");
      console.error("Save commission settings error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsSaving(true);
    setError("");
    try {
      if (
        securitySettings.sessionTimeout < 1 ||
        securitySettings.passwordMinLength < 6 ||
        securitySettings.maxLoginAttempts < 1 ||
        securitySettings.lockoutDuration < 1
      ) {
        setError("Invalid security settings");
        return;
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: "security",
          settings: securitySettings,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Security settings updated",
          description: "Your security settings have been successfully saved.",
        });
      } else {
        setError(result.error || "Failed to update security settings");
      }
    } catch (error) {
      setError("Failed to update security settings");
      console.error("Save security settings error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsSaving(true);
    setError("");
    try {
      if (
        !passwordForm.currentPassword ||
        !passwordForm.newPassword ||
        !passwordForm.confirmPassword
      ) {
        setError("All password fields are required");
        return;
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("New passwords do not match");
        return;
      }
      if (
        passwordForm.newPassword.length < securitySettings.passwordMinLength
      ) {
        setError(
          `New password must be at least ${securitySettings.passwordMinLength} characters`
        );
        return;
      }
      if (
        securitySettings.requireSpecialChars &&
        !/[!@#$%^&*]/.test(passwordForm.newPassword)
      ) {
        setError("New password must contain at least one special character");
        return;
      }

      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Password changed",
          description: "Your password has been successfully updated.",
        });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch (error) {
      setError("Failed to change password");
      console.error("Change password error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportConfig = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        const config = JSON.stringify(result.data, null, 2);
        const blob = new Blob([config], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "truxtok-config.json";
        a.click();
        URL.revokeObjectURL(url);
        toast({
          title: "Configuration exported",
          description: "Settings have been exported to truxtok-config.json",
        });
      } else {
        setError(result.error || "Failed to export configuration");
      }
    } catch (error) {
      setError("Failed to export configuration");
      console.error("Export config error:", error);
    }
  };

  const handleImportConfig = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);
      if (!config.platform || !config.commission || !config.security) {
        setError("Invalid configuration file");
        return;
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify([
          { category: "platform", settings: config.platform },
          { category: "commission", settings: config.commission },
          { category: "security", settings: config.security },
        ]),
      });

      const result = await response.json();
      if (result.success) {
        setPlatformSettings(config.platform);
        setCommissionSettings(config.commission);
        setSecuritySettings(config.security);
        toast({
          title: "Configuration imported",
          description: "Settings have been successfully imported.",
        });
      } else {
        setError(result.error || "Failed to import configuration");
      }
    } catch (error) {
      setError("Failed to import configuration");
      console.error("Import config error:", error);
    }
  };

  if (user?.role !== "admin") {
    return (
      <Navigation>
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <p className="text-red-500">
              Admin access required to view settings
            </p>
          </CardContent>
        </Card>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="mb-8 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#10294B] mb-2">
              Platform Settings
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Configure and manage your TruXtoK platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent w-full sm:w-auto"
              onClick={handleExportConfig}
            >
              <Download className="h-4 w-4" />
              Export Config
            </Button>
            <label className="flex items-center gap-2 bg-transparent border rounded-md px-3 py-2 cursor-pointer w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              Import Config
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportConfig}
              />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 mx-4 sm:mx-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="platform" className="w-full px-4 sm:px-0">
        <TabsList className="grid grid-cols-3 mb-8 w-full sm:w-auto flex-col sm:flex-row">
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
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Building className="h-5 w-5 text-[#E3253D]" />
                Platform Configuration
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Basic platform settings and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={platformSettings.platformName}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        platformName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={platformSettings.supportEmail}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        supportEmail: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformDescription">
                  Platform Description
                </Label>
                <Textarea
                  id="platformDescription"
                  value={platformSettings.platformDescription}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      platformDescription: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={platformSettings.adminEmail}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      adminEmail: e.target.value,
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#10294B]">
                  Platform Controls
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">
                        Temporarily disable platform access
                      </p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setPlatformSettings({
                          ...platformSettings,
                          maintenanceMode: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowRegistrations">
                        Allow New Registrations
                      </Label>
                      <p className="text-sm text-gray-600">
                        Enable new technician registrations
                      </p>
                    </div>
                    <Switch
                      id="allowRegistrations"
                      checked={platformSettings.allowRegistrations}
                      onCheckedChange={(checked) =>
                        setPlatformSettings({
                          ...platformSettings,
                          allowRegistrations: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSavePlatform}
                disabled={isSaving}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90 w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Platform Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <DollarSign className="h-5 w-5 text-[#E3253D]" />
                Commission & Credit Settings
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure commission rates and credit calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCommissionRate">
                    Default Commission Rate (%)
                  </Label>
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
                        defaultCommissionRate: Number.parseFloat(
                          e.target.value
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technicianCreditRate">
                    Technician Credit Rate (%)
                  </Label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderValue">
                    Minimum Order Value ($)
                  </Label>
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
                  <Label htmlFor="maximumOrderValue">
                    Maximum Order Value ($)
                  </Label>
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
                <h3 className="text-lg font-medium text-[#10294B]">
                  Order Processing
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoApproveOrders">
                        Auto-approve Orders
                      </Label>
                      <p className="text-sm text-gray-600">
                        Automatically approve orders under limits
                      </p>
                    </div>
                    <Switch
                      id="autoApproveOrders"
                      checked={commissionSettings.autoApproveOrders}
                      onCheckedChange={(checked) =>
                        setCommissionSettings({
                          ...commissionSettings,
                          autoApproveOrders: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireOrderApproval">
                        Require Manual Approval
                      </Label>
                      <p className="text-sm text-gray-600">
                        All orders require admin approval
                      </p>
                    </div>
                    <Switch
                      id="requireOrderApproval"
                      checked={commissionSettings.requireOrderApproval}
                      onCheckedChange={(checked) =>
                        setCommissionSettings({
                          ...commissionSettings,
                          requireOrderApproval: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveCommission}
                disabled={isSaving}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90 w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Commission Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-5 w-5 text-[#E3253D]" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure platform security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (hours)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="1"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: Number.parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">
                    Password Minimum Length
                  </Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: Number.parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: Number.parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">
                    Lockout Duration (minutes)
                  </Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="1"
                    value={securitySettings.lockoutDuration}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        lockoutDuration: Number.parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireTwoFactor">
                      Require Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-gray-600">
                      Enforce 2FA for all users
                    </p>
                  </div>
                  <Switch
                    id="requireTwoFactor"
                    checked={securitySettings.requireTwoFactor}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireTwoFactor: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireSpecialChars">
                      Require Special Characters in Passwords
                    </Label>
                    <p className="text-sm text-gray-600">
                      Passwords must include special characters
                    </p>
                  </div>
                  <Switch
                    id="requireSpecialChars"
                    checked={securitySettings.requireSpecialChars}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireSpecialChars: checked,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveSecurity}
                disabled={isSaving}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90 w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Security Settings"}
              </Button>

              <Separator />

              <div>
                <h3 className="text-lg font-medium text-[#10294B] mb-4">
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isSaving}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90 w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Navigation>
  );
}
