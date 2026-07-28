CXX = clang++
CXXFLAGS = -std=c++17 -O3 -Wall -Wextra

SRCS = Grid.cpp Algorithms.cpp main.cpp
OBJS = $(SRCS:.cpp=.o)
TARGET = bin/pathfinder

all: $(TARGET)

$(TARGET): $(OBJS)
	mkdir -p bin
	$(CXX) $(CXXFLAGS) $(OBJS) -o $(TARGET)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -rf $(OBJS) bin

.PHONY: all clean
