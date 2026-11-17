export default {
  async fetch(req) {
    const u = new URL(req.url);
    const body = { ok: true, service: "GE2 Caravan game server", status: "placeholder", time: new Date().toISOString(), path: u.pathname };
    return new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
  }
};
