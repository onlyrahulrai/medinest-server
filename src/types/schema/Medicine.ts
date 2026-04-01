export interface MedicineDosage {
  amount: string;
  unit: string;
  perIntake: number;
}

export interface CustomSchedule {
  enabled: boolean;
  times: string[];
  frequency: 'Once daily' | 'Twice daily' | 'Three times daily' | 'Four times daily' | 'As needed';
}

export interface MedicineDuration {
  startDate: string; // ISO string
  forHowLong?: string;
  isOngoing?: boolean;
}

export interface MedicineRefill {
  totalQuantity?: number;
  remainingQuantity?: number;
  refillReminderEnabled?: boolean;
  refillAt?: string;
}

export interface MedicineMeta {
  color?: string;
  photo?: string;
  type?: string;
}

export interface CreateMedicineInput {
  name: string;
  dosage: MedicineDosage;
  routines?: string[];
  customSchedule: CustomSchedule;
  mealTiming?: string;
  duration: MedicineDuration;
  isDurationInherited?: boolean;
  refill: MedicineRefill;
  purpose?: string
  notes?: string;
  meta?: MedicineMeta;
  reminderEnabled?: boolean;
}

export interface CreateMedicineScheduleInput {
  user?: string,
  name?: string,
  duration: {
    startDate?: string,
    forHowLong?: string,
    isOngoing?: boolean,
  },
  groupNotes?: string,
  prescribedBy?: string,
  reminderEnabled?: boolean,
  medicines: CreateMedicineInput[];
}

export interface UpdateMedicineInput extends Partial<CreateMedicineInput> {
  _id?: string;
  isActive?: boolean;
}

export interface UpdateMedicineScheduleInput {
  _id: string,
  user?: string,
  name?: string,
  duration: {
    startDate?: string,
    forHowLong?: string,
    isOngoing?: boolean,
  },
  groupNotes?: string,
  prescribedBy?: string,
  reminderEnabled?: boolean,
  medicines: UpdateMedicineInput[];
  isActive?: boolean;
}

export interface MedicineLogResponse {
  _id: string;
  userId: string;
  medicineId: string;
  routine?: string;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  notes?: string;
  takenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineDetailsResponse {
  _id: string;
  user: string;
  name: string;
  dosage: MedicineDosage;
  customSchedule: CustomSchedule;
  mealTiming?: string;
  duration: MedicineDuration;
  isDurationInherited?: boolean;
  refill: MedicineRefill;
  purpose?: string
  notes?: string;
  meta?: MedicineMeta;
  reminderEnabled?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineScheduleDetailsResponse {
  _id: string;
  user: string;
  name: string;
  startDate: string;
  groupForHowLong?: string;
  groupNotes?: string;
  prescribedBy?: string;
  reminderEnabled?: boolean;
  medicines: MedicineDetailsResponse[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineScheduleResponse {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
  results: Partial<MedicineScheduleDetailsResponse>[];
}
