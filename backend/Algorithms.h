#ifndef ALGORITHMS_H
#define ALGORITHMS_H

#include <vector>
#include <utility>
#include "Grid.h"

// Traversal algorithm engines
bool runBFS(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path);
bool runDFS(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path);
bool runDijkstra(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path);
bool runAStar(Grid& grid, std::vector<std::pair<int, int>>& visitedOrder, std::vector<std::pair<int, int>>& path);

// Heuristic calculation (Manhattan distance)
double getManhattanDistance(int x1, int y1, int x2, int y2);

#endif // ALGORITHMS_H
