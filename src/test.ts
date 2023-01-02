import * as lib from "./index";

function randstr() {
  return (Math.random() + 1).toString(36).substring(2);
}
function remove_ids(object: any) {
  const remove = (object: any) => {
    const copy = { ...object };
    Object.keys(object).forEach((key) => {
      if (key.endsWith("Id")) {
        delete copy[key];
      }
    });
    return copy;
  };

  if (Array.isArray(object)) {
    return object.map((obj) => remove(obj));
  }
  return remove(object);
}
function assert(left: any, right: any) {
  if (typeof left != "object" || typeof right != "object") {
    if (left != right) {
      throw new Error(`${left} != ${right}`);
    }
  }
  let left_ = JSON.stringify(remove_ids(left), null, 2);
  let right_ = JSON.stringify(remove_ids(right), null, 2);
  if (left_ != right_) {
    throw new Error(`${left_} != ${right_}`);
  }
}

async function test_insert(db: D1Database) {
  const name = randstr();

  const result = await lib.insert(db, {
    into: "artists",
    data: { Name: name },
  });

  assert(result, { Name: name });
}

async function test_insert_many(db: D1Database) {
  const data = [
    { Name: randstr(), Age: 31 },
    { Name: randstr(), Age: 32 },
  ];

  const result = await lib.insertMany(db, {
    into: "men",
    data,
  });

  assert(result, data);
}

function test_condition_to_sql() {
  assert(
    lib._condition_to_sql({
      "name = ?": "amin",
      "age > ?": 31,
    }),
    { sql: "name = ? AND age > ?", values: ["amin", 31] }
  );

  assert(
    lib._condition_to_sql([
      {
        "name = ?": "amin",
        "age > ?": 31,
      },
      { height: 181 },
    ]),
    { sql: "(name = ? AND age > ?) OR (height = ?)", values: ["amin", 31, 181] }
  );
}

function test_columns_to_sql() {
  assert(lib._columns_to_sql("people.*"), "people.*");
  assert(
    lib._columns_to_sql({ id: "id", "count(id)": "count" }),
    "id, count(id) AS count"
  );
  assert(
    lib._columns_to_sql(["id", "count(id) as count"]),
    "id, count(id) as count"
  );
}

async function test_query(db: D1Database) {
  let result = await lib.query(db, {
    from: "albums",
  });
  assert(result.length > 100, true);

  result = await lib.query(db, {
    from: "albums",
    where: {
      "Title LIKE ?": "Carry%",
    },
  });
  assert(result, [{ Title: "Carry On" }]);

  result = await lib.query(db, {
    from: "albums",
    where: {
      "Title LIKE ?": "%On",
      ArtistId: 58,
    },
  });
  assert(result, [{ Title: "The Battle Rages On" }]);

  result = await lib.query(db, {
    from: "albums",
    where: [
      { Title: "Transmission" },
      {
        "Title LIKE ?": "%On",
        "ArtistId > ?": 57,
        "ArtistId < ?": 59,
      },
    ],
  });
  assert(result, [{ Title: "The Battle Rages On" }, { Title: "Transmission" }]);

  result = await lib.query(db, {
    select: {
      "a.Name": "Name",
      "count(*)": "count",
    },
    from: "artists a join albums b on a.ArtistId = b.ArtistId",
    group_by: "a.ArtistId",
    having: { "count > ?": 12 },
  });
  assert(result, [
    { Name: "Led Zeppelin", count: 14 },
    { Name: "Iron Maiden", count: 21 },
  ]);
}

async function test_remove(db: D1Database) {
  const name = randstr();
  await lib.insert(db, { into: "men", data: { name } });
  const result = await lib.remove(db, {
    from: "men",
    where: { Name: name, Age: 31 },
  });
  assert(result, [{ Name: name, Age: 31 }]);
}

export default {
  async fetch(
    request: Request,
    env: { db: D1Database },
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      // await test_insert(env.db);
      // await test_insert_many(env.db);
      // test_condition_to_sql();
      // test_columns_to_sql();
      // await test_query(env.db);
      await test_remove(env.db);
    } catch (error: any) {
      return new Response(`${error.message}\n`, { status: 200 });
    }

    return new Response("Done\n", { status: 200 });
  },
};
