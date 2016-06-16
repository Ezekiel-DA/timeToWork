FROM node:onbuild
MAINTAINER Nicolas Lefebvre <nicolas.lefebvre.lp@gmail.com>

# set timezone correctly
ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# expose mongo server port
EXPOSE 8000