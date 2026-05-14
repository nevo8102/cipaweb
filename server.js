const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/save') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const content = `const products = ${JSON.stringify(data, null, 2)};\n`;
                fs.writeFileSync(path.join(__dirname, 'data.js'), content, 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/api/track') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const statsFile = path.join(__dirname, 'stats.json');
                let stats = { visits: 0, clicks: {}, adds: {} };
                
                // Migrate old clicks if present
                const clicksFile = path.join(__dirname, 'clicks.json');
                if (fs.existsSync(clicksFile) && !fs.existsSync(statsFile)) {
                    try { stats.clicks = JSON.parse(fs.readFileSync(clicksFile, 'utf8')); } catch(e){}
                }
                
                if (fs.existsSync(statsFile)) {
                    try { stats = JSON.parse(fs.readFileSync(statsFile, 'utf8')); } catch(e){}
                }
                
                if (stats.visits === undefined) stats.visits = 0;
                if (!stats.clicks) stats.clicks = {};
                if (!stats.adds) stats.adds = {};

                if (data.type === 'visit') {
                    stats.visits++;
                } else if (data.type === 'click' && data.id) {
                    stats.clicks[data.id] = (stats.clicks[data.id] || 0) + 1;
                } else if (data.type === 'add' && data.id) {
                    stats.adds[data.id] = (stats.adds[data.id] || 0) + 1;
                }
                
                fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, stats }));
            } catch (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/api/stats') {
        const statsFile = path.join(__dirname, 'stats.json');
        if (fs.existsSync(statsFile)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(fs.readFileSync(statsFile, 'utf8'));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ visits: 0, clicks: {}, adds: {} }));
        }
    } else {
        // Serve static files
        let parsedUrl = req.url.split('?')[0];
        let urlPath = parsedUrl === '/' ? '/editor.html' : parsedUrl;
        let filePath = path.join(__dirname, urlPath);
        
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            let mimeType = 'text/html';
            if (ext === '.js') mimeType = 'application/javascript';
            else if (ext === '.css') mimeType = 'text/css';
            else if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
            
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(fs.readFileSync(filePath));
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    }
});

server.listen(PORT, () => {
    console.log(`Editor server is running! Open your browser to http://localhost:${PORT}`);
});
