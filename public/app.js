// Canvas and Grid Configuration
const canvas = document.getElementById('grid-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');

const CELL_SIZE = 24;
let cols = 0;
let rows = 0;
let grid = [];

// Node states
let startX = -1;
let startY = -1;
let endX = -1;
let endY = -1;

// Drawing & Editor state
let activeTool = 'wall'; // 'wall', 'weight', 'start', 'end'
let currentWeightValue = 5;
let isMouseDown = false;
let dragMode = null; // 'drag-start', 'drag-end', 'draw-wall', 'erase-wall', 'draw-weight', 'erase-weight'

// Animation state
let isSolving = false;
let isPaused = false;
let visitedList = [];
let pathList = [];
let visitedIndex = 0;
let pathIndex = 0;
let animationTimer = null;
let currentSolverMetrics = null;

// DOM Elements
const selectAlgorithm = document.getElementById('algorithm-select');
const toolButtons = {
  wall: document.getElementById('tool-wall'),
  weight: document.getElementById('tool-weight'),
  start: document.getElementById('tool-start'),
  end: document.getElementById('tool-end')
};
const weightSliderContainer = document.getElementById('weight-slider-container');
const weightValueSlider = document.getElementById('weight-value-slider');
const weightDisplayVal = document.getElementById('weight-display-val');

const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStep = document.getElementById('btn-step');
const speedSlider = document.getElementById('speed-slider');
const speedLabel = document.getElementById('speed-label');

const btnClearPath = document.getElementById('btn-clear-path');
const btnClearWalls = document.getElementById('btn-clear-walls');
const btnClearWeights = document.getElementById('btn-clear-weights');
const btnReset = document.getElementById('btn-reset');
const btnGenerateMaze = document.getElementById('btn-generate-maze');

const btnBenchmark = document.getElementById('btn-benchmark');
const benchmarkPanel = document.getElementById('benchmark-panel');
const benchmarkResultsBody = document.getElementById('benchmark-results-body');
const btnCloseBenchmark = document.getElementById('btn-close-benchmark');

// Dashboard metrics
const metricTime = document.getElementById('metric-time');
const metricVisited = document.getElementById('metric-visited');
const metricLength = document.getElementById('metric-length');
const metricCost = document.getElementById('metric-cost');
const metricStatus = document.getElementById('metric-status');

// Initialize grid size based on container viewport
function initGrid() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  cols = Math.floor(width / CELL_SIZE);
  rows = Math.floor(height / CELL_SIZE);
  
  // Fit canvas exactly to grid dimensions
  canvas.width = cols * CELL_SIZE;
  canvas.height = rows * CELL_SIZE;
  
  grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push([]);
    for (let c = 0; c < cols; c++) {
      grid[r].push({
        isWall: false,
        weight: 1,
        state: 'empty' // 'empty', 'visited', 'frontier', 'path'
      });
    }
  }
  
  // Set default start and end node locations
  startX = Math.floor(cols * 0.2);
  startY = Math.floor(rows * 0.5);
  endX = Math.floor(cols * 0.8);
  endY = Math.floor(rows * 0.5);
  
  drawGrid();
}

// Render grid to Canvas
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;
      
      // 1. Draw cell base background
      if (cell.isWall) {
        ctx.fillStyle = '#1E293B'; // Wall
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      } else if (cell.state === 'path') {
        ctx.fillStyle = '#FBBF24'; // Shortest Path
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      } else if (cell.state === 'frontier') {
        ctx.fillStyle = '#F59E0B'; // Frontier head
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      } else if (cell.state === 'visited') {
        ctx.fillStyle = '#06B6D4'; // Visited closed
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      } else if (cell.weight > 1) {
        // Draw weight opacity mapping
        const opacity = Math.min(0.1 + (cell.weight / 15) * 0.6, 0.7);
        ctx.fillStyle = `rgba(79, 70, 229, ${opacity})`;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        
        // Draw weight value centered
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.weight.toString(), x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      } else {
        ctx.fillStyle = '#090D16'; // Empty Grid Node
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
      
      // 2. Draw border outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      
      // 3. Render start node overlaid
      if (c === startX && r === startY) {
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2.6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Outfit"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }
      
      // 4. Render target node overlaid
      if (c === endX && r === endY) {
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        // Draw centered diamond
        ctx.moveTo(x + CELL_SIZE / 2, y + 3);
        ctx.lineTo(x + CELL_SIZE - 3, y + CELL_SIZE / 2);
        ctx.lineTo(x + CELL_SIZE / 2, y + CELL_SIZE - 3);
        ctx.lineTo(x + 3, y + CELL_SIZE / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Outfit"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }
    }
  }
}

// Mouse events handling for grid editing
function getGridCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.touches && e.touches[0].clientY);
  
  if (clientX === undefined || clientY === undefined) return null;
  
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;
  
  const c = Math.floor(x / CELL_SIZE);
  const r = Math.floor(y / CELL_SIZE);
  
  if (c >= 0 && c < cols && r >= 0 && r < rows) {
    return { c, r };
  }
  return null;
}

