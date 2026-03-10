import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gfxlab.app",
  appName: "GFXLab",
  webDir: "out",
  server: {
    url: "https://gfxlab.vercel.app",
    cleartext: false,
  },
};

export default config;