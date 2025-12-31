# Node TCP replay client

This repository only contained a stripped ARM64 shared object (`libgojni.so`)
and a short packet capture. The capture shows a TCP session from the client to
`54.233.229.27:4000` with four client-originated payloads. A tiny Node script
is included to replay those frames so you can interact with the same server
endpoint without the original native library.

## Usage

```bash
# From the repo root
node client.js
```

Environment variables:

| Variable         | Default         | Purpose                                               |
| ---------------- | --------------- | ----------------------------------------------------- |
| `SERVER_HOST`    | `54.233.229.27` | Target host discovered in the capture                 |
| `SERVER_PORT`    | `4000`          | Target port from the capture                          |
| `FRAME_DELAY_MS` | `25`            | Delay between sending captured frames                 |
| `SEND_ON_CONNECT`| `0`             | Set to `1` to send frames immediately on connect      |

By default the client waits for the first server packet before sending the
captured frames in the same order observed in the PCAP. All incoming data is
logged as hex so you can iterate on decoding the protocol.

## Notes and limitations

- The traffic captured on port `4000` is binary and likely encrypted or
  obfuscated. Replaying the payloads may not succeed if the server expects
  per-session keys or timestamps.
- Only the four client-to-server payloads from the provided PCAP are included.
  If additional messages are required after login/handshake, you will need to
  extend `CLIENT_FRAMES_HEX` with new captures.
- The `.so` is heavily stripped, so no higher-level protocol details could be
  recovered beyond the destination endpoint and the raw frames above.
