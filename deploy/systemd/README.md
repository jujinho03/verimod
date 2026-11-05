# Production Auto Anchor units

These files preserve the production configuration that recovered automatic Base Sepolia registration on 2026-11-04. Git deployment alone does not install secrets or systemd units.

## Install

1. Create `/etc/verimod/backend-auto.env` and `/etc/verimod/worker.env` from the examples. Use the same random token in both files. Put the dedicated testnet private key only in `worker.env`.
2. Protect both files:

   ```sh
   sudo chown root:root /etc/verimod/backend-auto.env /etc/verimod/worker.env
   sudo chmod 600 /etc/verimod/backend-auto.env /etc/verimod/worker.env
   ```

3. Install the backend drop-in and Worker unit:

   ```sh
   sudo install -D -m 0644 deploy/systemd/verimod-backend-auto-anchor.conf /etc/systemd/system/verimod-backend.service.d/auto-anchor.conf
   sudo install -m 0644 deploy/systemd/verimod-signer-worker.service /etc/systemd/system/verimod-signer-worker.service
   sudo systemctl daemon-reload
   sudo systemctl restart verimod-backend
   sudo systemctl enable --now verimod-signer-worker
   ```

## Validate

```sh
systemctl is-active verimod-backend verimod-signer-worker
systemctl is-enabled verimod-backend verimod-signer-worker
journalctl -u verimod-signer-worker --since '10 minutes ago' --no-pager -p warning..alert
```

Issue a new receipt and poll `GET /api/receipts/:id`. A healthy path changes from `PENDING_ANCHOR` to an epoch-backed `SUBMITTED`, then `CONFIRMED` after at least 12 Base Sepolia confirmations. Do not print either EnvironmentFile or commit it with real values.
