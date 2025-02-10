FROM node:20

WORKDIR /url_shortener

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm" ,"run","start:dev"]
