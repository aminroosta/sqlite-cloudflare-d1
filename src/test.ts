import * as lib from "./index";

function randstr() {
  return (Math.random() + 1).toString(36).substring(2);
}
function assert(left: any, right: any) {
  let left_ = JSON.stringify(left, null, 2);
  let right_ = JSON.stringify(right, null, 2);
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

  assert(result, { ArtistId: result.ArtistId, Name: name });
}

export default {
  async fetch(
    request: Request,
    env: { db: D1Database },
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      await test_select_star(env.db);
      await test_create(env.db);
    } catch (error: any) {
      return new Response(`${error.message}\n`, { status: 200 });
    }

    return new Response("Done\n", { status: 200 });
  },
};
