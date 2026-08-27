import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, User, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getHealthCatalog } from '@/lib/api/health-api';
import { HealthGuideSection } from '@/components/health-guide-section';

// Server Component (Rúbrica 2.6 y 2.7 - Fetch con async/await desde el servidor)
export default async function Home() {
  const supabase = await createClient();
  
  // 1. Consulta a base de datos relacional Supabase
  const { data: doctors } = await supabase.from('doctors').select('*').limit(4);

  // 2. Consumo de API REST externa de salud con fetch y async/await (Rúbrica 2.7)
  const healthApiResult = await getHealthCatalog();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Público */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">
              MediSchedule
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto pt-6">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30 py-1 px-3">
            Plataforma Médica con Supabase, API REST y Next.js
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold font-headline mb-4 tracking-tight">
            Gestión Inteligente de Citas Médicas
          </h2>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Conecta con los mejores especialistas de la salud, consulta sus perfiles detallados y reserva turnos de atención al instante.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">
                <Calendar className="mr-2 h-5 w-5" /> Reservar una Cita
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                Portal de Doctores <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Roles Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="text-primary h-6 w-6"/> Para Pacientes
              </CardTitle>
              <CardDescription>Encuentra especialistas y gestiona tus citas médicas en segundos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-left text-sm text-muted-foreground space-y-2">
                <li>Búsqueda y filtros interactivos por especialidad con <code>useState</code>.</li>
                <li>Consulta de fichas médicas detalladas por ID dinámico <code>[id]</code>.</li>
                <li>Confirmación, edición y cancelación de citas con Server Actions.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="text-primary h-6 w-6"/> Para Doctores
              </CardTitle>
              <CardDescription>Consola administrativa para gestionar agenda y solicitudes.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-left text-sm text-muted-foreground space-y-2">
                <li>Añade y elimina horarios disponibles en Supabase.</li>
                <li>Aprueba o rechaza solicitudes de citas con un clic.</li>
                <li>Detección automática de conflictos de horario.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Listado Público de Especialistas (Rúbrica 2.5 - Lectura Pública) */}
        {doctors && doctors.length > 0 && (
          <section className="pt-4">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold font-headline tracking-tight">Nuestros Especialistas</h3>
              <p className="text-sm text-muted-foreground">Explora los perfiles de nuestros médicos certificados.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {doctors.map((doctor: any) => (
                <Card key={doctor.id} className="text-center p-5 flex flex-col justify-between hover:shadow-lg transition-all border-2">
                  <div className="flex flex-col items-center">
                    <Avatar className="w-20 h-20 mb-3 border-2 border-primary/20">
                      <AvatarImage src={doctor.avatar_url} alt={doctor.name} />
                      <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h4 className="font-semibold text-base">{doctor.name}</h4>
                    <p className="text-xs text-primary font-medium mt-0.5">{doctor.specialty}</p>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1" asChild>
                      <Link href={`/doctores/${doctor.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" /> Ver Ficha Detallada
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN CONSUMO API EXTERNA (Rúbrica 2.7) */}
        <HealthGuideSection apiResult={healthApiResult} />
      </main>

      {/* Footer */}
      <footer className="bg-card mt-12 border-t">
        <div className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Consumo de API REST externa (OpenFDA) + Base de Datos Supabase.
        </div>
      </footer>
    </div>
  );
}
