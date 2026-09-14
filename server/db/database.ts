export interface SqlResult<T> { rows: T[] }
export interface Sql {
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<SqlResult<T>>;
}
export interface Database extends Sql {
  transaction<T>(operation: (tx: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
