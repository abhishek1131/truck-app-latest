"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Minus,
  Download,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Eye,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import jsPDF from "jspdf"
import toast from "react-hot-toast";
import { CompletedJobDetailsModal } from "@/components/completed-job-details-modal"

interface Truck {
  id: string
  name: string
  location: string
}

interface InventoryItem {
  id: string
  name: string
  sku?: string
  currentStock: number
  minThreshold: number
  standardLevel: number
  bins: { id: string; name: string }[]
  unit_price: number
  cost_price: number
}

interface UsedPart {
  id: string
  name: string
  sku: string
  currentStock: number
  count: number
  binLocation: string
  unit_price?: number
  cost_price?: number
}

interface CompletedJob {
  id: string
  job_name: string
  date: string
  truck: Truck
  truck_name?: string
  license_plate?: string
  parts: UsedPart[]
  parts_used_count: number
  status: string
}

export default function UsePartsPage() {
  const { token, user } = useAuth()
  const [selectedTruck, setSelectedTruck] = useState("")
  const [jobName, setJobName] = useState("")
  const [usedParts, setUsedParts] = useState<UsedPart[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobCompleted, setJobCompleted] = useState(false)
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<CompletedJob[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [jobsPerPage] = useState(10)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTruckFilter, setSelectedTruckFilter] = useState("all")
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalJob, setTotalJob] = useState(0)
  const [quickAddItem, setQuickAddItem] = useState("")
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // Fetch suggestions from API
  const fetchSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim() || !token) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/inventory/suggestions?search=${encodeURIComponent(searchTerm)}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.data.suggestions || [])
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Filter available items based on quickAddItem search
  const filteredAvailableItems = quickAddItem.trim() 
    ? availableItems.filter(item => 
        item.name.toLowerCase().includes(quickAddItem.toLowerCase())
      )
    : availableItems

  // Quick Add Item function
  const handleQuickAddItem = async () => {
    if (!quickAddItem.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    setIsAddingItem(true);
    try {
      const response = await fetch("/api/inventory/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: quickAddItem.trim(),
          category: "",
          unit: "",
          description: "",
          partNumber: "",
          brand: "",
          cost_price: 0,
          lowStockThreshold: 0,
          standardLevel: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Item added successfully!");
        setQuickAddItem("");
        
        // Add the new item to usedParts with default quantity of 1
        const newItem: UsedPart = {
          id: data.item.id || data.id || "",
          name: quickAddItem.trim(),
          sku: "",
          count: 1,
          unit_price: data.item.unitPrice || 0,
          cost_price: data.item.costPrice || 0,
          currentStock: 0,
          binLocation: ""
        };
        setUsedParts([...usedParts, newItem]);
        
        // Scroll to the "Parts Used on This Job" section
        setTimeout(() => {
          const partsSection = document.querySelector('[data-section="parts-used"]');
          if (partsSection) {
            partsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        
        // Refresh available items to include the new item
        if (selectedTruck) {
          fetch(`/api/use-parts/${selectedTruck}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => setAvailableItems(data.items || []))
          .catch(err => console.error(err))
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  };

  // Quick Add Item function with suggestion data
  const handleQuickAddItemWithSuggestion = async (suggestion: any) => {
    if (!suggestion.name) {
      toast.error("Please select a valid item");
      return;
    }

    setIsAddingItem(true);
    try {
      const response = await fetch("/api/inventory/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: suggestion.name,
          category: suggestion.category_name || "",
          unit: suggestion.unit || "",
          description: suggestion.description || "",
          partNumber: suggestion.part_number || "",
          brand: suggestion.brand || "",
          cost_price: parseFloat(suggestion.cost_price) || 0,
          lowStockThreshold: suggestion.min_quantity || 0,
          standardLevel: suggestion.standard_level || 0
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Item added successfully!");
        setQuickAddItem("");
        
        // Add the new item to usedParts with default quantity of 1
        const newItem: UsedPart = {
          id: data.item.id || data.id || "",
          name: suggestion.name,
          sku: suggestion.part_number || "",
          count: 1,
          unit_price: parseFloat(suggestion.unit_price) || 0,
          cost_price: parseFloat(suggestion.cost_price) || 0,
          currentStock: 0,
          binLocation: ""
        };
        setUsedParts([...usedParts, newItem]);
        
        // Scroll to the "Parts Used on This Job" section
        setTimeout(() => {
          const partsSection = document.getElementById("parts-used-section");
          if (partsSection) {
            partsSection.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
        
        // Refresh available items to include the new item
        if (selectedTruck) {
          fetch(`/api/use-parts/${selectedTruck}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => setAvailableItems(data.items || []))
          .catch(err => console.error(err))
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to add item");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  };

  // ✅ Fetch jobs from API based on filters and pagination
  const fetchJobs = async (page: number = 1) => {
    if (!token) return
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(jobsPerPage),
        search: searchTerm,
        dateFrom,
        dateTo,
        truckId: selectedTruckFilter,
      })
      const res = await fetch(`/api/use-parts?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setCompletedJobs(data.jobs)
        setFilteredJobs(data.jobs)
        setTotalPages(data.totalPages)
        setTotalJob(data.total)
        setCurrentPage(data.page)
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    }
  }

  // Fetch Trucks
  useEffect(() => {
    if (!token) return
    fetch("/api/orders/trucks", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTrucks(data.trucks || []))
      .catch(err => console.error(err));

    fetchJobs(currentPage)
  }, [token])

  // Fetch inventory items for selected truck
  useEffect(() => {
    if (!selectedTruck || !token) return
    fetch(`/api/use-parts/${selectedTruck}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setAvailableItems(data.items || []))
      .catch(err => console.error(err))
  }, [selectedTruck, token])

  // Fetch jobs when filters or page change
  useEffect(() => {
    fetchJobs(currentPage)
  }, [searchTerm, dateFrom, dateTo, selectedTruckFilter, currentPage])

  // Debounced suggestions fetch
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(quickAddItem)
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [quickAddItem])

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    setQuickAddItem(suggestion.name)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Handle adding suggestion directly
  const handleAddSuggestion = async (suggestion: any) => {
    // Set the suggestion name in the input
    setQuickAddItem(suggestion.name)
    setShowSuggestions(false)
    setSuggestions([])
    
    // Call handleQuickAddItem with the full suggestion data
    await handleQuickAddItemWithSuggestion(suggestion)
  }

  const addPartToJob = (item: InventoryItem) => {
    // Check if item already exists by ID or by name (for items added from suggestions)
    const existingPartById = usedParts.find(p => p.id === item.id);
    const existingPartByName = usedParts.find(p => p.name === item.name && !existingPartById);
    
    const existingPart = existingPartById || existingPartByName;
    
    if (existingPart) {
      setUsedParts(usedParts.map(p => 
        (p.id === existingPart.id || (p.name === item.name && p.id === existingPart.id)) 
          ? { ...p, count: p.count + 1 } 
          : p
      ))
    } else {
      setUsedParts([...usedParts, { 
        id: item.id, 
        name: item.name, 
        sku: item.sku || "", 
        count: 1, 
        unit_price: item.unit_price, 
        cost_price: item.cost_price, 
        currentStock: item.currentStock, 
        binLocation: "" 
      }])
    }
    
    // Scroll to the "Parts Used on This Job" section
    setTimeout(() => {
      const partsSection = document.querySelector('[data-section="parts-used"]');
      if (partsSection) {
        partsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  const updatePartQuantity = (id: string, change: number) => {
    setUsedParts(
      usedParts
        .map(p => p.id === id ? { ...p, count: Math.max(0, p.count + change) } : p)
        .filter(p => p.count > 0)
    )
  }

  const getStockWarning = (item: InventoryItem) => {
    // Check for used quantity by both ID and name to handle items added from suggestions
    const usedPartById = usedParts.find(p => p.id === item.id);
    const usedPartByName = usedParts.find(p => p.name === item.name && !usedPartById);
    const usedQuantity = (usedPartById || usedPartByName)?.count || 0;
    
    const remainingStock = item.currentStock - usedQuantity
    if (remainingStock < 0) return { type: "error", message: "Insufficient stock!" }
    if (remainingStock <= item.standardLevel) return { type: "warning", message: "Will trigger restock" }
    return null
  }

  const handleCompleteJob = async () => {
    if (!selectedTruck || !jobName || usedParts.length === 0) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/use-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_name: jobName, truck_id: selectedTruck, parts: usedParts }),
      })
      const data = await res.json()
      if (res.ok) {
        const newJob: CompletedJob = { id: data.id, job_name: jobName, date: new Date().toISOString(), truck: trucks.find(t => t.id === selectedTruck)!, parts: usedParts, parts_used_count: usedParts.length, status: "Completed" }
        setCompletedJobs([newJob, ...completedJobs])
        setJobCompleted(true)
        fetchJobs(currentPage)
      } else {
        if (res.status === 409) {
          toast.error(data.error || "Job already exists.");
        } else {
          toast.error("Failed to Complete Job");
        }
      }
    } catch (error: any) {
      toast.error(error || "Failed to Complete Job");
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const generatePDF = (job?: CompletedJob) => {
    // Build selectedJob — if a job was passed use it, otherwise build from current state
    const fallbackTruck = trucks.find(t => t.id === selectedTruck) || { id: "", name: "Unknown Truck", location: "" };
    const selectedJob: CompletedJob = job ?? {
      id: "temp",
      job_name: jobName || "Untitled Job",
      date: new Date().toISOString(),
      truck: fallbackTruck,
      parts: usedParts,
      parts_used_count: usedParts.length,
      status: "Completed",
    }
  
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    let y = 50
  
    // Title (center)
    doc.setFontSize(18)
    doc.text("Job Report", pageWidth / 2, y, { align: "center" })
    y += 28
  
    // Job meta
    doc.setFontSize(11)
    doc.text(`Job Name: ${selectedJob.job_name}`, margin, y); y += 16
    doc.text(`Date: ${new Date(selectedJob.date).toLocaleString()}`, margin, y); y += 16
  
    // truck fallback handling (some records might store truck_name separately)
    const truckLabel = (selectedJob.truck && (selectedJob.truck as any).name) || (selectedJob as any).truck_name || "Unknown"
    const truckLoc = (selectedJob.truck && (selectedJob.truck as any).location) || ""
    doc.text(`Truck: ${truckLabel}${truckLoc ? ` (${truckLoc})` : ""}`, margin, y); y += 16
  
    doc.text(`Status: ${selectedJob.status}`, margin, y); y += 18
  
    // horizontal separator
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y); y += 14
  
    // Table header
    doc.setFontSize(11)
    const colWidths = [220, 100, 60, pageWidth - margin * 2 - (220 + 100 + 60)] // name, sku, qty, bin
    const headers = ["Part name", "SKU", "Qty", "Bin location"]
    let x = margin
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y)
      x += colWidths[i]
    })
    y += 12
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10
  
    // Table rows
    doc.setFontSize(10)
    selectedJob.parts.forEach((p) => {
      // Page break if needed
      if (y > pageHeight - 80) {
        doc.addPage()
        y = 50
      }
  
      x = margin
      // Part name (wrap if long)
      const nameLines = doc.splitTextToSize(p.name || "-", colWidths[0] - 4)
      doc.text(nameLines, x + 2, y)
      const nameHeight = nameLines.length * 12
      x += colWidths[0]
  
      // SKU
      doc.text(p.sku || "-", x + 2, y)
      x += colWidths[1]
  
      // Quantity
      doc.text(String(p.count ?? "-"), x + 2, y)
      x += colWidths[2]
  
      // Bin location (wrap)
      // const bin = p.binLocation || "-"
      // const binLines = doc.splitTextToSize(bin, colWidths[3] - 4)
      // make row height = max of nameHeight and binLines height
      // const binHeight = binLines.length * 12
      // const rowHeight = Math.max(nameHeight, binHeight, 12)
      // doc.text(binLines, x + 2, y)
  
      // y += rowHeight + 8
    })
  
    // Footer timestamp
    doc.setFontSize(9)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 30)
  
    // Sanitize filename and save
    const safeName = (selectedJob.job_name || "job").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")
    doc.save(`${safeName}_report.pdf`)
  }

  const startNewJob = () => {
    setJobCompleted(false); setJobName(""); setSelectedTruck(""); setUsedParts([])
    fetchJobs(currentPage)
  }
  const clearFilters = () => {
    setSearchTerm(""); setDateFrom(""); setDateTo(""); setSelectedTruckFilter("all"); setCurrentPage(1)
    // fetchJobs(currentPage)
  }

  if (jobCompleted) {
    return (
      <Navigation title="Job Completed" subtitle="Parts logged successfully">
        <div className="p-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-900">Job Completed Successfully!</CardTitle>
              <CardDescription>Parts have been logged and inventory updated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Job Summary</h3>
                <p>
                  <strong>Job:</strong> {jobName}
                </p>
                  <p>
                    <strong>Truck:</strong> {trucks.find((t) => t.id === selectedTruck)?.name}
                  </p>
                <p>
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </p>
                <p>
                  <strong>Parts Used:</strong> {usedParts.length} items
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Parts Used:</h4>
                {usedParts.map((part) => (
                  <div key={part.id} className="flex justify-between text-sm">
                    <span>{part.name}</span>
                    <span>{part.count}x</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => generatePDF()} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={startNewJob} variant="outline" className="flex-1 bg-transparent">
                  New Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Navigation>
    )
  }

  return (
    <Navigation title="Use Parts" subtitle="Log parts used on jobs">
      <div className="p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="new-job" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-job">New Job</TabsTrigger>
            <TabsTrigger value="completed-jobs">Completed Jobs ({totalJob})</TabsTrigger>
          </TabsList>

          <TabsContent value="new-job" className="space-y-6">
            {/* Job Setup */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Job</CardTitle>
                <CardDescription>Select your truck and enter job details to start logging parts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="truck">Select Truck</Label>
                    <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your truck" />
                      </SelectTrigger>
                      <SelectContent>
                        {trucks.map((truck) => (
                          <SelectItem key={truck.id} value={truck.id}>
                            {truck.name}
                            {truck.location ? ` (${truck.location})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobName">Job Name</Label>
                    <Input
                      id="jobName"
                      placeholder="e.g., Starbucks Store #479"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            {selectedTruck && jobName && (
              <>
                {/* Available Parts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Parts</CardTitle>
                    <CardDescription>
                      Click "Use" to add parts to this job
                      {quickAddItem.trim() && (
                        <span className="text-blue-600"> • Showing results for "{quickAddItem}"</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Quick Add Item */}
                    <div className="mb-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {/* <Label htmlFor="quickAdd">Quick Add Item</Label> */}
                          <div className="flex gap-2 relative">
                            <div className="flex-1 relative">
                              <Input
                                id="quickAdd"
                                placeholder="Search existing parts or enter new item name"
                                value={quickAddItem}
                                onChange={(e) => setQuickAddItem(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleQuickAddItem()}
                                onFocus={() => quickAddItem.trim() && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              />
                              
                              {/* Suggestions Dropdown */}
                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                    <div className="text-xs font-medium text-gray-600">Suggestions ({suggestions.length})</div>
                                  </div>
                                  {suggestions.map((suggestion, index) => (
                                    <div
                                      key={suggestion.id || index}
                                      className="px-4 py-3 hover:bg-blue-50 hover:shadow-sm transition-all duration-200 border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                                    >
                                      <div 
                                        className="flex-1 cursor-pointer"
                                        onClick={() => handleSuggestionSelect(suggestion)}
                                      >
                                        <div className="font-medium text-sm text-gray-900">{suggestion.name}</div>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {suggestion.part_number && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                              {suggestion.part_number}
                                            </span>
                                          )}
                                          {suggestion.brand && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                              {suggestion.brand}
                                            </span>
                                          )}
                                        </div>
                                        {suggestion.created_by_name && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Added by: {suggestion.created_by_name}
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="ml-2 h-8 px-3 text-xs transition-all duration-200 hover:bg-red-900 hover:text-white hover:border-black hover:shadow-md transform hover:scale-105"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAddSuggestion(suggestion)
                                        }}
                                        disabled={isAddingItem}
                                      >
                                        {isAddingItem ? "Adding..." : "Add"}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Loading indicator */}
                              {isLoadingSuggestions && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                              )}
                            </div>
                            <Button 
                              onClick={handleQuickAddItem}
                              disabled={isAddingItem || !quickAddItem.trim()}
                              size="sm"
                            >
                              {isAddingItem ? "Adding..." : "Add"}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                          Search for existing parts or add a new item to the job and your inventory quickly.
                          </p>
                        </div>
                      </div>
                    </div>
                    {availableItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-600 border rounded-lg bg-gray-50">
                        No parts are currently available for this truck.
                        <br />
                        Please go to the <span className="font-medium text-blue-600">Trucks</span> section and add items first.
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-3">
                          {filteredAvailableItems.map((item) => {
                          const warning = getStockWarning(item)
                          // Check for used quantity by both ID and name to handle items added from suggestions
                          const usedPartById = usedParts.find(p => p.id === item.id);
                          const usedPartByName = usedParts.find(p => p.name === item.name && !usedPartById);
                          const usedQuantity = (usedPartById || usedPartByName)?.count || 0;

                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{item.name}</h4>
                                  {item.sku && <Badge variant="outline">{item.sku}</Badge>}
                                </div>
                                <p className="text-sm text-gray-600">
                                  Stock: {(item.currentStock - usedQuantity) > 0 ? (item.currentStock - usedQuantity) : 0}
                                  {usedQuantity > 0 && (
                                    <span className="text-blue-600"> ({usedQuantity} used)</span>
                                  )}
                                </p>
                                {warning && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                    <span className="text-xs text-amber-600">
                                      {warning.message}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <Button
                                onClick={() => addPartToJob(item)}
                                disabled={!jobName}
                                size="sm"
                              >
                                Use
                              </Button>
                            </div>
                          )
                        })}
                        </div>

                        {/* No search results message */}
                        {filteredAvailableItems.length === 0 && quickAddItem.trim() && (
                          <div className="p-4 text-center text-gray-600 border rounded-lg bg-gray-50">
                            No parts found matching "{quickAddItem}"
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>


                {/* Used Parts */}
                {usedParts.length > 0 && (
                  <Card data-section="parts-used">
                    <CardHeader>
                      <CardTitle>Parts Used on This Job</CardTitle>
                      <CardDescription>Adjust quantities or remove parts as needed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {usedParts.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium">{part.name}</h4>
                              {/* <p className="text-sm text-gray-600">{part.binLocation}</p> */}
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updatePartQuantity(part.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {part.count}
                              </span>
                              <Button
                                variant="outline"
                                // disabled={part.currentStock - part.count <= 0}
                                size="sm"
                                onClick={() => updatePartQuantity(part.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <Button
                        onClick={handleCompleteJob}
                        disabled={isSubmitting}
                        className="w-full"
                        size="lg"
                      >
                        {isSubmitting ? "Completing Job..." : "Complete Job & Update Inventory"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

              </>
            )}
          </TabsContent>

          <TabsContent value="completed-jobs" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Job name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="truck-filter">Truck</Label>
                    <Select value={selectedTruckFilter} onValueChange={setSelectedTruckFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All trucks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Trucks</SelectItem>
                        {trucks.map((truck) => (
                          <SelectItem key={truck.id} value={truck.id}>
                            {truck.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * jobsPerPage + 1} - {Math.min(currentPage * jobsPerPage, totalJob)} of {totalJob} jobs
                  </div>

                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <Card>
              <CardHeader>
                <CardTitle>Completed Jobs</CardTitle>
                <CardDescription>View and download PDFs for completed jobs</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredJobs.length > 0 ? (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{job.job_name}</Badge>
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {job.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(job.date).toLocaleDateString()}
                              </span>
                              <span>
                                <span>
                                  {job?.truck_name} ({job?.license_plate})
                                </span>

                              </span>
                              <span>{job.parts_used_count} parts used</span>
                              {/* <span>by {job.technician}</span> */}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <Button variant="outline" size="sm" onClick={() => generatePDF(job)}>
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                            <CompletedJobDetailsModal key={job.id} job={job as any}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </CompletedJobDetailsModal>
                          </div>
                        </div>

                        <div className="text-sm">
                          <strong>Parts Used:</strong>{" "}
                          {job.parts.map((part, index) => (
                            <span key={`${part.id || part.name}-${index}`}>
                              {part.name} ({part.count}x)
                              {index < job.parts.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {filteredJobs.length === 0 && completedJobs.length > 0
                      ? "No jobs match your current filters."
                      : "No completed jobs yet. Complete your first job to see it here!"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Navigation>
  )
}
