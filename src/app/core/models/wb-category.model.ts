import { FieldDefinition } from './field-definition.model';

export interface WbCategorySummary {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  entriesCount: number;
}

export interface WbCategory extends WbCategorySummary {
  description: string | null;
  fieldSchema: FieldDefinition[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTemplate {
  key: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  fieldsCount: number;
}
