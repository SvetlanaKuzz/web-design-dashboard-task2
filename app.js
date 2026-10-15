// =============================================================
// КОНФИГ И УТИЛИТЫ
// =============================================================
const API_KEY = '4fd686807cb264414f3186a46373c1d3';
const API_BASE = 'https://apidata.mos.ru/v1';
const DATASETS = { vestibules: 624, flow: 62743 };
const cache = {};
const THEME_KEY = 'moscow-dashboard-theme';

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function num(n) {
    const v = Number(n);
    if (isNaN(v)) return '—';
    return v.toLocaleString('ru-RU');
}

function pick(obj, names) {
    if (!obj) return null;
    const keys = Object.keys(obj);
    for (const name of names) {
        const n = name.toLowerCase();
        for (const k of keys) {
            if (k.toLowerCase() === n) {
                const v = obj[k];
                if (v !== null && v !== undefined && v !== '') return v;
            }
        }
    }
    return null;
}

function unwrap(v) {
    if (v === null || v === undefined) return null;
    if (typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(unwrap).filter(Boolean).join(', ');
    if (v.ru) return v.ru;
    if (v.RU) return v.RU;
    if (v.en) return v.en;
    const parts = [];
    Object.keys(v).forEach(k => {
        if (['global_id','is_deleted','id'].indexOf(k.toLowerCase()) !== -1) return;
        const val = v[k];
        if (val === null || val === undefined || val === '' || val === 0) return;
        parts.push(typeof val === 'object' ? unwrap(val) : val);
    });
    return parts.filter(Boolean).join(', ');
}

function unwrapRow(r) {
    const cells = r.Cells || r;
    if (Array.isArray(cells)) {
        const obj = {};
        cells.forEach(c => {
            const k = c.columnName || c.ColumnName || c.name || c.Name;
            if (k) obj[k] = unwrap(c.value != null ? c.value : c.Value);
        });
        return obj;
    }
    if (cells && typeof cells === 'object') {
        const clean = {};
        Object.keys(cells).forEach(k => {
            const upper = k.toUpperCase();
            if (['GLOBAL_ID','ID','NUMBER'].indexOf(upper) !== -1) return;
            clean[k] = cells[k];
        });
        return clean;
    }
    return r;
}

async function fetchDataset(id) {
    const r1 = await fetch(API_BASE + '/datasets/' + id + '/count?api_key=' + API_KEY);
    if (!r1.ok) throw new Error('count ' + r1.status);
    const total = await r1.json();

    const r2 = await fetch(API_BASE + '/datasets/' + id + '/rows?api_key=' + API_KEY + '&$top=500');
    if (!r2.ok) throw new Error('rows ' + r2.status);
    const raw = await r2.json();

    return { rows: raw.map(unwrapRow), total, source: 'api' };
}

async function getData(key) {
    const id = DATASETS[key];
    if (cache[id]) return cache[id];
    try {
        const d = await fetchDataset(id);
        cache[id] = d;
        return d;
    } catch (e) {
        console.warn('[API] Ошибка датасета ' + id + ':', e.message);
        const fb = { rows: DEMO[id].rows, total: DEMO[id].total, source: 'demo' };
        cache[id] = fb;
        return fb;
    }
}

// =============================================================
// ДЕМО-ДАННЫЕ
// =============================================================
const DEMO = {
    624: { total: 312, rows: [
        { Name: 'Комсомольская, выход к Ленинградскому вокзалу', NameOfStation: 'Комсомольская', Line: 'Сокольническая', ExitNumber: 1, AdmArea: 'Центральный', VestibuleType: 'Наземный' },
        { Name: 'Охотный Ряд, выход к Манежной площади', NameOfStation: 'Охотный Ряд', Line: 'Сокольническая', ExitNumber: 2, AdmArea: 'Центральный', VestibuleType: 'Подземный' },
        { Name: 'Арбатская, выход к Старому Арбату', NameOfStation: 'Арбатская', Line: 'Арбатско-Покровская', ExitNumber: 3, AdmArea: 'Центральный', VestibuleType: 'Подземный' },
        { Name: 'Курская, выход к вокзалу', NameOfStation: 'Курская', Line: 'Кольцевая', ExitNumber: 1, AdmArea: 'Центральный', VestibuleType: 'Наземный' },
        { Name: 'Белорусская, выход к вокзалу', NameOfStation: 'Белорусская', Line: 'Кольцевая', ExitNumber: 1, AdmArea: 'Центральный', VestibuleType: 'Наземный' },
        { Name: 'Киевская, выход к вокзалу', NameOfStation: 'Киевская', Line: 'Кольцевая', ExitNumber: 1, AdmArea: 'Западный', VestibuleType: 'Наземный' },
        { Name: 'ВДНХ, выход к выставке', NameOfStation: 'ВДНХ', Line: 'Калужско-Рижская', ExitNumber: 1, AdmArea: 'Северо-Восточный', VestibuleType: 'Наземный' },
        { Name: 'Таганская, выход к театру', NameOfStation: 'Таганская', Line: 'Кольцевая', ExitNumber: 1, AdmArea: 'Центральный', VestibuleType: 'Подземный' }
    ]},
    62743: { total: 2400, rows: [
        { StationName: 'Комсомольская', LineName: 'Сокольническая', Incoming: 4200, Outgoing: 4500 },
        { StationName: 'Охотный Ряд', LineName: 'Сокольническая', Incoming: 2800, Outgoing: 3100 },
        { StationName: 'Арбатская', LineName: 'Арбатско-Покровская', Incoming: 1900, Outgoing: 2200 },
        { StationName: 'Курская', LineName: 'Кольцевая', Incoming: 3800, Outgoing: 4100 },
        { StationName: 'Белорусская', LineName: 'Кольцевая', Incoming: 3300, Outgoing: 3600 },
        { StationName: 'Киевская', LineName: 'Кольцевая', Incoming: 3100, Outgoing: 3400 },
        { StationName: 'Парк Победы', LineName: 'Арбатско-Покровская', Incoming: 2400, Outgoing: 2600 },
        { StationName: 'Таганская', LineName: 'Кольцевая', Incoming: 2100, Outgoing: 2300 },
        { StationName: 'Новослободская', LineName: 'Кольцевая', Incoming: 2900, Outgoing: 2700 },
        { StationName: 'Китай-город', LineName: 'Калужско-Рижская', Incoming: 3600, Outgoing: 3800 }
    ]}
};

// =============================================================
// ДАННЫЕ МЕТРО
// =============================================================
const LINES = [
    { id: 1, name: 'Сокольническая', color: '#D92B2B' },
    { id: 2, name: 'Замоскворецкая', color: '#4CAF50' },
    { id: 3, name: 'Арбатско-Покровская', color: '#1E88E5' },
    { id: 5, name: 'Кольцевая', color: '#8D6E63' },
    { id: 6, name: 'Калужско-Рижская', color: '#FB8C00' },
    { id: 7, name: 'Таганско-Краснопресненская', color: '#8E24AA' },
    { id: 8, name: 'Калининская', color: '#FDD835' },
    { id: 9, name: 'Серпуховско-Тимирязевская', color: '#9E9E9E' },
    { id: 10, name: 'Люблинско-Дмитровская', color: '#7CB342' },
    { id: 11, name: 'Большая кольцевая', color: '#00ACC1' },
    { id: 12, name: 'Бутовская', color: '#78909C' },
    { id: 15, name: 'Некрасовская', color: '#D81B60' }
];

const STATIONS = [
    { name: 'Комсомольская', line: 1, lat: 55.7759, lon: 37.6554 },
    { name: 'Красные Ворота', line: 1, lat: 55.7688, lon: 37.6499 },
    { name: 'Чистые пруды', line: 1, lat: 55.7647, lon: 37.6387 },
    { name: 'Лубянка', line: 1, lat: 55.7598, lon: 37.6277 },
    { name: 'Охотный Ряд', line: 1, lat: 55.7576, lon: 37.6155 },
    { name: 'Библиотека им. Ленина', line: 1, lat: 55.7517, lon: 37.6100 },
    { name: 'Кропоткинская', line: 1, lat: 55.7452, lon: 37.6036 },
    { name: 'Парк культуры', line: 1, lat: 55.7356, lon: 37.5930 },
    { name: 'Фрунзенская', line: 1, lat: 55.7273, lon: 37.5870 },
    { name: 'Спортивная', line: 1, lat: 55.7228, lon: 37.5637 },
    { name: 'Лужники', line: 1, lat: 55.7203, lon: 37.5549 },
    { name: 'Воробьёвы горы', line: 1, lat: 55.7103, lon: 37.5590 },
    { name: 'Университет', line: 1, lat: 55.6925, lon: 37.5378 },
    { name: 'Проспект Вернадского', line: 1, lat: 55.6768, lon: 37.5058 },
    { name: 'Юго-Западная', line: 1, lat: 55.6633, lon: 37.4832 },
    { name: 'Тропарёво', line: 1, lat: 55.6458, lon: 37.4777 },
    { name: 'Румянцево', line: 1, lat: 55.6328, lon: 37.4455 },
    { name: 'Саларьево', line: 1, lat: 55.6229, lon: 37.4218 },
    { name: 'Речной вокзал', line: 2, lat: 55.8543, lon: 37.4763 },
    { name: 'Водный стадион', line: 2, lat: 55.8395, lon: 37.4873 },
    { name: 'Войковская', line: 2, lat: 55.8189, lon: 37.4978 },
    { name: 'Сокол', line: 2, lat: 55.8051, lon: 37.5147 },
    { name: 'Аэропорт', line: 2, lat: 55.7935, lon: 37.5320 },
    { name: 'Динамо', line: 2, lat: 55.7900, lon: 37.5580 },
    { name: 'Белорусская', line: 2, lat: 55.7766, lon: 37.5838 },
    { name: 'Маяковская', line: 2, lat: 55.7701, lon: 37.5958 },
    { name: 'Тверская', line: 2, lat: 55.7647, lon: 37.6056 },
    { name: 'Театральная', line: 2, lat: 55.7603, lon: 37.6191 },
    { name: 'Новокузнецкая', line: 2, lat: 55.7424, lon: 37.6294 },
    { name: 'Павелецкая', line: 2, lat: 55.7317, lon: 37.6369 },
    { name: 'Автозаводская', line: 2, lat: 55.7078, lon: 37.6570 },
    { name: 'Технопарк', line: 2, lat: 55.6932, lon: 37.6636 },
    { name: 'Коломенская', line: 2, lat: 55.6780, lon: 37.6634 },
    { name: 'Каширская', line: 2, lat: 55.6550, lon: 37.6477 },
    { name: 'Кантемировская', line: 2, lat: 55.6357, lon: 37.6570 },
    { name: 'Царицыно', line: 2, lat: 55.6214, lon: 37.6694 },
    { name: 'Орехово', line: 2, lat: 55.6139, lon: 37.6958 },
    { name: 'Домодедовская', line: 2, lat: 55.6109, lon: 37.7188 },
    { name: 'Красногвардейская', line: 2, lat: 55.6137, lon: 37.7434 },
    { name: 'Алма-Атинская', line: 2, lat: 55.6326, lon: 37.7665 },
    { name: 'Щёлковская', line: 3, lat: 55.8105, lon: 37.7982 },
    { name: 'Первомайская', line: 3, lat: 55.7946, lon: 37.7995 },
    { name: 'Измайловская', line: 3, lat: 55.7876, lon: 37.7816 },
    { name: 'Партизанская', line: 3, lat: 55.7883, lon: 37.7500 },
    { name: 'Семёновская', line: 3, lat: 55.7838, lon: 37.7202 },
    { name: 'Электрозаводская', line: 3, lat: 55.7815, lon: 37.7041 },
    { name: 'Бауманская', line: 3, lat: 55.7723, lon: 37.6792 },
    { name: 'Курская', line: 3, lat: 55.7584, lon: 37.6592 },
    { name: 'Площадь Революции', line: 3, lat: 55.7567, lon: 37.6217 },
    { name: 'Арбатская', line: 3, lat: 55.7520, lon: 37.6012 },
    { name: 'Смоленская', line: 3, lat: 55.7474, lon: 37.5818 },
    { name: 'Киевская', line: 3, lat: 55.7434, lon: 37.5655 },
    { name: 'Парк Победы', line: 3, lat: 55.7366, lon: 37.5147 },
    { name: 'Славянский бульвар', line: 3, lat: 55.7295, lon: 37.4707 },
    { name: 'Кунцевская', line: 3, lat: 55.7307, lon: 37.4463 },
    { name: 'Молодёжная', line: 3, lat: 55.7407, lon: 37.4164 },
    { name: 'Крылатское', line: 3, lat: 55.7566, lon: 37.4080 },
    { name: 'Строгино', line: 3, lat: 55.8035, lon: 37.4031 },
    { name: 'Митино', line: 3, lat: 55.8459, lon: 37.3621 },
    { name: 'Пятницкое шоссе', line: 3, lat: 55.8558, lon: 37.3541 },
    { name: 'Новослободская', line: 5, lat: 55.7796, lon: 37.6014 },
    { name: 'Проспект Мира', line: 5, lat: 55.7798, lon: 37.6335 },
    { name: 'Комсомольская', line: 5, lat: 55.7759, lon: 37.6554 },
    { name: 'Курская', line: 5, lat: 55.7584, lon: 37.6592 },
    { name: 'Таганская', line: 5, lat: 55.7401, lon: 37.6533 },
    { name: 'Павелецкая', line: 5, lat: 55.7317, lon: 37.6369 },
    { name: 'Добрынинская', line: 5, lat: 55.7289, lon: 37.6226 },
    { name: 'Октябрьская', line: 5, lat: 55.7293, lon: 37.6085 },
    { name: 'Парк культуры', line: 5, lat: 55.7356, lon: 37.5930 },
    { name: 'Киевская', line: 5, lat: 55.7434, lon: 37.5655 },
    { name: 'Краснопресненская', line: 5, lat: 55.7600, lon: 37.5770 },
    { name: 'Белорусская', line: 5, lat: 55.7766, lon: 37.5838 },
    { name: 'Медведково', line: 6, lat: 55.8873, lon: 37.6575 },
    { name: 'Бабушкинская', line: 6, lat: 55.8697, lon: 37.6645 },
    { name: 'Свиблово', line: 6, lat: 55.8554, lon: 37.6527 },
    { name: 'Ботанический сад', line: 6, lat: 55.8444, lon: 37.6392 },
    { name: 'ВДНХ', line: 6, lat: 55.8212, lon: 37.6416 },
    { name: 'Алексеевская', line: 6, lat: 55.8077, lon: 37.6392 },
    { name: 'Рижская', line: 6, lat: 55.7924, lon: 37.6360 },
    { name: 'Сухаревская', line: 6, lat: 55.7722, lon: 37.6281 },
    { name: 'Тургеневская', line: 6, lat: 55.7647, lon: 37.6387 },
    { name: 'Китай-город', line: 6, lat: 55.7561, lon: 37.6325 },
    { name: 'Третьяковская', line: 6, lat: 55.7405, lon: 37.6256 },
    { name: 'Шаболовская', line: 6, lat: 55.7198, lon: 37.6080 },
    { name: 'Ленинский проспект', line: 6, lat: 55.7079, lon: 37.5828 },
    { name: 'Академическая', line: 6, lat: 55.6874, lon: 37.5731 },
    { name: 'Профсоюзная', line: 6, lat: 55.6783, lon: 37.5629 },
    { name: 'Новые Черёмушки', line: 6, lat: 55.6701, lon: 37.5541 },
    { name: 'Калужская', line: 6, lat: 55.6572, lon: 37.5400 },
    { name: 'Беляево', line: 6, lat: 55.6428, lon: 37.5256 },
    { name: 'Коньково', line: 6, lat: 55.6334, lon: 37.5191 },
    { name: 'Тёплый Стан', line: 6, lat: 55.6189, lon: 37.5071 },
    { name: 'Ясенево', line: 6, lat: 55.6063, lon: 37.5333 },
    { name: 'Новоясеневская', line: 6, lat: 55.6014, lon: 37.5543 },
    { name: 'Планерная', line: 7, lat: 55.8607, lon: 37.4360 },
    { name: 'Сходненская', line: 7, lat: 55.8508, lon: 37.4395 },
    { name: 'Тушинская', line: 7, lat: 55.8266, lon: 37.4369 },
    { name: 'Спартак', line: 7, lat: 55.8177, lon: 37.4350 },
    { name: 'Щукинская', line: 7, lat: 55.8094, lon: 37.4632 },
    { name: 'Октябрьское поле', line: 7, lat: 55.7932, lon: 37.4933 },
    { name: 'Полежаевская', line: 7, lat: 55.7773, lon: 37.5196 },
    { name: 'Беговая', line: 7, lat: 55.7734, lon: 37.5466 },
    { name: 'Улица 1905 года', line: 7, lat: 55.7645, lon: 37.5613 },
    { name: 'Баррикадная', line: 7, lat: 55.7607, lon: 37.5810 },
    { name: 'Пушкинская', line: 7, lat: 55.7647, lon: 37.6056 },
    { name: 'Кузнецкий Мост', line: 7, lat: 55.7604, lon: 37.6245 },
    { name: 'Пролетарская', line: 7, lat: 55.7315, lon: 37.6658 },
    { name: 'Волгоградский проспект', line: 7, lat: 55.7251, lon: 37.6852 },
    { name: 'Текстильщики', line: 7, lat: 55.7089, lon: 37.7311 },
    { name: 'Кузьминки', line: 7, lat: 55.7058, lon: 37.7644 },
    { name: 'Рязанский проспект', line: 7, lat: 55.7173, lon: 37.7936 },
    { name: 'Выхино', line: 7, lat: 55.7154, lon: 37.8182 },
    { name: 'Лермонтовский проспект', line: 7, lat: 55.7013, lon: 37.8518 },
    { name: 'Жулебино', line: 7, lat: 55.6890, lon: 37.8554 },
    { name: 'Котельники', line: 7, lat: 55.6742, lon: 37.8584 },
    { name: 'Новогиреево', line: 8, lat: 55.7520, lon: 37.8178 },
    { name: 'Перово', line: 8, lat: 55.7509, lon: 37.7867 },
    { name: 'Шоссе Энтузиастов', line: 8, lat: 55.7467, lon: 37.7516 },
    { name: 'Авиамоторная', line: 8, lat: 55.7192, lon: 37.7139 },
    { name: 'Площадь Ильича', line: 8, lat: 55.7469, lon: 37.6818 },
    { name: 'Марксистская', line: 8, lat: 55.7404, lon: 37.6566 },
    { name: 'Савёловская', line: 9, lat: 55.7931, lon: 37.5882 },
    { name: 'Дмитровская', line: 9, lat: 55.8068, lon: 37.5816 },
    { name: 'Тимирязевская', line: 9, lat: 55.8172, lon: 37.5763 },
    { name: 'Петровско-Разумовская', line: 9, lat: 55.8350, lon: 37.5745 },
    { name: 'Владыкино', line: 9, lat: 55.8473, lon: 37.5899 },
    { name: 'Отрадное', line: 9, lat: 55.8633, lon: 37.6035 },
    { name: 'Бибирево', line: 9, lat: 55.8836, lon: 37.6035 },
    { name: 'Алтуфьево', line: 9, lat: 55.8978, lon: 37.5872 },
    { name: 'Серпуховская', line: 9, lat: 55.7289, lon: 37.6226 },
    { name: 'Полянка', line: 9, lat: 55.7369, lon: 37.6182 },
    { name: 'Боровицкая', line: 9, lat: 55.7502, lon: 37.6111 },
    { name: 'Чеховская', line: 9, lat: 55.7647, lon: 37.6087 },
    { name: 'Цветной бульвар', line: 9, lat: 55.7714, lon: 37.6204 },
    { name: 'Менделеевская', line: 9, lat: 55.7796, lon: 37.6014 },
    { name: 'Марьина Роща', line: 10, lat: 55.7987, lon: 37.6160 },
    { name: 'Достоевская', line: 10, lat: 55.7817, lon: 37.6135 },
    { name: 'Трубная', line: 10, lat: 55.7672, lon: 37.6210 },
    { name: 'Сретенский бульвар', line: 10, lat: 55.7647, lon: 37.6287 },
    { name: 'Чкаловская', line: 10, lat: 55.7558, lon: 37.6596 },
    { name: 'Римская', line: 10, lat: 55.7469, lon: 37.6818 },
    { name: 'Крестьянская Застава', line: 10, lat: 55.7315, lon: 37.6658 },
    { name: 'Дубровка', line: 10, lat: 55.7191, lon: 37.6740 },
    { name: 'Кожуховская', line: 10, lat: 55.7069, lon: 37.6855 },
    { name: 'Печатники', line: 10, lat: 55.6941, lon: 37.7275 },
    { name: 'Волжская', line: 10, lat: 55.6913, lon: 37.7535 },
    { name: 'Люблино', line: 10, lat: 55.6758, lon: 37.7618 },
    { name: 'Братиславская', line: 10, lat: 55.6592, lon: 37.7505 },
    { name: 'Марьино', line: 10, lat: 55.6492, lon: 37.7435 },
    { name: 'Борисово', line: 10, lat: 55.6333, lon: 37.7438 },
    { name: 'Шипиловская', line: 10, lat: 55.6217, lon: 37.7431 },
    { name: 'Зябликово', line: 10, lat: 55.6125, lon: 37.7455 },
    { name: 'Деловой центр', line: 11, lat: 55.7494, lon: 37.5395 },
    { name: 'Шелепиха', line: 11, lat: 55.7578, lon: 37.5276 },
    { name: 'Хорошёвская', line: 11, lat: 55.7769, lon: 37.5078 },
    { name: 'ЦСКА', line: 11, lat: 55.7863, lon: 37.5333 },
    { name: 'Петровский парк', line: 11, lat: 55.7914, lon: 37.5593 },
    { name: 'Сокольники', line: 11, lat: 55.7892, lon: 37.6796 },
    { name: 'Лефортово', line: 11, lat: 55.7649, lon: 37.7098 },
    { name: 'Нижегородская', line: 11, lat: 55.7296, lon: 37.7287 },
    { name: 'Нагатинский Затон', line: 11, lat: 55.6781, lon: 37.7020 },
    { name: 'Кленовый бульвар', line: 11, lat: 55.6677, lon: 37.6802 },
    { name: 'Варшавская', line: 11, lat: 55.6534, lon: 37.6200 },
    { name: 'Каховская', line: 11, lat: 55.6532, lon: 37.5981 },
    { name: 'Зюзино', line: 11, lat: 55.6558, lon: 37.5718 },
    { name: 'Воронцовская', line: 11, lat: 55.6583, lon: 37.5453 },
    { name: 'Новаторская', line: 11, lat: 55.6705, lon: 37.5358 },
    { name: 'Мичуринский проспект', line: 11, lat: 55.6891, lon: 37.4989 },
    { name: 'Аминьевская', line: 11, lat: 55.7062, lon: 37.4911 },
    { name: 'Давыдково', line: 11, lat: 55.7193, lon: 37.4817 },
    { name: 'Терехово', line: 11, lat: 55.7468, lon: 37.4325 },
    { name: 'Мнёвники', line: 11, lat: 55.7575, lon: 37.4600 },
    { name: 'Народное Ополчение', line: 11, lat: 55.7695, lon: 37.4762 },
    { name: 'Лесопарковая', line: 12, lat: 55.5838, lon: 37.5723 },
    { name: 'Улица Старокачаловская', line: 12, lat: 55.5771, lon: 37.5633 },
    { name: 'Улица Скобелевская', line: 12, lat: 55.5660, lon: 37.5525 },
    { name: 'Бульвар Адмирала Ушакова', line: 12, lat: 55.5563, lon: 37.5441 },
    { name: 'Улица Горчакова', line: 12, lat: 55.5478, lon: 37.5355 },
    { name: 'Бунинская аллея', line: 12, lat: 55.5387, lon: 37.5253 },
    { name: 'Стахановская', line: 15, lat: 55.7166, lon: 37.7617 },
    { name: 'Окская', line: 15, lat: 55.7145, lon: 37.7800 },
    { name: 'Юго-Восточная', line: 15, lat: 55.7084, lon: 37.7990 },
    { name: 'Косино', line: 15, lat: 55.7015, lon: 37.8366 },
    { name: 'Улица Дмитриевского', line: 15, lat: 55.6989, lon: 37.8670 },
    { name: 'Лухмановская', line: 15, lat: 55.6937, lon: 37.8888 },
    { name: 'Некрасовка', line: 15, lat: 55.6826, lon: 37.9328 }
];

const VB = { w: 1000, h: 700 };
const BOUNDS = { minLat: 55.53, maxLat: 55.92, minLon: 37.35, maxLon: 37.95 };

function project(lat, lon) {
    return {
        x: ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * VB.w,
        y: ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VB.h
    };
}

// =============================================================
// ТЕМА
// =============================================================
function isLightTheme() {
    return document.body.classList.contains('light');
}

function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light', isLight);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    if (window.app && window.app.widgets) {
        app.widgets.forEach(w => {
            if (typeof w.refreshTheme === 'function') {
                try { w.refreshTheme(); } catch (e) { console.warn(e); }
            }
        });
    }
}

