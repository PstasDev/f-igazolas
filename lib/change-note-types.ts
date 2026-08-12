// Change Note types matching Django backend

export interface ChangeNote {
  id: number;
  title: string;
  content: string; // Markdown
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  published_at: string | null; // ISO datetime string
  is_published: boolean;
  show_to_students: boolean;
  show_to_teachers: boolean;
  target_class_ids: number[];
  target_class_names: string[];
  created_by_username: string | null;
}

export interface ChangeNoteCreateRequest {
  title: string;
  content: string;
  published_at?: string | null;
  show_to_students?: boolean;
  show_to_teachers?: boolean;
  target_class_ids?: number[];
}

export interface ChangeNoteUpdateRequest {
  title?: string;
  content?: string;
  published_at?: string | null;
  show_to_students?: boolean;
  show_to_teachers?: boolean;
  target_class_ids?: number[];
}

export interface ChangeNoteImageUploadResponse {
  id: number;
  url: string;
}
