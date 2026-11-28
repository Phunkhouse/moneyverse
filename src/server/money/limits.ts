// Limits shared by the import action and next.config.ts (which cannot load the money rules).

/** The largest export file the import accepts: about ten years of entries. */
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024
