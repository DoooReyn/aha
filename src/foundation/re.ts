import { isInRange } from './math';

/**
 * 正则工具
 *
 * 提供常用的正则验证方法
 */

/** 常用正则表达式常量 */
const $EXPRESSIONS = {
  /** 正则：邮箱 */
  EMAIL: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/,
  /** 正则：密码 */
  PASSWORD: /^[0-9a-zA-Z@#$]+$/,
  /** 正则：中国大陆身份证号码 */
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  /** 正则：URL地址 */
  URL: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i,
  /** 正则：IPv4地址 */
  IPV4: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  /** 正则：IPv6地址 */
  IPV6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  /** 正则：中文字符 */
  CHINESE: /[\u4e00-\u9fa5]/g,
  /** 正则：纯中文字符 */
  CHINESE_ONLY: /^[\u4e00-\u9fa5]+$/,
  /** 正则：数字 */
  NUMBER: /^\d+$/,
  /** 正则：整数（包括负数） */
  INTEGER: /^-?\d+$/,
  /** 正则：浮点数 */
  FLOAT: /^-?\d+(\.\d+)?$/,
  /** 正则：正整数 */
  POSITIVE_INTEGER: /^[1-9]\d*$/,
  /** 正则：非负整数 */
  NON_NEGATIVE_INTEGER: /^\d+$/,
  /** 正则：银行卡号 */
  BANK_CARD: /^[1-9]\d{12,19}$/,
  /** 正则：QQ号 */
  QQ: /^[1-9][0-9]{4,10}$/,
  /** 正则：微信号 */
  WECHAT: /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/,
  /** 正则：车牌号 */
  LICENSE_PLATE:
    /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$/,
  /** 正则：日期格式 YYYY-MM-DD */
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  /** 正则：时间格式 HH:MM:SS */
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  /** 正则：日期时间格式 YYYY-MM-DD HH:MM:SS */
  DATETIME: /^\d{4}-\d{2}-\d{2} ([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  /** 正则：HTML标签 */
  HTML_TAG: /<[^>]+>/g,
  /** 正则：十六进制颜色值 */
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  /** 正则：MAC地址 */
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  /** 正则：Base64编码 */
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  /** 正则：版本号 */
  VERSION: /^\d+\.\d+\.\d+$/,
  /** 正则：文件扩展名 */
  FILE_EXTENSION: /\.[^.]+$/,
  /** 正则：域名 */
  DOMAIN: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  /** 正则：端口号 */
  PORT: /^([1-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
  /** 正则：邮政编码 */
  POSTAL_CODE: /^[1-9]\d{5}$/,
  /** 正则：用户名（字母开头，允许字母数字下划线） */
  USERNAME: /^[a-zA-Z][a-zA-Z0-9_]+$/,
  /** 正则：玩家名称（大小写英文字母+数字+中文+日文） */
  PLAYER_NAME: /^[a-zA-Z0-9\u4e00-\u9fa5\u0800-\u4e00]+$/,
  /** 正则：强密码（至少包含大小写字母、数字和特殊字符） */
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  /** 正则：emoji表情 */
  EMOJI:
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
  /** 正则：国家代码和手机号格式校验正则表达式的映射关系 */
  PHONE_BY_COUNTRY_CODE: {
    '244': /^\+2449\d{8}$/,
    '93': /^\+93\d{9}$/,
    '355': /^\+355\d{8,9}$/,
    '213': /^\+213\d{9}$/,
    '376': /^\+376\d{6}$/,
    '1264': /^\+1264\d{7}$/,
    '1268': /^\+1268\d{7}$/,
    '54': /^\+54\d{10}$/,
    '374': /^\+374\d{8}$/,
    '247': /^\+247\d{5}$/,
    '61': /^\+61\d{9}$/,
    '43': /^\+43\d{10}$/,
    '994': /^\+994\d{9}$/,
    '1242': /^\+1242\d{7}$/,
    '973': /^\+973\d{7}$/,
    '880': /^\+880\d{10}$/,
    '1246': /^\+1246\d{7}$/,
    '375': /^\+375\d{9}$/,
    '32': /^\+32\d{9}$/,
    '501': /^\+501\d{7}$/,
    '229': /^\+229\d{7}$/,
    '1441': /^\+1441\d{7}$/,
    '591': /^\+591\d{7,8}$/,
    '267': /^\+267\d{7}$/,
    '55': /^\+55\d{11}$/,
    '673': /^\+673\d{6}$/,
    '359': /^\+359\d{9}$/,
    '226': /^\+226\d{7}$/,
    '95': /^\+95\d{8,9}$/,
    '257': /^\+257\d{7}$/,
    '237': /^\+237\d{8}$/,
    '1': /^\+1\d{10}$/,
    '1345': /^\+1345\d{7}$/,
    '236': /^\+236\d{8}$/,
    '235': /^\+235\d{8}$/,
    '56': /^\+56\d{9}$/,
    '86': /^\+86\d{11}$/,
    '57': /^\+57\d{10}$/,
    '242': /^\+242\d{9}$/,
    '682': /^\+682\d{4}$/,
    '506': /^\+506\d{8}$/,
    '53': /^\+53\d{8}$/,
    '357': /^\+357\d{8}$/,
    '420': /^\+420\d{9}$/,
    '45': /^\+45\d{8}$/,
    '253': /^\+253\d{6}$/,
    '1890': /^\+1890\d{7}$/,
    '593': /^\+593\d{9}$/,
    '20': /^\+20\d{9}$/,
    '503': /^\+503\d{8}$/,
    '372': /^\+372\d{7}$/,
    '251': /^\+251\d{9}$/,
    '679': /^\+679\d{7}$/,
    '358': /^\+358\d{9}$/,
    '33': /^\+33\d{9}$/,
    '594': /^\+594\d{9}$/,
    '241': /^\+241\d{6}$/,
    '220': /^\+220\d{7}$/,
    '995': /^\+995\d{9}$/,
    '49': /^\+49\d{11}$/,
    '233': /^\+233\d{9}$/,
    '350': /^\+350\d{8}$/,
    '30': /^\+30\d{10}$/,
    '1809': /^\+1809\d{7}$/,
    '1671': /^\+1671\d{7}$/,
    '502': /^\+502\d{8}$/,
    '224': /^\+224\d{8}$/,
    '592': /^\+592\d{7}$/,
    '509': /^\+509\d{8}$/,
    '504': /^\+504\d{8}$/,
    '852': /^\+852\d{8}$/,
    '36': /^\+36\d{8}$/,
    '354': /^\+354\d{7}$/,
    '91': /^\+91\d{10}$/,
    '62': /^\+62\d{9,12}$/,
    '98': /^\+98\d{9,10}$/,
    '964': /^\+964\d{10}$/,
    '353': /^\+353\d{9}$/,
    '972': /^\+972\d{9}$/,
    '39': /^\+39\d{10}$/,
    '225': /^\+225\d{8}$/,
    '1876': /^\+1876\d{7}$/,
    '81': /^\+81\d{10}$/,
    '962': /^\+962\d{9}$/,
    '855': /^\+855\d{8,9}$/,
    '327': /^\+327\d{9}$/,
    '254': /^\+254\d{9}$/,
    '82': /^\+82\d{9,10}$/,
    '965': /^\+965\d{8}$/,
    '331': /^\+331\d{8}$/,
    '856': /^\+856\d{8,9}$/,
    '371': /^\+371\d{8}$/,
    '961': /^\+961\d{7,8}$/,
    '266': /^\+266\d{8}$/,
    '231': /^\+231\d{7}$/,
    '218': /^\+218\d{9}$/,
    '423': /^\+423\d{7}$/,
    '370': /^\+370\d{8}$/,
    '352': /^\+352\d{8}$/,
    '853': /^\+853\d{8}$/,
    '261': /^\+261\d{9}$/,
    '265': /^\+265\d{7}$/,
    '60': /^\+60\d{9,10}$/,
    '960': /^\+960\d{7}$/,
    '223': /^\+223\d{8}$/,
    '356': /^\+356\d{8}$/,
    '1670': /^\+1670\d{7}$/,
    '596': /^\+596\d{9}$/,
    '230': /^\+230\d{7}$/,
    '52': /^\+52\d{10}$/,
    '373': /^\+373\d{7}$/,
    '377': /^\+377\d{8}$/,
    '976': /^\+976\d{8}$/,
    '1664': /^\+1664\d{7}$/,
    '212': /^\+212\d{9}$/,
    '258': /^\+258\d{9}$/,
    '264': /^\+264\d{9}$/,
    '674': /^\+674\d{5}$/,
    '977': /^\+977\d{9}$/,
    '599': /^\+599\d{7}$/,
    '31': /^\+31\d{9}$/,
    '64': /^\+64\d{9}$/,
    '505': /^\+505\d{8}$/,
    '227': /^\+227\d{8}$/,
    '234': /^\+234\d{10}$/,
    '850': /^\+850\d{8}$/,
    '47': /^\+47\d{8}$/,
    '968': /^\+968\d{8}$/,
    '92': /^\+92\d{10}$/,
    '507': /^\+507\d{7}$/,
    '675': /^\+675\d{9}$/,
    '595': /^\+595\d{8}$/,
    '51': /^\+51\d{9}$/,
    '63': /^\+63\d{10}$/,
    '48': /^\+48\d{9}$/,
    '689': /^\+689\d{6}$/,
    '351': /^\+351\d{9}$/,
    '1787': /^\+1787\d{7}$/,
    '974': /^\+974\d{7}$/,
    '262': /^\+262\d{9}$/,
    '40': /^\+40\d{9}$/,
    '7': /^\+7\d{10}$/,
    '1758': /^\+1758\d{7}$/,
    '1784': /^\+1784\d{7}$/,
    '684': /^\+684\d{7}$/,
    '685': /^\+685\d{7}$/,
    '378': /^\+378\d{6}$/,
    '239': /^\+239\d{7}$/,
    '966': /^\+966\d{9}$/,
    '221': /^\+221\d{9}$/,
    '248': /^\+248\d{7}$/,
    '232': /^\+232\d{8}$/,
    '65': /^\+65\d{8}$/,
    '421': /^\+421\d{9}$/,
    '386': /^\+386\d{8}$/,
    '677': /^\+677\d{5}$/,
    '252': /^\+252\d{7}$/,
    '27': /^\+27\d{9}$/,
    '34': /^\+34\d{9}$/,
    '94': /^\+94\d{9}$/,
    '249': /^\+249\d{9}$/,
    '597': /^\+597\d{7}$/,
    '268': /^\+268\d{7}$/,
    '46': /^\+46\d{9}$/,
    '41': /^\+41\d{9}$/,
    '963': /^\+963\d{9}$/,
    '886': /^\+886\d{9}$/,
    '992': /^\+992\d{9}$/,
    '255': /^\+255\d{9}$/,
    '66': /^\+66\d{9}$/,
    '228': /^\+228\d{8}$/,
    '676': /^\+676\d{5}$/,
    '216': /^\+216\d{8}$/,
    '90': /^\+90\d{10}$/,
    '993': /^\+993\d{8}$/,
    '256': /^\+256\d{9}$/,
    '380': /^\+380\d{9}$/,
    '971': /^\+971\d{9}$/,
    '44': /^\+44\d{10,11}$/,
    '598': /^\+598\d{8}$/,
    '58': /^\+58\d{10}$/,
    '84': /^\+84\d{9}$/,
    '967': /^\+967\d{9}$/,
    '381': /^\+381\d{8,9}$/,
    '263': /^\+263\d{9}$/,
    '243': /^\+243\d{9}$/,
    '260': /^\+260\d{9}$/,
  },
} as const;

/**
 * 校验邮箱格式
 * @param email - 邮箱地址
 * @returns 是否为有效的邮箱格式
 */
function isEmail(email: string): boolean {
  return $EXPRESSIONS.EMAIL.test(email);
}

/**
 * 根据国际区号校验手机号格式
 * @param phoneNumber - 手机号
 * @param countryCode - 国际区号
 * @returns 是否为有效的手机号格式
 */
function isPhoneNo(phoneNumber: string, countryCode: keyof typeof $EXPRESSIONS.PHONE_BY_COUNTRY_CODE): boolean {
  const regex = $EXPRESSIONS.PHONE_BY_COUNTRY_CODE[countryCode];
  if (regex) {
    return regex.test(`+${countryCode}${phoneNumber}`);
  }
  return false;
}

/**
 * 校验密码格式
 * @param password - 密码
 * @param min - 最小长度，默认6
 * @param max - 最大长度，默认32
 * @returns 是否为有效的密码格式
 */
function isPassword(password: string, min: number = 6, max: number = 32): boolean {
  return $EXPRESSIONS.PASSWORD.test(password) && isInRange(password.length, min, max);
}

/**
 * 校验中国大陆身份证号码
 * @param idCard - 身份证号码
 * @returns 是否为有效的身份证号码
 */
function isIdCard(idCard: string): boolean {
  return $EXPRESSIONS.ID_CARD.test(idCard);
}

/**
 * 校验URL地址
 * @param url - URL地址
 * @returns 是否为有效的URL地址
 */
function isUrl(url: string): boolean {
  return $EXPRESSIONS.URL.test(url);
}

/**
 * 校验IPv4地址
 * @param ip - IPv4地址
 * @returns 是否为有效的IPv4地址
 */
function isIPv4(ip: string): boolean {
  return $EXPRESSIONS.IPV4.test(ip);
}

/**
 * 校验IPv6地址
 * @param ip - IPv6地址
 * @returns 是否为有效的IPv6地址
 */
function isIPv6(ip: string): boolean {
  return $EXPRESSIONS.IPV6.test(ip);
}

/**
 * 检查字符串是否包含中文字符
 * @param str - 要检查的字符串
 * @returns 是否包含中文字符
 */
function hasChinese(str: string): boolean {
  return $EXPRESSIONS.CHINESE.test(str);
}

/**
 * 检查字符串是否为纯中文字符
 * @param str - 要检查的字符串
 * @returns 是否为纯中文字符
 */
function isChineseOnly(str: string): boolean {
  return $EXPRESSIONS.CHINESE_ONLY.test(str);
}

/**
 * 校验字符串是否为数字
 * @param str - 要校验的字符串
 * @returns 是否为数字
 */
function isNumber(str: string): boolean {
  return $EXPRESSIONS.NUMBER.test(str);
}

/**
 * 校验字符串是否为整数
 * @param str - 要校验的字符串
 * @returns 是否为整数
 */
function isInteger(str: string): boolean {
  return $EXPRESSIONS.INTEGER.test(str);
}

/**
 * 校验字符串是否为浮点数
 * @param str - 要校验的字符串
 * @returns 是否为浮点数
 */
function isFloat(str: string): boolean {
  return $EXPRESSIONS.FLOAT.test(str);
}

/**
 * 校验字符串是否为正整数
 * @param str - 要校验的字符串
 * @returns 是否为正整数
 */
function isPositiveInteger(str: string): boolean {
  return $EXPRESSIONS.POSITIVE_INTEGER.test(str);
}

/**
 * 校验字符串是否为非负整数
 * @param str - 要校验的字符串
 * @returns 是否为非负整数
 */
function isNonNegativeInteger(str: string): boolean {
  return $EXPRESSIONS.NON_NEGATIVE_INTEGER.test(str);
}

/**
 * 校验银行卡号
 * @param cardNumber - 银行卡号
 * @returns 是否为有效的银行卡号
 */
function isBankCard(cardNumber: string): boolean {
  return $EXPRESSIONS.BANK_CARD.test(cardNumber);
}

/**
 * 校验QQ号
 * @param qq - QQ号
 * @returns 是否为有效的QQ号
 */
function isQQ(qq: string): boolean {
  return $EXPRESSIONS.QQ.test(qq);
}

/**
 * 校验微信号
 * @param wechat - 微信号
 * @returns 是否为有效的微信号
 */
function isWechat(wechat: string): boolean {
  return $EXPRESSIONS.WECHAT.test(wechat);
}

/**
 * 校验车牌号
 * @param licensePlate - 车牌号
 * @returns 是否为有效的车牌号
 */
function isCarNo(licensePlate: string): boolean {
  return $EXPRESSIONS.LICENSE_PLATE.test(licensePlate);
}

/**
 * 校验日期格式 YYYY-MM-DD
 * @param date - 日期字符串
 * @returns 是否为有效的日期格式
 */
function isDate(date: string): boolean {
  return $EXPRESSIONS.DATE.test(date);
}

/**
 * 校验时间格式 HH:MM:SS
 * @param time - 时间字符串
 * @returns 是否为有效的时间格式
 */
function isTime(time: string): boolean {
  return $EXPRESSIONS.TIME.test(time);
}

/**
 * 校验日期时间格式 YYYY-MM-DD HH:MM:SS
 * @param datetime - 日期时间字符串
 * @returns 是否为有效的日期时间格式
 */
function isDateTime(datetime: string): boolean {
  return $EXPRESSIONS.DATETIME.test(datetime);
}

/**
 * 移除HTML标签
 * @param html - HTML字符串
 * @returns 移除HTML标签后的字符串
 */
function removeHtmlTags(html: string): string {
  return html.replace($EXPRESSIONS.HTML_TAG, '');
}

/**
 * 校验十六进制颜色值
 * @param color - 颜色值
 * @returns 是否为有效的十六进制颜色值
 */
function isHexColor(color: string): boolean {
  return $EXPRESSIONS.HEX_COLOR.test(color);
}

/**
 * 校验MAC地址
 * @param mac - MAC地址
 * @returns 是否为有效的MAC地址
 */
function isMacAddress(mac: string): boolean {
  return $EXPRESSIONS.MAC_ADDRESS.test(mac);
}

/**
 * 校验Base64编码
 * @param base64 - Base64字符串
 * @returns 是否为有效的Base64编码
 */
function isBase64(base64: string): boolean {
  return $EXPRESSIONS.BASE64.test(base64);
}

/**
 * 校验版本号
 * @param version - 版本号
 * @returns 是否为有效的版本号格式
 */
function isVersion(version: string): boolean {
  return $EXPRESSIONS.VERSION.test(version);
}

/**
 * 获取文件扩展名
 * @param filename - 文件名
 * @returns 文件扩展名，如果没有则返回null
 */
function getFileExtension(filename: string): string | null {
  const match = filename.match($EXPRESSIONS.FILE_EXTENSION);
  return match ? match[0] : null;
}

/**
 * 校验域名
 * @param domain - 域名
 * @returns 是否为有效的域名
 */
function isDomain(domain: string): boolean {
  return $EXPRESSIONS.DOMAIN.test(domain);
}

/**
 * 校验端口号
 * @param port - 端口号
 * @returns 是否为有效的端口号
 */
function isPort(port: string): boolean {
  return $EXPRESSIONS.PORT.test(port);
}

/**
 * 校验邮政编码
 * @param postalCode - 邮政编码
 * @returns 是否为有效的邮政编码
 */
function isPostalCode(postalCode: string): boolean {
  return $EXPRESSIONS.POSTAL_CODE.test(postalCode);
}

/**
 * 校验用户名
 * @param username - 用户名
 * @param min - 最短
 * @param max - 最长
 * @returns 是否为有效的用户名
 */
function isUsername(username: string, min: number = 6, max: number = 12): boolean {
  return $EXPRESSIONS.USERNAME.test(username) && isInRange(username.length, min, max);
}

/**
 * 校验玩家名称
 * @param playerName - 玩家名称
 * @param min 最短
 * @param max 最长
 * @returns 是否有效的玩家名称
 */
function isPlayerName(playerName: string, min: number = 6, max = 14) {
  return $EXPRESSIONS.PLAYER_NAME.test(playerName) && isInRange(playerName.length, min, max);
}

/**
 * 校验强密码
 * @param password - 密码
 * @returns 是否为强密码
 */
function isStrongPassword(password: string): boolean {
  return $EXPRESSIONS.STRONG_PASSWORD.test(password);
}

/**
 * 移除字符串中的emoji表情
 * @param str - 要处理的字符串
 * @returns 移除emoji后的字符串
 */
function removeEmoji(str: string): string {
  return str.replace($EXPRESSIONS.EMOJI, '');
}

/**
 * 检查字符串是否包含emoji表情
 * @param str - 要检查的字符串
 * @returns 是否包含emoji表情
 */
function hasEmoji(str: string): boolean {
  return $EXPRESSIONS.EMOJI.test(str);
}

/**
 * 提取字符串中的中文字符
 * @param str - 要处理的字符串
 * @returns 中文字符数组
 */
function extractChinese(str: string): string[] {
  return str.match($EXPRESSIONS.CHINESE) || [];
}

/**
 * 提取字符串中的数字
 * @param str - 要处理的字符串
 * @returns 数字字符串数组
 */
function extractNumbers(str: string): string[] {
  return str.match(/\d+/g) || [];
}

/**
 * 提取字符串中的邮箱地址
 * @param str - 要处理的字符串
 * @returns 邮箱地址数组
 */
function extractEmails(str: string): string[] {
  return str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
}

/**
 * 提取字符串中的URL
 * @param str - 要处理的字符串
 * @returns URL数组
 */
function extractUrls(str: string): string[] {
  return str.match(/https?:\/\/[^\s/$.?#].[^\s]*/gi) || [];
}

/**
 * 格式化中国大陆手机号
 * @param phone - 手机号
 * @returns 格式化后的手机号 (xxx-xxxx-xxxx)
 */
function formatChinesePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

/**
 * 格式化银行卡号
 * @param cardNumber - 银行卡号
 * @returns 格式化后的银行卡号 (xxxx xxxx xxxx xxxx)
 */
function formatBankCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * 脱敏手机号
 * @param phone - 手机号
 * @returns 脱敏后的手机号
 */
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 脱敏身份证号
 * @param idCard - 身份证号
 * @returns 脱敏后的身份证号
 */
function maskIdCard(idCard: string): string {
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
}

/**
 * 脱敏银行卡号
 * @param cardNumber - 银行卡号
 * @returns 脱敏后的银行卡号
 */
function maskBankCard(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
}

/**
 * 正则工具集合
 */
export {
  isEmail,
  isPhoneNo,
  isPassword,
  isIdCard,
  isUrl,
  isIPv4,
  isIPv6,
  hasChinese,
  isChineseOnly,
  isNumber,
  isInteger,
  isFloat,
  isPositiveInteger,
  isNonNegativeInteger,
  isBankCard,
  isQQ,
  isWechat,
  isCarNo,
  isDate,
  isTime,
  isDateTime,
  removeHtmlTags,
  isHexColor,
  isMacAddress,
  isBase64,
  isVersion,
  getFileExtension,
  isDomain,
  isPort,
  isPostalCode,
  isUsername,
  isPlayerName,
  isStrongPassword,
  removeEmoji,
  hasEmoji,
  extractChinese,
  extractNumbers,
  extractEmails,
  extractUrls,
  formatChinesePhone,
  formatBankCard,
  maskPhone,
  maskIdCard,
  maskBankCard,
};
