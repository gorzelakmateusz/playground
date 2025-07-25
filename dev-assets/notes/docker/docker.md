# 🐳 Essential Docker Commands

## 🏗️ Building and Managing Images
`docker build -t <image_name> .` # Builds an image from the Dockerfile in the current directory and tags it.
`docker images` # Lists all local Docker images.
`docker rmi <image_name_or_id>` # Removes a Docker image.
`docker pull <image_name>` # Downloads an image from Docker Hub or another registry.
`docker push <image_name>` # Pushes an image to a registry.


## 🏃 Running and Managing Containers
`docker run -p <host_port>:<container_port> -d <image_name>` # Runs a container in detached mode (background), mapping ports.
`docker run -it <image_name> /bin/bash` # Runs a container and opens an interactive bash session inside it.
`docker ps` # Lists all currently running containers.
`docker ps -a` # Lists all containers (including stopped ones).
`docker start <container_name_or_id>` # Starts a stopped container.
`docker stop <container_name_or_id>` # Stops a running container.
`docker restart <container_name_or_id>` # Restarts a container.
`docker rm <container_name_or_id>` # Removes a container (it must be stopped first).
`docker logs <container_name_or_id>` # Displays the logs of a container.
`docker exec -it <container_name_or_id> <command>` # Executes a command inside a running container.


## 💾 Managing Volumes
`docker volume create <volume_name>` # Creates a new Docker volume.
`docker volume ls` # Lists all Docker volumes.
`docker volume inspect <volume_name>` # Shows detailed information about a volume.
`docker volume rm <volume_name>` # Removes a volume.
`docker run -v <volume_name>:/path_in_container> <image_name>` # Runs a container with a mounted volume.


## 🌐 Managing Networks
`docker network create <network_name>` # Creates a new bridge network.
`docker network ls` # Lists all Docker networks.
`docker network inspect <network_name>` # Shows detailed information about a network.
`docker network rm <network_name>` # Removes a network.
`docker run --network <network_name> <image_name>` # Runs a container within a specified network.

## 🧹 Cleaning Up Docker System
`docker system prune` # Removes unused images, containers, volumes, and networks.
`docker system prune -a` # Removes *all* unused Docker objects (including dangling images not associated with named containers).