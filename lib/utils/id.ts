import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
const lobbyCodeNanoid = customAlphabet(ALPHABET, 6);

export const generateLobbyCode = (): string => lobbyCodeNanoid();

const idNanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
export const generateId = (): string => idNanoid();
