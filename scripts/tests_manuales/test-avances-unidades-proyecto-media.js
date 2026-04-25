#!/usr/bin/env node

/**
 * Validacion operacional de GET /avances_unidades_proyecto para medios.
 *
 * Objetivo:
 * - Confirmar que el endpoint devuelve campos de imagenes/documentos.
 * - Confirmar que al menos una URL de imagen y una de documento responden 2xx/3xx.
 */

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://gestorproyectoapi-production.up.railway.app";
const ENDPOINT = `${API_BASE.replace(/\/+$/, "")}/avances_unidades_proyecto?limit=500`;

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const getMediaUrls = (row) => {
  const imageUrls = [];
  const docUrls = [];

  if (Array.isArray(row?.imagenes_urls)) imageUrls.push(...row.imagenes_urls);
  if (Array.isArray(row?.registro_fotografico_urls))
    imageUrls.push(...row.registro_fotografico_urls);
  if (Array.isArray(row?.documentos_urls)) docUrls.push(...row.documentos_urls);
  if (Array.isArray(row?.documentos_soporte_urls))
    docUrls.push(...row.documentos_soporte_urls);

  if (Array.isArray(row?.soportes)) {
    for (const soporte of row.soportes) {
      if (!soporte || typeof soporte !== "object") continue;
      const tipo = String(soporte.tipo || "").toLowerCase();
      const candidates = [
        soporte.url,
        soporte.url_presigned,
        soporte.presigned_url,
        soporte.url_directa,
      ].filter((u) => typeof u === "string" && u.trim().length > 0);

      for (const candidate of candidates) {
        if (tipo === "imagen") imageUrls.push(candidate);
        if (tipo === "documento") docUrls.push(candidate);
      }
    }
  }

  return {
    imageUrls: [...new Set(imageUrls)],
    docUrls: [...new Set(docUrls)],
  };
};

const checkUrl = async (url) => {
  const safeUrl = String(url || "").trim();
  if (!safeUrl) return { ok: false, status: 0, method: "none" };

  try {
    const head = await fetch(safeUrl, { method: "HEAD", redirect: "follow" });
    if (head.ok) return { ok: true, status: head.status, method: "HEAD" };
  } catch {
    // fallback to GET
  }

  try {
    const get = await fetch(safeUrl, { method: "GET", redirect: "follow" });
    return { ok: get.ok, status: get.status, method: "GET" };
  } catch {
    return { ok: false, status: 0, method: "GET" };
  }
};

(async () => {
  console.log(`Testing endpoint: ${ENDPOINT}`);

  const res = await fetch(ENDPOINT, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    console.error(`FAIL: endpoint respondio ${res.status}`);
    process.exit(1);
  }

  const payload = await res.json();
  const rows = toArray(payload);
  if (rows.length === 0) {
    console.error("FAIL: endpoint sin registros");
    process.exit(1);
  }

  const aggregate = {
    total: rows.length,
    withSoportes: 0,
    withImages: 0,
    withDocs: 0,
  };

  let sampleImageUrl = "";
  let sampleDocUrl = "";

  for (const row of rows) {
    if (Array.isArray(row?.soportes) && row.soportes.length > 0) {
      aggregate.withSoportes += 1;
    }

    const { imageUrls, docUrls } = getMediaUrls(row);
    if (imageUrls.length > 0) {
      aggregate.withImages += 1;
      if (!sampleImageUrl) sampleImageUrl = imageUrls[0];
    }
    if (docUrls.length > 0) {
      aggregate.withDocs += 1;
      if (!sampleDocUrl) sampleDocUrl = docUrls[0];
    }
  }

  console.log("Resumen:", aggregate);

  if (!sampleImageUrl) {
    console.error(
      "FAIL: no se encontro ninguna URL de imagen en la respuesta.",
    );
    process.exit(1);
  }
  if (!sampleDocUrl) {
    console.error(
      "FAIL: no se encontro ninguna URL de documento en la respuesta.",
    );
    process.exit(1);
  }

  const imageCheck = await checkUrl(sampleImageUrl);
  const docCheck = await checkUrl(sampleDocUrl);

  console.log("Image URL check:", imageCheck);
  console.log("Doc URL check:", docCheck);

  if (!imageCheck.ok) {
    console.error("FAIL: la URL de imagen de muestra no es accesible.");
    process.exit(1);
  }
  if (!docCheck.ok) {
    console.error("FAIL: la URL de documento de muestra no es accesible.");
    process.exit(1);
  }

  console.log(
    "PASS: endpoint devuelve medios y las URLs de muestra son accesibles.",
  );
})();
