export interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  columnId: string;
  assignees: User[];
  labels: Label[];
  dueDate: string | null;
  commentCount: number;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  name: string;
  description: string;
  columns: Column[];
}