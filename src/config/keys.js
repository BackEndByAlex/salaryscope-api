import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const keysDir = join(__dirname, "../../keys")

function loadKey(filename) {
  try {
    return readFileSync(join(keysDir, filename), "utf8")
  } catch {
    console.error(
      `FATAL: Could not load ${filename}. Run: npm run generate:keys`,
    )
    process.exit(1)
  }
}

export const privateKey = loadKey("private.pem")
export const publicKey = loadKey("public.pem")
