/**
 * Countries data for mobile app
 * Contains country codes, phone codes, timezones, and flag emojis
 */

export interface Country {
  code: string;
  name: string;
  phoneCode: string;
  timezone: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', phoneCode: '+1', timezone: 'America/New_York', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', phoneCode: '+1', timezone: 'America/Toronto', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44', timezone: 'Europe/London', flag: '🇬🇧' },
  { code: 'FR', name: 'France', phoneCode: '+33', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', phoneCode: '+49', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', phoneCode: '+39', timezone: 'Europe/Rome', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', phoneCode: '+34', timezone: 'Europe/Madrid', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', phoneCode: '+31', timezone: 'Europe/Amsterdam', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', phoneCode: '+32', timezone: 'Europe/Brussels', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', phoneCode: '+41', timezone: 'Europe/Zurich', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', phoneCode: '+43', timezone: 'Europe/Vienna', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', phoneCode: '+46', timezone: 'Europe/Stockholm', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', phoneCode: '+47', timezone: 'Europe/Oslo', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', phoneCode: '+45', timezone: 'Europe/Copenhagen', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', phoneCode: '+358', timezone: 'Europe/Helsinki', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', phoneCode: '+48', timezone: 'Europe/Warsaw', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', phoneCode: '+420', timezone: 'Europe/Prague', flag: '🇨🇿' },
  { code: 'PT', name: 'Portugal', phoneCode: '+351', timezone: 'Europe/Lisbon', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', phoneCode: '+30', timezone: 'Europe/Athens', flag: '🇬🇷' },
  { code: 'IE', name: 'Ireland', phoneCode: '+353', timezone: 'Europe/Dublin', flag: '🇮🇪' },
  { code: 'AU', name: 'Australia', phoneCode: '+61', timezone: 'Australia/Sydney', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', phoneCode: '+64', timezone: 'Pacific/Auckland', flag: '🇳🇿' },
  { code: 'JP', name: 'Japan', phoneCode: '+81', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { code: 'CN', name: 'China', phoneCode: '+86', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
  { code: 'IN', name: 'India', phoneCode: '+91', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
  { code: 'KR', name: 'South Korea', phoneCode: '+82', timezone: 'Asia/Seoul', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', phoneCode: '+65', timezone: 'Asia/Singapore', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', phoneCode: '+852', timezone: 'Asia/Hong_Kong', flag: '🇭🇰' },
  { code: 'MY', name: 'Malaysia', phoneCode: '+60', timezone: 'Asia/Kuala_Lumpur', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', phoneCode: '+66', timezone: 'Asia/Bangkok', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', phoneCode: '+63', timezone: 'Asia/Manila', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', phoneCode: '+62', timezone: 'Asia/Jakarta', flag: '🇮🇩' },
  { code: 'VN', name: 'Vietnam', phoneCode: '+84', timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { code: 'AE', name: 'United Arab Emirates', phoneCode: '+971', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', phoneCode: '+966', timezone: 'Asia/Riyadh', flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', phoneCode: '+972', timezone: 'Asia/Jerusalem', flag: '🇮🇱' },
  { code: 'TR', name: 'Turkey', phoneCode: '+90', timezone: 'Europe/Istanbul', flag: '🇹🇷' },
  { code: 'ZA', name: 'South Africa', phoneCode: '+27', timezone: 'Africa/Johannesburg', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', phoneCode: '+20', timezone: 'Africa/Cairo', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', phoneCode: '+234', timezone: 'Africa/Lagos', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', phoneCode: '+254', timezone: 'Africa/Nairobi', flag: '🇰🇪' },
  { code: 'MX', name: 'Mexico', phoneCode: '+52', timezone: 'America/Mexico_City', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', phoneCode: '+55', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', phoneCode: '+54', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', phoneCode: '+56', timezone: 'America/Santiago', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', phoneCode: '+57', timezone: 'America/Bogota', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', phoneCode: '+51', timezone: 'America/Lima', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', phoneCode: '+58', timezone: 'America/Caracas', flag: '🇻🇪' },
  { code: 'RU', name: 'Russia', phoneCode: '+7', timezone: 'Europe/Moscow', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', phoneCode: '+380', timezone: 'Europe/Kiev', flag: '🇺🇦' },
  { code: 'RO', name: 'Romania', phoneCode: '+40', timezone: 'Europe/Bucharest', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary', phoneCode: '+36', timezone: 'Europe/Budapest', flag: '🇭🇺' },
  { code: 'BG', name: 'Bulgaria', phoneCode: '+359', timezone: 'Europe/Sofia', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', phoneCode: '+385', timezone: 'Europe/Zagreb', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovenia', phoneCode: '+386', timezone: 'Europe/Ljubljana', flag: '🇸🇮' },
  { code: 'SK', name: 'Slovakia', phoneCode: '+421', timezone: 'Europe/Bratislava', flag: '🇸🇰' },
  { code: 'LT', name: 'Lithuania', phoneCode: '+370', timezone: 'Europe/Vilnius', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', phoneCode: '+371', timezone: 'Europe/Riga', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', phoneCode: '+372', timezone: 'Europe/Tallinn', flag: '🇪🇪' },
  { code: 'IS', name: 'Iceland', phoneCode: '+354', timezone: 'Atlantic/Reykjavik', flag: '🇮🇸' },
  { code: 'LU', name: 'Luxembourg', phoneCode: '+352', timezone: 'Europe/Luxembourg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', phoneCode: '+356', timezone: 'Europe/Malta', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', phoneCode: '+357', timezone: 'Asia/Nicosia', flag: '🇨🇾' },
  { code: 'PK', name: 'Pakistan', phoneCode: '+92', timezone: 'Asia/Karachi', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', phoneCode: '+880', timezone: 'Asia/Dhaka', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', phoneCode: '+94', timezone: 'Asia/Colombo', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', phoneCode: '+977', timezone: 'Asia/Kathmandu', flag: '🇳🇵' },
  { code: 'MM', name: 'Myanmar', phoneCode: '+95', timezone: 'Asia/Yangon', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', phoneCode: '+855', timezone: 'Asia/Phnom_Penh', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', phoneCode: '+856', timezone: 'Asia/Vientiane', flag: '🇱🇦' },
  { code: 'BN', name: 'Brunei', phoneCode: '+673', timezone: 'Asia/Brunei', flag: '🇧🇳' },
  { code: 'TW', name: 'Taiwan', phoneCode: '+886', timezone: 'Asia/Taipei', flag: '🇹🇼' },
  { code: 'MO', name: 'Macau', phoneCode: '+853', timezone: 'Asia/Macau', flag: '🇲🇴' },
  { code: 'KZ', name: 'Kazakhstan', phoneCode: '+7', timezone: 'Asia/Almaty', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', phoneCode: '+998', timezone: 'Asia/Tashkent', flag: '🇺🇿' },
  { code: 'GE', name: 'Georgia', phoneCode: '+995', timezone: 'Asia/Tbilisi', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', phoneCode: '+374', timezone: 'Asia/Yerevan', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', phoneCode: '+994', timezone: 'Asia/Baku', flag: '🇦🇿' },
  { code: 'IQ', name: 'Iraq', phoneCode: '+964', timezone: 'Asia/Baghdad', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', phoneCode: '+98', timezone: 'Asia/Tehran', flag: '🇮🇷' },
  { code: 'JO', name: 'Jordan', phoneCode: '+962', timezone: 'Asia/Amman', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', phoneCode: '+961', timezone: 'Asia/Beirut', flag: '🇱🇧' },
  { code: 'SY', name: 'Syria', phoneCode: '+963', timezone: 'Asia/Damascus', flag: '🇸🇾' },
  { code: 'YE', name: 'Yemen', phoneCode: '+967', timezone: 'Asia/Aden', flag: '🇾🇪' },
  { code: 'OM', name: 'Oman', phoneCode: '+968', timezone: 'Asia/Muscat', flag: '🇴🇲' },
  { code: 'KW', name: 'Kuwait', phoneCode: '+965', timezone: 'Asia/Kuwait', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', phoneCode: '+973', timezone: 'Asia/Bahrain', flag: '🇧🇭' },
  { code: 'QA', name: 'Qatar', phoneCode: '+974', timezone: 'Asia/Qatar', flag: '🇶🇦' },
  { code: 'ET', name: 'Ethiopia', phoneCode: '+251', timezone: 'Africa/Addis_Ababa', flag: '🇪🇹' },
  { code: 'GH', name: 'Ghana', phoneCode: '+233', timezone: 'Africa/Accra', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', phoneCode: '+255', timezone: 'Africa/Dar_es_Salaam', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', phoneCode: '+256', timezone: 'Africa/Kampala', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', phoneCode: '+250', timezone: 'Africa/Kigali', flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal', phoneCode: '+221', timezone: 'Africa/Dakar', flag: '🇸🇳' },
  { code: 'CI', name: 'Ivory Coast', phoneCode: '+225', timezone: 'Africa/Abidjan', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', phoneCode: '+237', timezone: 'Africa/Douala', flag: '🇨🇲' },
  { code: 'ZM', name: 'Zambia', phoneCode: '+260', timezone: 'Africa/Lusaka', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', phoneCode: '+263', timezone: 'Africa/Harare', flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', phoneCode: '+267', timezone: 'Africa/Gaborone', flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia', phoneCode: '+264', timezone: 'Africa/Windhoek', flag: '🇳🇦' },
  { code: 'MZ', name: 'Mozambique', phoneCode: '+258', timezone: 'Africa/Maputo', flag: '🇲🇿' },
  { code: 'AO', name: 'Angola', phoneCode: '+244', timezone: 'Africa/Luanda', flag: '🇦🇴' },
  { code: 'MA', name: 'Morocco', phoneCode: '+212', timezone: 'Africa/Casablanca', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', phoneCode: '+216', timezone: 'Africa/Tunis', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', phoneCode: '+213', timezone: 'Africa/Algiers', flag: '🇩🇿' },
  { code: 'LY', name: 'Libya', phoneCode: '+218', timezone: 'Africa/Tripoli', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudan', phoneCode: '+249', timezone: 'Africa/Khartoum', flag: '🇸🇩' },
  { code: 'CR', name: 'Costa Rica', phoneCode: '+506', timezone: 'America/Costa_Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', phoneCode: '+507', timezone: 'America/Panama', flag: '🇵🇦' },
  { code: 'GT', name: 'Guatemala', phoneCode: '+502', timezone: 'America/Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', phoneCode: '+504', timezone: 'America/Tegucigalpa', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', phoneCode: '+503', timezone: 'America/El_Salvador', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', phoneCode: '+505', timezone: 'America/Managua', flag: '🇳🇮' },
  { code: 'BZ', name: 'Belize', phoneCode: '+501', timezone: 'America/Belize', flag: '🇧🇿' },
  { code: 'JM', name: 'Jamaica', phoneCode: '+1876', timezone: 'America/Jamaica', flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad and Tobago', phoneCode: '+1868', timezone: 'America/Port_of_Spain', flag: '🇹🇹' },
  { code: 'BS', name: 'Bahamas', phoneCode: '+1242', timezone: 'America/Nassau', flag: '🇧🇸' },
  { code: 'BB', name: 'Barbados', phoneCode: '+1246', timezone: 'America/Barbados', flag: '🇧🇧' },
  { code: 'DO', name: 'Dominican Republic', phoneCode: '+1809', timezone: 'America/Santo_Domingo', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba', phoneCode: '+53', timezone: 'America/Havana', flag: '🇨🇺' },
  { code: 'HT', name: 'Haiti', phoneCode: '+509', timezone: 'America/Port-au-Prince', flag: '🇭🇹' },
  { code: 'PR', name: 'Puerto Rico', phoneCode: '+1787', timezone: 'America/Puerto_Rico', flag: '🇵🇷' },
  { code: 'EC', name: 'Ecuador', phoneCode: '+593', timezone: 'America/Guayaquil', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', phoneCode: '+591', timezone: 'America/La_Paz', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', phoneCode: '+595', timezone: 'America/Asuncion', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', phoneCode: '+598', timezone: 'America/Montevideo', flag: '🇺🇾' },
  { code: 'SR', name: 'Suriname', phoneCode: '+597', timezone: 'America/Paramaribo', flag: '🇸🇷' },
  { code: 'GY', name: 'Guyana', phoneCode: '+592', timezone: 'America/Guyana', flag: '🇬🇾' },
  { code: 'FJ', name: 'Fiji', phoneCode: '+679', timezone: 'Pacific/Fiji', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', phoneCode: '+675', timezone: 'Pacific/Port_Moresby', flag: '🇵🇬' },
  { code: 'NC', name: 'New Caledonia', phoneCode: '+687', timezone: 'Pacific/Noumea', flag: '🇳🇨' },
  { code: 'PF', name: 'French Polynesia', phoneCode: '+689', timezone: 'Pacific/Tahiti', flag: '🇵🇫' },
  { code: 'WS', name: 'Samoa', phoneCode: '+685', timezone: 'Pacific/Apia', flag: '🇼🇸' },
  { code: 'TO', name: 'Tonga', phoneCode: '+676', timezone: 'Pacific/Tongatapu', flag: '🇹🇴' },
  { code: 'VU', name: 'Vanuatu', phoneCode: '+678', timezone: 'Pacific/Efate', flag: '🇻🇺' },
  { code: 'SB', name: 'Solomon Islands', phoneCode: '+677', timezone: 'Pacific/Guadalcanal', flag: '🇸🇧' },
  { code: 'KI', name: 'Kiribati', phoneCode: '+686', timezone: 'Pacific/Tarawa', flag: '🇰🇮' },
  { code: 'MV', name: 'Maldives', phoneCode: '+960', timezone: 'Indian/Maldives', flag: '🇲🇻' },
  { code: 'MU', name: 'Mauritius', phoneCode: '+230', timezone: 'Indian/Mauritius', flag: '🇲🇺' },
  { code: 'SC', name: 'Seychelles', phoneCode: '+248', timezone: 'Indian/Mahe', flag: '🇸🇨' },
  { code: 'RE', name: 'Réunion', phoneCode: '+262', timezone: 'Indian/Reunion', flag: '🇷🇪' },
  { code: 'MG', name: 'Madagascar', phoneCode: '+261', timezone: 'Indian/Antananarivo', flag: '🇲🇬' },
  { code: 'CD', name: 'Congo (DRC)', phoneCode: '+243', timezone: 'Africa/Kinshasa', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo (Republic)', phoneCode: '+242', timezone: 'Africa/Brazzaville', flag: '🇨🇬' },
  { code: 'GA', name: 'Gabon', phoneCode: '+241', timezone: 'Africa/Libreville', flag: '🇬🇦' },
  { code: 'GQ', name: 'Equatorial Guinea', phoneCode: '+240', timezone: 'Africa/Malabo', flag: '🇬🇶' },
  { code: 'TD', name: 'Chad', phoneCode: '+235', timezone: 'Africa/Ndjamena', flag: '🇹🇩' },
  { code: 'CF', name: 'Central African Republic', phoneCode: '+236', timezone: 'Africa/Bangui', flag: '🇨🇫' },
  { code: 'ML', name: 'Mali', phoneCode: '+223', timezone: 'Africa/Bamako', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', phoneCode: '+226', timezone: 'Africa/Ouagadougou', flag: '🇧🇫' },
  { code: 'NE', name: 'Niger', phoneCode: '+227', timezone: 'Africa/Niamey', flag: '🇳🇪' },
  { code: 'TG', name: 'Togo', phoneCode: '+228', timezone: 'Africa/Lome', flag: '🇹🇬' },
  { code: 'BJ', name: 'Benin', phoneCode: '+229', timezone: 'Africa/Porto-Novo', flag: '🇧🇯' },
  { code: 'MR', name: 'Mauritania', phoneCode: '+222', timezone: 'Africa/Nouakchott', flag: '🇲🇷' },
  { code: 'GM', name: 'Gambia', phoneCode: '+220', timezone: 'Africa/Banjul', flag: '🇬🇲' },
  { code: 'GW', name: 'Guinea-Bissau', phoneCode: '+245', timezone: 'Africa/Bissau', flag: '🇬🇼' },
  { code: 'GN', name: 'Guinea', phoneCode: '+224', timezone: 'Africa/Conakry', flag: '🇬🇳' },
  { code: 'SL', name: 'Sierra Leone', phoneCode: '+232', timezone: 'Africa/Freetown', flag: '🇸🇱' },
  { code: 'LR', name: 'Liberia', phoneCode: '+231', timezone: 'Africa/Monrovia', flag: '🇱🇷' },
  { code: 'SO', name: 'Somalia', phoneCode: '+252', timezone: 'Africa/Mogadishu', flag: '🇸🇴' },
  { code: 'DJ', name: 'Djibouti', phoneCode: '+253', timezone: 'Africa/Djibouti', flag: '🇩🇯' },
  { code: 'ER', name: 'Eritrea', phoneCode: '+291', timezone: 'Africa/Asmara', flag: '🇪🇷' },
  { code: 'BI', name: 'Burundi', phoneCode: '+257', timezone: 'Africa/Bujumbura', flag: '🇧🇮' },
  { code: 'MW', name: 'Malawi', phoneCode: '+265', timezone: 'Africa/Blantyre', flag: '🇲🇼' },
  { code: 'SZ', name: 'Eswatini', phoneCode: '+268', timezone: 'Africa/Mbabane', flag: '🇸🇿' },
  { code: 'LS', name: 'Lesotho', phoneCode: '+266', timezone: 'Africa/Maseru', flag: '🇱🇸' },
  { code: 'KM', name: 'Comoros', phoneCode: '+269', timezone: 'Indian/Comoro', flag: '🇰🇲' },
  { code: 'CV', name: 'Cape Verde', phoneCode: '+238', timezone: 'Atlantic/Cape_Verde', flag: '🇨🇻' },
  { code: 'ST', name: 'São Tomé and Príncipe', phoneCode: '+239', timezone: 'Africa/Sao_Tome', flag: '🇸🇹' },
  { code: 'AD', name: 'Andorra', phoneCode: '+376', timezone: 'Europe/Andorra', flag: '🇦🇩' },
  { code: 'MC', name: 'Monaco', phoneCode: '+377', timezone: 'Europe/Monaco', flag: '🇲🇨' },
  { code: 'SM', name: 'San Marino', phoneCode: '+378', timezone: 'Europe/San_Marino', flag: '🇸🇲' },
  { code: 'VA', name: 'Vatican City', phoneCode: '+39', timezone: 'Europe/Vatican', flag: '🇻🇦' },
  { code: 'LI', name: 'Liechtenstein', phoneCode: '+423', timezone: 'Europe/Vaduz', flag: '🇱🇮' },
  { code: 'AL', name: 'Albania', phoneCode: '+355', timezone: 'Europe/Tirane', flag: '🇦🇱' },
  { code: 'MK', name: 'North Macedonia', phoneCode: '+389', timezone: 'Europe/Skopje', flag: '🇲🇰' },
  { code: 'RS', name: 'Serbia', phoneCode: '+381', timezone: 'Europe/Belgrade', flag: '🇷🇸' },
  { code: 'ME', name: 'Montenegro', phoneCode: '+382', timezone: 'Europe/Podgorica', flag: '🇲🇪' },
  { code: 'BA', name: 'Bosnia and Herzegovina', phoneCode: '+387', timezone: 'Europe/Sarajevo', flag: '🇧🇦' },
  { code: 'XK', name: 'Kosovo', phoneCode: '+383', timezone: 'Europe/Belgrade', flag: '🇽🇰' },
  { code: 'BY', name: 'Belarus', phoneCode: '+375', timezone: 'Europe/Minsk', flag: '🇧🇾' },
  { code: 'MD', name: 'Moldova', phoneCode: '+373', timezone: 'Europe/Chisinau', flag: '🇲🇩' },
  { code: 'MN', name: 'Mongolia', phoneCode: '+976', timezone: 'Asia/Ulaanbaatar', flag: '🇲🇳' },
  { code: 'KG', name: 'Kyrgyzstan', phoneCode: '+996', timezone: 'Asia/Bishkek', flag: '🇰🇬' },
  { code: 'TJ', name: 'Tajikistan', phoneCode: '+992', timezone: 'Asia/Dushanbe', flag: '🇹🇯' },
  { code: 'TM', name: 'Turkmenistan', phoneCode: '+993', timezone: 'Asia/Ashgabat', flag: '🇹🇲' },
  { code: 'AF', name: 'Afghanistan', phoneCode: '+93', timezone: 'Asia/Kabul', flag: '🇦🇫' },
  { code: 'BT', name: 'Bhutan', phoneCode: '+975', timezone: 'Asia/Thimphu', flag: '🇧🇹' },
  { code: 'TL', name: 'Timor-Leste', phoneCode: '+670', timezone: 'Asia/Dili', flag: '🇹🇱' },
  { code: 'GL', name: 'Greenland', phoneCode: '+299', timezone: 'America/Godthab', flag: '🇬🇱' },
  { code: 'FO', name: 'Faroe Islands', phoneCode: '+298', timezone: 'Atlantic/Faroe', flag: '🇫🇴' },
  { code: 'GI', name: 'Gibraltar', phoneCode: '+350', timezone: 'Europe/Gibraltar', flag: '🇬🇮' },
  { code: 'IM', name: 'Isle of Man', phoneCode: '+44', timezone: 'Europe/Isle_of_Man', flag: '🇮🇲' },
  { code: 'JE', name: 'Jersey', phoneCode: '+44', timezone: 'Europe/Jersey', flag: '🇯🇪' },
  { code: 'GG', name: 'Guernsey', phoneCode: '+44', timezone: 'Europe/Guernsey', flag: '🇬🇬' },
  { code: 'AX', name: 'Åland Islands', phoneCode: '+358', timezone: 'Europe/Mariehamn', flag: '🇦🇽' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', phoneCode: '+47', timezone: 'Arctic/Longyearbyen', flag: '🇸🇯' },
  { code: 'BM', name: 'Bermuda', phoneCode: '+1441', timezone: 'Atlantic/Bermuda', flag: '🇧🇲' },
  { code: 'KY', name: 'Cayman Islands', phoneCode: '+1345', timezone: 'America/Cayman', flag: '🇰🇾' },
  { code: 'TC', name: 'Turks and Caicos Islands', phoneCode: '+1649', timezone: 'America/Grand_Turk', flag: '🇹🇨' },
  { code: 'VG', name: 'British Virgin Islands', phoneCode: '+1284', timezone: 'America/Tortola', flag: '🇻🇬' },
  { code: 'VI', name: 'U.S. Virgin Islands', phoneCode: '+1340', timezone: 'America/St_Thomas', flag: '🇻🇮' },
  { code: 'AS', name: 'American Samoa', phoneCode: '+1684', timezone: 'Pacific/Pago_Pago', flag: '🇦🇸' },
  { code: 'GU', name: 'Guam', phoneCode: '+1671', timezone: 'Pacific/Guam', flag: '🇬🇺' },
  { code: 'MP', name: 'Northern Mariana Islands', phoneCode: '+1670', timezone: 'Pacific/Saipan', flag: '🇲🇵' },
  { code: 'FM', name: 'Micronesia', phoneCode: '+691', timezone: 'Pacific/Pohnpei', flag: '🇫🇲' },
  { code: 'MH', name: 'Marshall Islands', phoneCode: '+692', timezone: 'Pacific/Majuro', flag: '🇲🇭' },
  { code: 'PW', name: 'Palau', phoneCode: '+680', timezone: 'Pacific/Palau', flag: '🇵🇼' },
  { code: 'CK', name: 'Cook Islands', phoneCode: '+682', timezone: 'Pacific/Rarotonga', flag: '🇨🇰' },
  { code: 'NU', name: 'Niue', phoneCode: '+683', timezone: 'Pacific/Niue', flag: '🇳🇺' },
  { code: 'TK', name: 'Tokelau', phoneCode: '+690', timezone: 'Pacific/Fakaofo', flag: '🇹🇰' },
  { code: 'TV', name: 'Tuvalu', phoneCode: '+688', timezone: 'Pacific/Funafuti', flag: '🇹🇻' },
  { code: 'NR', name: 'Nauru', phoneCode: '+674', timezone: 'Pacific/Nauru', flag: '🇳🇷' },
  { code: 'AW', name: 'Aruba', phoneCode: '+297', timezone: 'America/Aruba', flag: '🇦🇼' },
  { code: 'CW', name: 'Curaçao', phoneCode: '+599', timezone: 'America/Curacao', flag: '🇨🇼' },
  { code: 'SX', name: 'Sint Maarten', phoneCode: '+1721', timezone: 'America/Lower_Princes', flag: '🇸🇽' },
  { code: 'BQ', name: 'Caribbean Netherlands', phoneCode: '+599', timezone: 'America/Kralendijk', flag: '🇧🇶' },
  { code: 'GP', name: 'Guadeloupe', phoneCode: '+590', timezone: 'America/Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', phoneCode: '+596', timezone: 'America/Martinique', flag: '🇲🇶' },
  { code: 'GF', name: 'French Guiana', phoneCode: '+594', timezone: 'America/Cayenne', flag: '🇬🇫' },
  { code: 'PM', name: 'Saint Pierre and Miquelon', phoneCode: '+508', timezone: 'America/Miquelon', flag: '🇵🇲' },
  { code: 'YT', name: 'Mayotte', phoneCode: '+262', timezone: 'Indian/Mayotte', flag: '🇾🇹' },
  { code: 'WF', name: 'Wallis and Futuna', phoneCode: '+681', timezone: 'Pacific/Wallis', flag: '🇼🇫' },
  { code: 'BL', name: 'Saint Barthélemy', phoneCode: '+590', timezone: 'America/St_Barthelemy', flag: '🇧🇱' },
  { code: 'MF', name: 'Saint Martin', phoneCode: '+590', timezone: 'America/Marigot', flag: '🇲🇫' },
  { code: 'FK', name: 'Falkland Islands', phoneCode: '+500', timezone: 'Atlantic/Stanley', flag: '🇫🇰' },
  { code: 'GS', name: 'South Georgia', phoneCode: '+500', timezone: 'Atlantic/South_Georgia', flag: '🇬🇸' },
  { code: 'SH', name: 'Saint Helena', phoneCode: '+290', timezone: 'Atlantic/St_Helena', flag: '🇸🇭' },
  { code: 'PN', name: 'Pitcairn Islands', phoneCode: '+64', timezone: 'Pacific/Pitcairn', flag: '🇵🇳' },
  { code: 'NF', name: 'Norfolk Island', phoneCode: '+672', timezone: 'Pacific/Norfolk', flag: '🇳🇫' },
  { code: 'CX', name: 'Christmas Island', phoneCode: '+61', timezone: 'Indian/Christmas', flag: '🇨🇽' },
  { code: 'CC', name: 'Cocos (Keeling) Islands', phoneCode: '+61', timezone: 'Indian/Cocos', flag: '🇨🇨' },
  { code: 'HM', name: 'Heard Island and McDonald Islands', phoneCode: '+672', timezone: 'Indian/Kerguelen', flag: '🇭🇲' },
  { code: 'IO', name: 'British Indian Ocean Territory', phoneCode: '+246', timezone: 'Indian/Chagos', flag: '🇮🇴' },
  { code: 'AQ', name: 'Antarctica', phoneCode: '+672', timezone: 'Antarctica/McMurdo', flag: '🇦🇶' },
  { code: 'EH', name: 'Western Sahara', phoneCode: '+212', timezone: 'Africa/El_Aaiun', flag: '🇪🇭' },
  { code: 'PS', name: 'Palestine', phoneCode: '+970', timezone: 'Asia/Gaza', flag: '🇵🇸' },
  { code: 'TF', name: 'French Southern Territories', phoneCode: '+262', timezone: 'Indian/Kerguelen', flag: '🇹🇫' },
  { code: 'BV', name: 'Bouvet Island', phoneCode: '+47', timezone: 'Europe/Oslo', flag: '🇧🇻' },
  { code: 'UM', name: 'U.S. Minor Outlying Islands', phoneCode: '+1', timezone: 'Pacific/Wake', flag: '🇺🇲' },
];

/**
 * Timezone to country code mapping for better detection
 * Handles countries with multiple timezones
 */
const TIMEZONE_MAP: Record<string, string> = {
  // United States
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'America/Honolulu': 'US',
  'America/Detroit': 'US',
  'America/Indianapolis': 'US',
  'America/Kentucky/Louisville': 'US',
  'America/Boise': 'US',

  // Canada
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',

  // Australia
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Australia/Darwin': 'AU',

  // Russia
  'Europe/Moscow': 'RU',
  'Asia/Vladivostok': 'RU',
  'Asia/Yekaterinburg': 'RU',
  'Asia/Krasnoyarsk': 'RU',

  // Brazil
  'America/Sao_Paulo': 'BR',
  'America/Manaus': 'BR',
  'America/Fortaleza': 'BR',

  // Mexico
  'America/Mexico_City': 'MX',
  'America/Cancun': 'MX',
  'America/Tijuana': 'MX',
};

/**
 * Detect user's country based on timezone
 */
export function detectCountryFromTimezone(): string | null {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // First try exact match from timezone map
    if (TIMEZONE_MAP[userTimezone]) {
      return TIMEZONE_MAP[userTimezone];
    }

    // Then try exact match from countries list
    const country = COUNTRIES.find(c => c.timezone === userTimezone);
    if (country) {
      return country.code;
    }

    // Fallback: try to match by timezone prefix for US
    if (userTimezone.startsWith('America/') &&
        !userTimezone.includes('Argentina') &&
        !userTimezone.includes('Caracas') &&
        !userTimezone.includes('Bogota') &&
        !userTimezone.includes('Lima') &&
        !userTimezone.includes('Santiago') &&
        !userTimezone.includes('Mexico') &&
        !userTimezone.includes('Sao_Paulo')) {
      // Likely US or Canada, default to US
      return 'US';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Get sorted countries with detected country first
 */
export function getSortedCountries(): Country[] {
  const detectedCode = detectCountryFromTimezone();

  if (!detectedCode) {
    return [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
  }

  const detected = COUNTRIES.find(c => c.code === detectedCode);
  const others = COUNTRIES.filter(c => c.code !== detectedCode).sort((a, b) => a.name.localeCompare(b.name));

  return detected ? [detected, ...others] : others;
}
