export interface MedicineDosage {
  amount: string;
  unit: string;
  perIntake: number;
}

export interface CustomSchedule {
  enabled: boolean;
  times: string[];
  frequency: 'daily' | 'weekly' | 'custom' | 'as_needed';
  daysOfWeek?: number[];
}

export interface MedicineDuration {
  startDate: string; // ISO string
  endDate?: string; // ISO string
}

export interface MedicinePrescription {
  prescribedBy?: string;
  purpose?: string;
}

export interface MedicineRefill {
  refillReminder: boolean;
  totalQuantity: number;
  remainingQuantity: number;
  refillAt: number;
}

export interface CreateMedicineInput {
  name: string;
  type: string;
  dosage: MedicineDosage;
  routineIds?: string[];
  customSchedule: CustomSchedule;
  duration: MedicineDuration;
  mealTiming?: string[];
  prescription: MedicinePrescription;
  notes?: string;
  instructions?: string;
  color?: string;
  imageUrl?: string;
  refill: MedicineRefill;
  reminderEnabled?: boolean;
  scheduleGroupId?: string;
  patientId?: string;
}

export interface UpdateMedicineInput extends Partial<CreateMedicineInput> {
  isActive?: boolean;
}

export interface MedicineLogResponse {
  _id: string;
  userId: string;
  medicineId: string;
  routineId?: string;
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  notes?: string;
  takenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineResponse extends Omit<CreateMedicineInput, 'routineIds'> {
  _id: string;
  userId: string;
  routineIds: any[]; // Populated routines
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddRoutineInput {
  name: string;
  time: string;
}

export interface RoutineResponse {
  _id: string;
  userId: string;
  name: string;
  time: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
