const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/solve') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { algorithm, cols, rows, startX, startY, endX, endY, walls, weights } = data;
        
        // Validate inputs
        if (!algorithm || !cols || !rows || startX === undefined || startY === undefined || endX === undefined || endY === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required parameters' }));
          return;
        }
        
        // Format input for C++ binary
        let cppInput = `${algorithm}\n`;
        cppInput += `${cols} ${rows}\n`;
        cppInput += `${startX} ${startY}\n`;
        cppInput += `${endX} ${endY}\n`;
        
        cppInput += `walls\n${walls.length}\n`;
        for (const wall of walls) {
          cppInput += `${wall.x} ${wall.y}\n`;
        }
        
        cppInput += `weights\n${weights.length}\n`;
        for (const w of weights) {
          cppInput += `${w.x} ${w.y} ${w.weight}\n`;
        }
        
        // Spawn C++ binary
        const binaryPath = path.join(__dirname, 'backend', 'bin', 'pathfinder');
        
        // Check if binary exists
        if (!fs.existsSync(binaryPath)) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'C++ backend binary not found. Please compile it first.' }));
          return;
        }
        
        const child = spawn(binaryPath);
        
        let stdoutBuffer = '';
        let stderrBuffer = '';
        
        child.stdout.on('data', data => {
          stdoutBuffer += data.toString();
        });
        
        child.stderr.on('data', data => {
          stderrBuffer += data.toString();
        });
        
        child.on('close', code => {
          if (code !== 0) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `C++ backend failed with code ${code}`, details: stderrBuffer }));
            return;
          }
          
          try {
            const parsedResult = parseCppOutput(stdoutBuffer);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(parsedResult));
          } catch (parseError) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to parse C++ backend output', raw: stdoutBuffer }));
          }
        });
        
        child.stdin.write(cppInput);
        child.stdin.end();
        
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
      }
    });
    
  } else if (req.method === 'GET') {
    // Serve static files
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Normalize path to prevent directory traversal
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end('Access Denied');
      return;
    }
    
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 File Not Found</h1>', 'utf-8');
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

function parseCppOutput(stdout) {
  const lines = stdout.trim().split('\n');
  const result = {
    status: 'error',
    executionTimeUs: 0,
    nodesVisitedCount: 0,
    pathCost: 0,
    pathFound: false,
    visited: [],
    path: []
  };
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    
    const parts = line.split(' ');
    const key = parts[0];
    
    if (key === 'status') {
      result.status = parts[1];
    } else if (key === 'execution_time_us') {
      result.executionTimeUs = parseInt(parts[1], 10);
    } else if (key === 'nodes_visited_count') {
      result.nodesVisitedCount = parseInt(parts[1], 10);
    } else if (key === 'path_cost') {
      result.pathCost = parseFloat(parts[1]);
    } else if (key === 'path_found') {
      result.pathFound = parts[1] === '1';
    } else if (key === 'visited') {
      i++;
      if (i < lines.length) {
        const count = parseInt(lines[i].trim(), 10);
        i++;
        for (let c = 0; c < count && i < lines.length; c++) {
          const coords = lines[i].trim().split(' ');
          if (coords.length >= 2) {
            result.visited.push({ x: parseInt(coords[0], 10), y: parseInt(coords[1], 10) });
          }
          i++;
        }
        continue;
      }
    } else if (key === 'path') {
      i++;
      if (i < lines.length) {
        const count = parseInt(lines[i].trim(), 10);
        i++;
        for (let c = 0; c < count && i < lines.length; c++) {
          const coords = lines[i].trim().split(' ');
          if (coords.length >= 2) {
            result.path.push({ x: parseInt(coords[0], 10), y: parseInt(coords[1], 10) });
          }
          i++;
        }
        continue;
      }
    }
    i++;
  }
  return result;
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
