import { Router } from 'express';
import { db } from '../db/db.js';
import { commentaryTable } from '../db/schema.js';
import { createCommentarySchema, matchParamsSchema, listCommentaryQuerySchema } from '../validation/commentary.js';
import { desc, eq } from 'drizzle-orm';

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
    const paramsResult = matchParamsSchema.safeParse(req.params);

    if (!paramsResult.success) {
        return res.status(400).json({ error: 'Invalid params', details: paramsResult.error.issues });
    }

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
        return res.status(400).json({ error: 'Invalid query', details: queryResult.error.issues });
    }

    const { id } = paramsResult.data;
    const { limit = 100 } = queryResult.data;

    try {
        const records = await db.select()
            .from(commentaryTable)
            .where(eq(commentaryTable.matchId, id))
            .orderBy(desc(commentaryTable.createdAt))
            .limit(limit);

        const data = records.map(record => ({
            ...record,
            tags: record.tags ? JSON.parse(record.tags) : []
        }));

        res.status(200).json({ data });
    } catch (e) {
        console.error('Failed to fetch commentary:', e);
        res.status(500).json({ error: 'Failed to fetch commentary', details: e.message });
    }
});

commentaryRouter.post('/', async (req, res) => {
    const paramsResult = matchParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
        return res.status(400).json({ error: 'Invalid params', details: paramsResult.error.issues });
    }

    const bodyResult = createCommentarySchema.safeParse(req.body);
    if (!bodyResult.success) {
        return res.status(400).json({ error: 'Invalid payload', details: bodyResult.error.issues });
    }

    const { id } = paramsResult.data;
    const payload = bodyResult.data;

    try {
        const [record] = await db.insert(commentaryTable).values({
            matchId: id,
            minutes: payload.minutes,
            sequence: payload.sequence,
            period: payload.period,
            eventType: payload.eventType,
            actor: payload.actor,
            team: payload.team,
            message: payload.message,
            metadata: payload.metadata,
            tags: JSON.stringify(payload.tags),
        }).returning();

        if(res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(record.matchId, record);
        }

        const data = record ? { ...record, tags: record.tags ? JSON.parse(record.tags) : [] } : null;
        res.status(201).json({ data });
    }
    catch (e) {
        console.error('Failed to create commentary:', e);
        res.status(500).json({ error: 'Failed to create commentary', details: e.message });
    }
});

