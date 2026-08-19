// src/utils/password.ts

import argon2 from "argon2";

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

export async function comparePassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  if (!passwordHash || !passwordHash.startsWith("$argon2")) {
    return false;
  }

  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}
