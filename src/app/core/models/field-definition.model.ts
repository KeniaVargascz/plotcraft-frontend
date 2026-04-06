export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'url'
  | 'markdown';

export type FieldValue = string | number | boolean | string[] | null;

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string | null;
  options: string[] | null;
  default: FieldValue;
  sortOrder: number;
}
