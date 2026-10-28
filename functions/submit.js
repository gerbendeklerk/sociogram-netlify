// submit.js
// Slaat een leerling-antwoord op in Netlify Blobs
// POST /api/submit
// Body: { sessieId, naam, antwoorden, extraAntwoorden }

import { getStore } from "@netlify/blobs";

export default async function handler(req, context) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ succes: false, fout: "Alleen POST ondersteund." }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ succes: false, fout: "Ongeldig JSON-verzoek." }, 400);
  }

  const { sessieId, naam, antwoorden, extraAntwoorden } = body;

  if (!sessieId || !naam) {
    return jsonResponse({ succes: false, fout: "sessieId en naam zijn verplicht." }, 400);
  }

  // Saniteer de naam zodat deze als sleutel gebruikt kan worden
  const naamSleutel = naarSleutel(naam);

  try {
    const store = getStore("sociogram");

    // Controleer of sessie bestaat
    const configData = await store.get(`sessies/${sessieId}/config`, { type: "json" });
    if (!configData) {
      return jsonResponse({ succes: false, fout: "Sessie niet gevonden." }, 404);
    }

    // Controleer of naam al heeft ingevuld
    const bestaand = await store.get(`sessies/${sessieId}/antwoorden/${naamSleutel}`, { type: "json" });
    if (bestaand) {
      return jsonResponse({ succes: false, alIngevuld: true, fout: "Je hebt al eerder ingevuld." }, 409);
    }

    // Valideer: naam moet in namenlijst staan
    const namenData = await store.get(`sessies/${sessieId}/namen`, { type: "json" });
    if (namenData && namenData.namen) {
      const bekendNamen = namenData.namen.map((n) => n.naam);
      if (!bekendNamen.includes(naam)) {
        return jsonResponse({ succes: false, fout: "Naam niet herkend." }, 400);
      }
    }

    // Sla antwoord op
    const inzending = {
      naam,
      antwoorden: antwoorden || {},
      extraAntwoorden: extraAntwoorden || {},
      tijdstip: new Date().toISOString(),
    };

    await store.setJSON(`sessies/${sessieId}/antwoorden/${naamSleutel}`, inzending);

    // Houd index bij van wie heeft ingevuld (voor snelle controle)
    const indexSleutel = `sessies/${sessieId}/ingevuld-index`;
    const index = (await store.get(indexSleutel, { type: "json" })) || { namen: [] };
    if (!index.namen.includes(naam)) {
      index.namen.push(naam);
    }
    await store.setJSON(indexSleutel, index);

    return jsonResponse({ succes: true });
  } catch (err) {
    console.error("submit fout:", err);
    return jsonResponse({ succes: false, fout: "Serverfout: " + err.message }, 500);
  }
}

// Zet naam om naar een veilige sleutel voor Netlify Blobs
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

export const config = { path: "/api/submit" };
