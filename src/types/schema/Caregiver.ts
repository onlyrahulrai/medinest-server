export interface CreateCaregiverRequest {
  caregiverName: string;
  caregiverPhone: string;
  relation: string;
  permissions?: {
    canViewMedicines?: boolean;
    canEditMedicines?: boolean;
    canReceiveAlerts?: boolean;
    canViewHealthData?: boolean;
  };
}

export interface UpdateCaregiverRequest {
  caregiverName?: string;
  relation?: string;
  permissions?: {
    canViewMedicines?: boolean;
    canEditMedicines?: boolean;
    canReceiveAlerts?: boolean;
    canViewHealthData?: boolean;
  };
}

export interface RespondInvitationRequest {
  status: "accepted" | "rejected";
}

export interface CaregiverResponse {
  _id: string;
  user: string;
  caregiver?: string | null;
  caregiverName: string;
  caregiverPhone: string;
  relation: string;
  status: string;
  permissions: {
    canViewMedicines: boolean;
    canEditMedicines: boolean;
    canReceiveAlerts: boolean;
    canViewHealthData: boolean;
  };
  invitedAt?: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
