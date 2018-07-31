FROM node:8

RUN apt-get update

RUN apt-get install python-dev python-pip -y

RUN pip install awscli

RUN AWS_ACCESS_KEY_ID= AWS_SECRET_ACCESS_KEY=   aws s3 cp s3://skycatch-devops-challenge-prateek . --recursive

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]