import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { fetchHistory } from '../services/api';
import { getSocket } from '../services/socket';
Chart.register(...registerables);

export default function LineChart({ title, metric }){
  const canvasRef = useRef();
  useEffect(()=>{
    let chart;
    let mounted = true;
    async function init(){
      const history = await fetchHistory('weekly');
      const labels = history.map(h=>h._id);
      const data = history.map(h=> (metric==='pf' ? h.avgPfValue : (metric==='energy' ? h.totalEnergy : h.avgPower)) );
      const ctx = canvasRef.current.getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: title, data, borderColor: 'cyan', backgroundColor: 'rgba(0,255,255,0.06)', tension: 0.3 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, animation: { duration: 600 } }
      });

      // subscribe to realtime updates
      const socket = getSocket();
      if (socket) socket.on('sensor-data', (d)=>{
        if(!mounted) return;
        const ts = new Date(d.timestamp).toISOString().slice(0,10);
        const value = metric==='pf' ? d.pf_value : (metric==='energy' ? d.energy : d.power);
        // append or update last label
        const lastLabel = chart.data.labels[chart.data.labels.length-1];
        if (lastLabel === ts) chart.data.datasets[0].data[chart.data.datasets[0].data.length-1] = value;
        else { chart.data.labels.push(ts); chart.data.datasets[0].data.push(value); if (chart.data.labels.length>30) { chart.data.labels.shift(); chart.data.datasets[0].data.shift(); } }
        chart.update();
      });
    }
    init();
    return ()=>{ mounted=false; if(chart) chart.destroy(); };
  },[metric,title]);
  return (<div className="chart-card"><h4>{title}</h4><canvas ref={canvasRef}></canvas></div>);
}
