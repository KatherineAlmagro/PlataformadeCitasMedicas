
import type { icons } from 'lucide-react';
export type IconName = keyof typeof icons | 'ToothIcon';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  icon: IconName;
}

export interface AppointmentSlot {
  id: string;
  date: Date;
  doctorId: string;
}

// Representa la estructura de datos relacional de Cita
export interface Appointment {
  id?: string;
  patientName: string;
  patientId: string;
  contactNumber: string;
  requirements?: string;
  appointmentDate: Date;
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  status: 'pending' | 'approved' | 'cancelled' | 'reschedule-requested';
  createdAt?: string | Date;
}


export interface BookedAppointment {
  id: string;
  date: Date;
  doctorId: string;
  doctor: Doctor;
  status: 'pending' | 'approved' | 'cancelled' | 'reschedule-requested';
}

export interface ConfirmAppointmentInput {
  patientName: string;
  contactNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  requirements?: string;
}

export interface ConfirmAppointmentOutput {
  confirmationStatus: boolean;
  reason: string;
  suggestedAlternative?: string;
}

