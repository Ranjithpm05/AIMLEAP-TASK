import { Injectable, signal } from '@angular/core';
import {
  Board,
  Card,
  Column,
  Comment,
  Label,
  User,
} from '../models';
import { Observable, delay, of, throwError } from 'rxjs';

// --- MOCK DATA ---
const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Alex', avatarUrl: `https://i.pravatar.cc/32?u=user-1` },
  { id: 'user-2', name: 'Brenda', avatarUrl: `https://i.pravatar.cc/32?u=user-2` },
  { id: 'user-3', name: 'Charlie', avatarUrl: `https://i.pravatar.cc/32?u=user-3` },
  { id: 'user-4', name: 'Diana', avatarUrl: `https://i.pravatar.cc/32?u=user-4` },
];

const MOCK_LABELS: Label[] = [
  { id: 'label-1', name: 'Bug', color: 'bg-red-600 text-white' },
  { id: 'label-2', name: 'Feature', color: 'bg-blue-600 text-white' },
  { id: 'label-3', name: 'Docs', color: 'bg-green-600 text-white' },
  { id: 'label-4', name: 'Tech Debt', color: 'bg-yellow-500 text-black' },
  { id: 'label-5', name: 'Design', color: 'bg-purple-600 text-white' },
];

const MOCK_CARDS: Card[] = [
    // Backlog
    { id: 'card-1', title: 'Implement user authentication', description: 'Set up JWT-based authentication with login and registration pages.', columnId: 'col-1', assignees: [MOCK_USERS[0]], labels: [MOCK_LABELS[1], MOCK_LABELS[3]], dueDate: null, commentCount: 6 },
    { id: 'card-2', title: 'Design the new dashboard page', description: 'Create mockups and wireframes for the main dashboard.', columnId: 'col-1', assignees: [MOCK_USERS[3]], labels: [MOCK_LABELS[4]], dueDate: '2024-08-15', commentCount: 4 },
    { id: 'card-3', title: 'Refactor database schema', description: 'Optimize database queries and normalize tables.', columnId: 'col-1', assignees: [MOCK_USERS[0]], labels: [MOCK_LABELS[3]], dueDate: null, commentCount: 9 },
    
    // In Progress
    { id: 'card-4', title: 'Fix login button CSS issue on mobile', description: 'The login button is misaligned on screens smaller than 400px.', columnId: 'col-2', assignees: [MOCK_USERS[1]], labels: [MOCK_LABELS[0]], dueDate: '2024-08-20', commentCount: 0 },
    { id: 'card-5', title: 'Setup CI/CD pipeline', description: 'Automate build, test, and deployment processes.', columnId: 'col-2', assignees: [MOCK_USERS[0], MOCK_USERS[2]], labels: [MOCK_LABELS[1]], dueDate: null, commentCount: 5 },

    // In Review
    { id: 'card-6', title: 'Write API documentation for /users endpoint', description: 'Use Swagger/OpenAPI to document all user-related endpoints.', columnId: 'col-3', assignees: [MOCK_USERS[3]], labels: [MOCK_LABELS[2]], dueDate: null, commentCount: 4 },
    
    // Done
    { id: 'card-7', title: 'User profile page UI complete', description: 'The user profile page is fully implemented and styled.', columnId: 'col-4', assignees: [MOCK_USERS[0]], labels: [MOCK_LABELS[1], MOCK_LABELS[4]], dueDate: null, commentCount: 8 },
];

const MOCK_COLUMNS: Column[] = [
    { id: 'col-1', title: 'Backlog', cards: MOCK_CARDS.filter(c => c.columnId === 'col-1') },
    { id: 'col-2', title: 'In Progress', cards: MOCK_CARDS.filter(c => c.columnId === 'col-2') },
    { id: 'col-3', title: 'In Review', cards: MOCK_CARDS.filter(c => c.columnId === 'col-3') },
    { id: 'col-4', title: 'Done', cards: MOCK_CARDS.filter(c => c.columnId === 'col-4') },
];

const MOCK_BOARD: Board = {
  id: 'board-1',
  name: 'Project Phoenix',
  description: 'The main development board for Project Phoenix.',
  columns: MOCK_COLUMNS,
};

