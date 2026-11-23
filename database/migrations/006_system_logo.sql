-- Logo del sistema: se muestra en la pantalla de inicio de sesión y en el menú lateral.
-- Es independiente del logo de la empresa (que se usa en facturas y datos fiscales).
ALTER TABLE companies
  ADD COLUMN system_logo_data_url text;
