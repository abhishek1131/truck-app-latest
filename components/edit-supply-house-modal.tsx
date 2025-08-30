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
import { Badge } from "@/components/ui/badge"
import { Building2, Settings, FileText, X } from "lucide-react"

interface EditSupplyHouseModalProps {
  isOpen: boolean
  onClose: () => void
  supplyHouse: {
    id: string
    name: string
    address: string
    phone: string
    email: string
    status: string
    joinDate: string
    totalOrders: number
    activeTechnicians: number
    lastOrder: string
    rating: number
    specialties: string[]
    manager: string
  }
}

export function EditSupplyHouseModal({ isOpen, onClose, supplyHouse }: EditSupplyHouseModalProps) {
  const [formData, setFormData] = useState({
    name: supplyHouse.name,
    address: supplyHouse.address,
    phone: supplyHouse.phone,
    email: supplyHouse.email,
    manager: supplyHouse.manager,
    status: supplyHouse.status,
    specialties: supplyHouse.specialties,
    emailNotifications: true,
    orderAlerts: true,
    performanceReports: false,
    notes: "",
  })

  const [newSpecialty, setNewSpecialty] = useState("")

  const handleSave = () => {
    console.log("Updating supply house:", formData)
    onClose()
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addSpecialty = () => {
    if (newSpecialty && !formData.specialties.includes(newSpecialty)) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty],
      }))
      setNewSpecialty("")
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((s) => s !== specialty),
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-[#10294B]">Edit Supply House</DialogTitle>
          <DialogDescription>Update supply house information and settings</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="profile">Company Info</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full">
                <div className="pr-4 space-y-6">
                  <TabsContent value="profile" className="space-y-6 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Company Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Company Name</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              placeholder="Enter company name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="manager">Manager Name</Label>
                            <Input
                              id="manager"
                              value={formData.manager}
                              onChange={(e) => handleInputChange("manager", e.target.value)}
                              placeholder="Enter manager name"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Enter full address"
                          />
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

                        <div className="space-y-2">
                          <Label>Account Status</Label>
                          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
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

                        <div className="space-y-2">
                          <Label>Specialties</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {formData.specialties.map((specialty) => (
                              <Badge key={specialty} variant="outline" className="flex items-center gap-1">
                                {specialty}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                                  onClick={() => removeSpecialty(specialty)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Add specialty" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HVAC">HVAC</SelectItem>
                                <SelectItem value="Electrical">Electrical</SelectItem>
                                <SelectItem value="Plumbing">Plumbing</SelectItem>
                                <SelectItem value="Industrial">Industrial</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button type="button" onClick={addSpecialty} disabled={!newSpecialty}>
                              Add
                            </Button>
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
                          Notification Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-gray-500">Receive general notifications via email</p>
                          </div>
                          <Switch
                            checked={formData.emailNotifications}
                            onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Order Alerts</Label>
                            <p className="text-sm text-gray-500">Get notified about new orders and updates</p>
                          </div>
                          <Switch
                            checked={formData.orderAlerts}
                            onCheckedChange={(checked) => handleInputChange("orderAlerts", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Performance Reports</Label>
                            <p className="text-sm text-gray-500">Receive monthly performance reports</p>
                          </div>
                          <Switch
                            checked={formData.performanceReports}
                            onCheckedChange={(checked) => handleInputChange("performanceReports", checked)}
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
                            placeholder="Add internal notes about this supply house..."
                            rows={8}
                          />
                          <p className="text-sm text-gray-500">These notes are only visible to administrators.</p>
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
