import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SALT_SIZE = 16;
const KEY_LENGTH = 64;

function splitHash(storedHash: string) {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex) {
    return null;
  }
  return { saltHex, keyHex };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_SIZE).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const split = splitHash(storedHash);
  if (!split) {
    return false;
  }

  const { saltHex, keyHex } = split;
  const derivedKey = (await scrypt(password, saltHex, KEY_LENGTH)) as Buffer;
  const keyBuffer = Buffer.from(keyHex, "hex");

  if (derivedKey.length !== keyBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, keyBuffer);
}

export function isHashedPassword(value: string) {
  return value.includes(":");
}
