import { defineConfig } from "vite";

export default defineConfig({
  // GLB ni med privzetimi sredstvi, zato ga je treba navesti - sicer ga
  // uvoz z ?url ne razresi in model se ne nalozi.
  assetsInclude: ["**/*.glb"],
  server: {
    host: true,
    port: 5173,
  },
});
