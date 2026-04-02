import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

export const runtime = "nodejs";

const mode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "test";

const stripeSecretKey =
  mode === "live"
    ? process.env.STRIPE_SECRET_KEY_LIVE ?? ""
    : process.env.STRIPE_SECRET_KEY_TEST ?? "";

const webhookSecret =
  mode === "live"
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? ""
    : process.env.STRIPE_WEBHOOK_SECRET_TEST ?? "";
const resendKey = process.env.RESEND_API_KEY ?? "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!resendKey) throw new Error("Missing RESEND_API_KEY");
if (!appUrl) throw new Error("Missing NEXT_PUBLIC_APP_URL");

const stripe = new Stripe(stripeSecretKey);
const resend = new Resend(resendKey);

async function uploadBufferToStorage(args: {
  buffer: Buffer;
  contentType: string;
  path: string;
}) {
  const bucket = adminStorage.bucket();
  const file = bucket.file(args.path);

  await file.save(args.buffer, {
    metadata: {
      contentType: args.contentType,
      cacheControl: "public, max-age=31536000",
    },
    resumable: false,
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${args.path}`;
}

async function renderMp4FromUrls(args: {
  imageUrl: string;
  audioUrl: string;
  clipStart: number;
  clipDuration: number;
}) {
  const imageRes = await fetch(args.imageUrl);
  if (!imageRes.ok) {
    throw new Error("Could not download cover image for video render.");
  }

  const imageBlob = await imageRes.blob();

  const formData = new FormData();
  formData.append("cover", imageBlob, "cover.jpg");
  formData.append("audioUrl", args.audioUrl);
  formData.append("clipStart", String(args.clipStart));
  formData.append("clipDuration", String(args.clipDuration));

  const renderRes = await fetch(`${appUrl}/api/render-video`, {
    method: "POST",
    body: formData,
  });

  if (!renderRes.ok) {
    const errText = await renderRes.text();
    throw new Error(`Video render failed: ${errText}`);
  }

  const arrayBuffer = await renderRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log("WEBHOOK EVENT TYPE:", event.type);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err?.message || "Unknown error"}`, {
      status: 400,
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
     const session = event.data.object as Stripe.Checkout.Session;
console.log("SESSION MODE:", session.mode);
console.log("SESSION METADATA:", session.metadata);
console.log("SESSION EMAIL:", session.customer_details?.email);

      if (session.mode === "payment") {
        const uid =
          typeof session.metadata?.uid === "string" ? session.metadata.uid : null;

        const guestId =
          typeof session.metadata?.guestId === "string"
            ? session.metadata.guestId
            : null;

        const exportId =
          typeof session.metadata?.exportId === "string"
            ? session.metadata.exportId
            : null;

        const emailFromMeta =
          typeof session.metadata?.email === "string"
            ? session.metadata.email
            : null;

        const email =
          session.customer_details?.email ||
          session.customer_email ||
          emailFromMeta ||
          null;

        if (uid) {
          await adminDb.collection("users").doc(uid).set(
            {
              exportCredits: FieldValue.increment(1),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }

        if (guestId) {
          await adminDb.collection("guestExports").doc(guestId).set(
            {
              paid: true,
              exportCredits: FieldValue.increment(1),
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        }

       if (exportId && email) {
  console.log("resolved exportId:", exportId);
  console.log("resolved email:", email);
  console.log("Looking for pending export doc:", exportId);

  const exportRef = adminDb.collection("pendingExports").doc(exportId);
  const exportSnap = await exportRef.get();

  console.log("pending export exists:", exportSnap.exists);
  console.log("pending export data:", exportSnap.data());

  if (exportSnap.exists) {
            const data = exportSnap.data() || {};

            const imageUrl =
              typeof data.imageUrl === "string" ? data.imageUrl : null;

            const audioUrl =
              typeof data.audioUrl === "string" ? data.audioUrl : null;

            const exportKind =
              typeof data.exportKind === "string" ? data.exportKind : "image";

            const clipStart =
              typeof data.clipStart === "number" ? data.clipStart : 0;

            const clipDuration =
              typeof data.clipDuration === "number" ? data.clipDuration : 30;

            const projectName =
              typeof data.projectName === "string"
                ? data.projectName
                : "Your Design";

            let finalVideoUrl: string | null = null;

            if (exportKind === "music" && imageUrl && audioUrl) {
              const mp4Buffer = await renderMp4FromUrls({
                imageUrl,
                audioUrl,
                clipStart,
                clipDuration,
              });

              finalVideoUrl = await uploadBufferToStorage({
                buffer: mp4Buffer,
                contentType: "video/mp4",
                path: `final-video-exports/${exportId}.mp4`,
              });
            }

            if (imageUrl) {
              const html =
                exportKind === "music" && finalVideoUrl
                  ? `
                    <div style="font-family: Arial, sans-serif; color: #111;">
                      <h2>Your export is ready</h2>
                      <p>Thanks for your purchase.</p>

                      <p>
                        <a href="${imageUrl}" target="_blank" rel="noopener noreferrer"
                           style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;margin-right:10px;">
                          Open Final Image
                        </a>
                      </p>

                      <p>
                        <a href="${finalVideoUrl}" target="_blank" rel="noopener noreferrer"
                           style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;">
                          Open Final MP4
                        </a>
                      </p>

                      <p style="margin-top:16px;">Image preview:</p>
                      <img src="${imageUrl}" alt="Your design"
                           style="max-width:100%;border-radius:12px;border:1px solid #ddd;" />
                    </div>
                  `
                  : `
                    <div style="font-family: Arial, sans-serif; color: #111;">
                      <h2>Your design is ready</h2>
                      <p>Thanks for your purchase.</p>
                      <p>
                        <a href="${imageUrl}" target="_blank" rel="noopener noreferrer"
                           style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#fff;text-decoration:none;">
                          Open Final Image
                        </a>
                      </p>

                      <p style="margin-top:16px;">Preview:</p>
                      <img src="${imageUrl}" alt="Your design"
                           style="max-width:100%;border-radius:12px;border:1px solid #ddd;" />
                    </div>
                  `;

              await resend.emails.send({
                from: "GFXLab <hello@iamhaydaygfxlab.com>",
                to: email,
                subject:
                  exportKind === "music"
                    ? `${projectName} export is ready`
                    : `${projectName} is ready`,
                html,
              });

              await exportRef.set(
                {
                  paid: true,
                  emailed: true,
                  emailedAt: Date.now(),
                  stripeSessionId: session.id,
                  customerEmail: email,
                  finalVideoUrl: finalVideoUrl ?? null,
                  updatedAt: Date.now(),
                },
                { merge: true }
              );
            }
          }
        }
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const customer = await stripe.customers.retrieve(customerId);
      const uid =
        customer && !("deleted" in customer) ? customer.metadata?.uid : null;

      if (!uid) {
        return NextResponse.json({ received: true });
      }

      const isDeleted = event.type === "customer.subscription.deleted";
      const isActive = sub.status === "active" || sub.status === "trialing";

      await adminDb.collection("users").doc(uid).set(
        {
          pro: isDeleted ? false : isActive,
          proStatus: isDeleted ? "canceled" : sub.status,
          stripeCustomerId: customerId,
          proCurrentPeriodEnd: (sub as any).current_period_end ?? null,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err?.message || err);
    return new NextResponse(
      `Webhook handler failed: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}