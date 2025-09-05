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

  const handleSendEmail = () => {
    if (!subject || !message || !technician.email) {
      setError(
        "Please fill in all required fields and ensure technician email is available"
      );
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Create formatted email body
      const emailBody = `Dear ${technician.name},

${message}

---
Priority: ${priority.toUpperCase()}
${orderId ? `Order ID: ${orderId}` : ""}

This message was sent through the TruxTok system.

Best regards`;

      // Encode email components
      const encodedRecipient = encodeURIComponent(technician.email);
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(emailBody);

      // Create Gmail URL
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedRecipient}&su=${encodedSubject}&body=${encodedBody}`;

      // Open Gmail in new tab
      window.open(gmailUrl, "_blank");

      // Show success notification
      const showNotification = () => {
        const notification = document.createElement("div");
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10294B;
          color: white;
          padding: 16px;
          border-radius: 8px;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          max-width: 300px;
          font-family: system-ui, -apple-system, sans-serif;
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
            <strong>Email Opened!</strong>
          </div>
          <div style="margin-top: 8px; font-size: 14px; line-height: 1.4;">
            Gmail has opened in a new tab with your message ready to send to ${technician.name}.
          </div>
        `;

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 5000);
      };

      showNotification();

      // Reset form and close modal
      setTimeout(() => {
        setSubject(orderId ? `Regarding Order #${orderId}` : "");
        setMessage("");
        setPriority("normal");
        onClose();
      }, 500);
    } catch (err) {
      console.error("Error opening email:", err);
      setError("Failed to open email client. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

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
            {!technician.email && (
              <span className="text-red-500 ml-2">(Email not available)</span>
            )}
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
                      {technician.email ? (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{technician.email}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span>No email available</span>
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
                  Compose Email
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
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Urgent priority</strong> - This email will be
                      marked as high importance.
                    </p>
                  </div>
                )}

                {!technician.email && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">
                      <strong>No email available</strong> for this technician.
                      Please contact them through alternative means.
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
            onClick={handleSendEmail}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90 h-8 text-sm"
            disabled={!subject || !message || isSending || !technician.email}
          >
            <Send className="h-3 w-3 mr-1" />
            {isSending ? "Opening..." : "Open in Gmail"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
