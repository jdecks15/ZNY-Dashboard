// Netlify function: proxies FAA preferred routes + VATSIM live data
// No CORS issues since this runs server-side

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const { origin, dest } = event.queryStringParameters || {};
  if (!origin || !dest) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing origin or dest' }) };
  }

  const orig3 = origin.startsWith('K') ? origin.slice(1) : origin;
  const dest3 = dest.startsWith('K') ? dest.slice(1) : dest;

  const results = { faa: [], vatsim: [] };

  // --- FAA Preferred Routes ---
  try {
    const faaUrl = `https://www.fly.faa.gov/rmt/data/nfdc_preferred_routes_database?origin=${orig3}&destination=${dest3}`;
    const r = await fetch(faaUrl, { headers: { 'User-Agent': 'ZNY-Dashboard/1.0' } });
    const text = await r.text();

    // Response is pipe-delimited or CSV — try both
    const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('ORIG') && !l.startsWith('<'));
    lines.forEach(line => {
      const cols = line.split(',');
      if (cols.length < 9) return;
      const o = (cols[0]||'').trim().toUpperCase();
      const route = (cols[1]||'').trim();
      const d = (cols[2]||'').trim().toUpperCase();
      if (!route || (o !== orig3 && o !== origin) || (d !== dest3 && d !== dest)) return;
      results.faa.push({
        type: (cols[6]||'TEC').trim(),
        route: route,
        alt: (cols[8]||'').trim() || '—',
        aircraft: (cols[9]||'').trim() || 'All',
        hours: [cols[3],cols[4],cols[5]].filter(h=>h&&h.trim()).join(' / ') || '0000-2359',
        area: (cols[7]||'').trim(),
        dir: (cols[10]||'').trim()
      });
    });
  } catch(e) {
    console.error('FAA fetch error:', e.message);
  }

  // --- VATSIM Live Data ---
  try {
    const vr = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
    const vdata = await vr.json();
    const all = [...(vdata.pilots||[]), ...(vdata.prefiles||[])];
    all.forEach(p => {
      const fp = p.flight_plan;
      if (!fp || !fp.route || !fp.route.trim()) return;
      if (fp.departure !== origin || fp.arrival !== dest) return;
      results.vatsim.push({
        route: fp.route.trim(),
        aircraft: (fp.aircraft_short || fp.aircraft || '—').split('/')[0],
        altitude: fp.altitude || '—',
        callsign: p.callsign || ''
      });
    });
  } catch(e) {
    console.error('VATSIM fetch error:', e.message);
  }

  return { statusCode: 200, headers, body: JSON.stringify(results) };
};
