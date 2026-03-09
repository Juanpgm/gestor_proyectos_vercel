#!/usr/bin/env node

/**
 * Start Next.js dev in a stable way:
 * 1) kill listeners on ports 3000/3001
 * 2) clear cache safely
 * 3) start next dev on port 3000
 */

const { execSync, spawnSync } = require("child_process");
const path = require("path");

const PORTS = [3000, 3001];

function getListeningPidsWin(ports) {
  const output = execSync("netstat -ano -p tcp", { encoding: "utf8" });
  const lines = output.split(/\r?\n/);
  const pids = new Set();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("TCP")) continue;
    if (!trimmed.includes("LISTENING")) continue;

    const cols = trimmed.split(/\s+/);
    if (cols.length < 5) continue;

    const localAddress = cols[1];
    const pid = cols[4];
    const port = Number(localAddress.split(":").pop());

    if (ports.includes(port) && Number.isFinite(Number(pid))) {
      pids.add(pid);
    }
  }

  return Array.from(pids);
}

function killPidWin(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F /T`, { stdio: "pipe" });
    console.log(`🛑 Proceso detenido: PID ${pid}`);
  } catch {
    // ignore if already stopped
  }
}

function killPortListeners() {
  if (process.platform !== "win32") {
    console.log("ℹ️ dev-stable usa estrategia de puertos para Windows.");
    return;
  }

  const pids = getListeningPidsWin(PORTS);
  if (pids.length === 0) {
    console.log("✅ No hay procesos ocupando puertos 3000/3001");
    return;
  }

  for (const pid of pids) {
    killPidWin(pid);
  }
}

function clearCache() {
  const clearScript = path.join(__dirname, "clear-cache.js");
  const result = spawnSync(process.execPath, [clearScript], {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  if (result.status !== 0) {
    console.warn(
      "⚠️ Limpieza de caché terminó con advertencias. Se continúa con arranque dev.",
    );
  }
}

function startDev() {
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(npxCmd, ["next", "dev", "-p", "3000"], {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_ENV: "development",
    },
  });

  process.exit(result.status || 0);
}

console.log("🚀 Iniciando dev estable...");
killPortListeners();
clearCache();
startDev();
