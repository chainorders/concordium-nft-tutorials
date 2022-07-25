FROM rust:1.53
ARG CARGO_BUILD_ARGS=""
COPY ./concordium-wasm-smart-contracts /src
COPY ./cargo-concordium-build-entrypoint.sh /entrypoint.sh

## build
WORKDIR /src/cargo-concordium
RUN cargo build ${CARGO_BUILD_ARGS}

##exec
WORKDIR /
RUN chmod +x /entrypoint.sh
ENTRYPOINT [ "sh", "entrypoint.sh" ]