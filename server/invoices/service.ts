import { randomUUID } from 'node:crypto';
import type { Database } from '../db/database.js';
import type { InvoiceInput } from '../../shared/contracts.js';
import { audit } from '../audit.js';
import { ApiError } from '../errors.js';

type InvoiceRow = { id: string; invoice_number: string; invoice_date: string; total: string; status: string; payload: unknown; created_at: string };
const columns = 'id, invoice_number, invoice_date, total::text, status, payload, created_at';

export async function listInvoices(db: Database, companyId: string) {
  const result = await db.query<InvoiceRow>('SELECT ' + columns + ' FROM invoices WHERE company_id = $1 ORDER BY invoice_date DESC, id DESC', [companyId]);
  return result.rows.map(row => row.payload);
}

export async function createInvoice(db: Database, companyId: string, actorId: string, input: InvoiceInput, requestId: string) {
  const id = randomUUID();
  const payload = { ...input.payload, id };
  try {
    await db.transaction(async tx => {
      await tx.query('INSERT INTO invoices(id, company_id, invoice_number, customer_id, invoice_date, total, status, payload, created_by) VALUES ($1,$2,$3,$4,$5,$6::numeric,$7,$8::jsonb,$9)', [id, companyId, input.numero, input.clienteId, input.fecha, input.total, input.estado, JSON.stringify(payload), actorId]);
      await audit(tx, { companyId, actorId, action: 'invoice.create', entityId: id, requestId });
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new ApiError(409, 'DUPLICATE_INVOICE', 'Ya existe una factura con ese número.');
    throw error;
  }
  return payload;
}

export async function cancelInvoice(db: Database, companyId: string, actorId: string, id: string, requestId: string) {
  return db.transaction(async tx => {
    const result = await tx.query<{ payload: Record<string, unknown>; status: string }>('SELECT payload,status FROM invoices WHERE company_id=$1 AND id=$2', [companyId, id]);
    const row = result.rows[0];
    if (!row) throw new ApiError(404, 'INVOICE_NOT_FOUND', 'Factura no encontrada.');
    if (row.status === 'anulado') return row.payload;
    const payload = { ...row.payload, estado: 'anulado' };
    await tx.query('UPDATE invoices SET status=$1,payload=$2::jsonb WHERE company_id=$3 AND id=$4', ['anulado', JSON.stringify(payload), companyId, id]);
    await audit(tx, { companyId, actorId, action: 'invoice.cancel', entityId: id, requestId });
    return payload;
  });
}

