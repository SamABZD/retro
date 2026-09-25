FROM node:22-alpine AS frontend
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN VITE_DEMO_MODE=true npm run build

FROM eclipse-temurin:21-jdk AS backend
WORKDIR /build/backend
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY backend/src src
COPY --from=frontend /build/frontend/dist/ src/main/resources/static/
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /build/backend/target/main-0.0.1-SNAPSHOT.jar app.jar
ENV SPRING_PROFILES_ACTIVE=portfolio
CMD ["sh", "-c", "exec java -jar app.jar --server.port=${PORT:-8080}"]
