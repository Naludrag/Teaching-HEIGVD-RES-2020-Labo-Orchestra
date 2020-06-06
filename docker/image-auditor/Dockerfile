FROM node:13.11.0

RUN apt-get update && \
  apt-get install -y vim

COPY src/ /opt/app

WORKDIR /opt/app

RUN npm install

EXPOSE 2205 2206

CMD [ "npm", "start" ]