FROM rust:1.53
RUN rustup target add wasm32-unknown-unknown
COPY dist/cargo-concordium/cargo-concordium /usr/local/bin/cargo-concordium
COPY dist/concordium-client/concordium-client /usr/local/bin/concordium-client
COPY ./concordium-backup.concordiumwallet /concordium-backup.concordiumwallet
ENTRYPOINT [ "sleep", "infinity" ]