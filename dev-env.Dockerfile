FROM rust:1.53
RUN rustup target add wasm32-unknown-unknown
COPY dist/cargo-concordium/cargo-concordium /usr/local/bin/cargo-concordium
COPY dist/concordium-client/concordium-client /usr/local/bin/concordium-client
COPY ./concordium-backup.concordiumwallet /concordium-backup.concordiumwallet
ENTRYPOINT [ "sleep", "infinity" ]

WORKDIR /tmp
RUN wget https://dist.ipfs.io/kubo/v0.14.0/kubo_v0.14.0_linux-amd64.tar.gz
RUN tar -xvzf kubo_v0.14.0_linux-amd64.tar.gz
WORKDIR /tmp/kubo
RUN bash install.sh

WORKDIR /src