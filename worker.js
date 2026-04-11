export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // --- 1. SETTING HEADER CORS (Agar bisa diakses dari index.html/admin.html) ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // --- 2. HANDLE PREFLIGHT OPTIONS (Penting untuk Browser) ---
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- 3. LOGIKA ROUTING ---

    // ROUTE: Ambil Data Projek (Untuk index.html & Tabel Admin)
    if (path === "/api/projects" && method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM projects ORDER BY id DESC",
        ).all();
        return new Response(JSON.stringify({ success: true, data: results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // ROUTE: Simpan/Tambah Projek (Untuk Form admin.html)
    if (path === "/api/projects" && method === "POST") {
      try {
        const data = await request.json();

        // Logika INSERT ke D1 Anda
        const info = await env.DB.prepare(
          "INSERT INTO projects (title, deskripsi, tech_stack, images) VALUES (?, ?, ?, ?)",
        )
          .bind(
            data.title,
            data.deskripsi,
            JSON.stringify(data.tech_stack),
            JSON.stringify(data.images),
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message: "Projek berhasil disimpan",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Jika path tidak ditemukan
    return new Response(
      JSON.stringify({ success: false, message: "Endpoint tidak ditemukan" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  },
};
