"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import * as L from "leaflet";
import "@/styles/leaflet.css";
import {
  getProgressColor,
  getTileAttribution,
  getTileUrl,
} from "@/lib/map-theme";

// Configurar iconos de Leaflet
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "/leaflet/marker-icon.png",
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}

interface LeafletMapProps {
  geometryData: any;
  filteredData: any[];
  mapType: "streets" | "satellite";
  isDark: boolean;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  geometryData,
  filteredData,
  mapType,
  isDark,
}) => {
  const getFeatureColor = (properties: any) => {
    const attributeItem = filteredData.find(
      (item) => item.upid === properties.upid,
    );
    const avance = attributeItem?.avance_obra || properties.avance_obra || 0;

    return getProgressColor(avance);
  };

  // Función para obtener el estilo de cada feature
  const getFeatureStyle = (feature: any) => {
    const color = getFeatureColor(feature.properties);

    if (feature.geometry.type === "Point") {
      return {
        color: "#ffffff",
        fillColor: color,
        fillOpacity: 0.8,
        weight: 1,
        radius: 3,
      };
    } else {
      return {
        color,
        weight: 2,
        opacity: 0.85,
        fillColor: color,
        fillOpacity: 0.2,
      };
    }
  };

  // Función para obtener el estilo específico para circleMarker
  const getCircleMarkerStyle = (feature: any): L.CircleMarkerOptions => {
    const color = getFeatureColor(feature.properties);
    return {
      color: "#ffffff",
      fillColor: color,
      fillOpacity: 0.8,
      weight: 1,
      radius: 3,
    };
  };

  const defaultCenter: [number, number] = [3.4516, -76.532];
  const defaultZoom = 11;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        url={getTileUrl(mapType, isDark)}
        attribution={getTileAttribution(mapType)}
      />

      {/* Renderizar datos de geometry como GeoJSON */}
      {geometryData && geometryData.features && (
        <GeoJSON
          key={`${mapType}-${isDark}-${geometryData.features.length}`}
          data={geometryData}
          style={getFeatureStyle}
          pointToLayer={(feature: any, latlng: any) => {
            return L.circleMarker(latlng, getCircleMarkerStyle(feature));
          }}
          onEachFeature={(feature: any, layer: any) => {
            const attributeItem = filteredData.find(
              (item) => item.upid === feature.properties.upid,
            );
            const avance = Math.round(attributeItem?.avance_obra || 0);

            // Función para formatear valores monetarios
            const formatCurrency = (amount: number) => {
              if (!amount) return "0";
              if (amount >= 1000000000)
                return `${(amount / 1000000000).toFixed(1)}MM`;
              if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
              if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
              return amount.toLocaleString("es-CO");
            };

            const popupContent = document.createElement("div");

            popupContent.innerHTML = `
              <div class="ct-map-popup ${isDark ? "is-dark" : ""}">
                <div class="ct-map-popup__header">
                  ${attributeItem?.nombre_up || feature.properties.upid}
                </div>

                <div class="ct-map-popup__meta">
                  <span class="ct-map-popup__chip">
                    ${feature.properties.upid}
                  </span>
                </div>

                ${
                  attributeItem
                    ? `
                  <div class="ct-map-popup__progress-block">
                    <div class="ct-map-popup__progress-head">
                      <span class="ct-map-popup__label">Avance de obra</span>
                      <span class="ct-map-popup__value" style="color:${getProgressColor(avance)}">${avance}%</span>
                    </div>
                    <div class="ct-map-popup__progress-track">
                      <div class="ct-map-popup__progress-fill" style="width:${Math.min(avance, 100)}%; background:${getProgressColor(avance)}"></div>
                    </div>
                  </div>

                  <div class="ct-map-popup__grid">
                    <div class="ct-map-popup__kpi">
                      <div class="ct-map-popup__label">Estado</div>
                      <div class="ct-map-popup__kpi-value">${attributeItem.estado}</div>
                    </div>
                    <div class="ct-map-popup__kpi">
                      <div class="ct-map-popup__label">Tipo</div>
                      <div class="ct-map-popup__kpi-value">${attributeItem.tipo_intervencion}</div>
                    </div>
                  </div>

                  ${
                    attributeItem.presupuesto_base
                      ? `
                    <div class="ct-map-popup__money">
                      <div class="ct-map-popup__label">Presupuesto base</div>
                      <div class="ct-map-popup__money-value">
                        <span>$</span>${formatCurrency(attributeItem.presupuesto_base)}
                      </div>
                    </div>
                  `
                      : ""
                  }

                  <div class="ct-map-popup__location">
                    <div class="ct-map-popup__label">Ubicacion</div>
                    <div class="ct-map-popup__location-main">${attributeItem.barrio_vereda || "N/A"}</div>
                    <div class="ct-map-popup__location-sub">${attributeItem.comuna_corregimiento || "N/A"}</div>
                  </div>
                `
                    : `
                  <div class="ct-map-popup__kpi">
                    <div class="ct-map-popup__label">Geometria</div>
                    <div class="ct-map-popup__kpi-value">${feature.geometry.type}</div>
                    </div>
                  </div>
                `
                }
              </div>
            `;

            layer.bindPopup(popupContent, {
              maxWidth: 320,
              className: "custom-popup",
            });
          }}
        />
      )}
    </MapContainer>
  );
};

export default LeafletMap;
