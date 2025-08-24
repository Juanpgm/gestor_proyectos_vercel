'use client';

import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Layers
} from 'lucide-react';

interface LayerControlPanelProps {
  layers: Array<{
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    color: string;
    icon: string;
    type: 'geojson' | 'basemap';
  }>;
  onLayerToggle: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onColorChange: (layerId: string, color: string) => void;
}

const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onLayerToggle,
  onOpacityChange,
  onColorChange
}) => {
  const geoJsonLayers = layers.filter(layer => layer.type === 'geojson');

  return (
    <div className="space-y-2">
      {/* Título simple */}
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <Layers className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Capas</span>
      </div>
      
      {/* Lista compacta de capas */}
      <div className="space-y-1">
        {geoJsonLayers.map((layer) => (
          <div key={layer.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="text-sm">{layer.icon}</span>
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                {layer.name}
              </span>
            </div>
            <button
              onClick={() => onLayerToggle(layer.id)}
              className={`p-1 rounded transition-colors ${
                layer.visible
                  ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {layer.visible ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
            </button>
          </div>
        ))}

        {geoJsonLayers.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
            Sin capas
          </p>
        )}
      </div>
    </div>
  );
};

export default LayerControlPanel;
