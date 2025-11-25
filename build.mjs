import esbuild from "esbuild";
import { cpSync, rmSync, existsSync } from "fs";

const isWatch = process.argv.includes("--watch");
const isProd = process.argv.includes("--prod");

if (existsSync("dist")) {
  rmSync("dist", { recursive: true });
}

// copy public to dist (manifest and html)
cpSync("public", "dist", { recursive: true });

const commonOptions = {
  entryPoints: {
    background: "src/background.ts",
    content: "src/content.ts",
    options: "src/options.ts",
    popup: "src/popup.ts"
  },
  outdir: "dist",
  bundle: true,
  // dev with sourcemap prod without sourcemap
  sourcemap: !isProd,
  format: "esm",
  target: ["chrome100"],
}

if (isWatch) {
  const ctx = await esbuild.context(commonOptions);
  await ctx.watch();
  console.log("watching...");
} else {
  await esbuild.build(commonOptions);
  console.log("build done");
}
