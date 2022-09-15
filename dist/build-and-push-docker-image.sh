set -e;

CTX=$1
IMAGE=$2

docker buildx build $CTX -t $IMAGE --cache-from type=local,src=/opt/docker-cache/old --cache-to type=local,dest=/opt/docker-cache/new
docker push $IMAGE