set -e;

hasura --skip-update-check migrate apply --insecure-skip-tls-verify
hasura --skip-update-check metadata apply --insecure-skip-tls-verify