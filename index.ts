import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();

// Get the cluster name from the config, or default to "minikube".
const clusterContext = config.get("clusterContext") || "minikube";
const clusterFqdn = config.require("clusterFqdn");

// Get the apikey and apikeyseret from config; komodor agent needs these values
const apiKey = config.require("apiKey");

const provider = new k8s.Provider("k8s", {
    context: clusterContext,
    cluster: clusterContext,
});

const argoNs = new k8s.core.v1.Namespace("argocd", {
    metadata: {
        name: "argocd",
    }
}, {
    provider,
});

const argo = new k8s.helm.v3.Chart("argocd", {
    namespace: argoNs.metadata.name,
    chart: "argo-cd",
    version: "6.10.0",
    fetchOpts: {
        repo: "https://argoproj.github.io/argo-helm"
    },
    values: {
        installCRDs: true,
        createClusterRoles: true,
        createAggregateRoles: true,
        server: {
            service: {
                type: "NodePort"
            }
        }
    }
}, {
    provider,
});

const komodor = new k8s.helm.v3.Release("komodor-agent", {
    chart: "komodor-agent",
    namespace: argoNs.metadata.name,
    repositoryOpts: {
        repo: "https://helm-charts.komodor.io"
    },
    values: {
        apiKey: apiKey,
        clusterName: clusterFqdn,
    }
}, {
    provider,
});

// Retrieve the ArgoCD initial admin secret
const argocdSecret = k8s.core.v1.Secret.get("argocd-initial-admin-secret", pulumi.interpolate`${argoNs.metadata.name}/argocd-initial-admin-secret`, { provider: provider, dependsOn: argo.ready });

export const argocdPassword = argocdSecret.data.apply(data => Buffer.from(data["password"], "base64").toString("utf-8"));
export const portCmd = pulumi.interpolate`kubectl port-forward svc/argocd-server -n argocd 8080:80`