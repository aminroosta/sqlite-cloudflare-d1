export type Row = Record<string, string | number | null | ArrayBuffer>;
export type Value = string | number | null | ArrayBuffer;

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

  return await db
    .prepare(query)
    .bind(...values)
    .first<Row>();
}

export async function createMany({
  db,
  table,
  data,
}: {
  db: D1Database;
  table: string;
  data: Row[];
}) {
  const keys = Object.keys(data[0]);
  const keys_ = keys.join(",");

  const qs_ = "(" + keys.map((_) => "?").join(",") + ")";
  const values_ = data.map((_) => qs_).join(",");

  const values: Value[] = [];
  data.forEach((row) => values.push(...keys.map((key) => row[key])));

  const query = `INSERT INTO ${table} (${keys_}) VALUES ${values_} RETURNING *`;

  const { results, success, error } = await db
    .prepare(query)
    .bind(...values)
    .all();

  if (!success) {
    throw new Error(error);
  }

  return results as Row[];
}
