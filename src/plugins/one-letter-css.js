const { interpolateName } = require('loader-utils');

/**
 * Заменяем css-классы на 64-битный префикс по номеру позиции в файле + хеш от пути файла
 */

// Парсим кодирующую строку, или берем дефолтные значения
const getRule = (externalRule) => {
  let iRule = {
    type: 'hash',
    rule: 'base64',
    hashLen: 8,
    val: '',
  };

  iRule.val = `[${iRule.type}:${iRule.rule}:${iRule.hashLen}]`;

  const matchHashRule =
    externalRule
      .replace(/_/g, '')
      .match(/^(?:\[local])*\[([a-z\d]+):([a-z\d]+):(\d+)]$/) || [];

  if (matchHashRule.length >= 4) {
    const [, type, rule, hashLen] = matchHashRule;

    iRule = {
      type,
      rule,
      hashLen,
      val: `[${type}:${rule}:${hashLen}]`,
    };
  }

  return iRule;
};

export default class OneLetterCssClasses {
  constructor() {
    // Сохраняем начальные точки из таблицы
    this.a = 'a'.charCodeAt(0);
    this.A = 'A'.charCodeAt(0);
    this.zero = '0'.charCodeAt(0);
    this.files = {};
    // [a-zA-Z\d_-]
    this.encoderSize = 64;
    this.symbolsArea = {
      // a-z
      az: 26,
      // A-Z
      AZ: 52,
      // _
      under: 53,
      // 0-9 | \d
      digit: 63,
      // -
      // dash: 64
    };
    // prevent loop hell
    this.maxLoop = 5;
    this.rootPathLen = process.cwd().length;
  }

  getSingleSymbol(n) {
    const {
      a,
      A,
      zero,
      encoderSize,
      symbolsArea: { az, AZ, under, digit },
    } = this;

    if (!n) {
      console.error(`!n, n=${n}`);

      return '';
    }

    if (n > encoderSize) {
      console.error(`n > ${encoderSize}, n=${n}`);

      return '';
    }

    // work with 1 <= n <= 64
    if (n <= az) {
      return String.fromCharCode(n - 1 + a);
    }

    if (n <= AZ) {
      return String.fromCharCode(n - 1 - az + A);
    }

    if (n <= under) {
      return '_';
    }

    if (n <= digit) {
      return String.fromCharCode(n - 1 - under + zero);
    }

    return '-';
  }

  /** Кодируем класс по позиции в списке, 0 - а, 1 - b, итп */
  getNamePrefix(num) {
    const { maxLoop, encoderSize } = this;

    if (!num) {
      return '';
    }

    let loopCount = 0;
    let n = num;
    let res = '';

    // Немного усовеншенственный енкодер. В найденых простейших пропускаются комбинации
    // Ходим в цикле, делим на кодирующий размер (64)
    // Например, с 1 по 64 - 1 проход, с 65 по 4096 (64*64) - 2 прохода цикла, итд
    while (n && loopCount < maxLoop) {
      // Остаток от деления, будем его кодировать от 1 до 64.
      let tail = n % encoderSize;
      const origTail = tail;

      // Проверка граничных значений n === encoderSize. 64 % 64 = 0, а кодировать будем 64
      if (tail === 0) {
        tail = encoderSize;
      }

      // Берем результат кодирования, добавляем в строку
      res = this.getSingleSymbol(tail) + res;

      // Проверяем, нужно ли уходить на новый цикл
      if (Math.floor((n - 1) / encoderSize)) {
        // Находим кол-во разрядов для след. цикла кодирования.
        n = (n - origTail) / encoderSize;

        // На граничном значении (64) уйдем на новый круг, -1 чтобы этого избежать (это мы уже закодировали в текущем проходе)
        if (origTail === 0) {
          n -= 1;
        }
      } else {
        n = 0;
      }

      loopCount += 1;
    }

    return res;
  }

  /**
   * Переопределяем ф-ию хеширования класса.
   * Т.к. обработка на этапе сборки, то файлы разные, отсюда меньше выхлопа
   */
  getLocalIdentWithFileHash(context, localIdentName, localName) {
    const { resourcePath } = context;
    const { files, rootPathLen } = this;

    // Чтобы убрать разницу стендов - оставляем только значимый кусок пути файла
    const resPath = resourcePath.substr(rootPathLen);

    // Файл уже в списке, берем его новое имя
    let fileShort = files[resPath];

    // Файла нет в списке, генерируем новое имя, и сохраняем
    if (!fileShort) {
      // парсим переданное правило
      const localIdentRule = getRule(localIdentName);

      const fileShortName = interpolateName(context, localIdentRule.val, {
        content: resPath,
      });

      fileShort = { name: fileShortName, lastUsed: 0, ruleNames: {} };
      files[resPath] = fileShort;
    }

    // Берем сгенерированное имя правило, если такое уже было в текущем файле
    let newRuleName = fileShort.ruleNames[localName];

    // Если его не было - генерируем новое, и сохраняем
    if (!newRuleName) {
      // Увеличиваем счетчик правила для текущего файла
      fileShort.lastUsed += 1;

      // Генерируем новое имя правила
      newRuleName = this.getNamePrefix(fileShort.lastUsed) + fileShort.name;

      // сохраняем
      fileShort.ruleNames[localName] = newRuleName;
    }

    // Проверяем, есть ли в веб-паке настройки, что нам нужны оригинальные имена классов
    const hasLocal = /\[local]/.test(localIdentName);

    // Если develop-настройка есть - добавляем префикс
    const res = hasLocal ? `${localName}__${newRuleName}` : newRuleName;

    // Добавляем префикс '_' для классов, начинающихся с '-', цифры '\d'
    // или '_' (для исключения коллизий, т.к. символ участвует в кодировании)
    return /^[\d_-]/.test(res) ? `_${res}` : res;
  }

  getStat() {
    return this.files;
  }
}
