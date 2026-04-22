export interface PontaGrossaConfig {
  certPath: string;
  certPassword: string;
  webservicePassword: string;
  cnpj: string;
  inscricaoMunicipal: string;
  production: boolean;
  serieRps: string;
  nextRpsNumber: number;
  nextLotNumber: number;
  municipalServiceCode: string;
  cnaeCode: string;
  cityCode: string;
  cityName: string;
  issuerRazaoSocial: string;
  issuerStreet: string;
  issuerNumber: string;
  issuerNeighborhood: string;
  issuerCep: string;
  issuerUf: string;
  issuerEmail?: string;
}

export const DEFAULT_PONTA_GROSSA_CONFIG: PontaGrossaConfig = {
  certPath: '',
  certPassword: '',
  webservicePassword: '',
  cnpj: '',
  inscricaoMunicipal: '37706',
  production: true,
  serieRps: '1',
  nextRpsNumber: 1,
  nextLotNumber: 1,
  municipalServiceCode: '',
  cnaeCode: '',
  cityCode: '4119905',
  cityName: 'PONTA GROSSA',
  issuerRazaoSocial: 'CONSTRUTORA BAGGIO SILVEIRA LTDA',
  issuerStreet: '',
  issuerNumber: '',
  issuerNeighborhood: '',
  issuerCep: '',
  issuerUf: 'PR',
  issuerEmail: '',
};
