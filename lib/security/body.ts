import { NextResponse } from 'next/server';

export type JsonBodyResult<T> =
  | { ok: true; body: T }
  | { ok: false; response: NextResponse };

function payloadTooLarge(maxBytes: number): NextResponse {
  return NextResponse.json({ error: 'Payload too large', maxBytes }, { status: 413 });
}

export async function readJsonBody<T = unknown>(
  request: Request,
  maxBytes: number,
): Promise<JsonBodyResult<T>> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: payloadTooLarge(maxBytes) };
  }

  const text = await request.text();
  const byteLength = new TextEncoder().encode(text).byteLength;
  if (byteLength > maxBytes) {
    return { ok: false, response: payloadTooLarge(maxBytes) };
  }

  try {
    return { ok: true, body: JSON.parse(text) as T };
  } catch {
    return { ok: true, body: null as T };
  }
}
