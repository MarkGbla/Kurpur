# Install and run Kurpur in Linux (avoids Windows path/EPERM issues)
FROM node:20-alpine

WORKDIR /app

# Install deps first (better layer cache)
COPY package*.json ./
COPY .npmrc* ./
RUN npm install

# Copy app
COPY . .

# Dev: expose 3000, run next dev
EXPOSE 3000
ENV NODE_ENV=development
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