function initTheme() {
    let theme = 'dark';
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') {
            theme = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            theme = 'light';
        }
    } catch (e) {}
    document.body.classList.toggle('light', theme === 'light');
    return theme;
}

// =============================================================
// SVG ИКОНКИ
// =============================================================
const SVG = {
    chevron: '<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/><circle cx="8.5" cy="15.5" r="0.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="0.5" fill="currentColor"/></svg>',
    door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M15 12h.01"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="4" width="3" height="14" rx="1"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>',
    layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>'
};

const SIZES = ['full', 'half', 'third'];

// =============================================================
// БАЗОВЫЙ КЛАСС UIComponent
// =============================================================
class UIComponent {
    constructor(id, title) {
        this.id = id;
        this.title = title;
        this.element = null;
        this.collapsed = false;
        this.size = 'full';
        this._abortController = null;
        this._timers = [];
        this._windowHandlers = [];
    }

    renderBody() { throw new Error('renderBody() должен быть переопределён'); }
    getIconClass() { return ''; }
    getIconSvg() { return ''; }
    getSubtitle() { return ''; }
    onMount() { /* hook */ }
    refreshTheme() { /* hook */ }

    render() {
        const el = document.createElement('div');
        el.className = 'widget size-' + this.size + ' widget-enter';
        el.dataset.id = this.id;
        if (this.collapsed) el.classList.add('is-collapsed');

        // Снимаем анимацию появления после первого проигрывания, чтобы она
        // не перезапускалась при переразметке (сворачивании/разворачивании).
        const clearEnter = () => el.classList.remove('widget-enter');
        el.addEventListener('animationend', clearEnter, { once: true });
        setTimeout(clearEnter, 600);

        const head = document.createElement('div');
        head.className = 'widget-head';

        const icon = document.createElement('div');
        icon.className = 'widget-icon ' + this.getIconClass();
        icon.innerHTML = this.getIconSvg();

        const titleBlock = document.createElement('div');
        titleBlock.className = 'widget-title-block';

        const title = document.createElement('div');
        title.className = 'widget-title';
        title.textContent = this.title;

        const sub = document.createElement('div');
        sub.className = 'widget-sub';
        sub.textContent = this.getSubtitle();

        titleBlock.append(title, sub);

        const actions = document.createElement('div');
        actions.className = 'widget-actions';

        // Drag handle — используем div вместо button, dragstart на кнопках капризен
        const dragHandle = document.createElement('div');
        dragHandle.className = 'w-btn drag-handle';
        dragHandle.setAttribute('role', 'button');
        dragHandle.setAttribute('tabindex', '0');
        dragHandle.title = 'Перетащить для изменения порядка';
        dragHandle.setAttribute('aria-label', 'Перетащить');
        dragHandle.innerHTML = SVG.grip;
        dragHandle.draggable = true;

        dragHandle.addEventListener('click', (e) => e.stopPropagation());
        dragHandle.addEventListener('mousedown', (e) => e.stopPropagation());

        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'w-btn';
        collapseBtn.type = 'button';
        collapseBtn.title = 'Свернуть';
        collapseBtn.setAttribute('aria-label', 'Свернуть');
        collapseBtn.innerHTML = SVG.chevron;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'w-btn danger';
        deleteBtn.type = 'button';
        deleteBtn.title = 'Удалить';
        deleteBtn.setAttribute('aria-label', 'Удалить');
        deleteBtn.innerHTML = SVG.trash;

        actions.append(dragHandle, collapseBtn, deleteBtn);
        head.append(icon, titleBlock, actions);

        const body = document.createElement('div');
        body.className = 'widget-body';
        body.appendChild(this.renderBody());

        el.append(head, body);

        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCollapse();
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.requestDestroy();
        });

        head.addEventListener('click', (e) => {
            if (e.target.closest('.w-btn')) return;
            this.toggleCollapse();
        });

        dragHandle.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            Dashboard.dragSourceId = this.id;
            Dashboard.dragSession = { sourceId: this.id, originals: new Map() };
            try {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.id);
                e.dataTransfer.setDragImage(el, 40, 20);
            } catch (err) {}
            el.classList.add('dragging');
            document.body.style.cursor = 'grabbing';
        });

        dragHandle.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            document.body.style.cursor = '';
            Dashboard.dragSourceId = null;
            document.querySelectorAll('.widget.drag-over').forEach(w => w.classList.remove('drag-over'));
            Dashboard.endDragSession();
            Dashboard.saveState();
        });

        this.element = el;
        return el;
    }

    setSize(size) {
        if (!SIZES.includes(size)) return;
        if (this.size === size) return;
        SIZES.forEach(s => this.element.classList.remove('size-' + s));
        this.size = size;
        this.element.classList.add('size-' + size);
        Dashboard.saveState();
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
        this.element.classList.toggle('is-collapsed', this.collapsed);
        Dashboard.saveState();
    }

    requestDestroy() {
        this.element.dispatchEvent(new CustomEvent('widget:destroy', {
            bubbles: true,
            detail: { id: this.id }
        }));
    }

    getAbortController() {
        if (this._abortController) this._abortController.abort();
        this._abortController = new AbortController();
        return this._abortController;
    }

    setTimer(fn, delay) {
        const t = setTimeout(fn, delay);
        this._timers.push(t);
        return t;
    }

    addWindowListener(target, type, handler) {
        target.addEventListener(type, handler);
        this._windowHandlers.push({ target, type, handler });
    }

    updateSubtitle(text) {
        if (!this.element) return;
        const subEl = this.element.querySelector('.widget-sub');
        if (subEl) subEl.textContent = text;
    }

    destroy() {
        if (this._abortController) this._abortController.abort();
        this._timers.forEach(t => clearTimeout(t));
        this._timers = [];
        this._windowHandlers.forEach(({ target, type, handler }) => {
            target.removeEventListener(type, handler);
        });
        this._windowHandlers = [];
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}

