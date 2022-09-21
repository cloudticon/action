set -e;
set -x;

ALLOC_ID=$1
NS=$2
NAME=$3

source ~/.nomad/waw

# nomad exec --task $NAME $ALLOC_ID pg_dump -U postgres -Fc  postgres >  ./tmp/$NS.sql
# kubectl scale statefulsets $NAME --replicas=0 -n $NS
# kubectl delete pvc $NAME-data-data-$NAME-0 -n $NS
# kubectl scale statefulsets $NAME --replicas=1 -n $NS
# kubectl wait -l statefulset.kubernetes.io/pod-name=$NAME-0 --for=condition=ready pod --timeout=-1s -n $NS
kubectl cp ./tmp/$NS.sql $NS/$NAME-0:/tmp/dump.sql

kubectl exec -it $NAME-0 -n $NS -- pg_restore -c -C -d postgres -U postgres /tmp/dump.sql

