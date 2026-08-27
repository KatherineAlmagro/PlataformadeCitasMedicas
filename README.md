# 🏥 MediSchedule - Plataforma de Citas Médicas

Plataforma web moderna y responsiva para la gestión inteligente de citas médicas, desarrollada con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL & Auth)** y consumo en tiempo real de la API pública **OpenFDA**.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | Next.js (App Router) |
| **Lenguaje** | TypeScript (`.tsx` y `.ts`) |
| **Estilos** | Tailwind CSS |
| **Base de Datos** | Supabase (PostgreSQL con RLS) |
| **Autenticación** | Supabase Auth (`@supabase/ssr`) |
| **Mutaciones** | Server Actions (`'use server'`) |
| **API Externa** | OpenFDA REST API (`fetch` + `async/await`) |
| **Control de Versiones** | Git + GitHub |
| **Despliegue** | Vercel |

---

## 📁 Estructura de Carpetas

```text
PlataformadeCitasMedicas/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout global con Navbar y fuentes
│   │   ├── page.tsx                # Página de inicio (pública, Server Component)
│   │   ├── login/
│   │   │   └── page.tsx            # Formulario de inicio de sesión (público)
│   │   ├── register/
│   │   │   └── page.tsx            # Formulario de registro (público)
│   │   ├── doctores/               # [Recurso Principal]
│   │   │   ├── page.tsx            # Listado público de especialistas
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Ficha detallada del doctor (ruta dinámica [id])
│   │   ├── dashboard/              # Panel Privado
│   │   │   ├── layout.tsx          # Layout protegido del dashboard
│   │   │   ├── page.tsx            # Resumen de citas y panel de usuario (privado)
│   │   │   └── nuevo/
│   │   │       └── page.tsx        # Formulario para agendar cita (privado)
│   │   ├── paciente/
│   │   │   └── page.tsx            # Módulo interactivo de reserva para pacientes
│   │   ├── doctor/
│   │   │   └── page.tsx            # Módulo administrativo para doctores
│   │   ├── actions.ts              # Server Actions para mutaciones en base de datos
│   │   └── globals.css             # Estilos y variables Tailwind
│   ├── components/                 # Componentes reutilizables UI
│   │   ├── health-guide-section.tsx# Componente de renderizado de API externa OpenFDA
│   │   └── ui/                     # Componentes de interfaz (Buttons, Cards, Dialogs...)
│   ├── lib/
│   │   ├── supabase.ts             # Cliente de Supabase
│   │   ├── api/
│   │   │   └── health-api.ts       # Consumo con fetch de API REST OpenFDA
│   │   ├── supabase/
│   │   │   ├── client.ts           # Cliente Browser Supabase SSR
│   │   │   ├── server.ts           # Cliente Server Supabase SSR
│   │   │   └── middleware.ts       # Validador de sesión y roles en Middleware
│   │   └── types.ts                # Interfaces y tipos TypeScript
│   └── middleware.ts               # Protección de rutas privadas (/dashboard, /paciente, /doctor)
├── supabase_schema.sql             # Script SQL de tablas, RLS, triggers y seed data
├── tailwind.config.ts              # Configuración de Tailwind CSS
├── tsconfig.json                   # Configuración de TypeScript
└── README.md                       # Documentación del proyecto
```

---

## 🗄️ Base de Datos en Supabase (PostgreSQL)

El script SQL completo [`supabase_schema.sql`](supabase_schema.sql) incluye:
1. **4 Tablas Relacionales:**
   * `profiles` : Extiende `auth.users` (`id REFERENCES auth.users(id)`), con rol (`patient` o `doctor`).
   * `doctors` : Perfil médico del especialista (`profile_id REFERENCES profiles(id)`).
   * `appointment_slots` : Horarios creados por los doctores (`doctor_id REFERENCES doctors(id)`).
   * `appointments` : Citas agendadas (`patient_id`, `doctor_id`, `slot_id`).
2. **Row Level Security (RLS):** Activado en todas las tablas con políticas de lectura, inserción y actualización.
3. **Trigger Automático:** `handle_new_user` sincroniza nuevos registros en `auth.users` hacia la tabla `profiles`.

---

## ⚙️ Configuración y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/KatherineAlmagro/PlataformadeCitasMedicas.git
   cd PlataformadeCitasMedicas
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env.local`):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://simbaecexnjstkgvskeg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qna0xgMrEon_nulHma9rTw_gpMywnXf
   ```

4. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) o el puerto asignado en tu navegador.

---

## 🌐 Consumo de API Externa (OpenFDA)
La aplicación consume en tiempo real la API REST pública de **OpenFDA** (`https://api.fda.gov/drug/label.json`) para renderizar dinámicamente una guía farmacológica y de salud preventiva en la página de inicio, implementando manejo de errores y datos de respaldo en caso de desconexión.

---

## 👤 Autora
* **Katherine Almagro** - [GitHub](https://github.com/KatherineAlmagro)