// =============================================================
// ВИДЖЕТ: Карта метро
// =============================================================
class MetroWidget extends UIComponent {
    constructor(id) {
        super(id, 'Карта метро');
        this.selFrom = '';
        this.selTo = '';
        this.view = { scale: 1, x: 0, y: 0 };
        this.dragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lineFilter = null;
        this.history = [];
        this._mapWrap = null;
        this._content = null;
        this._svg = null;
    }

    getIconClass() { return 'icon-metro'; }
    getIconSvg() { return SVG.train; }
    getSubtitle() { return 'Интерактивная схема и расчёт маршрута'; }

    renderBody() {
        const wrap = document.createElement('div');
        wrap.className = 'metro-layout';

        const mapWrap = document.createElement('div');
        mapWrap.className = 'metro-map';

        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 ' + VB.w + ' ' + VB.h);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.classList.add('metro-svg');

        const content = document.createElementNS(NS, 'g');
        content.classList.add('metro-content');
        svg.appendChild(content);

        const controls = document.createElement('div');
        controls.className = 'map-controls';
        [
            { label: '+', act: 'in', title: 'Приблизить' },
            { label: '−', act: 'out', title: 'Отдалить' },
            { label: '↺', act: 'reset', title: 'Сбросить' }
        ].forEach(c => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = c.label;
            btn.title = c.title;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (c.act === 'in') this.zoom(1.3);
                else if (c.act === 'out') this.zoom(0.77);
                else this.resetZoom();
            });
            controls.appendChild(btn);
        });

        const hint = document.createElement('div');
        hint.className = 'map-hint';
        hint.textContent = 'Колёсико — масштаб · Перетаскивание — сдвиг · Двойной клик — сброс';

        mapWrap.append(svg, controls, hint);

        const side = document.createElement('div');
        side.className = 'metro-side';

        const fromField = document.createElement('div');
        fromField.className = 'metro-field';
        const fromLabel = document.createElement('label');
        fromLabel.className = 'metro-label';
        fromLabel.textContent = 'Откуда';
        const fromSelect = document.createElement('select');
        fromSelect.className = 'metro-select';
        fromSelect.innerHTML = '<option value="">Не выбрано</option>';
        fromField.append(fromLabel, fromSelect);

        const swapRow = document.createElement('div');
        swapRow.className = 'metro-swap-row';
        const swapBtn = document.createElement('button');
        swapBtn.type = 'button';
        swapBtn.className = 'metro-swap-btn';
        swapBtn.title = 'Поменять станции';
        swapBtn.innerHTML = SVG.swap;
        swapBtn.addEventListener('click', () => this._swap());
        swapRow.appendChild(swapBtn);

        const toField = document.createElement('div');
        toField.className = 'metro-field';
        const toLabel = document.createElement('label');
        toLabel.className = 'metro-label';
        toLabel.textContent = 'Куда';
        const toSelect = document.createElement('select');
        toSelect.className = 'metro-select';
        toSelect.innerHTML = '<option value="">Не выбрано</option>';
        toField.append(toLabel, toSelect);

        const btnRow = document.createElement('div');
        btnRow.className = 'metro-btn-row';
        const calcBtn = document.createElement('button');
        calcBtn.type = 'button';
        calcBtn.className = 'metro-calc-btn';
        calcBtn.textContent = 'Рассчитать маршрут';
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'metro-reset-btn';
        resetBtn.textContent = 'Сброс';
        resetBtn.addEventListener('click', () => this._resetRoute());
        btnRow.append(calcBtn, resetBtn);

        const result = document.createElement('div');
        result.className = 'metro-result';
        const resultTime = document.createElement('div');
        resultTime.className = 'metro-result-time';
        const resultLabel = document.createElement('div');
        resultLabel.className = 'metro-result-label';
        resultLabel.textContent = 'минут в пути';
        const statsRow = document.createElement('div');
        statsRow.className = 'metro-result-stats';
        result.append(resultTime, resultLabel, statsRow);
        const resultPath = document.createElement('div');
        resultPath.className = 'metro-result-path';
        result.appendChild(resultPath);

        const historyWrap = document.createElement('div');
        historyWrap.style.display = 'none';
        const historyLabel = document.createElement('div');
        historyLabel.className = 'metro-history-label';
        historyLabel.textContent = 'Недавние маршруты';
        const historyList = document.createElement('div');
        historyList.className = 'metro-history';
        historyWrap.append(historyLabel, historyList);

        const legend = document.createElement('div');
        legend.className = 'metro-legend';

        const footerHint = document.createElement('div');
        footerHint.className = 'metro-footer-hint';
        footerHint.textContent = 'Клик по линии в легенде — фильтр. Время: ~3 мин между станциями.';

        side.append(fromField, swapRow, toField, btnRow, result, historyWrap, legend, footerHint);
        wrap.append(mapWrap, side);

        this._mapWrap = mapWrap;
        this._content = content;
        this._svg = svg;
        this._fromSelect = fromSelect;
        this._toSelect = toSelect;
        this._result = result;
        this._resultTime = resultTime;
        this._resultStats = statsRow;
        this._resultPath = resultPath;
        this._legend = legend;
        this._historyWrap = historyWrap;
        this._historyList = historyList;

        fromSelect.addEventListener('change', (e) => {
            this.selFrom = e.target.value;
            this._updateSelection();
        });
        toSelect.addEventListener('change', (e) => {
            this.selTo = e.target.value;
            this._updateSelection();
        });
        calcBtn.addEventListener('click', () => this._calcRoute());

        return wrap;
    }

    onMount() {
        this._buildMap();
        this._initInteractions();
        this._renderHistory();
    }

    _buildMap() {
        const content = this._content;
        if (!content) return;
        content.innerHTML = '';
        const NS = 'http://www.w3.org/2000/svg';

        LINES.forEach(line => {
            const ss = STATIONS.filter(s => s.line === line.id);
            if (ss.length < 2) return;
            const pts = ss.map(s => {
                const p = project(s.lat, s.lon);
                return p.x + ',' + p.y;
            }).join(' ');
            const pl = document.createElementNS(NS, 'polyline');
            pl.setAttribute('points', pts);
            pl.setAttribute('class', 'metro-line');
            pl.setAttribute('data-line-id', line.id);
            pl.setAttribute('stroke', line.color);
            content.appendChild(pl);
        });

        STATIONS.forEach(s => {
            const p = project(s.lat, s.lon);
            const line = LINES.find(l => l.id === s.line);
            const g = document.createElementNS(NS, 'g');
            g.setAttribute('class', 'metro-station');
            g.setAttribute('data-name', s.name);
            g.setAttribute('data-line-id', s.line);

            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', p.x);
            c.setAttribute('cy', p.y);
            c.setAttribute('r', 5);
            c.setAttribute('fill', line ? line.color : '#3b82f6');
            c.setAttribute('stroke', '#ffffff');
            c.setAttribute('stroke-width', 2);
            g.appendChild(c);

            const t = document.createElementNS(NS, 'text');
            t.setAttribute('x', p.x + 9);
            t.setAttribute('y', p.y + 3);
            t.textContent = s.name;
            g.appendChild(t);

            g.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.selFrom) {
                    this.selFrom = s.name;
                    this._fromSelect.value = s.name;
                } else if (!this.selTo && this.selFrom !== s.name) {
                    this.selTo = s.name;
                    this._toSelect.value = s.name;
                } else {
                    this.selFrom = s.name;
                    this.selTo = '';
                    this._fromSelect.value = s.name;
                    this._toSelect.value = '';
                }
                this._updateSelection();
            });

            content.appendChild(g);
        });

        const names = [];
        STATIONS.forEach(s => { if (!names.includes(s.name)) names.push(s.name); });
        names.sort();

        const opts = '<option value="">Не выбрано</option>' +
            names.map(n => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
        this._fromSelect.innerHTML = opts;
        this._toSelect.innerHTML = opts;
        this._fromSelect.value = this.selFrom;
        this._toSelect.value = this.selTo;

        this._legend.innerHTML = LINES.map(l =>
            '<span class="metro-legend-item" data-line-id="' + l.id + '">' +
            '<span class="metro-legend-dot" style="background:' + l.color + '"></span>' +
            esc(l.name) + '</span>'
        ).join('');

        this._legend.querySelectorAll('.metro-legend-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = Number(el.getAttribute('data-line-id'));
                this.lineFilter = (this.lineFilter === id) ? null : id;
                this._applyLineFilter();
                this._updateLegendActive();
            });
        });

        this._applyTransform();
        this._updateSelection();
        this._updateLegendActive();
    }

    _applyLineFilter() {
        const filter = this.lineFilter;
        this._content.querySelectorAll('.metro-line').forEach(el => {
            const lid = Number(el.getAttribute('data-line-id'));
            el.classList.toggle('dimmed', filter !== null && lid !== filter);
            el.classList.toggle('highlight', filter !== null && lid === filter);
        });
        this._content.querySelectorAll('.metro-station').forEach(el => {
            const lid = Number(el.getAttribute('data-line-id'));
            el.style.opacity = (filter === null || lid === filter) ? '1' : '0.2';
        });
    }

    _updateLegendActive() {
        this._legend.querySelectorAll('.metro-legend-item').forEach(el => {
            const id = Number(el.getAttribute('data-line-id'));
            el.classList.toggle('active', this.lineFilter === id);
        });
    }

    _swap() {
        const from = this._fromSelect.value;
        const to = this._toSelect.value;
        this._fromSelect.value = to;
        this._toSelect.value = from;
        this.selFrom = to;
        this.selTo = from;
        this._updateSelection();
    }

    _resetRoute() {
        this.selFrom = '';
        this.selTo = '';
        this._fromSelect.value = '';
        this._toSelect.value = '';
        this._result.classList.remove('show');
        this._updateSelection();
        if (this._content) {
            this._content.querySelectorAll('.metro-station.on-path').forEach(el => el.classList.remove('on-path'));
        }
    }

    _applyTransform() {
        if (!this._content) return;
        this._content.setAttribute('transform',
            'translate(' + this.view.x + ',' + this.view.y + ') scale(' + this.view.scale + ')');
    }

    zoom(factor, cx, cy) {
        const centerX = cx !== undefined ? cx : VB.w / 2;
        const centerY = cy !== undefined ? cy : VB.h / 2;
        const ns = Math.max(0.4, Math.min(10, this.view.scale * factor));
        const f = ns / this.view.scale;
        this.view.x = centerX - (centerX - this.view.x) * f;
        this.view.y = centerY - (centerY - this.view.y) * f;
        this.view.scale = ns;
        this._applyTransform();
    }

    resetZoom() {
        this.view.scale = 1;
        this.view.x = 0;
        this.view.y = 0;
        this._applyTransform();
    }

    _svgCoords(clientX, clientY) {
        const svg = this._svg;
        if (!svg) return { x: 0, y: 0 };
        const r = svg.getBoundingClientRect();
        const vbR = VB.w / VB.h;
        const rcR = r.width / r.height;
        let w, h, ox = 0, oy = 0;
        if (rcR > vbR) {
            h = r.height;
            w = h * vbR;
            ox = (r.width - w) / 2;
        } else {
            w = r.width;
            h = w / vbR;
            oy = (r.height - h) / 2;
        }
        return {
            x: ((clientX - r.left - ox) / w) * VB.w,
            y: ((clientY - r.top - oy) / h) * VB.h
        };
    }

    _initInteractions() {
        const wrap = this._mapWrap;
        if (!wrap) return;

        wrap.addEventListener('wheel', (e) => {
            e.preventDefault();
            const pt = this._svgCoords(e.clientX, e.clientY);
            this.zoom(e.deltaY < 0 ? 1.15 : 0.87, pt.x, pt.y);
        }, { passive: false });

        wrap.addEventListener('mousedown', (e) => {
            if (e.target.closest('.map-controls') || e.target.closest('.metro-station')) return;
            this.dragging = true;
            this.dragStart = { x: e.clientX - this.view.x, y: e.clientY - this.view.y };
            wrap.classList.add('dragging');
        });

        this.addWindowListener(window, 'mousemove', (e) => {
            if (!this.dragging) return;
            this.view.x = e.clientX - this.dragStart.x;
            this.view.y = e.clientY - this.dragStart.y;
            this._applyTransform();
        });

        this.addWindowListener(window, 'mouseup', () => {
            this.dragging = false;
            wrap.classList.remove('dragging');
        });

        wrap.addEventListener('dblclick', (e) => {
            if (e.target.closest('.metro-station')) return;
            this.resetZoom();
        });
    }

    _updateSelection() {
        if (!this._content) return;
        this._content.querySelectorAll('.metro-station').forEach(n => {
            const name = n.getAttribute('data-name');
            n.classList.toggle('selected', name === this.selFrom || name === this.selTo);
        });
    }

    _buildGraph() {
        const graph = {};
        const byName = {};
        STATIONS.forEach(s => {
            if (!graph[s.name]) graph[s.name] = new Set();
            if (!byName[s.name]) byName[s.name] = [];
            byName[s.name].push(s);
        });
        const byLine = {};
        STATIONS.forEach(s => {
            if (!byLine[s.line]) byLine[s.line] = [];
            byLine[s.line].push(s);
        });
        Object.keys(byLine).forEach(k => {
            const arr = byLine[k];
            arr.sort((a, b) => (a.lat + a.lon) - (b.lat + b.lon));
            for (let i = 0; i < arr.length - 1; i++) {
                graph[arr[i].name].add(arr[i + 1].name);
                graph[arr[i + 1].name].add(arr[i].name);
            }
        });
        Object.keys(byName).forEach(name => {
            const list = byName[name];
            for (let i = 0; i < list.length; i++) {
                for (let j = i + 1; j < list.length; j++) {
                    graph[list[i].name].add(list[j].name);
                    graph[list[j].name].add(list[i].name);
                }
            }
        });
        return graph;
    }

    _transfersCount(path) {
        if (path.length < 2) return 0;
        let transfers = 0;
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const cur = path[i];
            const prevLines = new Set(STATIONS.filter(s => s.name === prev).map(s => s.line));
            const curLines = new Set(STATIONS.filter(s => s.name === cur).map(s => s.line));
            let shared = false;
            prevLines.forEach(l => { if (curLines.has(l)) shared = true; });
            if (!shared) transfers++;
        }
        return transfers;
    }

    _calcRoute() {
        const from = this._fromSelect.value;
        const to = this._toSelect.value;
        if (!from || !to) { Dashboard.toast('Выберите обе станции', 'warn'); return; }
        if (from === to) { Dashboard.toast('Станции совпадают', 'warn'); return; }

        this.selFrom = from;
        this.selTo = to;
        this._updateSelection();

        const graph = this._buildGraph();
        const queue = [[from]];
        const visited = new Set([from]);
        let path = null;
        while (queue.length) {
            const p = queue.shift();
            const last = p[p.length - 1];
            if (last === to) { path = p; break; }
            const neighbors = graph[last] || new Set();
            neighbors.forEach(nb => {
                if (!visited.has(nb)) {
                    visited.add(nb);
                    queue.push(p.concat([nb]));
                }
            });
        }
        if (!path) { Dashboard.toast('Маршрут не найден', 'warn'); return; }

        const minutes = (path.length - 1) * 3;
        const transfers = this._transfersCount(path);

        this._resultTime.textContent = minutes;
        this._resultStats.innerHTML =
            '<div class="metro-stat"><div class="metro-stat-label">Станций</div><div class="metro-stat-value">' + path.length + '</div></div>' +
            '<div class="metro-stat"><div class="metro-stat-label">Пересадок</div><div class="metro-stat-value">' + transfers + '</div></div>' +
            '<div class="metro-stat"><div class="metro-stat-label">Время</div><div class="metro-stat-value">' + minutes + ' мин</div></div>';

        const chip = (n) => '<span class="station-chip">' + esc(n) + '</span>';
        this._resultPath.innerHTML =
            chip(path[0]) + ' → ' +
            path.slice(1, -1).map(chip).join(' → ') +
            ' → ' + chip(path[path.length - 1]);

        this._result.classList.add('show');

        if (this._content) {
            this._content.querySelectorAll('.metro-station.on-path').forEach(el => el.classList.remove('on-path'));
            const pathSet = new Set(path);
            this._content.querySelectorAll('.metro-station').forEach(el => {
                if (pathSet.has(el.getAttribute('data-name'))) el.classList.add('on-path');
            });
        }

        this._addToHistory(from, to);
    }

    _addToHistory(from, to) {
        this.history = this.history.filter(h => !(h.from === from && h.to === to));
        this.history.unshift({ from, to });
        if (this.history.length > 5) this.history.length = 5;
        this._renderHistory();
        Dashboard.saveState();
    }

    _renderHistory() {
        if (!this._historyList) return;
        if (!this.history.length) {
            this._historyWrap.style.display = 'none';
            return;
        }
        this._historyWrap.style.display = '';
        this._historyList.innerHTML = this.history.map((h, i) =>
            '<span class="metro-history-chip" data-idx="' + i + '">' +
                esc(h.from) + ' <span class="arrow">→</span> ' + esc(h.to) +
            '</span>'
        ).join('');

        this._historyList.querySelectorAll('.metro-history-chip').forEach(el => {
            el.addEventListener('click', () => {
                const i = Number(el.getAttribute('data-idx'));
                const h = this.history[i];
                if (!h) return;
                this._fromSelect.value = h.from;
                this._toSelect.value = h.to;
                this.selFrom = h.from;
                this.selTo = h.to;
                this._updateSelection();
                this._calcRoute();
            });
        });
    }

    serialize() {
        return {
            type: 'metro',
            id: this.id,
            collapsed: this.collapsed,
            size: this.size,
            selFrom: this.selFrom,
            selTo: this.selTo,
            lineFilter: this.lineFilter,
            history: this.history
        };
    }
}

