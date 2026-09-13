import { randomUUID } from 'node:crypto';
import type { ClientInput, ClientRecord } from '../../shared/contracts.js';
import type { Database } from '../db/database.js';
import { audit } from '../audit.js';
import { ApiError } from '../errors.js';
type ClientRow = { id: string; company_id: string; name: string; rtn: string; dni: string; email: string; phone: string; address: string; payment_condition: 'contado' | 'credito'; credit_limit: string; tax_exempt: boolean; active: boolean; version: number; created_at: string; updated_at: string };
const columns = 'id, company_id, name, rtn, dni, email, phone, address, payment_condition, credit_limit::text, tax_exempt, active, version, created_at, updated_at';
function toClient(row: ClientRow): ClientRecord { return { id: row.id, nombre: row.name, rtn: row.rtn, dni: row.dni, correo: row.email, telefono: row.phone, direccion: row.address, condicionPago: row.payment_condition, limitCredito: row.credit_limit, exentoImpuesto: row.tax_exempt, activo: row.active, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at }; }
export async function listClients(db: Database, companyId: string) { const result = await db.query<ClientRow>('SELECT ' + columns + ' FROM clients WHERE company_id = $1 ORDER BY name, id', [companyId]); return result.rows.map(toClient); }
export async function createClient(db: Database, companyId: string, actorId: string, input: ClientInput, requestId: string) {
  const id = randomUUID();
  try { await db.transaction(async tx => { await tx.query('INSERT INTO clients(id, company_id, name, rtn, dni, email, phone, address, payment_condition, credit_limit, tax_exempt, active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::numeric,$11,$12)', [id, companyId, input.nombre, input.rtn, input.dni, input.correo, input.telefono, input.direccion, input.condicionPago, input.limitCredito, input.exentoImpuesto, input.activo]); await audit(tx, { companyId, actorId, action: 'client.create', entityId: id, requestId }); }); }
  catch (error) { if ((error as { code?: string }).code === '23505') throw new ApiError(409, 'DUPLICATE_CLIENT', 'Ya existe un cliente con ese RTN.'); throw error; }
  const result = await db.query<ClientRow>('SELECT ' + columns + ' FROM clients WHERE id = $1 AND company_id = $2', [id, companyId]); return toClient(result.rows[0]);
}
export async function updateClient(db: Database, companyId: string, actorId: string, id: string, version: number, input: ClientInput, requestId: string) {
  return db.transaction(async tx => {
    const result = await tx.query<ClientRow>('UPDATE clients SET name=$1,rtn=$2,dni=$3,email=$4,phone=$5,address=$6,payment_condition=$7,credit_limit=$8::numeric,tax_exempt=$9,active=$10,version=version+1,updated_at=now() WHERE id=$11 AND company_id=$12 AND version=$13 RETURNING ' + columns, [input.nombre, input.rtn, input.dni, input.correo, input.telefono, input.direccion, input.condicionPago, input.limitCredito, input.exentoImpuesto, input.activo, id, companyId, version]);
    if (!result.rows[0]) throw new ApiError(409, 'STALE_CLIENT', 'El cliente fue modificado por otra sesión.');
    await audit(tx, { companyId, actorId, action: 'client.update', entityId: id, requestId });
    return toClient(result.rows[0]);
  });
}
