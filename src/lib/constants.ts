
export const CARGO_TYPES = [
  'Gıda',
  'Sanayi Üretimi',
  'İnşaat Malzemeleri',
  'Tekstil',
  'Hafif Tonajlı Yük',
  'Diğer',
] as const;

export const VEHICLES_NEEDED = [
  '10 Teker Kamyon',
  '120 M3 Kamyon Römork',
  '13.60 Açık Tır',
  '13.60 Kapalı Tır',
  'Çekici',
  'Açık Kamyon',
  'Açık ve Kapalı Tır',
  'Adr’li Tır',
  'Araç Farketmez',
  'Düz Tenteli',
  'Damper Dorse',
  'Denizyolu',
  'Frigofrig',
  'Havuz Dorse',
  'Isuzu',
  'Kırk Ayak Kamyon',
  'Kısa Dorse',
  'Kamyon',
  'Kamyon Römork',
  'Kamyonet',
  'Kayar Perde Kayar Çatı',
  'Konteyner',
  'Konteyner (20\'lik)',
  'Konteyner (40\'lık)',
  'Konteyner (45\'lik)',
  'Kuru Yük Gemisi',
  'Lowbed',
  'Mega Araç',
  'Midilli',
  'Minivan',
  'Oto Taşıma',
  'Panelvan',
  'Proje Yükü', // Added based on previous request, ensuring it's here
  'Römork Tır',
  'Sal Kasa Dorse',
  'Tanker',
  'Tenteli Kamyon',
  'Tenteli Minivan',
  'Tenteli Tır',
  'Tenteli Tır ya da Frigofirik Tır',
  'Yanıcılı Araç',
] as const;

export const LOADING_TYPES = [
  'Komple',
  'Parsiyel',
  'Tonajlı',
] as const;

export const CARGO_FORMS = [
  'Paletli',
  'Kolili',
  'Balya',
  'Bobin',
  'Diğer',
] as const;

export const WEIGHT_UNITS = ['Ton', 'Kg', 'M³ (metreküp)'] as const;

export const SHIPMENT_SCOPES = ['Yurt İçi', 'Yurt Dışı'] as const;

export const FREIGHT_TYPES = ['Ticari', 'Evden Eve'] as const;

export const RESIDENTIAL_TRANSPORT_TYPES = [
  'Uluslararası Taşımacılık',
  'Şehirlerarası Taşımacılık',
  'Ofis Taşımacılığı',
  'Fabrika Taşımacılığı',
  'Fuar Taşımacılığı',
  'Diğer',
] as const;

export const RESIDENTIAL_PLACE_TYPES = [
  'Ev',
  'İş Yeri',
  'Malzeme',
] as const;

export const RESIDENTIAL_ELEVATOR_STATUSES = [
  'Asansör Yok',
  'Yükleme Adresinde Var',
  'Boşaltma Adresinde Var',
  'Her İkisinde de Var',
] as const;

export const RESIDENTIAL_FLOOR_LEVELS = [
  'Giriş Kat',
  '1’nci Kat',
  '2’nci Kat',
  '3’ncü Kat',
  '4’ncü Kat',
  '5’nci Kat ve Üzeri',
] as const;

// New constants for Company Registration
export const COMPANY_TYPES = [
  { value: 'local', label: 'Yerel Firma' },
  { value: 'foreign', label: 'Yabancı Firma' },
] as const;

export const WORKING_METHODS = [
  { id: 'international', label: 'Uluslararası Taşımacılık' },
  { id: 'domestic_intercity', label: 'Yurt İçi Nakliyat (Şehirler Arası)' },
  { id: 'city_transport', label: 'Şehir İçi Nakliyat' },
] as const;

export const WORKING_ROUTES = [
  { id: 'road', label: 'Karayolu' },
  { id: 'air', label: 'Havayolu' },
  { id: 'sea', label: 'Denizyolu' },
  { id: 'rail', label: 'Demiryolu' },
] as const;
