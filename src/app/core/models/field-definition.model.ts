export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'boolean' | 'url' | 'markdown';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string | null;
  options: string[] | null;
  default: any | null;
  sortOrder: number;
}