// =============================================================
// ВИДЖЕТ: Вестибюли
// =============================================================
function findLine(name) {
    if (!name) return null;
    const n = String(name).toLowerCase().trim();
    return LINES.find(l => {
        const ln = l.name.toLowerCase();
        return ln === n || n.indexOf(ln) === 0 || ln.indexOf(n) === 0 || n.indexOf(ln) !== -1;
    }) || null;
}

function normalizeVestibule(r) {
    const lineName = String(pick(r, ['LineName','Line','NameOfLine']) || '');
    const line = findLine(lineName);
    return {
        name: String(pick(r, ['Name','VestibuleName']) || ''),
        station: String(pick(r, ['NameOfStation','StationName','Station']) || ''),
        lineName: lineName || 'Без линии',
        lineColor: line ? line.color : '#71717a',
        exit: String(pick(r, ['ExitNumber','Number']) || ''),
        area: String(pick(r, ['AdmArea','AdministrativeArea','District']) || ''),
        type: String(pick(r, ['VestibuleType','Type']) || '')
    };
}

const VEST_SORTS = {
    'name-asc': { label: 'Название ↑', cmp: (a, b) => a.name.localeCompare(b.name, 'ru') },
    'name-desc': { label: 'Название ↓', cmp: (a, b) => b.name.localeCompare(a.name, 'ru') },
    'station': { label: 'По станции', cmp: (a, b) => a.station.localeCompare(b.station, 'ru') },
    'line': { label: 'По линии', cmp: (a, b) => a.lineName.localeCompare(b.lineName, 'ru') || a.name.localeCompare(b.name, 'ru') },
    'area': { label: 'По округу', cmp: (a, b) => a.area.localeCompare(b.area, 'ru') || a.name.localeCompare(b.name, 'ru') }
};

