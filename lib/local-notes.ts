import { promises as fs } from 'fs';
import path from 'path';
import { StoredNote } from './types';

const NOTES_FILE = path.join(process.cwd(), 'data', 'notes.json');

function normalizeNotes(data: unknown): StoredNote[] {
  if (Array.isArray(data)) {
    return data as StoredNote[];
  }
  if (data && typeof data === 'object' && Array.isArray((data as { notes?: unknown }).notes)) {
    return (data as { notes: StoredNote[] }).notes;
  }
  return [];
}

export async function readNotes(): Promise<StoredNote[]> {
  try {
    const raw = await fs.readFile(NOTES_FILE, 'utf8');
    return normalizeNotes(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writeNotes(notes: StoredNote[]): Promise<void> {
  await fs.mkdir(path.dirname(NOTES_FILE), { recursive: true });
  const payload = JSON.stringify(notes, null, 2);
  await fs.writeFile(NOTES_FILE, payload, 'utf8');
}
