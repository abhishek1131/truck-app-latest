"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plus, Minus, Calendar, CreditCard, TrendingUp, TrendingDown, Clock } from "lucide-react"

interface AdjustCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  technician: {
    id: string
    name: string
    creditBalance: number
  }
}

const mockCreditHistory = [
  {
    id: "CR-001",
    date: "2024-01-15",
    type: "earned",
    amount: 25.5,
    description: "Order completion bonus - HVAC Installation",
    category: "Order Completion",
    orderId: "ORD-123",
  },
  {
    id: "CR-002",
    date: "2024-01-14",
    type: "redeemed",
    amount: -15.0,
    description: "Redeemed for tool purchase",
    category: "Tool Purchase",
    orderId: null,
  },
  {
    id: "CR-003",
    date: "2024-01-13",
    type: "earned",
    amount: 18.75,
    description: "Performance bonus - Customer rating 5.0",
    category: "Performance Bonus",
    orderId: "ORD-121",
  },
  {
    id: "CR-004",
    date: "2024-01-12",
    type: "adjustment",
    amount: 50.0,
    description: "Manual credit adjustment - Admin correction",
    category: "Manual Adjustment",
    orderId: null,
  },
  {
    id: "CR-005",
    date: "2024-01-11",
    type: "earned",
    amount: 12.25,
    description: "Order completion - Electrical repair",
    category: "Order Completion",
    orderId: "ORD-119",
  },
]

export function AdjustCreditsModal({ isOpen, onClose, technician }: AdjustCreditsModalProps) {
  const [adjustmentType, setAdjustmentType] = useState("add")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Adjusting credits:", {
      technicianId: technician.id,
      type: adjustmentType,
      amount: Number.parseFloat(amount),
      category,
      reason,
    })
    onClose()
  }

  const newBalance =
    technician.creditBalance +
    (adjustmentType === "add" ? Number.parseFloat(amount) || 0 : -(Number.parseFloat(amount) || 0))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden"
        style={{
          width: "1200px",
          maxWidth: "95vw",
          height: "90vh",
          minWidth: "1000px",
        }}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#10294B] flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Adjust Credits
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-0.5">
              Modify credit balance for {technician.name} (Current: ${technician.creditBalance.toFixed(2)})
            </p>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-4 py-3 space-y-3">
            {/* Current Balance Card */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="px-4 pb-2 pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Current Balance</h3>
                </div>
                <div className="text-xl font-bold text-green-600 mb-1">${technician.creditBalance.toFixed(2)}</div>
                <p className="text-xs text-green-700">Available credit balance</p>
              </CardContent>
            </Card>

            {/* Adjustment Form */}
            <Card>
              <CardContent className="px-4 pb-2 pt-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Make Adjustment</h3>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="adjustmentType" className="text-xs font-medium">
                        Adjustment Type
                      </Label>
                      <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add">
                            <div className="flex items-center gap-1.5">
                              <Plus className="h-3 w-3 text-green-600" />
                              <span>Add Credits</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="subtract">
                            <div className="flex items-center gap-1.5">
                              <Minus className="h-3 w-3 text-red-600" />
                              <span>Subtract Credits</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="amount" className="text-xs font-medium">
                        Amount ($)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-8"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-xs font-medium">
                      Category
                    </Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select adjustment category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                        <SelectItem value="bonus">Performance Bonus</SelectItem>
                        <SelectItem value="correction">Error Correction</SelectItem>
                        <SelectItem value="promotion">Promotional Credit</SelectItem>
                        <SelectItem value="refund">Refund</SelectItem>
                        <SelectItem value="penalty">Penalty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reason" className="text-xs font-medium">
                      Reason for Adjustment
                    </Label>
                    <Textarea
                      id="reason"
                      placeholder="Provide a detailed reason for this credit adjustment..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="min-h-[50px] resize-none text-xs"
                      required
                    />
                  </div>

                  {/* Preview */}
                  {amount && (
                    <Card className="border-2 border-blue-200 bg-blue-50">
                      <CardContent className="px-4 pb-2 pt-3">
                        <h4 className="font-semibold text-blue-800 mb-2 text-xs">Adjustment Preview</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <span className="text-blue-600">Current:</span>
                            <div className="font-semibold text-sm">${technician.creditBalance.toFixed(2)}</div>
                          </div>
                          <div className="text-center">
                            <span className="text-blue-600">Change:</span>
                            <div
                              className={`font-semibold text-sm ${adjustmentType === "add" ? "text-green-600" : "text-red-600"}`}
                            >
                              {adjustmentType === "add" ? "+" : "-"}${Number.parseFloat(amount).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-blue-600">New:</span>
                            <div className="font-bold text-sm">${newBalance.toFixed(2)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Recent Credit History */}
            <Card>
              <CardContent className="px-4 pb-2 pt-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Recent Credit History
                </h3>
                <div className="space-y-1.5">
                  {mockCreditHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`p-1 rounded-full flex-shrink-0 ${
                            entry.type === "earned"
                              ? "bg-green-100"
                              : entry.type === "redeemed"
                                ? "bg-red-100"
                                : "bg-blue-100"
                          }`}
                        >
                          {entry.type === "earned" ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : entry.type === "redeemed" ? (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          ) : (
                            <CreditCard className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs text-gray-800 truncate">{entry.description}</p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{entry.date}</span>
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {entry.category}
                            </Badge>
                            {entry.orderId && <span className="text-blue-600">#{entry.orderId}</span>}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-bold text-xs flex-shrink-0 ml-2 ${entry.amount > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {entry.amount > 0 ? "+" : ""}${Math.abs(entry.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex justify-between gap-2 px-4 py-3 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} className="flex-1 md:flex-none bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 md:flex-none bg-[#10294B] hover:bg-[#0f1f35]"
            disabled={!amount || !category || !reason}
          >
            Apply Adjustment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
