# Use a lightweight Node.js base image
FROM node:20-slim

# Install C++ compiler (g++), make, and clean up apt caches
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package configuration
COPY package.json ./

# Copy the C++ backend code and compile it inside the Linux environment
COPY backend ./backend
RUN make -C backend

# Copy the server configuration and front-end public files
COPY server.js ./
COPY public ./public

# Expose the port the server listens on
EXPOSE 3000

# Define runtime environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Command to launch the application
CMD ["npm", "start"]
