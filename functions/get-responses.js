import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const sessieId = url.searchParams.get("sessie");
  const token = url.searchParams.get("token");

  if (!sessieId || !token) {
    return new Response(JSON.stringify({ succes: false, fout: "sessie en token zijn verplicht" }), {
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

  return new Response(JSON.stringify({
    succes: true,
    sessieId: sessieData.sessieId,
    sessieNaam: sessieData.sessieNaam,
    alleNamen: sessieData.alleNamen,
    config: sessieData.config,
    antwoorden: sessieData.antwoorden || {}
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = {
  path: "/api/get-responses"
};
