// check-ingevuld.js
// Controleert of een leerling al heeft ingevuld
// GET /api/check-ingevuld?sessie=SESSIE_ID&naam=NAAM

import { getStore } from "@netlify/blobs";

export default async function handler(req, context) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url      = new URL(req.url);
  const sessieId = url.searchParams.get("sessie");
  const naam     = url.searchParams.get("naam");

  if (!sessieId || !naam) {
    return jsonResponse({ succes: false, fout: "sessie en naam zijn verplicht." }, 400);
  }

  try {
    const store       = getStore("sociogram");
    const naamSleutel = naarSleutel(naam);
    const bestaand    = await store.get(`sessies/${sessieId}/antwoorden/${naamSleutel}`, { type: "json" });

    return jsonResponse({ succes: true, alIngevuld: !!bestaand });
  } catch (err) {
    return jsonResponse({ succes: false, fout: "Serverfout: " + err.message }, 500);
  }
}

function naarSleutel(naam) {
  return naam
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-]/g, "")
    .substring(0, 80);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export const config = { path: "/api/check-ingevuld" };