class VestibulesWidget extends UIComponent {
    constructor(id) {
        super(id, 'Вестибюли');
        this.state = 'idle';
        this.data = [];
        this.source = 'api';
        this.lineFilter = null;
        this.query = '';
        this.sortBy = 'name-asc';
        this.expanded = new Set();
        this._bodyWrap = null;
    }

    getIconClass() { return 'icon-vestibules'; }
    getIconSvg() { return SVG.door; }
    getSubtitle() {
        if (this.state === 'loading') return 'Загрузка данных…';
        if (this.state === 'error') return 'Ошибка загрузки';
        if (this.state === 'ok') {
            const src = this.source === 'api' ? 'данные API' : 'демо-данные';
            return this.data.length + ' вестибюлей · ' + src;
        }
        return 'Распределение по линиям';
    }

    renderBody() {
        const wrap = document.createElement('div');
        this._bodyWrap = wrap;
        this._render();
        return wrap;
    }

    onMount() {
        if (this.state === 'idle') this.load();
    }

    _render() {
        if (!this._bodyWrap) return;
        this._bodyWrap.innerHTML = '';

        if (this.state === 'idle' || this.state === 'loading') {
            this._bodyWrap.appendChild(this._makeLoader('Загружаем вестибюли…'));
            return;
        }
        if (this.state === 'error') {
            this._bodyWrap.appendChild(this._makeError('Не удалось получить данные', () => this.load()));
            return;
        }

        this._bodyWrap.appendChild(this._makeContent());
    }

    _makeLoader(text) {
        const wrap = document.createElement('div');
        wrap.className = 'state';
        const s = document.createElement('div');
        s.className = 'spinner';
        const t = document.createElement('div');
        t.className = 'state-text';
        t.textContent = text;
        wrap.append(s, t);
        return wrap;
    }

    _makeError(title, onRetry) {
        const wrap = document.createElement('div');
        wrap.className = 'state';
        const icon = document.createElement('div');
        icon.className = 'state-icon';
        icon.innerHTML = SVG.alert;
        const t = document.createElement('div');
        t.className = 'state-title';
        t.textContent = title;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'retry-btn';
        retry.textContent = 'Повторить';
        retry.addEventListener('click', onRetry);
        wrap.append(icon, t, retry);
        return wrap;
    }

