# Déploiement du bot Discord eso-status (K3S du serveur dov118)

> Manifestes versionnés **par environnement** dans `prod/` (v2, branche `main`) et `preprod/` (v3,
> branche `preprod`) : `namespace.yaml`, `deployment.yaml`, `cd-rbac.yaml` (le compte du CD) et
> `kustomization.yaml`. Ils sont posés par **`init/03-env.sh <env>`** ; le CD ne fait que changer
> l'image du déploiement.
>
> Infra sous-jacente (cluster, Harbor, **MariaDB partagé**…) : le runbook de
> [`dov118/infra`](https://github.com/dov118/infra), `server-setup.md`.

## Une seule instance

Le Deployment est en `Recreate` : deux bots sur un même jeton annonceraient tout deux fois. Pour la
même raison, `03-env.sh` le crée **à zéro réplique** ; il démarre une fois l'ancien arrêté
(`kubectl -n eso-status-bot scale deploy --all --replicas=1`).

## Base de données — MariaDB partagé

La base, son utilisateur et ses droits sont des objets de **mariadb-operator** (`Database`, `User`,
`Grant`, namespace `database`), créés par `03-env.sh` sous les noms en service sur l'ancien
serveur. Le bot joint `mariadb.database.svc` sur `3306`, en `ClusterIP`.

## Les scripts

Lancés sur le serveur, en root, avec `INFRA_DIR` (le clone de `dov118/infra`, dont ils emploient
les fonctions communes) :

- `deploy/init/03-env.sh prod|preprod` — le namespace, le compte du CD, le jeton Discord, la base
  et son utilisateur, les secrets, puis les manifestes, appliqués à l'image et aux répliques **en
  service** : rejoué, il ne démarre ni n'arrête rien, et ne demande rien.
- `deploy/init/05-copy-env.sh prod|preprod` — la base copiée **une fois**, depuis le serveur
  desastre (`SOURCE_KUBECONFIG`), comparée au dump ligne par ligne, le bot arrêté le temps de la
  copie.

## Secrets (provisionnés par `03-env.sh`)

- `eso-status-bot-app-creds` — `DISCORD_TOKEN`, repris de l'ancien serveur.
- `eso-status-bot-database-creds` — `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (généré).
- `eso-status-bot-harbor-creds` — pull secret (robot Harbor **`k8s-pull`** du projet
  `desastreshow`).

En preprod, les mêmes sous le préfixe `eso-status-bot-preprod-`. Les valeurs vivent dans
`.secrets/` d'`INFRA_DIR`.

## Sauvegarde

`deploy/<env>/backup.yaml`, un `Backup` de mariadb-operator posé par `03-env.sh` dans le
namespace `database` : chaque nuit (3 h 05 en prod, 3 h 15 en preprod), le dump gzip de la base,
`backup.<date>.sql.gz`, dans le bucket de sauvegarde de **desastre** (son AWS), sous
`eso-status-bot-<env>/`, chiffré SSE-C avec la clé de desastre et gardé 30 jours. Son secret,
`desastre-backup` (namespace `database`), est commun à toutes les applis de desastre : le
bucket, les clés de son utilisateur et la clé de chiffrement vivent dans
`.secrets/desastre-backup.env`. Marche AWS, restauration et messages : `server-setup.md`
d'infra, « Sauvegardes des applications ».

## Le CD

1. Un push sur `release/<version>` : `CD.yaml` construit l'image, la pousse dans
   `harbor.dov118.dev/desastreshow/eso_status_discord_bot:<version>` et pose le tag.
2. La PR `release/<version>` (ouverte à la main) fusionnée dans `main` : `RELEASE.yaml` passe
   le déploiement sur cette image (`kubectl set image`), attend le déploiement, puis crée la
   release GitHub.

Il agit par le compte **`eso-status-bot-cd`** (`cd-rbac.yaml`), limité au changement d'image de son
Deployment : il ne lit aucun secret et ne touche à rien d'autre sur le serveur. Tout le reste de
`deploy/<env>/` (manifestes, réglages du déploiement, ce compte) est posé par `03-env.sh`, qui garde
l'image en service : un changement de `deploy/` s'applique en le rejouant.

Ses secrets GitHub : `KUBE_CONFIG` (le kubeconfig de ce compte, tiré par `init/cd-kubeconfig.sh`
d'infra), `HARBOR_URL`, `HARBOR_PROJECT`, `HARBOR_REPOSITORY`, `HARBOR_USERNAME` (robot
`github-cd`), `HARBOR_PASSWORD`, et `CUSTOM_TOKEN` (un jeton fine-grained de l'organisation, droit
*Contents* en écriture, avec une date d'expiration).

## Grafana

`03-env.sh` pose aussi, sur le Grafana du serveur (`server-setup.md` d'infra, « Grafana ») :

- **son tableau métier** `deploy/grafana/dashboard.json` (salons et serveurs abonnés, ressources,
  journaux), un seul pour la prod et la preprod : sa liste *Environnement* lit les bases dans
  MariaDB, et le namespace suit. Sa kustomization le pose dans le dossier *eso-status* ;
- **l'accès en lecture** de `grafana-reader` à la base de l'environnement.

Le bot ne sert rien en HTTP, donc il n'a pas de sonde. L'alerte « application sans tous ses pods
prêts » le couvre.
