import type { CompanyInput, CompanyRecord } from '../../shared/contracts.js';
import { audit } from '../audit.js';
import type { Database } from '../db/database.js';
import { ApiError } from '../errors.js';

type CompanyRow = {
  id: string; name: string; tax_id: string; address: string; email: string; phone: string;
  billing_resolution: string; invoice_footer: string; logo_data_url: string | null;
  system_logo_data_url: string | null;
  favicon_data_url: string | null; browser_title: string; version: number; updated_at: string;
};

const columns = 'id, name, tax_id, address, email, phone, billing_resolution, invoice_footer, logo_data_url, system_logo_data_url, favicon_data_url, browser_title, version, updated_at';

function toCompany(row: CompanyRow): CompanyRecord {
  return {
    id: row.id, razonSocial: row.name, rtn: row.tax_id, direccion: row.address,
    correo: row.email, telefono: row.phone, resolucionFacturacion: row.billing_resolution,
    pieFactura: row.invoice_footer, logo: row.logo_data_url, logoSistema: row.system_logo_data_url,
    favicon: row.favicon_data_url, tituloPestana: row.browser_title,
    version: row.version,
    updatedAt: row.updated_at,
  };
}

export async function getPublicBranding(db: Database, slug: string) {
  const result = await db.query<{ name: string; logo_data_url: string | null; system_logo_data_url: string | null; favicon_data_url: string | null; browser_title: string }>(
    'SELECT name, logo_data_url, system_logo_data_url, favicon_data_url, browser_title FROM companies WHERE slug = $1 AND active = true', [slug],
  );
  if (!result.rows[0]) throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada.');
  const row = result.rows[0];
  return {
    razonSocial: row.name, logo: row.logo_data_url, logoSistema: row.system_logo_data_url,
    favicon: row.favicon_data_url, tituloPestana: row.browser_title,
  };
}

export async function getCompany(db: Database, companyId: string): Promise<CompanyRecord> {
  const result = await db.query<CompanyRow>('SELECT ' + columns + ' FROM companies WHERE id = $1 AND active = true', [companyId]);
  if (!result.rows[0]) throw new ApiError(404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada.');
  return toCompany(result.rows[0]);
}

export async function updateCompany(db: Database, companyId: string, actorId: string, input: CompanyInput, requestId: string): Promise<CompanyRecord> {
  return db.transaction(async tx => {
    const result = await tx.query<CompanyRow>(`UPDATE companies
      SET name=$1, tax_id=$2, address=$3, email=$4, phone=$5, billing_resolution=$6,
          invoice_footer=$7, logo_data_url=$8,
          system_logo_data_url=CASE WHEN $11::boolean THEN $12 ELSE system_logo_data_url END,
          favicon_data_url=CASE WHEN $13::boolean THEN $14 ELSE favicon_data_url END,
          browser_title=COALESCE($15, browser_title),
          version=version+1, updated_at=now()
      WHERE id=$9 AND version=$10 AND active=true
      RETURNING ${columns}`, [
      input.razonSocial, input.rtn, input.direccion, input.correo, input.telefono,
      input.resolucionFacturacion, input.pieFactura, input.logo || null, companyId, input.version,
      input.logoSistema !== undefined, input.logoSistema || null,
      input.favicon !== undefined, input.favicon || null, input.tituloPestana ?? null,
    ]);
    if (!result.rows[0]) throw new ApiError(409, 'STALE_COMPANY', 'La empresa fue modificada por otra sesión. Recarga la página.');
    await audit(tx, { companyId, actorId, action: 'company.update', entityId: companyId, requestId });
    return toCompany(result.rows[0]);
  });
}
