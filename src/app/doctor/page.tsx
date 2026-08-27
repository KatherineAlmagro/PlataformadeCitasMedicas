"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Stethoscope, LogOut, User, Calendar, Clock, Check, X, AlertCircle, PartyPopper, Loader2, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Appointment, AppointmentSlot, Doctor } from '@/lib/types';
import { format, setHours, setMinutes, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { handleCancelAppointment, handleCreateSlot, handleDeleteSlot, handleReschedule, handleApproveAppointment } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';

function Header({ doctorName }: { doctorName?: string }) {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "session_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "user_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "user_name=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "user_email=; path=/; max-age=0; SameSite=Lax";
    window.location.href = '/login';
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">
            MediSchedule - Portal Médico
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 text-xs font-semibold text-primary">
            <User className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground">{doctorName || 'Doctor Especialista'}</span>
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">Doctor</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs">
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  );
}

function SlotManager({ doctorId, onSlotChange }: { doctorId: string | undefined; onSlotChange?: () => void }) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [allSlots, setAllSlots] = useState<AppointmentSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    setDate(new Date());
  }, []);

  const fetchSlots = async () => {
    if (!doctorId) {
      setAllSlots([]);
      return;
    }
    const { data } = await supabase
      .from('appointment_slots')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('is_booked', false);

    if (data) {
      setAllSlots(data.map((s: any) => ({
        id: s.id,
        date: new Date(s.slot_date),
        doctorId: s.doctor_id,
      })));
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [doctorId]);

  const availableSlots = useMemo(() => {
    if (!date) return [];
    return allSlots
      .filter(slot => isSameDay(slot.date, date))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allSlots, date]);

  const handleAddSlot = async () => {
    if (!date || !time || !doctorId) {
      toast({ title: "Error", description: "Por favor, seleccione un doctor, una fecha y una hora.", variant: "destructive" });
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const newDate = setMinutes(setHours(date, hours), minutes);

    setIsLoading(true);
    const result = await handleCreateSlot(doctorId, newDate);
    setIsLoading(false);

    toast({
      title: result.success ? "Éxito" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      fetchSlots();
      if (onSlotChange) onSlotChange();
    }
  };

  const handleDelete = async (slotId: string) => {
    const result = await handleDeleteSlot(slotId);
    toast({
      title: result.success ? "Éxito" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive"
    });
    if (result.success) {
      fetchSlots();
      if (onSlotChange) onSlotChange();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Horarios Disponibles</CardTitle>
        <CardDescription>Añada o elimine los horarios de consulta en Supabase para el doctor seleccionado.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(day) => day && setDate(day)}
            className="rounded-md border"
            locale={es}
            disabled={(date) => date < startOfDay(new Date()) || !doctorId}
            initialFocus
          />
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
              disabled={!doctorId}
            />
            <Button onClick={handleAddSlot} disabled={isLoading || !doctorId}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Añadir
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold text-center md:text-left">
            Horarios para {date ? format(date, "d 'de' MMMM", { locale: es }) : '...'}
          </h4>
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {availableSlots.map(slot => (
                <Badge key={slot.id} variant="outline" className="flex justify-between items-center py-2 px-3">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(slot.date, "p", { locale: es })}
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 hover:bg-destructive/10" onClick={() => handleDelete(slot.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center pt-8 h-full flex items-center justify-center">
              {!doctorId ? <p>Seleccione un doctor para ver sus horarios.</p> : <p>No hay horarios disponibles para este día.</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RescheduleDialog({ appointment, open, onOpenChange, onRescheduled }: { appointment: Appointment | null, open: boolean, onOpenChange: (open: boolean) => void, onRescheduled: () => void }) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (appointment) {
      setDate(appointment.appointmentDate);
      setTime(format(appointment.appointmentDate, "HH:mm"));
    }
  }, [appointment]);

  const handleConfirmReschedule = async () => {
    if (!appointment || !date || !time) return;

    const [hours, minutes] = time.split(':').map(Number);
    const newDate = setMinutes(setHours(date, hours), minutes);

    setIsLoading(true);
    const result = await handleReschedule(appointment.id!, newDate);
    setIsLoading(false);

    toast({
      title: result.success ? "Éxito" : "Error",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      onRescheduled();
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprogramar Cita</DialogTitle>
          <DialogDescription>
            Seleccione una nueva fecha y hora para la cita de <strong>{appointment.patientName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            locale={es}
            disabled={(date) => date < startOfDay(new Date())}
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="time" className="sr-only">Hora</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirmReschedule} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Reprogramación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DoctorPage() {
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [approvedAppointments, setApprovedAppointments] = useState<Appointment[]>([]);
  const [rescheduleAppointments, setRescheduleAppointments] = useState<Appointment[]>([]);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [conflictAppointment, setConflictAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>();

  const supabase = createClient();

  const [doctorName, setDoctorName] = useState<string>("Doctor Especialista");

  const fetchDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*');
    if (data) {
      const list: Doctor[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        avatarUrl: d.avatar_url,
        icon: d.icon || 'Stethoscope',
      }));
      setDoctors(list);
      if (!selectedDoctorId) {
        setSelectedDoctorId(list[0].id);
      }
    }
  };

  useEffect(() => {
    async function loadUser() {
      let resolved = "";
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(^| )user_name=([^;]+)/);
        if (match) resolved = decodeURIComponent(match[2]);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        resolved = user.user_metadata?.full_name || resolved || user.email?.split('@')[0] || "Doctor";
      }
      setDoctorName(resolved || "Doctor Especialista");
    }
    loadUser();
    fetchDoctors();
  }, []);

  const selectedDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const fetchAppointments = async () => {
    if (!selectedDoctorId) {
      setPendingAppointments([]);
      setApprovedAppointments([]);
      setRescheduleAppointments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', selectedDoctorId);

    if (data) {
      const pending: Appointment[] = [];
      const approved: Appointment[] = [];
      const reschedule: Appointment[] = [];

      data.forEach((row: any) => {
        const appointment: Appointment = {
          id: row.id,
          patientName: row.patient_name,
          patientId: row.patient_id || '',
          contactNumber: row.contact_number,
          requirements: row.requirements,
          appointmentDate: new Date(row.appointment_date),
          doctor: {
            id: selectedDoctor?.id || selectedDoctorId,
            name: selectedDoctor?.name || 'Doctor',
            specialty: selectedDoctor?.specialty || '',
          },
          status: row.status,
          createdAt: row.created_at,
        };

        if (row.status === 'pending') {
          pending.push(appointment);
        } else if (row.status === 'approved') {
          approved.push(appointment);
        } else if (row.status === 'reschedule-requested') {
          reschedule.push(appointment);
        }
      });

      setPendingAppointments(pending.sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
      setApprovedAppointments(approved.sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
      setRescheduleAppointments(reschedule.sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDoctorId]);

  const handleApprove = async (id: string) => {
    if (!id) return;
    const res = await handleApproveAppointment(id);
    if (res.success) {
      toast({ title: "Cita Aprobada", description: "La cita ha sido confirmada exitosamente." });
      fetchAppointments();
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setIsCancelling(true);
    const { success, message } = await handleCancelAppointment(appointmentToCancel.id!, appointmentToCancel.doctor.id, appointmentToCancel.appointmentDate);

    toast({
      title: success ? "Éxito" : "Error",
      description: message,
      variant: success ? "default" : "destructive",
    });

    setAppointmentToCancel(null);
    setIsCancelling(false);
    if (success) {
      fetchAppointments();
    }
  };

  const handleConflictClick = (appointment: Appointment) => {
    setConflictAppointment(appointment);
  };

  const handleRescheduleClick = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
  };

  const handleRejectReschedule = async (appointmentId: string) => {
    if (!appointmentId) return;
    await supabase.from('appointments').update({ status: 'approved' }).eq('id', appointmentId);
    toast({
      title: "Solicitud Rechazada",
      description: "La solicitud de reprogramación ha sido rechazada y la cita vuelve a estar aprobada.",
    });
    fetchAppointments();
  };

  const hasConflict = (pendingAppointment: Appointment): boolean => {
    return approvedAppointments.some(
      approved => approved.appointmentDate.getTime() === pendingAppointment.appointmentDate.getTime()
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header doctorName={doctorName} />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Especialista</CardTitle>
            <CardDescription>Elija un doctor registrado en Supabase para gestionar su calendario y sus citas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Seleccione un doctor..." />
              </SelectTrigger>
              <SelectContent>
                {doctors.map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
                        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <SlotManager doctorId={selectedDoctorId} onSlotChange={fetchAppointments} />

        {/* SOLICITUDES PENDIENTES */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Citas Pendientes</CardTitle>
            <CardDescription>
              {selectedDoctor ? `Mostrando solicitudes para ${selectedDoctor.name}.` : 'Seleccione un doctor para ver las solicitudes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">Cargando datos desde Supabase...</TableCell>
                  </TableRow>
                ) : !selectedDoctorId ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      Seleccione un doctor para ver las citas pendientes.
                    </TableCell>
                  </TableRow>
                ) : pendingAppointments.length > 0 ? (
                  pendingAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className={hasConflict(appointment) ? 'bg-yellow-500/10' : ''}>
                      <TableCell className="font-medium">{appointment.patientName}</TableCell>
                      <TableCell>{format(appointment.appointmentDate, "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                      <TableCell>{format(appointment.appointmentDate, "p", { locale: es })}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{appointment.requirements || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasConflict(appointment) && (
                            <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500" onClick={() => handleConflictClick(appointment)}>
                              <AlertCircle className="h-4 w-4 mr-1" /> Conflicto
                            </Button>
                          )}
                          <Button size="sm" onClick={() => handleApprove(appointment.id!)} className="bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4 mr-1" /> Aprobar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleCancelClick(appointment)}>
                            <X className="h-4 w-4 mr-1" /> Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No hay citas pendientes de confirmación.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CITAS APROBADAS */}
        <Card>
          <CardHeader>
            <CardTitle>Citas Confirmadas en Agenda</CardTitle>
            <CardDescription>Citas activas registradas en la base de datos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedAppointments.length > 0 ? (
                  approvedAppointments.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.patientName}</TableCell>
                      <TableCell>{format(app.appointmentDate, "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                      <TableCell>{format(app.appointmentDate, "p", { locale: es })}</TableCell>
                      <TableCell>{app.contactNumber}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRescheduleClick(app)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reagendar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No hay citas confirmadas actualmente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <RescheduleDialog
        appointment={appointmentToReschedule}
        open={!!appointmentToReschedule}
        onOpenChange={(open) => !open && setAppointmentToReschedule(null)}
        onRescheduled={() => {
          setAppointmentToReschedule(null);
          fetchAppointments();
        }}
      />

      <AlertDialog open={!!appointmentToCancel} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la cancelación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita en la base de datos de Supabase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} disabled={isCancelling}>
              {isCancelling ? "Cancelando..." : "Confirmar Cancelación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
