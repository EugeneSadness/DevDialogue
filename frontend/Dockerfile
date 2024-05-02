FROM node:20-bullseye

WORKDIR /usr/app/front

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]