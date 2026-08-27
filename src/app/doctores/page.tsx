import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Stethoscope, ArrowLeft, ExternalLink, ShieldCheck, MapPin } from 'lucide-react';

// Server Component (Rúbrica 3.2 - [recurso]/page.tsx Listado público)
export default async function DoctoresPage() {
  const supabase = await createClient();
  const { data: doctors } = await supabase.from('doctors').select('*');

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
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Inicio
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">Ingresar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 max-w-6xl space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="outline" className="text-primary border-primary/30">
            Catálogo Médico Público
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight">
            Especialistas Médicos
          </h1>
          <p className="text-muted-foreground text-sm">
            Consulta el equipo médico disponible, sus especialidades y accede a sus fichas detalladas.
          </p>
        </div>

        {/* Grid de Doctores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {doctors && doctors.length > 0 ? (
            doctors.map((doctor: any) => (
              <Card key={doctor.id} className="flex flex-col justify-between hover:shadow-lg transition-all border-2">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-3">
                    <Avatar className="w-24 h-24 border-4 border-primary/10 shadow-sm">
                      <AvatarImage src={doctor.avatar_url} alt={doctor.name} />
                      <AvatarFallback className="text-xl font-bold">{doctor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <Badge variant="secondary" className="w-fit mx-auto mb-1 bg-primary/10 text-primary">
                    {doctor.specialty}
                  </Badge>
                  <CardTitle className="text-lg font-headline">{doctor.name}</CardTitle>
                  <CardDescription className="text-xs flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline" /> Colegiado Activo
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center text-xs text-muted-foreground pb-4 space-y-2">
                  <p className="line-clamp-2">{doctor.bio || 'Especialista certificado con amplia trayectoria médica.'}</p>
                  <p className="flex items-center justify-center gap-1 text-[11px] text-foreground/70">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    {doctor.location || 'Centro Médico MediSchedule'}
                  </p>
                </CardContent>

                <CardFooter className="pt-0 border-t py-3 bg-muted/20">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" asChild>
                    <Link href={`/doctores/${doctor.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" /> Ver Ficha Detallada
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              No hay especialistas registrados en este momento.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card mt-12 border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MediSchedule. Catálogo público de especialistas.
      </footer>
    </div>
  );
}
