import { useState, useEffect, useCallback } from "react";
import { Trash2, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STORES } from "@/data/stores";

interface RoleRow {
  id: string;
  user_id: string;
  user_email: string;
  role: string;
  store_id: string | null;
  created_at: string;
}

type RoleType = "manager" | "consulente_responsabile";

/**
 * /manager → Gestione → Ruoli.
 *
 * Lets a manager list, add and remove store_roles entries without touching the
 * Supabase Dashboard. All mutations go through SECURITY DEFINER RPCs that
 * verify the caller is themselves a manager and refuse self-deletion.
 *
 * Requires migration `20260518000002_store_roles_admin_rpc.sql` to be applied
 * on the Supabase project.
 */
export function RolesTab() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-role form
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<RoleType>("consulente_responsabile");
  const [storeInput, setStoreInput] = useState<string>(STORES[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcErr } = await supabase.rpc("list_store_roles_admin");
    if (rpcErr) {
      setError(rpcErr.message);
      setRows([]);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!trimmedEmail) return;
    setSubmitting(true);
    const { error: rpcErr } = await supabase.rpc("upsert_store_role_admin", {
      p_user_email: trimmedEmail,
      p_role: roleInput,
      p_store_id: roleInput === "manager" ? null : storeInput,
    });
    setSubmitting(false);
    if (rpcErr) {
      toast.error(`Error: ${rpcErr.message}`);
      return;
    }
    toast.success(`Role saved for ${trimmedEmail}.`);
    setEmailInput("");
    await fetchRoles();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error: rpcErr } = await supabase.rpc("delete_store_role_admin", {
      p_role_id: id,
    });
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (rpcErr) {
      toast.error(`Error: ${rpcErr.message}`);
      return;
    }
    toast.success("Role removed.");
    await fetchRoles();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Staff Roles</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage who can access <code>/manager</code> and <code>/stats</code>. Each user must
          exist in <em>Supabase Auth → Users</em> before they can be assigned a role.
        </p>
      </div>

      {/* Add form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-4 space-y-3"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <UserPlus className="inline h-3 w-3 mr-1 -mt-0.5" />
          Add or update role
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">User email</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="staff@example.com"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">Role</label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as RoleType)}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value="consulente_responsabile">Store consultant (1 store)</option>
              <option value="manager">Manager (all stores)</option>
            </select>
          </div>
        </div>

        {roleInput === "consulente_responsabile" && (
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">Assigned store</label>
            <select
              value={storeInput}
              onChange={(e) => setStoreInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              {STORES.map((s) => (
                <option key={s.id} value={s.id}>{s.shortName}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !emailInput.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Save role</>}
        </button>

        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          If the email already exists, the role is updated. A user can only have one role.
        </p>
      </form>

      {/* Roles list */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Unable to load roles</p>
            <p className="opacity-80 mt-0.5">{error}</p>
            {error.includes("forbidden") && (
              <p className="mt-1">Only users with the <strong>manager</strong> role can manage roles.</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 animate-pulse">
              <div className="h-4 w-48 rounded bg-muted/50 mb-2" />
              <div className="h-3 w-32 rounded bg-muted/40" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 && !error ? (
        <p className="rounded-xl border border-border bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
          No roles configured. Add the first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const storeName = r.store_id ? STORES.find((s) => s.id === r.store_id)?.shortName ?? r.store_id : null;
            const isConfirming = confirmDeleteId === r.id;
            return (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{r.user_email}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      r.role === "manager"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    }`}>
                      {r.role === "manager" ? "Manager" : "Consultant"}
                    </span>
                    {storeName && <span className="ml-2">📍 {storeName}</span>}
                  </p>
                </div>

                {isConfirming ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="rounded-lg bg-destructive px-3 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-50 min-h-[44px] focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      {deletingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground active:scale-95 min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(r.id)}
                    title="Remove role"
                    aria-label={`Remove role for ${r.user_email}`}
                    className="rounded-lg border border-border bg-muted/30 p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
