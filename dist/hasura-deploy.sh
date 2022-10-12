set -x;

hasura --skip-update-check migrate apply --insecure-skip-tls-verify --all-databases
hasura --skip-update-check metadata apply --insecure-skip-tls-verify