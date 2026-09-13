CREATE TABLE invoices (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  invoice_number text NOT NULL,
  customer_id uuid NOT NULL,
  invoice_date date NOT NULL,
  total numeric(14,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL CHECK (status IN ('borrador', 'emitido', 'anulado')),
  payload jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, invoice_number)
);
CREATE INDEX invoices_company_date_idx ON invoices(company_id, invoice_date DESC, id DESC);

