#include "Algorithms.h"
#include "MinHeap.h"
#include <queue>
#include <cmath>
#include <algorithm>

double getManhattanDistance(int x1, int y1, int x2, int y2) {
    return std::abs(x1 - x2) + std::abs(y1 - y2);
}

static void reconstructPath(const Grid& grid, std::vector<std::pair<int, int>>& path) {
    int startX = grid.getStartX();
    int startY = grid.getStartY();
    int currX = grid.getEndX();
    int currY = grid.getEndY();
    
    if (grid.getNode(currX, currY).parent_x == -1 && (currX != startX || currY != startY)) {
        return; // No path found
    }
    
    std::vector<std::pair<int, int>> tempPath;
    while (currX != -1 && currY != -1) {
        tempPath.push_back({currX, currY});
        if (currX == startX && currY == startY) break;
        int nextX = grid.getNode(currX, currY).parent_x;
        int nextY = grid.getNode(currX, currY).parent_y;
        currX = nextX;
        currY = nextY;
    }
    
    for (auto it = tempPath.rbegin(); it != tempPath.rend(); ++it) {
        path.push_back(*it);
    }
}

bool runBFS(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path) {
    grid.clearAlgorithmState();
    
    int startX = grid.getStartX();
    int startY = grid.getStartY();
    int endX = grid.getEndX();
    int endY = grid.getEndY();
    
    std::queue<std::pair<int, int>> q;
    q.push({startX, startY});
    grid.getNode(startX, startY).visited = true;
    grid.getNode(startX, startY).g_score = 0;
    
    bool found = false;
    
    while (!q.empty()) {
        auto curr = q.front();
        q.pop();
        
        int x = curr.first;
        int y = curr.second;
        visitedOrder.push_back({x, y});
        
        if (x == endX && y == endY) {
            found = true;
            break;
        }
        
        for (auto neighbor : grid.getNeighbors(x, y)) {
            int nx = neighbor.first;
            int ny = neighbor.second;
            if (!grid.getNode(nx, ny).visited) {
                grid.getNode(nx, ny).visited = true;
                grid.getNode(nx, ny).parent_x = x;
                grid.getNode(nx, ny).parent_y = y;
                grid.getNode(nx, ny).g_score = grid.getNode(x, y).g_score + grid.getNode(nx, ny).weight;
                q.push({nx, ny});
            }
        }
    }
    
    if (found) {
        reconstructPath(grid, path);
    }
    return found;
}

bool runDFS(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path) {
    grid.clearAlgorithmState();
    
    int startX = grid.getStartX();
    int startY = grid.getStartY();
    int endX = grid.getEndX();
    int endY = grid.getEndY();
    
    // Stack stores: {{currentX, currentY}, {parentX, parentY}}
    std::vector<std::pair<std::pair<int, int>, std::pair<int, int>>> stack;
    stack.push_back({{startX, startY}, {-1, -1}});
    
    bool found = false;
    
    while (!stack.empty()) {
        auto top = stack.back();
        stack.pop_back();
        
        int x = top.first.first;
        int y = top.first.second;
        int px = top.second.first;
        int py = top.second.second;
        
        if (grid.getNode(x, y).visited) continue;
        
        grid.getNode(x, y).visited = true;
        grid.getNode(x, y).parent_x = px;
        grid.getNode(x, y).parent_y = py;
        if (px != -1 && py != -1) {
            grid.getNode(x, y).g_score = grid.getNode(px, py).g_score + grid.getNode(x, y).weight;
        } else {
            grid.getNode(x, y).g_score = 0;
        }
        
        visitedOrder.push_back({x, y});
        
        if (x == endX && y == endY) {
            found = true;
            break;
        }
        
        // Push neighbors in reverse order to explore Up first if possible (Up, Right, Down, Left)
        auto neighbors = grid.getNeighbors(x, y);
        std::reverse(neighbors.begin(), neighbors.end());
        for (auto neighbor : neighbors) {
            int nx = neighbor.first;
            int ny = neighbor.second;
            if (!grid.getNode(nx, ny).visited) {
                stack.push_back({{nx, ny}, {x, y}});
            }
        }
    }
    
    if (found) {
        reconstructPath(grid, path);
    }
    return found;
}

bool runDijkstra(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path) {
    grid.clearAlgorithmState();
    
    int startX = grid.getStartX();
    int startY = grid.getStartY();
    int endX = grid.getEndX();
    int endY = grid.getEndY();
    
    MinHeap pq;
    grid.getNode(startX, startY).g_score = 0.0;
    pq.insert(0.0, startX, startY);
    
    bool found = false;
    
    while (!pq.isEmpty()) {
        auto curr = pq.extractMin();
        int x = curr.x;
        int y = curr.y;
        
        if (grid.getNode(x, y).visited) continue;
        
        grid.getNode(x, y).visited = true;
        visitedOrder.push_back({x, y});
        
        if (x == endX && y == endY) {
            found = true;
            break;
        }
        
        for (auto neighbor : grid.getNeighbors(x, y)) {
            int nx = neighbor.first;
            int ny = neighbor.second;
            
            if (grid.getNode(nx, ny).visited) continue;
            
            double tentativeG = grid.getNode(x, y).g_score + grid.getNode(nx, ny).weight;
            if (tentativeG < grid.getNode(nx, ny).g_score) {
                grid.getNode(nx, ny).g_score = tentativeG;
                grid.getNode(nx, ny).parent_x = x;
                grid.getNode(nx, ny).parent_y = y;
                pq.insert(tentativeG, nx, ny);
            }
        }
    }
    
    if (found) {
        reconstructPath(grid, path);
    }
    return found;
}

bool runAStar(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path) {
    grid.clearAlgorithmState();
    
    int startX = grid.getStartX();
    int startY = grid.getStartY();
    int endX = grid.getEndX();
    int endY = grid.getEndY();
    
    MinHeap pq;
    grid.getNode(startX, startY).g_score = 0.0;
    grid.getNode(startX, startY).h_score = getManhattanDistance(startX, startY, endX, endY);
    grid.getNode(startX, startY).f_score = grid.getNode(startX, startY).h_score;
    pq.insert(grid.getNode(startX, startY).f_score, startX, startY);
    
    bool found = false;
    
    while (!pq.isEmpty()) {
        auto curr = pq.extractMin();
        int x = curr.x;
        int y = curr.y;
        
        if (grid.getNode(x, y).visited) continue;
        
        grid.getNode(x, y).visited = true;
        visitedOrder.push_back({x, y});
        
        if (x == endX && y == endY) {
            found = true;
            break;
        }
        
        for (auto neighbor : grid.getNeighbors(x, y)) {
            int nx = neighbor.first;
            int ny = neighbor.second;
            
            if (grid.getNode(nx, ny).visited) continue;
            
            double tentativeG = grid.getNode(x, y).g_score + grid.getNode(nx, ny).weight;
            if (tentativeG < grid.getNode(nx, ny).g_score) {
                grid.getNode(nx, ny).g_score = tentativeG;
                grid.getNode(nx, ny).h_score = getManhattanDistance(nx, ny, endX, endY);
                grid.getNode(nx, ny).f_score = tentativeG + grid.getNode(nx, ny).h_score;
                grid.getNode(nx, ny).parent_x = x;
                grid.getNode(nx, ny).parent_y = y;
                pq.insert(grid.getNode(nx, ny).f_score, nx, ny);
            }
        }
    }
    
    if (found) {
        reconstructPath(grid, path);
    }
    return found;
}
