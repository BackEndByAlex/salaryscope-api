import { readFileSync } from "fs"
import { join } from "path"

function loadPrivateKey() {
  if (process.env.RSA_PRIVATE_KEY_B64) {
    return Buffer.from(process.env.RSA_PRIVATE_KEY_B64, "base64").toString(
      "utf8",
    )
  }

  const keyPath =
    process.env.PRIVATE_KEY_PATH ??
    join(import.meta.dirname, "../../keys/private.pem")

  return readKeyFromPath(keyPath)
}

function loadPublicKey() {
  if (process.env.RSA_PUBLIC_KEY_B64) {
    return Buffer.from(process.env.RSA_PUBLIC_KEY_B64, "base64").toString(
      "utf8",
    )
  }

  return readKeyFromPath(join(import.meta.dirname, "../../keys/public.pem"))
}

function readKeyFromPath(absolutePath) {
  try {
    return readFileSync(absolutePath, "utf8")
  } catch {
    console.error(`FATAL: Could not load key from ${absolutePath}.`)
    process.exit(1)
  }
}

export const privateKey = loadPrivateKey()
export const publicKey = loadPublicKey()
