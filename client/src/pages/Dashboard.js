import React, { useEffect, useState } from 'react';
import { initSocket } from '../services/socket';
import pushSvc from '../services/push';
import { fetchLatest, fetchHistory, postControl } from '../services/api';
import CardGrid from '../ui/CardGrid';
import LineChart from '../ui/LineChart';
import AlertBanner from '../ui/AlertBanner';

export default function Dashboard({ token }){
  const [latest, setLatest] = useState(null);
  const [insights, setInsights] = useState([]);
  const [socket, setSocket] = useState(null);
  const [alert, setAlert] = useState(null);
  const [systemStatus, setSystemStatus] = useState('normal');
  const [darkMode, setDarkMode] = useState(false);
  const [control, setControl] = useState({ load1:false, load2:false, capacitor:true });
  const STALE_MS = 15000; // consider data stale after 15s of no updates

  useEffect(()=>{
    const s = initSocket();
    setSocket(s);
    s.on('sensor-data', d=>setLatest(d));
    s.on('ai-insight', i => setInsights(prev=>[i,...prev]));
    s.on('alert', a => setAlert(a));
    s.on('system-status', sst => setSystemStatus(sst.status || 'normal'));
    s.on('control-update', c => {
      // event may include more fields, just keep relevant ones
      setControl({
        load1: c.load1,
        load2: c.load2,
        capacitor: c.capacitor === undefined ? true : c.capacitor
      });
    });

    // if the socket disconnects (e.g. wrong URL or network issue) we'll
    // fall back to polling so the UI stays reasonably live.
    const onDisconnect = () => {
      console.warn('socket disconnected, starting fallback poll');
      const iv = setInterval(async ()=>{
        try { const r = await fetchLatest(); setLatest(r); } catch(e){};
      }, 5000);
      s.once('connect', () => {
        clearInterval(iv);
        console.log('socket reconnected, stopping fallback poll');
      });
    };
    s.on('disconnect', onDisconnect);
    fetchLatest();
    return ()=>s.disconnect();
  },[]);

  useEffect(()=>{ async function load(){
      const r = await fetchLatest();
      setLatest(r);
      const h = await fetchHistory('weekly');
      try {
        const c = await import('../services/api').then(m=>m.getControl());
        if(c.ok) setControl({ load1:c.load1, load2:c.load2, capacitor: c.capacitor });
      } catch(e){ console.warn('control fetch failed', e); }
    }
    load();
  },[]);
  // also load AI insights on start
  useEffect(()=>{
    async function loadInsights(){
      try {
        const insights = await import('../services/api').then(m=>m.fetchInsights());
        if(insights && insights.length){
          setInsights(insights);
        } else {
          // no existing insights, ask server to generate one
          const gen = await import('../services/api').then(m=>m.generateInsights());
          if(gen) setInsights([gen]);
        }
      } catch(err){
        console.warn('insights load error', err);
      }
    }
    loadInsights();
  },[]);

  // clear latest data if it's stale (ESP32 removed / not sending)
  useEffect(()=>{
    const iv = setInterval(()=>{
      if(!latest) return;
      const ts = latest.timestamp ? new Date(latest.timestamp).getTime() : (latest.createdAt ? new Date(latest.createdAt).getTime() : 0);
      if(!ts) return;
      if(Date.now() - ts > STALE_MS) setLatest(null);
    }, 3000);
    return ()=>clearInterval(iv);
  },[latest]);

  async function toggleLoad(which, value){
    if(!window.confirm(`Turn ${which} ${value? 'ON':'OFF'}?`)) return;
    try {
      let payload;
      if(which === 'capacitor') payload = { capacitor: value };
      else payload = which==='load1' ? { load1:value } : { load2:value };
      const res = await postControl(payload);
      if (res.ok) {
        console.log('Control updated:', res.data);
        // update local copy immediately
        setControl(prev=>({ ...prev, [which]: value }));
      } else {
        window.alert('Control failed: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Toggle error:', err);
      window.alert('Toggle failed: ' + err.message);
    }
  }

  async function handleExport(){
    try { await import('../services/api').then(m=>m.exportCSV('weekly')); window.alert('Export started'); }
    catch(e){ window.alert('Export failed'); }
  }

  async function handleOverride(){
    const v = window.prompt('Enter corrected PF value (e.g. 0.98)');
    if(!v) return;
    await import('../services/api').then(m=>m.manualOverride(parseFloat(v), 'User override'));
    window.alert('Override applied');
  }

  async function enableNotifications(){
    try{
      const token = 'demo-token'; // Use demo token
      if(!token) return window.alert('No token available');
      await pushSvc.registerServiceWorkerAndSubscribe(token);
      window.alert('Notifications enabled!');
    } catch(e){ 
      console.error('Notification error:', e); 
      window.alert('Notifications: ' + (e.message || 'Browser may not support Push API'));
    }
  }

  return (
    <div className={`dashboard-root ${darkMode ? 'dark' : 'light'}`}>
      <header className="topbar">
        <h1>⚡ Smart Power Factor Monitoring</h1>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <button className="mode-toggle" onClick={()=>setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <div className={`status ${systemStatus}`}>{systemStatus==='normal' ? 'System Normal' : systemStatus==='warning' ? 'Warning' : 'Critical'}</div>
        </div>
      </header>
      <main>
        <AlertBanner alert={alert} />
        <CardGrid data={latest} control={control} onToggle={toggleLoad} />
        <section className="charts">
          <LineChart title="Power Factor (Weekly)" metric="pf" />
          <LineChart title="Energy Consumption (Weekly)" metric="energy" />
        </section>
        <aside className="ai-panel">
          <h3>🤖 AI Insights & Actions</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'12px'}}>
            <button className="btn" onClick={enableNotifications}>🔔 Enable Notifications</button>
            <button className="btn" onClick={handleExport}>📥 Export CSV</button>
            <button className="btn" onClick={handleOverride}>⚙️ Manual PF Override</button>
          </div>
          <div style={{maxHeight:'300px',overflowY:'auto'}}>
            {insights.length === 0 ? <p style={{color:'#aaa',fontSize:'12px'}}>Waiting for AI insights...</p> : insights.map(i=> (
              <div className="ai-card" key={i._id}>
                <div><b>Weekly PF Avg:</b> {i.weeklyPfAvg?.toFixed(2)}</div>
                <div><b>Peak Hour:</b> {i.peakCurrentHour}</div>
                <div><b>Monthly Prediction:</b> {i.monthlyPredictionKWh?.toFixed(1)} kWh</div>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
