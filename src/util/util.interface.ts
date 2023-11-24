export interface IArrayModification {
    index: number;
    oldNumber?: number;
    newNumber?: number;
    action: 'update' | 'remove' | 'add';
  }