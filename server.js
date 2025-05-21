const http = require('http');
const mapnik = require('mapnik');
const url = require('url');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const styleUrl = 'https://ton-serveur/style.xml';
const stylePath = path.join(__dirname, 'style.xml');

mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

let styleLoaded = false;
let map;

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url, true);
  const match = pathname.match(/^\/(\d+)\/(\d+)\/(\d+)\.png$/);

  if (!match) {
    res.writeHead(404);
    res.end('Invalid tile URL');
    return;
  }

  if (!styleLoaded) {
    try {
      const response = await axios.get(styleUrl);
      fs.writeFileSync(stylePath, response.data);
      map = new mapnik.Map(256, 256);
      await new Promise((resolve, reject) => {
        map.load(stylePath, (err, m) => err ? reject(err) : resolve(m));
      });
      styleLoaded = true;
    } catch (err) {
      res.writeHead(500);
      res.end('Failed to load style');
      return;
    }
  }

  const [ , z, x, y ] = match.map(Number);
  map.resize(256, 256);
  map.zoomToBox(tileBBox(x, y, z));
  const im = new mapnik.Image(256, 256);
  map.render(im, (err, im) => {
    if (err) return res.end('Render error');
    im.encode('png', (err, buffer) => {
      if (err) return res.end('Encode error');
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(buffer);
    });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function tileBBox(x, y, z) {
  const tile2long = (x, z) => (x / Math.pow(2, z) * 360 - 180);
  const tile2lat = (y, z) => {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  };
  const west = tile2long(x, z);
  const east = tile2long(x + 1, z);
  const north = tile2lat(y, z);
  const south = tile2lat(y + 1, z);
  return [west, south, east, north];
}
