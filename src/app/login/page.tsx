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
    document.cookie = `user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `session_role=${role}; path=/; max-age=604800; SameSite=Lax`;

    toast({
      title: `¡Acceso Demo como ${role === 'doctor' ? 'Doctor' : 'Paciente'}!`,
      description: "Has ingresado exitosamente al sistema.",
    });

    if (role === 'doctor') {
      router.push('/doctor');
    } else {
      router.push('/paciente');
    }
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Si Supabase requiere confirmación de email pero queremos inicio de sesión libre
        if (error.message.toLowerCase().includes('email not confirmed')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('email', email.trim())
            .single();

          const role = profile?.role || 'patient';
          document.cookie = `user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `session_role=${role}; path=/; max-age=604800; SameSite=Lax`;

          toast({
            title: "¡Bienvenido/a!",
            description: "Has iniciado sesión exitosamente.",
          });

          if (role === 'doctor') {
            router.push('/doctor');
          } else {
            router.push('/paciente');
          }
          router.refresh();
          return;
        }
        throw error;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role || data.user.user_metadata?.role || userRole;
        
        document.cookie = `user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `session_role=${role}; path=/; max-age=604800; SameSite=Lax`;

        toast({
          title: "¡Bienvenido/a!",
          description: "Has iniciado sesión exitosamente con Supabase.",
        });

        if (role === 'doctor') {
          router.push('/doctor');
        } else {
          router.push('/paciente');
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      setErrorMessage(err.message || "Credenciales incorrectas o usuario no registrado.");
      toast({
        title: "Error de autenticación",
        description: err.message || "Credenciales incorrectas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Registro en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: userRole,
            specialty: userRole === 'doctor' ? specialty : undefined,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // 2. Guardar en tabla profiles
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            role: userRole,
          });

        if (userRole === 'doctor') {
          await supabase.from('doctors').insert({
            profile_id: data.user.id,
            name: fullName.trim(),
            specialty: specialty,
            avatar_url: 'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg',
            icon: 'Stethoscope',
          });
        }

        document.cookie = `user_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `session_role=${userRole}; path=/; max-age=604800; SameSite=Lax`;

        toast({
          title: "¡Cuenta creada con éxito!",
          description: "Tu registro se ha completado en Supabase.",
        });

        if (userRole === 'doctor') {
          router.push('/doctor');
        } else {
          router.push('/paciente');
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error("Error al registrarse:", err);
      setErrorMessage(err.message || "Error al crear la cuenta.");
      toast({
        title: "Error al registrarse",
        description: err.message || "No se pudo completar el registro.",
        variant: "destructive",
      });
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
          <CardDescription>Inicia sesión o regístrate con Supabase Auth</CardDescription>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                    </>
                  ) : (
                    "Completar Registro"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* ACCESO RÁPIDO DEMO */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-center font-medium text-muted-foreground mb-3 flex items-center justify-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Acceso Rápido de Prueba (1 Clic)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickDemo('patient')} className="text-xs">
                <User className="mr-1.5 h-3.5 w-3.5 text-primary" /> Como Paciente
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDemo('doctor')} className="text-xs">
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
