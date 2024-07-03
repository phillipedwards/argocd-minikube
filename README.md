# Argocd - Minikube - Komodor

This is a sample repository to show off [Komodor's](https://komodor.io) integration w/ Kubenertes & Argo CD. This single repo contains a Pulumi program capable of deploying:

- [Komodor Agent](https://github.com/komodorio/helm-charts/tree/master/charts/komodor-agent)
- [Argo CD](https://github.com/argoproj/argo-helm/tree/main/charts/argo-cd)
- Sample Guestbook application

It also contains the necessary tooling to onboard the `guestbook` application to Argo CD.

## Using this example

1. Create a kubernetes cluster. Note, this repo uses minikube however any cluster (local, private cloud, or public cloud) works.

2. Create a [Komodor](https://app.komodor.com) account and retrieve an API key to connect your cluster to Komodor.

3. Clone this repository

```bash
git clone https://github.com/phillipedwards/argocd-minikube.git
cd argo-minikube
```

4. Setup your Pulumi project

```bash
# note you can use any Pulumi backend (cloud, oss, local, etc)
pulumi login --local 
pulumi stack init {your_stack_name}
pulumi config set apiKey {komodor_api_key from above}
pulumi config set clusterFqdn {kubernetes.default.cluster.local} # any FQDN is valid
```

5. Deploy the Komodor Agent and Argo CD

```bash
pulumi up --yes
```

6. OPTIONAL: if we are using minikube, we need to setup [port-forwarding](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/#forward-a-local-port-to-a-port-on-the-pod) to access Argo CD

```bash
# the pulumi stack will output a port-forward command
# from a separate terminal (we will need an additional session)
$(pulumi stack output portCmd)
```

7. Configure the `guestbook` sample application by onboarding it to Argo CD. Note, for simplicity all resources are deployed into the `argocd` namespace. This is NOT advised for "read-world" applicaitons.

```bash
./setup.sh
```

8. Retrieve the Argo CD admin password and login to Argo CD

```bash
pulumi stack output argocdPassword --show-secrets
```

In a browser of your choice open, localhost:8080 and login with `admin` and the password from the above step. You should see the `guestbook` application present in Argo CD.

9. Lastly, switch to [Komodor](https://app.komodor.com) to view and dig into all resources present in your kubernetes cluster.
