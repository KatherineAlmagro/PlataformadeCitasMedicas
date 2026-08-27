import { Pill, Activity, AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HealthApiResponse } from '@/lib/api/health-api';

export function HealthGuideSection({ apiResult }: { apiResult: HealthApiResponse }) {
  const { data, success, source, error } = apiResult;

  return (
    <section className="py-8 space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1.5 py-1 px-3">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> API REST Externa en Tiempo Real
          </Badge>
        </div>
        <h3 className="text-3xl font-bold font-headline tracking-tight">
          Guía Farmacológica e Información de Salud
        </h3>
        <p className="text-muted-foreground text-sm">
          Información clínica y recomendaciones obtenidas dinámicamente mediante <code>fetch</code> desde <strong>{source}</strong>.
        </p>
      </div>

      {/* Manejo de estado de error de la API (Rúbrica 2.7) */}
      {!success && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm max-w-4xl mx-auto flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Aviso de conexión de API:</p>
            <p className="text-xs mt-0.5">{error} — Mostrando información médica preventiva de respaldo.</p>
          </div>
        </div>
      )}

      {/* Grid de Datos obtenidos de la API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {data.map((item) => (
          <Card key={item.id} className="flex flex-col justify-between hover:shadow-md transition-all border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Pill className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {item.genericName.split(' ')[0]}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold line-clamp-1">{item.name}</CardTitle>
              <CardDescription className="text-xs text-primary font-medium">
                {item.genericName}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pb-4 flex-1">
              <div>
                <span className="text-xs font-semibold text-foreground/80 block mb-1">Propósito / Indicación:</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.purpose}
                </p>
              </div>

              {item.warnings && (
                <div className="pt-2 border-t text-[11px] text-muted-foreground/80 flex items-start gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item.warnings}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-0 text-[10px] text-muted-foreground border-t py-2.5 bg-muted/20">
              <span className="truncate">Fabricante: {item.manufacturer}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
