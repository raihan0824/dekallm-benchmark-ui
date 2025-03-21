# DekaLLM Benchmark UI - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the DekaLLM Benchmark UI application.

## Prerequisites

- Kubernetes cluster
- kubectl command-line tool
- Docker registry access
- (Optional) Cert-manager for TLS certificates
- (Optional) Nginx ingress controller

## Deployment Steps

### 1. Update Configuration

Before deploying, make sure to update the following files with your specific configuration:

- **ingress.yaml**: Replace the domain name `benchmark.dekallm.io` with your actual domain
- **secret.yaml**: Replace the base64-encoded dummy values with your actual secrets
- **deployment.yaml**: Update the `${DOCKER_REGISTRY}` placeholder with your actual Docker registry

### 2. Creating the Namespace

```bash
kubectl create namespace dekallm-benchmark
```

### 3. Apply the Manifests

You can apply all the manifests at once using kustomize:

```bash
kubectl apply -k kubernetes/
```

Or apply individual files:

```bash
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml
```

### 4. Verify Deployment

```bash
# Check deployment status
kubectl get deployments -n dekallm-benchmark

# Check pod status
kubectl get pods -n dekallm-benchmark

# Check service
kubectl get svc -n dekallm-benchmark

# Check ingress
kubectl get ingress -n dekallm-benchmark
```

### 5. Access the Application

Once deployed, the application should be accessible at your configured domain (e.g., https://benchmark.dekallm.io).

## Scaling

To scale the application:

```bash
kubectl scale deployment dekallm-benchmark-ui -n dekallm-benchmark --replicas=3
```

## Troubleshooting

To view logs from a pod:

```bash
# Get pod names
kubectl get pods -n dekallm-benchmark

# View logs from a specific pod
kubectl logs <pod-name> -n dekallm-benchmark
```

To describe a pod for more detailed information:

```bash
kubectl describe pod <pod-name> -n dekallm-benchmark
```