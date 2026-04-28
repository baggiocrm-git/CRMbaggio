export type BankingConnectionType = 'open_finance' | 'pix' | 'boleto' | 'cnab';
export type BankingConnectionStatus = 'ativa' | 'expirada' | 'revogada' | 'erro';
export type BankAccountType = 'corrente' | 'poupanca' | 'pagamento' | 'outro';

export type PaymentRequestType = 'pix' | 'ted' | 'boleto' | 'manual';
export type PaymentRequestStatus =
  | 'rascunho'
  | 'pendente_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'enviado'
  | 'processando'
  | 'pago'
  | 'falhou'
  | 'cancelado';

export type PaymentApprovalDecision = 'aprovado' | 'rejeitado';
export type PaymentEventSource = 'system' | 'user' | 'provider' | 'webhook';

export type CollectionChargeType = 'pix' | 'boleto' | 'link_pagamento' | 'manual';
export type CollectionChargeStatus =
  | 'rascunho'
  | 'gerada'
  | 'aguardando_pagamento'
  | 'recebido_parcial'
  | 'recebido_total'
  | 'expirada'
  | 'cancelada'
  | 'falhou';

export type ReconciliationMatchType = 'pagamento' | 'recebimento';
export type ReconciliationMatchedBy = 'automatico' | 'manual';

export type ContaPagarApprovalStatus =
  | 'nao_enviado'
  | 'pendente_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'enviado_banco'
  | 'pago'
  | 'falhou'
  | 'cancelado';

export type ContaReceberCollectionStatus =
  | 'nao_cobrado'
  | 'cobranca_gerada'
  | 'aguardando_pagamento'
  | 'recebido_parcial'
  | 'recebido_total'
  | 'vencido'
  | 'cancelado';

export interface PaymentRequestRow {
  id: string;
  conta_pagar_id: string;
  bank_account_id: string | null;
  request_type: PaymentRequestType;
  status: PaymentRequestStatus;
  favorecido_nome: string;
  favorecido_documento: string | null;
  favorecido_banco: string | null;
  favorecido_agencia: string | null;
  favorecido_conta: string | null;
  favorecido_chave_pix: string | null;
  valor: number;
  scheduled_for: string | null;
  requested_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  external_payment_id: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CollectionChargeRow {
  id: string;
  conta_receber_id: string;
  bank_account_id: string | null;
  charge_type: CollectionChargeType;
  status: CollectionChargeStatus;
  valor: number;
  valor_recebido: number;
  due_date: string | null;
  payer_name: string | null;
  payer_document: string | null;
  pix_copy_paste: string | null;
  boleto_url: string | null;
  qr_code_url: string | null;
  external_charge_id: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_user_id: string | null;
  actor_name: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreatePaymentRequestInput {
  contaPagarId: string;
  bankAccountId?: string | null;
  requestType: PaymentRequestType;
  favorecidoNome: string;
  valor: number;
  requestedBy?: string | null;
  scheduledFor?: string | null;
  favorecidoDocumento?: string | null;
  favorecidoBanco?: string | null;
  favorecidoAgencia?: string | null;
  favorecidoConta?: string | null;
  favorecidoChavePix?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ApprovePaymentRequestInput {
  paymentRequestId: string;
  approverUserId: string;
  decision: PaymentApprovalDecision;
  comment?: string | null;
}

export interface RegisterPaymentExecutionInput {
  paymentRequestId: string;
  provider: string;
  providerStatus: string;
  amount: number;
  providerReference?: string | null;
  executedAt?: string | null;
  rawResponse?: Record<string, unknown>;
}

export interface AppendPaymentEventInput {
  paymentRequestId: string;
  eventType: string;
  eventSource: PaymentEventSource;
  eventPayload?: Record<string, unknown>;
  createdBy?: string | null;
}

export interface CreateCollectionChargeInput {
  contaReceberId: string;
  bankAccountId?: string | null;
  chargeType: CollectionChargeType;
  valor: number;
  createdBy?: string | null;
  dueDate?: string | null;
  payerName?: string | null;
  payerDocument?: string | null;
  pixCopyPaste?: string | null;
  boletoUrl?: string | null;
  qrCodeUrl?: string | null;
  externalChargeId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateCollectionChargeStatusInput {
  collectionChargeId: string;
  status: CollectionChargeStatus;
  valorRecebido?: number;
  externalChargeId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WriteAuditLogInput {
  entityType: string;
  entityId: string;
  action: string;
  actorUserId?: string | null;
  actorName?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}
