export async function fetchLatest(){
  const res = await fetch('/api/latest', { headers: authHeaders() });
  const j = await res.json();
  return j.data;
}

export async function getControl(){
  const res = await fetch('/api/control', { headers: authHeaders() });
  const j = await res.json();
  return j;
}

export async function fetchHistory(range='weekly'){
  const res = await fetch(`/api/history?range=${range}`, { headers: authHeaders() });
  const j = await res.json();
  return j.data;
}

export async function postControl(payload){
  const res = await fetch('/api/control', { method:'POST', headers:{...authHeaders(), 'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  return res.json();
}

function authHeaders(){
  const token = localStorage.getItem('token') || 'demo-token';
  return { Authorization: `Bearer ${token}` };
}

export async function exportCSV(range='weekly'){
  const res = await fetch(`/api/export?range=${range}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `energy_${range}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function manualOverride(correctedPf, note=''){
  const res = await fetch('/api/override', { method:'POST', headers:{...authHeaders(), 'Content-Type':'application/json'}, body:JSON.stringify({ correctedPf, note }) });
  return res.json();
}

// retrieve stored AI insights (most-recent first)
export async function fetchInsights(){
  const res = await fetch('/api/ai-insights', { headers: authHeaders() });
  const j = await res.json();
  return j.data;
}

// ask server to generate insights immediately (auth required)
export async function generateInsights(){
  const res = await fetch('/api/ai-insights/generate', { method:'POST', headers: authHeaders() });
  const j = await res.json();
  return j.data;
}
