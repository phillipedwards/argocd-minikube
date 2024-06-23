#/bin/bash

argocd login localhost:8080 --port-forward-namespace argocd --username admin \
 --password $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d) \
 --insecure

argocd cluster add minikube --server localhost:8080 --yes \
  --port-forward-namespace argocd --upsert --in-cluster --label environment=dev

kubectl config set-context --current --namespace=argocd

 argocd app create guestbook --repo https://github.com/phillipedwards/guestbook-ui.git \
  --dest-server https://kubernetes.default.svc --dest-namespace default \
  --server localhost:8080 --path guestbook