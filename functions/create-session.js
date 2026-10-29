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

  const { naam, namen, vragen } = body;

  if (!Array.isArray(namen) || namen.length < 2) {
    return new Response(JSON.stringify({ succes: false, fout: "Minimaal 2 namen vereist" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Genereer unieke sessie-ID en beheertoken
  const sessieId    = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const beheerToken = crypto.randomUUID().replace(/-/g, "");

  const alleNamen = namen.map(n =>
    typeof n === "string"
      ? { naam: n, geslacht: "", fakeName: "" }
      : { naam: n.naam || n, geslacht: n.geslacht || "", fakeName: n.fakeName || "" }
  );

  const sessieData = {
    sessieId,
    sessieNaam: naam || sessieId,
    aangemaakt: new Date().toISOString(),
    alleNamen,
    config: {
      beheerToken,
      vragen: Array.isArray(vragen) ? vragen : []
    },
    antwoorden: {}
  };

  const store = getStore("sociogram");

  try {
    await store.setJSON(sessieId, sessieData);
  } catch (err) {
    return new Response(JSON.stringify({ succes: false, fout: "Opslaan mislukt: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ succes: true, sessieId, beheerToken }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = {
  path: "/api/create-session"
};
