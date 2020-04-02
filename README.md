liferay-collaborative-dynamic-list
==================

Collaborative dynamic list in real time for multiple users for Liferay 7.


## Docker local environment startup
### Prerequisites
- Java 8 +
- [Docker](https://docs.docker.com/docker-for-mac/install/)

### Startup
- Run `./gradlew createDockerContainer`, this creates container and build modules for deployment
- Run `docker container start CONTAINER_ID`
- Run `./gradlew logsDockerContainer`

### Other useful commands
- Run `./gradlew cleanDockerImage` to remove data, container and clean image
- Run `./gradlew tasks`  to list all the gradlew commands, listed tasks names might be different based on your wrapper version
- Run `./gradlew dockerDeploy` deploys project (modules, plugins, etc) to docker
- Run `docker container start CONTAINER_ID` to start previously created container
- Run `docker container stop CONTAINER_ID` to stop previously started container
