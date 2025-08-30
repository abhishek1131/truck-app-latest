"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { User, Settings, FileText } from "lucide-react"

interface EditTechnicianModalProps {
  isOpen: boolean
  onClose: () => void
  technician: {
    id: string
    name: string
    email: string
    phone: string
    location: string
    status: string
    joinDate: string
    totalOrders: number
    creditBalance: number
    lastActive: string
    specialization: string
  }
}

export function EditTechnicianModal({ isOpen, onClose, technician }: EditTechnicianModalProps) {
  const [formData, setFormData] = useState({
    name: technician.name,
    email: technician.email,
    phone: technician.phone,
    location: technician.location,
    specialization: technician.specialization,
    status: technician.status,
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    creditUpdates: true,
    notes: "",
  })

  const handleSave = () => {
    // Here you would typically make an API call to update the technician
    console.log("Updating technician:", formData)
    onClose()
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-[#10294B]">Edit Technician Profile</DialogTitle>
          <DialogDescription>Update technician information and settings</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TabsContent value="profile" className="space-y-6 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              placeholder="Enter email address"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => handleInputChange("location", e.target.value)}
                              placeholder="Enter location"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Specialization</Label>
                            <Select
                              value={formData.specialization}
                              onValueChange={(value) => handleInputChange("specialization", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HVAC">HVAC</SelectItem>
                                <SelectItem value="Electrical">Electrical</SelectItem>
                                <SelectItem value="Plumbing">Plumbing</SelectItem>
                                <SelectItem value="Industrial">Industrial</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Account Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value) => handleInputChange("status", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Notification Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-gray-500">Receive notifications via email</p>
                          </div>
                          <Switch
                            checked={formData.emailNotifications}
                            onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>SMS Notifications</Label>
                            <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                          </div>
                          <Switch
                            checked={formData.smsNotifications}
                            onCheckedChange={(checked) => handleInputChange("smsNotifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Order Updates</Label>
                            <p className="text-sm text-gray-500">Get notified about order status changes</p>
                          </div>
                          <Switch
                            checked={formData.orderUpdates}
                            onCheckedChange={(checked) => handleInputChange("orderUpdates", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Credit Updates</Label>
                            <p className="text-sm text-gray-500">Get notified about credit balance changes</p>
                          </div>
                          <Switch
                            checked={formData.creditUpdates}
                            onCheckedChange={(checked) => handleInputChange("creditUpdates", checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-6 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Admin Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Internal Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleInputChange("notes", e.target.value)}
                            placeholder="Add internal notes about this technician..."
                            rows={8}
                          />
                          <p className="text-sm text-gray-500">
                            These notes are only visible to administrators and will not be shared with the technician.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
