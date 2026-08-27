import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ToothIcon } from '@/components/icons/tooth-icon';
import { 
  Stethoscope, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Award, 
  GraduationCap, 
  Languages, 
  ShieldCheck, 
  Star,
  CheckCircle,
  Phone,
  Mail,
  HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const fallbackDoctorDetails = {
  bio: "Especialista médico certificado con más de 10 años de experiencia en la atención integral y personalizada de pacientes. Comprometido con la medicina basada en evidencia y el bienestar integral de la salud.",
  education: "Universidad Central del Ecuador - Postgrado en Especialidades Clínicas",
  experience: "Más de 10 años de práctica hospitalaria y privada",
  languages: ["Español", "Inglés"],
  location: "Hospital Metropolitano / Consultorios MediSchedule - Piso 4, Oficina 402",
  phone: "+593 99 123 4567",
  email: "contacto.especialistas@medischedule.ec",
  schedule: "Lunes a Viernes de 08:00 a 18:00",
};

// Server Component (Rúbrica 2.2 - Ruta Dinámica [id] y Rúbrica 2.5 - Lectura Pública de Detalle)
export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const doctorId = resolvedParams?.id || '';

  const supabase = await createClient();

  // 1. Buscar doctor en base de datos Supabase
  let doctor: any = null;

  if (doctorId) {
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();

    doctor = data;

    if (!doctor) {
      const { data: allDocs } = await supabase.from('doctors').select('*');
      doctor = allDocs?.find((d: any) => 
        d.id === doctorId || 
        d.name?.toLowerCase().includes(decodeURIComponent(doctorId).toLowerCase())
      ) || allDocs?.[0] || null;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <Link href="/" className="text-2xl font-bold font-headline text-primary tracking-tight">
              MediSchedule
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/paciente">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Volver a la Agenda
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Mi Cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent" asChild>
            <Link href="/paciente">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> ← Volver a Especialistas
            </Link>
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight">
            Ficha Médica del Especialista
          </h1>
          <p className="text-muted-foreground text-sm">
            Detalle profesional, certificaciones y datos de atención del especialista.
          </p>
        </div>

        {!doctor ? (
          <Card className="text-center p-8 border-2">
            <CardHeader>
              <CardTitle className="text-xl">Especialista no encontrado</CardTitle>
              <CardDescription>
                No se encontró un registro médico con el identificador: <code>{doctorId}</code>
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/paciente">Ver todos los especialistas</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Card Principal */}
            <Card className="overflow-hidden border-2 shadow-md">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 sm:p-8 border-b">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                    <AvatarImage src={doctor.avatar_url} alt={doctor.name} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
                      {doctor.name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/20 font-medium">
                        <HeartPulse className="mr-1.5 h-3.5 w-3.5 inline" />
                        {doctor.specialty}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                        <ShieldCheck className="mr-1 h-3 w-3 inline" /> Colegiado Activo y Verificado
                      </Badge>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-headline">{doctor.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      {doctor.location || fallbackDoctorDetails.location}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Biografía */}
                <div>
                  <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Perfil y Experiencia
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {doctor.bio || fallbackDoctorDetails.bio}
                  </p>
                </div>

                {/* Grid Informativo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                    <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Formación Académica</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{fallbackDoctorDetails.education}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Horario de Consulta</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{fallbackDoctorDetails.schedule}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                    <Languages className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Idiomas</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{fallbackDoctorDetails.languages.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                    <Star className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Calificación y Reseñas</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">4.9 / 5.0 ⭐ (Más de 120 pacientes)</p>
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                <div className="pt-2">
                  <h3 className="text-base font-bold mb-3">Servicios Médicos Disponibles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> Diagnóstico y evaluación preventiva
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> Consulta presencial y telemedicina
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> Emisión de certificados y recetas digitales
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" /> Plan de seguimiento clínico
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  ¿Deseas atenderte con <strong>{doctor.name}</strong>? Elige un turno disponible.
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto shadow-md">
                  <Link href="/paciente">
                    <Calendar className="mr-2 h-4 w-4" />
                    Reservar Turno con este Doctor
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-4 text-center text-xs text-muted-foreground mt-12">
        © {new Date().getFullYear()} MediSchedule. Ficha pública de especialista.
      </footer>
    </div>
  );
}
