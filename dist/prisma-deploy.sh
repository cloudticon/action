if kubectl_ports=$(kubectl port-forward --daemonize statefulset/postgres 5432:5432 -n payticon-3-development)
then
  local_addr=$(jq -r '.|first|.local.addr_and_port' <<<$kubectl_ports)
  kubectl_pid=$(jq -r '.pid' <<<$kubectl_ports)
  echo "bound to ${local_addr}"
else
  errcode=$?
  echo "ERROR: kubectl port-forward exited with code $errcode, could not establish port forwards"
  exit $errcode
fi
echo "OK"
cd /home/krs/Projects/payticon/frontend-eshop
yarn prisma migrate deploy

kill $kubectl_pid