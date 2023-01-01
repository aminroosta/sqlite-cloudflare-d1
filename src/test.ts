export interface Env {
  db: D1Database;
  // MY_KV_NAMESPACE: KVNamespace;
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  // MY_BUCKET: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response("Hello world!", {
      status: 200,
      headers: {
        // "content-type": "application/json;charset=UTF-8",
      },
    });
  },
};
