export interface MedicineSchedule {
  times: string[]; // ['08:00', '20:00']
  frequency: 'daily' | 'weekly' | 'custom' | 'as_needed';
  daysOfWeek?: number[]; // [0-6] for Sun-Sat
}

export interface MedicineDuration {
  startDate: string; // ISO string
  endDate?: string; // ISO string
}

export interface CreateMedicineInput {
  name: string;
  type: string; // 'tablet', 'syrup', 'injection', etc.
  dosage: string; // '500mg', '2ml'
  dosageUnit?: string;
  schedule: MedicineSchedule;
  duration: MedicineDuration;
  instructions?: string;
  notes?: string;
  mealTiming?: string[];
  prescribedBy?: string;
  purpose?: string;
  color?: string;
  imageUrl?: string;
  useGlobal: boolean;
  refillReminder?: boolean;
  currentSupply?: number;
  totalSupply?: number;
  refillAt?: number;
  reminderEnabled?: boolean;
  scheduleGroupId?: string;
  patientId?: string; // Optional target user for caregiver usage
}

export interface UpdateMedicineInput extends Partial<CreateMedicineInput> {
  isActive?: boolean;
}

export interface MedicineLog {
  takenAt: string;
  status: 'taken' | 'skipped' | 'missed';
  notes?: string;
  loggedBy: string; // userId or 'self'
}

export interface MedicineResponse extends CreateMedicineInput {
  _id: string;
  userId: string;
  isActive: boolean;
  logs: MedicineLog[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicineLogInput {
  takenAt: string; // ISO string
  status: 'taken' | 'skipped' | 'missed';
  notes?: string;
  loggedBy: string;
}
