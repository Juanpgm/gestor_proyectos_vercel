'use client';

import React from 'react';

export default function SimplePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'lightblue', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif' 
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        color: 'darkblue',
        marginBottom: '20px' 
      }}>
        🔍 PÁGINA DE DIAGNÓSTICO SIMPLE
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px' 
      }}>
        <h2 style={{ color: 'green', fontSize: '24px' }}>
          ✅ React está funcionando
        </h2>
        <p style={{ fontSize: '18px', color: 'black' }}>
          Si puedes ver este texto, significa que:
        </p>
        <ul style={{ fontSize: '16px', color: 'black' }}>
          <li>Next.js está compilando correctamente</li>
          <li>Los componentes React se están renderizando</li>
          <li>Los estilos inline funcionan</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: 'yellow', 
        padding: '15px', 
        borderRadius: '8px' 
      }}>
        <p style={{ fontSize: '16px', color: 'black', margin: 0 }}>
          Timestamp: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}