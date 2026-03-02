import { UnauthenticatedError } from "../utils/errors.js"

export function assertAuthenticated(user) {
  if (!user) {
    throw new UnauthenticatedError()
  }
}
