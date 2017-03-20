FROM node:7.7.3-onbuild
MAINTAINER Nicolas Lefebvre <nicolas.lefebvre.lp@gmail.com>

# set timezone correctly
ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# build Node app
RUN NODE_ENV=production ./node_modules/.bin/gulp browserify

# expose mongo server port
EXPOSE 8000