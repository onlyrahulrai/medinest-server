export interface CreateCaregiverRequest {
  caregiverName: string;
  caregiverPhone: string;
  relation: string;
}

export interface UpdateCaregiverRequest {
  caregiverName?: string;
  relation?: string;
}

export interface CreateInvitationRequest {
  caregiverPhone: string;
  caregiverName: string;
  relation: string;
  message?: string;
}

export interface RespondInvitationRequest {
  action: "accept" | "reject";
}

export interface CaregiverResponse {
  _id: string;
  user: string;
  caregiver?: string | null;
  caregiverName: string;
  caregiverPhone: string;
  relation: string;
  status: string;
  invitedAt?: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