    _makeContent() {
        const wrap = document.createElement('div');

        const linesWrap = document.createElement('div');
        linesWrap.className = 'vest-lines';

        const counts = {};
        this.data.forEach(v => { counts[v.lineName] = (counts[v.lineName] || 0) + 1; });
        const sorted = Object.keys(counts)
            .map(k => [k, counts[k]])
            .sort((a, b) => b[1] - a[1]);

        sorted.forEach(([lineName, cnt]) => {
            const line = findLine(lineName);
            const color = line ? line.color : '#71717a';
            const active = this.lineFilter === lineName;

            const tile = document.createElement('div');
            tile.className = 'vest-line-tile' + (active ? ' active' : '');

            const bar = document.createElement('div');
            bar.className = 'vest-line-bar';
            bar.style.background = color;

            const body = document.createElement('div');
            body.className = 'vest-line-body';

            const name = document.createElement('div');
            name.className = 'vest-line-name';
            name.textContent = lineName;

            const countRow = document.createElement('div');
            const count = document.createElement('span');
            count.className = 'vest-line-count';
            count.textContent = cnt;
            const lbl = document.createElement('span');
            lbl.className = 'vest-line-label';
            lbl.textContent = 'вестибюлей';
            countRow.append(count, lbl);

            body.append(name, countRow);
            tile.append(bar, body);

            tile.addEventListener('click', () => {
                this.lineFilter = this.lineFilter === lineName ? null : lineName;
                this._render();
            });

            linesWrap.appendChild(tile);
        });

        wrap.appendChild(linesWrap);

        const toolbar = document.createElement('div');
        toolbar.className = 'vest-toolbar';

        const searchWrap = document.createElement('div');
        searchWrap.className = 'vest-search-wrap';
        const searchIcon = document.createElement('span');
        searchIcon.className = 'vest-search-icon';
        searchIcon.innerHTML = SVG.search;
        const search = document.createElement('input');
        search.type = 'text';
        search.className = 'vest-search';
        search.placeholder = 'Поиск по названию, станции, округу…';
        search.value = this.query;
        const clearSearch = document.createElement('button');
        clearSearch.type = 'button';
        clearSearch.className = 'vest-search-clear' + (this.query ? ' visible' : '');
        clearSearch.innerHTML = SVG.x;
        clearSearch.setAttribute('aria-label', 'Очистить');
        clearSearch.addEventListener('click', () => {
            this.query = '';
            search.value = '';
            clearSearch.classList.remove('visible');
            this._refreshList();
        });
        search.addEventListener('input', () => {
            this.query = search.value;
            clearSearch.classList.toggle('visible', !!search.value);
            this._refreshList();
        });
        searchWrap.append(searchIcon, search, clearSearch);

        const sortSelect = document.createElement('select');
        sortSelect.className = 'ctrl-select';
        Object.keys(VEST_SORTS).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = VEST_SORTS[k].label;
            if (k === this.sortBy) opt.selected = true;
            sortSelect.appendChild(opt);
        });
        sortSelect.addEventListener('change', () => {
            this.sortBy = sortSelect.value;
            this._refreshList();
            Dashboard.saveState();
        });

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'ctrl-btn';
        clearBtn.textContent = 'Сбросить';
        clearBtn.addEventListener('click', () => {
            this.lineFilter = null;
            this.query = '';
            this.sortBy = 'name-asc';
            this._render();
        });

        toolbar.append(searchWrap, sortSelect, clearBtn);
        wrap.appendChild(toolbar);

        const meta = document.createElement('div');
        meta.className = 'vest-meta';
        meta.dataset.role = 'meta';
        wrap.appendChild(meta);

        const list = document.createElement('div');
        list.className = 'vest-list';
        list.dataset.role = 'list';
        wrap.appendChild(list);

        this._metaEl = meta;
        this._listEl = list;
        this._refreshList();

        return wrap;
    }

    _getFilteredSorted() {
        const q = (this.query || '').trim().toLowerCase();
        let list = this.data;
        if (this.lineFilter) list = list.filter(v => v.lineName === this.lineFilter);
        if (q) {
            list = list.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.station.toLowerCase().includes(q) ||
                v.area.toLowerCase().includes(q) ||
                v.lineName.toLowerCase().includes(q) ||
                v.type.toLowerCase().includes(q)
            );
        }
        const cmp = (VEST_SORTS[this.sortBy] || VEST_SORTS['name-asc']).cmp;
        return list.slice().sort(cmp);
    }

    _refreshList() {
        if (!this._metaEl || !this._listEl) return;
        const list = this._getFilteredSorted();

        const tags = [];
        if (this.lineFilter) tags.push('<span class="tag">' + esc(this.lineFilter) + '<span class="x" data-clear="line">×</span></span>');
        if (this.query) tags.push('<span class="tag">«' + esc(this.query) + '»<span class="x" data-clear="q">×</span></span>');

        this._metaEl.innerHTML =
            'Показано <b>' + list.length + '</b> из <b>' + this.data.length + '</b>' +
            (tags.length ? ' · ' + tags.join(' ') : '');

        this._metaEl.querySelectorAll('.x').forEach(el => {
            el.addEventListener('click', () => {
                const type = el.getAttribute('data-clear');
                if (type === 'line') this.lineFilter = null;
                if (type === 'q') this.query = '';
                this._render();
            });
        });

        if (!list.length) {
            this._listEl.innerHTML = '<div class="vest-empty"><b>Ничего не найдено</b>Попробуйте изменить условия поиска</div>';
            return;
        }

        this._listEl.innerHTML = list.slice(0, 300).map(v => {
            const metaParts = [];
            if (v.lineName) metaParts.push('<span>' + esc(v.lineName) + '</span>');
            if (v.station && v.station !== v.name) metaParts.push('<span>' + esc(v.station) + '</span>');
            if (v.exit) metaParts.push('<span>Выход ' + esc(v.exit) + '</span>');
            if (v.area) metaParts.push('<span>' + esc(v.area) + '</span>');
            if (v.type) metaParts.push('<span>' + esc(v.type) + '</span>');

            const isExp = this.expanded.has(v.name);
            const extraParts = [];
            if (v.station) extraParts.push('Станция: ' + esc(v.station));
            if (v.exit) extraParts.push('Номер выхода: ' + esc(v.exit));
            if (v.type) extraParts.push('Тип: ' + esc(v.type));
            if (v.area) extraParts.push('Округ: ' + esc(v.area));
            if (v.lineName) extraParts.push('Линия: ' + esc(v.lineName));

            return '<div class="vest-tile' + (isExp ? ' expanded' : '') + '" data-name="' + esc(v.name) + '">' +
                '<div class="vest-tile-accent" style="background:' + v.lineColor + '"></div>' +
                '<div class="vest-tile-content">' +
                '<div class="vest-tile-name">' + esc(v.name) + '</div>' +
                '<div class="vest-tile-meta">' + metaParts.join('') + '</div>' +
                '<div class="vest-tile-extra">' + extraParts.join(' · ') + '</div>' +
                '</div></div>';
        }).join('');

        this._listEl.querySelectorAll('.vest-tile').forEach(el => {
            el.addEventListener('click', () => {
                const n = el.getAttribute('data-name');
                if (this.expanded.has(n)) this.expanded.delete(n);
                else this.expanded.add(n);
                el.classList.toggle('expanded');
            });
        });
    }

    async load() {
        this.state = 'loading';
        this._render();
        Dashboard.setStatus('loading', 'Загрузка вестибюлей');

        try {
            const data = await getData('vestibules');
            let list = data.rows.map(normalizeVestibule).filter(v => v.name);
            if (!list.length && data.source === 'api') {
                list = DEMO[624].rows.map(normalizeVestibule);
                cache[624] = { rows: DEMO[624].rows, total: DEMO[624].total, source: 'demo' };
            }
            this.data = list;
            this.source = (cache[624] && cache[624].source) || 'demo';
            this.state = 'ok';

            Dashboard.setStatus(this.source === 'api' ? 'live' : 'demo',
                this.source === 'api' ? 'Данные API' : 'Демо-данные');
        } catch (err) {
            console.warn(err);
            this.state = 'error';
            Dashboard.setStatus('error', 'Ошибка');
        }

        this.updateSubtitle(this.getSubtitle());
        this._render();
    }

    serialize() {
        return {
            type: 'vestibules',
            id: this.id,
            collapsed: this.collapsed,
            size: this.size,
            lineFilter: this.lineFilter,
            query: this.query,
            sortBy: this.sortBy
        };
    }
}

// =============================================================
// ВИДЖЕТ: Пассажиропоток
// =============================================================
function normalizeFlow(r) {
    return {
        station: String(pick(r, ['StationName','NameOfStation','Station']) || ''),
        line: String(pick(r, ['LineName','Line','NameOfLine']) || ''),
        incoming: Number(pick(r, ['Incoming','IncomingPassengers'])) || 0,
        outgoing: Number(pick(r, ['Outgoing','OutgoingPassengers'])) || 0
    };
}

const FLOW_SORTS = {
    'total-desc': { label: 'По суммарному ↓', cmp: (a, b) => (b.incoming + b.outgoing) - (a.incoming + a.outgoing) },
    'incoming-desc': { label: 'По входящим ↓', cmp: (a, b) => b.incoming - a.incoming },
    'outgoing-desc': { label: 'По выходящим ↓', cmp: (a, b) => b.outgoing - a.outgoing },
    'diff-desc': { label: 'По сальдо |±|', cmp: (a, b) => Math.abs(b.incoming - b.outgoing) - Math.abs(a.incoming - a.outgoing) },
    'name-asc': { label: 'По названию ↑', cmp: (a, b) => a.station.localeCompare(b.station, 'ru') }
};

class FlowWidget extends UIComponent {
    constructor(id) {
        super(id, 'Пассажиропоток');
        this.state = 'idle';
        this.data = [];
        this.source = 'api';
        this.sortBy = 'total-desc';
        this.topN = 10;
        this.lineFilter = '';
        this.highlightStation = null;
        this._chart = null;
        this._bodyWrap = null;
    }

    getIconClass() { return 'icon-flow'; }
    getIconSvg() { return SVG.chart; }
    getSubtitle() {
        if (this.state === 'loading') return 'Загрузка данных…';
        if (this.state === 'error') return 'Ошибка загрузки';
        if (this.state === 'ok') {
            const src = this.source === 'api' ? 'данные API' : 'демо-данные';
            return 'Топ-' + this.topN + ' станций · ' + src;
        }
        return 'Входящий и выходящий поток';
    }

    renderBody() {
        const wrap = document.createElement('div');
        this._bodyWrap = wrap;
        this._render();
        return wrap;
    }

    onMount() {
        if (this.state === 'idle') this.load();
    }

    refreshTheme() {
        this._rebuildChart();
    }

    _render() {
        if (!this._bodyWrap) return;
        this._bodyWrap.innerHTML = '';

        if (this.state === 'idle' || this.state === 'loading') {
            this._bodyWrap.appendChild(this._makeLoader('Загружаем пассажиропоток…'));
            return;
        }
        if (this.state === 'error') {
            this._bodyWrap.appendChild(this._makeError('Не удалось получить данные', () => this.load()));
            return;
        }

        this._bodyWrap.appendChild(this._makeContent());
    }

    _makeLoader(text) {
        const wrap = document.createElement('div');
        wrap.className = 'state';
        const s = document.createElement('div');
        s.className = 'spinner';
        const t = document.createElement('div');
        t.className = 'state-text';
        t.textContent = text;
        wrap.append(s, t);
        return wrap;
    }

