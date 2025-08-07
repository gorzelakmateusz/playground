# docker stop <id>

# (1) clear one
docker stop $(docker ps -aq) || true
docker rm $(docker ps -aq) || true
docker rmi iot-hub-app -f || true
docker builder prune -f

# (2) clear one
docker rm -f $(docker ps -aq --filter ancestor=iot-hub-app) 2>/dev/null || true
docker rmi iot-hub-app -f || true
docker builder prune -f

# clear all
docker stop $(docker ps -aq) || true
docker rm $(docker ps -aq) || true
docker rmi iot-hub-app -f || true
docker builder prune -f
docker system prune -f

# build
docker build -t iot-hub-app .

# start 
docker run -p 3000:3000 -v "${PWD}/data:/app/data" iot-hub-app

# docker-compose
docker-compose up
docker-compose up -d --build
docker-compose up --build
docker-compose down
