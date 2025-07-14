FROM kindest/node:v1.27.3

# Install additional tools
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/v1.27.3/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Create manifests directory
RUN mkdir -p /manifests

WORKDIR /manifests

# Entry point
ENTRYPOINT ["/usr/local/bin/entrypoint"]