Place the circuit artifact files required by the Privacy Cash SDK here.

Files required (provide real artifacts from your build pipeline or the SDK provider):

- `/circuit2.wasm`  — the proving circuit WebAssembly
- `/circuit2.zkey`  — the proving circuit zk-SNARK proving key

How to install:

1. Obtain `circuit2.wasm` and `circuit2.zkey` from your circuit build output or the Privacy Cash SDK provider.
2. Place them in `frontend/public/` (so they are served at `https://<host>/circuit2.wasm`).

Local dev verification:

curl -I http://localhost:5173/circuit2.wasm

Security note: do NOT commit production secrets or private proving keys into source control. If your `.zkey` is secret, host it on a secure server and set `keyBasePath` to a protected URL.
