import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { DOMParser } from '@xmldom/xmldom';
import type { Document as XmlDocument, Node as XmlNode } from '@xmldom/xmldom';
import xpath from 'xpath';
import { DEFAULT_PONTA_GROSSA_CONFIG, type PontaGrossaConfig } from './ponta-grossa-config';

const SOAP_ENV_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const WSSE_NS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
const WSU_NS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';
const ELONFSE_NS = 'http://shad.elotech.com.br/schemas/iss/nfse_v1_2.xsd';
const X509_VALUE_TYPE = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3';
const BASE64_ENCODING_TYPE = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary';

export interface PontaGrossaServiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable?: boolean;
}

export interface PontaGrossaTomador {
  cnpj?: string;
  cpf?: string;
  inscricaoMunicipal?: string;
  razaoSocial: string;
  street: string;
  number: string;
  neighborhood: string;
  cityCode: string;
  cityName?: string;
  uf: string;
  cep: string;
  phone?: string;
  email?: string;
  stateRegistration?: string;
}

export interface EmitirLoteRpsSincronoInput {
  config: PontaGrossaConfig;
  lotNumber?: number;
  rpsNumber?: number;
  issueDate: string;
  competenceDate: string;
  serviceDescription: string;
  grossAmount: number;
  deductions?: number;
  issRetido: 1 | 2;
  exigibilidadeIss?: number;
  municipalityIncidenceCode?: string;
  constructionCode?: string;
  artCode?: string;
  incentiveFiscal?: 1 | 2;
  tomador: PontaGrossaTomador;
  serviceItems: PontaGrossaServiceItem[];
}

export interface TestConsultaPrestadoInput {
  config: PontaGrossaConfig;
  nfseNumber?: string;
  startDate: string;
  endDate: string;
  tomadorCnpj?: string;
  tomadorInscricaoMunicipal?: string;
  page?: number;
}

export interface NfseConsultaResumo {
  numero: string;
  codigoVerificacao: string;
  dataEmissao: string;
  valorLiquido?: string;
  chaveAcesso?: string;
  rpsNumero?: string;
  rpsSerie?: string;
  tomador?: string;
}

export interface SoapExecutionResult {
  requestXml: string;
  responseXml: string;
  parsed: Record<string, unknown>;
}

export type { PontaGrossaConfig } from './ponta-grossa-config';
export { DEFAULT_PONTA_GROSSA_CONFIG } from './ponta-grossa-config';

type LoadedCertificate = {
  privateKeyPem: string;
  certificateBase64: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeDigits(value: string | undefined) {
  return String(value || '').replace(/\D/g, '');
}

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'sim', 'production', 'prod'].includes(value.trim().toLowerCase());
}

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPontaGrossaEnvConfig(): Partial<PontaGrossaConfig> {
  return {
    certPath: process.env.PONTA_GROSSA_NFSE_CERT_PATH || '',
    certPassword: process.env.PONTA_GROSSA_NFSE_CERT_PASSWORD || '',
    webservicePassword: process.env.PONTA_GROSSA_NFSE_WEBSERVICE_PASSWORD || '',
    cnpj: process.env.PONTA_GROSSA_NFSE_CNPJ || '',
    inscricaoMunicipal: process.env.PONTA_GROSSA_NFSE_INSCRICAO_MUNICIPAL || DEFAULT_PONTA_GROSSA_CONFIG.inscricaoMunicipal,
    production: readBooleanEnv(process.env.PONTA_GROSSA_NFSE_PRODUCTION, DEFAULT_PONTA_GROSSA_CONFIG.production),
    serieRps: process.env.PONTA_GROSSA_NFSE_SERIE_RPS || DEFAULT_PONTA_GROSSA_CONFIG.serieRps,
    nextRpsNumber: readNumberEnv(process.env.PONTA_GROSSA_NFSE_NEXT_RPS_NUMBER, DEFAULT_PONTA_GROSSA_CONFIG.nextRpsNumber),
    nextLotNumber: readNumberEnv(process.env.PONTA_GROSSA_NFSE_NEXT_LOT_NUMBER, DEFAULT_PONTA_GROSSA_CONFIG.nextLotNumber),
    municipalServiceCode: process.env.PONTA_GROSSA_NFSE_MUNICIPAL_SERVICE_CODE || '',
    cnaeCode: process.env.PONTA_GROSSA_NFSE_CNAE_CODE || '',
    cityCode: process.env.PONTA_GROSSA_NFSE_CITY_CODE || DEFAULT_PONTA_GROSSA_CONFIG.cityCode,
    cityName: process.env.PONTA_GROSSA_NFSE_CITY_NAME || DEFAULT_PONTA_GROSSA_CONFIG.cityName,
    issuerRazaoSocial: process.env.PONTA_GROSSA_NFSE_ISSUER_RAZAO_SOCIAL || DEFAULT_PONTA_GROSSA_CONFIG.issuerRazaoSocial,
    issuerStreet: process.env.PONTA_GROSSA_NFSE_ISSUER_STREET || '',
    issuerNumber: process.env.PONTA_GROSSA_NFSE_ISSUER_NUMBER || '',
    issuerNeighborhood: process.env.PONTA_GROSSA_NFSE_ISSUER_NEIGHBORHOOD || '',
    issuerCep: process.env.PONTA_GROSSA_NFSE_ISSUER_CEP || '',
    issuerUf: process.env.PONTA_GROSSA_NFSE_ISSUER_UF || DEFAULT_PONTA_GROSSA_CONFIG.issuerUf,
    issuerEmail: process.env.PONTA_GROSSA_NFSE_ISSUER_EMAIL || '',
  };
}

