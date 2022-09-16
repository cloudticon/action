set -x;
set -e;

CTX=$1
IMAGE=$2

docker buildx build $CTX \
    -t $IMAGE \
    --build-arg BUILDKIT_CONTEXT_KEEP_GIT_DIR=1 \
    --cache-from type=gha \
    --cache-to type=gha,mode=max \
    --push

rm -rf /tmp/docker-cache
mv /tmp/docker-cache-new /tmp/docker-cache