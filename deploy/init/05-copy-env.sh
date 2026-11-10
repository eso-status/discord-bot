#!/usr/bin/env bash
# The data of the bot copied from the desastre server (cf. server-setup.md of dov118/infra),
# once, at the switch: the base here replaced whole by the source's (compared with the dump, row
# by row). The deployments here are stopped during the copy, then put back at their
# replicas. The applications of the desastre server are stopped first, or what they write after
# the dump is lost. Runs after 03-env.sh, which stores the name of the base.
# Usage: INFRA_DIR=<clone of dov118/infra> SOURCE_KUBECONFIG=<admin kubeconfig of the desastre
#        server> deploy/init/05-copy-env.sh prod|preprod
set -euo pipefail

: "${INFRA_DIR:?INFRA_DIR is the clone of dov118/infra}"
# shellcheck source=/dev/null
. "${INFRA_DIR}/init/lib.sh"
require_source

env_name="${1:-}"
case "${env_name}" in
  prod) ns=eso-status-bot ;;
  preprod) ns=eso-status-bot-preprod ;;
  *)
    log "ERROR: usage: $0 prod|preprod"
    exit 1
    ;;
esac
secrets_file="${INFRA_DIR}/.secrets/eso-status-bot-${env_name}.env"
base="$(sed -n 's/^DB_NAME=//p' "${secrets_file}" 2>/dev/null | head -n1)"
[ -n "${base}" ] || { log "ERROR: no base stored for ${env_name}: run 03-env.sh first"; exit 1; }
trap minio_close EXIT

log "Stopping ${ns} during the copy"
replicas="$(scaled_to_zero "${ns}")"
# Stopped they stay if the copy fails: an incomplete base is not served.
trap 'minio_close; log "ERROR: the copy failed, the deployments of ${ns} stay at zero; once fixed, run again"' EXIT
mariadb_replace "${base}"
restore_replicas "${ns}" <<< "${replicas}"
trap minio_close EXIT
log "The bot ${env_name} copied."