export function resolvePontaGrossaConfig(override?: Partial<PontaGrossaConfig>): PontaGrossaConfig {
  return {
    ...DEFAULT_PONTA_GROSSA_CONFIG,
    ...getPontaGrossaEnvConfig(),
    ...(override || {}),
  };
}

async function loadCertificate(config: PontaGrossaConfig): Promise<LoadedCertificate> {
  const rawBuffer = await fs.readFile(config.certPath);
  const der = rawBuffer.toString('binary');
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, config.certPassword);

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag];
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];

  const privateKey = keyBags?.[0]?.key;
  const certificate = certBags?.[0]?.cert;

  if (!privateKey || !certificate) {
    throw new Error('Não foi possível carregar a chave privada e o certificado do arquivo PFX.');
  }

  return {
    privateKeyPem: forge.pki.privateKeyToPem(privateKey),
    certificateBase64: forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes()),
  };
}

function buildIdentificacaoRequerente(config: PontaGrossaConfig) {
  return `<IdentificacaoRequerente><CpfCnpj><Cnpj>${normalizeDigits(config.cnpj)}</Cnpj></CpfCnpj><InscricaoMunicipal>${escapeXml(
    config.inscricaoMunicipal
  )}</InscricaoMunicipal><Senha>${escapeXml(config.webservicePassword)}</Senha><Homologa>${
    config.production ? 'false' : 'true'
  }</Homologa></IdentificacaoRequerente>`;
}

function signSoapEnvelope(unsignedXml: string, certificate: LoadedCertificate) {
  const tokenId = `CertId-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
  const strId = `STRId-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
  const bodyId = 'id-2';

  const xmlWithToken = unsignedXml
    .replace('__TOKEN_ID__', tokenId)
    .replace('__CERTIFICATE_BASE64__', certificate.certificateBase64)
    .replace('__BODY_ID__', bodyId);

  const signer = new SignedXml({
    privateKey: certificate.privateKeyPem,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    getKeyInfoContent: () =>
      `<wsse:SecurityTokenReference xmlns:wsu="${WSU_NS}" wsu:Id="${strId}" xmlns:wsse="${WSSE_NS}"><wsse:Reference URI="#${tokenId}" ValueType="${X509_VALUE_TYPE}" xmlns:wsse="${WSSE_NS}"/></wsse:SecurityTokenReference>`,
  });

  signer.addReference({
    xpath: "//*[local-name()='Body']",
    transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    uri: `#${bodyId}`,
  });

  signer.computeSignature(xmlWithToken, {
    prefix: 'ds',
    existingPrefixes: {
      'SOAP-ENV': SOAP_ENV_NS,
      wsse: WSSE_NS,
      wsu: WSU_NS,
    },
    location: {
      reference: "//*[local-name()='Security']",
      action: 'append',
    },
  });

  return signer.getSignedXml();
}

