#ifndef MIN_HEAP_H
#define MIN_HEAP_H

#include <vector>
#include <stdexcept>
#include <utility>

struct HeapNode {
    double score;
    int x;
    int y;
};

class MinHeap {
private:
    std::vector<HeapNode> heap;
    
    void heapifyUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (heap[parent].score > heap[index].score) {
                std::swap(heap[parent], heap[index]);
                index = parent;
            } else {
                break;
            }
        }
    }
    
    void heapifyDown(int index) {
        int size = heap.size();
        while (2 * index + 1 < size) {
            int leftChild = 2 * index + 1;
            int rightChild = 2 * index + 2;
            int smallest = index;
            
            if (heap[leftChild].score < heap[smallest].score) {
                smallest = leftChild;
            }
            if (rightChild < size && heap[rightChild].score < heap[smallest].score) {
                smallest = rightChild;
            }
            
            if (smallest != index) {
                std::swap(heap[index], heap[smallest]);
                index = smallest;
            } else {
                break;
            }
        }
    }

public:
    MinHeap() {}
    
    bool isEmpty() const {
        return heap.empty();
    }
    
    int size() const {
        return heap.size();
    }
    
    void insert(double score, int x, int y) {
        heap.push_back({score, x, y});
        heapifyUp(heap.size() - 1);
    }
    
    HeapNode extractMin() {
        if (heap.empty()) {
            throw std::runtime_error("Heap is empty");
        }
        HeapNode minNode = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) {
            heapifyDown(0);
        }
        return minNode;
    }
};

#endif // MIN_HEAP_H
