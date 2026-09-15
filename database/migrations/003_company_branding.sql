ALTER TABLE companies
  ADD COLUMN tax_id text NOT NULL DEFAULT '',
  ADD COLUMN address text NOT NULL DEFAULT '',
  ADD COLUMN email text NOT NULL DEFAULT '',
  ADD COLUMN phone text NOT NULL DEFAULT '',
  ADD COLUMN billing_resolution text NOT NULL DEFAULT '',
  ADD COLUMN invoice_footer text NOT NULL DEFAULT '',
  ADD COLUMN logo_data_url text,
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

UPDATE companies
SET name = 'Tecnologías Honduras S.A.',
    tax_id = '08011985243568',
    address = 'Col. Palmira, Edificio América, Piso 3, Tegucigalpa, Honduras',
    email = 'facturacion@techonduras.hn',
    phone = '+504 2234-5678',
    billing_resolution = 'SAR-2024-001234',
    invoice_footer = 'Gracias por su preferencia. Este documento es una Factura Fiscal emitida conforme a las leyes de Honduras.'
WHERE slug = 'demo' AND name = 'Empresa Demo';
