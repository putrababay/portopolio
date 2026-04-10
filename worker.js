export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Header CORS agar admin.html bisa mengakses API
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle Preflight Request untuk browser
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- ROUTING API ---

    // 1. GET: Ambil Semua Data Projek
    if (url.pathname === "/api/projek" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM projek ORDER BY id DESC",
        ).all();

        // Konversi BLOB img1 ke Base64 agar muncul di tabel admin
        const processed = results.map((row) => ({
          ...row,
          img1: row.img1
            ? btoa(String.fromCharCode(...new Uint8Array(row.img1)))
            : null,
        }));

        return new Response(JSON.stringify(processed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // 2. POST: Tambah Data Projek Baru (Multipart Form Data)
    if (url.pathname === "/api/projek" && request.method === "POST") {
      try {
        const formData = await request.formData();

        // Helper untuk convert file upload ke ArrayBuffer (BLOB)
        const getFile = async (key) => {
          const file = formData.get(key);
          if (file && typeof file !== "string" && file.size > 0) {
            return await file.arrayBuffer();
          }
          return null;
        };

        const query = `INSERT INTO projek (nm_projek, title, deskripsi, fitur, teknologi, link, youtube, img1, img2, img3, img4, img5) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await env.DB.prepare(query)
          .bind(
            formData.get("nm_projek") || "",
            formData.get("title") || "",
            formData.get("deskripsi") || "",
            formData.get("fitur") || "",
            formData.get("teknologi") || "[]", // Simpan JSON array teknologi
            formData.get("link") || "",
            formData.get("youtube") || "",
            await getFile("img1"),
            await getFile("img2"),
            await getFile("img3"),
            await getFile("img4"),
            await getFile("img5"),
          )
          .run();

        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // 3. DELETE: Hapus Projek berdasarkan ID
    if (url.pathname === "/api/projek" && request.method === "DELETE") {
      try {
        const id = url.searchParams.get("id");
        if (!id) throw new Error("ID projek diperlukan");

        await env.DB.prepare("DELETE FROM projek WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // Endpoint default jika panggil root URL
    return new Response("API D1 Projek Cloudflare Aktif!", {
      headers: corsHeaders,
    });
  },
};
