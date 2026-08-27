"use client";

import { useState, useEffect } from 'react';
import type { Doctor, BookedAppointment, AppointmentSlot } from '@/lib/types';
import { AppointmentBooking } from '../appointment-booking';
import { Stethoscope, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const initialDoctors: Omit<Doctor, 'id'>[] = [
  {
    name: 'Dra. Sarah Johnson',
    specialty: 'Cardiología',
    avatarUrl: 'https://images.pexels.com/photos/5206931/pexels-photo-5206931.jpeg',
    icon: 'HeartPulse',
  },
  {
    name: 'Dr. Mark Smith',
    specialty: 'Ortopedia',
    avatarUrl: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg',
    icon: 'ClipboardPen',
  },
  {
    name: 'Dra. Emily White',
    specialty: 'Neurología',
    avatarUrl: 'https://images.pexels.com/photos/32115955/pexels-photo-32115955.jpeg',
    icon: 'Brain',
  },
  {
    name: 'Dr. David Chen',
    specialty: 'Medicina General',
    avatarUrl: 'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg',
    icon: 'Stethoscope',
  },
  {
    name: 'Dra. Ana Pérez',
    specialty: 'Odontología',
    avatarUrl: 'https://images.pexels.com/photos/7578810/pexels-photo-7578810.jpeg',
    icon: 'ToothIcon',
  },
  {
    name: 'Dra. Mónica Tapia',
    specialty: 'Obstetricia',
    avatarUrl: 'https://images.pexels.com/photos/6011604/pexels-photo-6011604.jpeg',
    icon: 'PersonStanding',
  },
];

function Header({ userName }: { userName?: string }) {
  const router = useRouter();
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
            MediSchedule
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 text-xs font-semibold text-primary">
            <UserIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground">{userName || 'Paciente Registrado'}</span>
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">Paciente</span>
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

function LoadingSkeleton() {
  return (
    <div className="space-y-16">
      <section className="text-center">
        <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
        <Skeleton className="h-4 w-3/4 mx-auto mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-60" />)}
        </div>
      </section>
      <section className="text-center">
        <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
        <Skeleton className="h-4 w-3/4 mx-auto mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </section>
    </div>
  );
}

