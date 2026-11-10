#!/usr/bin/env bash
# The environment of the bot on the dov118 server (cf. server-setup.md of dov118/infra): prod on
# main, preprod (v3) on preprod. Rejouable.
# Usage: INFRA_DIR=<clone of dov118/infra> SOURCE_KUBECONFIG=<admin kubeconfig of the desastre
#        server> deploy/env.sh prod|preprod
#
# From the desastre server, only read: its Discord token (*-app-creds), the name and user of the
# base, then the base itself. Here: the namespace, the base, its user and grant, the pull secret,
# the base copied the first time, then deploy/ applied. The bot is left at zero: two bots on one
# token would announce everything twice, so it starts once the old one is stopped.
set -euo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${INFRA_DIR:?INFRA_DIR is the clone of dov118/infra}"
# shellcheck source=/dev/null
. "${INFRA_DIR}/init/lib.sh"
# shellcheck source=/dev/null
. "${INFRA_DIR}/config.env"
require_var DOMAIN
require_source

case "${1:-}" in
  prod) ns=eso-status-bot prefix=eso-status-bot ;;
  preprod) ns=eso-status-bot-preprod prefix=eso-status-bot-preprod ;;
  *)
    log "ERROR: usage: $0 prod|preprod"
    exit 1
    ;;
esac
secrets_dir="${INFRA_DIR}/.secrets"

log "Namespace and Discord token of ${1}"
kubectl create namespace "${ns}" --dry-run=client -o yaml | kubectl apply -f -
copy_secret_from_source "${ns}" "${prefix}-app-creds"

log "The base"
base="$(source_value "${ns}" "${prefix}-database-creds" DB_NAME)"
user="$(source_value "${ns}" "${prefix}-database-creds" DB_USER)"
password="$(gen_password "$(printf '%s' "${user}" | tr '[:lower:]-' '[:upper:]_')" "${secrets_dir}/desastre-mariadb.env")"
mariadb_base "${base}" "${user}" "${password}"
mariadb_copy "${base}"
printf 'DB_HOST=mariadb.database.svc\nDB_NAME=%s\nDB_USER=%s\nDB_PASSWORD=%s\n' \
  "${base}" "${user}" "${password}" |
  kubectl -n "${ns}" create secret generic "${prefix}-database-creds" --from-env-file=/dev/stdin \
    --dry-run=client -o yaml | kubectl apply -f -

harbor_pull_secret "${ns}" "${prefix}-harbor-creds" desastreshow "${secrets_dir}/desastreshow-harbor.env"

log "Applying ${deploy_dir}, the bot at zero"
kubectl apply -k "${deploy_dir}"
kubectl -n "${ns}" scale deploy --all --replicas=0
log "The bot ${1} applied. Once the old one is stopped: kubectl -n ${ns} scale deploy --all --replicas=1"
