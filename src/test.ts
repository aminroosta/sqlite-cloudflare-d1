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
  let left_ = JSON.stringify(remove_ids(left), null, 2);
  let right_ = JSON.stringify(remove_ids(right), null, 2);
  if (left_ != right_) {
    throw new Error(`${left_} != ${right_}`);
  }
}
async function test_select_star(db: D1Database) {
  const { results } = await db
    .prepare("SELECT * FROM albums WHERE Title = ?")
    .bind("Frank")
    .all();

  assert(results, [{ AlbumId: 322, Title: "Frank", ArtistId: 252 }]);
}

async function test_create(db: D1Database) {
  const name = randstr();

  const result = await lib.create({
    db: db,
    table: "artists",
    data: { Name: name },
  });

  assert(result, { Name: name });
}

async function test_create_many(db: D1Database) {
  const data = [
    { Name: randstr(), Age: 31 },
    { Name: randstr(), Age: 32 },
  ];

  const result = await lib.createMany({
    db: db,
    table: "men",
    data,
  });

  assert(result, data);
}

export default {
  async fetch(
    request: Request,
    env: { db: D1Database },
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      // await test_select_star(env.db);
      // await test_create(env.db);
      // await test_create_many(env.db);
    } catch (error: any) {
      return new Response(`${error.message}\n`, { status: 200 });
    }

    return new Response("Done\n", { status: 200 });
  },
};