@Injectable({ providedIn: 'root' })
export class KanbanService {
  private boards = signal<Board[]>([MOCK_BOARD, { ...MOCK_BOARD, id: 'board-2', name: 'Marketing Campaign' }]);
  private users = signal<User[]>(MOCK_USERS);
  private labels = signal<Label[]>(MOCK_LABELS);

  getBoards(): Observable<Board[]> {
    return of(this.boards()).pipe(delay(500));
  }

  getBoard(id: string): Observable<Board> {
    const board = this.boards().find((b) => b.id === id);
    return board ? of(JSON.parse(JSON.stringify(board))).pipe(delay(500)) : throwError(() => new Error('Board not found'));
  }

  getUsers(): Observable<User[]> {
    return of(this.users());
  }
  
  getLabels(): Observable<Label[]> {
    return of(this.labels());
  }

  moveCard(cardId: string, toColumnId: string, fromColumnId: string): Observable<boolean> {
     // Simulate API latency and potential failure
    if (Math.random() > 0.9) { // 10% chance of failure
        return throwError(() => new Error('Failed to move card')).pipe(delay(1000));
    }

    this.boards.update(boards => {
        const board = boards.find(b => b.columns.some(c => c.id === toColumnId || c.id === fromColumnId));
        if (board) {
            const fromColumn = board.columns.find(c => c.id === fromColumnId);
            const toColumn = board.columns.find(c => c.id === toColumnId);
            
            if(fromColumn && toColumn) {
                const cardIndex = fromColumn.cards.findIndex(c => c.id === cardId);
                if (cardIndex > -1) {
                  const [card] = fromColumn.cards.splice(cardIndex, 1);
                  card.columnId = toColumnId;
                  toColumn.cards.push(card);
                }
            }
        }
        return [...boards];
    });

    return of(true).pipe(delay(500));
  }

  addCard(cardData: Omit<Card, 'id' | 'commentCount'>): Observable<Card> {
    const newCard: Card = {
        id: `card-${Date.now()}-${Math.random()}`,
        commentCount: 0,
        ...cardData
    };

    if (Math.random() > 0.9) { // 10% chance of failure
        return throwError(() => new Error('Failed to add card')).pipe(delay(1000));
    }

    this.boards.update(boards => {
        const board = boards.find(b => b.columns.some(c => c.id === cardData.columnId));
        if (board) {
            const column = board.columns.find(c => c.id === cardData.columnId);
            if (column) {
                column.cards.unshift(newCard);
            }
        }
        return [...boards];
    });

    return of(newCard).pipe(delay(500));
  }

  updateCard(updatedCard: Card): Observable<Card> {
    if (Math.random() > 0.9) { // 10% chance of failure
      return throwError(() => new Error('Failed to update card')).pipe(delay(1000));
    }

    this.boards.update(boards => {
      const allColumns = boards.flatMap(b => b.columns);
      const column = allColumns.find(c => c.id === updatedCard.columnId);
      if (column) {
        const cardIndex = column.cards.findIndex(c => c.id === updatedCard.id);
        if (cardIndex !== -1) {
          column.cards[cardIndex] = updatedCard;
        }
      }
      return [...boards];
    });

    return of(updatedCard).pipe(delay(500));
  }
  
  getComments(cardId: string): Observable<Comment[]> {
    // Mock initial comments
    return of([
      { id: 'comment-1', user: MOCK_USERS[1], text: 'I\'ll start working on this tomorrow.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'comment-2', user: MOCK_USERS[0], text: 'Sounds good, let me know if you need help.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
    ]).pipe(delay(300));
  }

  getCommentsStream(cardId: string): Observable<Comment> {
    // Simulate live comments with an observable
    return new Observable(observer => {
      const intervalId = setInterval(() => {
        const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
        const newComment: Comment = {
          id: `comment-${Date.now()}`,
          user: randomUser,
          text: 'This is a new real-time comment!',
          timestamp: new Date().toISOString()
        };
        observer.next(newComment);
      }, 5000); // New comment every 5 seconds

      return () => clearInterval(intervalId);
    });
  }

  postComment(cardId: string, text: string): Observable<Comment> {
    const newComment: Comment = {
        id: `comment-${Date.now()}`,
        user: MOCK_USERS[0], // Assume current user is Alex
        text,
        timestamp: new Date().toISOString()
    };
    return of(newComment).pipe(delay(400));
  }
}
