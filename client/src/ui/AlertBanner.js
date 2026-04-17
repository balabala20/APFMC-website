import React from 'react';

export default function AlertBanner({ alert }){
  if(!alert) return null;
  return (
    <div className={`alert-banner ${alert.severity==='critical' ? 'critical' : 'warning'}`}>
      <div className="blink" />
      <div className="alert-content">
        <strong>{alert.type ? alert.type.toUpperCase() : 'ALERT'}</strong>: {alert.message}
      </div>
    </div>
  );
}
