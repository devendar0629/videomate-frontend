FROM node:lts-alpine AS build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN --mount=type=secret,id=env_file,target=/app/.env \
                                            npm run build


FROM nginx:stable-alpine AS run

WORKDIR /app

COPY --from=build /app/dist /usr/share/nginx/html

CMD [ "nginx", "-g" , "daemon off;" ]