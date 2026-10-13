import { createImportPreview, normalizeImportedNames } from "./participants";

test("parses names separated by lines, commas and semicolons", () => {
  expect(normalizeImportedNames(" Ana\nBia, Caio;  Duda  ")).toEqual(["Ana", "Bia", "Caio", "Duda"]);
});

test("previews valid and rejected imported names", () => {
  const preview = createImportPreview(["Ana", "Bia", "bia", "x".repeat(101)], ["Ana"]);
  expect(preview.valid).toEqual(["Bia"]);
  expect(preview.rejected.map(({ code }) => code)).toEqual(["ALREADY_REGISTERED", "DUPLICATE_IN_IMPORT", "NAME_TOO_LONG"]);
});
