# Dockerfile for fullstack support system (Flask backend + React frontend)

# ---------- Build frontend ----------
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY support-system-frontend/package*.json ./
COPY support-system-frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY support-system-frontend/ ./
RUN pnpm run build

# ---------- Build backend ----------
FROM python:3.11-slim
WORKDIR /app

# Copy backend
COPY support-system-backend ./support-system-backend
WORKDIR /app/support-system-backend

# Install requirements
RUN pip install --upgrade pip && pip install -r requirements.txt

# Create static directory
RUN mkdir -p ./src/static

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist/index.html ./src/static/
COPY --from=frontend-build /app/frontend/dist/assets ./src/static/assets/

# Expose Flask port
EXPOSE 5002

# Set environment variables for Flask
ENV FLASK_APP=src/main.py
ENV FLASK_RUN_PORT=5002
ENV FLASK_ENV=production

# Run Flask app
CMD ["python", "src/main.py"]
