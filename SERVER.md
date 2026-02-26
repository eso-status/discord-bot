## Passage en sudo
```bash
sudo -i
```

### Pour se connecter en local
Username admin et password correspond à la sortie de $HARBOR_ADMIN_PASSWORD
```bash
docker login harbor.kevin-c.fr
```
### Pour build et push un image depuis le local
```bash
docker buildx build \
  --platform linux/amd64 \
  -t harbor.kevin-c.fr/library/eso_status_discord_bot:0.0.3 \
  --no-cache \
  --push .
```
ou
```bash
docker tag harbor.kevin-c.fr/library/eso_status_discord_bot:0.0.1 harbor.kevin-c.fr/library/eso_status_discord_bot:0.0.1
docker push harbor.kevin-c.fr/library/eso_status_discord_bot:0.0.1
```

## Namespace bot-eso-status
```bash
kubectl create namespace bot-eso-status --dry-run=client -o json | kubectl apply -f -
kubectl -n bot-eso-status create secret docker-registry harbor-regcred \
  --docker-server=harbor.kevin-c.fr \
  --docker-username='admin' \
  --docker-password="$HARBOR_ADMIN_PASSWORD" \
  --docker-email='kevincarlier118@gmail.com'
```
Création du Deployment, donc de la gestion du cycle de vie des pods, nombre de pods et relance en cas de crach et déclaration de l’image docker avec nom, version et ports
```bash
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eso-status
  namespace: bot-eso-status
spec:
  replicas: 1
  selector:
    matchLabels:
      app: eso-status
  template:
    metadata:
      labels:
        app: eso-status
    spec:
      imagePullSecrets:
      - name: harbor-regcred
      containers:
      - name: app
        image: harbor.kevin-c.fr/library/eso_status_discord_bot:0.0.2
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "512m"
          limits:
            memory: "512Mi"
            cpu: "512m"
        env:
        - name: DB_TYPE
          value: "mysql"
        - name: DB_DEBUG
          value: "false"
        - name: DB_PORT
          value: "3306"
        - name: DB_USER
          value: "root"
        - name: DB_NAME
          value: "eso_status_discord_bot"
        - name: DB_HOST
          value: "db.kevin-c.fr"
        - name: DISCORD_TOKEN
          value: ""
        - name: DB_PASSWORD
          value: ""
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_UID
          valueFrom:
            fieldRef:
              fieldPath: metadata.uid
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
EOF
```
Déclaration du Service, donc l’endroit ou le trafic redirige le trafic d’un port vers l’ensembles des pods
```bash
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: eso-status-svc
  namespace: bot-eso-status
spec:
  clusterIP: None
  selector:
    app: eso-status
EOF
```
```bash
kubectl get pods -n bot-eso-status -w
```