async function executeSoap(xml: string) {
  const response = await fetch('https://pontagrossa.oxy.elotech.com.br/iss-ws/nfseService', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
    },
    body: xml,
  });

  const responseXml = await response.text();
  if (!response.ok) {
    throw new Error(`Falha no webservice da Prefeitura (${response.status}). ${responseXml.slice(0, 400)}`);
  }

  return responseXml;
}

function parseSoapFault(doc: XmlDocument) {
  const select = xpath.useNamespaces({ soap: SOAP_ENV_NS });
  const faultString = select("string(//*[local-name()='Fault']/*[local-name()='faultstring'])", doc as unknown as Node) as string;
  return faultString || '';
}

function selectText(node: XmlNode, expression: string) {
  const result = xpath.select1(expression, node as unknown as Node) as XmlNode | string | number | boolean | null;
  if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
    return String(result);
  }
  if (!result) return '';
  return result.textContent || '';
}

function parseConsultaServicoPrestadoResponse(responseXml: string) {
  const doc = new DOMParser().parseFromString(responseXml, 'text/xml');
  const fault = parseSoapFault(doc);
  if (fault) {
    throw new Error(`Falha retornada pelo webservice: ${fault}`);
  }

  const nodes = xpath.select(
    "//*[local-name()='ListaConsultaNfse']/*[local-name()='CompNfse']",
    doc as unknown as Node
  ) as unknown as XmlNode[];
  const items: NfseConsultaResumo[] = nodes.map((node) => {
    return {
      numero: selectText(node, ".//*[local-name()='Numero'][1]"),
      codigoVerificacao: selectText(node, ".//*[local-name()='CodigoVerificacao'][1]"),
      dataEmissao: selectText(node, ".//*[local-name()='DataEmissao'][1]"),
      valorLiquido: selectText(node, ".//*[local-name()='ValorLiquidoNfse'][1]"),
      chaveAcesso: selectText(node, ".//*[local-name()='ChaveAcesso'][1]"),
      rpsNumero: selectText(node, ".//*[local-name()='IdentificacaoRps']/*[local-name()='Numero'][1]"),
      rpsSerie: selectText(node, ".//*[local-name()='IdentificacaoRps']/*[local-name()='Serie'][1]"),
      tomador: selectText(node, ".//*[local-name()='Tomador']/*[local-name()='RazaoSocial'][1]"),
    };
  });

  return {
    count: items.length,
    items,
  };
}

function parseEnviarLoteRpsSincronoResponse(responseXml: string) {
  const doc = new DOMParser().parseFromString(responseXml, 'text/xml');
  const fault = parseSoapFault(doc);
  if (fault) {
    throw new Error(`Falha retornada pelo webservice: ${fault}`);
  }

  return {
    numeroLote: selectText(doc, "//*[local-name()='NumeroLote'][1]"),
    dataRecebimento: selectText(doc, "//*[local-name()='DataRecebimento'][1]"),
    numeroNfse: selectText(doc, "(//*[local-name()='ListaNfse']//*[local-name()='Numero'])[1]"),
    codigoVerificacao: selectText(doc, "(//*[local-name()='ListaNfse']//*[local-name()='CodigoVerificacao'])[1]"),
    chaveAcesso: selectText(doc, "(//*[local-name()='ListaNfse']//*[local-name()='ChaveAcesso'])[1]"),
    xmlAutorizado: selectText(doc, "(//*[local-name()='ListaNfse']//*[local-name()='Xml'])[1]"),
  };
}

function buildSoapEnvelope(bodyContent: string) {
  return `<SOAP-ENV:Envelope xmlns:SOAP-ENV="${SOAP_ENV_NS}"><SOAP-ENV:Header><wsse:Security xmlns:wsse="${WSSE_NS}" SOAP-ENV:mustUnderstand="1"><wsse:BinarySecurityToken xmlns:wsu="${WSU_NS}" EncodingType="${BASE64_ENCODING_TYPE}" ValueType="${X509_VALUE_TYPE}" wsu:Id="__TOKEN_ID__" xmlns:wsse="${WSSE_NS}">__CERTIFICATE_BASE64__</wsse:BinarySecurityToken></wsse:Security></SOAP-ENV:Header><SOAP-ENV:Body xmlns:wsu="${WSU_NS}" wsu:Id="__BODY_ID__">${bodyContent}</SOAP-ENV:Body></SOAP-ENV:Envelope>`;
}

