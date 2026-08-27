import { ReactNode } from 'react';
import Link from 'next/link';
import { Stethoscope, Calendar, PlusCircle, User, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <Link href="/dashboard" className="text-xl font-bold font-headline text-primary tracking-tight">
              MediSchedule Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/nuevo">
                <PlusCircle className="mr-1.5 h-4 w-4 text-primary" /> Nueva Cita
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">
                <LogOut className="mr-1.5 h-4 w-4" /> Salir
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MediSchedule. Panel de Control Protegido.
      </footer>
    </div>
  );
}
