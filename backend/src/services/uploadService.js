import { getSupabaseClient } from '../db/supabaseClient.js';
import { promises as fs } from 'fs';
import path from 'path';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * Stores a file and returns a stable fileUrl.
 * Uses Supabase Storage when STORAGE_BACKEND=supabase (production),
 * falls back to local disk for dev.
 */
export async function storeFile(file) {
  const backend = process.env.STORAGE_BACKEND || 'local';
  if (backend === 'supabase') return storeToSupabase(file);
  return storeToLocal(file);
}

async function storeToSupabase(file) {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campusprint-uploads';
  const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const { error } = await getSupabaseClient()
    .storage
    .from(bucket)
    .upload(safeName, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) throw new Error(`Supabase storage upload failed: ${error.message}`);

  const { data } = getSupabaseClient().storage.from(bucket).getPublicUrl(safeName);
  return data.publicUrl;
}

async function storeToLocal(file) {
  const uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
  await fs.mkdir(uploadDir, { recursive: true });
  const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeName);
  await fs.writeFile(filePath, file.buffer);
  return `/uploads/${safeName}`;
}
