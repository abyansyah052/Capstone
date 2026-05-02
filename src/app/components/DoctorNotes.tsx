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
import { Stethoscope, Plus, Calendar, FileText, User, Search, Edit3, Trash2 } from "lucide-react"

interface DoctorNote {
  id: string
  patientId: string
  patientName: string
  doctorName: string
  date: string
  visitType: "consultation" | "follow-up" | "emergency" | "routine" | "specialist"
  chiefComplaint: string
  diagnosis: string
  treatmentPlan: string
  medications: string
  followUp: string
  notes: string
  vitals?: {
    bloodPressure: string
    heartRate: string
    temperature: string
    weight: string
    height: string
  }
  status: "draft" | "completed" | "reviewed"
}

export function DoctorNotes() {
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("notes")
  const [showNewNote, setShowNewNote] = useState(false)

  const [doctorNotes] = useState<DoctorNote[]>([
    {
      id: "1",
      patientId: "1",
      patientName: "John Smith",
      doctorName: "Dr. Johnson",
      date: "2024-09-11",
      visitType: "consultation",
      chiefComplaint: "Chest pain and shortness of breath during exercise",
      diagnosis: "Stable angina, hypertension",
      treatmentPlan: "Start beta-blocker therapy, lifestyle modifications, cardiac stress test",
      medications: "Metoprolol 50mg twice daily, continue Lisinopril 10mg daily",
      followUp: "Return in 2 weeks for medication review, stress test in 1 month",
      notes: "Patient reports chest discomfort during moderate exercise for past 2 weeks. No chest pain at rest. Physical exam unremarkable except for elevated BP (145/92). EKG shows no acute changes.",
      vitals: {
        bloodPressure: "145/92",
        heartRate: "78",
        temperature: "98.6°F",
        weight: "185 lbs",
        height: "5'10\""
      },
      status: "completed"
    },
    {
      id: "2",
      patientId: "1",
      patientName: "John Smith",
      doctorName: "Dr. Johnson",
      date: "2024-08-28",
      visitType: "follow-up",
      chiefComplaint: "Blood pressure check",
      diagnosis: "Hypertension, well controlled",
      treatmentPlan: "Continue current medication regimen",
      medications: "Lisinopril 10mg daily",
      followUp: "Return in 3 months for routine BP check",
      notes: "Blood pressure well controlled on current medication. Patient reports no side effects. Encouraged to continue diet and exercise modifications.",
      vitals: {
        bloodPressure: "132/84",
        heartRate: "72",
        temperature: "98.4°F",
        weight: "183 lbs",
        height: "5'10\""
      },
      status: "completed"
    },
    {
      id: "3",
      patientId: "2",
      patientName: "Sarah Wilson",
      doctorName: "Dr. Smith",
      date: "2024-09-10",
      visitType: "routine",
      chiefComplaint: "Diabetes follow-up",
      diagnosis: "Type 2 diabetes mellitus, well controlled",
      treatmentPlan: "Continue metformin, lifestyle counseling",
      medications: "Metformin 1000mg twice daily",
      followUp: "Return in 3 months, HbA1c in 3 months",
      notes: "Patient's home glucose logs show good control. HbA1c from last month was 6.8%. No complaints of hypoglycemia. Feet exam normal.",
      vitals: {
        bloodPressure: "125/78",
        heartRate: "68",
        temperature: "98.2°F",
        weight: "165 lbs",
        height: "5'6\""
      },
      status: "completed"
    },
    {
      id: "4",
      patientId: "1",
      patientName: "John Smith",
      doctorName: "Dr. Johnson",
      date: "2024-09-11",
      visitType: "follow-up",
      chiefComplaint: "Medication review",
      diagnosis: "",
      treatmentPlan: "",
      medications: "",
      followUp: "",
      notes: "Follow-up visit for medication review after starting beta-blocker therapy...",
      status: "draft"
    }
  ])

  const [newNote, setNewNote] = useState({
    patientName: "",
    doctorName: "",
    date: "",
    visitType: "" as "consultation" | "follow-up" | "emergency" | "routine" | "specialist" | "",
    chiefComplaint: "",
    diagnosis: "",
    treatmentPlan: "",
    medications: "",
    followUp: "",
    notes: "",
    vitals: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      weight: "",
      height: ""
    }
  })

  const patients = [
    { id: "1", name: "John Smith" },
    { id: "2", name: "Sarah Wilson" },
    { id: "3", name: "Mike Davis" }
  ]

  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case "consultation": return "bg-blue-100 text-blue-800"
      case "follow-up": return "bg-green-100 text-green-800"
      case "emergency": return "bg-red-100 text-red-800"
      case "routine": return "bg-purple-100 text-purple-800"
      case "specialist": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "reviewed": return "bg-blue-100 text-blue-800"
      case "draft": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const filteredNotes = doctorNotes.filter(note => {
    const patientMatch = selectedPatient === "all" || note.patientId === selectedPatient
    const searchMatch = searchTerm === "" || 
      note.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.notes.toLowerCase().includes(searchTerm.toLowerCase())
    return patientMatch && searchMatch
  })

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("New doctor note:", newNote)
    alert("Doctor note saved successfully!")
    setNewNote({
      patientName: "",
      doctorName: "",
      date: "",
      visitType: "",
      chiefComplaint: "",
      diagnosis: "",
      treatmentPlan: "",
      medications: "",
      followUp: "",
      notes: "",
      vitals: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        height: ""
      }
    })
    setShowNewNote(false)
  }

  const stats = {
    total: doctorNotes.length,
    completed: doctorNotes.filter(n => n.status === "completed").length,
    drafts: doctorNotes.filter(n => n.status === "draft").length,
    thisWeek: doctorNotes.filter(n => {
      const noteDate = new Date(n.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return noteDate >= weekAgo
    }).length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="mb-2">Doctor Notes</h1>
        <p className="text-muted-foreground">
          Clinical documentation, consultation notes, and treatment plans.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
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
              <Stethoscope className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-semibold">{stats.drafts}</p>
              </div>
              <Edit3 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-semibold">{stats.thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="notes">All Notes</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setShowNewNote(!showNewNote)}>
            <Plus className="h-4 w-4 mr-2" />
            {showNewNote ? "Cancel" : "New Note"}
          </Button>
        </div>

        {showNewNote && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Doctor Note</CardTitle>
              <CardDescription>Document patient consultation and treatment plan</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitNote} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      value={newNote.patientName}
                      onChange={(e) => setNewNote(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="Enter patient name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorName">Doctor Name</Label>
                    <Input
                      id="doctorName"
                      value={newNote.doctorName}
                      onChange={(e) => setNewNote(prev => ({ ...prev, doctorName: e.target.value }))}
                      placeholder="Enter doctor name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visitDate">Visit Date</Label>
                    <Input
                      id="visitDate"
                      type="date"
                      value={newNote.date}
                      onChange={(e) => setNewNote(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Visit Type</Label>
                  <Select 
                    value={newNote.visitType} 
                    onValueChange={(value: any) => setNewNote(prev => ({ ...prev, visitType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Vitals */}
                <div>
                  <h3 className="font-medium mb-3">Vital Signs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bloodPressure">Blood Pressure</Label>
                      <Input
                        id="bloodPressure"
                        value={newNote.vitals.bloodPressure}
                        onChange={(e) => setNewNote(prev => ({ 
                          ...prev, 
                          vitals: { ...prev.vitals, bloodPressure: e.target.value } 
                        }))}
                        placeholder="120/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heartRate">Heart Rate</Label>
                      <Input
                        id="heartRate"
                        value={newNote.vitals.heartRate}
                        onChange={(e) => setNewNote(prev => ({ 
                          ...prev, 
                          vitals: { ...prev.vitals, heartRate: e.target.value } 
                        }))}
                        placeholder="72 bpm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        value={newNote.vitals.temperature}
                        onChange={(e) => setNewNote(prev => ({ 
                          ...prev, 
                          vitals: { ...prev.vitals, temperature: e.target.value } 
                        }))}
                        placeholder="98.6°F"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        value={newNote.vitals.weight}
                        onChange={(e) => setNewNote(prev => ({ 
                          ...prev, 
                          vitals: { ...prev.vitals, weight: e.target.value } 
                        }))}
                        placeholder="170 lbs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        value={newNote.vitals.height}
                        onChange={(e) => setNewNote(prev => ({ 
                          ...prev, 
                          vitals: { ...prev.vitals, height: e.target.value } 
                        }))}
                        placeholder="5'8&quot;"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinical Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                    <Textarea
                      id="chiefComplaint"
                      value={newNote.chiefComplaint}
                      onChange={(e) => setNewNote(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                      placeholder="Patient's primary concern or reason for visit"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicalNotes">Clinical Notes</Label>
                    <Textarea
                      id="clinicalNotes"
                      value={newNote.notes}
                      onChange={(e) => setNewNote(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Detailed examination findings, patient history, and observations"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      value={newNote.diagnosis}
                      onChange={(e) => setNewNote(prev => ({ ...prev, diagnosis: e.target.value }))}
                      placeholder="Primary and secondary diagnoses"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                    <Textarea
                      id="treatmentPlan"
                      value={newNote.treatmentPlan}
                      onChange={(e) => setNewNote(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                      placeholder="Recommended treatments, procedures, and interventions"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medications">Medications</Label>
                    <Textarea
                      id="medications"
                      value={newNote.medications}
                      onChange={(e) => setNewNote(prev => ({ ...prev, medications: e.target.value }))}
                      placeholder="Prescribed medications with dosages and instructions"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followUp">Follow-up Instructions</Label>
                    <Textarea
                      id="followUp"
                      value={newNote.followUp}
                      onChange={(e) => setNewNote(prev => ({ ...prev, followUp: e.target.value }))}
                      placeholder="Next appointment, monitoring requirements, and patient instructions"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    Save Note
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewNote(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search notes by patient, complaint, diagnosis, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-48">
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
            </div>
          </CardContent>
        </Card>

        <TabsContent value="notes">
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getVisitTypeColor(note.visitType)}>
                        {note.visitType}
                      </Badge>
                      <div>
                        <CardTitle className="text-lg">{note.patientName}</CardTitle>
                        <CardDescription>
                          {note.doctorName} • {new Date(note.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(note.status)}>
                        {note.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Chief Complaint</h4>
                      <p className="text-sm text-muted-foreground">{note.chiefComplaint}</p>
                    </div>

                    {note.vitals && (
                      <div>
                        <h4 className="font-medium mb-2">Vital Signs</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="font-medium">BP:</span> {note.vitals.bloodPressure}
                          </div>
                          <div>
                            <span className="font-medium">HR:</span> {note.vitals.heartRate}
                          </div>
                          <div>
                            <span className="font-medium">Temp:</span> {note.vitals.temperature}
                          </div>
                          <div>
                            <span className="font-medium">Weight:</span> {note.vitals.weight}
                          </div>
                          <div>
                            <span className="font-medium">Height:</span> {note.vitals.height}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {note.diagnosis && (
                          <div>
                            <h4 className="font-medium mb-2">Diagnosis</h4>
                            <p className="text-sm text-muted-foreground">{note.diagnosis}</p>
                          </div>
                        )}

                        {note.treatmentPlan && (
                          <div>
                            <h4 className="font-medium mb-2">Treatment Plan</h4>
                            <p className="text-sm text-muted-foreground">{note.treatmentPlan}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {note.medications && (
                          <div>
                            <h4 className="font-medium mb-2">Medications</h4>
                            <p className="text-sm text-muted-foreground">{note.medications}</p>
                          </div>
                        )}

                        {note.followUp && (
                          <div>
                            <h4 className="font-medium mb-2">Follow-up</h4>
                            <p className="text-sm text-muted-foreground">{note.followUp}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {note.notes && (
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Clinical Notes</h4>
                        <p className="text-sm text-muted-foreground">{note.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredNotes.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No doctor notes match the current search and filters</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="space-y-4">
            {filteredNotes.filter(n => n.status === "draft").map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getVisitTypeColor(note.visitType)}>
                        {note.visitType}
                      </Badge>
                      <div>
                        <CardTitle className="text-lg">{note.patientName}</CardTitle>
                        <CardDescription>
                          {note.doctorName} • {new Date(note.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(note.status)}>
                        {note.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Chief Complaint</h4>
                      <p className="text-sm text-muted-foreground">{note.chiefComplaint || "Not specified"}</p>
                    </div>
                    
                    {note.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground">{note.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredNotes.filter(n => n.status === "draft").length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No draft notes found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="space-y-4">
            {filteredNotes
              .filter(n => {
                const noteDate = new Date(n.date)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return noteDate >= weekAgo
              })
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getVisitTypeColor(note.visitType)}>
                        {note.visitType}
                      </Badge>
                      <div>
                        <CardTitle className="text-lg">{note.patientName}</CardTitle>
                        <CardDescription>
                          {note.doctorName} • {new Date(note.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(note.status)}>
                      {note.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-medium mb-2">Chief Complaint</h4>
                    <p className="text-sm text-muted-foreground">{note.chiefComplaint}</p>
                  </div>
                  {note.diagnosis && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-2">Diagnosis</h4>
                      <p className="text-sm text-muted-foreground">{note.diagnosis}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {filteredNotes.filter(n => {
              const noteDate = new Date(n.date)
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return noteDate >= weekAgo
            }).length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No recent notes from the past week</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}