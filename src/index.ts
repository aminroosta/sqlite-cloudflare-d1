export type Row = Record<string, string | number | null | ArrayBuffer>;

export async function create({
  db,
  table,
  data,
}: {
  db: D1Database;
  table: string;
  data: Row;
}) {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const keys_ = keys.join(",");
  const values_ = values.map((_) => "?").join(",");

  const query = `INSERT INTO ${table} (${keys_}) VALUES (${values_}) RETURNING *;`;
  console.log({ query });

  return await db
    .prepare(query)
    .bind(...values)
    .first<Row>();
}