    _makeError(title, onRetry) {
        const wrap = document.createElement('div');
        wrap.className = 'state';
        const icon = document.createElement('div');
        icon.className = 'state-icon';
        icon.innerHTML = SVG.alert;
        const t = document.createElement('div');
        t.className = 'state-title';
        t.textContent = title;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'retry-btn';
        retry.textContent = 'Повторить';
        retry.addEventListener('click', onRetry);
        wrap.append(icon, t, retry);
        return wrap;
    }

    _getLines() {
        const lines = new Set();
        this.data.forEach(d => { if (d.line) lines.add(d.line); });
        return Array.from(lines).sort((a, b) => a.localeCompare(b, 'ru'));
    }

    _getFilteredSorted() {
        let list = this.data;
        if (this.lineFilter) list = list.filter(d => d.line === this.lineFilter);
        const cmp = (FLOW_SORTS[this.sortBy] || FLOW_SORTS['total-desc']).cmp;
        return list.slice().sort(cmp);
    }

    _makeContent() {
        const wrap = document.createElement('div');

        const toolbar = document.createElement('div');
        toolbar.className = 'flow-toolbar';

        const lineSelect = document.createElement('select');
        lineSelect.className = 'ctrl-select';
        lineSelect.innerHTML = '<option value="">Все линии</option>' +
            this._getLines().map(l => '<option value="' + esc(l) + '"' +
                (l === this.lineFilter ? ' selected' : '') + '>' + esc(l) + '</option>').join('');
        lineSelect.addEventListener('change', () => {
            this.lineFilter = lineSelect.value;
            this._render();
            Dashboard.saveState();
        });

        const sortSelect = document.createElement('select');
        sortSelect.className = 'ctrl-select';
        Object.keys(FLOW_SORTS).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = FLOW_SORTS[k].label;
            if (k === this.sortBy) opt.selected = true;
            sortSelect.appendChild(opt);
        });
        sortSelect.addEventListener('change', () => {
            this.sortBy = sortSelect.value;
            this._refreshList();
            Dashboard.saveState();
        });

        const topNSelect = document.createElement('select');
        topNSelect.className = 'ctrl-select';
        [5, 10, 15, 20, 30].forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            opt.textContent = 'Топ-' + n;
            if (n === this.topN) opt.selected = true;
            topNSelect.appendChild(opt);
        });
        topNSelect.addEventListener('change', () => {
            this.topN = Number(topNSelect.value);
            this.updateSubtitle(this.getSubtitle());
            this._rebuildChart();
            Dashboard.saveState();
        });

        toolbar.append(lineSelect, sortSelect, topNSelect);
        wrap.appendChild(toolbar);

        const legend = document.createElement('div');
        legend.className = 'flow-chart-legend';
        legend.innerHTML =
            '<span><i style="background:#10b981"></i>Входящие</span>' +
            '<span><i style="background:#ef4444"></i>Выходящие</span>';
        wrap.appendChild(legend);

        const chartWrap = document.createElement('div');
        chartWrap.className = 'flow-chart-wrap';
        const canvas = document.createElement('canvas');
        chartWrap.appendChild(canvas);
        wrap.appendChild(chartWrap);

        const count = document.createElement('div');
        count.className = 'flow-count';
        count.dataset.role = 'count';
        wrap.appendChild(count);

        const flowGrid = document.createElement('div');
        flowGrid.className = 'flow-grid';
        wrap.appendChild(flowGrid);

        this._canvas = canvas;
        this._countEl = count;
        this._listEl = flowGrid;

        queueMicrotask(() => {
            this._renderChart(canvas);
            this._refreshList();
        });

        return wrap;
    }

    _rebuildChart() {
        if (this._canvas && this._canvas.parentNode) {
            this._renderChart(this._canvas);
        }
    }

    _renderChart(canvas) {
        if (this._chart) { this._chart.destroy(); this._chart = null; }
        if (!canvas || !canvas.parentNode) return;

        const ctx = canvas.getContext('2d');
        const filtered = this.lineFilter
            ? this.data.filter(d => d.line === this.lineFilter)
            : this.data;

        const sorted = filtered.slice().sort((a, b) =>
            (b.incoming + b.outgoing) - (a.incoming + a.outgoing)
        ).slice(0, this.topN);

        const isLight = isLightTheme();
        const textColor = isLight ? '#5a6392' : '#8b93bb';
        const gridColor = isLight ? 'rgba(80,100,180,0.1)' : 'rgba(140,160,255,0.08)';
        const tooltipBg = isLight ? 'rgba(255,255,255,0.98)' : 'rgba(20,24,52,0.95)';
        const tooltipTitle = isLight ? '#1a1f3a' : '#e8ecff';
        const tooltipBorder = isLight ? 'rgba(80,100,180,0.3)' : 'rgba(140,160,255,0.28)';

        const self = this;
        this._chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(d => d.station),
                datasets: [
                    {
                        label: 'Входящие',
                        data: sorted.map(d => d.incoming),
                        backgroundColor: '#10b981',
                        hoverBackgroundColor: '#34d399',
                        borderRadius: 5,
                        borderSkipped: false,
                        barPercentage: 0.75,
                        categoryPercentage: 0.7
                    },
                    {
                        label: 'Выходящие',
                        data: sorted.map(d => d.outgoing),
                        backgroundColor: '#ef4444',
                        hoverBackgroundColor: '#f87171',
                        borderRadius: 5,
                        borderSkipped: false,
                        barPercentage: 0.75,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500 },
                onClick: (evt, elements) => {
                    if (elements.length) {
                        const idx = elements[0].index;
                        const station = sorted[idx].station;
                        self._highlightStation(station);
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: tooltipTitle,
                        bodyColor: textColor,
                        borderColor: tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: c => c.dataset.label + ': ' + num(c.parsed.y),
                            afterBody: (items) => {
                                if (!items.length) return '';
                                const d = sorted[items[0].dataIndex];
                                const diff = d.incoming - d.outgoing;
                                return '\nСальдо: ' + (diff > 0 ? '+' : '') + num(diff);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, drawBorder: false },
                        ticks: {
                            color: textColor,
                            font: { size: 11 },
                            padding: 8,
                            callback: v => num(v)
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: textColor,
                            font: { size: 11 },
                            maxRotation: 45,
                            minRotation: 0,
                            padding: 6
                        }
                    }
                }
            }
        });
    }

    _highlightStation(station) {
        this.highlightStation = (this.highlightStation === station) ? null : station;
        if (!this._listEl) return;
        this._listEl.querySelectorAll('.flow-tile').forEach(el => {
            el.classList.toggle('highlighted', el.getAttribute('data-station') === this.highlightStation);
        });
        if (this.highlightStation) {
            const el = this._listEl.querySelector('.flow-tile.highlighted');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    _refreshList() {
        if (!this._listEl) return;
        const list = this._getFilteredSorted();

        if (this._countEl) {
            this._countEl.innerHTML = 'Показано <b>' + Math.min(list.length, 30) + '</b> из <b>' + list.length + '</b> станций';
        }

        if (!list.length) {
            this._listEl.innerHTML = '<div class="vest-empty"><b>Нет данных</b>Попробуйте изменить фильтр</div>';
            return;
        }

        const maxTotal = Math.max.apply(null,
            list.map(d => d.incoming + d.outgoing).concat([1]));

        this._listEl.innerHTML = list.slice(0, 30).map(d => {
            const diff = d.incoming - d.outgoing;
            const absDiff = Math.abs(diff);
            const diffClass = absDiff < 100 ? 'neutral' : (diff > 0 ? 'positive' : 'negative');
            const diffIcon = absDiff < 100 ? '=' : (diff > 0 ? '↑' : '↓');
            const diffText = absDiff < 100 ? 'Поток сбалансирован' :
                diff > 0 ? 'Больше входят на ' + num(absDiff) :
                'Больше выходят на ' + num(absDiff);

            const inWidth = Math.min(100, (d.incoming / maxTotal) * 160);
            const outWidth = Math.min(100, (d.outgoing / maxTotal) * 160);

            return '<div class="flow-tile" data-station="' + esc(d.station) + '">' +
                '<div class="flow-tile-head">' +
                '<div class="flow-tile-name">' + esc(d.station) + '</div>' +
                (d.line ? '<div class="flow-tile-line">' + esc(d.line) + '</div>' : '') +
                '</div>' +
                '<div class="flow-bars">' +
                '<div class="flow-bar-col">' +
                '<div class="flow-bar-label">Входящие</div>' +
                '<div class="flow-bar-value in">' + num(d.incoming) + '</div>' +
                '<div class="flow-bar-track"><div class="flow-bar-fill in" style="width:' + inWidth + '%"></div></div>' +
                '</div>' +
                '<div class="flow-bar-col">' +
                '<div class="flow-bar-label">Выходящие</div>' +
                '<div class="flow-bar-value out">' + num(d.outgoing) + '</div>' +
                '<div class="flow-bar-track"><div class="flow-bar-fill out" style="width:' + outWidth + '%"></div></div>' +
                '</div>' +
                '</div>' +
                '<div class="flow-diff ' + diffClass + '">' +
                '<span class="flow-diff-icon">' + diffIcon + '</span>' +
                '<span>' + diffText + '</span>' +
                '</div>' +
                '</div>';
        }).join('');

        this._listEl.querySelectorAll('.flow-tile').forEach(el => {
            el.addEventListener('click', () => {
                this._highlightStation(el.getAttribute('data-station'));
            });
        });
    }

    async load() {
        this.state = 'loading';
        this._render();
        Dashboard.setStatus('loading', 'Загрузка пассажиропотока');

        try {
            const data = await getData('flow');
            let list = data.rows.map(normalizeFlow).filter(f =>
                f.station && (f.incoming > 0 || f.outgoing > 0));
            if (!list.length && data.source === 'api') {
                list = DEMO[62743].rows.map(normalizeFlow);
                cache[62743] = { rows: DEMO[62743].rows, total: DEMO[62743].total, source: 'demo' };
            }
            this.data = list;
            this.source = (cache[62743] && cache[62743].source) || 'demo';
            this.state = 'ok';

            Dashboard.setStatus(this.source === 'api' ? 'live' : 'demo',
                this.source === 'api' ? 'Данные API' : 'Демо-данные');
        } catch (err) {
            console.warn(err);
            this.state = 'error';
            Dashboard.setStatus('error', 'Ошибка');
        }

        this.updateSubtitle(this.getSubtitle());
        this._render();
    }

    destroy() {
        if (this._chart) { this._chart.destroy(); this._chart = null; }
        super.destroy();
    }

    serialize() {
        return {
            type: 'flow',
            id: this.id,
            collapsed: this.collapsed,
            size: this.size,
            sortBy: this.sortBy,
            topN: this.topN,
            lineFilter: this.lineFilter
        };
    }
}

// =============================================================
// DASHBOARD
// =============================================================
const STORAGE_KEY = 'moscow-dashboard-v2';

class Dashboard {
    constructor(gridEl) {
        this.gridEl = gridEl;
        this.widgets = new Map();
        this.counter = 0;
    }

    nextId(type) {
        this.counter += 1;
        return type + '-' + Date.now().toString(36) + '-' + this.counter;
    }

    hasType(type) {
        return Array.from(this.widgets.values()).some(w => {
            if (type === 'metro') return w instanceof MetroWidget;
            if (type === 'vestibules') return w instanceof VestibulesWidget;
            if (type === 'flow') return w instanceof FlowWidget;
            return false;
        });
    }

    addWidget(type, options = {}) {
        if (this.hasType(type)) {
            Dashboard.toast('Этот виджет уже добавлен', 'warn');
            return null;
        }

        let widget;
        if (type === 'metro') {
            widget = new MetroWidget(options.id || this.nextId('metro'));
            if (options.selFrom) widget.selFrom = options.selFrom;
            if (options.selTo) widget.selTo = options.selTo;
            if (options.lineFilter != null) widget.lineFilter = options.lineFilter;
            if (Array.isArray(options.history)) widget.history = options.history.slice();
        } else if (type === 'vestibules') {
            widget = new VestibulesWidget(options.id || this.nextId('vestibules'));
            if (options.lineFilter) widget.lineFilter = options.lineFilter;
            if (options.query) widget.query = options.query;
            if (options.sortBy && VEST_SORTS[options.sortBy]) widget.sortBy = options.sortBy;
        } else if (type === 'flow') {
            widget = new FlowWidget(options.id || this.nextId('flow'));
            if (options.sortBy && FLOW_SORTS[options.sortBy]) widget.sortBy = options.sortBy;
            if (typeof options.topN === 'number') widget.topN = options.topN;
            if (options.lineFilter) widget.lineFilter = options.lineFilter;
        } else {
            throw new Error('Неизвестный тип виджета: ' + type);
        }

        if (options.collapsed) widget.collapsed = true;
        if (options.size && SIZES.includes(options.size)) widget.size = options.size;

        const el = widget.render();
        el.addEventListener('widget:destroy', (e) => {
            this.removeWidget(e.detail.id);
        });

        this.gridEl.appendChild(el);
        this.widgets.set(widget.id, widget);

        this._updateEmptyState();
        this._updateToolbarState();

        if (typeof widget.onMount === 'function') {
            widget.onMount();
        }

        Dashboard.saveState();
        return widget;
    }

    removeWidget(id) {
        const widget = this.widgets.get(id);
        if (!widget) return;
        widget.destroy();
        this.widgets.delete(id);
        this._updateEmptyState();
        this._updateToolbarState();
        Dashboard.saveState();
    }

    serialize() {
        const widgets = [];
        this.gridEl.querySelectorAll('.widget').forEach(el => {
            const w = this.widgets.get(el.dataset.id);
            if (w) widgets.push(w.serialize());
        });
        return {
            counter: this.counter,
            widgets
        };
    }

    _updateEmptyState() {
        const existing = this.gridEl.querySelector('.empty-panel');
        if (this.widgets.size === 0) {
            if (!existing) {
                const empty = document.createElement('div');
                empty.className = 'empty-panel';
                empty.innerHTML =
                    '<div class="empty-icon">' + SVG.layout + '</div>' +
                    '<div class="empty-panel-title">Панель пока пуста</div>' +
                    '<div class="empty-panel-text">Выберите, что показать: интерактивную карту метро с расчётом маршрута, каталог вестибюлей или график пассажиропотока. Виджеты можно перетаскивать за ручку ⠿ и располагать рядом или друг под другом.</div>' +
                    '<div class="empty-actions"></div>' +
                    '<div class="empty-hint">Настройки и раскладка сохраняются в браузере автоматически</div>';

                const actions = empty.querySelector('.empty-actions');
                const items = [
                    { type: 'metro', label: 'Карта метро', icon: SVG.train },
                    { type: 'vestibules', label: 'Вестибюли', icon: SVG.door },
                    { type: 'flow', label: 'Пассажиропоток', icon: SVG.chart }
                ];
                items.forEach(it => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'empty-add-btn';
                    b.innerHTML = it.icon + '<span>' + it.label + '</span>';
                    b.addEventListener('click', () => {
                        try { app.addWidget(it.type); }
                        catch (e) { Dashboard.toast('Не удалось добавить виджет', 'warn'); }
                    });
                    actions.appendChild(b);
                });

                this.gridEl.appendChild(empty);
            }
        } else if (existing) {
            existing.remove();
        }
    }

    _updateToolbarState() {
        document.querySelectorAll('[data-add]').forEach(btn => {
            btn.disabled = this.hasType(btn.dataset.add);
        });
    }

    static saveState() {
        try {
            const data = app.serialize();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Не удалось сохранить состояние:', e.message);
        }
    }

    static loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return null;
            if (!Array.isArray(data.widgets)) return null;
            return data;
        } catch (e) {
            console.warn('Повреждённое сохранение, игнорируем:', e.message);
            return null;
        }
    }

    static toast(message, kind) {
        const area = document.getElementById('toastArea');
        const el = document.createElement('div');
        el.className = 'toast' + (kind ? ' ' + kind : '');
        el.textContent = message;
        area.appendChild(el);
        setTimeout(() => {
            el.style.transition = 'opacity 0.3s, transform 0.3s';
            el.style.opacity = '0';
            el.style.transform = 'translateY(-12px)';
            setTimeout(() => el.remove(), 320);
        }, 2600);
    }

    static setStatus(state, text) {
        const pill = document.getElementById('statusPill');
        const txt = document.getElementById('statusText');
        pill.dataset.state = state;
        txt.textContent = text;
    }
}

