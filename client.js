/**
 * Minimal TCP client that replays the captured payloads seen in
 * PCAPdroid_31_dez._04_17_11.pcap against the server used by libgojni.so.
 *
 * The capture shows traffic to 54.233.229.27:4000 with four client
 * transmissions. We replay those frames in order after the first server
 * packet arrives (default behavior) or immediately on connect by setting
 * SEND_ON_CONNECT=1.
 *
 * Environment variables:
 *   SERVER_HOST     Target host (default: 54.233.229.27)
 *   SERVER_PORT     Target port (default: 4000)
 *   FRAME_DELAY_MS  Delay between frames in ms (default: 25)
 *   SEND_ON_CONNECT If "1", start sending frames as soon as the socket opens.
 */
const net = require('net');

const SERVER_HOST = process.env.SERVER_HOST || '54.233.229.27';
const SERVER_PORT = Number(process.env.SERVER_PORT || 4000);
const FRAME_DELAY_MS = Number(process.env.FRAME_DELAY_MS || 25);
const SEND_ON_CONNECT = process.env.SEND_ON_CONNECT === '1';

// Hex-encoded payloads observed from client -> server.
const CLIENT_FRAMES_HEX = [
  // Frame 1: first 259-byte client payload from the capture.
  '810102112ebbbf4da8e5526f6b8fc4066c2e8c8d461596e9fd8efd331e053c190aedc9f91742042415a0786cf6fd351caaeb914e1d38b7c44ed60c58e766c2049486013aa618caee023039ef1c73d0e96a67440258b78467c82b563d7e65956a6a7335093e10016804ec390a7adb10232f0e9324911a064ac250ad18bdbbfe6b7394db6ada6aade935fcb9c08acb61a316d64b0cc86420ae1c90b6de1a1a7548217ff772114bbf2405d21559c1f7a42cf88812aae3f8c103ade3eb5327fca5df6369087351c4fe04f5cd9329317b08b210c2743a42b58066326b0a8aac1cd659b8cd0f66e3edd8fca89a85a451a4dee940e469cd60c82c42a29a86fae580452b512e02',
  // Frame 2: second 259-byte client payload from the capture.
  '8101022a0e27b678720d74cda3efdd5675a320f72deb1e39e2e234163b6b9a19292350ad99bda91f648d83601eb1c0229e87e56c8e7e84afba01f9dd4dcc49e47c3d59789cfe7f41c41aafc91226fa16fae8edd9b1d0866505cf1bf465e6cce81bcf6c8f505278621f3325d87d72325da7dbb3e8a990119525157ca918056d80805ad58fb8640c0688bf72208ec214163859646032693942401ed84c25e6b5ae7c081e05a314786611bc2faa3818ede29d5b20dc3fdcaf8e279885e04f96f1494175409a98eb34c4e860c6b2b86aaaa13662e6eabedeb846daadc82519374aeb5857da6c350f0158935a85e74af8ad51240a112b5171f7ea8940710e531dc0010a3817',
  // Frame 3: 6-byte follow-up payload.
  '0545e1a91361',
  // Frame 4: 5-byte follow-up payload.
  '0442eb5986',
];

const client = net.createConnection({ host: SERVER_HOST, port: SERVER_PORT }, () => {
  console.log(`Connected to ${SERVER_HOST}:${SERVER_PORT}`);
  if (SEND_ON_CONNECT) {
    scheduleNextFrame();
  } else {
    console.log('Waiting for first server packet before sending frames...');
  }
});

client.setKeepAlive(true);

let frameIndex = 0;
let kickedOff = SEND_ON_CONNECT;

client.on('data', (data) => {
  console.log(`Received ${data.length} bytes: ${data.toString('hex')}`);
  if (!kickedOff) {
    kickedOff = true;
    scheduleNextFrame();
  }
});

client.on('close', () => {
  console.log('Connection closed');
});

client.on('error', (err) => {
  console.error('Socket error:', err.message);
});

function scheduleNextFrame() {
  if (frameIndex >= CLIENT_FRAMES_HEX.length) {
    console.log('All captured frames sent.');
    return;
  }
  setTimeout(sendFrame, FRAME_DELAY_MS);
}

function sendFrame() {
  const frameHex = CLIENT_FRAMES_HEX[frameIndex];
  const buf = Buffer.from(frameHex, 'hex');
  client.write(buf);
  console.log(`Sent frame ${frameIndex + 1}/${CLIENT_FRAMES_HEX.length} (${buf.length} bytes)`);
  frameIndex += 1;
  scheduleNextFrame();
}
