// Netlify function: proxies FAA preferred routes + VATSIM live data
exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const origin = (params.origin || '').trim().toUpperCase();
  const dest = (params.dest || '').trim().toUpperCase();

  if (!origin || !dest) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing origin or dest', faa: [], vatsim: [] }) };
  }

  // FAA uses 3-letter IDs (no K prefix) for US airports
  const orig3 = origin.startsWith('K') ? origin.slice(1) : origin;
  const dest3 = dest.startsWith('K') ? dest.slice(1) : dest;

  const results = { faa: [], vatsim: [], debug: {} };

  // --- FAA Preferred Routes (full CSV, filter client-side) ---
  try {
    const faaRes = await fetch('https://www.fly.faa.gov/rmt/data_file/prefroutes_db.csv', {
      headers: { 'User-Agent': 'Mozilla/5.0 ZNY-Dashboard/1.0' }
    });
    const text = await faaRes.text();
    results.debug.faaStatus = faaRes.status;
    results.debug.faaBytes = text.length;

    const lines = text.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      if (cols.length < 9) continue;
      const o = (cols[0] || '').trim().toUpperCase();
      const route = (cols[1] || '').trim();
      const d = (cols[2] || '').trim().toUpperCase();
      if (o !== orig3 || d !== dest3) continue;
      if (!route) continue;
      const hours = [cols[3], cols[4], cols[5]].filter(h => h && h.trim()).join(' / ') || '0000-2359';
      results.faa.push({
        type: (cols[6] || 'TEC').trim(),
        route,
        alt: (cols[8] || '').trim() || '—',
        aircraft: (cols[9] || '').trim() || 'All',
        hours,
        area: (cols[7] || '').trim(),
        dir: (cols[10] || '').trim()
      });
    }
  } catch (e) {
    results.debug.faaError = e.message;
  }

  // --- VATSIM Live Data ---
  try {
    const vRes = await fetch('https://data.vatsim.net/v3/vatsim-data.json');
    const vdata = await vRes.json();
    results.debug.vatsimPilots = (vdata.pilots || []).length;

    const all = [...(vdata.pilots || []), ...(vdata.prefiles || [])];
    for (const p of all) {
      const fp = p.flight_plan;
      if (!fp || !fp.route || !fp.route.trim()) continue;
      if (fp.departure !== origin || fp.arrival !== dest) continue;
      results.vatsim.push({
        route: fp.route.trim(),
        aircraft: (fp.aircraft_short || fp.aircraft || '—').split('/')[0],
        altitude: fp.altitude || '—',
        callsign: p.callsign || ''
      });
    }
  } catch (e) {
    results.debug.vatsimError = e.message;
  }

  return { statusCode: 200, headers, body: JSON.stringify(results) };
};
