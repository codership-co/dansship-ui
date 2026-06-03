export type SortBy = 'name' | 'difficulty' | 'type' | 'created_at' | 'updated_at' | 'ipsf_points';
export type OrderBy = 'asc' | 'desc';

export type TFigureId = number;

export type DifficultyType = 'basic' | 'intermediate' | 'intermediate-advance' | 'advance';
export type FigureType = 'spins' | 'climbs' | 'inverts' | 'flexibility' | 'strength';

export interface Figure {
  id: TFigureId;
  name: string;
  difficulty: DifficultyType;
  type: FigureType;
  image_url: string | null;
  image_urls?: Array<string>;
  description?: string | null;
  ipsf_code?: string | null;
  ipsf_points?: number | null;
  tips?: Array<string>;
  aliases?: string;
  translations?: Record<string, Record<string, string>>;
  created_at?: string;
  updated_at?: string;
  is_saved?: boolean;
  savedAt?: string;
  image?: string;
  prerequisites?: Array<string>;
  duration?: string;
  status?: 'completed' | 'want-to-try' | null;
  completedAt?: string;
}

export interface GetFiguresParams {
  difficulty?: DifficultyType;
  type?: FigureType;
  search?: string;
  sortBy?: SortBy;
  order?: OrderBy;
  limit?: number;
  offset?: number;
}

export interface GetFiguresResponse {
  figures: Array<Figure>;
  total: number;
}

export interface GetFigureByIdParams {
  lang?: string;
}

export interface GetFigureProgressParams {
  limit?: number;
  offset?: number;
}

export interface ScheduledFigure extends Omit<Figure, 'status'> {
  status: 'Not Started' | 'In Progress' | 'Completed';
  day: number;
  notes?: string;
}

export interface DetailedFigure extends Figure {
  description: string;
  prerequisites: Array<string>;
  tips: Array<string>;
  duration: string;
  status?: 'completed' | 'want-to-try' | null;
}

export type FigureAdminStatus = 'draft' | 'approved';
export type FigureAdminStatusFilter = FigureAdminStatus | 'all';

export interface FigureImageAsset {
  id: number;
  file_key: string;
  url: string;
  created_at: string;
}

export interface AdminFigure extends Omit<Figure, 'status'> {
  status: FigureAdminStatus;
  description: string | null;
  aliases: string;
  tips: Array<string>;
  image_urls?: Array<string>;
  images?: Array<FigureImageAsset>;
  translations: Record<string, Record<string, string>>;
  prerequisites_ids?: Array<number>;
}

export interface FigureAdminListResponse {
  data: Array<AdminFigure>;
  total: number;
  limit: number;
  offset: number;
  status: FigureAdminStatusFilter;
  filters?: Record<string, unknown>;
}

export interface FigureBulkImportRowError {
  row_number: number;
  figure_id: string | null;
  name: string | null;
  reason: string;
}

export interface FigureBulkImportResponse {
  total_rows: number;
  created: number;
  skipped: number;
  errors: Array<FigureBulkImportRowError>;
}

export interface FigureAdminBasePayload {
  name: string;
  description: string | null;
  difficulty: DifficultyType;
  type: FigureType;
  image_url?: string | null;
  ipsf_code?: string | null;
  ipsf_points?: number | null;
  tips?: Array<string>;
  aliases?: string;
  translations?: Record<string, Record<string, string>>;
  prerequisites_ids?: Array<number>;
}

export interface FigureAdminCreatePayload extends FigureAdminBasePayload {
  status?: FigureAdminStatus;
}

export type FigureAdminUpdatePayload = Partial<FigureAdminBasePayload>;

export interface GetAdminFiguresParams {
  status?: FigureAdminStatusFilter;
  search?: string;
  difficulty?: DifficultyType;
  type?: FigureType;
  sortBy?: 'name' | 'difficulty' | 'type' | 'created_at' | 'updated_at' | 'ipsf_points';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FigureImageUploadUrlRequest {
  content_type: string;
}

export interface FigureImageUploadUrlResponse {
  upload_url: string;
  file_key: string;
}

export type ProgressLevel = 'struggling' | 'holding' | 'consistent' | 'mastered';

export interface FigureProgress {
  id: string;
  user_id: string;
  figure_id: number;
  level: ProgressLevel;
  notes: string | null;
  updated_at: string;
}

export interface FigureProgressListResponse {
  total_count: number;
  items: Array<FigureProgress>;
}

export interface FigureProgressCreateRequest {
  level: ProgressLevel;
  notes?: string | null;
}

export interface FigureProgressUpdateRequest {
  level: ProgressLevel;
  notes?: string | null;
}

export interface ConfirmAdminFigureImagePayload {
  file_key: string;
}

export interface SavedFiguresResponse {
  total_count: number;
  items: Array<Figure>;
}

export interface FavoriteFigureResponse {
  id: string;
  user_id: string;
  figure_id: number;
  created_at: string;
  figure: Figure;
}

export interface SaveFigurePayload {
  figure_id: TFigureId;
}

export interface GetSavedFiguresParams {
  limit?: number;
  offset?: number;
}

export interface UpdateProgressPayload extends Partial<FigureProgress> {}
