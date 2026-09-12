# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy only production deps and source
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY package.json ./

EXPOSE 3001

CMD ["node", "src/server.js"]
