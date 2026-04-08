import * as admin from 'firebase-admin';

/**
 * Convert a Firestore DocumentSnapshot to a plain object with `id`.
 * Automatically converts Firestore Timestamps to JS Dates.
 */
export function mapFirestoreDoc<T extends { id: string }>(
  doc: admin.firestore.DocumentSnapshot,
): T {
  const data = doc.data()!;
  const mapped: Record<string, unknown> = { id: doc.id };

  for (const [key, value] of Object.entries(data)) {
    mapped[key] = isFirestoreTimestamp(value) ? value.toDate() : value;
  }

  return mapped as T;
}

function isFirestoreTimestamp(value: unknown): value is { toDate: () => Date } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  );
}
