import { ObjectId } from 'mongodb';
import { getNotes, dbError } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

function oid(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/** GET /api/notes/:id - load one saved note. */
export async function GET(request, { params }) {
  const { id } = await params;
  const _id = oid(id);
  if (!_id) return Response.json({ ok: false, error: 'bad_id' }, { status: 400 });
  try {
    const col = await getNotes();
    const row = await col.findOne({ _id });
    if (!row) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
    return Response.json({
      ok: true,
      note: { id: String(row._id), title: row.title, updatedAt: row.updatedAt, data: row.data },
    });
  } catch (err) {
    return dbError(err);
  }
}

/** DELETE /api/notes/:id */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const _id = oid(id);
  if (!_id) return Response.json({ ok: false, error: 'bad_id' }, { status: 400 });
  try {
    const col = await getNotes();
    const res = await col.deleteOne({ _id });
    return Response.json({ ok: true, deleted: res.deletedCount });
  } catch (err) {
    return dbError(err);
  }
}
