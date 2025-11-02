export interface TestimonialRequest {
  _id?: string;
  name: string;
  roleOrAge: string;
  message: string;
  type: "testimonial" | "story";
  rating?: number; // ⭐ added rating
  published?: boolean;
}

export interface TestimonialResponse {
  _id: string;
  name: string;
  roleOrAge: string;
  message: string;
  type: "testimonial" | "story";
  rating?: number; // ⭐ added rating
  published?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestimonialListResponse {
  results: TestimonialResponse[];
  total: number;
  page: number;
  limit: number;
}
