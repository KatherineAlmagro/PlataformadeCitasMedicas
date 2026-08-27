# MediSchedule: Sistema de Gestión de Citas Médicas

Bienvenido a MediSchedule, una aplicación web moderna diseñada para simplificar la gestión de citas médicas tanto para pacientes como para doctores.

## Descripción

MediSchedule es un prototipo funcional que demuestra cómo se puede construir una plataforma de agendamiento de citas utilizando tecnologías web modernas. Ofrece dos portales distintos: uno para pacientes que buscan reservar citas y otro para que los doctores administren su agenda y solicitudes.

## Características Principales

### Portal del Paciente (`/paciente`)

-   **Ver Especialistas:** Explora una lista de doctores disponibles con sus especialidades y fotos de perfil.
-   **Consultar Horarios Libres:** Revisa los horarios de citas disponibles para cada doctor en tiempo real.
-   **Reservar Citas:** Completa un sencillo formulario para solicitar una cita en el horario que prefieras.
-   **Gestionar Citas:**
    -   Visualiza tus citas aprobadas y pendientes en un calendario.
    -   Cancela una cita si ya no puedes asistir.
    -   Solicita posponer una cita ya aprobada, enviando una petición al doctor.

### Portal de Administración del Doctor (`/doctor`)

-   **Gestión de Agenda:** Añade o elimina tus horarios de consulta disponibles para que los pacientes puedan reservarlos.
-   **Revisión de Solicitudes:** Visualiza una lista de las solicitudes de citas pendientes de aprobación.
-   **Aprobación/Rechazo:** Aprueba o cancela las solicitudes de los pacientes con un solo clic.
-   **Manejo de Reprogramaciones:** Recibe y gestiona las solicitudes de los pacientes para posponer una cita, pudiendo proponer una nueva fecha y hora.
-   **Visualización de Citas:** Mantén un registro de todas tus citas aprobadas.

## Cómo Empezar

Para explorar la aplicación, simplemente inicia sesión desde la página principal. No necesitas credenciales reales; solo elige un rol (Paciente o Doctor) para acceder al portal correspondiente.

-   **Página de Inicio:** [http://localhost:9002/](http://localhost:9002/)
-   **Página de Login:** [http://localhost:9002/login](http://localhost:9002/login)

## Stack Tecnológico

-   **Framework:** Next.js (con App Router)
-   **Lenguaje:** TypeScript
-   **Estilos:** Tailwind CSS
-   **Componentes UI:** shadcn/ui
-   **Base de Datos:** Firebase Firestore (para la gestión de datos en tiempo real)
-   **Iconos:** Lucide React

Este proyecto fue construido con Firebase Studio.
