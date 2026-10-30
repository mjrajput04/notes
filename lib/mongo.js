import { MongoClient } from 'mongodb';

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'contract_notes';
export const COLLECTION = 'notes';

/**
 * One client per process. Next reloads modules in dev, so the promise is parked
 * on globalThis to avoid opening a new pool on every hot reload.
 */
let cached = globalThis.__contractNoteMongo;
if (!cached) {
  cached = { client: null, promise: null };
  globalThis.__contractNoteMongo = cached;
}

export async function getDb() {
  if (cached.client) return cached.client.db(DB_NAME);
  if (!cached.promise) {
    cached.promise = new MongoClient(URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    })
      .connect()
      .catch((err) => {
        // let the next request retry instead of caching a dead promise
        cached.promise = null;
        throw err;
      });
  }
  cached.client = await cached.promise;
  return cached.client.db(DB_NAME);
}

export async function getNotes() {
  const db = await getDb();
  const col = db.collection(COLLECTION);
  await col.createIndex({ updatedAt: -1 }).catch(() => {});
  return col;
}

/** Uniform failure shape so the client can fall back to local storage. */
export function dbError(err) {
  return Response.json(
    {
      ok: false,
      error: 'mongo_unavailable',
      message: String((err && err.message) || err),
      uri: URI,
    },
    { status: 503 }
  );
}

export function title(doc) {
  const d = doc || {};
  return (
    (d.note && d.note.contractNoteNo) ||
    (d.client && d.client.name) ||
    'Untitled note'
  );
}
