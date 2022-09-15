set -e;

CTX=$1
IMAGE=$2

docker buildx build $CTX -t $IMAGE --cache-from type=local,src=/opt/docker-cache --cache-to type=local,dest=/opt/docker-cache
docker push $IMAGE