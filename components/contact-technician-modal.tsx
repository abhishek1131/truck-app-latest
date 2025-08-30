"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Mail, Phone, MessageSquare, Send } from "lucide-react"

interface ContactTechnicianModalProps {
  isOpen: boolean
  onClose: () => void
  technician: {
    name: string
    email?: string
    phone?: string
  }
  orderId?: string
}

export function ContactTechnicianModal({ isOpen, onClose, technician, orderId }: ContactTechnicianModalProps) {
  const [contactMethod, setContactMethod] = useState("email")
  const [subject, setSubject] = useState(orderId ? `Regarding Order #${orderId}` : "")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState("normal")

  const handleSend = () => {
    console.log("Sending message to technician:", {
      technician: technician.name,
      method: contactMethod,
      subject,
      message,
      priority,
      orderId,
    })
    onClose()
    // Reset form
    setSubject(orderId ? `Regarding Order #${orderId}` : "")
    setMessage("")
    setPriority("normal")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col overflow-hidden"
        style={{
          width: "800px",
          maxWidth: "90vw",
          height: "85vh",
          maxHeight: "85vh",
        }}
      >
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b">
          <DialogTitle className="text-xl text-[#10294B] flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Technician
          </DialogTitle>
          <DialogDescription className="text-sm">Send a message to {technician.name}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-4 py-3 space-y-4">
            {/* Technician Info */}
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base">Technician Information</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {technician.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{technician.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      {technician.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{technician.email}</span>
                        </span>
                      )}
                      {technician.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {technician.phone}
                        </span>
                      )}
                    </div>
                    {orderId && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Order #{orderId}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Method</Label>
                    <Select value={contactMethod} onValueChange={setContactMethod}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">Email</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sms">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">SMS</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            <span className="text-xs">Email & SMS</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <span className="text-xs">Low</span>
                        </SelectItem>
                        <SelectItem value="normal">
                          <span className="text-xs">Normal</span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="text-xs">High</span>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <span className="text-xs">Urgent</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="subject" className="text-xs">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter message subject"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="message" className="text-xs">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    className="text-sm resize-none"
                  />
                </div>

                {priority === "urgent" && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">
                      <strong>Urgent messages</strong> will be sent immediately and may trigger additional
                      notifications.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 flex justify-end gap-2 px-4 py-3 border-t">
          <Button variant="outline" onClick={onClose} className="h-8 text-sm bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90 h-8 text-sm"
            disabled={!subject || !message}
          >
            <Send className="h-3 w-3 mr-1" />
            Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
