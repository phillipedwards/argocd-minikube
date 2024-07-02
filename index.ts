import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const config = new pulumi.Config();

// Get the cluster name from the config, or default to "minikube".
const clusterContext = config.get("clusterContext")  || "minikube";
const clusterFqdn = config.require("clusterFqdn");

// Get the apikey and apikeyseret from config; komodor agent needs these values
const apiKey = config.require("apiKey");

const provider = new k8s.Provider("k8s", {
    context: clusterContext,
    cluster: clusterContext,
});

const ns = new k8s.core.v1.Namespace("argocd", {
    metadata: {
        name: "argocd",
    }
}, {
    provider
});

new k8s.helm.v3.Chart("argocd", {
    namespace: ns.metadata.name,
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
    provider
});

new k8s.helm.v3.Chart("komodor-agent", {
    chart: "komodor-agent",
    version: "2.5.3",
    fetchOpts: {
        repo: "https://helm-charts.komodor.io"
    },
    values: {
        apiKey: apiKey,
        // apiKeySecret: apiKeySecret,
        clusterName: clusterFqdn,
        timeout: "90s"
    }
}, {
    provider
});

export const portCmd = pulumi.interpolate`kubectl port-forward svc/argocd-server -n argocd 8080:80`

/*
helm repo add komodorio https://helm-charts.komodor.io ; 
helm repo update; helm install komodor-agent komodorio/komodor-agent --set apiKey=91401f97-4355-46b3-b6a2-23e69cbb472a --set clusterName=kubernetes.default.cluster.local  
--timeout=90s && start https://app.komodor.com/main/services
*/