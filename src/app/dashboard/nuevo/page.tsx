"use client";

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Stethoscope, Calendar as CalendarIcon, Clock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { handleAppointmentRequest } from '@/app/actions';
import type { Doctor } from '@/lib/types';

// Client Component (Rúbrica 3.2 - dashboard/nuevo/page.tsx Formulario de creación)
export default function NuevaCitaPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [requirements, setRequirements] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      setPatientName(user.user_metadata?.full_name || "");

      const { data: docs } = await supabase.from('doctors').select('*');
      if (docs && docs.length > 0) {
        const list: Doctor[] = docs.map((d: any) => ({
          id: d.id,
          name: d.name,
          specialty: d.specialty,
          avatarUrl: d.avatar_url,
          icon: d.icon || 'Stethoscope',
        }));
        setDoctors(list);
        setSelectedDoctorId(list[0].id);
      }
    }
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !appointmentDate) {
      toast({
        title: "Error",
        description: "Por favor complete la fecha y elija un doctor.",
        variant: "destructive",
      });
      return;
    }

    const doctor = doctors.find(d => d.id === selectedDoctorId);
    if (!doctor) return;

    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const dateObj = new Date(appointmentDate);
    dateObj.setHours(hours, minutes, 0, 0);

    startTransition(async () => {
      const res = await handleAppointmentRequest(
        {
          patientName,
          contactNumber,
          requirements,
        },
        {
          appointmentDate: dateObj,
          doctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty,
          },
          patientId: userId,
        }
      );

      if (res.confirmationStatus) {
        toast({
          title: "¡Cita Registrada!",
          description: "Tu cita médica ha sido guardada en la base de datos de Supabase.",
        });
        router.push('/dashboard');
        router.refresh();
      } else {
        toast({
          title: "Error al guardar",
          description: res.reason,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 p-0 hover:bg-transparent">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Volver al Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">Agendar Nueva Cita</h1>
        <p className="text-muted-foreground text-sm">Completa el formulario para reservar tu turno con Server Action.</p>
      </div>

      <Card className="border-2 shadow-md">
        <CardHeader>
          <CardTitle>Datos de la Cita Médica</CardTitle>
          <CardDescription>Los datos se guardarán de forma relacional en Supabase.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Especialista */}
            <div className="space-y-2">
              <Label htmlFor="doc-select">Seleccionar Especialista</Label>
              <select
                id="doc-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} - {doc.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app-date">Fecha de Atención</Label>
                <Input
                  id="app-date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-time">Hora</Label>
                <Input
                  id="app-time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Nombre y Contacto */}
            <div className="space-y-2">
              <Label htmlFor="pat-name">Nombre Completo del Paciente</Label>
              <Input
                id="pat-name"
                placeholder="Ej. Juan Pérez"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pat-phone">Teléfono de Contacto</Label>
              <Input
                id="pat-phone"
                placeholder="Ej. 0991234567"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
            </div>

            {/* Motivo de Consulta */}
            <div className="space-y-2">
              <Label htmlFor="pat-req">Motivo / Requerimientos de la Consulta</Label>
              <Textarea
                id="pat-req"
                placeholder="Describa brevemente el motivo de consulta o síntomas..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={3}
              />
            </div>

            <CardFooter className="px-0 pt-4 flex gap-3 justify-end border-t">
              <Button variant="outline" type="button" asChild>
                <Link href="/dashboard">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando en Supabase...
                  </>
                ) : (
                  "Confirmar y Guardar Cita"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
