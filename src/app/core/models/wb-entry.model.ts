import { FieldDefinition, FieldValue } from './field-definition.model';

export interface WbEntrySummary {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  coverUrl: string | null;
  tags: string[];
  isPublic: boolean;
  category: { name: string; slug: string; icon: string | null; color: string | null };
}

export interface WbEntryDetail extends WbEntrySummary {
  content: string | null;
  fields: Record<string, FieldValue>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    fieldSchema: FieldDefinition[];
  };
  world: { id: string; name: string; slug: string };
  author: { username: string; displayName: string };
  links: WbEntryLink[];
  viewerContext: { isOwner: boolean } | null;
}

export interface WbEntryLink {
  id: string;
  relation: string;
  isMutual: boolean;
  entry: WbEntrySummary;
}
