import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../services/api';
import { getSocket } from '../services/socket';

export default function CardGrid({ data, control={}, onToggle }){
  const d = data || {};
  const ctrl = control || {};
  const [prevDayEnergy, setPrevDayEnergy] = useState(null);
  const [prevDayBill, setPrevDayBill] = useState(null);
  return (
    <>
      <section className="display-cards">
        <h3>Live Sensor Data</h3>
        <div className="cards-grid">
          <div className="card">
            <h4>Voltage</h4>
            <div className="value">{d.voltage ?? '--'} <span className="unit">V</span></div>
          </div>
          <div className="card">
            <h4>Current</h4>
            <div className="value">{d.current ?? '--'} <span className="unit">A</span></div>
          </div>
          <div className="card">
            <h4>Power</h4>
            <div className="value">{d.power ?? '--'} <span className="unit">W</span></div>
          </div>
          <div className="card">
            <h4>Power Factor (PF)</h4>
            <div className="value">{d.pf_value ?? '--'}</div>
          </div>
          <div className="card">
            <h4>Frequency</h4>
            <div className="value">{d.frequency ?? d.freq ?? '--'} <span className="unit">Hz</span></div>
          </div>
          <div className="card">
            <h4>Capacitance Used</h4>
            <div className="value">{d.capacitance ?? d.cap ?? '--'} <span className="unit">µF</span></div>
          </div>
              <div className="card">
                <h4>Energy (kWh)</h4>
                <div className="value">{d.energy ?? '--'}</div>
              </div>
              <div className="card">
                <h4>Live Bill Status</h4>
                <div className="value">{d.energy != null ? `₹${(d.energy * 8).toFixed(2)}` : '--'}</div>
              </div>
        </div>
      </section>
      <section className="control-section">
        <h3>Load Controls</h3>
        <div className="controls-grid">
          <div className="control-card">
            <h4>Load 1 (Bulb)</h4>
            <div className="status-row">
              <span className={`bulb ${ctrl.load1 ? 'on' : 'off'}`}></span>
              {ctrl.load1 ? 'ON' : 'OFF'}
            </div>
            <div className="toggle-row">
              <button className="btn on" onClick={()=>onToggle('load1', true)}>Turn ON</button>
              <button className="btn off" onClick={()=>onToggle('load1', false)}>Turn OFF</button>
            </div>
          </div>
          <div className="control-card">
            <h4>Load 2 (Fan)</h4>
            <div className="status-row">
              <span className={`bulb ${ctrl.load2 ? 'on' : 'off'}`}></span>
              {ctrl.load2 ? 'ON' : 'OFF'}
            </div>
            <div className="toggle-row">
              <button className="btn on" onClick={()=>onToggle('load2', true)}>Turn ON</button>
              <button className="btn off" onClick={()=>onToggle('load2', false)}>Turn OFF</button>
            </div>
          </div>
          <div className="control-card">
            <h4>Capacitor Bank</h4>
            <div className="status-row">
              <span className={`bulb ${ctrl.capacitor ? 'on' : 'off'}`}></span>
              {ctrl.capacitor ? 'ENABLED' : 'DISABLED'}
            </div>
            <div className="toggle-row">
              <button className="btn on" onClick={()=>onToggle('capacitor', true)}>Turn ON</button>
              <button className="btn off" onClick={()=>onToggle('capacitor', false)}>Turn OFF</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
