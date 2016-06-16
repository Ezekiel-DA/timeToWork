# timeToWork

## setup
In a docker-machine shell:

    export SSH_AUTH_SOCK=<path_to_socket_file>

## build
    docker login
    docker build -t nicolaslefebvre/ttw:alpha .
    docker push nicolaslefebvre/ttw

## deploy
### Run Mongo
    docker run -d --name ttw-mongo -v ttw-db:/data/db --net=ttw-internal-network mongo

### Run TTW
    docker pull nicolaslefebvre/ttw
    docker run -d --name ttw-node --net=ttw-internal-network -p 80:8000 -e "NODE_ENV=production" -e "TTW_MONGODB_URL=mongodb://ttw-mongo:27017/ttw" -e "TTW_GOOGLE_DISTANCE_MATRIX_API_KEY=<redacted>" -e "TTW_PLACES_JSON_STRING=<redacted>" nicolaslefebvre/ttw:alpha

## Useful stuff
### Backup and restore Mongo
    docker exec -it ttw-mongo bash
Use docker cp, mongodump and mongorestore
 
### Open a shell into the same net and volumes as Mongo:
    docker run -it --rm --net=ttw-internal-network --volumes-from=ttw-mongo mongo bash
