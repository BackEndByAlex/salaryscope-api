import { readFileSync } from "fs"
import { join } from "path"

const PRIVATE_KEY_PATH =
  process.env.PRIVATE_KEY_PATH ?? join(import.meta.dirname, "../../keys/private.pem")

function loadPrivateKey() {
  const remediationHint = process.env.PRIVATE_KEY_PATH

  return readKeyFromPath(PRIVATE_KEY_PATH, remediationHint)
}

function loadPublicKey() {
  return readKeyFromPath(
    join(import.meta.dirname, "../../keys/public.pem"),
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
