set -x;
set -e;

CTX=$1
IMAGE=$2
BUILDX_NO_DEFAULT_LOAD=1

ls -la /tmp/docker-cache/blobs/sha256

docker build $CTX \
    -t $IMAGE \
    --build-arg BUILDKIT_CONTEXT_KEEP_GIT_DIR=1 \
    --cache-from type=local,src=/tmp/docker-cache \
    --cache-to type=local,mode=max,dest=/tmp/docker-cache-new \
    --push

rm -rf /tmp/docker-cache
mv /tmp/docker-cache-new /tmp/docker-cache