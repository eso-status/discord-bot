#!/usr/bin/env bash
# The Discord bot of eso-status on the dov118 server (cf. server-setup.md of dov118/infra). Rejouable.
# Usage: INFRA_DIR=<clone of dov118/infra> [SOURCE_KUBECONFIG=<admin kubeconfig of the desastre
#        server>] deploy/init/03-env.sh prod|preprod
#
# Its namespace, its Discord token, its base, user and grant in the shared MariaDB, its pull
# secret, then deploy/<env>/ applied at the image and replicas in service. The values are stored
# in .secrets/ of INFRA_DIR; the first time, read on the desastre server when SOURCE_KUBECONFIG is
# set, otherwise asked. Created at zero replicas: two bots on one token would announce everything
# twice, so it starts once the old one is stopped. The data: 05-copy-env.sh.
set -euo pipefail

init_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
deploy_dir="$(dirname "${init_dir}")"
: "${INFRA_DIR:?INFRA_DIR is the clone of dov118/infra}"
# shellcheck source=/dev/null
. "${INFRA_DIR}/init/lib.sh"
# shellcheck source=/dev/null
. "${INFRA_DIR}/config.env"
require_var DOMAIN
require_jq

env_name="${1:-}"
case "${env_name}" in
  prod) ns=eso-status-bot prefix=eso-status-bot deployment=eso-status-bot-deploy ;;
  preprod) ns=eso-status-bot-preprod prefix=eso-status-bot-preprod deployment=eso-status-bot-preprod-deploy ;;
  *)
    log "ERROR: usage: $0 prod|preprod"
    exit 1
    ;;
esac

manifests="${deploy_dir}/${env_name}"
secrets_dir="${INFRA_DIR}/.secrets"
secrets_file="${secrets_dir}/eso-status-bot-${env_name}.env"
umask 077
tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"; minio_close' EXIT

log "Namespace of ${env_name}"
kubectl apply -f "${manifests}/namespace.yaml"

log "The application secret"
{
  printf 'DISCORD_TOKEN=%s\n' "$(stored_or_source DISCORD_TOKEN "${secrets_file}" "${ns}" "${prefix}-app-creds")"
} > "${tmp_dir}/app.env"
kubectl -n "${ns}" create secret generic "${prefix}-app-creds" --from-env-file="${tmp_dir}/app.env" \
  --dry-run=client -o yaml | kubectl apply -f -

log "The base, its user and its grant"
base="$(stored_or_source DB_NAME "${secrets_file}" "${ns}" "${prefix}-database-creds")"
user="$(stored_or_source DB_USER "${secrets_file}" "${ns}" "${prefix}-database-creds")"
password="$(gen_password "$(printf '%s' "${user}" | tr '[:lower:]-' '[:upper:]_')" "${secrets_dir}/desastre-mariadb.env")"
mariadb_base "${base}" "${user}" "${password}"
printf 'DB_HOST=mariadb.database.svc\nDB_NAME=%s\nDB_USER=%s\nDB_PASSWORD=%s\n' "${base}" "${user}" "${password}" |
  kubectl -n "${ns}" create secret generic "${prefix}-database-creds" --from-env-file=/dev/stdin \
    --dry-run=client -o yaml | kubectl apply -f -

log "The Harbor pull secret"
harbor_pull_secret "${ns}" "${prefix}-harbor-creds" desastreshow "${secrets_dir}/desastreshow-harbor.env"

log "Applying ${manifests}"
apply_kustomization "${manifests}" "${ns}" "${deployment}" zero-when-new
log "The Discord bot of eso-status ${env_name} applied."
