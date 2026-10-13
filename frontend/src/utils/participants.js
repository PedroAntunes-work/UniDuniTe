export function normalizeImportedNames(text) {
  return text
    .split(/[\n,;]+/)
    .map((name) => name.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

export function parseParticipantFile(file) {
  return file.text().then((content) => {
    if (file.name.toLowerCase().endsWith(".csv")) {
      const rows = content.split(/\r?\n/).map((row) => row.split(",")[0]?.trim() || "");
      if (/^nome$/i.test(rows[0])) rows.shift();
      return rows.join("\n");
    }
    return content;
  });
}

export function createImportPreview(rawNames, registeredNames) {
  const registered = new Set(registeredNames.map((name) => name.trim().toLocaleLowerCase("pt-BR")));
  const seen = new Set();
  const valid = [];
  const rejected = [];

  rawNames.forEach((name) => {
    const normalized = name.trim().replace(/\s+/g, " ");
    const key = normalized.toLocaleLowerCase("pt-BR");
    let code;
    if (!normalized) code = "EMPTY_NAME";
    else if (normalized.length > 100) code = "NAME_TOO_LONG";
    else if (registered.has(key)) code = "ALREADY_REGISTERED";
    else if (seen.has(key)) code = "DUPLICATE_IN_IMPORT";
    if (code) rejected.push({ name: normalized, code });
    else {
      seen.add(key);
      valid.push(normalized);
    }
  });

  return { valid, rejected };
}
