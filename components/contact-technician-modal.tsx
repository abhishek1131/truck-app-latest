"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Mail, Send } from "lucide-react";

interface ContactTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: {
    name: string;
    email?: string;
    phone?: string;
  };
  orderId?: string;
}

export function ContactTechnicianModal({
  isOpen,
  onClose,
  technician,
  orderId,
}: ContactTechnicianModalProps) {
  const [subject, setSubject] = useState(
    orderId ? `Regarding Order #${orderId}` : ""
  );
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("https://formspree.io/f/xeozbzqy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: technician.name,
          email: technician.email,
          subject,
          message,
          priority,
          orderId: orderId || "N/A",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      // Reset form on success
      setSubject(orderId ? `Regarding Order #${orderId}` : "");
      setMessage("");
      setPriority("normal");
      onClose();
    } catch (err) {
      setError("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

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
          <DialogDescription className="text-sm">
            Send an email to {technician.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-4 py-3 space-y-4">
            {/* Technician Info */}
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-base">
                  Technician Information
                </CardTitle>
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
                    <h3 className="font-semibold text-base truncate">
                      {technician.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      {technician.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{technician.email}</span>
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
                  <Mail className="h-4 w-4" />
                  Send Email
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-1 space-y-3">
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

                <div className="space-y-1">
                  <Label htmlFor="subject" className="text-xs">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
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
                    placeholder="Type your email message here..."
                    rows={4}
                    className="text-sm resize-none"
                  />
                </div>

                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">{error}</p>
                  </div>
                )}

                {priority === "urgent" && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">
                      <strong>Urgent emails</strong> will be sent immediately
                      and may trigger additional notifications.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 flex justify-end gap-2 px-4 py-3 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-8 text-sm bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90 h-8 text-sm"
            disabled={!subject || !message || isSending}
          >
            <Send className="h-3 w-3 mr-1" />
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
