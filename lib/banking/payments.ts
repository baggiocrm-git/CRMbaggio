import { supabase } from '@/lib/supabase';
import type {
  AppendPaymentEventInput,
  ApprovePaymentRequestInput,
  ContaPagarApprovalStatus,
  CreatePaymentRequestInput,
  PaymentRequestRow,
  PaymentRequestStatus,
  RegisterPaymentExecutionInput,
} from '@/lib/banking/types';

function createIdempotencyKey(provided?: string | null) {
  if (provided) return provided;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function mapRequestStatusToContaPagarStatus(status: PaymentRequestStatus): ContaPagarApprovalStatus {
  switch (status) {
    case 'pendente_aprovacao':
      return 'pendente_aprovacao';
    case 'aprovado':
      return 'aprovado';
    case 'rejeitado':
      return 'rejeitado';
    case 'enviado':
    case 'processando':
      return 'enviado_banco';
    case 'pago':
      return 'pago';
    case 'falhou':
      return 'falhou';
    case 'cancelado':
      return 'cancelado';
    default:
      return 'nao_enviado';
  }
}

export async function createPaymentRequest(input: CreatePaymentRequestInput): Promise<PaymentRequestRow> {
  const payload = {
    conta_pagar_id: input.contaPagarId,
    bank_account_id: input.bankAccountId ?? null,
    request_type: input.requestType,
    status: 'pendente_aprovacao' as PaymentRequestStatus,
    favorecido_nome: input.favorecidoNome,
    favorecido_documento: input.favorecidoDocumento ?? null,
    favorecido_banco: input.favorecidoBanco ?? null,
    favorecido_agencia: input.favorecidoAgencia ?? null,
    favorecido_conta: input.favorecidoConta ?? null,
    favorecido_chave_pix: input.favorecidoChavePix ?? null,
    valor: input.valor,
    scheduled_for: input.scheduledFor ?? null,
    requested_by: input.requestedBy ?? null,
    idempotency_key: createIdempotencyKey(input.idempotencyKey),
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase
    .from('payment_requests')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  const { error: contaError } = await supabase
    .from('contas_pagar')
    .update({
      approval_status: 'pendente_aprovacao',
      payment_request_id: data.id,
      bank_account_id: input.bankAccountId ?? null,
      updated_by: input.requestedBy ?? null,
      last_event_at: new Date().toISOString(),
    })
    .eq('id', input.contaPagarId);

  if (contaError) throw contaError;

  return data as PaymentRequestRow;
}

export async function getPaymentRequest(paymentRequestId: string): Promise<PaymentRequestRow | null> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', paymentRequestId)
    .single();

  if (error) throw error;
  return (data as PaymentRequestRow) ?? null;
}

export async function listPaymentRequestsByContaPagar(contaPagarId: string): Promise<PaymentRequestRow[]> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('conta_pagar_id', contaPagarId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as PaymentRequestRow[]) ?? [];
}

export async function approvePaymentRequest(input: ApprovePaymentRequestInput) {
  const nextStatus: PaymentRequestStatus = input.decision === 'aprovado' ? 'aprovado' : 'rejeitado';
  const decidedAt = new Date().toISOString();

  const { data: request, error: requestError } = await supabase
    .from('payment_requests')
    .update({
      status: nextStatus,
      approved_at: input.decision === 'aprovado' ? decidedAt : null,
    })
    .eq('id', input.paymentRequestId)
    .select('*')
    .single();

  if (requestError) throw requestError;

  const { error: approvalError } = await supabase.from('payment_approvals').insert({
    payment_request_id: input.paymentRequestId,
    approver_user_id: input.approverUserId,
    decision: input.decision,
    comment: input.comment ?? null,
    decided_at: decidedAt,
  });

  if (approvalError) throw approvalError;

  const { error: contaError } = await supabase
    .from('contas_pagar')
    .update({
      approval_status: mapRequestStatusToContaPagarStatus(nextStatus),
      updated_by: input.approverUserId,
      last_event_at: decidedAt,
    })
    .eq('id', request.conta_pagar_id);

  if (contaError) throw contaError;

  return request as PaymentRequestRow;
}

export async function updatePaymentRequestStatus(paymentRequestId: string, status: PaymentRequestStatus) {
  const timestamp = new Date().toISOString();
  const contaStatus = mapRequestStatusToContaPagarStatus(status);

  const { data, error } = await supabase
    .from('payment_requests')
    .update({
      status,
      executed_at: status === 'pago' ? timestamp : undefined,
    })
    .eq('id', paymentRequestId)
    .select('*')
    .single();

  if (error) throw error;

  const contaPayload: Record<string, unknown> = {
    approval_status: contaStatus,
    partner_payment_status: status,
    last_event_at: timestamp,
  };

  if (status === 'pago') {
    contaPayload.paid_at = timestamp;
    contaPayload.data_pagamento = timestamp;
    contaPayload.situacao = 'Pago';
  }

  const { error: contaError } = await supabase
    .from('contas_pagar')
    .update(contaPayload)
    .eq('id', data.conta_pagar_id);

  if (contaError) throw contaError;

  return data as PaymentRequestRow;
}

export async function registerPaymentExecution(input: RegisterPaymentExecutionInput) {
  const executionPayload = {
    payment_request_id: input.paymentRequestId,
    provider: input.provider,
    provider_status: input.providerStatus,
    provider_reference: input.providerReference ?? null,
    amount: input.amount,
    executed_at: input.executedAt ?? null,
    raw_response: input.rawResponse ?? {},
  };

  const { data, error } = await supabase
    .from('payment_executions')
    .insert(executionPayload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function appendPaymentEvent(input: AppendPaymentEventInput) {
  const { data, error } = await supabase
    .from('payment_events')
    .insert({
      payment_request_id: input.paymentRequestId,
      event_type: input.eventType,
      event_source: input.eventSource,
      event_payload: input.eventPayload ?? {},
      created_by: input.createdBy ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
