# FROM node:20-alpine

# COPY ./Backend .

# RUN npm install

# CMD [ "node","src/server.js" ]



# Build the frontend [dist folder]
# Copy the dist folder content in Backend/public folder 

FROM node:20-alpine AS frontend-builder 

COPY ./Frontend /app

WORKDIR /app

RUN npm install

RUN npm run build 

# Build the backend 

FROM node:20-alpine

COPY ./Backend /app

WORKDIR /app

RUN npm install

COPY --from=frontend-builder /app/dist /app/public

CMD [ "node","src/server.js" ]
