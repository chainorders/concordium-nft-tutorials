FROM rust:1.53
RUN rustup target add wasm32-unknown-unknown
COPY dist/cargo-concordium/cargo-concordium /usr/local/bin/cargo-concordium
COPY dist/concordium-client/concordium-client /usr/local/bin/concordium-client
COPY ./concordium-backup.concordiumwallet /concordium-backup.concordiumwallet
ENTRYPOINT [ "sleep", "infinity" ]

## Install IPFS CLI
WORKDIR /tmp
RUN wget https://dist.ipfs.io/kubo/v0.14.0/kubo_v0.14.0_linux-amd64.tar.gz
RUN tar -xvzf kubo_v0.14.0_linux-amd64.tar.gz
WORKDIR /tmp/kubo
RUN bash install.sh

## Install Node & Pinata CLI
WORKDIR /tmp
ENV NODE_VERSION=16.13.0
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN npm i -g npm i -g pinata-upload-cli

WORKDIR /src