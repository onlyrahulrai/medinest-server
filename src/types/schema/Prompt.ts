export interface PromptRequest {
    _id?: string;
    name: string;
    content: string;
    assessment?: string | null;
    isActive?: boolean;
}

export interface PromptPatchRequest {
    name?: string;
    content?: string;
    assessment?: string | null;
    isActive?: boolean;
}

export interface PromptResponse {
    _id: string;
    name: string;
    content: string;
    assessment?: {
        _id: string;
        title: string;
    } | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PromptListResponse {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
    results: PromptResponse[];
}
