'use server';

import type { ConfirmAppointmentOutput } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export async function handleAppointmentRequest(
  formData: { patientName: string; contactNumber: string; requirements?: string },
  appointmentDetails: { appointmentDate: Date; doctor: { id: string; name: string; specialty: string; }; patientId: string; slotId?: string; }
): Promise<ConfirmAppointmentOutput> {
  const { patientId, doctor, appointmentDate, slotId } = appointmentDetails;

  try {
    const supabase = await createClient();

    // 1. Insertar la cita en la tabla 'appointments'
    const { error: insertError } = await supabase.from('appointments').insert({
      patient_id: patientId && patientId !== '00000000-0000-0000-0000-000000000000' ? patientId : null,
      doctor_id: doctor.id,
      slot_id: slotId || null,
      patient_name: formData.patientName,
      contact_number: formData.contactNumber,
      requirements: formData.requirements || null,
      appointment_date: appointmentDate.toISOString(),
      status: 'pending',
    });

    if (insertError) {
      console.error("Error inserting appointment into Supabase:", insertError);
      throw insertError;
    }

    // 2. Marcar el slot como reservado si existe
    if (slotId) {
      await supabase.from('appointment_slots').update({ is_booked: true }).eq('id', slotId);
    }

    return {
      confirmationStatus: true,
      reason: "Tu solicitud ha sido enviada. El doctor la revisará y recibirás una notificación cuando sea aprobada.",
    };
  } catch (error) {
    console.error("Error creating appointment request:", error);
    return {
      confirmationStatus: false,
      reason: "Ocurrió un error al procesar tu solicitud en la base de datos.",
    };
  }
}

export async function handleCancelAppointment(appointmentId: string, doctorId: string, appointmentDate: Date): Promise<{ success: boolean; message: string }> {
  if (!appointmentId) {
    return { success: false, message: "Faltan datos para la cancelación." };
  }

  try {
    const supabase = await createClient();

    // Actualizar estado a 'cancelled' o eliminar
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    if (error) throw error;

    return { success: true, message: "La cita ha sido cancelada exitosamente." };
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return { success: false, message: "Ocurrió un error al cancelar la cita." };
  }
}

export async function handleCreateSlot(doctorId: string, date: Date): Promise<{ success: boolean; message: string }> {
  if (!doctorId || !date) {
    return { success: false, message: "Faltan datos para crear el horario." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from('appointment_slots').insert({
      doctor_id: doctorId,
      slot_date: date.toISOString(),
      is_booked: false,
    });

    if (error) throw error;

    return { success: true, message: "Horario creado exitosamente en Supabase." };
  } catch (error) {
    console.error("Error creating slot:", error);
    return { success: false, message: "Ocurrió un error al crear el horario." };
  }
}

export async function handleDeleteSlot(slotId: string): Promise<{ success: boolean; message: string }> {
  if (!slotId) {
    return { success: false, message: "Falta el ID del horario." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('appointment_slots')
      .delete()
      .eq('id', slotId);

    if (error) throw error;

    return { success: true, message: "Horario eliminado exitosamente." };
  } catch (error) {
    console.error("Error deleting slot:", error);
    return { success: false, message: "Ocurrió un error al eliminar el horario." };
  }
}

export async function handleRequestReschedule(appointmentId: string): Promise<{ success: boolean; message: string }> {
  if (!appointmentId) {
    return { success: false, message: "Falta el ID de la cita." };
  }
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'reschedule-requested' })
      .eq('id', appointmentId);

    if (error) throw error;

    return { success: true, message: "Tu solicitud para posponer la cita ha sido enviada al doctor." };
  } catch (error) {
    console.error("Error requesting reschedule:", error);
    return { success: false, message: "Ocurrió un error al enviar tu solicitud." };
  }
}

export async function handleApproveAppointment(appointmentId: string): Promise<{ success: boolean; message: string }> {
  if (!appointmentId) {
    return { success: false, message: "Falta el ID de la cita." };
  }
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'approved' })
      .eq('id', appointmentId);

    if (error) throw error;

    return { success: true, message: "La cita ha sido confirmada." };
  } catch (error) {
    console.error("Error approving appointment:", error);
    return { success: false, message: "Ocurrió un error al aprobar la cita." };
  }
}

export async function handleReschedule(appointmentId: string, newDate: Date): Promise<{ success: boolean; message: string }> {
  if (!appointmentId || !newDate) {
    return { success: false, message: "Faltan datos para reagendar." };
  }
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'approved',
        appointment_date: newDate.toISOString(),
      })
    if (error) throw error;

    return { success: true, message: "La cita ha sido reagendada exitosamente." };
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return { success: false, message: "Ocurrió un error al reagendar la cita." };
  }
}

export async function handleUpdateAppointmentDetails(
  appointmentId: string,
  data: { patientName: string; contactNumber: string; requirements?: string }
): Promise<{ success: boolean; message: string }> {
  if (!appointmentId) {
    return { success: false, message: "Falta el ID de la cita." };
  }
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('appointments')
      .update({
        patient_name: data.patientName,
        contact_number: data.contactNumber,
        requirements: data.requirements || null,
      })
      .eq('id', appointmentId);

    if (error) throw error;

    return { success: true, message: "Los datos de la cita han sido actualizados exitosamente." };
  } catch (error) {
    console.error("Error updating appointment details:", error);
    return { success: false, message: "Ocurrió un error al actualizar la cita." };
  }
}

