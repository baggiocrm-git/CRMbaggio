import { supabase } from '@/lib/supabase';
import type { AuditLogRow, WriteAuditLogInput } from '@/lib/banking/types';

export async function writeAuditLog(input: WriteAuditLogInput): Promise<AuditLogRow> {
  const payload = {
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    actor_user_id: input.actorUserId ?? null,
    actor_name: input.actorName ?? null,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as AuditLogRow;
}

export async function listAuditLogs(entityType: string, entityId: string): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AuditLogRow[]) ?? [];
}
