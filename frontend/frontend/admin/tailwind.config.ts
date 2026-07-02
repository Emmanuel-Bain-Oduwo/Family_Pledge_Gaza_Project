import type { Config } from "tailwindcss";
import adminConfig from "../../admin/tailwind.config";

const config: Config = {
  ...adminConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../admin/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../admin/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../admin/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
