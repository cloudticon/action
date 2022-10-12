set -e;
echo "Waiting for $URL $CODE time: $TIME"
timeout $TIME bash -c 'while [[ "$(curl -k -s -o /dev/null -w ''%{http_code}'' $URL)" != "$CODE" ]]; do sleep 5; done' || false