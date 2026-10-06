// Consultation service - business logic for pharmacist consultations

import { Consultation, Message, Pharmacist, ConsultationType, ConsultationStatus } from '../types';

export class ConsultationService {
  /**
   * Create a new consultation
   */
  static createConsultation(
    patientId: string,
    pharmacistId: string,
    type: ConsultationType,
    subject?: string,
    scheduledDate?: string
  ): Consultation {
    return {
      id: this.generateId(),
      patientId,
      pharmacistId,
      type,
      status: 'pending',
      subject,
      scheduledDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
  }

  /**
   * Add a message to a consultation
   */
  static addMessage(
    consultation: Consultation,
    senderId: string,
    senderType: 'patient' | 'pharmacist',
    content: string
  ): Consultation {
    const message: Message = {
      id: this.generateId(),
      consultationId: consultation.id,
      senderId,
      senderType,
      type: 'text',
      content,
      timestamp: new Date().toISOString(),
      read: senderType === 'pharmacist', // Messages from pharmacist are auto-read
    };

    return {
      ...consultation,
      messages: [...consultation.messages, message],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mark messages as read
   */
  static markMessagesAsRead(consultation: Consultation, userId: string): Consultation {
    const updatedMessages = consultation.messages.map((msg) =>
      msg.senderId !== userId ? { ...msg, read: true } : msg
    );

    return {
      ...consultation,
      messages: updatedMessages,
    };
  }

  /**
   * Update consultation status
   */
  static updateStatus(
    consultation: Consultation,
    status: ConsultationStatus
  ): Consultation {
    return {
      ...consultation,
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get available pharmacists
   */
  static getAvailablePharmacists(): Pharmacist[] {
    return [
      {
        id: 'pharm-1',
        name: 'Bezawit Girma',
        licenseNumber: 'ETH-PHARM-2021-042',
        specialization: 'Clinical Pharmacist',
        experience: '12 years',
        rating: 4.9,
        available: true,
        nextSlot: 'Today, 2:00 PM',
        gender: 'female',
        avatar: 'https://images.unsplash.com/photo-1594824813576-92f7a0752763?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'pharm-2',
        name: 'Bisrat Asnake',
        licenseNumber: 'ETH-PHARM-2019-118',
        specialization: 'Clinical Pharmacist',
        experience: '8 years',
        rating: 4.7,
        available: false,
        nextSlot: 'Tomorrow, 10:00 AM',
        gender: 'female',
        avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'pharm-3',
        name: 'Nesra Mekarim',
        licenseNumber: 'ETH-PHARM-2015-089',
        specialization: 'Clinical Pharmacist',
        experience: '15 years',
        rating: 5.0,
        available: true,
        nextSlot: 'Today, 4:30 PM',
        gender: 'female',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'pharm-4',
        name: 'Emebet Birhanu',
        licenseNumber: 'ETH-PHARM-2016-074',
        specialization: 'Clinical Pharmacist',
        experience: '15 years',
        rating: 5.0,
        available: true,
        nextSlot: 'Today, 4:30 PM',
        gender: 'female',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
      },
      {
        id: 'pharm-5',
        name: 'Kemariyam Bedru',
        licenseNumber: 'ETH-PHARM-2017-063',
        specialization: 'Clinical Pharmacist',
        experience: '15 years',
        rating: 5.0,
        available: true,
        nextSlot: 'Today, 4:30 PM',
        gender: 'female',
        avatar: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=300&auto=format&fit=crop&q=80',
      },
    ];
  }

  /**
   * Get estimated wait time for consultation
   */
  static getEstimatedWaitTime(type: ConsultationType): number {
    // Return estimated wait time in minutes
    const waitTimes: Record<ConsultationType, number> = {
      chat: 30, // 30 minutes for chat
      video: 60, // 1 hour for video
      audio: 45, // 45 minutes for audio
    };
    
    return waitTimes[type] || 30;
  }

  /**
   * Check if consultation can be escalated to emergency
   */
  static shouldEscalateToEmergency(messages: Message[]): boolean {
    const emergencyKeywords = [
      'suicide',
      'kill myself',
      'emergency',
      'chest pain',
      'severe',
      'cannot breathe',
      'heart attack',
      'stroke',
    ];

    return messages.some((msg) =>
      emergencyKeywords.some((keyword) =>
        msg.content.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Get consultation history for a patient
   */
  static getConsultationHistory(patientId: string): Consultation[] {
    // In production, this would query a database
    return [];
  }

  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate consultation request
   */
  static validateConsultationRequest(
    type: ConsultationType,
    subject?: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (type === 'video' && !subject) {
      errors.push('Subject is required for video consultations');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get consultation type display name
   */
  static getConsultationTypeName(type: ConsultationType): string {
    const names: Record<ConsultationType, string> = {
      chat: 'Chat',
      video: 'Video Call',
      audio: 'Audio Call',
    };
    
    return names[type] || type;
  }

  /**
   * Get consultation status display name
   */
  static getConsultationStatusName(status: ConsultationStatus): string {
    const names: Record<ConsultationStatus, string> = {
      pending: 'Pending',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    
    return names[status] || status;
  }
}