Dashboard.dragSourceId = null;
Dashboard.dragSession = null;

// Завершение drag-and-drop: возвращаем исходный размер тем виджетам,
// которые мы временно сжали до half, но которые в итоге не остались рядом
// с источником.
Dashboard.endDragSession = function () {
    const session = Dashboard.dragSession;
    if (!session) return;
    const srcEl = document.querySelector('.widget[data-id="' + session.sourceId + '"]');
    const srcW = app.widgets.get(session.sourceId);
    session.originals.forEach((origSize, id) => {
        const w = app.widgets.get(id);
        if (!w || !w.element) return;
        const adjacent = w.element.previousElementSibling === srcEl ||
                         w.element.nextElementSibling === srcEl;
        const bothHalf = w.size === 'half' && srcW && srcW.size === 'half';
        if (adjacent && bothHalf) return;
        w.setSize(origSize);
    });
    Dashboard.dragSession = null;
};

// =============================================================
// MAIN
// =============================================================
const gridEl = document.getElementById('grid');
const app = new Dashboard(gridEl);
window.app = app;

initTheme();

document.getElementById('themeToggle').addEventListener('click', () => {
    const next = isLightTheme() ? 'dark' : 'light';
    applyTheme(next);
    Dashboard.toast(next === 'light' ? 'Светлая тема' : 'Тёмная тема');
});

document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.add;
        try {
            app.addWidget(type);
        } catch (e) {
            console.error('Ошибка добавления виджета:', e);
            Dashboard.toast('Не удалось добавить виджет', 'warn');
        }
    });
});

// =============================================================
// DRAG-AND-DROP — с rAF-троттлингом, чтобы не дёргался
// =============================================================
let dragRafPending = false;
let lastDragEvent = null;

function processDragOver(e) {
    if (!Dashboard.dragSourceId) return;
    const target = e.target.closest('.widget');
    if (!target) {
        gridEl.querySelectorAll('.widget.drag-over').forEach(w => w.classList.remove('drag-over'));
        return;
    }
    if (target.dataset.id === Dashboard.dragSourceId) return;

    const source = gridEl.querySelector('.widget[data-id="' + Dashboard.dragSourceId + '"]');
    if (!source) return;

    const sourceWidget = app.widgets.get(Dashboard.dragSourceId);
    const targetWidget = app.widgets.get(target.dataset.id);
    if (!sourceWidget || !targetWidget) return;

    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    // Краевые зоны по 25%:
    //   верх/низ цели       -> стопкой (full)
    //   лево/право цели     -> рядом (half)
    //   центр цели: full    -> стопкой, иначе -> рядом
    const EDGE = 0.25;
    const inStackZone = relY < EDGE || relY > 1 - EDGE;
    const inSideZone  = relX < EDGE || relX > 1 - EDGE;

    let mode;
    if (inStackZone) mode = 'stack';
    else if (inSideZone) mode = 'side';
    else mode = (targetWidget.size === 'full') ? 'stack' : 'side';

    let insertBefore;
    if (mode === 'side') insertBefore = relX < 0.5;
    else                 insertBefore = relY < 0.5;

    if (insertBefore) {
        if (target.previousElementSibling !== source) {
            gridEl.insertBefore(source, target);
        }
    } else {
        if (target.nextElementSibling !== source) {
            gridEl.insertBefore(source, target.nextElementSibling);
        }
    }

    const session = Dashboard.dragSession;
    if (mode === 'side') {
        if (sourceWidget.size !== 'half') sourceWidget.setSize('half');
        if (targetWidget.size !== 'half') {
            if (session && !session.originals.has(targetWidget.id)) {
                session.originals.set(targetWidget.id, targetWidget.size);
            }
            targetWidget.setSize('half');
        }
    } else {
        if (sourceWidget.size !== 'full') sourceWidget.setSize('full');
    }

    gridEl.querySelectorAll('.widget.drag-over').forEach(w => {
        if (w !== target) w.classList.remove('drag-over');
    });
    target.classList.add('drag-over');
}

gridEl.addEventListener('dragover', (e) => {
    if (!Dashboard.dragSourceId) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}

    lastDragEvent = e;
    if (dragRafPending) return;
    dragRafPending = true;

    requestAnimationFrame(() => {
        dragRafPending = false;
        if (lastDragEvent && Dashboard.dragSourceId) {
            processDragOver(lastDragEvent);
        }
    });
});

gridEl.addEventListener('drop', (e) => {
    if (!Dashboard.dragSourceId) return;
    e.preventDefault();
    Dashboard.dragSourceId = null;
    gridEl.querySelectorAll('.widget.drag-over').forEach(w => w.classList.remove('drag-over'));
    Dashboard.endDragSession();
    Dashboard.saveState();
});

// =============================================================
// ВОССТАНОВЛЕНИЕ
// =============================================================
(function restore() {
    const saved = Dashboard.loadState();
    if (!saved) {
        Dashboard.setStatus('idle', 'Готово');
        app._updateEmptyState();
        app._updateToolbarState();
        return;
    }
    if (typeof saved.counter === 'number') app.counter = saved.counter;
    saved.widgets.forEach(w => {
        try {
            app.addWidget(w.type, w);
        } catch (e) {
            console.warn('Не удалось восстановить виджет:', w.type, e.message);
        }
    });
    Dashboard.setStatus('idle', 'Восстановлено');
    app._updateEmptyState();
    app._updateToolbarState();
})();