"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stethoscope, User, Loader2, Lock, Mail, UserPlus, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

export default function RegisterPage() {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
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

      if (error) throw error;

      if (data.user) {
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
          description: "Tu registro se ha completado correctamente en Supabase.",
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
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <UserPlus className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline">Crear Cuenta</CardTitle>
          <CardDescription>Regístrate en MediSchedule con Supabase Auth</CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2 border border-destructive/30">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
                  placeholder="Ej. Cardiología, Neurología..."
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
                  placeholder="usuario@ejemplo.com"
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

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando Cuenta...
                </>
              ) : (
                "Completar Registro"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 justify-center border-t py-4 text-xs text-muted-foreground text-center">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Inicia Sesión aquí
            </Link>
          </p>
          <Link href="/" className="hover:underline mt-1">
            ← Volver al Inicio
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
