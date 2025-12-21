FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN --mount=type=secret,id=env_file,target=/app/.env \
                                            npm run build


FROM nginx:1.28-alpine AS run

WORKDIR /app

COPY --from=build /app/dist /usr/share/nginx/html

CMD [ "nginx", "-g" , "daemon off;" ]