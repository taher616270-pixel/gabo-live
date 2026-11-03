/**
 * Example only. Do not place API keys or API secrets in browser configuration.
 * The public WebSocket URL is returned by the authenticated token endpoint.
 */
export const liveKitClientConfig = Object.freeze({
  tokenEndpoint: "/api/livekit/token",
  sdkVersion: "2.23.0",
  microphoneStartsEnabled: false,
  expectedPlatforms: ["ios", "android", "web"]
});
