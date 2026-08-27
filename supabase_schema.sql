-- ==============================================================================
-- SCHEMA SUPABASE PARA MEDISCHEDULE (Cumplimiento de Rúbricas 2.3 y 2.4)
-- ==============================================================================

-- 1. TABLA PROFILES (Extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. TABLA DOCTORS (Información médica y profesional)
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  icon TEXT DEFAULT 'Stethoscope' NOT NULL,
  bio TEXT DEFAULT 'Especialista médico certificado con amplia trayectoria.',
  education TEXT DEFAULT 'Universidad Central de Medicina - Especialidad y Maestría Clínica',
  experience TEXT DEFAULT 'Más de 10 años de experiencia clínica',
  location TEXT DEFAULT 'Centro Médico MediSchedule - Consultorio 304, Piso 3',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. TABLA APPOINTMENT_SLOTS (Horarios disponibles generados por los doctores)
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  slot_date TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. TABLA APPOINTMENTS (Citas reservadas y confirmadas)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.appointment_slots(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  requirements TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'cancelled', 'reschedule-requested')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) ACTIVADO Y CONFIGURADO
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Permitir lectura de perfiles a todos los autenticados o públicos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Permitir a usuarios modificar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Permitir insertar perfil propio"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para Doctors
CREATE POLICY "Permitir lectura pública de doctores"
  ON public.doctors FOR SELECT
  USING (true);

CREATE POLICY "Permitir modificar información de doctor a usuarios autorizados"
  ON public.doctors FOR ALL
  USING (auth.uid() = profile_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'doctor'));

-- Políticas para Appointment Slots
CREATE POLICY "Permitir lectura de horarios disponibles"
  ON public.appointment_slots FOR SELECT
  USING (true);

CREATE POLICY "Permitir crear y modificar horarios a doctores o autenticados"
  ON public.appointment_slots FOR ALL
  USING (auth.role() = 'authenticated');

-- Políticas para Appointments
CREATE POLICY "Permitir a pacientes y doctores ver sus citas"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() = patient_id OR 
    auth.uid() IN (SELECT profile_id FROM public.doctors WHERE id = doctor_id) OR
    auth.role() = 'authenticated'
  );

CREATE POLICY "Permitir a pacientes crear citas"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualizar estado de citas"
  ON public.appointments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir cancelar/eliminar citas"
  ON public.appointments FOR DELETE
  USING (auth.role() = 'authenticated');

-- ==============================================================================
-- TRIGGER AUTOMÁTICO: CREAR PERFIL AL REGISTRARSE EN AUTH.USERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

  -- Si es doctor, vincular o crear entrada en tabla doctors
  IF (COALESCE(new.raw_user_meta_data->>'role', 'patient') = 'doctor') THEN
    INSERT INTO public.doctors (profile_id, name, specialty, avatar_url, icon)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Doctor ' || split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'specialty', 'Medicina General'),
      COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg'),
      'Stethoscope'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si ya existía y recrear
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- DATOS INICIALES (SEED DATA DE DOCTORES Y HORARIOS)
-- ==============================================================================

INSERT INTO public.doctors (id, name, specialty, avatar_url, icon, bio, education, experience, location)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Dra. Sarah Johnson', 'Cardiología', 'https://images.pexels.com/photos/5206931/pexels-photo-5206931.jpeg', 'HeartPulse', 'Cardióloga especialista en prevención cardiovascular, ecocardiografía y arritmias.', 'Universidad Nacional de Cardiología - Maestría Clínica', '12 años de experiencia clínica', 'Centro Médico MediSchedule - Consultorio 101, Piso 1'),
  ('a2222222-2222-2222-2222-222222222222', 'Dr. Mark Smith', 'Ortopedia', 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg', 'ClipboardPen', 'Traumatólogo y cirujano ortopédico enfocado en lesiones deportivas y rehabilitación articular.', 'Instituto de Traumatología Quirúrgica', '15 años de experiencia', 'Centro Médico MediSchedule - Consultorio 204, Piso 2'),
  ('a3333333-3333-3333-3333-333333333333', 'Dra. Emily White', 'Neurología', 'https://images.pexels.com/photos/32115955/pexels-photo-32115955.jpeg', 'Brain', 'Especialista en neurofisiología, cefaleas complejas y trastornos del sueño.', 'Facultad de Neurociencias y Medicina Interna', '8 años de experiencia', 'Centro Médico MediSchedule - Consultorio 305, Piso 3'),
  ('a4444444-4444-4444-4444-444444444444', 'Dr. David Chen', 'Medicina General', 'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg', 'Stethoscope', 'Médico familiar y general con enfoque en prevención, chequeos integrales y atención primaria.', 'Universidad de Ciencias Médicas', '10 años de experiencia', 'Centro Médico MediSchedule - Consultorio 102, Piso 1'),
  ('a5555555-5555-5555-5555-555555555555', 'Dra. Ana Pérez', 'Odontología', 'https://images.pexels.com/photos/7578810/pexels-photo-7578810.jpeg', 'ToothIcon', 'Cirujana dentista especializada en rehabilitación oral, estética y profilaxis avanzada.', 'Colegio Odontológico Internacional', '7 años de experiencia', 'Centro Médico MediSchedule - Consultorio Dental 401, Piso 4'),
  ('a6666666-6666-6666-6666-666666666666', 'Dra. Mónica Tapia', 'Obstetricia', 'https://images.pexels.com/photos/6011604/pexels-photo-6011604.jpeg', 'PersonStanding', 'Especialista en salud materna, control prenatal integral y ginecología preventiva.', 'Hospital Gineco-Obstétrico Central', '11 años de experiencia', 'Centro Médico MediSchedule - Consultorio Materno 208, Piso 2')
ON CONFLICT (id) DO NOTHING;

-- Horarios iniciales
INSERT INTO public.appointment_slots (doctor_id, slot_date, is_booked)
VALUES
  ('a1111111-1111-1111-1111-111111111111', now() + interval '1 day' + interval '9 hours', false),
  ('a1111111-1111-1111-1111-111111111111', now() + interval '1 day' + interval '10 hours', false),
  ('a1111111-1111-1111-1111-111111111111', now() + interval '1 day' + interval '14 hours', false),
  ('a2222222-2222-2222-2222-222222222222', now() + interval '2 days' + interval '10 hours', false),
  ('a2222222-2222-2222-2222-222222222222', now() + interval '2 days' + interval '11 hours 30 minutes', false),
  ('a4444444-4444-4444-4444-444444444444', now() + interval '1 day' + interval '11 hours', false),
  ('a4444444-4444-4444-4444-444444444444', now() + interval '1 day' + interval '15 hours', false)
ON CONFLICT DO NOTHING;
