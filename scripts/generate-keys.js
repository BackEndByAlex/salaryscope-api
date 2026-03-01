import { generateKeyPairSync } from "crypto"
import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const keysDir = join(__dirname, "../keys")

mkdirSync(keysDir, { recursive: true })

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
})

writeFileSync(join(keysDir, "private.pem"), privateKey)
writeFileSync(join(keysDir, "public.pem"), publicKey)

console.log("RSA key pair generated in keys/")
console.log("  keys/private.pem — sign tokens (keep secret, never commit)")
console.log("  keys/public.pem  — verify tokens (safe to share)")
