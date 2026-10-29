import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ succes: false, fout: "Methode niet toegestaan" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ succes: false, fout: "Ongeldig JSON-verzoek" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { sessieId, beheerToken, namen, namenExtra, config } = body;

  if (!sessieId || !beheerToken) {
    return new Response(JSON.stringify({ succes: false, fout: "sessieId en beheerToken zijn verplicht" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Valideer sessie-ID: alleen letters, cijfers, koppeltekens en underscores
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(sessieId)) {
    return new Response(JSON.stringify({ succes: false, fout: "Ongeldig sessie-ID. Gebruik alleen letters, cijfers, koppeltekens en underscores (max. 64 tekens)." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!Array.isArray(namen) || namen.length < 2) {
    return new Response(JSON.stringify({ succes: false, fout: "Minimaal 2 namen vereist" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const store = getStore("sociogram");

  // Controleer of sessie al bestaat en of token klopt (als bestaand)
  try {
    const bestaand = await store.get(sessieId, { type: "json" });
    if (bestaand) {
      const bestaandToken = bestaand.config?.beheerToken || bestaand.beheerToken;
      if (bestaandToken && bestaandToken !== beheerToken) {
        return new Response(JSON.stringify({ succes: false, fout: "Onjuist beheertoken voor bestaande sessie" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  } catch {
    // Sessie bestaat nog niet — dat is prima
  }

  // Normaliseer namen met extra info
  const alleNamen = namenExtra && namenExtra.length > 0
    ? namenExtra
    : namen.map(naam => ({ naam, geslacht: "", fakeName: "" }));

  // Haal bestaande antwoorden op om te bewaren
  let bestaandeAntwoorden = {};
  try {
    const bestaandData = await store.get(sessieId, { type: "json" });
    if (bestaandData && bestaandData.antwoorden) {
      bestaandeAntwoorden = bestaandData.antwoorden;
    }
  } catch {
    // Geen bestaande data
  }

  const sessieData = {
    sessieId,
    sessieNaam: config?.vragen?.formulier_titel || sessieId,
    aangemaakt: new Date().toISOString(),
    alleNamen,
    config: {
      beheerToken,
      vragen: config?.vragen || {}
    },
    antwoorden: bestaandeAntwoorden
  };

  try {
    await store.setJSON(sessieId, sessieData);
  } catch (err) {
    return new Response(JSON.stringify({ succes: false, fout: "Opslaan mislukt: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ succes: true, sessieId }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = {
  path: "/api/save-session"
};
