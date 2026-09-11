import { createFileRoute } from '@tanstack/react-router';
import { requireAdmin } from '@/lib/core/admin-auth.server';
import { DEFAULT_WINDOW_SIZE, WINDOW_SIZES, type WindowSize } from '@/lib/pipeline/types';

export const Route = createFileRoute('/api/uploads')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireAdmin(request);
        if (access instanceof Response) return access;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data, error } = await supabaseAdmin
          .from('uploads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);
        if (error)
          return Response.json({ success: false, message: error.message }, { status: 500 });
        return Response.json({ success: true, data });
      },

      POST: async ({ request }) => {
        const access = await requireAdmin(request);
        if (access instanceof Response) return access;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { validateUpload } = await import('@/lib/core/validation');
        const { processUpload, logAudit } = await import('@/lib/core/pipeline.server');

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json(
            { success: false, message: 'Expected a multipart file upload.' },
            { status: 400 },
          );
        }

        const file = form.get('file');
        if (!(file instanceof File)) {
          return Response.json(
            { success: false, message: 'No file was provided.' },
            { status: 400 },
          );
        }

        const requestedWindow = Number(form.get('windowSize') ?? DEFAULT_WINDOW_SIZE);
        const windowSize: WindowSize = (WINDOW_SIZES as readonly number[]).includes(requestedWindow)
          ? (requestedWindow as WindowSize)
          : DEFAULT_WINDOW_SIZE;

        const bytes = new Uint8Array(await file.arrayBuffer());
        let format: string;
        try {
          format = validateUpload(file.name, bytes.byteLength, bytes.slice(0, 512)).format;
        } catch (error) {
          return Response.json(
            {
              success: false,
              message: error instanceof Error ? error.message : 'File failed validation.',
            },
            { status: 400 },
          );
        }

        const { data: dataset, error: datasetError } = await supabaseAdmin
          .from('datasets')
          .insert({
            name: file.name,
            description: `Ingested ${format.toUpperCase()} capture`,
            source_format: format,
            window_size_seconds: windowSize,
          })
          .select('id')
          .single();
        if (datasetError)
          return Response.json({ success: false, message: datasetError.message }, { status: 500 });

        const storagePath = `${dataset.id}/${file.name}`;
        const stored = await supabaseAdmin.storage
          .from('network-uploads')
          .upload(storagePath, bytes, { contentType: 'application/octet-stream', upsert: true });
        if (stored.error)
          return Response.json({ success: false, message: stored.error.message }, { status: 500 });

        const { data: upload, error: uploadError } = await supabaseAdmin
          .from('uploads')
          .insert({
            dataset_id: dataset.id,
            filename: file.name,
            file_format: format,
            size_bytes: bytes.byteLength,
            storage_path: storagePath,
            status: 'UPLOADED',
            progress: 5,
          })
          .select('*')
          .single();
        if (uploadError)
          return Response.json({ success: false, message: uploadError.message }, { status: 500 });

        await logAudit('ingestion.started', 'upload', upload.id, {
          filename: file.name,
          format,
          windowSize,
        });

        try {
          const result = await processUpload(upload.id, windowSize);
          return Response.json({
            success: true,
            data: { ...result, uploadId: upload.id, datasetId: dataset.id },
          });
        } catch (error) {
          return Response.json(
            {
              success: false,
              uploadId: upload.id,
              datasetId: dataset.id,
              message: error instanceof Error ? error.message : 'Processing failed.',
            },
            { status: 422 },
          );
        }
      },
    },
  },
});
