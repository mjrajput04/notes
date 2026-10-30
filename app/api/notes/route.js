import { ObjectId } from 'mongodb';
import { getNotes, dbError, title } from '@/lib/mongo';

export const dynamic = 'force-dynamic';

/** GET /api/notes - the saved notes, most recently edited first. */
export async function GET() {
  try {
    const col = await getNotes();
    const rows = await col
      .find({}, { projection: { data: 0 } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();
    return Response.json({
      ok: true,
      notes: rows.map((r) => ({
        id: String(r._id),
        title: r.title,
        updatedAt: r.updatedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    return dbError(err);
  }
}

/**
 * POST /api/notes - save. With an `id` it updates that note in place,
 * otherwise it creates one and returns the new id.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, data } = body || {};
    if (!data || typeof data !== 'object') {
      return Response.json({ ok: false, error: 'missing_data' }, { status: 400 });
    }
    const col = await getNotes();
    const now = new Date();

    if (id) {
      let _id;
      try {
        _id = new ObjectId(id);
      } catch {
        return Response.json({ ok: false, error: 'bad_id' }, { status: 400 });
      }
      const res = await col.updateOne(
        { _id },
        { $set: { data, title: title(data), updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      return Response.json({ ok: true, id, upserted: res.upsertedCount > 0, updatedAt: now });
    }

    const res = await col.insertOne({
      data,
      title: title(data),
      createdAt: now,
      updatedAt: now,
    });
    return Response.json({ ok: true, id: String(res.insertedId), updatedAt: now });
  } catch (err) {
    return dbError(err);
  }
}
