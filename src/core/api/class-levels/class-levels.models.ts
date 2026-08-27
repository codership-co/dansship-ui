export type ClassLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StudentClassLevelItem {
  class_definition_id: string;
  class_type_name: string;
  level: ClassLevel | null;
  updated_at: string | null;
}

export interface StudentClassLevelsResponse {
  items: Array<StudentClassLevelItem>;
}

export interface UpdateClassLevelPayload {
  level: ClassLevel;
}
