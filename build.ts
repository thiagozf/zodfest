import dts from "bun-plugin-dts";

await Bun.build({
  entrypoints: ["src/index.ts"],
  packages: "external",
  target: "node",
  format: "esm",
  outdir: "./dist",
  sourcemap: "external",
  minify: true,
  plugins: [dts()],
});
