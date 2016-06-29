# timeToWork

[![CircleCI](https://circleci.com/gh/Ezekiel-DA/timeToWork.svg?style=shield)](https://circleci.com/gh/Ezekiel-DA/timeToWork)

## Prerequisites
You'll need:
- an API key for the [Google Distance Matrix API](https://www.google.com/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=distance%20matrix%20api).
You'll need to create a project on the Google APIs Console, you can name it whatever you want. If you're asked for a key type, create a server key.
You MUST key this key secret. Don't commit it to a public repo.
- a JSON description of your home and work addresses, in this format : `{"home": "<home address>", "work": "<work address>"}`.
Your home and work addresses should be strings that Google Maps is capable of parsing, e.g. `"10 Nonesuch Lane, Nowhere, 01234, Country"`.
- a Linux box to run the app; this can be your dev box, a manually created VM, a Docker Machine created VirtualBox VM, some kind of Cloud host, etc.
- Docker Engine installed on your Linux box. You can install this manually with `apt-get`, or let Docker Machine do all the work for you, VM provisioning included (e.g. for [Digital Ocean](https://docs.docker.com/machine/examples/ocean/)). 

## Deployment only
If all you want to do is deploy without touching the code, you don't even need to clone the repo. You can just:
- point Docker Machine to your deployment target
- start a MongoDB container
- start the app container from the image delivered to Docker Hub

In other words:

    eval $(docker-machine env <target_env>)
    docker run -d --name ttw-mongo -v ttw-db:/data/db --net=ttw-internal-network mongo
    docker run -d --name ttw-node --net=ttw-internal-network -p 80:8000 -e "NODE_ENV=production" -e "TTW_MONGODB_URL=mongodb://ttw-mongo:27017/ttw" -e "TTW_GOOGLE_DISTANCE_MATRIX_API_KEY=<your API key>" -e "TTW_PLACES_JSON_STRING=<your address string>" nicolaslefebvre/ttw:alpha

Don't forget to escape the `"`s in your address JSON ! (e.g. `-e "TTW_PLACES_JSON_STRING={\"home\":\"<address>\",\"work\":\"<address>"}"`

## Building from source

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

## Misc useful stuff
### Services I've used
- Namesilo as a registrar
- DigitalOcean as a Cloud host

### Backup and restore Mongo
    docker exec -it ttw-mongo bash
Use docker cp, mongodump and mongorestore, for example:

    docker exec ttw-mongo mongodump --db=ttw --gzip --archive=/tmp/dump.mongo
    docker cp ttw-mongo:/tmp/dump.mongo ./private/

Change to another env and then:

    docker cp ./private/dump.mongo ttw-mongo:/tmp/dump.mongo
    docker exec ttw-mongo mongorestore --gzip --archive=/tmp/dump.mongo
     
### Open a shell into the same net and volumes as Mongo:
    docker run -it --rm --net=ttw-internal-network --volumes-from=ttw-mongo mongo bash

### using ssh keys stored in Keepass2
- install [KeePass2](http://keepass.info/download.html)
- install [KeeAgent](http://lechnology.com/software/keeagent/)
- configure KeeAgent to [use a Cygwin socket](http://lechnology.com/software/keeagent/usage/options-and-settings/)
- attach SSH keys to a Keepass2 entry and [configure KeeAgent](http://lechnology.com/software/keeagent/usage/quick-start/). SSH and Putty key formats are both accepted.
- in a docker-machine shell: `export SSH_AUTH_SOCK=<path_to_socket_file>`