function handleMouseDown(e) {
  if (isSolving) return;
  
  const coords = getGridCoords(e);
  if (!coords) return;
  
  isMouseDown = true;
  const { c, r } = coords;
  
  if (c === startX && r === startY) {
    dragMode = 'drag-start';
  } else if (c === endX && r === endY) {
    dragMode = 'drag-end';
  } else {
    // Determine drawing mode based on active tool
    if (activeTool === 'wall') {
      dragMode = grid[r][c].isWall ? 'erase-wall' : 'draw-wall';
      updateCellUnderMouse(c, r);
    } else if (activeTool === 'weight') {
      dragMode = grid[r][c].weight > 1 ? 'erase-weight' : 'draw-weight';
      updateCellUnderMouse(c, r);
    } else if (activeTool === 'start') {
      if (grid[r][c].isWall) grid[r][c].isWall = false;
      startX = c;
      startY = r;
      drawGrid();
    } else if (activeTool === 'end') {
      if (grid[r][c].isWall) grid[r][c].isWall = false;
      endX = c;
      endY = r;
      drawGrid();
    }
  }
}

function handleMouseMove(e) {
  if (!isMouseDown || isSolving) return;
  
  const coords = getGridCoords(e);
  if (!coords) return;
  
  const { c, r } = coords;
  
  if (dragMode === 'drag-start') {
    if ((c !== endX || r !== endY) && !grid[r][c].isWall) {
      startX = c;
      startY = r;
      drawGrid();
    }
  } else if (dragMode === 'drag-end') {
    if ((c !== startX || r !== startY) && !grid[r][c].isWall) {
      endX = c;
      endY = r;
      drawGrid();
    }
  } else {
    updateCellUnderMouse(c, r);
  }
}

function handleMouseUpOrLeave() {
  isMouseDown = false;
  dragMode = null;
}

function updateCellUnderMouse(c, r) {
  // Prevent editing start/end nodes
  if ((c === startX && r === startY) || (c === endX && r === endY)) return;
  
  const cell = grid[r][c];
  
  if (dragMode === 'draw-wall') {
    cell.isWall = true;
    cell.weight = 1;
    cell.state = 'empty';
  } else if (dragMode === 'erase-wall') {
    cell.isWall = false;
  } else if (dragMode === 'draw-weight') {
    cell.isWall = false;
    cell.weight = currentWeightValue;
    cell.state = 'empty';
  } else if (dragMode === 'erase-weight') {
    cell.weight = 1;
  }
  
  drawGrid();
}

// Clear grid path visualizations
function clearPath() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].state = 'empty';
    }
  }
  visitedList = [];
  pathList = [];
  visitedIndex = 0;
  pathIndex = 0;
  isSolving = false;
  isPaused = false;
  
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  
  btnPlay.disabled = false;
  btnPlay.innerHTML = '<span class="icon">▶</span> Solve';
  btnPause.disabled = true;
  btnPause.innerText = '⏸ Pause';
  btnStep.disabled = true;
  
  setMetric('time', '0.00 ms');
  setMetric('visited', '0');
  setMetric('length', '0');
  setMetric('cost', '0');
  setMetricStatus('Ready', 'idle');
  
  drawGrid();
}

function clearWalls() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].isWall = false;
    }
  }
  clearPath();
}

function clearWeights() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].weight = 1;
    }
  }
  clearPath();
}

function resetGrid() {
  initGrid();
  clearPath();
}

// Random Maze Generator (30% wall density)
function generateRandomMaze() {
  clearWalls();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Avoid walls on start/end coordinates
      if ((c === startX && r === startY) || (c === endX && r === endY)) continue;
      
      if (Math.random() < 0.3) {
        grid[r][c].isWall = true;
      }
    }
  }
  drawGrid();
}

