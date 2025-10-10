// Location data with countries and their provinces/states
export interface Country {
  code: string;
  name: string;
  provinces: Province[];
}

export interface Province {
  code: string;
  name: string;
}

export const countries: Country[] = [
  {
    code: "vn",
    name: "Vietnam",
    provinces: [
      // Centrally-controlled Municipalities
      { code: "hanoi", name: "Hanoi" },
      { code: "ho-chi-minh", name: "Ho Chi Minh City" },
      { code: "da-nang", name: "Da Nang" },
      { code: "hai-phong", name: "Hai Phong" },
      { code: "can-tho", name: "Can Tho" },
      
      // Northern Provinces
      { code: "ha-giang", name: "Ha Giang" },
      { code: "cao-bang", name: "Cao Bang" },
      { code: "bac-kan", name: "Bac Kan" },
      { code: "tuyen-quang", name: "Tuyen Quang" },
      { code: "lao-cai", name: "Lao Cai" },
      { code: "dien-bien", name: "Dien Bien" },
      { code: "lai-chau", name: "Lai Chau" },
      { code: "son-la", name: "Son La" },
      { code: "yen-bai", name: "Yen Bai" },
      { code: "hoa-binh", name: "Hoa Binh" },
      { code: "thai-nguyen", name: "Thai Nguyen" },
      { code: "lang-son", name: "Lang Son" },
      { code: "quang-ninh", name: "Quang Ninh" },
      { code: "bac-giang", name: "Bac Giang" },
      { code: "phu-tho", name: "Phu Tho" },
      { code: "vinh-phuc", name: "Vinh Phuc" },
      { code: "bac-ninh", name: "Bac Ninh" },
      { code: "hai-duong", name: "Hai Duong" },
      { code: "hung-yen", name: "Hung Yen" },
      { code: "thai-binh", name: "Thai Binh" },
      { code: "ha-nam", name: "Ha Nam" },
      { code: "nam-dinh", name: "Nam Dinh" },
      { code: "ninh-binh", name: "Ninh Binh" },
      
      // Central Provinces
      { code: "thanh-hoa", name: "Thanh Hoa" },
      { code: "nghe-an", name: "Nghe An" },
      { code: "ha-tinh", name: "Ha Tinh" },
      { code: "quang-binh", name: "Quang Binh" },
      { code: "quang-tri", name: "Quang Tri" },
      { code: "thua-thien-hue", name: "Thua Thien Hue" },
      { code: "quang-nam", name: "Quang Nam" },
      { code: "quang-ngai", name: "Quang Ngai" },
      { code: "binh-dinh", name: "Binh Dinh" },
      { code: "phu-yen", name: "Phu Yen" },
      { code: "khanh-hoa", name: "Khanh Hoa" },
      { code: "ninh-thuan", name: "Ninh Thuan" },
      { code: "binh-thuan", name: "Binh Thuan" },
      { code: "kon-tum", name: "Kon Tum" },
      { code: "gia-lai", name: "Gia Lai" },
      { code: "dak-lak", name: "Dak Lak" },
      { code: "dak-nong", name: "Dak Nong" },
      { code: "lam-dong", name: "Lam Dong" },
      
      // Southern Provinces
      { code: "binh-phuoc", name: "Binh Phuoc" },
      { code: "tay-ninh", name: "Tay Ninh" },
      { code: "binh-duong", name: "Binh Duong" },
      { code: "dong-nai", name: "Dong Nai" },
      { code: "ba-ria-vung-tau", name: "Ba Ria - Vung Tau" },
      { code: "long-an", name: "Long An" },
      { code: "tien-giang", name: "Tien Giang" },
      { code: "ben-tre", name: "Ben Tre" },
      { code: "tra-vinh", name: "Tra Vinh" },
      { code: "vinh-long", name: "Vinh Long" },
      { code: "dong-thap", name: "Dong Thap" },
      { code: "an-giang", name: "An Giang" },
      { code: "kien-giang", name: "Kien Giang" },
      { code: "ca-mau", name: "Ca Mau" },
      { code: "bac-lieu", name: "Bac Lieu" },
      { code: "soc-trang", name: "Soc Trang" },
      { code: "hau-giang", name: "Hau Giang" }
    ]
  },
  {
    code: "us",
    name: "United States",
    provinces: [
      { code: "al", name: "Alabama" },
      { code: "ak", name: "Alaska" },
      { code: "az", name: "Arizona" },
      { code: "ar", name: "Arkansas" },
      { code: "ca", name: "California" },
      { code: "co", name: "Colorado" },
      { code: "ct", name: "Connecticut" },
      { code: "de", name: "Delaware" },
      { code: "dc", name: "District of Columbia" },
      { code: "fl", name: "Florida" },
      { code: "ga", name: "Georgia" },
      { code: "hi", name: "Hawaii" },
      { code: "id", name: "Idaho" },
      { code: "il", name: "Illinois" },
      { code: "in", name: "Indiana" },
      { code: "ia", name: "Iowa" },
      { code: "ks", name: "Kansas" },
      { code: "ky", name: "Kentucky" },
      { code: "la", name: "Louisiana" },
      { code: "me", name: "Maine" },
      { code: "md", name: "Maryland" },
      { code: "ma", name: "Massachusetts" },
      { code: "mi", name: "Michigan" },
      { code: "mn", name: "Minnesota" },
      { code: "ms", name: "Mississippi" },
      { code: "mo", name: "Missouri" },
      { code: "mt", name: "Montana" },
      { code: "ne", name: "Nebraska" },
      { code: "nv", name: "Nevada" },
      { code: "nh", name: "New Hampshire" },
      { code: "nj", name: "New Jersey" },
      { code: "nm", name: "New Mexico" },
      { code: "ny", name: "New York" },
      { code: "nc", name: "North Carolina" },
      { code: "nd", name: "North Dakota" },
      { code: "oh", name: "Ohio" },
      { code: "ok", name: "Oklahoma" },
      { code: "or", name: "Oregon" },
      { code: "pa", name: "Pennsylvania" },
      { code: "ri", name: "Rhode Island" },
      { code: "sc", name: "South Carolina" },
      { code: "sd", name: "South Dakota" },
      { code: "tn", name: "Tennessee" },
      { code: "tx", name: "Texas" },
      { code: "ut", name: "Utah" },
      { code: "vt", name: "Vermont" },
      { code: "va", name: "Virginia" },
      { code: "wa", name: "Washington" },
      { code: "wv", name: "West Virginia" },
      { code: "wi", name: "Wisconsin" },
      { code: "wy", name: "Wyoming" }
    ]
  },
  {
    code: "uk",
    name: "United Kingdom",
    provinces: [
      // England - Counties
      { code: "bedfordshire", name: "Bedfordshire" },
      { code: "berkshire", name: "Berkshire" },
      { code: "bristol", name: "Bristol" },
      { code: "buckinghamshire", name: "Buckinghamshire" },
      { code: "cambridgeshire", name: "Cambridgeshire" },
      { code: "cheshire", name: "Cheshire" },
      { code: "cornwall", name: "Cornwall" },
      { code: "cumbria", name: "Cumbria" },
      { code: "derbyshire", name: "Derbyshire" },
      { code: "devon", name: "Devon" },
      { code: "dorset", name: "Dorset" },
      { code: "durham", name: "Durham" },
      { code: "east-riding-yorkshire", name: "East Riding of Yorkshire" },
      { code: "east-sussex", name: "East Sussex" },
      { code: "essex", name: "Essex" },
      { code: "gloucestershire", name: "Gloucestershire" },
      { code: "greater-london", name: "Greater London" },
      { code: "greater-manchester", name: "Greater Manchester" },
      { code: "hampshire", name: "Hampshire" },
      { code: "herefordshire", name: "Herefordshire" },
      { code: "hertfordshire", name: "Hertfordshire" },
      { code: "isle-of-wight", name: "Isle of Wight" },
      { code: "kent", name: "Kent" },
      { code: "lancashire", name: "Lancashire" },
      { code: "leicestershire", name: "Leicestershire" },
      { code: "lincolnshire", name: "Lincolnshire" },
      { code: "merseyside", name: "Merseyside" },
      { code: "norfolk", name: "Norfolk" },
      { code: "north-yorkshire", name: "North Yorkshire" },
      { code: "northamptonshire", name: "Northamptonshire" },
      { code: "northumberland", name: "Northumberland" },
      { code: "nottinghamshire", name: "Nottinghamshire" },
      { code: "oxfordshire", name: "Oxfordshire" },
      { code: "rutland", name: "Rutland" },
      { code: "shropshire", name: "Shropshire" },
      { code: "somerset", name: "Somerset" },
      { code: "south-yorkshire", name: "South Yorkshire" },
      { code: "staffordshire", name: "Staffordshire" },
      { code: "suffolk", name: "Suffolk" },
      { code: "surrey", name: "Surrey" },
      { code: "tyne-and-wear", name: "Tyne and Wear" },
      { code: "warwickshire", name: "Warwickshire" },
      { code: "west-midlands", name: "West Midlands" },
      { code: "west-sussex", name: "West Sussex" },
      { code: "west-yorkshire", name: "West Yorkshire" },
      { code: "wiltshire", name: "Wiltshire" },
      { code: "worcestershire", name: "Worcestershire" },
      
      // Scotland - Council Areas
      { code: "aberdeen-city", name: "Aberdeen City" },
      { code: "aberdeenshire", name: "Aberdeenshire" },
      { code: "angus", name: "Angus" },
      { code: "argyll-and-bute", name: "Argyll and Bute" },
      { code: "clackmannanshire", name: "Clackmannanshire" },
      { code: "dumfries-and-galloway", name: "Dumfries and Galloway" },
      { code: "dundee-city", name: "Dundee City" },
      { code: "east-ayrshire", name: "East Ayrshire" },
      { code: "east-dunbartonshire", name: "East Dunbartonshire" },
      { code: "east-lothian", name: "East Lothian" },
      { code: "east-renfrewshire", name: "East Renfrewshire" },
      { code: "city-of-edinburgh", name: "City of Edinburgh" },
      { code: "eilean-siar", name: "Eilean Siar" },
      { code: "falkirk", name: "Falkirk" },
      { code: "fife", name: "Fife" },
      { code: "glasgow-city", name: "Glasgow City" },
      { code: "highland", name: "Highland" },
      { code: "inverclyde", name: "Inverclyde" },
      { code: "midlothian", name: "Midlothian" },
      { code: "moray", name: "Moray" },
      { code: "north-ayrshire", name: "North Ayrshire" },
      { code: "north-lanarkshire", name: "North Lanarkshire" },
      { code: "orkney-islands", name: "Orkney Islands" },
      { code: "perth-and-kinross", name: "Perth and Kinross" },
      { code: "renfrewshire", name: "Renfrewshire" },
      { code: "scottish-borders", name: "Scottish Borders" },
      { code: "shetland-islands", name: "Shetland Islands" },
      { code: "south-ayrshire", name: "South Ayrshire" },
      { code: "south-lanarkshire", name: "South Lanarkshire" },
      { code: "stirling", name: "Stirling" },
      { code: "west-dunbartonshire", name: "West Dunbartonshire" },
      { code: "west-lothian", name: "West Lothian" },
      
      // Wales - Principal Areas
      { code: "anglesey", name: "Anglesey" },
      { code: "blaenau-gwent", name: "Blaenau Gwent" },
      { code: "bridgend", name: "Bridgend" },
      { code: "caerphilly", name: "Caerphilly" },
      { code: "cardiff", name: "Cardiff" },
      { code: "carmarthenshire", name: "Carmarthenshire" },
      { code: "ceredigion", name: "Ceredigion" },
      { code: "conwy", name: "Conwy" },
      { code: "denbighshire", name: "Denbighshire" },
      { code: "flintshire", name: "Flintshire" },
      { code: "gwynedd", name: "Gwynedd" },
      { code: "merthyr-tydfil", name: "Merthyr Tydfil" },
      { code: "monmouthshire", name: "Monmouthshire" },
      { code: "neath-port-talbot", name: "Neath Port Talbot" },
      { code: "newport", name: "Newport" },
      { code: "pembrokeshire", name: "Pembrokeshire" },
      { code: "powys", name: "Powys" },
      { code: "rhondda-cynon-taf", name: "Rhondda Cynon Taf" },
      { code: "swansea", name: "Swansea" },
      { code: "torfaen", name: "Torfaen" },
      { code: "vale-of-glamorgan", name: "Vale of Glamorgan" },
      { code: "wrexham", name: "Wrexham" },
      
      // Northern Ireland - Districts
      { code: "antrim-and-newtownabbey", name: "Antrim and Newtownabbey" },
      { code: "ards-and-north-down", name: "Ards and North Down" },
      { code: "armagh-banbridge-craigavon", name: "Armagh, Banbridge and Craigavon" },
      { code: "belfast", name: "Belfast" },
      { code: "causeway-coast-glens", name: "Causeway Coast and Glens" },
      { code: "derry-strabane", name: "Derry and Strabane" },
      { code: "fermanagh-omagh", name: "Fermanagh and Omagh" },
      { code: "lisburn-castlereagh", name: "Lisburn and Castlereagh" },
      { code: "mid-and-east-antrim", name: "Mid and East Antrim" },
      { code: "mid-ulster", name: "Mid Ulster" },
      { code: "newry-mourne-down", name: "Newry, Mourne and Down" }
    ]
  },
  {
    code: "jp",
    name: "Japan",
    provinces: [
      // Hokkaido Region
      { code: "hokkaido", name: "Hokkaido" },
      
      // Tohoku Region
      { code: "aomori", name: "Aomori" },
      { code: "iwate", name: "Iwate" },
      { code: "miyagi", name: "Miyagi" },
      { code: "akita", name: "Akita" },
      { code: "yamagata", name: "Yamagata" },
      { code: "fukushima", name: "Fukushima" },
      
      // Kanto Region
      { code: "ibaraki", name: "Ibaraki" },
      { code: "tochigi", name: "Tochigi" },
      { code: "gunma", name: "Gunma" },
      { code: "saitama", name: "Saitama" },
      { code: "chiba", name: "Chiba" },
      { code: "tokyo", name: "Tokyo" },
      { code: "kanagawa", name: "Kanagawa" },
      
      // Chubu Region
      { code: "niigata", name: "Niigata" },
      { code: "toyama", name: "Toyama" },
      { code: "ishikawa", name: "Ishikawa" },
      { code: "fukui", name: "Fukui" },
      { code: "yamanashi", name: "Yamanashi" },
      { code: "nagano", name: "Nagano" },
      { code: "gifu", name: "Gifu" },
      { code: "shizuoka", name: "Shizuoka" },
      { code: "aichi", name: "Aichi" },
      
      // Kansai Region
      { code: "mie", name: "Mie" },
      { code: "shiga", name: "Shiga" },
      { code: "kyoto", name: "Kyoto" },
      { code: "osaka", name: "Osaka" },
      { code: "hyogo", name: "Hyogo" },
      { code: "nara", name: "Nara" },
      { code: "wakayama", name: "Wakayama" },
      
      // Chugoku Region
      { code: "tottori", name: "Tottori" },
      { code: "shimane", name: "Shimane" },
      { code: "okayama", name: "Okayama" },
      { code: "hiroshima", name: "Hiroshima" },
      { code: "yamaguchi", name: "Yamaguchi" },
      
      // Shikoku Region
      { code: "tokushima", name: "Tokushima" },
      { code: "kagawa", name: "Kagawa" },
      { code: "ehime", name: "Ehime" },
      { code: "kochi", name: "Kochi" },
      
      // Kyushu Region
      { code: "fukuoka", name: "Fukuoka" },
      { code: "saga", name: "Saga" },
      { code: "nagasaki", name: "Nagasaki" },
      { code: "kumamoto", name: "Kumamoto" },
      { code: "oita", name: "Oita" },
      { code: "miyazaki", name: "Miyazaki" },
      { code: "kagoshima", name: "Kagoshima" },
      { code: "okinawa", name: "Okinawa" }
    ]
  },
  {
    code: "au",
    name: "Australia",
    provinces: [
      // States
      { code: "nsw", name: "New South Wales" },
      { code: "vic", name: "Victoria" },
      { code: "qld", name: "Queensland" },
      { code: "wa", name: "Western Australia" },
      { code: "sa", name: "South Australia" },
      { code: "tas", name: "Tasmania" },
      
      // Territories
      { code: "act", name: "Australian Capital Territory" },
      { code: "nt", name: "Northern Territory" }
    ]
  }
];

// Helper function to find provinces by country code
export const getProvincesByCountry = (countryCode: string): Province[] => {
  const country = countries.find(c => c.code === countryCode);
  return country ? country.provinces : [];
};

// Helper function to get country by code
export const getCountryByCode = (countryCode: string): Country | null => {
  return countries.find(c => c.code === countryCode) || null;
};