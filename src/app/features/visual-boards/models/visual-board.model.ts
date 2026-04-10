export type VisualBoardLinkedType = 'novel' | 'world' | 'character' | 'series';

export interface VisualBoardAuthor {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface VisualBoardItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  orderIndex: number;
  createdAt?: string;
}

export interface VisualBoardSection {
  id: string;
  title: string;
  orderIndex: number;
  items: VisualBoardItem[];
}

export interface VisualBoardSummary {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  linkedType: VisualBoardLinkedType | null;
  linkedId: string | null;
  sectionsCount: number;
  totalImagesCount: number;
  previewImages?: string[];
  author: VisualBoardAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface VisualBoard extends VisualBoardSummary {
  linkedTitle: string | null;
  linkedSlug: string | null;
  sections: VisualBoardSection[];
}

export interface VisualBoardFilter {
  cursor?: string | null;
  linkedType?: VisualBoardLinkedType | 'free' | null;
  linkedId?: string | null;
  isPublic?: boolean | null;
}

export interface VisualBoardSavePayload {
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
  linkedType?: VisualBoardLinkedType | null;
  linkedId?: string | null;
}

export interface VisualBoardReorderSectionPayload {
  sectionId: string;
  orderIndex: number;
}

export interface VisualBoardReorderItemPayload {
  itemId: string;
  orderIndex: number;
}

export interface LinkedEntityOption {
  id: string;
  label: string;
  slug: string;
  subtitle?: string | null;
}
