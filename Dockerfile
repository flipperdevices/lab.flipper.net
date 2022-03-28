FROM node:16-alpine as frontend
WORKDIR /app

RUN npm install -g @quasar/cli

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ .
RUN quasar build -m spa


FROM alpine

RUN apk update && apk add tzdata nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend /app/dist/spa /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]