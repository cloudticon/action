set -e;

CTX=$1
IMAGE=$2

docker buildx build $CTX \
    -t $IMAGE \
    --cache-from type=local,src=.docker \
    --cache-to type=local,dest=.docker-new \
    --push

rm -rf .docker
mv .docker-new .docker
