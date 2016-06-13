# timeToWork

# setup
In docker-machine shell:
  export SSH_AUTH_SOCK="S:\projects\keeagent.socket"

Run Mongo:
  docker run -d --name ttw-mongo -v ttw-db:/data/db --net=ttw-internal-network mongo

Backup and restore Mongo:
  docker exec -it ttw-mongo bash
Use mongodump and mongorestore
docker cp to move backup files around
 
Shell into same net and volumes as Mongo:
  docker run -it --rm --net=ttw-internal-network --volumes-from=ttw-mongo mongo bash

Build app and run it:
  docker build -t ttw:alpha .
  docker run -d --name ttw-node --net=ttw-internal-network -p 80:8000 -e "TTW_GOOGLE_DISTANCE_MATRIX_API_KEY=<redacted>" -e "TTW_PLACES_JSON_STRING=<redacted>" -e "TTW_MONGODB_URL=<redacted>" ttw:alpha

