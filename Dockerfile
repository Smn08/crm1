# Dockerfile for fullstack support system (Flask backend + React frontend)

# ---------- Build frontend ----------
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY support-system-frontend ./support-system-frontend
WORKDIR /app/frontend/support-system-frontend
RUN npm install -g pnpm && pnpm install && pnpm run build

# ---------- Build backend ----------
FROM python:3.11 AS backend-build
WORKDIR /app/backend
COPY support-system-backend ./support-system-backend
WORKDIR /app/backend/support-system-backend
RUN pip install --upgrade pip && pip install -r requirements.txt

# ---------- Final image ----------
FROM python:3.11-slim
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend/support-system-backend ./support-system-backend
# Copy frontend static build
COPY --from=frontend-build /app/frontend/support-system-frontend/dist ./support-system-backend/src/static

# Expose Flask port
EXPOSE 5002

# Set environment variables for Flask
ENV FLASK_APP=support-system-backend/src/main.py
ENV FLASK_RUN_PORT=5002
ENV FLASK_ENV=production

# Run Flask app
CMD ["python", "support-system-backend/src/main.py"]
