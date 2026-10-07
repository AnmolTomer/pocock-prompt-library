declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    LIBRARY_EDITOR_EMAIL?: string;
  }
}
