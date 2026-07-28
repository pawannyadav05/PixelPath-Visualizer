#ifndef GRID_H
#define GRID_H

#include <vector>
#include "Node.h"

class Grid {
private:
    int cols;
    int rows;
    std::vector<std::vector<Node>> matrix;
    int startX, startY;
    int endX, endY;

public:
    Grid(int cols, int rows);
    
    int getCols() const { return cols; }
    int getRows() const { return rows; }
    
    int getStartX() const { return startX; }
    int getStartY() const { return startY; }
    int getEndX() const { return endX; }
    int getEndY() const { return endY; }
    
    void setStart(int x, int y);
    void setEnd(int x, int y);
    void setWall(int x, int y, bool isWall);
    void setWeight(int x, int y, int weight);
    
    bool isValid(int x, int y) const;
    bool isWall(int x, int y) const;
    int getWeight(int x, int y) const;
    
    Node& getNode(int x, int y);
    const Node& getNode(int x, int y) const;
    
    std::vector<std::pair<int, int>> getNeighbors(int x, int y) const;
    
    void clearAlgorithmState();
    void reset();
};

#endif // GRID_H
