import { customAlphabet } from "nanoid";

const ALPHABET = "0123456789";
const lobbyCodeNanoid = customAlphabet(ALPHABET, 4);

export const generateLobbyCode = (): string => lobbyCodeNanoid();

const idNanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
export const generateId = (): string => idNanoid();
