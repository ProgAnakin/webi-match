import { supabase } from "@/integrations/supabase/client";
import { getClientId } from "@/lib/clientId";

export interface PinResult {
  valid: boolean;
  locked_seconds: number;
}

// Verifies the staff PIN. Tries the Edge Function first (real client IP =
// proper brute-force lockout), falls back to the direct RPC if the function is
// unreachable (network failure, edge function cold-start crash, etc.).
// Returns null only when both paths failed at network level — treat as invalid.
export async function verifyStaffPin(pin: string): Promise<PinResult | null> {
  const clientId  = getClientId();
  const userAgent = navigator.userAgent;
  let result: PinResult | null = null;

  // Attempt 1 — Edge Function (captures real IP)
  try {
    const { data, error } = await supabase.functions.invoke("verify-pin", {
      body: { pin_input: pin, client_id: clientId, user_agent: userAgent },
    });
    if (
      !error &&
      data &&
      typeof (data as Record<string, unknown>).valid === "boolean"
    ) {
      result = data as PinResult;
    }
  } catch {
    /* edge function unreachable — fall through to RPC */
  }

  // Attempt 2 — direct RPC fallback (no IP capture, but always available)
  if (!result) {
    try {
      const { data } = await supabase.rpc("verify_staff_pin", {
        pin_input:  pin,
        client_id:  clientId,
        user_agent: userAgent,
      });
      result = data as PinResult | null;
    } catch {
      /* both paths failed — result stays null, treated as invalid */
    }
  }

  return result;
}
