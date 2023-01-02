export type Row = Record<string, string | number | null | ArrayBuffer>;
export type Value = string | number | null | ArrayBuffer;
type Condition = Record<string, Value>;

async function all(db: D1Database, query: string, values: Value[]) {
  try {
    const { results, success, error } = await db
      .prepare(query)
      .bind(...values)
      .all();

    if (!success) {
      throw new Error(error + "\n" + query);
    }

    return results as Row[];
  } catch (error: any) {
    error.message += "\n" + query;
    throw error;
  }
}

export async function insert(
  db: D1Database,
  { into, data }: { into: string; data: Row }
) {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const keys_ = keys.join(",");
  const values_ = values.map((_) => "?").join(",");

  const query = `INSERT INTO ${into} (${keys_}) VALUES (${values_}) RETURNING *;`;

  return await db
    .prepare(query)
    .bind(...values)
    .first<Row>();
}

export async function insertMany(
  db: D1Database,
  { into, data }: { into: string; data: Row[] }
) {
  const keys = Object.keys(data[0]);
  const keys_ = keys.join(",");

  const qs_ = "(" + keys.map((_) => "?").join(",") + ")";
  const values_ = data.map((_) => qs_).join(",");

  const values: Value[] = [];
  data.forEach((row) => values.push(...keys.map((key) => row[key])));

  const query = `INSERT INTO ${into} (${keys_}) VALUES ${values_} RETURNING *`;

  return await all(db, query, values);
}

// { 'name = ?': "amin", 'age > ?': 31, }
// [ { 'name = ?': "amin"}, { 'age > ?': 31} ]
export function _condition_to_sql(condition: Condition | Condition[]): {
  sql: string;
  values: Value[];
} {
  if (Array.isArray(condition)) {
    const results = condition.map((c) => _condition_to_sql(c));
    const sql = results.map(({ sql }) => "(" + sql + ")").join(" OR ");
    const values = results.map(({ values }) => values).flat();
    return { sql, values };
  }

  const values = Object.values(condition as Condition);
  const keys = Object.keys(condition).map((key) =>
    key.includes("?") ? key : key + " = ?"
  );

  const sql = keys.join(" AND ");
  return { sql, values };
}

// { id: 'id', count: 'count(id)' },
// '*' | ['id', 'count(id) as count'],
export function _select_columns_to_sql(
  expr: Record<string, string> | string[] | string
) {
  if (Array.isArray(expr)) {
    return expr.join(", ");
  }
  if (typeof expr == "string") {
    return expr;
  }
  return Object.entries(expr)
    .map(([key, value]) => (key == value ? key : `${key} AS ${value}`))
    .join(", ");
}

export function _update_columns_to_sql(expr: Record<string, string>) {
  const sql = Object.keys(expr)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(expr);
  return { sql, values };
}

export async function query(
  db: D1Database,
  {
    select = "*",
    from,
    where,
    group_by,
    having,
  }: {
    select?: string | string[] | Record<string, string>;
    from: string;
    group_by?: string;
    where?: Condition | Condition[];
    having?: Condition | Condition[];
  }
) {
  const sql_: string[] = [];
  const values_: Value[] = [];
  sql_.push("SELECT", _select_columns_to_sql(select), "FROM", from);
  if (where) {
    const { sql, values } = _condition_to_sql(where);
    sql_.push("WHERE", sql);
    values_.push(...values);
  }
  if (group_by) {
    sql_.push("GROUP BY", group_by);
    if (having) {
      const { sql, values } = _condition_to_sql(having);
      sql_.push("HAVING", sql);
      values_.push(...values);
    }
  }

  const query_ = sql_.join(" ") + ";";

  return await all(db, query_, values_);
}

export async function remove(
  db: D1Database,
  {
    from,
    where,
  }: {
    from: string;
    where?: Condition | Condition[];
  }
) {
  const sql_: string[] = [];
  const values_: Value[] = [];
  sql_.push("DELETE FROM", from);
  if (where) {
    const { sql, values } = _condition_to_sql(where);
    sql_.push("WHERE", sql);
    values_.push(...values);
  }

  sql_.push("RETURNING *");

  const query_ = sql_.join(" ") + ";";

  return await all(db, query_, values_);
}

export async function update(
  db: D1Database,
  {
    table,
    set,
    where,
  }: {
    table: string;
    set: Record<string, Value>;
    where?: Condition | Condition[];
  }
) {
  const sql_: string[] = [];
  const values_: Value[] = [];
  sql_.push("UPDATE", table);
  const { sql, values } = _update_columns_to_sql(set);
  sql_.push("SET", sql);
  values_.push(...values);

  if (where) {
    const { sql, values } = _condition_to_sql(where);
    sql_.push("WHERE", sql);
    values_.push(...values);
  }

  sql_.push("RETURNING *");

  const query_ = sql_.join(" ") + ";";

  return await all(db, query_, values_);
}
