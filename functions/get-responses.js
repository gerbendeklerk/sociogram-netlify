// get-responses.js
// Geeft alle antwoorden voor een sessie terug (voor de lerarendashboard)
// GET /api/get-responses?sessie=SESSIE_ID&token=BEHEER_TOKEN

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
  const token = url.searchParams.get("token");

  if (!sessieId) {
    return jsonResponse({ succes: false, fout: "Geen sessie-ID opgegeven." }, 400);
  }

  try {
    const store = getStore("sociogram");

    // Laad sessie-config (bevat beheertoken)
    const configData = await store.get(`sessies/${sessieId}/config`, { type: "json" });
    if (!configData) {
      return jsonResponse({ succes: false, fout: "Sessie niet gevonden." }, 404);
    }

    // Controleer beheertoken
    if (configData.beheerToken && configData.beheerToken !== token) {
      return jsonResponse({ succes: false, fout: "Ongeldig beheertoken." }, 403);
    }

    // Haal index op: wie heeft ingevuld
    const indexSleutel = `sessies/${sessieId}/ingevuld-index`;
    const index = (await store.get(indexSleutel, { type: "json" })) || { namen: [] };

    // Laad namen (totaallijst)
    const namenData = await store.get(`sessies/${sessieId}/namen`, { type: "json" });
    const alleNamen = namenData ? namenData.namen : [];

    // Laad alle antwoorden
    const antwoorden = [];
    for (const naam of index.namen) {
      const naamSleutel = naarSleutel(naam);
      const inzending = await store.get(`sessies/${sessieId}/antwoorden/${naamSleutel}`, {
        type: "json",
      });
      if (inzending) {
        antwoorden.push(inzending);
      }
    }

    return jsonResponse({
      succes: true,
      sessieNaam: configData.naam || sessieId,
      config: configData,
      alleNamen,
      antwoorden,
      aantalIngevuld: antwoorden.length,
      aantalTotaal: alleNamen.length,
    });
  } catch (err) {
    console.error("get-responses fout:", err);
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
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

export const config = { path: "/api/get-responses" };
