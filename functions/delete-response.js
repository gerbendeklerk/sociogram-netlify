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

  const { sessieId, token, naam } = body;

  if (!sessieId || !token || !naam) {
    return new Response(JSON.stringify({ succes: false, fout: "sessieId, token en naam zijn verplicht" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const store = getStore("sociogram");

  let sessieData;
  try {
    sessieData = await store.get(sessieId, { type: "json" });
  } catch (err) {
    return new Response(JSON.stringify({ succes: false, fout: "Sessie ophalen mislukt: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!sessieData) {
    return new Response(JSON.stringify({ succes: false, fout: "Sessie niet gevonden" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Controleer token
  const opgeslagenToken = sessieData.config?.beheerToken || sessieData.beheerToken;
  if (!opgeslagenToken || opgeslagenToken !== token) {
    return new Response(JSON.stringify({ succes: false, fout: "Onjuist beheertoken" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Verwijder reactie
  if (!sessieData.antwoorden || !sessieData.antwoorden[naam]) {
    return new Response(JSON.stringify({ succes: false, fout: "Geen reactie gevonden van: " + naam }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  delete sessieData.antwoorden[naam];

  try {
    await store.setJSON(sessieId, sessieData);
  } catch (err) {
    return new Response(JSON.stringify({ succes: false, fout: "Opslaan na verwijderen mislukt: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ succes: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = {
  path: "/api/delete-response"
};
