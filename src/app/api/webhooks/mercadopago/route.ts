import { NextResponse, type NextRequest } from "next/server";
import {
  processMercadoPagoPayment,
  verifyMercadoPagoSignature,
} from "@/lib/payments/mercadopago";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    data?: { id?: string };
  } | null;
  // Mercado Pago signs the id from the query string (data.id), falling back to the body.
  const dataId =
    request.nextUrl.searchParams.get("data.id") ?? String(body?.data?.id ?? "");
  const type = request.nextUrl.searchParams.get("type") ?? body?.type;

  if (
    !dataId ||
    !verifyMercadoPagoSignature({
      signature: request.headers.get("x-signature"),
      requestId: request.headers.get("x-request-id"),
      dataId,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (type !== "payment") return NextResponse.json({ received: true });

  try {
    const result = await processMercadoPagoPayment(dataId);
    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error("mercadopago webhook failed", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
