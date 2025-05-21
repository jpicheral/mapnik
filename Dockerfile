FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
  build-essential \
  python3 \
  python3-pip \
  curl \
  git \
  ca-certificates \
  libmapnik-dev \
  mapnik-utils \
  nodejs \
  npm

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3000
CMD ["node", "server.js"]