// Get lists of walls and weights formatted for API payload
function getGridPayload() {
  const walls = [];
  const weights = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.isWall) {
        walls.push({ x: c, y: r });
      } else if (cell.weight > 1) {
        weights.push({ x: c, y: r, weight: cell.weight });
      }
    }
  }
  
  return { walls, weights };
}

// Animation controller
function getAnimationSpeed() {
  const sliderVal = parseInt(speedSlider.value, 10);
  
  // Map 1-100 to delays and batch sizes
  if (sliderVal < 20) {
    return { delay: 300 - sliderVal * 12, batch: 1 }; // Slow: 300ms down to 80ms
  } else if (sliderVal < 80) {
    return { delay: 80 - (sliderVal - 20) * 1.1, batch: 1 }; // Medium-Fast: 80ms down to 14ms
  } else if (sliderVal < 95) {
    return { delay: 14 - (sliderVal - 80) * 0.8, batch: 1 }; // Very Fast: 14ms down to 2ms
  } else {
    return { delay: 0, batch: 1 + (sliderVal - 95) * 4 }; // Instant/Batched: 0ms delay, 1 to 21 elements per tick
  }
}

function updateSpeedLabel() {
  const val = parseInt(speedSlider.value, 10);
  if (val < 25) speedLabel.innerText = 'Slow';
  else if (val < 60) speedLabel.innerText = 'Medium';
  else if (val < 85) speedLabel.innerText = 'Fast';
  else speedLabel.innerText = 'Super Fast';
}

function setMetric(id, value) {
  document.getElementById(`metric-${id}`).innerText = value;
}

function setMetricStatus(status, className) {
  const el = metricStatus;
  el.innerText = status;
  el.className = `metric-value status-${className}`;
}

// Call C++ Backend Solve API
async function solveGrid(algorithm) {
  const { walls, weights } = getGridPayload();
  const payload = {
    algorithm,
    cols,
    rows,
    startX,
    startY,
    endX,
    endY,
    walls,
    weights
  };
  
  const response = await fetch('/api/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Server solver execution failed');
  }
  
  return await response.json();
}

// Start animation run
async function runSolve() {
  if (isSolving && isPaused) {
    // Resume execution
    isPaused = false;
    btnPlay.innerHTML = '<span class="icon">▶</span> Solve';
    btnPlay.disabled = true;
    btnPause.disabled = false;
    btnStep.disabled = true;
    setMetricStatus('Running', 'running');
    animateStep();
    return;
  }
  
  clearPath();
  isSolving = true;
  setMetricStatus('Calculating...', 'running');
  
  try {
    const algorithm = selectAlgorithm.value;
    const result = await solveGrid(algorithm);
    
    if (result.status !== 'ok') {
      alert(`Solver failed: ${result.reason}`);
      clearPath();
      return;
    }
    
    currentSolverMetrics = result;
    visitedList = result.visited;
    pathList = result.path;
    
    // Set static metrics
    setMetric('time', `${(result.executionTimeUs / 1000).toFixed(3)} ms`);
    
    visitedIndex = 0;
    pathIndex = 0;
    
    btnPlay.disabled = true;
    btnPause.disabled = false;
    btnStep.disabled = true;
    
    setMetricStatus('Drawing Traces', 'running');
    animateStep();
    
  } catch (err) {
    alert(`Error: ${err.message}`);
    clearPath();
  }
}

