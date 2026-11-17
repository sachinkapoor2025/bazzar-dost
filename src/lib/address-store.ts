import "server-only";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma, databaseConfigured } from "@/lib/db";
import { readJsonArray, writeJsonArray } from "@/lib/local-json";

const FILE = path.join(process.cwd(), "data", "addresses.json");

export type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type StoredAddress = SavedAddress & { userId: string };

function publicAddress(row: StoredAddress): SavedAddress {
  return {
    id: row.id,
    label: row.label,
    fullName: row.fullName,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2 || "",
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    isDefault: Boolean(row.isDefault),
  };
}

export async function listAddresses(userId: string): Promise<SavedAddress[]> {
  if (databaseConfigured()) {
    const rows = await prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      fullName: row.fullName,
      phone: row.phone,
      line1: row.line1,
      line2: row.line2,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      isDefault: row.isDefault,
    }));
  }
  return readJsonArray<StoredAddress>(FILE)
    .filter((row) => row.userId === userId)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map(publicAddress);
}

export async function createAddress(userId: string, input: Omit<SavedAddress, "id">): Promise<SavedAddress[] | null> {
  if (databaseConfigured()) {
    if (input.isDefault) await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await prisma.address.create({ data: { ...input, userId } });
    return listAddresses(userId);
  }
  const rows = readJsonArray<StoredAddress>(FILE);
  const next = input.isDefault ? rows.map((row) => (row.userId === userId ? { ...row, isDefault: false } : row)) : rows;
  next.push({ ...input, line2: input.line2 || "", id: randomUUID(), userId });
  return writeJsonArray(FILE, next) ? listAddresses(userId) : null;
}

export async function deleteAddress(userId: string, id: string): Promise<{ found: true; addresses: SavedAddress[] } | { found: false }> {
  if (databaseConfigured()) {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) return { found: false };
    await prisma.address.delete({ where: { id } });
    return { found: true, addresses: await listAddresses(userId) };
  }
  const rows = readJsonArray<StoredAddress>(FILE);
  if (!rows.some((row) => row.id === id && row.userId === userId)) return { found: false };
  const next = rows.filter((row) => !(row.id === id && row.userId === userId));
  if (!writeJsonArray(FILE, next)) return { found: true, addresses: await listAddresses(userId) };
  return { found: true, addresses: await listAddresses(userId) };
}
