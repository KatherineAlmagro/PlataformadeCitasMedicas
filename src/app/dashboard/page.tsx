import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, Stethoscope, PlusCircle, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

// Server Component (Rúbrica 3.2 - dashboard/page.tsx privado)
export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Consultar perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = profile?.role || user.user_metadata?.role || 'patient';
  const fullName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0];

  // Si es paciente, obtener sus citas
  let patientAppointments: any[] = [];
  if (role === 'patient') {
    const { data: apps } = await supabase
      .from('appointments')
      .select('*, doctors(*)')
      .eq('patient_id', user.id);
    patientAppointments = apps || [];
  }

  // Si es doctor, obtener sus citas y turnos
  let doctorAppointments: any[] = [];
  if (role === 'doctor') {
    const { data: docApps } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });
    doctorAppointments = docApps || [];
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 space-y-8 max-w-5xl">
      {/* Banner de Bienvenida */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-primary border-primary/30 uppercase text-[10px]">
              Rol: {role === 'doctor' ? 'Doctor / Especialista' : 'Paciente'}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold font-headline">Hola, {fullName}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bienvenido a tu panel privado de gestión médica en MediSchedule.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href={role === 'doctor' ? '/doctor' : '/dashboard/nuevo'}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {role === 'doctor' ? 'Gestionar Agenda' : 'Agendar Nueva Cita'}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={role === 'doctor' ? '/doctor' : '/paciente'}>
              Ver Agenda Completa <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Resumen del Usuario */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6" /> Activa
            </div>
            <p className="text-xs text-muted-foreground mt-1">Autenticado vía Supabase Auth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Citas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {role === 'doctor' ? doctorAppointments.length : patientAppointments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total en tu historial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acceso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="p-0 h-auto text-primary text-sm" asChild>
              <Link href={role === 'doctor' ? '/doctor' : '/paciente'}>
                Ir al Módulo Principal →
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Gestiona tus horarios y confirmaciones</p>
          </CardContent>
        </Card>
      </div>

      {/* Listado de Citas Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Citas Médicas Próximas</CardTitle>
          <CardDescription>Visualiza el estado de tus citas programadas en tiempo real.</CardDescription>
        </CardHeader>
        <CardContent>
          {(role === 'doctor' ? doctorAppointments : patientAppointments).length > 0 ? (
            <div className="space-y-4">
              {(role === 'doctor' ? doctorAppointments : patientAppointments).slice(0, 5).map((app: any) => (
                <div key={app.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card/50 gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      {role === 'doctor' ? `Paciente: ${app.patient_name}` : `Especialista: ${app.doctors?.name || 'Doctor Asignado'}`}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {format(new Date(app.appointment_date), "EEEE, d 'de' MMMM", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(app.appointment_date), "p", { locale: es })}
                      </span>
                    </p>
                  </div>
                  <Badge variant={app.status === 'approved' ? 'default' : 'secondary'} className={app.status === 'approved' ? 'bg-green-600' : 'bg-yellow-500 text-white'}>
                    {app.status === 'approved' ? 'Confirmada' : app.status === 'pending' ? 'Pendiente' : app.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tienes citas registradas actualmente.
              <div className="mt-3">
                <Button size="sm" asChild>
                  <Link href="/dashboard/nuevo">Reservar tu primera cita</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
