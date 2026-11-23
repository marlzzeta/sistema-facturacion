-- Favicon y título que se muestran en la pestaña del navegador.
ALTER TABLE companies
  ADD COLUMN favicon_data_url text,
  ADD COLUMN browser_title text NOT NULL DEFAULT '';
