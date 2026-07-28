#ifndef NODE_H
#define NODE_H

enum class NodeType {
    EMPTY = 0,
    START = 1,
    END = 2,
    WALL = 3
};

struct Node {
    int x;
    int y;
    int weight; // 1 for normal, >1 for weighted cells
    NodeType type;
    
    // Algorithm states
    bool visited;
    double g_score; // Cost from start to current node
    double h_score; // Heuristic cost from current node to end
    double f_score; // g_score + h_score
    
    // Parent coordinates for path reconstruction (-1, -1 if no parent)
    int parent_x;
    int parent_y;
    
    Node() : x(0), y(0), weight(1), type(NodeType::EMPTY), visited(false),
             g_score(1e9), h_score(0.0), f_score(1e9), parent_x(-1), parent_y(-1) {}
             
    Node(int x, int y, int w = 1, NodeType t = NodeType::EMPTY) 
        : x(x), y(y), weight(w), type(t), visited(false),
          g_score(1e9), h_score(0.0), f_score(1e9), parent_x(-1), parent_y(-1) {}
};

#endif // NODE_H
