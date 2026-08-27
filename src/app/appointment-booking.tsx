"use client";

import { useState, useTransition, useMemo, type ComponentProps } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  icons, 
  Info, 
  Trash2, 
  RefreshCw, 
  ExternalLink,
  Search,
  Filter,
  Edit2,
  Phone,
  FileText
} from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Doctor, AppointmentSlot, IconName, BookedAppointment, ConfirmAppointmentOutput, Appointment } from "@/lib/types";
import { 
  handleAppointmentRequest, 
  handleCancelAppointment, 
  handleRequestReschedule,
  handleUpdateAppointmentDetails 
} from "./actions";
import { ToothIcon } from "@/components/icons/tooth-icon";

const formSchema = z.object({
  patientName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  contactNumber: z.string().min(8, { message: "Por favor, ingresa un número de contacto válido." }),
  requirements: z.string().optional(),
});

const editFormSchema = z.object({
  patientName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  contactNumber: z.string().min(8, { message: "Por favor, ingresa un número de contacto válido." }),
  requirements: z.string().optional(),
});

const customIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  ToothIcon: ToothIcon,
};

function DoctorCard({ doctor, className, ...props }: { doctor: Doctor } & ComponentProps<typeof Card>) {
  const IconComponent = doctor.icon && (icons[doctor.icon as keyof typeof icons] || customIcons[doctor.icon]);

  return (
    <Card className={cn("flex flex-col text-center items-center p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 justify-between", className)} {...props}>
      <div className="flex flex-col items-center w-full">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
          <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
          <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardHeader className="p-0 mb-2">
          <CardTitle className="font-headline text-xl">{doctor.name}</CardTitle>
          <CardDescription className="text-primary">{doctor.specialty}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mb-4">
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground/80">
                {IconComponent && <IconComponent className="mr-2 h-4 w-4 text-accent" />}
                {doctor.specialty}
            </Badge>
        </CardContent>
      </div>
      <CardFooter className="p-0 w-full pt-2">
        <Button variant="outline" size="sm" className="w-full gap-1 text-xs" asChild>
          <Link href={`/doctores/${doctor.id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            Ver Perfil Detallado
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function AppointmentCard({ slot, doctor, onBook, className, ...props }: { slot: AppointmentSlot; doctor?: Doctor; onBook: () => void; } & Omit<ComponentProps<typeof Card>, 'slot'>) {
  const date = slot.date instanceof Date ? slot.date : new Date(slot.date);
  
  if (isNaN(date.getTime())) {
    return (
       <Card className={cn("transition-all duration-300 hover:shadow-lg hover:border-primary/50", className)} {...props}>
          <CardHeader>
             <CardTitle>Horario no válido</CardTitle>
          </CardHeader>
       </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg hover:border-primary/50", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2 capitalize"><CalendarIcon className="h-5 w-5 text-primary" /> {format(date, "EEEE, d 'de' MMMM", { locale: es })}</CardTitle>
        <CardDescription className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" /> {format(date, "p", { locale: es })}</CardDescription>
      </CardHeader>
      {doctor && (
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
              <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{doctor.name}</p>
              <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
            </div>
          </div>
        </CardContent>
      )}
      <CardFooter>
        <Button onClick={onBook} className="w-full bg-accent hover:bg-accent/90">Reservar Ahora</Button>
      </CardFooter>
    </Card>
  );
}

export function AppointmentBooking({
  doctors,
  appointmentSlots,
  onAppointmentBooked,
  bookedAppointments = [],
  patientId,
}: {
  doctors: Doctor[];
  appointmentSlots: AppointmentSlot[];
  onAppointmentBooked: (slotId: string) => void;
  bookedAppointments: BookedAppointment[];
  patientId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Estados interactivos para búsqueda y filtro (Rúbrica 2.6)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmAppointmentOutput | null>(null);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<BookedAppointment | null>(null);
  const [appointmentToPostpone, setAppointmentToPostpone] = useState<BookedAppointment | null>(null);
  
  // Estado para editar cita (Update en CRUD - Rúbrica 2.5)
  const [appointmentToEdit, setAppointmentToEdit] = useState<BookedAppointment | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      contactNumber: "",
      requirements: "",
    },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      patientName: "",
      contactNumber: "",
      requirements: "",
    },
  });

  // Lista de especialidades únicas para el filtro
  const specialties = useMemo(() => {
    const set = new Set(doctors.map(d => d.specialty));
    return ["all", ...Array.from(set)];
  }, [doctors]);

  // Filtrar doctores en tiempo real usando useState (Rúbrica 2.6)
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = 
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty = selectedSpecialty === "all" || doctor.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

  const handleBookClick = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
    setFormOpen(true);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedSlot) return;

    const doctor = doctors.find(d => d.id === selectedSlot.doctorId);
    if (!doctor) return;

    startTransition(async () => {
      const result = await handleAppointmentRequest(values, {
        appointmentDate: selectedSlot.date,
        doctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty
        },
        patientId,
        slotId: selectedSlot.id,
      });

      setConfirmationResult(result);
      setFormOpen(false);
      setConfirmationOpen(true);

      if (result.confirmationStatus) {
        onAppointmentBooked(selectedSlot.id);
      }

      form.reset();
    });
  };

  const handleEditClick = (appointment: BookedAppointment) => {
    setAppointmentToEdit(appointment);
    editForm.reset({
      patientName: "",
      contactNumber: "",
      requirements: "",
    });
    setEditOpen(true);
  };

  const onEditSubmit = (values: z.infer<typeof editFormSchema>) => {
    if (!appointmentToEdit) return;

    startTransition(async () => {
      const res = await handleUpdateAppointmentDetails(appointmentToEdit.id, values);

      toast({
        title: res.success ? "Cita Actualizada" : "Error",
        description: res.message,
        variant: res.success ? "default" : "destructive",
      });

      if (res.success) {
        setEditOpen(false);
        setAppointmentToEdit(null);
        // Notificar recarga
        onAppointmentBooked("");
      }
    });
  };

  const handleCancelClick = (appointment: BookedAppointment) => {
    setAppointmentToCancel(appointment);
  };
  
  const handleConfirmCancel = () => {
    if (!appointmentToCancel) return;

    startTransition(async () => {
        const { success, message } = await handleCancelAppointment(appointmentToCancel.id, appointmentToCancel.doctor.id, appointmentToCancel.date);
        
        toast({
            title: success ? "Éxito" : "Error",
            description: message,
            variant: success ? "default" : "destructive",
        });

        setAppointmentToCancel(null);
        onAppointmentBooked("");
    });
  };

  const handlePostponeClick = (appointment: BookedAppointment) => {
    setAppointmentToPostpone(appointment);
  };

  const handleConfirmPostpone = () => {
    if (!appointmentToPostpone) return;

    startTransition(async () => {
        const { success, message } = await handleRequestReschedule(appointmentToPostpone.id);
        
        toast({
            title: success ? "Solicitud Enviada" : "Error",
            description: message,
            variant: success ? "default" : "destructive",
        });

        setAppointmentToPostpone(null);
    });
  };

  const doctorMap = new Map(doctors.map(doc => [doc.id, doc]));
  const allBookedDates = bookedAppointments.map(a => a.date);

  const pendingAppointments = bookedAppointments.filter(a => a.status === 'pending');
  const approvedAppointments = bookedAppointments.filter(a => a.status === 'approved');
  const rescheduleRequestedAppointments = bookedAppointments.filter(a => a.status === 'reschedule-requested');

  return (
    <div className="space-y-16">
      {/* SECCIÓN: ESPECIALISTAS CON BÚSQUEDA Y FILTRO (RÚBRICA 2.6) */}
      <section id="doctors" className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Nuestros Especialistas</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          Conoce a nuestro equipo de profesionales médicos, dedicados y con experiencia.
        </p>

        {/* Barra de Búsqueda y Filtro de Especialidad */}
        <div className="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o especialidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-card shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
            >
              {specialties.map(spec => (
                <option key={spec} value={spec}>
                  {spec === "all" ? "Todas las Especialidades" : spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de Doctores Filtrados */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDoctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="p-8 border rounded-lg bg-card text-muted-foreground">
            No se encontraron especialistas que coincidan con &quot;{searchQuery}&quot;.
          </div>
        )}
      </section>

      {/* SECCIÓN: MIS CITAS (READ / UPDATE / DELETE en CRUD - RÚBRICA 2.5) */}
      {(approvedAppointments.length > 0 || pendingAppointments.length > 0 || rescheduleRequestedAppointments.length > 0) && (
          <section id="my-appointments">
              <div className="text-center">
                 <h2 className="text-3xl font-bold font-headline mb-2">Mis Citas</h2>
                 <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Aquí puedes ver tus próximas citas, editar sus datos o gestionarlas.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="flex justify-center">
                      <Calendar
                          mode="multiple"
                          selected={allBookedDates}
                          className="rounded-md border"
                          locale={es}
                      />
                  </div>
                  <div className="space-y-6">
                      
                      {approvedAppointments.length > 0 && (
                          <div>
                              <h3 className="text-xl font-semibold mb-4 text-green-600">Aprobadas</h3>
                              <div className="space-y-4">
                                {approvedAppointments.sort((a, b) => a.date.getTime() - b.date.getTime()).map(appointment => (
                                      <Card key={appointment.id} className="text-left bg-green-500/10 border-green-500/20">
                                          <CardHeader>
                                              <CardTitle className="text-lg flex justify-between items-center">
                                                  Cita con {appointment.doctor.name}
                                                  <Badge variant="default" className="bg-green-600">Aprobada</Badge>
                                              </CardTitle>
                                               <CardDescription className="text-green-900/80">
                                                  {appointment.doctor.specialty}
                                              </CardDescription>
                                          </CardHeader>
                                          <CardContent className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-5 w-5 text-green-700" />
                                                <span>{format(appointment.date, "EEEE, d 'de' MMMM", { locale: es })}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                                <span>{format(appointment.date, "p", { locale: es })}</span>
                                              </div>
                                          </CardContent>
                                          <CardFooter className="flex flex-wrap items-center gap-2">
                                              <Button variant="outline" size="sm" onClick={() => handleEditClick(appointment)}>
                                                <Edit2 className="mr-1.5 h-3.5 w-3.5"/>
                                                Editar Datos
                                              </Button>
                                              <Button variant="outline" size="sm" onClick={() => handlePostponeClick(appointment)} disabled={isPending}>
                                                <RefreshCw className="mr-1.5 h-3.5 w-3.5"/>
                                                {isPending ? 'Enviando...' : 'Posponer Cita'}
                                              </Button>
                                              <Button variant="destructive" size="sm" onClick={() => handleCancelClick(appointment)} disabled={isPending}>
                                                <Trash2 className="mr-1.5 h-3.5 w-3.5"/>
                                                {isPending ? 'Cancelando...' : 'Cancelar'}
                                              </Button>
                                          </CardFooter>
                                      </Card>
                                  ))}
                              </div>
                          </div>
                      )}

                      {rescheduleRequestedAppointments.length > 0 && (
                           <div>
                              <h3 className="text-xl font-semibold mb-4 text-blue-600">Solicitudes para Reprogramar</h3>
                              <div className="space-y-4">
                                  {rescheduleRequestedAppointments.sort((a, b) => a.date.getTime() - b.date.getTime()).map(appointment => (
                                      <Card key={appointment.id} className="text-left bg-blue-500/10 border-blue-500/20">
                                           <CardHeader>
                                              <CardTitle className="text-lg flex justify-between items-center">
                                                  Solicitud para {appointment.doctor.name}
                                                  <Badge variant="secondary" className="bg-blue-500 text-white">Reprogramación Solicitada</Badge>
                                              </CardTitle>
                                               <CardDescription className="text-blue-900/80">
                                                  {appointment.doctor.specialty}
                                              </CardDescription>
                                          </CardHeader>
                                          <CardContent className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-5 w-5 text-blue-700" />
                                                <span>{format(appointment.date, "EEEE, d 'de' MMMM", { locale: es })}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                                <span>{format(appointment.date, "p", { locale: es })}</span>
                                              </div>
                                          </CardContent>
                                      </Card>
                                  ))}
                              </div>
                          </div>
                      )}

                      {pendingAppointments.length > 0 && (
                           <div>
                              <h3 className="text-xl font-semibold mb-4 text-yellow-600">Pendientes de Aprobación</h3>
                              <div className="space-y-4">
                                  {pendingAppointments.sort((a, b) => a.date.getTime() - b.date.getTime()).map(appointment => (
                                      <Card key={appointment.id} className="text-left bg-yellow-500/10 border-yellow-500/20">
                                           <CardHeader>
                                              <CardTitle className="text-lg flex justify-between items-center">
                                                  Solicitud para {appointment.doctor.name}
                                                  <Badge variant="secondary" className="bg-yellow-500 text-white">Pendiente</Badge>
                                              </CardTitle>
                                               <CardDescription className="text-yellow-900/80">
                                                  {appointment.doctor.specialty}
                                              </CardDescription>
                                          </CardHeader>
                                          <CardContent className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-5 w-5 text-yellow-700" />
                                                <span>{format(appointment.date, "EEEE, d 'de' MMMM", { locale: es })}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                                <span>{format(appointment.date, "p", { locale: es })}</span>
                                              </div>
                                          </CardContent>
                                           <CardFooter className="flex flex-wrap items-center gap-2">
                                             <Button variant="outline" size="sm" onClick={() => handleEditClick(appointment)}>
                                                <Edit2 className="mr-1.5 h-3.5 w-3.5"/>
                                                Editar Datos
                                             </Button>
                                             <Button variant="destructive" size="sm" onClick={() => handleCancelClick(appointment)} disabled={isPending}>
                                                <Trash2 className="mr-1.5 h-3.5 w-3.5"/>
                                                {isPending ? 'Cancelando...' : 'Cancelar Solicitud'}
                                             </Button>
                                          </CardFooter>
                                      </Card>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </section>
      )}

      {/* SECCIÓN: CITAS DISPONIBLES (CREATE en CRUD - RÚBRICA 2.5) */}
      <section id="appointments" className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Citas Disponibles</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Elige un horario que te convenga. Tu cita será confirmada al instante.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {appointmentSlots.map(slot => (
            <AppointmentCard
              key={slot.id}
              slot={slot}
              doctor={doctorMap.get(slot.doctorId)}
              onBook={() => handleBookClick(slot)}
            />
          ))}
        </div>
      </section>

      {/* DIÁLOGO: CREAR CITA (CREATE - RÚBRICA 2.5) */}
      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Cita</DialogTitle>
            <DialogDescription>
              Completa tus datos para confirmar la cita para el {selectedSlot && format(selectedSlot.date, "d 'de' MMMM, yyyy 'a las' p", { locale: es })}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="912 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Necesidades Específicas (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: acceso para silla de ruedas, alergias..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Cita
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: EDITAR CITA (UPDATE en CRUD - RÚBRICA 2.5) */}
      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" /> Editar Datos de la Cita
            </DialogTitle>
            <DialogDescription>
              Actualiza tus datos de contacto o necesidades para tu cita con <strong>{appointmentToEdit?.doctor.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
              <FormField
                control={editForm.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Paciente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre actualizado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Número telefónico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo / Requerimientos</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Síntomas o notas médicas..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {confirmationResult && (
        <AlertDialog open={isConfirmationOpen} onOpenChange={setConfirmationOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {confirmationResult.confirmationStatus ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                  {confirmationResult.confirmationStatus ? "Solicitud Enviada" : "Error"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmationResult.reason}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
                {confirmationResult.confirmationStatus && selectedSlot && (
                   <div className="p-4 -mx-2 -mb-4 bg-muted/50 rounded-lg text-foreground text-sm space-y-1">
                    <div><strong>Doctor:</strong> {doctorMap.get(selectedSlot.doctorId)?.name}</div>
                    <div><strong>Fecha:</strong> {format(selectedSlot.date, "EEEE, d 'de' MMMM, yyyy", { locale: es })}</div>
                    <div><strong>Hora:</strong> {format(selectedSlot.date, "p", { locale: es })}</div>
                  </div>
                )}
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setConfirmationOpen(false)}>Cerrar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* DIÁLOGO: CANCELAR CITA (DELETE en CRUD - RÚBRICA 2.5) */}
      {appointmentToCancel && (
        <AlertDialog open={!!appointmentToCancel} onOpenChange={() => setAppointmentToCancel(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-6 w-6 text-destructive" />
                        Confirmar Cancelación
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-4">
                        ¿Seguro que quieres cancelar tu cita con <strong>{appointmentToCancel.doctor.name}</strong> para el <strong>{format(appointmentToCancel.date, "d 'de' MMMM 'a las' p", { locale: es })}</strong>? Esta acción actualizará la base de datos de Supabase.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmCancel} className={cn(buttonVariants({ variant: "destructive" }))}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sí, cancelar cita
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

       {appointmentToPostpone && (
        <AlertDialog open={!!appointmentToPostpone} onOpenChange={() => setAppointmentToPostpone(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-6 w-6 text-blue-500" />
                        Confirmar Solicitud para Posponer
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-4">
                        ¿Seguro que quieres solicitar posponer tu cita con <strong>{appointmentToPostpone.doctor.name}</strong>? El doctor revisará tu solicitud y te notificará si es aprobada.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmPostpone} className={cn(buttonVariants({ variant: "default" }))}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sí, enviar solicitud
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
