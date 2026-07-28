#include <iostream>
#include <string>
#include <chrono>
#include "Grid.h"
#include "Algorithms.h"

int main() {
    // Fast I/O for high performance
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
    
    std::string algorithm;
    if (!(std::cin >> algorithm)) {
        std::cout << "status error\nreason empty_input\n";
        return 0;
    }
    
    int cols, rows;
    if (!(std::cin >> cols >> rows)) {
        std::cout << "status error\nreason invalid_dimensions\n";
        return 0;
    }
    
    if (cols <= 0 || rows <= 0) {
        std::cout << "status error\nreason out_of_bounds_dimensions\n";
        return 0;
    }
    
    int startX, startY;
    if (!(std::cin >> startX >> startY)) {
        std::cout << "status error\nreason invalid_start_coords\n";
        return 0;
    }
    
    int endX, endY;
    if (!(std::cin >> endX >> endY)) {
        std::cout << "status error\nreason invalid_end_coords\n";
        return 0;
    }
    
    Grid grid(cols, rows);
    grid.setStart(startX, startY);
    grid.setEnd(endX, endY);
    
    std::string label;
    
    // Parse walls
    if (!(std::cin >> label)) {
        std::cout << "status error\nreason expected_walls_label\n";
        return 0;
    }
    if (label == "walls") {
        int wallCount;
        if (!(std::cin >> wallCount)) {
            std::cout << "status error\nreason invalid_wall_count\n";
            return 0;
        }
        for (int i = 0; i < wallCount; ++i) {
            int wx, wy;
            if (std::cin >> wx >> wy) {
                grid.setWall(wx, wy, true);
            }
        }
    } else {
        std::cout << "status error\nreason expected_walls_label_matching\n";
        return 0;
    }
    
    // Parse weights
    if (!(std::cin >> label)) {
        std::cout << "status error\nreason expected_weights_label\n";
        return 0;
    }
    if (label == "weights") {
        int weightCount;
        if (!(std::cin >> weightCount)) {
            std::cout << "status error\nreason invalid_weight_count\n";
            return 0;
        }
        for (int i = 0; i < weightCount; ++i) {
            int wx, wy, w;
            if (std::cin >> wx >> wy >> w) {
                grid.setWeight(wx, wy, w);
            }
        }
    } else {
        std::cout << "status error\nreason expected_weights_label_matching\n";
        return 0;
    }
    
    std::vector<std::pair<int, int>> visitedOrder;
    std::vector<std::pair<int, int>> path;
    bool pathFound = false;
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    if (algorithm == "BFS") {
        pathFound = runBFS(grid, visitedOrder, path);
    } else if (algorithm == "DFS") {
        pathFound = runDFS(grid, visitedOrder, path);
    } else if (algorithm == "Dijkstra") {
        pathFound = runDijkstra(grid, visitedOrder, path);
    } else if (algorithm == "AStar") {
        pathFound = runAStar(grid, visitedOrder, path);
    } else {
        std::cout << "status error\nreason unknown_algorithm\n";
        return 0;
    }
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime).count();
    
    double pathCost = 0.0;
    if (pathFound && !path.empty()) {
        // Path cost is sum of weights of the path nodes, excluding start node
        for (size_t i = 1; i < path.size(); ++i) {
            pathCost += grid.getNode(path[i].first, path[i].second).weight;
        }
    }
    
    std::cout << "status ok\n";
    std::cout << "execution_time_us " << duration << "\n";
    std::cout << "nodes_visited_count " << visitedOrder.size() << "\n";
    std::cout << "path_cost " << pathCost << "\n";
    std::cout << "path_found " << (pathFound ? 1 : 0) << "\n";
    
    std::cout << "visited\n";
    std::cout << visitedOrder.size() << "\n";
    for (const auto& node : visitedOrder) {
        std::cout << node.first << " " << node.second << "\n";
    }
    
    std::cout << "path\n";
    std::cout << path.size() << "\n";
    for (const auto& node : path) {
        std::cout << node.first << " " << node.second << "\n";
    }
    
    return 0;
}
