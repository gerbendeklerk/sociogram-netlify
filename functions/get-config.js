// get-config.js
// Haalt de sessieconfiguratie op: namen en vragen
// GET /api/get-config?sessie=SESSIE_ID

import { getStore } from "@netlify/blobs";

export default async function handler(req, context) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const url = new URL(req.url);
  const sessieId = url.searchParams.get("sessie");

  if (!sessieId) {
    return jsonResponse({ succes: false, fout: "Geen sessie-ID opgegeven." }, 400);
  }

  try {
    const store = getStore("sociogram");

    // Laad sessie-config (vragen en instellingen)
    const configData = await store.get(`sessies/${sessieId}/config`, { type: "json" });
    if (!configData) {
      return jsonResponse({ succes: false, fout: "Sessie niet gevonden." }, 404);
    }

    // Laad namen
    const namenData = await store.get(`sessies/${sessieId}/namen`, { type: "json" });
    const namen = namenData ? namenData.namen : [];

    return jsonResponse({
      succes: true,
      config: configData,
      namen: namen,
    });
  } catch (err) {
    console.error("get-config fout:", err);
    return jsonResponse({ succes: false, fout: "Serverfout: " + err.message }, 500);
  }
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
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

export const config = { path: "/api/get-config" };