export async function consultarNfseServicoPrestado(input: TestConsultaPrestadoInput): Promise<SoapExecutionResult> {
  const certificate = await loadCertificate(input.config);
  const tomadorXml = input.tomadorCnpj
    ? `<IdentificacaoTomador><CpfCnpj><Cnpj>${normalizeDigits(input.tomadorCnpj)}</Cnpj></CpfCnpj>${
        input.tomadorInscricaoMunicipal ? `<InscricaoMunicipal>${escapeXml(input.tomadorInscricaoMunicipal)}</InscricaoMunicipal>` : ''
      }</IdentificacaoTomador>`
    : '';

  const body = `<ConsultarNfseServicoPrestadoEnvio xmlns="${ELONFSE_NS}">${buildIdentificacaoRequerente(
    input.config
  )}${input.nfseNumber ? `<NumeroNfse>${escapeXml(input.nfseNumber)}</NumeroNfse>` : ''}<PeriodoEmissao><DataInicial>${escapeXml(
    input.startDate
  )}</DataInicial><DataFinal>${escapeXml(input.endDate)}</DataFinal></PeriodoEmissao>${tomadorXml}<Pagina>${String(
    input.page || 1
  )}</Pagina></ConsultarNfseServicoPrestadoEnvio>`;

  const requestXml = signSoapEnvelope(buildSoapEnvelope(body), certificate);
  const responseXml = await executeSoap(requestXml);
  return {
    requestXml,
    responseXml,
    parsed: parseConsultaServicoPrestadoResponse(responseXml),
  };
}

