FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    curl \
    ca-certificates \
    openssl \
    gnupg \
    lsb-release \
    tzdata \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Set system timezone (app still uses IANA timezones per user)
ENV TZ=America/Detroit
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Optional: Install Azure CLI for testing
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash || true

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

USER node

WORKDIR /workspace
