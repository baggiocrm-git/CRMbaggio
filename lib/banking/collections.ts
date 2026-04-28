import { supabase } from '@/lib/supabase';
import type {
  CollectionChargeRow,
  CollectionChargeStatus,
  ContaReceberCollectionStatus,
  CreateCollectionChargeInput,
  UpdateCollectionChargeStatusInput,
} from '@/lib/banking/types';

function mapChargeStatusToContaReceberStatus(status: CollectionChargeStatus): ContaReceberCollectionStatus {
  switch (status) {
    case 'gerada':
      return 'cobranca_gerada';
    case 'aguardando_pagamento':
      return 'aguardando_pagamento';
    case 'recebido_parcial':
      return 'recebido_parcial';
    case 'recebido_total':
      return 'recebido_total';
    case 'cancelada':
      return 'cancelado';
    case 'expirada':
      return 'vencido';
    default:
      return 'nao_cobrado';
  }
}

export async function createCollectionCharge(input: CreateCollectionChargeInput): Promise<CollectionChargeRow> {
  const payload = {
    conta_receber_id: input.contaReceberId,
    bank_account_id: input.bankAccountId ?? null,
    charge_type: input.chargeType,
    status: 'gerada' as CollectionChargeStatus,
    valor: input.valor,
    due_date: input.dueDate ?? null,
    payer_name: input.payerName ?? null,
    payer_document: input.payerDocument ?? null,
    pix_copy_paste: input.pixCopyPaste ?? null,
    boleto_url: input.boletoUrl ?? null,
    qr_code_url: input.qrCodeUrl ?? null,
    external_charge_id: input.externalChargeId ?? null,
    metadata: input.metadata ?? {},
    created_by: input.createdBy ?? null,
  };

  const { data, error } = await supabase
    .from('collection_charges')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  const { error: contaError } = await supabase
    .from('contas_receber')
    .update({
      collection_status: 'cobranca_gerada',
      collection_charge_id: data.id,
      bank_account_id: input.bankAccountId ?? null,
      updated_by: input.createdBy ?? null,
      last_event_at: new Date().toISOString(),
    })
    .eq('id', input.contaReceberId);

  if (contaError) throw contaError;

  return data as CollectionChargeRow;
}

export async function getCollectionCharge(collectionChargeId: string): Promise<CollectionChargeRow | null> {
  const { data, error } = await supabase
    .from('collection_charges')
    .select('*')
    .eq('id', collectionChargeId)
    .single();

  if (error) throw error;
  return (data as CollectionChargeRow) ?? null;
}

export async function listCollectionChargesByContaReceber(contaReceberId: string): Promise<CollectionChargeRow[]> {
  const { data, error } = await supabase
    .from('collection_charges')
    .select('*')
    .eq('conta_receber_id', contaReceberId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as CollectionChargeRow[]) ?? [];
}

export async function updateCollectionChargeStatus(input: UpdateCollectionChargeStatusInput) {
  const timestamp = new Date().toISOString();
  const contaStatus = mapChargeStatusToContaReceberStatus(input.status);

  const { data, error } = await supabase
    .from('collection_charges')
    .update({
      status: input.status,
      valor_recebido: input.valorRecebido,
      external_charge_id: input.externalChargeId ?? undefined,
      metadata: input.metadata ?? undefined,
    })
    .eq('id', input.collectionChargeId)
    .select('*')
    .single();

  if (error) throw error;

  const contaPayload: Record<string, unknown> = {
    collection_status: contaStatus,
    partner_collection_status: input.status,
    last_event_at: timestamp,
  };

  if (typeof input.valorRecebido === 'number') {
    contaPayload.valor_recebido = input.valorRecebido;
  }

  if (input.status === 'recebido_total' || input.status === 'recebido_parcial') {
    contaPayload.received_at = timestamp;
    contaPayload.data_recebimento = timestamp;
    contaPayload.situacao = input.status === 'recebido_total' ? 'Recebido' : 'REC. PARCIAL';
  }

  const { error: contaError } = await supabase
    .from('contas_receber')
    .update(contaPayload)
    .eq('id', data.conta_receber_id);

  if (contaError) throw contaError;

  return data as CollectionChargeRow;
}
