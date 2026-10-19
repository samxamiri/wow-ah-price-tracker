# Deploying to AWS

The setup uses a single **EC2** instance running **k3s** (a lightweight, fully compatible Kubernetes), with container images stored in **Amazon ECR**. GitHub Actions deploys there automatically after CI passes.

```
GitHub Actions ──push images──▶ Amazon ECR
      │                              │ pull
      └──kubectl apply──▶ EC2 (k3s) ─┘ ──▶ http://<your-ip>
```

**Cost:** about $15/month for a `t3.small` (enough for mock data), or about $30/month for a `t3.medium` (recommended for real Blizzard data, because the worker parses a large payload). **Stop the instance when you're not using it**, and set an AWS billing alarm.

> Why not EKS? EKS (AWS's managed Kubernetes) costs about $73/month for the control plane alone. The manifests in `k8s/` work on EKS unchanged if you want to use it later. On EKS, nodes pull from ECR through their IAM role, so you wouldn't need the `ecr-pull` secret.

You'll need the [AWS CLI](https://aws.amazon.com/cli/) (`aws configure`) and `kubectl` on your computer.

## 1. Create the ECR repositories

```bash
for svc in api web worker; do
  aws ecr create-repository --repository-name wow-ah-$svc --region us-east-1
done
```

## 2. Launch the EC2 instance

In the EC2 console:
- **AMI:** Ubuntu Server 24.04 LTS · **Type:** `t3.small` or `t3.medium` · **Storage:** 20 GB
- **Security group inbound rules:**
  - SSH (22) from **My IP**
  - HTTP (80) from anywhere
  - TCP 6443 (Kubernetes API) from anywhere. GitHub's runners need it, and k3s requires a client certificate for every request.
- Attach an **Elastic IP** so the address doesn't change when you restart.

## 3. Install k3s

```bash
ssh ubuntu@<ELASTIC_IP>
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--tls-san <ELASTIC_IP>" sh -
sudo cat /etc/rancher/k3s/k3s.yaml
```

Copy that output into a file on your computer, e.g. `~/.kube/wow-ah.yaml`, and change `server: https://127.0.0.1:6443` to `server: https://<ELASTIC_IP>:6443`. Test it:

```bash
export KUBECONFIG=~/.kube/wow-ah.yaml
kubectl get nodes
```

## 4. Create the app secrets

```bash
cp k8s/secret.example.yaml k8s/secret.yaml   # git ignores secret.yaml
# edit k8s/secret.yaml: set a strong letters-and-numbers password, and your Blizzard keys
kubectl apply -f k8s/namespace.yaml -f k8s/secret.yaml
```

To use real Blizzard data, also change `MOCK_DATA` to `"false"` in `k8s/config.yaml` and commit it.

## 5. Let GitHub Actions log in to AWS (OIDC, no stored keys)

1. **IAM → Identity providers → Add provider:** OpenID Connect, URL `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. **IAM → Roles → Create role → Web identity:** pick that provider, audience `sts.amazonaws.com`, then enter your GitHub org/user and repository and branch `main`.
3. Attach the policy **AmazonEC2ContainerRegistryPowerUser**. Name the role `github-deploy-wow-ah` and copy its ARN.

## 6. Configure the GitHub repository

**Settings → Secrets and variables → Actions:**

| Type | Name | Value |
|---|---|---|
| Secret | `AWS_ROLE_ARN` | the role ARN from step 5 |
| Secret | `KUBECONFIG_B64` | output of `base64 -w0 ~/.kube/wow-ah.yaml` |
| Variable | `AWS_REGION` | `us-east-1` (or your region) |
| Variable | `DEPLOY_ENABLED` | `true` |

## 7. Deploy

Push or merge to `main`. When CI passes, the **Deploy** workflow builds the three images, pushes them to ECR and runs `kubectl apply -k k8s`. Then open `http://<ELASTIC_IP>`.

Useful commands:

```bash
kubectl -n wow-ah get pods                               # is everything running?
kubectl -n wow-ah logs deploy/api                        # API logs
kubectl -n wow-ah create job --from=cronjob/worker now   # run the worker right away
kubectl -n wow-ah logs job/now                           # worker logs
```

## Limitations of this setup (good interview talking points)

- **One node.** If the EC2 instance goes down, so does the app. Production would use several nodes (EKS) across availability zones.
- **Postgres in the cluster.** Fine for a demo; production would use Amazon RDS for managed backups and failover. Only `DATABASE_URL` would change.
- **ECR pull secret** expires after 12 hours. It's refreshed on each deploy, and images stay cached on the single node, so this doesn't matter here. EKS avoids it with IAM roles.
- **No HTTPS.** Add a domain plus cert-manager with Let's Encrypt to fix this.
