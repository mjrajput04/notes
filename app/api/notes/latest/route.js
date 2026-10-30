import { getNotes, dbError } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

/** GET /api/notes/latest - the note that was edited last, for restoring a session. */
export async function GET() {
  try {
    const col = await getNotes();
    const row = await col.find({}).sort({ updatedAt: -1 }).limit(1).next();
    if (!row) return Response.json({ ok: true, note: null });
    return Response.json({
      ok: true,
      note: { id: String(row._id), title: row.title, updatedAt: row.updatedAt, data: row.data },
    });
  } catch (err) {
    return dbError(err);
  }
}
