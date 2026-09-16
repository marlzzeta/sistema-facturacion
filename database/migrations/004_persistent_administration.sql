ALTER TABLE users
  ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  ADD COLUMN last_login_at timestamptz,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE memberships
  ADD COLUMN employee_id text;

CREATE TABLE company_workspace (
  company_id uuid PRIMARY KEY REFERENCES companies(id),
  data jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
