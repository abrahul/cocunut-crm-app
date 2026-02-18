import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? "https://your-domain.example/staff/login";

const config: CapacitorConfig = {
  appId: "com.coconutcrm.staff",
  appName: "Coconut Staff",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
};

export default config;
