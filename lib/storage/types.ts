/**
 * The contract every storage driver implements.
 *
 * Keys are opaque strings built by `buildStorageKey`. A driver may map a key to
 * a path on disk, an S3 object key, or a Vercel Blob pathname — nothing outside
 * this folder should care which.
 */
export type StorageDriver = {
  name: string;

  /** Store `data` under `key`, overwriting anything already there. */
  put(key: string, data: Buffer, contentType: string): Promise<void>;

  /** Read `key`, or `null` if it is not there. Missing files are not errors. */
  get(key: string): Promise<Buffer | null>;

  /** Remove `key`. Deleting something that is already gone is not an error. */
  delete(key: string): Promise<void>;
};
