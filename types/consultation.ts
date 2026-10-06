// Consultation-related type definitions

export type ConsultationStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export type ConsultationType = 'chat' | 'video' | 'audio';

export type MessageType = 'text' | 'image' | 'audio' | 'system';

export interface Message {
  id: string;
  consultationId: string;
  senderId: string;
  senderType: 'patient' | 'pharmacist';
  type: MessageType;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Consultation {
  id: string;
  patientId: string;
  pharmacistId: string;
  type: ConsultationType;
  status: ConsultationStatus;
  subject?: string;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Pharmacist {
  id: string;
  name: string;
  licenseNumber: string;
  specialization?: string;
  experience?: string;
  rating?: number;
  available: boolean;
  nextSlot?: string;
}