// Execution player stepper tick
function animateStep() {
  if (isPaused) return;
  
  const speed = getAnimationSpeed();
  
  // 1. Animate visited node expansions
  if (visitedIndex < visitedList.length) {
    const stepsToTake = speed.delay === 0 ? visitedList.length - visitedIndex : speed.batch;
    
    // Clear previous frontier states to visited
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].state === 'frontier') {
          grid[r][c].state = 'visited';
        }
      }
    }
    
    // Process this batch of visited nodes
    for (let b = 0; b < stepsToTake && visitedIndex < visitedList.length; b++) {
      const node = visitedList[visitedIndex];
      // Skip setting state on start/end coordinates to preserve their clean backgrounds
      if (!(node.x === startX && node.y === startY) && !(node.x === endX && node.y === endY)) {
        // Highlight the last node of the batch as frontier (if speed.delay > 0)
        if (b === stepsToTake - 1 && speed.delay > 0) {
          grid[node.y][node.x].state = 'frontier';
        } else {
          grid[node.y][node.x].state = 'visited';
        }
      }
      visitedIndex++;
    }
    
    setMetric('visited', visitedIndex.toString());
    drawGrid();
    
    if (visitedIndex < visitedList.length) {
      animationTimer = setTimeout(animateStep, speed.delay);
      return;
    }
  }
  
  // Clean up any remaining frontier nodes
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].state === 'frontier') {
        grid[r][c].state = 'visited';
      }
    }
  }
  
  // 2. Animate shortest path tracing
  if (currentSolverMetrics && currentSolverMetrics.pathFound) {
    if (pathIndex < pathList.length) {
      const pathDelay = speed.delay === 0 ? 0 : Math.max(speed.delay * 0.7, 5);
      const stepsToTake = pathDelay === 0 ? pathList.length - pathIndex : 1;
      
      for (let b = 0; b < stepsToTake && pathIndex < pathList.length; b++) {
        const node = pathList[pathIndex];
        grid[node.y][node.x].state = 'path';
        pathIndex++;
      }
      
      setMetric('length', pathIndex.toString());
      
      // Calculate path cost incrementally based on nodes processed so far
      let costSum = 0;
      for (let p = 1; p < pathIndex; p++) {
        costSum += grid[pathList[p].y][pathList[p].x].weight;
      }
      setMetric('cost', costSum.toString());
      
      drawGrid();
      
      if (pathIndex < pathList.length) {
        animationTimer = setTimeout(animateStep, pathDelay);
        return;
      }
    }
  }
  
  completeSolveAnimation();
}

function completeSolveAnimation() {
  isSolving = false;
  btnPlay.innerHTML = '<span class="icon">▶</span> Solve';
  btnPlay.disabled = true;
  btnPause.disabled = true;
  btnStep.disabled = true;
  
  if (currentSolverMetrics && currentSolverMetrics.pathFound) {
    setMetricStatus('Solved', 'solved');
    setMetric('cost', currentSolverMetrics.pathCost.toString());
    setMetric('length', currentSolverMetrics.path.length.toString());
  } else {
    setMetricStatus('No Path Found', 'no-path');
  }
}

// Pause solver animations
function pauseSolve() {
  if (!isSolving || isPaused) return;
  
  isPaused = true;
  btnPlay.innerHTML = '<span class="icon">▶</span> Resume';
  btnPlay.disabled = false;
  btnPause.disabled = true;
  btnStep.disabled = false;
  setMetricStatus('Paused', 'idle');
  
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
}

// Execute exactly one frame of animation (stepping debugger mode)
function stepSolve() {
  if (!isSolving || !isPaused) return;
  
  // 1. Step through visited list
  if (visitedIndex < visitedList.length) {
    // Clear previous frontier states to visited
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].state === 'frontier') {
          grid[r][c].state = 'visited';
        }
      }
    }
    
    const node = visitedList[visitedIndex];
    if (!(node.x === startX && node.y === startY) && !(node.x === endX && node.y === endY)) {
      grid[node.y][node.x].state = 'frontier';
    }
    visitedIndex++;
    
    setMetric('visited', visitedIndex.toString());
    drawGrid();
    return;
  }
  
  // Clean up any remaining frontier nodes
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].state === 'frontier') {
        grid[r][c].state = 'visited';
      }
    }
  }
  
  // 2. Step through path list
  if (currentSolverMetrics && currentSolverMetrics.pathFound) {
    if (pathIndex < pathList.length) {
      const node = pathList[pathIndex];
      grid[node.y][node.x].state = 'path';
      pathIndex++;
      
      setMetric('length', pathIndex.toString());
      
      let costSum = 0;
      for (let p = 1; p < pathIndex; p++) {
        costSum += grid[pathList[p].y][pathList[p].x].weight;
      }
      setMetric('cost', costSum.toString());
      
      drawGrid();
      return;
    }
  }
  
  // Done with everything
  completeSolveAnimation();
}

