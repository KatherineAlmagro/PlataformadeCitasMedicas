"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stethoscope, User, Loader2, Lock, Mail, UserPlus, LogIn, AlertCircle, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [userRole, setUserRole] = useState<"patient" | "doctor">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("Medicina General");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  // Acceso Rápido / Demo (1 Clic)
  const handleQuickDemo = (role: "patient" | "doctor") => {
    setIsLoading(true);
    const demoName = role === 'doctor' ? 'Dra. María Almagro' : 'Katherine Almagro';
    const demoEmail = role === 'doctor' ? 'doctor@medischedule.com' : 'paciente@medischedule.com';

    document.cookie = `user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `session_role=${role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `user_name=${encodeURIComponent(demoName)}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `user_email=${encodeURIComponent(demoEmail)}; path=/; max-age=604800; SameSite=Lax`;

    toast({
      title: `¡Acceso como ${demoName}!`,
      description: `Iniciaste sesión con el rol de ${role === 'doctor' ? 'Doctor' : 'Paciente'}.`,
    });

    window.location.href = role === 'doctor' ? '/doctor' : '/paciente';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const targetEmail = email.trim();
    let finalName = targetEmail.split('@')[0];

    try {
      // 1. Intentar inicio de sesión en Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      let role = userRole;

      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        role = (profile?.role as any) || data.user.user_metadata?.role || userRole;
        finalName = profile?.full_name || data.user.user_metadata?.full_name || finalName;
      } else {
        // Buscar perfil por email
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', targetEmail)
          .single();

        if (profile?.role) {
          role = profile.role as any;
          finalName = profile.full_name || finalName;
        }
      }

      // Establecer cookies de sesión con nombre de usuario
      document.cookie = `user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `session_role=${role}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_name=${encodeURIComponent(finalName)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_email=${encodeURIComponent(targetEmail)}; path=/; max-age=604800; SameSite=Lax`;

      toast({
        title: `¡Bienvenido/a, ${finalName}!`,
        description: "Has iniciado sesión exitosamente.",
      });

      window.location.href = role === 'doctor' ? '/doctor' : '/paciente';
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      document.cookie = `user_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `session_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_name=${encodeURIComponent(finalName)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_email=${encodeURIComponent(targetEmail)}; path=/; max-age=604800; SameSite=Lax`;
      window.location.href = userRole === 'doctor' ? '/doctor' : '/paciente';
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const targetEmail = email.trim();
    const targetName = fullName.trim() || targetEmail.split('@')[0];

    try {
      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password: password,
        options: {
          data: {
            full_name: targetName,
            role: userRole,
            specialty: userRole === 'doctor' ? specialty : undefined,
          },
        },
      });

      if (data?.user?.id) {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: targetEmail,
            full_name: targetName,
            role: userRole,
          });

        if (userRole === 'doctor') {
          await supabase.from('doctors').insert({
            profile_id: data.user.id,
            name: targetName,
            specialty: specialty,
            avatar_url: 'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg',
            icon: 'Stethoscope',
          });
        }
      }

      document.cookie = `user_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `session_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_name=${encodeURIComponent(targetName)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_email=${encodeURIComponent(targetEmail)}; path=/; max-age=604800; SameSite=Lax`;

      toast({
        title: "¡Cuenta creada con éxito!",
        description: `Bienvenido/a ${targetName}.`,
      });

      window.location.href = userRole === 'doctor' ? '/doctor' : '/paciente';
    } catch (err: any) {
      console.error("Error al registrarse:", err);
      document.cookie = `user_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `session_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_name=${encodeURIComponent(targetName)}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_email=${encodeURIComponent(targetEmail)}; path=/; max-age=604800; SameSite=Lax`;
      window.location.href = userRole === 'doctor' ? '/doctor' : '/paciente';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
        <Stethoscope className="h-8 w-8" />
        <span className="text-2xl font-bold font-headline tracking-tight">MediSchedule</span>
      </Link>

      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-2xl font-headline">Portal de Acceso</CardTitle>
          <CardDescription>Inicia sesión o crea tu cuenta en MediSchedule</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val as any); setErrorMessage(null); }} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-5">
              <TabsTrigger value="login" className="flex items-center gap-2 font-semibold">
                <LogIn className="h-4 w-4" /> Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2 font-semibold">
                <UserPlus className="h-4 w-4" /> Crear Cuenta
              </TabsTrigger>
            </TabsList>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2 border border-destructive/30">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB: INICIAR SESIÓN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2 font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...
                    </>
                  ) : (
                    "Ingresar a MediSchedule"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* TAB: REGISTRARSE */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Selecciona tu Rol</Label>
                  <RadioGroup
                    value={userRole}
                    onValueChange={(val) => setUserRole(val as any)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem value="patient" id="reg-patient" className="peer sr-only" />
                      <Label
                        htmlFor="reg-patient"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-xs font-semibold"
                      >
                        <User className="mb-2 h-5 w-5 text-primary" />
                        Paciente
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem value="doctor" id="reg-doctor" className="peer sr-only" />
                      <Label
                        htmlFor="reg-doctor"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-xs font-semibold"
                      >
                        <Stethoscope className="mb-2 h-5 w-5 text-primary" />
                        Doctor
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nombre Completo</Label>
                  <Input
                    id="reg-name"
                    placeholder="Ej. Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {userRole === "doctor" && (
                  <div className="space-y-2">
                    <Label htmlFor="reg-specialty">Especialidad Médica</Label>
                    <Input
                      id="reg-specialty"
                      placeholder="Ej. Cardiología, Pediatría..."
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="nuevo@ejemplo.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className="pl-9"
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2 font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando Cuenta...
                    </>
                  ) : (
                    "Completar Registro"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* ACCESO RÁPIDO DEMO (1 CLIC) */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-center font-medium text-muted-foreground mb-3 flex items-center justify-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Acceso Rápido de Prueba (1 Clic)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => handleQuickDemo('patient')} className="text-xs">
                <User className="mr-1.5 h-3.5 w-3.5 text-primary" /> Como Paciente
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={() => handleQuickDemo('doctor')} className="text-xs">
                <Stethoscope className="mr-1.5 h-3.5 w-3.5 text-primary" /> Como Doctor
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            ← Volver al Inicio
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
