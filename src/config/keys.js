import { readFileSync } from "fs"
import { join } from "path"

const PRIVATE_KEY_PATH =
  process.env.PRIVATE_KEY_PATH ?? join(import.meta.dirname, "../../keys/private.pem")

function loadPrivateKey() {
  const remediationHint = process.env.PRIVATE_KEY_PATH
    ? "Docker secret — ensure private_key is declared in docker-compose.yml"
    : "keys/private.pem — run: npm run generate:keys"

  return readKeyFromPath(PRIVATE_KEY_PATH, remediationHint)
}

function loadPublicKey() {
  // In production it arrives via a read-only bind-mount; in development
  // it is generated locally. No secret-level protection is needed for a public key.
  return readKeyFromPath(
    join(import.meta.dirname, "../../keys/public.pem"),
    "keys/public.pem — run: npm run generate:keys",
  )
}

function readKeyFromPath(absolutePath, remediationHint) {
  try {
    return readFileSync(absolutePath, "utf8")
  } catch {
    console.error(`FATAL: Could not load key from ${absolutePath}.`)
    console.error(`Expected location: ${remediationHint}`)
    process.exit(1)
  }
}

export const privateKey = loadPrivateKey()
export const publicKey = loadPublicKey()
