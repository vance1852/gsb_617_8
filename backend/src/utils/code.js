const { customAlphabet } = require("nanoid");

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const generate = customAlphabet(ALPHABET, 7);

function genCode(length = 7) {
  return customAlphabet(ALPHABET, length)();
}

module.exports = { genCode, generate };
