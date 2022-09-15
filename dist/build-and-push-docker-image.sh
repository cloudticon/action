set -e;

CTX=$1
IMAGE=$2

docker build $CTX -t $IMAGE
docker push $IMAGE