// create-session.js
// Maakt een nieuwe sessie aan (vervangt "maak nieuwe Google Sheet")
// POST /api/create-session
// Body: { naam, namen, vragen, extraVragen }

import { getStore } from "@netlify/blobs";
import { randomBytes } from "crypto";

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

  const { naam, namen, vragen, extraVragen } = body;

  if (!naam || !namen || namen.length === 0) {
    return jsonResponse(
      { succes: false, fout: "Naam en ten minste één leerling zijn verplicht." },
      400
    );
  }

  try {
    const store = getStore("sociogram");

    // Genereer unieke sessie-ID en beheertoken
    const sessieId = randomBytes(8).toString("hex"); // bijv. "a3f2c81e9d042b7f"
    const beheerToken = randomBytes(16).toString("hex");

    // Standaard vragen als er geen opgegeven zijn
    const defaultVragen = [
      {
        sleutel: "positieve_vraag_1",
        titel: "Met wie werk je graag samen?",
        hint: "Vink maximaal 3 personen aan.",
        type: "positieve",
        max: 3,
      },
      {
        sleutel: "negatieve_vraag_1",
        titel: "Met wie werk je liever niet samen?",
        hint: "Vink maximaal 3 personen aan.",
        type: "negatieve",
        max: 3,
      },
    ];

    // Sla sessie-config op
    const config = {
      naam: naam,
      formulier_titel: naam,
      formulier_beschrijving:
        "Geef aan met wie je graag samenwerkt en met wie liever niet.",
      naam_vraag_titel: "Wat is jouw naam?",
      naam_vraag_hint:
        "Selecteer je eigen naam. De lijst past zich daarna automatisch aan.",
      vragen: vragen && vragen.length > 0 ? vragen : defaultVragen,
      extraVragen: extraVragen || [],
      beheerToken: beheerToken,
      aangemaakt: new Date().toISOString(),
    };

    await store.setJSON(`sessies/${sessieId}/config`, config);

    // Sla namen op
    const namenObject = {
      namen: namen.map((item) => {
        if (typeof item === "string") {
          return { naam: item, geslacht: "", fakeName: "" };
        }
        return item;
      }),
    };
    await store.setJSON(`sessies/${sessieId}/namen`, namenObject);

    return jsonResponse({
      succes: true,
      sessieId,
      beheerToken,
      // De formulierlink is de publieke URL + sessieId
      formulierLink: `/formulier.html?sessie=${sessieId}`,
      beheerLink: `/beheer.html?sessie=${sessieId}&token=${beheerToken}`,
    });
  } catch (err) {
    console.error("create-session fout:", err);
    return jsonResponse({ succes: false, fout: "Serverfout: " + err.message }, 500);
  }
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

export const config = { path: "/api/create-session" };
