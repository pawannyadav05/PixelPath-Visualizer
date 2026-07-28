#include "Grid.h"

Grid::Grid(int cols, int rows) : cols(cols), rows(rows), startX(-1), startY(-1), endX(-1), endY(-1) {
    matrix.resize(rows, std::vector<Node>(cols));
    for (int y = 0; y < rows; ++y) {
        for (int x = 0; x < cols; ++x) {
            matrix[y][x] = Node(x, y);
        }
    }
}

void Grid::setStart(int x, int y) {
    if (!isValid(x, y)) return;
    if (startX != -1 && startY != -1) {
        matrix[startY][startX].type = NodeType::EMPTY;
    }
    startX = x;
    startY = y;
    matrix[y][x].type = NodeType::START;
    matrix[y][x].weight = 1; // Start node shouldn't have weights/walls
}

void Grid::setEnd(int x, int y) {
    if (!isValid(x, y)) return;
    if (endX != -1 && endY != -1) {
        matrix[endY][endX].type = NodeType::EMPTY;
    }
    endX = x;
    endY = y;
    matrix[y][x].type = NodeType::END;
    matrix[y][x].weight = 1; // End node shouldn't have weights/walls
}

void Grid::setWall(int x, int y, bool isWall) {
    if (!isValid(x, y)) return;
    if (matrix[y][x].type == NodeType::START || matrix[y][x].type == NodeType::END) return;
    
    matrix[y][x].type = isWall ? NodeType::WALL : NodeType::EMPTY;
    if (isWall) {
        matrix[y][x].weight = 1; // Wall resets weight to 1
    }
}

void Grid::setWeight(int x, int y, int weight) {
    if (!isValid(x, y)) return;
    if (matrix[y][x].type == NodeType::START || matrix[y][x].type == NodeType::END || matrix[y][x].type == NodeType::WALL) return;
    
    matrix[y][x].weight = weight;
}

bool Grid::isValid(int x, int y) const {
    return x >= 0 && x < cols && y >= 0 && y < rows;
}

bool Grid::isWall(int x, int y) const {
    if (!isValid(x, y)) return false;
    return matrix[y][x].type == NodeType::WALL;
}

int Grid::getWeight(int x, int y) const {
    if (!isValid(x, y)) return 1;
    return matrix[y][x].weight;
}

Node& Grid::getNode(int x, int y) {
    return matrix[y][x];
}

const Node& Grid::getNode(int x, int y) const {
    return matrix[y][x];
}

std::vector<std::pair<int, int>> Grid::getNeighbors(int x, int y) const {
    std::vector<std::pair<int, int>> neighbors;
    // 4-directional moves (up, down, left, right)
    // Order: Up, Right, Down, Left (standard clockwise)
    int dx[] = {0, 1, 0, -1};
    int dy[] = {-1, 0, 1, 0};
    
    for (int i = 0; i < 4; ++i) {
        int nx = x + dx[i];
        int ny = y + dy[i];
        if (isValid(nx, ny) && !isWall(nx, ny)) {
            neighbors.push_back({nx, ny});
        }
    }
    return neighbors;
}

void Grid::clearAlgorithmState() {
    for (int y = 0; y < rows; ++y) {
        for (int x = 0; x < cols; ++x) {
            matrix[y][x].visited = false;
            matrix[y][x].g_score = 1e9;
            matrix[y][x].h_score = 0.0;
            matrix[y][x].f_score = 1e9;
            matrix[y][x].parent_x = -1;
            matrix[y][x].parent_y = -1;
        }
    }
}

void Grid::reset() {
    for (int y = 0; y < rows; ++y) {
        for (int x = 0; x < cols; ++x) {
            matrix[y][x] = Node(x, y);
        }
    }
    startX = -1;
    startY = -1;
    endX = -1;
    endY = -1;
}