export default function PatientPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("patient123");
  const [userName, setUserName] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    async function loadPatientData() {
      setIsLoading(true);
      try {
        // 1. Obtener usuario autenticado real o cookie
        const { data: { user } } = await supabase.auth.getUser();
        let currentUserId = "patient123";
        let resolvedName = "";

        // Leer cookie auxiliar
        if (typeof document !== 'undefined') {
          const matchName = document.cookie.match(/(^| )user_name=([^;]+)/);
          if (matchName) resolvedName = decodeURIComponent(matchName[2]);
        }
        
        if (user) {
          currentUserId = user.id;
          setUserId(user.id);
          resolvedName = user.user_metadata?.full_name || resolvedName || user.email?.split('@')[0] || "Paciente";
        }

        setUserName(resolvedName || "Paciente Registrado");

        // 2. Cargar doctores de Supabase
        const { data: doctorsData, error: docError } = await supabase
          .from('doctors')
          .select('*');

        let loadedDoctors: Doctor[] = [];

        if (doctorsData && doctorsData.length > 0) {
          loadedDoctors = doctorsData.map((d: any) => ({
            id: d.id,
            name: d.name,
            specialty: d.specialty,
            avatarUrl: d.avatar_url,
            icon: d.icon || 'Stethoscope',
          }));
        } else {
          // Si la tabla está vacía, insertar datos iniciales en Supabase
          const { data: inserted } = await supabase.from('doctors').insert(
            initialDoctors.map(d => ({
              name: d.name,
              specialty: d.specialty,
              avatar_url: d.avatarUrl,
              icon: d.icon,
            }))
          ).select();

          if (inserted) {
            loadedDoctors = inserted.map((d: any) => ({
              id: d.id,
              name: d.name,
              specialty: d.specialty,
              avatarUrl: d.avatar_url,
              icon: d.icon || 'Stethoscope',
            }));
          }
        }
        setDoctors(loadedDoctors);

        // 3. Cargar slots de horarios disponibles
        const { data: slotsData } = await supabase
          .from('appointment_slots')
          .select('*')
          .eq('is_booked', false)
          .gte('slot_date', new Date().toISOString());

        if (slotsData && slotsData.length > 0) {
          setAppointmentSlots(slotsData.map((s: any) => ({
            id: s.id,
            date: new Date(s.slot_date),
            doctorId: s.doctor_id,
          })));
        } else if (loadedDoctors.length > 0) {
          // Generar horarios de muestra si no hay
          const sampleSlots = [
            { doctor_id: loadedDoctors[0].id, slot_date: new Date(Date.now() + 86400000).toISOString(), is_booked: false },
            { doctor_id: loadedDoctors[0].id, slot_date: new Date(Date.now() + 90000000).toISOString(), is_booked: false },
            { doctor_id: loadedDoctors[1]?.id || loadedDoctors[0].id, slot_date: new Date(Date.now() + 172800000).toISOString(), is_booked: false },
          ];
          const { data: createdSlots } = await supabase.from('appointment_slots').insert(sampleSlots).select();
          if (createdSlots) {
            setAppointmentSlots(createdSlots.map((s: any) => ({
              id: s.id,
              date: new Date(s.slot_date),
              doctorId: s.doctor_id,
            })));
          }
        }

        // 4. Cargar citas del paciente
        if (currentUserId) {
          const { data: appointmentsData } = await supabase
            .from('appointments')
            .select(`
              id,
              appointment_date,
              status,
              doctor_id,
              doctors (
                id,
                name,
                specialty,
                avatar_url,
                icon
              )
            `)
            .eq('patient_id', currentUserId);

          if (appointmentsData) {
            const formatted: BookedAppointment[] = appointmentsData.map((app: any) => {
              const docInfo = Array.isArray(app.doctors) ? app.doctors[0] : app.doctors;
              return {
                id: app.id,
                date: new Date(app.appointment_date),
                doctorId: app.doctor_id,
                doctor: {
                  id: docInfo?.id || app.doctor_id,
                  name: docInfo?.name || 'Doctor',
                  specialty: docInfo?.specialty || 'Especialista',
                  avatarUrl: docInfo?.avatar_url || 'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg',
                  icon: docInfo?.icon || 'Stethoscope',
                },
                status: app.status,
              };
            });
            setBookedAppointments(formatted);
          }
        }
      } catch (err) {
        console.error("Error al cargar datos en paciente:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPatientData();
  }, []);

  const handleAppointmentBooked = (slotId: string) => {
    // Actualizar el estado local para quitar el slot reservado
    setAppointmentSlots(prev => prev.filter(slot => slot.id !== slotId));
    // Recargar citas
    if (userId) {
      supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          doctor_id,
          doctors (
            id,
            name,
            specialty,
            avatar_url,
            icon
          )
        `)
        .eq('patient_id', userId)
        .then(({ data }) => {
          if (data) {
            setBookedAppointments(data.map((app: any) => {
              const docInfo = Array.isArray(app.doctors) ? app.doctors[0] : app.doctors;
              return {
                id: app.id,
                date: new Date(app.appointment_date),
                doctorId: app.doctor_id,
                doctor: {
                  id: docInfo?.id || app.doctor_id,
                  name: docInfo?.name || 'Doctor',
                  specialty: docInfo?.specialty || 'Especialista',
                  avatarUrl: docInfo?.avatar_url || '',
                  icon: docInfo?.icon || 'Stethoscope',
                },
                status: app.status,
              };
            }));
          }
        });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header userName={userName} />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <AppointmentBooking
            doctors={doctors}
            appointmentSlots={appointmentSlots}
            onAppointmentBooked={handleAppointmentBooked}
            bookedAppointments={bookedAppointments}
            patientId={userId}
          />
        )}
      </main>
      <footer className="bg-card mt-12 border-t">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados. Conectado a Supabase.
        </div>
      </footer>
    </div>
  );
}
