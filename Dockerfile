# Multi-stage build for SMB Owner
FROM node:20-slim AS base

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libpoppler-cpp-dev \
    pkg-config \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci

# Install Python dependencies in virtual environment
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-slim

# Install Python runtime and poppler
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    libpoppler-cpp-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python virtual environment from build stage
COPY --from=base /opt/venv /opt/venv

# Copy built application from base
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/next.config.* ./

# Set Python path to use virtual environment
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONPATH="/opt/venv/lib/python3.11/site-packages:$PYTHONPATH"

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
