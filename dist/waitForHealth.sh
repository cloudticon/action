set -e;
timeout 10 bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' $URL)" != "$CODE" ]]; do sleep 5; done' || false