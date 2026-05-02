import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { TestTube, Plus, Calendar, TrendingUp, TrendingDown, Minus, FileText, Download, Eye } from "lucide-react"

interface LabResult {
  id: string
  patientId: string
  patientName: string
  testType: "blood" | "urine" | "imaging" | "biopsy" | "other"
  testName: string
  orderDate: string
  resultDate: string
  status: "pending" | "completed" | "abnormal" | "critical"
  doctor: string
  results: TestResult[]
  notes: string
  attachments?: string[]
}

interface TestResult {
  parameter: string
  value: string
  unit: string
  referenceRange: string
  status: "normal" | "high" | "low" | "critical"
}

export function LabResults() {
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("results")

  const [labResults] = useState<LabResult[]>([
    {
      id: "1",
      patientId: "MED-851234-567",
      patientName: "John Smith",
      testType: "blood",
      testName: "Complete Blood Count (CBC)",
      orderDate: "2024-09-08",
      resultDate: "2024-09-09",
      status: "completed",
      doctor: "Dr. Johnson",
      results: [
        { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", referenceRange: "13.8-17.2", status: "normal" },
        { parameter: "White Blood Cells", value: "8.5", unit: "K/uL", referenceRange: "4.0-11.0", status: "normal" },
        { parameter: "Platelets", value: "250", unit: "K/uL", referenceRange: "150-450", status: "normal" },
        { parameter: "Hematocrit", value: "42", unit: "%", referenceRange: "41-53", status: "normal" }
      ],
      notes: "All values within normal limits. Good overall blood health.",
      attachments: ["cbc_report_john_smith.pdf"]
    },
    {
      id: "2",
      patientId: "1",
      patientName: "John Smith",
      testType: "blood",
      testName: "Lipid Panel",
      orderDate: "2024-09-08",
      resultDate: "2024-09-09",
      status: "abnormal",
      doctor: "Dr. Johnson",
      results: [
        { parameter: "Total Cholesterol", value: "245", unit: "mg/dL", referenceRange: "<200", status: "high" },
        { parameter: "LDL Cholesterol", value: "155", unit: "mg/dL", referenceRange: "<100", status: "high" },
        { parameter: "HDL Cholesterol", value: "38", unit: "mg/dL", referenceRange: ">40", status: "low" },
        { parameter: "Triglycerides", value: "180", unit: "mg/dL", referenceRange: "<150", status: "high" }
      ],
      notes: "Elevated cholesterol levels. Recommend dietary modifications and follow-up in 3 months.",
      attachments: ["lipid_panel_john_smith.pdf"]
    },
    {
      id: "3",
      patientId: "2",
      patientName: "Sarah Wilson",
      testType: "blood",
      testName: "HbA1c",
      orderDate: "2024-09-10",
      resultDate: "",
      status: "pending",
      doctor: "Dr. Smith",
      results: [],
      notes: "Diabetes monitoring - quarterly check",
      attachments: []
    },
    {
      id: "4",
      patientId: "1",
      patientName: "John Smith",
      testType: "imaging",
      testName: "Chest X-Ray",
      orderDate: "2024-09-05",
      resultDate: "2024-09-05",
      status: "completed",
      doctor: "Dr. Brown",
      results: [],
      notes: "Clear lung fields. No acute cardiopulmonary abnormalities detected.",
      attachments: ["chest_xray_john_smith.jpg"]
    }
  ])

  const [newLabOrder, setNewLabOrder] = useState({
    patientName: "",
    testType: "" as "blood" | "urine" | "imaging" | "biopsy" | "other" | "",
    testName: "",
    orderDate: "",
    doctor: "",
    notes: ""
  })

  const patients = [
    { id: "1", name: "John Smith" },
    { id: "2", name: "Sarah Wilson" },
    { id: "3", name: "Mike Davis" }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <TestTube className="h-4 w-4" />
      case "abnormal": return <TrendingUp className="h-4 w-4" />
      case "critical": return <TrendingUp className="h-4 w-4" />
      case "pending": return <Minus className="h-4 w-4" />
      default: return <TestTube className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "abnormal": return "bg-yellow-100 text-yellow-800"
      case "critical": return "bg-red-100 text-red-800"
      case "pending": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "text-green-600"
      case "high": return "text-red-600"
      case "low": return "text-blue-600"
      case "critical": return "text-red-800 font-semibold"
      default: return "text-gray-600"
    }
  }

  const getResultStatusIcon = (status: string) => {
    switch (status) {
      case "normal": return <Minus className="h-3 w-3" />
      case "high": return <TrendingUp className="h-3 w-3" />
      case "low": return <TrendingDown className="h-3 w-3" />
      case "critical": return <TrendingUp className="h-3 w-3" />
      default: return <Minus className="h-3 w-3" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "blood": return "bg-red-100 text-red-800"
      case "urine": return "bg-yellow-100 text-yellow-800"
      case "imaging": return "bg-blue-100 text-blue-800"
      case "biopsy": return "bg-purple-100 text-purple-800"
      case "other": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const filteredResults = labResults.filter(result => {
    const patientMatch = selectedPatient === "all" || result.patientId === selectedPatient
    const statusMatch = statusFilter === "all" || result.status === statusFilter
    return patientMatch && statusMatch
  })

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("New lab order:", newLabOrder)
    alert("Lab test ordered successfully!")
    setNewLabOrder({
      patientName: "",
      testType: "",
      testName: "",
      orderDate: "",
      doctor: "",
      notes: ""
    })
  }

  const stats = {
    total: labResults.length,
    pending: labResults.filter(r => r.status === "pending").length,
    abnormal: labResults.filter(r => r.status === "abnormal" || r.status === "critical").length,
    completed: labResults.filter(r => r.status === "completed").length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="mb-2">Laboratory Results</h1>
        <p className="text-muted-foreground">
          Track lab tests, imaging results, and diagnostic reports.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <TestTube className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{stats.pending}</p>
              </div>
              <Minus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abnormal</p>
                <p className="text-2xl font-semibold">{stats.abnormal}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold">{stats.completed}</p>
              </div>
              <TestTube className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="results">Lab Results</TabsTrigger>
            <TabsTrigger value="pending">Pending Tests</TabsTrigger>
          </TabsList>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Order Lab Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Order Laboratory Test</DialogTitle>
                <DialogDescription>
                  Create a new lab test order for a patient
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      value={newLabOrder.patientName}
                      onChange={(e) => setNewLabOrder(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="Enter patient name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderDate">Order Date</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={newLabOrder.orderDate}
                      onChange={(e) => setNewLabOrder(prev => ({ ...prev, orderDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Type</Label>
                    <Select 
                      value={newLabOrder.testType} 
                      onValueChange={(value: any) => setNewLabOrder(prev => ({ ...prev, testType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blood">Blood Test</SelectItem>
                        <SelectItem value="urine">Urine Test</SelectItem>
                        <SelectItem value="imaging">Imaging Study</SelectItem>
                        <SelectItem value="biopsy">Biopsy</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testName">Test Name</Label>
                    <Input
                      id="testName"
                      value={newLabOrder.testName}
                      onChange={(e) => setNewLabOrder(prev => ({ ...prev, testName: e.target.value }))}
                      placeholder="e.g., Complete Blood Count"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">Ordering Physician</Label>
                  <Input
                    id="doctor"
                    value={newLabOrder.doctor}
                    onChange={(e) => setNewLabOrder(prev => ({ ...prev, doctor: e.target.value }))}
                    placeholder="e.g., Dr. Johnson"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderNotes">Clinical Notes</Label>
                  <Textarea
                    id="orderNotes"
                    value={newLabOrder.notes}
                    onChange={(e) => setNewLabOrder(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Clinical indication, special instructions, etc."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Order Lab Test
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="results">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="patientFilter">Filter by Patient</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Patients</SelectItem>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="statusFilter">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="abnormal">Abnormal</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results List */}
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getTypeColor(result.testType)}>
                        {result.testType}
                      </Badge>
                      <div>
                        <CardTitle className="text-lg">{result.testName}</CardTitle>
                        <CardDescription>{result.patientName} • {result.doctor}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(result.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(result.status)}
                          {result.status}
                        </div>
                      </Badge>
                      {result.attachments && result.attachments.length > 0 && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Ordered: {new Date(result.orderDate).toLocaleDateString()}</span>
                        </div>
                        {result.resultDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Completed: {new Date(result.resultDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {result.notes && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Clinical Notes</h4>
                          <p className="text-sm text-muted-foreground">{result.notes}</p>
                        </div>
                      )}
                    </div>

                    {result.results.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Test Results</h4>
                        <div className="space-y-2">
                          {result.results.map((testResult, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex-1">
                                <span className="text-sm font-medium">{testResult.parameter}</span>
                                <div className="text-xs text-muted-foreground">
                                  Reference: {testResult.referenceRange}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {testResult.value} {testResult.unit}
                                </span>
                                <div className={`flex items-center gap-1 ${getResultStatusColor(testResult.status)}`}>
                                  {getResultStatusIcon(testResult.status)}
                                  <span className="text-xs">{testResult.status}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredResults.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No lab results match the current filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="space-y-4">
            {filteredResults.filter(r => r.status === "pending").map((result) => (
              <Card key={result.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getTypeColor(result.testType)}>
                        {result.testType}
                      </Badge>
                      <div>
                        <CardTitle className="text-lg">{result.testName}</CardTitle>
                        <CardDescription>{result.patientName} • {result.doctor}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(result.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(result.status)}
                          {result.status}
                        </div>
                      </Badge>
                      <Button variant="outline" size="sm">
                        Update Status
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Ordered: {new Date(result.orderDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {result.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Clinical Notes</h4>
                      <p className="text-sm text-muted-foreground">{result.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {filteredResults.filter(r => r.status === "pending").length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No pending lab tests</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}