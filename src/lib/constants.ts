
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
  'Proje Yükü',
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

export const WEIGHT_UNITS = ['Ton', 'Kg'] as const;

export const SHIPMENT_SCOPES = ['Yurt İçi', 'Yurt Dışı'] as const;

// Eski VEHICLE_TYPES kaldırıldı, yerine VEHICLES_NEEDED geldi.
// VehicleType tipi de güncellenmeli veya kaldırılmalı.
