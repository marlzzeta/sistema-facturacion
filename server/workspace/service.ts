import type { Database } from '../db/database.js';
import { audit } from '../audit.js';
import { ApiError } from '../errors.js';
import type { WorkspaceData } from '../../shared/contracts.js';

type WorkspaceRow = { data: WorkspaceData; version: number; updated_at: string };

export async function getWorkspace(db: Database, companyId: string) {
  const result = await db.query<WorkspaceRow>('SELECT data, version, updated_at FROM company_workspace WHERE company_id=$1', [companyId]);
  const row = result.rows[0];
  return row ? { data: row.data, version: row.version, updatedAt: row.updated_at } : { data: null, version: 0, updatedAt: null };
}

export async function updateWorkspace(db: Database, companyId: string, actorId: string, data: WorkspaceData, version: number, requestId: string) {
  return db.transaction(async tx => {
    if (version === 0) {
      const inserted = await tx.query<WorkspaceRow>(`INSERT INTO company_workspace(company_id,data,version)
        VALUES ($1,$2::jsonb,1) ON CONFLICT (company_id) DO NOTHING
        RETURNING data,version,updated_at`, [companyId, JSON.stringify(data)]);
      if (!inserted.rows[0]) throw new ApiError(409, 'STALE_WRITE', 'La configuración cambió en otra sesión. Actualiza la página.');
      await audit(tx, { companyId, actorId, action: 'workspace.create', requestId });
      const row = inserted.rows[0];
      return { data: row.data, version: row.version, updatedAt: row.updated_at };
    }
    const updated = await tx.query<WorkspaceRow>(`UPDATE company_workspace SET data=$1::jsonb, version=version+1, updated_at=now()
      WHERE company_id=$2 AND version=$3 RETURNING data,version,updated_at`, [JSON.stringify(data), companyId, version]);
    if (!updated.rows[0]) throw new ApiError(409, 'STALE_WRITE', 'La configuración cambió en otra sesión. Actualiza la página.');
    await audit(tx, { companyId, actorId, action: 'workspace.update', requestId });
    const row = updated.rows[0];
    return { data: row.data, version: row.version, updatedAt: row.updated_at };
  });
}
