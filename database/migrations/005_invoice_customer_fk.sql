ALTER TABLE invoices
  ADD CONSTRAINT invoices_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES clients(id);

CREATE INDEX invoices_company_customer_idx
  ON invoices(company_id, customer_id);
