set -x;

CTX=$1
IMAGE=$2

docker buildx build $CTX \
    -t $IMAGE \
    --cache-from type=local,src=/tmp/docker-cache \
    --cache-to type=local,dest=/tmp/docker-cache-new \
    --load

docker push $IMAGE
rm -rf /tmp/docker-cache
mv /tmp/docker-cache-new /tmp/docker-cache