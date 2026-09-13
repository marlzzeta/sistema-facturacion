import { randomUUID } from 'node:crypto';
import type { Sql } from './db/database.js';

export async function audit(tx: Sql, event: {
  companyId?: string; actorId?: string; action: string; entityId?: string;
  requestId: string; metadata?: Record<string, string | number | boolean>;
}) {
  await tx.query(`INSERT INTO audit_events
    (id, company_id, actor_id, action, entity_id, request_id, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7)`, [
    randomUUID(), event.companyId ?? null, event.actorId ?? null, event.action,
    event.entityId ?? null, event.requestId, JSON.stringify(event.metadata ?? {}),
  ]);
}
