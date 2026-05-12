export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'admin';
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  experienceYears: number;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}
