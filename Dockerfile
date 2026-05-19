FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
LABEL io.modelcontextprotocol.server.name="io.github.rival-intelligence/rival-regulatory-toolkit"
LABEL org.opencontainers.image.source="https://github.com/rival-intelligence/rival-regulatory-toolkit"
LABEL org.opencontainers.image.description="MCP server for Rival's source-grounded regulatory retrieval API"

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY fixtures ./fixtures
COPY schemas ./schemas
COPY openapi ./openapi
COPY README.md LICENSE ./

CMD ["node", "dist/mcp/server.js"]