export async function emitirLoteRpsSincrono(input: EmitirLoteRpsSincronoInput): Promise<SoapExecutionResult> {
  const certificate = await loadCertificate(input.config);
  const lotNumber = input.lotNumber || input.config.nextLotNumber;
  const rpsNumber = input.rpsNumber || input.config.nextRpsNumber;
  const deductionValue = input.deductions || 0;
  const municipalityIncidence = input.municipalityIncidenceCode || input.config.cityCode;

  const serviceItemsXml = input.serviceItems
    .map(
      (item) =>
        `<ItemServico><ItemListaServico>${escapeXml(input.config.municipalServiceCode)}</ItemListaServico><CodigoCnae>${escapeXml(
          input.config.cnaeCode
        )}</CodigoCnae><Descricao>${escapeXml(item.description)}</Descricao><Tributavel>${item.taxable === false ? '2' : '1'}</Tributavel><Quantidade>${item.quantity.toFixed(
          2
        )}</Quantidade><ValorUnitario>${item.unitPrice.toFixed(5)}</ValorUnitario><ValorDesconto>0.00</ValorDesconto><ValorLiquido>${(
          item.quantity * item.unitPrice
        ).toFixed(7)}</ValorLiquido></ItemServico>`
    )
    .join('');

  const tomadorCpfCnpjTag = input.tomador.cnpj
    ? `<Cnpj>${normalizeDigits(input.tomador.cnpj)}</Cnpj>`
    : `<Cpf>${normalizeDigits(input.tomador.cpf)}</Cpf>`;

  const body = `<EnviarLoteRpsSincronoEnvio xmlns="${ELONFSE_NS}">${buildIdentificacaoRequerente(
    input.config
  )}<LoteRps><NumeroLote>${lotNumber}</NumeroLote><QuantidadeRps>1</QuantidadeRps><ListaRps><DeclaracaoPrestacaoServico><InfDeclaracaoPrestacaoServico><Rps><IdentificacaoRps><Numero>${rpsNumber}</Numero><Serie>${escapeXml(
    input.config.serieRps
  )}</Serie><Tipo>1</Tipo></IdentificacaoRps><DataEmissao>${escapeXml(input.issueDate)}</DataEmissao><Status>1</Status></Rps><Competencia>${escapeXml(
    input.competenceDate
  )}</Competencia><Servico><Valores><ValorServicos>${input.grossAmount.toFixed(
    2
  )}</ValorServicos><ValorDeducoes>${deductionValue.toFixed(2)}</ValorDeducoes><ValorPis>0.00</ValorPis><ValorCofins>0.00</ValorCofins><ValorInss>0.00</ValorInss><ValorIr>0.00</ValorIr><ValorCsll>0.00</ValorCsll><OutrasRetencoes>0.00</OutrasRetencoes><DescontoIncondicionado>0.00</DescontoIncondicionado><DescontoCondicionado>0.00</DescontoCondicionado></Valores><IssRetido>${input.issRetido}</IssRetido><Discriminacao>${escapeXml(
    input.serviceDescription
  )}</Discriminacao><CodigoMunicipio>${escapeXml(input.config.cityCode)}</CodigoMunicipio><ExigibilidadeISS>${String(
    input.exigibilidadeIss || 1
  )}</ExigibilidadeISS><MunicipioIncidencia>${escapeXml(municipalityIncidence)}</MunicipioIncidencia><ListaItensServico>${serviceItemsXml}</ListaItensServico></Servico><DadosPrestador><IdentificacaoPrestador><CpfCnpj><Cnpj>${normalizeDigits(
    input.config.cnpj
  )}</Cnpj></CpfCnpj><InscricaoMunicipal>${escapeXml(input.config.inscricaoMunicipal)}</InscricaoMunicipal></IdentificacaoPrestador><RazaoSocial>${escapeXml(
    input.config.issuerRazaoSocial
  )}</RazaoSocial><Endereco><Endereco>${escapeXml(input.config.issuerStreet)}</Endereco><Numero>${escapeXml(
    input.config.issuerNumber
  )}</Numero><Bairro>${escapeXml(input.config.issuerNeighborhood)}</Bairro><CodigoMunicipio>${escapeXml(
    input.config.cityCode
  )}</CodigoMunicipio><CidadeNome>${escapeXml(input.config.cityName)}</CidadeNome><Uf>${escapeXml(
    input.config.issuerUf
  )}</Uf><Cep>${escapeXml(input.config.issuerCep)}</Cep></Endereco></DadosPrestador><Tomador><IdentificacaoTomador><CpfCnpj>${tomadorCpfCnpjTag}</CpfCnpj>${
    input.tomador.inscricaoMunicipal ? `<InscricaoMunicipal>${escapeXml(input.tomador.inscricaoMunicipal)}</InscricaoMunicipal>` : ''
  }</IdentificacaoTomador><RazaoSocial>${escapeXml(input.tomador.razaoSocial)}</RazaoSocial><Endereco><Endereco>${escapeXml(
    input.tomador.street
  )}</Endereco><Numero>${escapeXml(input.tomador.number)}</Numero><Bairro>${escapeXml(
    input.tomador.neighborhood
  )}</Bairro><CodigoMunicipio>${escapeXml(input.tomador.cityCode)}</CodigoMunicipio><CidadeNome>${escapeXml(
    input.tomador.cityName || input.config.cityName
  )}</CidadeNome><Uf>${escapeXml(input.tomador.uf)}</Uf><Cep>${escapeXml(input.tomador.cep)}</Cep></Endereco><Contato>${
    input.tomador.phone ? `<Telefone>${escapeXml(input.tomador.phone)}</Telefone>` : ''
  }${input.tomador.email ? `<Email>${escapeXml(input.tomador.email)}</Email>` : ''}</Contato>${
    input.tomador.stateRegistration ? `<InscricaoEstadual>${escapeXml(input.tomador.stateRegistration)}</InscricaoEstadual>` : ''
  }</Tomador>${
    input.constructionCode || input.artCode
      ? `<ConstrucaoCivil>${input.constructionCode ? `<CodigoObra>${escapeXml(input.constructionCode)}</CodigoObra>` : ''}${
          input.artCode ? `<Art>${escapeXml(input.artCode)}</Art>` : ''
        }</ConstrucaoCivil>`
      : ''
  }<IncentivoFiscal>${String(input.incentiveFiscal || 2)}</IncentivoFiscal></InfDeclaracaoPrestacaoServico></DeclaracaoPrestacaoServico></ListaRps></LoteRps></EnviarLoteRpsSincronoEnvio>`;

  const requestXml = signSoapEnvelope(buildSoapEnvelope(body), certificate);
  const responseXml = await executeSoap(requestXml);
  return {
    requestXml,
    responseXml,
    parsed: parseEnviarLoteRpsSincronoResponse(responseXml),
  };
}
