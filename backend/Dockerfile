FROM node:20-bullseye

WORKDIR /usr/app/back

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]