// Benchmark Comparison execution
async function runBenchmark() {
  if (isSolving) return;
  
  clearPath();
  
  // Show benchmark loading state
  benchmarkPanel.classList.remove('hidden');
  benchmarkResultsBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Calculating benchmarks...</td></tr>';
  
  const algorithms = [
    { key: 'AStar', name: 'A* Search' },
    { key: 'Dijkstra', name: 'Dijkstra' },
    { key: 'BFS', name: 'BFS' },
    { key: 'DFS', name: 'DFS' }
  ];
  
  const results = [];
  
  try {
    for (const alg of algorithms) {
      const result = await solveGrid(alg.key);
      results.push({
        name: alg.name,
        timeUs: result.status === 'ok' ? result.executionTimeUs : 999999,
        visits: result.status === 'ok' ? result.nodesVisitedCount : 0,
        cost: result.status === 'ok' ? (result.pathFound ? result.pathCost : 'N/A') : 'Error',
        found: result.status === 'ok' && result.pathFound
      });
    }
    
    // Sort results by execution time (smaller is better) for ranking
    // Non-paths or errors go to bottom
    const sortedForRank = [...results].sort((a, b) => {
      if (!a.found && b.found) return 1;
      if (a.found && !b.found) return -1;
      return a.timeUs - b.timeUs;
    });
    
    const fastestName = sortedForRank[0].found ? sortedForRank[0].name : null;
    
    // Render Results HTML
    benchmarkResultsBody.innerHTML = '';
    results.forEach(res => {
      const tr = document.createElement('tr');
      
      const tdName = document.createElement('td');
      tdName.innerText = res.name;
      
      const tdTime = document.createElement('td');
      tdTime.innerText = res.found ? `${(res.timeUs / 1000).toFixed(3)} ms` : '∞';
      if (res.name === fastestName) {
        tdTime.classList.add('rank-first');
      }
      
      const tdVisits = document.createElement('td');
      tdVisits.innerText = res.visits.toString();
      
      const tdCost = document.createElement('td');
      tdCost.innerText = res.cost.toString();
      
      tr.appendChild(tdName);
      tr.appendChild(tdTime);
      tr.appendChild(tdVisits);
      tr.appendChild(tdCost);
      
      benchmarkResultsBody.appendChild(tr);
    });
    
  } catch (err) {
    benchmarkResultsBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #EF4444;">Benchmark failed: ${err.message}</td></tr>`;
  }
}

// Bind tool editors and configure inputs
function setupUI() {
  // Tool selector events
  Object.keys(toolButtons).forEach(tool => {
    toolButtons[tool].addEventListener('click', () => {
      Object.keys(toolButtons).forEach(k => toolButtons[k].classList.remove('active'));
      toolButtons[tool].classList.add('active');
      activeTool = tool;
      
      if (tool === 'weight') {
        weightSliderContainer.classList.remove('hidden');
      } else {
        weightSliderContainer.classList.add('hidden');
      }
    });
  });
  
  // Weight slider changes
  weightValueSlider.addEventListener('input', () => {
    currentWeightValue = parseInt(weightValueSlider.value, 10);
    weightDisplayVal.innerText = currentWeightValue.toString();
  });
  
  // Animation play/pause/step controls
  btnPlay.addEventListener('click', runSolve);
  btnPause.addEventListener('click', pauseSolve);
  btnStep.addEventListener('click', stepSolve);
  
  // Speed slider
  speedSlider.addEventListener('input', () => {
    updateSpeedLabel();
  });
  
  // Operations buttons
  btnClearPath.addEventListener('click', clearPath);
  btnClearWalls.addEventListener('click', clearWalls);
  btnClearWeights.addEventListener('click', clearWeights);
  btnReset.addEventListener('click', resetGrid);
  btnGenerateMaze.addEventListener('click', generateRandomMaze);
  
  // Benchmark
  btnBenchmark.addEventListener('click', runBenchmark);
  btnCloseBenchmark.addEventListener('click', () => {
    benchmarkPanel.classList.add('hidden');
  });
  
  // Canvas Mouse / Touch events
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUpOrLeave);
  canvas.addEventListener('mouseleave', handleMouseUpOrLeave);
  
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    handleMouseDown(e);
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    handleMouseMove(e);
  });
  canvas.addEventListener('touchend', handleMouseUpOrLeave);
}

// Window sizing adjustment
window.addEventListener('resize', () => {
  // Only resize if solver is inactive to prevent breaking states
  if (!isSolving) {
    initGrid();
  }
});

// Bootstrapping Visualizer grid
document.addEventListener('DOMContentLoaded', () => {
  initGrid();
  setupUI();
  updateSpeedLabel();
});
