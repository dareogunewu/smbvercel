# Multi-stage build for SMB Owner
FROM node:20-slim AS base

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci

# Install Python dependencies (PEP 668 - use --break-system-packages for Docker)
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-slim

# Install Python runtime and poppler
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libpoppler-cpp-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from base
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/public ./public
COPY --from=base /app/scripts ./scripts

# Copy Python packages from build stage
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Set Python path
ENV PATH="/usr/local/bin:$PATH"
ENV PYTHONPATH="/usr/local/lib/python3.11/site-packages:$PYTHONPATH"

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
