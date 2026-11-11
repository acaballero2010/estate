import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";

const VerifyTokenSchema = z.object({
  pageId: z.string().min(1, "Page ID is required"),
  pageAccessToken: z.string().min(1, "Page Access Token is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Verify agent authentication: Require verified Firebase ID Token or active session
    const authHeader = request.headers.get("authorization");
    const authSessionCookie = request.cookies.get("propflow_auth_session");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7).trim();
      try {
        await adminAuth.verifyIdToken(idToken);
      } catch (authErr) {
        console.warn("Invalid ID token in verify-token request:", authErr);
        return NextResponse.json(
          { valid: false, error: "Unauthorized. Invalid or expired authentication token." },
          { status: 401 }
        );
      }
    } else if (!authSessionCookie?.value) {
      return NextResponse.json(
        { valid: false, error: "Unauthorized. An active agent session is required to verify tokens." },
        { status: 401 }
      );
    }
    const body: unknown = await request.json();
    const parsed = VerifyTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { pageId, pageAccessToken } = parsed.data;

    // Support simulated / demo tokens for development and testing
    if (
      pageAccessToken.startsWith("demo_") ||
      pageAccessToken.startsWith("EAAdemo") ||
      pageAccessToken === "test" ||
      process.env.NODE_ENV === "development" && pageAccessToken.includes("demo")
    ) {
      return NextResponse.json({
        valid: true,
        pageId: pageId.trim(),
        pageName: "Premier Properties Manila (Demo Verified)",
        category: "Real Estate Agent",
        simulated: true,
        verifiedAt: new Date().toISOString(),
      });
    }

    // Call Meta Graph API to verify the Page Access Token
    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,category,link&access_token=${encodeURIComponent(
        pageAccessToken.trim()
      )}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    const metaData = await metaResponse.json();

    if (!metaResponse.ok || metaData.error) {
      const errorMessage =
        metaData.error?.message ||
        `Meta Graph API returned status ${metaResponse.status}`;
      return NextResponse.json(
        {
          valid: false,
          error: errorMessage,
          code: metaData.error?.code,
          type: metaData.error?.type,
        },
        { status: 400 }
      );
    }

    // Check if the token belongs to the claimed Page ID (optional safety check)
    if (pageId.trim() && metaData.id && metaData.id !== pageId.trim()) {
      return NextResponse.json({
        valid: true,
        pageId: metaData.id,
        pageName: metaData.name || "Facebook Business Page",
        category: metaData.category || "Real Estate",
        warning: `The access token corresponds to Page ID ${metaData.id} (updated automatically from ${pageId.trim()}).`,
        verifiedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      valid: true,
      pageId: metaData.id || pageId.trim(),
      pageName: metaData.name || "Facebook Business Page",
      category: metaData.category || "Real Estate",
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        valid: false,
        error:
          err instanceof Error
            ? err.message
            : "Network error connecting to Meta Graph API",
      },
      { status: 500 }
    );
  }
}

