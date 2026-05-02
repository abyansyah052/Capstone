import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import { Calendar, Clock, User, Phone, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface Appointment {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  date: string
  time: string
  doctor: string
  type: string
  status: "scheduled" | "confirmed" | "completed" | "cancelled"
  notes: string
}

export function AppointmentScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  
  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      patientId: "MED-851234-567",
      patientName: "John Smith",
      patientPhone: "(555) 123-4567",
      date: "2024-09-11",
      time: "09:00",
      doctor: "Dr. Johnson",
      type: "General Checkup",
      status: "scheduled",
      notes: "Annual physical examination"
    },
    {
      id: "2",
      patientId: "MED-921125-890",
      patientName: "Sarah Wilson",
      patientPhone: "(555) 234-5678",
      date: "2024-09-11",
      time: "10:30",
      doctor: "Dr. Smith",
      type: "Follow-up",
      status: "confirmed",
      notes: "Blood pressure monitoring"
    },
    {
      id: "3",
      patientId: "MED-780912-345",
      patientName: "Mike Davis",
      patientPhone: "(555) 345-6789",
      date: "2024-09-11",
      time: "14:00",
      doctor: "Dr. Johnson",
      type: "Consultation",
      status: "completed",
      notes: "Discuss test results"
    }
  ])

  const [newAppointment, setNewAppointment] = useState({
    patientId: "",
    patientName: "",
    patientPhone: "",
    date: "",
    time: "",
    doctor: "",
    type: "",
    notes: ""
  })

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ]

  const doctors = ["Dr. Johnson", "Dr. Smith", "Dr. Brown", "Dr. Wilson"]
  const appointmentTypes = ["General Checkup", "Follow-up", "Consultation", "Emergency", "Specialist Visit"]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled": return <Clock className="h-4 w-4" />
      case "confirmed": return <CheckCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800"
      case "confirmed": return "bg-green-100 text-green-800"
      case "completed": return "bg-gray-100 text-gray-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleSubmitAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("New appointment:", newAppointment)
    alert("Appointment scheduled successfully!")
    setNewAppointment({
      patientName: "",
      patientPhone: "",
      date: "",
      time: "",
      doctor: "",
      type: "",
      notes: ""
    })
    setShowNewAppointment(false)
  }

  const filteredAppointments = appointments.filter(apt => apt.date === selectedDate)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="mb-2">Appointment Scheduling</h1>
        <p className="text-muted-foreground">
          Schedule, manage, and track patient appointments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
              <CardDescription>Select date and manage appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">Select Date</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={() => setShowNewAppointment(!showNewAppointment)}
                className="w-full"
              >
                {showNewAppointment ? "Cancel" : "Schedule New Appointment"}
              </Button>

              {/* Quick Stats */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today's Appointments</span>
                  <Badge variant="secondary">{filteredAppointments.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <Badge variant="default">
                    {filteredAppointments.filter(apt => apt.status === "confirmed").length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <Badge variant="outline">
                    {filteredAppointments.filter(apt => apt.status === "completed").length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2">
          {showNewAppointment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Schedule New Appointment</CardTitle>
                <CardDescription>Create a new appointment for a patient</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitAppointment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientId">Patient ID</Label>
                      <Input
                        id="patientId"
                        value={newAppointment.patientId}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, patientId: e.target.value }))}
                        placeholder="MED-123456-789"
                        className="font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        value={newAppointment.patientName}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, patientName: e.target.value }))}
                        placeholder="Enter patient name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="patientPhone">Patient Phone</Label>
                      <Input
                        id="patientPhone"
                        type="tel"
                        value={newAppointment.patientPhone}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, patientPhone: e.target.value }))}
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appointmentDateNew">Date</Label>
                      <Input
                        id="appointmentDateNew"
                        type="date"
                        value={newAppointment.date}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select 
                        value={newAppointment.time} 
                        onValueChange={(value) => setNewAppointment(prev => ({ ...prev, time: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Doctor</Label>
                      <Select 
                        value={newAppointment.doctor} 
                        onValueChange={(value) => setNewAppointment(prev => ({ ...prev, doctor: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(doctor => (
                            <SelectItem key={doctor} value={doctor}>{doctor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Appointment Type</Label>
                    <Select 
                      value={newAppointment.type} 
                      onValueChange={(value) => setNewAppointment(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select appointment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentNotes">Notes</Label>
                    <Textarea
                      id="appointmentNotes"
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes or special instructions"
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Schedule Appointment
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Appointments for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
              <CardDescription>
                {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.time}</span>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(appointment.status)}
                              {appointment.status}
                            </div>
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.patientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                            <span className="font-mono font-medium">{appointment.patientId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{appointment.patientPhone}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Doctor:</span> {appointment.doctor}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Type:</span> {appointment.type}
                          </p>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}