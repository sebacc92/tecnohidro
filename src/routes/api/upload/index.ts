import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { RequestHandler } from '@builder.io/qwik-city';

export const onPost: RequestHandler = async ({ request, env, json }) => {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // En un entorno real, aquí validarías que el usuario sea administrador
        // para prevenir subidas públicas sin autorización.
        return {
          allowedContentTypes: [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'video/mp4',
            'video/quicktime',
            'video/webm'
          ],
          tokenPayload: JSON.stringify({
            // optional metadata
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Aquí podrías guardar la URL en una tabla de registros o auditoría
        console.log('Upload completado', blob.url);
      },
      token: env.get('BLOB_READ_WRITE_TOKEN'),
    });

    json(200, jsonResponse);
  } catch (error: any) {
    console.error('Error handling upload:', error);
    json(400, { error: error.message });
  }
};
