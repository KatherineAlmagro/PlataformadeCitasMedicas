"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Doctor } from '@/lib/types';
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
  icons
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const customIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  ToothIcon: ToothIcon,
};

const fallbackDoctorDetails = {
  bio: "Especialista médico certificado con amplia trayectoria en el diagnóstico y tratamiento integral de pacientes, comprometido con la excelencia y la calidez en la atención médica.",
  education: "Universidad Central de Medicina - Especialidad y Maestría Clínica",
  experience: "Más de 10 años de experiencia clínica",
  languages: ["Español", "Inglés"],
  location: "Centro Médico MediSchedule - Consultorio 304, Piso 3",
};

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const doctorId = resolvedParams.id;
  const router = useRouter();
  const supabase = createClient();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctor() {
      setIsLoading(true);
      try {
        // Buscar doctor por ID en Supabase
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', doctorId)
          .single();

        if (data) {
          setDoctor({
            id: data.id,
            name: data.name,
            specialty: data.specialty,
            avatarUrl: data.avatar_url,
            icon: data.icon || 'Stethoscope',
          });
        } else {
          // Si no lo encuentra por ID exacto, buscar todos
          const { data: allDocs } = await supabase.from('doctors').select('*');
          const found = allDocs?.find((d: any) => d.id === doctorId || d.name?.toLowerCase().includes(decodeURIComponent(doctorId).toLowerCase()));
          if (found) {
            setDoctor({
              id: found.id,
              name: found.name,
              specialty: found.specialty,
              avatarUrl: found.avatar_url,
              icon: found.icon || 'Stethoscope',
            });
          } else {
            setDoctor(null);
          }
        }
      } catch (error) {
        console.error("Error al cargar doctor desde Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const IconComponent = doctor?.icon && (icons[doctor.icon as keyof typeof icons] || customIcons[doctor.icon]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline text-primary tracking-tight">
              MediSchedule
            </span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/paciente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la Agenda
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" className="mb-2 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver atrás
          </Button>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Ficha del Especialista</h1>
          <p className="text-muted-foreground text-sm">Información detallada, acreditaciones y disponibilidad de citas.</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !doctor ? (
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle className="text-xl">Especialista no encontrado</CardTitle>
              <CardDescription>No pudimos encontrar el doctor con el identificador: <code>{doctorId}</code></CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild>
                <Link href="/paciente">Ver todos los especialistas</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Tarjeta Principal de Presentación */}
            <Card className="overflow-hidden border-2 shadow-md">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 sm:p-8 border-b">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                    <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
                    <AvatarFallback className="text-2xl font-bold">{doctor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/20 font-medium">
                        {IconComponent && <IconComponent className="mr-1.5 h-3.5 w-3.5 inline" />}
                        {doctor.specialty}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                        <ShieldCheck className="mr-1 h-3 w-3 inline" /> Colegiado Activo
                      </Badge>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-headline">{doctor.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      {fallbackDoctorDetails.location}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Biografía */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Perfil Profesional
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {fallbackDoctorDetails.bio}
                  </p>
                </div>

                {/* Grid de Información Detallada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-lg border bg-card/50">
                    <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Formación y Especialidad</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{fallbackDoctorDetails.education}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-lg border bg-card/50">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Experiencia Médica</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{fallbackDoctorDetails.experience}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-lg border bg-card/50">
                    <Languages className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Idiomas de Atención</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{fallbackDoctorDetails.languages.join(', ')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-lg border bg-card/50">
                    <Star className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">Modalidad de Consulta</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Presencial y Telemedicina disponible</p>
                    </div>
                  </div>
                </div>

                {/* Servicios ofrecidos */}
                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-3">Servicios y Procedimientos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" /> Consulta médica especializada
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" /> Evaluación y diagnóstico preventivo
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" /> Emisión de recetas e informes
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary" /> Seguimiento continuo de tratamiento
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  Para reservar cita con este especialista, selecciona un turno disponible en la agenda.
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto shadow-md">
                  <Link href="/paciente">
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar Cita en la Agenda
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-4 text-center text-xs text-muted-foreground mt-12">
        © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados.
      </footer>
    </div>
  );
}
