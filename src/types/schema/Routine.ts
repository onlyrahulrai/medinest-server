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