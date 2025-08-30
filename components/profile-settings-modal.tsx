"use client"

import type React from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Camera, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { User } from "@/types/user"

interface ProfileSettingsModalProps {
  user: User | null
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ user }) => {
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    specialization: user?.specialization || "",
    address: user?.address || "",
    bio: user?.bio || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Profile saved",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      })

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6">
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-[#10294B] rounded-full flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </div>
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Create preview URL
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        // Here you would typically upload to your API
                        toast({
                          title: "Photo updated",
                          description: "Profile photo has been updated successfully.",
                        })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("avatar-upload")?.click()}>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
                <p className="text-sm text-gray-600 mt-1">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={profileData.specialization}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      specialization: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="security" className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-medium text-[#10294B] mb-4">Password</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
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
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  isSaving ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
                variant="outline"
              >
                {isSaving ? "Changing..." : "Change Password"}
              </Button>
              <p className="text-sm text-gray-600">Last changed: January 1, 2024</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProfileSettingsModal
