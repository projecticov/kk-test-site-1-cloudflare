/* ============================================================
   Student Hub — единый файл бэкенда для Cloudflare Workers
   Сборка: 2026-11-20 21:08 · b16c42f2
   Вставлять целиком в Dashboard → Edit code → Deploy.
   Переменные: DB (биндинг D1), GEMINI_KEYS (secret), ALLOW_ORIGIN
   ============================================================ */

(function () {
  'use strict';

  /**
   * Единый источник демо-данных.
   * Используется и фронтендом (localStorage-режим), и воркером Cloudflare
   * (первичное наполнение D1) — данные не расходятся между клиентом и сервером.
   */
  function buildSeed(nowMs) {
    const t = nowMs || Date.now();
    const DAY = 864e5;
    const iso = (d) => new Date(d).toISOString();
    const inDays = (n) => iso(t + n * DAY);

    const users = [
      { id: 'u_admin', name: 'Ирина Соколова', email: 'admin@school.ru', password: 'admin', role: 'admin', position: 'Завуч по учебной работе', city: 'Москва', school: 'Школа №1520', color: 'lavender' },
      {
        id: 'u_me', name: 'Азиз Рахимов', email: 'aziz@school.ru', password: 'demo', role: 'student',
        grade: '10 класс', city: 'Москва', school: 'Школа №1520', color: 'sun',
        skills: ['Python', 'HTML/CSS', 'Figma', 'ИИ', 'Хакатоны'], interests: ['Дизайн'], rating: 78,
        portfolio: {
          gpaScale: '5.0',
          gpa: { g8: '4.80', g9: '4.92', g10: '4.95', g11: '', g12: '' },
          english: { type: 'IELTS', score: '7.5', details: 'L 8.0 · R 8.0 · W 7.0 · S 7.5', certName: '', certData: '' },
          sat: { total: '1490', math: '780', ebrw: '710', certName: '', certData: '' },
          honors: [
            { id: 'hn1', title: 'Городская олимпиада по информатике', level: 'Regional', year: '10 класс · 2026', place: 'Призёр (2 степень)', certName: '', certData: '' },
            { id: 'hn2', title: 'Хакатон «AI для школы»', level: 'National', year: '9 класс · 2025', place: '1 место', certName: '', certData: '' }
          ],
          extracurriculars: [
            { id: 'ec1', title: 'Школьный клуб ИИ и веб-разработки', role: 'Co-Founder & Lead', period: '9–10 класс', hours: '5 ч/нед · 34 нед/год', description: 'Организация воркшопов по Python и совместная разработка школьных сервисов.', certName: '', certData: '' },
            { id: 'ec2', title: 'Волонтёрский корпус «Школа — району»', role: 'Ментор младших классов', period: '9–10 класс', hours: '3 ч/нед', description: 'Помощь ученикам 6–7 классов по информатике и математике.', certName: '', certData: '' }
          ]
        }
      },
      { id: 'u1', name: 'Мария Ковалёва', email: 'maria@school.ru', role: 'student', grade: '11 класс', city: 'Москва', school: 'Школа №1520', color: 'blush', skills: ['Математика', 'C++'], interests: ['Олимпиады'] },
      { id: 'u2', name: 'Тимур Алиев', email: 'timur@school.ru', role: 'student', grade: '10 класс', city: 'Москва', school: 'Школа №1520', color: 'sky', skills: ['React', 'Node.js'], interests: ['Веб', 'Стартапы'] },
      { id: 'u3', name: 'Дана Сеитова', email: 'dana@school.ru', role: 'student', grade: '9 класс', city: 'Москва', school: 'Школа №1520', color: 'mint', skills: ['Биология', 'Химия'], interests: ['Наука'] },
      { id: 'u4', name: 'Егор Волков', email: 'egor@school.ru', role: 'student', grade: '11 класс', city: 'Москва', school: 'Школа №1520', color: 'lavender', skills: ['Java', 'Android'], interests: ['Мобильная разработка'] },
      { id: 'u5', name: 'Алина Жукова', email: 'alina@school.ru', role: 'student', grade: '8 класс', city: 'Москва', school: 'Школа №1520', color: 'sun', skills: ['Английский'], interests: ['Эссе', 'История'] },
      { id: 'u6', name: 'Роман Гусев', email: 'roman@school.ru', role: 'student', grade: '10 класс', city: 'Москва', school: 'Школа №1520', color: 'sky', skills: ['Робототехника'], interests: ['Инженерия'] },
      { id: 'u7', name: 'Пётр Иванов', email: 'petr@school.ru', role: 'teacher', position: 'Учитель информатики', school: 'Школа №1520', color: 'mint' },
      { id: 'u8', name: 'Софья Лебедева', email: 'sofia@school.ru', role: 'student', grade: '9 класс', city: 'Москва', school: 'Школа №1520', color: 'blush', skills: ['Графический дизайн'], interests: ['Искусство'] }
    ];

    const events = [
      {
        id: 'e1', title: 'Хакатон «AI для школы»', category: 'hackathon', organizer: 'Кружок ИИ · Школа №1520',
        format: 'Онлайн', isFree: true, views: 640,
        deadlineDate: inDays(5), eligibility: '8–11 классы', location: null,
        tags: ['ИИ', 'Команда 3–4', '48 часов'], status: 'published',
        description: 'Два дня, чтобы собрать прототип, который решает настоящую задачу школы: расписание, навигация по кабинетам, помощь с домашкой. Наставники — выпускники и студенты МФТИ. Лучший проект школа внедряет у себя.'
      },
      {
        id: 'e2', title: 'Городская олимпиада по информатике', category: 'olympiad', organizer: 'Департамент образования',
        format: 'Офлайн', isFree: true, views: 1580,
        deadlineDate: inDays(9), eligibility: '7–11 классы', location: 'Москва, ул. Тверская, 12',
        tags: ['Алгоритмы', 'C++', 'Python'], status: 'published',
        description: 'Отборочный тур городской олимпиады. Два уровня сложности, победители едут на всероссийский этап. Решение задач в течение 4 часов.'
      },
      {
        id: 'e3', title: 'Летняя школа по Data Science', category: 'course', organizer: 'ВШЭ · Факультет компьютерных наук',
        format: 'Гибрид', isFree: true, views: 880,
        deadlineDate: inDays(21), eligibility: '9–11 классы', location: 'Москва / онлайн',
        tags: ['Python', 'Pandas', '3 недели'], status: 'published',
        description: 'Три недели практики: разберёшь реальный датасет, соберёшь первую модель и защитишь проект перед менторами. По итогам — сертификат и рекомендация для портфолио.'
      },
      {
        id: 'e4', title: 'Стажировка для школьников в IT-компании', category: 'internship', organizer: 'Яндекс · Образовательные проекты',
        format: 'Гибрид', isFree: false, views: 2140,
        deadlineDate: inDays(14), eligibility: '10–11 классы', location: 'Москва, офис на Льва Толстого',
        tags: ['Оплачиваемая', 'Frontend', 'Ментор'], status: 'published',
        description: 'Два месяца в команде продукта: реальные задачи, код-ревью и ментор. Нужен базовый опыт в одном из языков и желание разбираться в чужом коде.'
      },
      {
        id: 'e5', title: 'Конкурс школьных проектов «Стартап»', category: 'competition', organizer: 'Фонд «Талант»',
        format: 'Офлайн', isFree: true, views: 430,
        deadlineDate: inDays(30), eligibility: '8–11 классы', location: 'Москва, Технопарк',
        tags: ['Питч', 'Приз 100 000 ₽', 'Команда'], status: 'published',
        description: 'Питч-конкурс для школьных команд. Нужна идея, прототип и умение рассказать о ней за 3 минуты. Финалисты получают менторскую поддержку и грант на развитие.'
      },
      {
        id: 'e6', title: 'Курс по веб-разработке с нуля', category: 'course', organizer: 'Онлайн-школа Skillbox',
        format: 'Онлайн', isFree: true, views: 3020,
        deadlineDate: inDays(40), eligibility: 'Все классы', location: null,
        tags: ['HTML', 'CSS', 'JavaScript'], status: 'published',
        description: 'Самый быстрый способ собрать первое портфолио: HTML, CSS, JavaScript и один законченный сайт в конце. Домашки проверяют кураторы.'
      },
      {
        id: 'e7', title: 'Международная олимпиада по математике', category: 'olympiad', organizer: 'IMO Committee',
        format: 'Офлайн', isFree: true, views: 4100,
        deadlineDate: inDays(25), eligibility: '9–11 классы', location: 'Разные города',
        tags: ['Математика', 'Отбор'], status: 'published',
        description: 'Региональный отборочный тур. Задачи уровня IMO, шесть задач, два дня по 4,5 часа. Победители получают приглашение в национальную сборную.'
      },
      {
        id: 'e8', title: 'Школьный научный фестиваль', category: 'event', organizer: 'Школа №1520 · Научное общество',
        format: 'Офлайн', isFree: true, views: 210,
        deadlineDate: inDays(3), eligibility: 'Все классы', location: 'Актовый зал, 3 этаж',
        tags: ['Наука', 'Выставка', 'Своя школа'], status: 'published',
        description: 'Один день, чтобы показать свой проект: стенды, эксперименты и короткие выступления. Можно прийти без проекта — просто посмотреть и найти команду.'
      },
      {
        id: 'e9', title: 'Стипендия «Талант» на обучение', category: 'fellowship', organizer: 'Образовательный фонд',
        format: 'Онлайн', isFree: true, views: 1200,
        deadlineDate: inDays(18), eligibility: '9–11 классы', location: null,
        tags: ['Грант', 'Портфолио', 'Мотивационное письмо'], status: 'published',
        description: 'Ежемесячная стипендия на дополнительное обучение: языки, курсы, олимпиадные школы. Нужно портфолио достижений и мотивационное письмо на 500 слов.'
      },
      {
        id: 'e10', title: 'Инженерный буткемп: роботы', category: 'course', organizer: 'Политехнический музей',
        format: 'Офлайн', isFree: false, views: 390,
        deadlineDate: inDays(11), eligibility: '8–11 классы', location: 'Москва, Политех',
        tags: ['Робототехника', 'Ардуино', '2 недели'], status: 'published',
        description: 'Две недели в лаборатории: собираем автономного робота, программируем контроллеры, в конце — гонки на время и демо-день для родителей.'
      },
      {
        id: 'e11', title: 'Волонтёрская программа «Школа — району»', category: 'event', organizer: 'Штаб волонтёров Москвы',
        format: 'Офлайн', isFree: true, views: 140,
        deadlineDate: inDays(7), eligibility: '8–11 классы', location: 'Районные площадки',
        tags: ['Волонтёрство', 'Часы в портфолио'], status: 'published',
        description: 'Помогаем младшим классам с домашкой и проводим мастер-классы. Часы засчитываются в индивидуальные достижения.'
      },
      {
        id: 'e12', title: 'Конкурс эссе «Город будущего»', category: 'competition', organizer: 'МГУ · Школа юного журналиста',
        format: 'Онлайн', isFree: true, views: 500,
        deadlineDate: inDays(12), eligibility: '8–11 классы', location: null,
        tags: ['Эссе', 'Литература', 'Гуманитарное'], status: 'draft',
        description: 'Эссе на 3000 знаков о том, каким будет твой город через двадцать лет. Победители публикуются в школьном альманахе и получают приглашение на лекции МГУ.'
      }
    ];

    // Student Hub — агрегатор: заявок внутри нет, кнопка ведёт на сайт мероприятия.
    const EVENT_LINKS = {'e1': 'https://events.yandex.ru/', 'e2': 'https://olimpiada.ru/', 'e3': 'https://www.hse.ru/', 'e4': 'https://yandex.ru/jobs/', 'e5': 'https://olimpiada.ru/', 'e6': 'https://skillbox.ru/', 'e7': 'https://www.imo-official.org/', 'e8': 'https://polymus.ru/', 'e9': 'https://olimpiada.ru/', 'e10': 'https://polymus.ru/', 'e11': 'https://dobro.ru/', 'e12': 'https://www.msu.ru/'};
    events.forEach((ev) => { ev.link = EVENT_LINKS[ev.id] || ''; });

    const posts = [
      { id: 'p1', authorId: 'u2', text: 'Ищу двух человек в команду на хакатон «AI для школы». Нужен дизайнер и кто-нибудь, кто умеет говорить с людьми 😅 Пишите в личку.', createdAt: iso(t - 2 * 3600e3), likes: 14, replies: 3, status: 'published', tag: 'Поиск команды' },
      { id: 'p2', authorId: 'u1', text: 'Кто-нибудь готовится к городской олимпиаде по информатике? Разбираю задачи прошлых лет, могу объяснить, как решать задачу про графы. Собираемся в 105 кабинете.', createdAt: iso(t - 26 * 3600e3), likes: 22, replies: 7, status: 'published', tag: 'Учёба' },
      { id: 'p3', authorId: 'u3', text: 'Разобрала стипендию «Талант»: дедлайн 20 ноября, нужны два письма и портфолио. Кто идёт — давайте вместе вычитывать мотивационные письма, глаза замыливаются.', createdAt: iso(t - 3 * DAY), likes: 9, replies: 4, status: 'published', tag: 'Стипендия' },
      { id: 'p4', authorId: 'u5', text: 'Продаю решённые варианты ЕГЭ по истории. Пишите, недорого.', createdAt: iso(t - 4 * DAY), likes: 1, replies: 0, status: 'flagged', tag: '' }
    ];

    const teams = [
      { id: 'tm1', title: 'Команда на хакатон «AI для школы»', description: 'Нужен фронтенд и дизайнер. Есть идея: PWA, которая заменяет школьный дневник и добавляет ИИ-подбор мероприятий.', type: 'Хакатон', spotsOpen: 2, tags: ['ИИ', 'Web', 'PWA'], leadId: 'u2', members: ['u2'], createdAt: iso(t - 2 * 3600e3), status: 'open' },
      { id: 'tm2', title: 'Проект на конкурс «Стартап»', description: 'Ищем человека с опытом в экономике — посчитать unit-экономику и собрать финансовую модель для питча.', type: 'Конкурс', spotsOpen: 1, tags: ['Стартапы', 'Питч', 'Экономика'], leadId: 'u4', members: ['u4', 'u6'], createdAt: iso(t - 2 * DAY), status: 'open' },
      { id: 'tm3', title: 'Школьный научный стенд', description: 'Делаем стенд про микропластик в воде. Нужны биологи и один человек, который оформит постер.', type: 'Фестиваль', spotsOpen: 2, tags: ['Наука', 'Биология', 'Оформление'], leadId: 'u3', members: ['u3', 'u8'], createdAt: iso(t - 3 * DAY), status: 'open' }
    ];

    const chats = [
      { id: 'c1', title: 'AI для школы · команда', memberIds: ['u_me', 'u2', 'u8'], lastAt: iso(t - 40 * 60e3), unread: 2,
        messages: [
          { id: 'm1', authorId: 'u2', text: 'Привет! Закинул структуру прототипа, посмотрите в репозитории.', at: iso(t - 5 * 3600e3) },
          { id: 'm2', authorId: 'u8', text: 'Вижу, красиво. А если сделать установку на главный экран прямо из шапки?', at: iso(t - 4 * 3600e3) },
          { id: 'm3', authorId: 'u_me', text: 'Да, сделаем баннер + инструкцию на три шага. Главное — чтобы ставилось в один тап.', at: iso(t - 2 * 3600e3) },
          { id: 'm4', authorId: 'u2', text: 'Ок. Тогда я беру админку и подключение данных.', at: iso(t - 50 * 60e3) },
          { id: 'm5', authorId: 'u8', text: 'Скиньте, где смотреть кейсы, я подготовлю вопросы ментору.', at: iso(t - 40 * 60e3) }
        ] },
      { id: 'c2', title: 'Олимпиадники · информатика', memberIds: ['u_me', 'u1', 'u4'], lastAt: iso(t - 6 * 3600e3), unread: 0,
        messages: [
          { id: 'm1', authorId: 'u1', text: 'Сегодня разбираем задачу про дерево отрезков, приходите в 105.', at: iso(t - 7 * 3600e3) },
          { id: 'm2', authorId: 'u_me', text: 'Буду. Можно мне прошлогодние варианты?', at: iso(t - 6 * 3600e3) }
        ] },
      { id: 'c3', title: 'Классный руководитель', memberIds: ['u_me', 'u_admin'], lastAt: iso(t - 2 * DAY), unread: 0,
        messages: [
          { id: 'm1', authorId: 'u_admin', text: 'Напоминаю: школьный фестиваль в пятницу, сбор участников в 15:00 в актовом зале.', at: iso(t - 2 * DAY) }
        ] }
    ];

    /* ── роадмап: вехи, марафоны и задачи дня ──
       даты считаем от текущего момента, поэтому демо всегда «живое» */
    const at = (dayOffset, hh, mm) => {
      const d = new Date(t + dayOffset * DAY);
      d.setHours(hh || 0, mm || 0, 0, 0);
      return iso(d);
    };

    const plan = [
      { id: 'p_sat', userId: 'u1', kind: 'track', title: 'Марафон подготовки к SAT',
        note: 'Математика и Reading по будням, в субботу — полный пробник.',
        startAt: at(-34), endAt: at(26), color: 'sun', done: 0,
        checklist: [
          { id: 'ch1', text: 'Неделя 1 · Math Grid-ins', done: 1 },
          { id: 'ch2', text: 'Неделя 2 · Reading History Passages', done: 1 },
          { id: 'ch3', text: 'Неделя 3 · Пробный тест 1400+', done: 0 },
          { id: 'ch4', text: 'Неделя 4 · Разбор ошибок', done: 0 }
        ] },
      { id: 'p_ielts', userId: 'u1', kind: 'milestone', title: 'Сдача IELTS', note: 'Регистрация закрылась, место подтверждено.',
        startAt: at(-50, 9, 0), endAt: '', color: 'sky', done: 1, eventId: '' },
      { id: 'p_hack', userId: 'u1', kind: 'milestone', title: 'Дедлайн подачи на хакатон kk.', note: 'Загрузить проект и ссылку на репозиторий.',
        startAt: at(17, 23, 59), endAt: '', color: 'blush', done: 0, eventId: '' },
      { id: 'p_boot', userId: 'u1', kind: 'track', title: 'Олимпиадный буткемп', note: 'Выездная смена перед региональным этапом.',
        startAt: at(28), endAt: at(38), color: 'lavender', done: 0, checklist: [] },
      { id: 'p_zerde', userId: 'u1', kind: 'milestone', title: 'Дедлайн Zerde', note: 'Стипендия на обучение за рубежом.',
        startAt: at(109, 23, 59), endAt: '', color: 'mint', done: 0, eventId: '' },
      { id: 'p_intern', userId: 'u1', kind: 'track', title: 'Стажировка в стартапе', note: 'Летний трек по продукту, 3 месяца.',
        startAt: at(210), endAt: at(300), color: 'mint', done: 0,
        checklist: [{ id: 'ch1', text: 'Собрать портфолио', done: 0 }, { id: 'ch2', text: 'Пройти интервью', done: 0 }] },
      { id: 'p_common', userId: 'u1', kind: 'milestone', title: 'Подача Common App', note: 'Эссе + рекомендации.',
        startAt: at(400, 23, 59), endAt: '', color: 'sky', done: 0, eventId: '' },
      { id: 'p_t1', userId: 'u1', kind: 'task', title: 'Урок физики', note: 'Кабинет 205',
        startAt: at(0, 15, 0), endAt: '', color: 'sky', done: 0 },
      { id: 'p_t2', userId: 'u1', kind: 'task', title: 'Созвон с командой kk.', note: 'Разобрать прототип роадмапа',
        startAt: at(0, 18, 0), endAt: '', color: 'lavender', done: 0 },
      { id: 'p_t3', userId: 'u1', kind: 'task', title: 'Дописать абстракт проекта', note: 'До 23:59 в форме',
        startAt: at(0, 22, 30), endAt: '', color: 'blush', done: 0 },
      { id: 'p_t4', userId: 'u1', kind: 'task', title: 'Разбор задач SAT Math', note: 'Блок grid-ins',
        startAt: at(1, 10, 0), endAt: '', color: 'sun', done: 0 },
      { id: 'p_t5', userId: 'u1', kind: 'task', title: 'Дописать мотивационное письмо', note: '',
        startAt: at(3, 19, 0), endAt: '', color: 'mint', done: 0 },

      { id: 'p_me1', userId: 'u_me', kind: 'track', title: 'Курс по веб-разработке', note: 'Модули 1–4, по 3 часа в неделю',
        startAt: at(-20), endAt: at(25), color: 'sky', done: 0,
        checklist: [{ id: 'ch1', text: 'Модуль 1 · HTML', done: 1 }, { id: 'ch2', text: 'Модуль 2 · CSS', done: 1 }, { id: 'ch3', text: 'Модуль 3 · JS', done: 0 }] },
      { id: 'p_me2', userId: 'u_me', kind: 'milestone', title: 'Городская олимпиада', note: 'Отборочный этап',
        startAt: at(8, 10, 0), endAt: '', color: 'mint', done: 0, eventId: '' },
      { id: 'p_me3', userId: 'u_me', kind: 'task', title: 'Выступить с проектом на фестивале', note: 'Актовый зал, 15:00',
        startAt: at(2, 15, 0), endAt: '', color: 'sun', done: 0 }
    ];

    const goals = [
      { id: 'g1', userId: 'u_me', title: 'Поступить на IT-направление в вузы', createdAt: iso(t - 12 * DAY) }
    ];

    const tasks = [
      { id: 'tk1', goalId: 'g1', userId: 'u_me', title: 'Собрать портфолио из 3 проектов', dateLabel: 'до 20 ноября', status: 'done' },
      { id: 'tk2', goalId: 'g1', userId: 'u_me', title: 'Пройти курс по веб-разработке', dateLabel: 'до 5 декабря', status: 'done' },
      { id: 'tk3', goalId: 'g1', userId: 'u_me', title: 'Зарегистрироваться на городскую олимпиаду', dateLabel: 'до 11 ноября', status: 'current' },
      { id: 'tk4', goalId: 'g1', userId: 'u_me', title: 'Выступить с проектом на школьном фестивале', dateLabel: '14 ноября', status: 'planned' },
      { id: 'tk5', goalId: 'g1', userId: 'u_me', title: 'Подготовить мотивационное письмо на стипендию', dateLabel: 'до 20 ноября', status: 'planned' }
    ];

    return {
      version: 1,
      users,
      events,
      posts,
      teams,
      chats,
      goals,
      tasks,
      plan,
      // стартовое состояние — гость. Вход только через экран авторизации
      // (в облаке — по токену из /api/auth/login, офлайн — по локальной проверке)
      session: { userId: null },
      settings: { theme: 'system', installDismissed: false, onboardingDone: false },
      meta: { seededAt: iso(t), mode: 'demo' }
    };
  }

  if (typeof globalThis !== 'undefined') globalThis.buildSeed = buildSeed;
  if (typeof window !== 'undefined') {
    window.SH = window.SH || {};
    window.SH.buildSeed = buildSeed;
  }
})();


/**
 * ============================================================================
 *  Student Hub API — бэкенд для Cloudflare Workers (D1)
 * ============================================================================
 *  Один файл: схема, миграции, сид демо-данных, авторизация, API, прокси Gemini.
 *
 *  Роли:
 *    root  — один. Управляет админами и всеми пользователями. Его не может
 *            менять никто, кроме него самого (и только пароль/профиль).
 *    admin — много. Управляет учениками, событиями, заявками, модерацией,
 *            ИИ-ключами. Не видит root в списках и не может его трогать.
 *    student — обычный пользователь.
 *
 *  Переменные окружения (Settings → Variables and Secrets):
 *    DB            — Bindings → D1 database (именно биндинг, не Variable!)
 *    ALLOW_ORIGIN  — адрес сайта или *
 *    GEMINI_KEYS   — секрет, ключи через запятую (резерв)
 *    ROOT_PASSWORD — необязательно: переопределить пароль root
 * ============================================================================
 */

/* ───────────────────────── базовое ───────────────────────── */

const BUILD = '2026-11-20 21:08 · b16c42f2';

const CORS = (o) => ({
  'access-control-allow-origin': o,
  'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-max-age': '86400',
  vary: 'origin'
});

const json = (data, status = 200, origin = '*') =>
  new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, CORS(origin))
  });

const uid = (p) => p + '_' + crypto.randomUUID().slice(0, 8);
const nowISO = () => new Date().toISOString();
const K = (v) => JSON.stringify(v == null ? null : v);
const P = (v, d) => { try { return v ? JSON.parse(v) : d; } catch { return d; } };
const str = (v, n) => String(v == null ? '' : v).slice(0, n || 2000).trim();

/* ───────────────────────── крипто ───────────────────────── */

const enc = new TextEncoder();
const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (t) => hex(await crypto.subtle.digest('SHA-256', enc.encode(t)));

async function hashPassword(password, saltHex) {
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 10000, hash: 'SHA-256' }, key, 256);
  return hex(bits);
}

const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Одноразовый пароль: 4 группы по 4 символа без похожих букв. */
function makeOtp() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = Array.from(bytes).map((b) => alphabet[b % alphabet.length]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12), chars.slice(12, 16)].map((g) => g.join('')).join('-');
}

/* ───────────────────────── root ───────────────────────── */

const ROOT_ID = 'u_root';
const ROOT_SALT = 'c2332e8f9194634b14f32de9ddd925d1';
const ROOT_HASH = 'd8ba72046f56b32ad54164ee378b6e79377c630419952debe90c48d6a16bdfbc';
const ROOT_LOGINS = ['root', 'admin'];

/* Что входит в полный бэкап (сессии и одноразовые коды не переносим) */
const BACKUP_TABLES = [
  'users', 'user_logins', 'events', 'posts', 'post_likes', 'post_comments',
  'teams', 'team_members', 'chats', 'chat_members', 'messages',
  'goals', 'tasks', 'plan_items', 'ai_keys', 'ai_prompts'
];

/* Ключ для служебных эндпоинтов (/api/health, /api/ping).
   Подставляется при сборке; без ключа эти адреса отвечают «ничего не найдено». */
const TEST_KEY = 'c83bf189d186acab6dfb175f6d6189254b038319dcae1fb2';

const noKey = (origin) => json({ ok: false, error: 'Не найдено' }, 404, origin);
const keyOk = (url) => {
  const given = String(url.searchParams.get('key') || '');
  if (!TEST_KEY || TEST_KEY.startsWith('__')) return false;
  return given.length === TEST_KEY.length && safeEqual(given, TEST_KEY);
};

/* ───────────────────────── схема ───────────────────────── */

const TABLES = [
  `create table if not exists users (
    id text primary key, name text, email text, pass text, pass_hash text, salt text,
    role text default 'student', grade text, school text, city text, color text,
    position text, rating integer default 0, avatar text, blocked integer default 0,
    skills text default '[]', interests text default '[]', created_at text)`,
  `create table if not exists user_logins (login text primary key, user_id text, created_at text)`,
  `create table if not exists sessions (id text primary key, user_id text, created_at text, expires_at text, ua text)`,
  `create table if not exists otp_codes (
    id text primary key, user_id text, code_hash text, salt text, expires_at text,
    used integer default 0, created_by text, created_at text)`,
  `create table if not exists events (
    id text primary key, title text, category text default 'event', organizer text,
    description text, deadline_date text, format text, eligibility text, location text,
    is_free integer default 1, image text, priority integer default 0, link text,
    tags text default '[]', status text default 'published',
    applicants integer default 0, views integer default 0, created_at text)`,
  `create table if not exists applications (
    id text primary key, event_id text, user_id text, status text default 'pending',
    created_at text, updated_at text, note text, unique(event_id, user_id))`,
  `create table if not exists saved_events (
    user_id text, event_id text, created_at text, primary key (user_id, event_id))`,
  `create table if not exists posts (
    id text primary key, author_id text, text text, tag text, status text default 'published',
    likes integer default 0, created_at text, resolved_at text)`,
  `create table if not exists post_likes (post_id text, user_id text, primary key (post_id, user_id))`,
  `create table if not exists post_comments (
    id text primary key, post_id text, author_id text, text text, created_at text, edited_at text)`,
  `create table if not exists teams (
    id text primary key, title text, description text, type text, spots_open integer default 1,
    lead_id text, tags text default '[]', status text default 'open', created_at text)`,
  `create table if not exists team_members (team_id text, user_id text, created_at text, primary key (team_id, user_id))`,
  `create table if not exists chats (id text primary key, title text, kind text default 'group', unread integer default 0, last_at text)`,
  `create table if not exists chat_members (chat_id text, user_id text, primary key (chat_id, user_id))`,
  `create table if not exists messages (id text primary key, chat_id text, author_id text, text text, created_at text, edited_at text)`,
  `create table if not exists goals (id text primary key, user_id text, title text, created_at text)`,
  `create table if not exists tasks (id text primary key, goal_id text, user_id text, title text, date_label text, status text default 'planned')`,
  `create table if not exists plan_items (
    id text primary key, user_id text, kind text default 'task', title text, note text,
    start_at text, end_at text, done integer default 0, event_id text,
    checklist text default '[]', color text default 'sky', created_at text, updated_at text)`,
  `create table if not exists ai_keys (
    id text primary key, label text, secret text, endpoint text, enabled integer default 1,
    last_status text, last_checked text, last_response text, used_count integer default 0, created_at text)`,
  `create table if not exists ai_prompts (
    key text primary key, title text, where_used text, template text, updated_at text)`,
  `create table if not exists audit_log (
    id text primary key, actor_id text, action text, target text, detail text, created_at text)`,
  `create table if not exists organizations (
    id text primary key, name text, plan text default 'agency', city text, contact text,
    status text default 'active', manager_id text, note text, created_at text)`,
  `create table if not exists org_slots (
    id text primary key, org_id text, student_id text, title text, note text,
    date text, kind text default 'internal', done integer default 0,
    created_by text, created_at text)`,
  `create table if not exists org_students (
    user_id text primary key, mentor_id text, tags text, grade text,
    gpa text, gpa_note text, sat text, sat_note text, ielts text, ielts_note text,
    goal text, goal_note text, status text default 'plan', template_id text, updated_at text)`,
  `create table if not exists org_portfolio (
    id text primary key, user_id text, kind text, title text, note text, year text,
    created_at text)`,
  `create table if not exists roadmap_templates (
    id text primary key, org_id text, title text, tags text, grade text, items text,
    created_at text)`,
  `create table if not exists push_subs (
    id text primary key, user_id text, endpoint text, p256dh text, auth text, created_at text)`,
  `create table if not exists org_sprints (
    id text primary key, org_id text, user_id text, project text, title text,
    start_date text, end_date text, status text default 'plan', created_at text)`,
  `create table if not exists org_tag_groups (
    id text primary key, org_id text, title text, tags text, created_at text)`,
  `create table if not exists org_reports (
    id text primary key, user_id text, period text, comment text, payload text,
    created_by text, created_at text)`,
  `create table if not exists meta (key text primary key, value text)`
];

const COLUMNS = [
  ['users', 'pass_hash', 'text'], ['users', 'salt', 'text'], ['users', 'avatar', 'text'],
  ['users', 'blocked', 'integer default 0'],
  ['events', 'image', 'text'], ['events', 'priority', 'integer default 0'], ['events', 'link', 'text'],
  ['applications', 'updated_at', 'text'], ['applications', 'note', 'text'],
  ['posts', 'resolved_at', 'text'],
  ['messages', 'edited_at', 'text'],
  ['chats', 'kind', "text default 'group'"],
  ['ai_keys', 'endpoint', 'text'], ['ai_keys', 'last_response', 'text'],
  ['users', 'org_id', 'text'],
  ['organizations', 'note', 'text'], ['organizations', 'status', "text default 'active'"],
  ['users', 'org_role', 'text'],
  ['org_students', 'template_id', 'text'],
  ['org_slots', 'importance', "text default 'middle'"],
  ['org_slots', 'notify', 'integer default 0'],
  ['org_portfolio', 'file_name', 'text'],
  ['org_portfolio', 'file_size', 'integer default 0'],
  ['org_portfolio', 'file_data', 'text'],
  ['users', 'portfolio', 'text'],
  ['teams', 'invite_code', 'text'],
  ['messages', 'attachment', 'text'],
  ['plan_items', 'chat_id', 'text']
];

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/* ───────────────────────── Web Push: RFC 8291 + VAPID ───────────────────────── */

const b64u = {
  enc(buf) {
    const b = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(str) {
    const s = atob(String(str).replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
};

async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8);
  return new Uint8Array(bits);
}

function concatBytes(...arrs) {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}

/** Шифрует payload для одной push-подписки. */
async function encryptPush(payload, p256dh, auth) {
  const uaPublic = b64u.dec(p256dh);
  const authSecret = b64u.dec(auth);
  const asKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));

  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256));

  const prk = await hkdf(authSecret, shared, concatBytes(new TextEncoder().encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, prk, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, prk, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  // один рекорд: payload + 0x02 (последний) + паддинг
  const data = concatBytes(new TextEncoder().encode(payload), new Uint8Array([2]));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, data));

  // заголовок: salt(16) | rs(4) | idlen(1) | keyid(asPublic 65)
  const rs = new Uint8Array([0, 0, 16, 0]);
  const head = concatBytes(salt, rs, new Uint8Array([asPublic.length]), asPublic);
  return { body: concatBytes(head, cipher), asPublic };
}

/** VAPID JWT (ES256) для endpoint'а. */
async function vapidAuth(env, endpoint, subject) {
  const pub = env.VAPID_PUBLIC_KEY;
  const privJwk = env.VAPID_PRIVATE_JWK;
  if (!pub || !privJwk) return null;
  const aud = new URL(endpoint).origin;
  const header = b64u.enc(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const claims = b64u.enc(new TextEncoder().encode(JSON.stringify({ aud, exp, sub: subject || 'mailto:agent@studenthub.local' })));
  const unsigned = header + '.' + claims;
  const key = await crypto.subtle.importKey('jwk', typeof privJwk === 'string' ? JSON.parse(privJwk) : privJwk,
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned)));
  return 'vapid t=' + unsigned + '.' + b64u.enc(sig) + ', k=' + pub;
}

/** Отправить одно уведомление на подписку. */
async function sendPush(env, sub, payload, subject) {
  try {
    const auth = await vapidAuth(env, sub.endpoint, subject);
    if (!auth) return { ok: false, error: 'vapid не настроен' };
    const { body } = await encryptPush(payload, sub.p256dh, sub.auth);
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: '86400',
        Urgency: 'normal'
      },
      body
    });
    if (res.status === 404 || res.status === 410) {
      await env.DB.prepare('delete from push_subs where id=?').bind(sub.id).run();
      return { ok: false, gone: true };
    }
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

/** Напоминания: события в ближайшие 48 часов и просроченные. */
async function pushDigest(env, opts) {
  const only = opts && opts.userId;
  const rows = only
    ? await env.DB.prepare('select * from push_subs where user_id=?').bind(only).all()
    : await env.DB.prepare('select * from push_subs limit 500').all();
  const subs = rows.results || [];
  if (!subs.length) return { ok: true, sent: 0 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const until = new Date(today.getTime() + 2 * 86400000);
  let sent = 0;
  for (const sub of subs) {
    const slots = await env.DB.prepare(
      'select * from org_slots where student_id=? and done=0 order by date limit 60').bind(sub.user_id).all();
    const soon = (slots.results || []).filter((s) => {
      const d = new Date(String(s.date).slice(0, 10) + 'T00:00:00');
      return d >= today && d <= until;
    });
    if (!soon.length) continue;
    const first = soon[0];
    const payload = JSON.stringify({
      title: soon.length === 1 ? 'Дело на носу: ' + first.title : soon.length + ' дела на ближайшие 48 часов',
      body: soon.length === 1
        ? 'Срок — ' + first.date + (first.importance === 'high' ? ' · высокий приоритет' : '')
        : 'Ближайшее: ' + first.title + ' · ' + first.date,
      url: './#/roadmap'
    });
    const r = await sendPush(env, sub, payload);
    if (r.ok) sent += 1;
  }
  return { ok: true, sent };
}

/* ───────────────────────── системные промты для ИИ ───────────────────────── */

const DEFAULT_PROMPTS = [
  {
    key: 'plan',
    title: 'План развития ученика',
    where: 'Роадмап → кнопка «Собрать план»',
    template: `Ты помогаешь школьнику составить план достижения цели.
Цель ученика: {{goal}}.
Класс: {{grade}}. Навыки: {{skills}}. Интересы: {{interests}}.
Составь ровно 5 конкретных шагов на пути к цели.
Каждый шаг — одна строка, до 60 символов, с глаголом действия, без нумерации.
Последняя строка — про ближайший месяц.`
  },
  {
    key: 'why',
    title: 'Почему событие подходит',
    where: 'Карточка события → «Почему это тебе»',
    template: `Ты карьерный помощник школьника.
Событие: {{event}}. Описание: {{description}}. Теги: {{tags}}.
Ученик: {{grade}}, навыки {{skills}}, интересы {{interests}}.
Объясни в 1–2 предложениях, почему это событие ему подходит. Без воды и общих слов.`
  },
  {
    key: 'digest',
    title: 'Сводка для администратора',
    where: 'Админка → Обзор → кнопка «ИИ-сводка»',
    template: `Ты аналитик школьной платформы.
Данные: {{stats}}.
Напиши короткую сводку: что происходит в школе и на что стоит обратить внимание.
3 предложения, по-русски, без списков.`
  }
];

/* ───────────────────────── инициализация ───────────────────────── */

let ready = false;

async function ensureReady(env) {
  if (ready) return;

  await env.DB.batch(TABLES.map((q) => env.DB.prepare(q)));

  for (const [table, column, type] of COLUMNS) {
    const info = await env.DB.prepare(`pragma table_info(${table})`).all();
    if (!(info.results || []).some((c) => c.name === column)) {
      await env.DB.prepare(`alter table ${table} add column ${column} ${type}`).run();
    }
  }

  await ensureRoot(env);
  await seedPrompts(env);

  const row = await env.DB.prepare('select count(*) as c from events').first();
  if (!row || row.c === 0) await seedDemo(env);
  await backfillLinks(env);
  await seedPlanDemo(env);
  await normalizeMentorsAndTeams(env);

  ready = true;
}

async function normalizeMentorsAndTeams(env) {
  try {
    await env.DB.prepare("update users set role='org' where org_role='mentor' and role='student'").run();
  } catch (e) { /* ignore */ }
  try {
    const emptyTeams = await env.DB.prepare("select id from teams where invite_code is null or invite_code=''").all();
    for (const t of (emptyTeams.results || [])) {
      const code = (await sha256('kk_inv_' + t.id)).slice(0, 12);
      await env.DB.prepare('update teams set invite_code=? where id=?').bind(code, t.id).run();
    }
  } catch (e) { /* ignore */ }
  try {
    const org = await env.DB.prepare('select * from organizations order by created_at limit 1').first();
    if (org) {
      const mCount = await env.DB.prepare("select count(*) as c from users where org_id=? and org_role='mentor'").bind(org.id).first();
      if (!mCount || mCount.c === 0) {
        const salt = newSalt();
        const hash = await hashPassword('demo2026', salt);
        const demoMentors = [
          { id: 'u_kk_daniyar', name: 'Данияр Касымов', email: 'daniyar@agency.ru', color: 'mint', tags: ['сша'] },
          { id: 'u_kk_madina', name: 'Мадина Омарова', email: 'madina@agency.ru', color: 'sky', tags: ['италия'] }
        ];
        for (const dm of demoMentors) {
          await env.DB.prepare(
            `insert or ignore into users (id,name,email,pass_hash,salt,role,org_id,org_role,school,city,color,created_at)
             values (?,?,?,?,?,'org',?,'mentor',?,?,?,?)`
          ).bind(dm.id, dm.name, dm.email, hash, salt, org.id, org.name, org.city || 'Москва', dm.color, nowISO()).run();
          await env.DB.prepare('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)')
            .bind(dm.email, dm.id, nowISO()).run();
          await env.DB.prepare(
            `insert or ignore into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
             values (?,null,?,'','','','','','','','','','plan',?)`
          ).bind(dm.id, JSON.stringify(dm.tags), nowISO()).run();
        }
        await env.DB.prepare("update org_students set mentor_id='u_kk_daniyar' where user_id in ('u_kk_aliya','u_kk_timura','u_kk_sanzhar')").run();
        await env.DB.prepare("update org_students set mentor_id='u_kk_madina' where user_id in ('u_kk_aruzhan','u_kk_erlan')").run();
      }
    }
  } catch (e) { /* ignore */ }
}

async function ensureRoot(env) {
  let salt = ROOT_SALT;
  let hash = ROOT_HASH;
  if (env.ROOT_PASSWORD) {
    salt = 'env' + ROOT_SALT.slice(0, 24);
    hash = await hashPassword(String(env.ROOT_PASSWORD), salt);
  }

  const existing = await env.DB.prepare('select * from users where id=?').bind(ROOT_ID).first();
  if (!existing) {
    await env.DB.prepare(
      `insert into users (id,name,email,pass_hash,salt,role,school,city,color,position,created_at)
       values (?,?,?,?,?,'root',?,?,?,?,?)`
    ).bind(ROOT_ID, 'Владелец школы', 'owner@school.ru', hash, salt, 'Школа №1520', 'Москва',
      'lavender', 'Владелец системы', nowISO()).run();
  } else {
    // секрет и повышение роли — независимые проверки, иначе одно блокирует другое
    if (env.ROOT_PASSWORD) {
      await env.DB.prepare('update users set pass_hash=?, salt=? where id=?').bind(hash, salt, ROOT_ID).run();
    }
    if (existing.role !== 'root') {
      await env.DB.prepare("update users set role='root' where id=?").bind(ROOT_ID).run();
    }
    // техническое «Root» в интерфейсе выглядит как отладка — даём человеческое имя
    if (!existing.name || /^root$/i.test(String(existing.name).trim())) {
      await env.DB.prepare("update users set name='Владелец школы' where id=?").bind(ROOT_ID).run();
    }
    if (/^root@/i.test(String(existing.email || ''))) {
      await env.DB.prepare("update users set email='owner@school.ru' where id=?").bind(ROOT_ID).run();
    }
  }

  for (const login of ROOT_LOGINS.concat(['root@school.ru'])) {
    await env.DB.prepare('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)')
      .bind(login, ROOT_ID, nowISO()).run();
  }
}

/* ───────────────────────── демо-данные ───────────────────────── */

/* Демо-события из старых баз получают ссылку на сайт мероприятия. */
async function backfillLinks(env) {
  const missing = await env.DB.prepare("select count(*) as c from events where link is null or link=''").first();
  if (!missing || !missing.c) return;
  const s = buildSeed(Date.now());
  for (const ev of s.events) {
    if (!ev.link) continue;
    await env.DB.prepare("update events set link=? where id=? and (link is null or link='')")
      .bind(ev.link, ev.id).run();
  }
}

async function seedPrompts(env) {
  for (const pr of DEFAULT_PROMPTS) {
    await env.DB.prepare(
      'insert or ignore into ai_prompts (key,title,where_used,template,updated_at) values (?,?,?,?,?)'
    ).bind(pr.key, pr.title, pr.where, pr.template, nowISO()).run();
  }
}

async function seedDemo(env) {
  const s = buildSeed(Date.now());
  const st = [];

  for (const u of s.users) {
    const login = String(u.email || '').toLowerCase();
    if (!login) {
      st.push(env.DB.prepare(
        `insert or ignore into users (id,name,role,grade,school,city,color,skills,interests,created_at)
         values (?,?,?,?,?,?,?,?,?,?)`
      ).bind(u.id, u.name, u.role || 'student', u.grade || null, u.school || null,
        u.city || null, u.color || 'sky', K(u.skills || []), K(u.interests || []), nowISO()));
      continue;
    }
    const dup = await env.DB.prepare('select id from users where email=?').bind(login).first();
    if (dup) continue;

    const salt = newSalt();
    const hash = await hashPassword(u.password || 'demo', salt);
    const id = u.id === 'u_admin' ? 'u_admin_demo' : u.id;

    st.push(env.DB.prepare(
      `insert or ignore into users (id,name,email,pass_hash,salt,role,grade,school,city,color,position,rating,skills,interests,created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, u.name, login, hash, salt, u.role === 'admin' ? 'admin' : 'student',
      u.grade || null, u.school || null, u.city || null, u.color || 'sky',
      u.position || null, u.rating || 0, K(u.skills || []), K(u.interests || []), nowISO()));

    st.push(env.DB.prepare('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)')
      .bind(login, id, nowISO()));
  }

  s.events.forEach((e, i) => st.push(env.DB.prepare(
    `insert or ignore into events (id,title,category,organizer,description,deadline_date,format,eligibility,location,is_free,priority,link,tags,status,applicants,views,created_at)
     values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(e.id, e.title, e.category, e.organizer || null, e.description || null, e.deadlineDate,
    e.format || 'Онлайн', e.eligibility || null, e.location || null, e.isFree ? 1 : 0,
    Math.max(0, 10 - i), e.link || null, K(e.tags || []), e.status || 'published',
    e.applicants || 0, e.views || 0, nowISO())));

  s.posts.forEach((p) => st.push(env.DB.prepare(
    `insert or ignore into posts (id,author_id,text,tag,status,likes,created_at) values (?,?,?,?,?,?,?)`
  ).bind(p.id, p.authorId, p.text, p.tag || '', p.status || 'published', p.likes || 0, p.createdAt)));

  s.teams.forEach((t) => {
    st.push(env.DB.prepare(
      `insert or ignore into teams (id,title,description,type,spots_open,lead_id,tags,status,created_at)
       values (?,?,?,?,?,?,?,?,?)`
    ).bind(t.id, t.title, t.description || '', t.type || '', t.spotsOpen || 1, t.leadId,
      K(t.tags || []), t.status || 'open', t.createdAt));
    (t.members || []).forEach((m) => st.push(env.DB.prepare(
      'insert or ignore into team_members (team_id,user_id,created_at) values (?,?,?)'
    ).bind(t.id, m, nowISO())));
  });

  s.chats.forEach((c) => {
    st.push(env.DB.prepare("insert or ignore into chats (id,title,kind,unread,last_at) values (?,?,'group',?,?)")
      .bind(c.id, c.title, c.unread || 0, c.lastAt));
    (c.memberIds || []).forEach((m) => st.push(env.DB.prepare(
      'insert or ignore into chat_members (chat_id,user_id) values (?,?)'
    ).bind(c.id, m)));
    (c.messages || []).forEach((m) => st.push(env.DB.prepare(
      'insert or ignore into messages (id,chat_id,author_id,text,created_at) values (?,?,?,?,?)'
    ).bind(m.id, c.id, m.authorId, m.text, m.at)));
  });

  s.goals.forEach((g) => st.push(env.DB.prepare(
    'insert or ignore into goals (id,user_id,title,created_at) values (?,?,?,?)'
  ).bind(g.id, g.userId, g.title, g.createdAt)));

  s.tasks.forEach((t) => st.push(env.DB.prepare(
    'insert or ignore into tasks (id,goal_id,user_id,title,date_label,status) values (?,?,?,?,?,?)'
  ).bind(t.id, t.goalId, t.userId, t.title, t.dateLabel || '', t.status || 'planned')));

  (s.applications || []).forEach((a) => st.push(env.DB.prepare(
    'insert or ignore into applications (id,event_id,user_id,status,created_at) values (?,?,?,?,?)'
  ).bind(a.id, a.eventId, a.userId, a.status || 'pending', a.createdAt)));

  await env.DB.batch(st);
  await env.DB.prepare("insert or replace into meta (key,value) values ('seeded_at',?)").bind(nowISO()).run();
}

/* Демо-роадмап: наполняем один раз (даже если база была засеяна раньше). */
async function seedPlanDemo(env) {
  const done = await env.DB.prepare("select value from meta where key='plan_seeded'").first();
  if (done) return;

  const s = buildSeed(Date.now());
  const rows = (s.plan || []).filter((p) => ['u1', 'u_me'].includes(p.userId));
  if (rows.length) {
    await env.DB.batch(rows.map((p) => env.DB.prepare(
      `insert or ignore into plan_items (id,user_id,kind,title,note,start_at,end_at,done,event_id,checklist,color,created_at,updated_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(p.id, p.userId, p.kind, p.title, p.note || '', p.startAt, p.endAt || '',
      p.done ? 1 : 0, p.eventId || '', JSON.stringify(p.checklist || []), p.color || 'sky',
      nowISO(), nowISO())));
  }
  await env.DB.prepare("insert or replace into meta (key,value) values ('plan_seeded',?)").bind(nowISO()).run();
}


/* ───────────────────────── тестовые данные (кнопка владельца) ───────────────────────── */

/* Дополняет базу демо-набором: люди, события, публикации, чаты и роадмап на 4 года.
   Идентификаторы постоянные, поэтому повторный запуск ничего не дублирует. */

/* ── демо-данные кабинета kk.: менторы, карточки, портфолио, шаблоны ── */
async function seedOrgDemo(env) {
  const org = await env.DB.prepare('select * from organizations order by created_at limit 1').first();
  if (!org) return;

  const day = (n) => {
    const d = new Date(Date.now() + n * 864e5);
    return d.toISOString().slice(0, 10);
  };
  const put = async (sql, ...args) => { try { await env.DB.prepare(sql).bind(...args).run(); } catch (e) { /* колонка уже есть */ } };

  const people = [
    { name: 'Алия Нурланова', email: 'aliya@agency.ru', grade: '10', tags: ['premium', 'сша', 'курс_sat'], gpa: '4.8', gpaNote: '10 класс, 1 четверть', sat: '1380', satNote: 'пробный · цель 1500', ielts: '7.0', ieltsNote: 'пробный · 28 окт', goal: 'США', goalNote: 'STEM · 12 класс' },
    { name: 'Тимур Ахметов', email: 'timur.a@agency.ru', grade: '10', tags: ['base', 'сша'], gpa: '4.1', gpaNote: '10 класс', sat: '1190', satNote: 'пробный', ielts: '', ieltsNote: '', goal: 'США', goalNote: 'инженерия' },
    { name: 'Аружан Сейтова', email: 'aruzhan@agency.ru', grade: '12', tags: ['premium', 'италия', 'курс_ielts'], gpa: '4.6', gpaNote: '12 класс', sat: '', satNote: '', ielts: '6.5', ieltsNote: 'цель 7.0', goal: 'Италия', goalNote: 'дизайн' },
    { name: 'Ерлан Жумабаев', email: 'erlan@agency.ru', grade: '11', tags: ['base', 'италия'], gpa: '4.3', gpaNote: '11 класс', sat: '', satNote: '', ielts: '6.0', ieltsNote: 'пробный', goal: 'Италия', goalNote: 'экономика' },
    { name: 'Дана Ким', email: 'dana.k@agency.ru', grade: '10', tags: ['premium', 'корея', 'курс_sat'], gpa: '4.9', gpaNote: '10 класс', sat: '1420', satNote: 'пробный · цель 1500', ielts: '7.5', ieltsNote: 'сдано', goal: 'Корея', goalNote: 'медицина' },
    { name: 'Санжар Оспанов', email: 'sanzhar@agency.ru', grade: '12', tags: ['premium', 'сша', 'курс_ielts'], gpa: '4.0', gpaNote: '12 класс', sat: '', satNote: 'нет результата', ielts: '6.0', ieltsNote: 'цель 7.0', goal: 'США', goalNote: 'CS' }
  ];

  const salt = newSalt();
  const hash = await hashPassword('demo2026', salt);
  const demoMentors = [
    { id: 'u_kk_daniyar', name: 'Данияр Касымов', email: 'daniyar@agency.ru', color: 'mint', tags: ['сша'] },
    { id: 'u_kk_madina', name: 'Мадина Омарова', email: 'madina@agency.ru', color: 'sky', tags: ['италия'] }
  ];
  for (const dm of demoMentors) {
    await put(
      `insert or ignore into users (id,name,email,pass_hash,salt,role,org_id,org_role,school,city,color,created_at)
       values (?,?,?,?,?,'org',?,'mentor',?,?,?,?)`,
      dm.id, dm.name, dm.email, hash, salt, org.id, org.name, org.city || 'Москва', dm.color, nowISO());
    await put('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)', dm.email, dm.id, nowISO());
    await put(
      `insert or replace into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
       values (?,null,?,'','','','','','','','','','plan',?)`,
      dm.id, JSON.stringify(dm.tags), nowISO());
  }
  const mentorAssign = ['u_kk_daniyar', 'u_kk_daniyar', 'u_kk_madina', 'u_kk_madina', org.manager_id || 'u_kk_daniyar', 'u_kk_daniyar'];
  let pi = 0;
  for (const p of people) {
    const id = 'u_kk_' + p.email.split('@')[0].replace(/[^a-z0-9]/g, '');
    const assignedMentor = mentorAssign[pi++] || org.manager_id || null;
    await put(
      `insert or ignore into users (id,name,email,pass_hash,salt,role,grade,school,city,color,org_id,created_at)
       values (?,?,?,?,?,'student',?,?,?,?,?,?)`,
      id, p.name, p.email, hash, salt, p.grade, org.name, org.city || 'Москва',
      ['pink', 'mint', 'sky', 'sun', 'lavender'][id.length % 5], org.id, nowISO());
    await put('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)', p.email, id, nowISO());
    await put(
      `insert or replace into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,template_id,updated_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, assignedMentor, JSON.stringify(p.tags), p.grade, p.gpa, p.gpaNote,
      p.sat, p.satNote, p.ielts, p.ieltsNote, p.goal, p.goalNote, 'plan', null, nowISO());
  }

  const ids = people.map((p) => 'u_kk_' + p.email.split('@')[0].replace(/[^a-z0-9]/g, ''));
  const slotsBy = [
    [0, 'Пробный SAT', 4, 'milestone', 0],
    [0, 'Эссе Common App', 34, 'internal', 0],
    [0, 'Хакатон · 20 ноя', 9, 'external', 0],
    [1, 'Эссе', -3, 'milestone', 0],
    [1, 'Созвон с ментором', 6, 'internal', 0],
    [2, 'Подача документов', 9, 'milestone', 0],
    [2, 'IELTS', 26, 'external', 0],
    [3, 'Созвон с ментором', 18, 'internal', 0],
    [3, 'Портфолио', -2, 'internal', 0],
    [4, 'SAT', 20, 'external', 0],
    [4, 'Пробный IELTS', -8, 'milestone', 0],
    [5, 'Подача в вузы', -19, 'milestone', 0],
    [5, 'Созвон с ментором', 12, 'internal', 0]
  ];
  for (const [ui, title, offset, kind, done] of slotsBy) {
    const id = 'slot_kk_' + ui + '_' + title.replace(/[^a-zа-я0-9]/gi, '').slice(0, 8);
    await put(
      `insert or replace into org_slots (id,org_id,student_id,title,note,date,kind,done,created_by,created_at)
       values (?,?,?,?,?,?,?,?,?,?)`,
      id, org.id, ids[ui], title, '', day(offset), kind, done, org.manager_id, nowISO());
  }

  const pf = [
    [0, 'achievement', 'Республиканская олимпиада по математике', '3 место', '2026'],
    [0, 'achievement', 'NASA Space Apps Challenge', 'Финалист региона', '2025'],
    [0, 'achievement', 'Волонтёр STEM-клуба', '40 часов', '2025–26'],
    [0, 'project', 'Эко-датчик', 'Датчик качества воздуха для школы · команда из 3', '2026'],
    [0, 'project', 'Школьный подкаст', '12 выпусков · ведущая', '2025'],
    [0, 'certificate', 'Олимпиада, диплом.pdf', 'Загрузила ученица · сен 2026', '2026'],
    [0, 'certificate', 'Space Apps, сертификат.pdf', 'Загрузила ученица · окт 2025', '2025'],
    [0, 'certificate', 'Пробный IELTS, результат.pdf', 'Загрузил ментор · 29 окт', '2026'],
    [4, 'achievement', 'Олимпиада по химии', '2 место', '2026'],
    [4, 'project', 'Школьная лаборатория', 'Ремонт и запуск · 4 человека', '2026'],
    [2, 'project', 'Портфолио дизайнера', '12 работ', '2026']
  ];
  let n = 0;
  for (const [ui, kind, title, note, year] of pf) {
    await put('insert or replace into org_portfolio (id,user_id,kind,title,note,year,created_at) values (?,?,?,?,?,?,?)',
      'pf_kk_' + (n++), ids[ui], kind, title, note, year, nowISO());
  }

  const templates = [
    {
      id: 'tpl_kk_usa_premium', title: 'США · Premium', tags: ['сша', 'premium'], grade: '10–12',
      items: [
        { title: 'Курс SAT', month: 9, day: 1, kind: 'course', note: '10 кл · 1 окт – 10 дек' },
        { title: 'Пробный SAT', month: 11, day: 12, kind: 'date', note: '2-я суббота декабря' },
        { title: 'Курс IELTS', month: 0, day: 10, kind: 'course', note: '10 янв – 20 мар' },
        { title: 'Созвон с ментором', month: 9, day: 15, kind: 'date', note: 'каждые 2 недели' },
        { title: 'Хакатон', month: 10, day: 20, kind: 'date', note: '' }
      ]
    },
    {
      id: 'tpl_kk_usa_base', title: 'США · Base', tags: ['сша', 'base'], grade: '10–12',
      items: [
        { title: 'Курс SAT', month: 9, day: 1, kind: 'course', note: '10 кл · 1 окт – 10 дек' },
        { title: 'Пробный SAT', month: 11, day: 12, kind: 'date', note: '' },
        { title: 'Созвон с ментором', month: 8, day: 20, kind: 'date', note: 'каждые 3 недели' }
      ]
    },
    {
      id: 'tpl_kk_italy', title: 'Италия · Premium', tags: ['италия', 'premium'], grade: '11–12',
      items: [
        { title: 'Курс IELTS', month: 0, day: 10, kind: 'course', note: '10 янв – 20 мар' },
        { title: 'Портфолио', month: 2, day: 5, kind: 'date', note: 'до 5 марта' },
        { title: 'Подача документов', month: 4, day: 15, kind: 'date', note: '' }
      ]
    }
  ];
  for (const t of templates) {
    await put('insert or replace into roadmap_templates (id,org_id,title,tags,grade,items,created_at) values (?,?,?,?,?,?,?)',
      t.id, org.id, t.title, JSON.stringify(t.tags), t.grade, JSON.stringify(t.items), nowISO());
  }
}

async function seedOwnerDemo(env, ownerId) {
  const t = Date.now();
  const DAY = 864e5;
  const iso = (d) => new Date(d).toISOString();
  const inDays = (n) => iso(t + n * DAY);
  const at = (y, m, d) => new Date(y, m, d, 12, 0, 0).toISOString();
  const now = new Date();
  const sy = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;   // учебный год «сейчас»
  const base = sy - 2;                                                          // год, в котором был 9 класс

  const people = [
    { id: 'u_test_aigul', name: 'Айгуль Сафина', email: 'aigul@school.ru', grade: '9 класс', color: 'mint', skills: ['Химия', 'Биология'], interests: ['Наука'] },
    { id: 'u_test_mark', name: 'Марк Дорохов', email: 'mark@school.ru', grade: '10 класс', color: 'sky', skills: ['Python'], interests: ['Данные', 'Спорт'] },
    { id: 'u_test_lea', name: 'Лея Камалова', email: 'lea@school.ru', grade: '10 класс', color: 'blush', skills: ['Английский'], interests: ['Эссе', 'Театр'] },
    { id: 'u_test_denis', name: 'Денис Кузьмин', email: 'denis@school.ru', grade: '11 класс', color: 'lavender', skills: ['Физика'], interests: ['Инженерия'] }
  ];

  const st = [];
  for (const u of people) {
    const salt = newSalt();
    const hash = await hashPassword('demo2026', salt);
    st.push(env.DB.prepare(
      `insert or ignore into users (id,name,email,pass_hash,salt,role,grade,school,city,color,skills,interests,created_at)
       values (?,?,?,?,?,'student',?,?,?,?,?,?,?)`
    ).bind(u.id, u.name, u.email, hash, salt, u.grade, 'Школа №1520', 'Москва', u.color,
      K(u.skills), K(u.interests), nowISO()));
    st.push(env.DB.prepare('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)')
      .bind(u.email, u.id, nowISO()));
  }

  const events = [
    { id: 'vt_e1', title: 'Олимпиада «Ломоносов» по математике', category: 'olympiad', organizer: 'МГУ · Факультет ВМК', deadline: inDays(12), format: 'Онлайн + очно', tags: ['Математика', '9–11 классы'], eligibility: '9–11 классы' },
    { id: 'vt_e2', title: 'Летняя школа по анализу данных', category: 'course', organizer: 'Яндекс · Образовательные проекты', deadline: inDays(26), format: 'Онлайн', tags: ['Python', 'Данные'], eligibility: '10–11 классы' },
    { id: 'vt_e3', title: 'Конкурс школьных стартапов', category: 'competition', organizer: 'Фонд «Талант»', deadline: inDays(40), format: 'Офлайн', tags: ['Стартап', 'Команда'], eligibility: '8–11 классы' },
    { id: 'vt_e4', title: 'Стажировка в IT-компании для школьников', category: 'internship', organizer: 'Яндекс · Образовательные проекты', deadline: inDays(18), format: 'Гибрид', tags: ['Офис', 'Ментор'], eligibility: '10–11 классы' },
    { id: 'vt_e5', title: 'Инженерный буткемп: роботы', category: 'course', organizer: 'Политехнический музей', deadline: inDays(33), format: 'Офлайн', tags: ['Робототехника', 'Проект'], eligibility: '7–11 классы' },
    { id: 'vt_e6', title: 'Стипендия «Талант» на обучение', category: 'fellowship', organizer: 'Образовательный фонд', deadline: inDays(55), format: 'Онлайн', tags: ['Стипендия', 'Портфолио'], eligibility: '9–11 классы' }
  ];
  events.forEach((ev, i) => st.push(env.DB.prepare(
    `insert or ignore into events (id,title,category,organizer,description,deadline_date,format,eligibility,location,is_free,priority,link,tags,status,applicants,views,created_at)
     values (?,?,?,?,?,?,?,?,?,1,?,?,?,'published',?,?,?)`
  ).bind(ev.id, ev.title, ev.category, ev.organizer,
    'Отбор в два этапа: заявка и короткое собеседование с куратором. Участие бесплатное, ' +
    'результаты приходят на почту в течение недели.',
    ev.deadline, ev.format, ev.eligibility, null, 5 - i,
    'https://example.org/events/' + ev.id, K(ev.tags), 30 + i * 7, 120 + i * 40, nowISO())));

  const posts = [
    { id: 'vt_p1', author: 'u_test_aigul', text: 'Собираем команду на олимпиаду по химии: нужен человек на расчётные задачи.', tag: 'Команда' },
    { id: 'vt_p2', author: 'u_test_mark', text: 'Поделился конспектом по Python: разбирал списки и словари, внутри 12 задач с ответами.', tag: 'Материалы' },
    { id: 'vt_p3', author: 'u_test_lea', text: 'Кто писал мотивационное письмо на летнюю школу? Давайте вычитаем друг друга.', tag: 'Вопрос' },
    { id: 'vt_p4', author: 'u_test_denis', text: 'Собрали робота на 3D-принтере для школьной выставки — фото внутри.', tag: 'Проект' }
  ];
  posts.forEach((p, i) => st.push(env.DB.prepare(
    'insert or ignore into posts (id,author_id,text,tag,status,likes,created_at) values (?,?,?,?,\'published\',?,?)'
  ).bind(p.id, p.author, p.text, p.tag, 4 + i * 3, inDays(-(i + 1)))));

  const chats = [
    { id: 'vt_c1', title: 'Олимпиадная команда', members: ['u_test_aigul', 'u_test_mark', 'u_test_denis'],
      msgs: ['Привет! Созвон в среду в 18:00?', 'Да, я подготовлю задачи', 'Скиньте ссылку на разбор, пожалуйста'] },
    { id: 'vt_c2', title: 'Летняя школа · чат', members: ['u_test_lea', 'u_test_mark'],
      msgs: ['Кто уже отправил эссе?', 'Я дописываю последний абзац'] }
  ];
  chats.forEach((c, i) => {
    st.push(env.DB.prepare("insert or ignore into chats (id,title,kind,unread,last_at) values (?,?,'group',0,?)")
      .bind(c.id, c.title, inDays(-i)));
    c.members.forEach((m) => st.push(env.DB.prepare('insert or ignore into chat_members (chat_id,user_id) values (?,?)')
      .bind(c.id, m)));
    c.msgs.forEach((text, j) => st.push(env.DB.prepare(
      'insert or ignore into messages (id,chat_id,author_id,text,created_at) values (?,?,?,?,?)'
    ).bind(c.id + '_m' + j, c.id, c.members[j % c.members.length], text, inDays(-(j + 1)))));
  });

  /* роадмап владельца: по 2–3 пункта на каждый из четырёх лет, чтобы кольца были живыми */
  const plan = [
    { id: 'vt_r1', kind: 'track', title: 'Подготовка к ОГЭ', start: at(base, 9, 1), end: at(base + 1, 4, 31), color: 'mint', list: ['Диагностика', 'Пробный экзамен'] },
    { id: 'vt_r2', kind: 'milestone', title: 'Итоговое собеседование', start: at(base + 1, 1, 10), color: 'sky' },
    { id: 'vt_r3', kind: 'track', title: 'Летняя школа по Data Science', start: at(base + 1, 5, 1), end: at(base + 1, 6, 31), color: 'sky', list: ['Эссе', 'Тест'] },
    { id: 'vt_r4', kind: 'milestone', title: 'Выбор профиля и вузов', start: at(base + 2, 11, 20), color: 'lavender' },
    { id: 'vt_r5', kind: 'track', title: 'Марафон подготовки к SAT', start: at(base + 2, 9, 1), end: at(base + 2, 10, 30), color: 'sun', list: ['Диагностика', 'Неделя 1 · Reading', 'Неделя 2 · Math'] },
    { id: 'vt_r6', kind: 'milestone', title: 'Дедлайн подачи заявки', start: at(base + 2, 10, 21), color: 'blush' },
    { id: 'vt_r7', kind: 'milestone', title: 'Пробный экзамен', start: at(base + 3, 1, 15), color: 'sun' },
    { id: 'vt_r8', kind: 'track', title: 'Подача документов', start: at(base + 3, 4, 1), end: at(base + 3, 6, 31), color: 'lavender', list: ['Список вузов', 'Портфолио', 'Отправка'] },
    { id: 'vt_r9', kind: 'milestone', title: 'Выпускной', start: at(base + 3, 5, 25), color: 'mint' }
  ];
  plan.forEach((p) => st.push(env.DB.prepare(
    `insert or ignore into plan_items (id,user_id,kind,title,note,start_at,end_at,done,event_id,checklist,color,created_at,updated_at)
     values (?,?,?,?,'',?,?,0,'',?,?,?,?)`
  ).bind(p.id, ownerId, p.kind, p.title, p.start, p.end || '',
    JSON.stringify((p.list || []).map((text, i) => ({ id: 'c_' + p.id + '_' + i, text, done: false }))),
    p.color, nowISO(), nowISO())));

  await env.DB.batch(st);
}

/* сколько записей в основных таблицах */
async function tableCounts(db) {
  const names = ['users', 'events', 'posts', 'teams', 'chats', 'messages', 'plan_items'];
  const out = {};
  for (const n of names) {
    const r = await db.prepare('select count(*) as c from ' + n).first();
    out[n] = r ? r.c : 0;
  }
  return out;
}

/* ───────────────────────── маппинг ───────────────────────── */

const toPlan = (r) => ({
  id: r.id, userId: r.user_id, chatId: r.chat_id || '', kind: r.kind || 'task',
  title: r.title, note: r.note || '',
  startAt: r.start_at, endAt: r.end_at || '', done: !!r.done, eventId: r.event_id || '',
  checklist: P(r.checklist, []), color: r.color || 'sky'
});

const stripPortfolioBlobs = (pf) => {
  if (!pf || typeof pf !== 'object') return null;
  const certs = Array.isArray(pf.certificates)
    ? pf.certificates.map((c) => Object.assign({}, c, { fileData: c.fileData ? '__present__' : '' }))
    : [];
  const honors = Array.isArray(pf.honors)
    ? pf.honors.map((h) => Object.assign({}, h, { certData: h.certData ? '__present__' : '' }))
    : [];
  return Object.assign({}, pf, { certificates: certs, honors });
};

const toUser = (r) => ({
  id: r.id, name: r.name, email: r.email, role: r.role, grade: r.grade, school: r.school,
  city: r.city, color: r.color, position: r.position, rating: r.rating, avatar: r.avatar,
  blocked: !!r.blocked, skills: P(r.skills, []), interests: P(r.interests, []),
  portfolio: P(r.portfolio, null),
  orgId: r.org_id || null, orgRole: r.org_role || null, createdAt: r.created_at
});

const publicUser = (u, keepBlobs) => ({
  id: u.id, name: u.name, role: u.role, grade: u.grade, school: u.school, city: u.city,
  color: u.color, position: u.position, rating: u.rating, avatar: u.avatar,
  skills: u.skills, interests: u.interests,
  portfolio: keepBlobs ? (u.portfolio || null) : stripPortfolioBlobs(u.portfolio),
  orgId: u.orgId || null, orgRole: u.orgRole || null
});

const adminUser = (u) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, grade: u.grade, school: u.school,
  city: u.city, color: u.color, position: u.position, avatar: u.avatar, blocked: u.blocked,
  orgId: u.orgId || null, orgRole: u.orgRole || null, createdAt: u.createdAt
});

const toEvent = (r) => ({
  id: r.id, title: r.title, category: r.category, organizer: r.organizer,
  description: r.description, deadlineDate: r.deadline_date, format: r.format,
  eligibility: r.eligibility, location: r.location, isFree: !!r.is_free,
  image: r.image || '', priority: r.priority || 0, link: r.link || '', tags: P(r.tags, []),
  status: r.status, applicants: r.applicants || 0, views: r.views || 0
});

const toPost = (r) => ({
  id: r.id, authorId: r.author_id, text: r.text, tag: r.tag, status: r.status,
  likes: r.likes || 0, createdAt: r.created_at, resolvedAt: r.resolved_at || null
});

/* ───────────────────────── сессии и OTP ───────────────────────── */

const SESSION_DAYS = 30;

async function createSession(env, userId, ua) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await env.DB.prepare('insert into sessions (id,user_id,created_at,expires_at,ua) values (?,?,?,?,?)')
    .bind(await sha256(token), userId, nowISO(), expires, str(ua, 120)).run();
  return { token, expires };
}

async function currentUser(request, env) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const row = await env.DB.prepare('select * from sessions where id=? and expires_at > ?')
    .bind(await sha256(token), nowISO()).first();
  if (!row) return null;
  const user = await env.DB.prepare('select * from users where id=?').bind(row.user_id).first();
  if (!user || user.blocked) return null;
  return toUser(user);
}

async function audit(env, actorId, action, target, detail) {
  await env.DB.prepare('insert into audit_log (id,actor_id,action,target,detail,created_at) values (?,?,?,?,?,?)')
    .bind(uid('log'), actorId || null, action, target || null, detail || null, nowISO()).run();
}

/* ───────────────────────── вход / регистрация ───────────────────────── */

async function resolveLogin(env, login) {
  const key = str(login, 120).toLowerCase();
  if (!key) return null;
  const direct = await env.DB.prepare('select user_id from user_logins where login=?').bind(key).first();
  if (direct) return direct.user_id;
  const byEmail = await env.DB.prepare('select id from users where lower(email)=?').bind(key).first();
  return byEmail ? byEmail.id : null;
}

async function authLogin(request, env, origin, body) {
  const login = str(body.login, 120);
  const password = String(body.password || '');
  if (!login || !password) return json({ ok: false, error: 'Введите логин и пароль' }, 400, origin);

  const userId = await resolveLogin(env, login);
  if (!userId) return json({ ok: false, error: 'Неверный логин или пароль' }, 401, origin);

  const user = await env.DB.prepare('select * from users where id=?').bind(userId).first();
  if (!user) return json({ ok: false, error: 'Неверный логин или пароль' }, 401, origin);
  if (user.blocked) return json({ ok: false, error: 'Аккаунт заблокирован администратором' }, 403, origin);

  let ok = false;
  let viaOtp = false;

  if (user.pass_hash && user.salt) {
    ok = safeEqual(await hashPassword(password, user.salt), user.pass_hash);
  } else if (user.pass) {
    ok = safeEqual(password, user.pass);
  }

  // одноразовый пароль (24 часа, вход один раз)
  if (!ok) {
    const otps = await env.DB.prepare(
      'select * from otp_codes where user_id=? and used=0 and expires_at > ?'
    ).bind(userId, nowISO()).all();
    for (const row of otps.results || []) {
      if (safeEqual(await hashPassword(password.toUpperCase(), row.salt), row.code_hash)) {
        await env.DB.prepare('update otp_codes set used=1 where id=?').bind(row.id).run();
        ok = true;
        viaOtp = true;
        break;
      }
    }
  }

  if (!ok) return json({ ok: false, error: 'Неверный логин или пароль' }, 401, origin);

  const session = await createSession(env, user.id, request.headers.get('user-agent'));
  await audit(env, user.id, viaOtp ? 'login.otp' : 'login', user.id, user.name);
  return json({
    ok: true, token: session.token, expires: session.expires,
    user: publicUser(toUser(user), true), viaOtp
  }, 200, origin);
}

async function authRegister(request, env, origin, body) {
  const name = str(body.name, 120);
  const login = str(body.login, 120).toLowerCase();
  const password = String(body.password || '');

  if (name.length < 2) return json({ ok: false, error: 'Введите имя' }, 400, origin);
  if (!/^[a-z0-9._@-]{3,40}$/.test(login)) {
    return json({ ok: false, error: 'Логин: 3–40 символов, латиница, цифры, . _ - @' }, 400, origin);
  }
  if (password.length < 6) return json({ ok: false, error: 'Пароль минимум 6 символов' }, 400, origin);
  if (await resolveLogin(env, login)) return json({ ok: false, error: 'Такой логин уже занят' }, 409, origin);

  const id = uid('u');
  const salt = newSalt();
  const hash = await hashPassword(password, salt);
  const colors = ['mint', 'sky', 'sun', 'blush', 'lavender'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  await env.DB.prepare(
    `insert into users (id,name,email,pass_hash,salt,role,grade,school,city,color,created_at)
     values (?,?,?,?,?,'student',?,?,?,?,?)`
  ).bind(id, name, login.includes('@') ? login : null, hash, salt,
    str(body.grade, 40), str(body.school, 120) || 'Школа №1520', 'Москва', color, nowISO()).run();

  await env.DB.prepare('insert into user_logins (login,user_id,created_at) values (?,?,?)')
    .bind(login, id, nowISO()).run();

  const session = await createSession(env, id, request.headers.get('user-agent'));
  const user = await env.DB.prepare('select * from users where id=?').bind(id).first();
  await audit(env, id, 'register', id, name);
  return json({ ok: true, token: session.token, expires: session.expires, user: publicUser(toUser(user)) }, 201, origin);
}

async function authLogout(request, env, origin) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (token) await env.DB.prepare('delete from sessions where id=?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, origin);
}

/* ───────────────────────── снапшот ───────────────────────── */

async function bootstrap(env, origin, me) {
  const db = env.DB;
  const q = (sql) => db.prepare(sql).all();

  // ограничиваем объёмы: даже если база вырастет, ответ останется предсказуемым
  const saved = await db.prepare('select event_id from saved_events where user_id=?').bind(me.id).all();
  const aiKeys = await db.prepare('select count(*) as c from ai_keys where enabled=1').first();
  const aiEnabled = !!((aiKeys && aiKeys.c) || env.GEMINI_KEYS || env.GEMINI_KEY);

  // организации отдаём только управляющим/админам, не менторам
  const orgRows = (me && ['root', 'admin', 'org'].includes(me.role) && me.orgRole !== 'mentor')
    ? await db.prepare(
        `select o.*, u.name as manager_name,
           (select count(*) from users x where x.org_id=o.id and x.role='student' and coalesce(x.org_role,'')!='mentor') as students
         from organizations o left join users u on u.id=o.manager_id
         order by o.created_at`
      ).all()
    : { results: [] };

  const planRows = me
    ? await db.prepare(
        `select * from plan_items
          where (user_id=? and (chat_id is null or chat_id=''))
             or (chat_id is not null and chat_id != '' and chat_id in (select chat_id from chat_members where user_id=?))
          order by start_at limit 600`
      ).bind(me.id, me.id).all()
    : { results: [] };

  const [users, events, posts, goals, tasks, teams, members, chats, chatMembers, messages, comments, likes] =
    await Promise.all([
      q('select * from users order by created_at limit 500'),
      q('select * from events order by priority desc, deadline_date asc limit 300'),
      q('select * from posts order by created_at desc limit 200'),
      q('select * from goals limit 500'),
      q('select * from tasks limit 2000'),
      q('select * from teams order by created_at desc limit 100'),
      q('select * from team_members'),
      q('select * from chats order by last_at desc'),
      q('select * from chat_members'),
      q('select * from messages order by created_at desc limit 2000'),
      q('select * from post_comments order by created_at'),
      q('select * from post_likes')
    ]);

  const byChat = {};
  messages.results.slice().reverse().forEach((m) => {
    (byChat[m.chat_id] = byChat[m.chat_id] || []).push({
      id: m.id, authorId: m.author_id, text: m.text, at: m.created_at,
      editedAt: m.edited_at || null, attachment: P(m.attachment, null)
    });
  });
  Object.keys(byChat).forEach((k) => { byChat[k] = byChat[k].slice(-150); });
  const byPost = {};
  comments.results.forEach((c) => {
    (byPost[c.post_id] = byPost[c.post_id] || []).push({
      id: c.id, postId: c.post_id, authorId: c.author_id, text: c.text,
      createdAt: c.created_at, editedAt: c.edited_at || null
    });
  });
  const memByTeam = {};
  members.results.forEach((m) => (memByTeam[m.team_id] = memByTeam[m.team_id] || []).push(m.user_id));
  const memByChat = {};
  chatMembers.results.forEach((m) => (memByChat[m.chat_id] = memByChat[m.chat_id] || []).push(m.user_id));
  const likesByPost = {};
  likes.results.forEach((l) => (likesByPost[l.post_id] = (likesByPost[l.post_id] || 0) + 1));

  return json({
    ok: true, source: 'cloud', serverTime: nowISO(), build: BUILD,
    me: me ? publicUser(me, true) : null,
    users: users.results.map((u) => {
      const tu = toUser(u);
      return publicUser(tu, me && tu.id === me.id);
    }),
    events: events.results.map(toEvent),
    posts: posts.results.map((p) => Object.assign(toPost(p), {
      comments: byPost[p.id] || [], likedBy: likesByPost[p.id] || 0
    })),
    teams: teams.results.map((t) => {
      const tMembers = memByTeam[t.id] || [];
      const canInvite = !!(me && (t.lead_id === me.id || tMembers.includes(me.id)));
      return {
        id: t.id, title: t.title, description: t.description, type: t.type,
        spotsOpen: t.spots_open, leadId: t.lead_id, tags: P(t.tags, []),
        status: t.status, createdAt: t.created_at, members: tMembers,
        inviteCode: canInvite ? (t.invite_code || '') : ''
      };
    }),
    chats: chats.results.map((c) => ({
      id: c.id, title: c.title, kind: c.kind || 'group', unread: c.unread || 0,
      lastAt: c.last_at, memberIds: memByChat[c.id] || [], messages: byChat[c.id] || []
    })),
    saved: (saved.results || []).map((r) => r.event_id),
    plan: (planRows.results || []).map(toPlan),
    goals: goals.results.map((g) => ({ id: g.id, userId: g.user_id, title: g.title, createdAt: g.created_at })),
    tasks: tasks.results.map((t) => ({
      id: t.id, goalId: t.goal_id, userId: t.user_id, title: t.title,
      dateLabel: t.date_label, status: t.status
    })),
    orgs: (orgRows.results || []).map((o) => ({
      id: o.id, name: o.name, plan: o.plan || 'agency', city: o.city || '', contact: o.contact || '',
      status: o.status || 'active', managerId: o.manager_id || null, managerName: o.manager_name || '',
      students: o.students || 0, createdAt: o.created_at
    })),
    aiEnabled,
    limits: { users: 500, events: 300, posts: 200, messagesPerChat: 150 }
  }, 200, origin);
}

/* ───────────────────────── Gemini ───────────────────────── */

async function callGemini(env, prompt, model, keyOverride, endpointOverride) {
  let rows = [];
  if (keyOverride) {
    rows = [{ secret: keyOverride, endpoint: endpointOverride || '' }];
  } else {
    const fromDb = await env.DB.prepare('select secret,endpoint from ai_keys where enabled=1 order by created_at').all();
    rows = fromDb.results || [];
    if (!rows.length) {
      rows = String(env.GEMINI_KEYS || env.GEMINI_KEY || '').split(',').map((k) => k.trim()).filter(Boolean)
        .map((secret) => ({ secret, endpoint: '' }));
    }
  }
  if (!rows.length) throw new Error('Нет доступных ключей: добавьте в админке или задайте GEMINI_KEYS');

  const chosen = model || 'gemini-2.0-flash';
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const secret = rows[i].secret;
    const endpoint = (rows[i].endpoint || 'https://generativelanguage.googleapis.com/v1beta').trim();
    const openai = /\/chat\/completions|\/v1\/completions/.test(endpoint);
    let url = endpoint
      .replace(/\{key\}/g, encodeURIComponent(secret))
      .replace(/\{model\}/g, encodeURIComponent(chosen));
    let headers = { 'content-type': 'application/json' };
    let payload;
    if (openai) {
      if (!/\{key\}/.test(endpoint)) headers.authorization = 'Bearer ' + secret;
      payload = { model: chosen, messages: [{ role: 'user', content: prompt }], max_tokens: 900, temperature: 0.7 };
    } else {
      if (!/\{key\}/.test(endpoint)) {
        url = endpoint.replace(/\/$/, '') + `/models/${chosen}:generateContent?key=${encodeURIComponent(secret)}`;
      }
      payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 900 }
      };
    }

    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      const raw = await res.text();
      if (res.status === 429 || res.status === 403) { errors.push(`ключ #${i + 1}: лимит`); continue; }
      if (!res.ok) { errors.push(`ключ #${i + 1}: ${res.status} ${raw.slice(0, 120)}`); continue; }
      let data = {};
      try { data = JSON.parse(raw); } catch (e) { errors.push(`ключ #${i + 1}: не JSON`); continue; }
      const text = openai
        ? ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '')
        : ((data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [])
            .map((p) => p.text).join('');
      if (!text) { errors.push(`ключ #${i + 1}: пустой ответ`); continue; }
      return { text, key: i + 1, raw, status: res.status };
    } catch (e) {
      errors.push(`ключ #${i + 1}: ${e.message}`);
    }
  }
  const err = new Error('Все ключи недоступны: ' + errors.join('; '));
  err.raw = errors.join('\n');
  throw err;
}

/* ───────────────────────── ОСНОВНОЙ РОУТЕР ───────────────────────── */

async function api(request, env, url, origin) {
  await ensureReady(env);

  // id приходят из encodeURIComponent — декодируем, иначе кириллица в id не найдётся
  let path = url.pathname.replace(/^\/api/, '');
  try { path = decodeURIComponent(path); } catch (e) { /* уже декодировано */ }
  const method = request.method;
  const body = ['POST', 'PATCH', 'PUT'].includes(method) ? await request.json().catch(() => ({})) : {};
  const db = env.DB;
  const me = await currentUser(request, env);

  const notAuth = () => json({ ok: false, error: 'Нужен вход' }, 401, origin);
  const notAdmin = () => (me.role === 'admin' || me.role === 'root'
    ? null
    : json({ ok: false, error: 'Только для администратора' }, 403, origin));
  const notRoot = () => (me.role === 'root' ? null : json({ ok: false, error: 'Только для владельца' }, 403, origin));

  /* ── служебное: только по ключу ── */
  if (path === '/health' || path === '/ping') {
    if (!keyOk(url)) return noKey(origin);
    const [e, u, a, k] = await Promise.all([
      db.prepare('select count(*) as c from events').first(),
      db.prepare('select count(*) as c from users').first(),
      db.prepare('select count(*) as c from ai_keys where enabled=1').first(),
      db.prepare('select count(*) as c from ai_prompts').first()
    ]);
    return json({
      ok: true, service: 'student-hub-api', build: BUILD, db: true,
      events: e ? e.c : 0, users: u ? u.c : 0,
      aiKeys: a ? a.c : 0, prompts: k ? k.c : 0,
      ai: !!((a && a.c) || env.GEMINI_KEYS || env.GEMINI_KEY), time: nowISO()
    }, 200, origin);
  }

  /* ── авторизация ── */
  if (path === '/auth/login' && method === 'POST') return authLogin(request, env, origin, body);
  if (path === '/auth/register' && method === 'POST') return authRegister(request, env, origin, body);
  if (path === '/auth/logout' && method === 'POST') return authLogout(request, env, origin);

  if (path === '/auth/me') {
    if (!me) return json({ ok: false, error: 'Сессия истекла' }, 401, origin);
    return json({ ok: true, user: publicUser(me, true) }, 200, origin);
  }

  if (path === '/auth/password' && method === 'POST') {
    if (!me) return notAuth();
    const row = await db.prepare('select * from users where id=?').bind(me.id).first();
    const current = String(body.current || '');
    let ok = false;
    if (row.pass_hash && row.salt) ok = safeEqual(await hashPassword(current, row.salt), row.pass_hash);
    else if (row.pass) ok = safeEqual(current, row.pass);
    if (!ok) return json({ ok: false, error: 'Текущий пароль неверный' }, 400, origin);

    const next = String(body.next || '');
    if (next.length < 6) return json({ ok: false, error: 'Новый пароль минимум 6 символов' }, 400, origin);

    const salt = newSalt();
    await db.prepare('update users set pass_hash=?, salt=?, pass=null where id=?')
      .bind(await hashPassword(next, salt), salt, me.id).run();
    await audit(env, me.id, 'password.change', me.id);
    return json({ ok: true }, 200, origin);
  }

  if (path === '/auth/profile' && method === 'PATCH') {
    if (!me) return notAuth();
    const name = body.name != null ? (str(body.name, 120) || me.name) : me.name;
    const grade = body.grade != null ? str(body.grade, 40) : (me.grade || '');
    const school = body.school != null ? str(body.school, 120) : (me.school || '');
    const city = body.city != null ? str(body.city, 60) : (me.city || '');
    const skills = body.skills != null ? body.skills : (me.skills || []);
    const interests = body.interests != null ? body.interests : (me.interests || []);
    const avatar = body.avatar !== undefined ? (str(body.avatar, 350000) || null) : (me.avatar || null);
    const pf = body.portfolio !== undefined
      ? (body.portfolio && typeof body.portfolio === 'object' ? str(JSON.stringify(body.portfolio), 1800000) : null)
      : (me.portfolio ? JSON.stringify(me.portfolio) : null);
    await db.prepare('update users set name=?,grade=?,school=?,city=?,skills=?,interests=?,avatar=?,portfolio=? where id=?')
      .bind(name, grade, school, city, K(skills), K(interests), avatar, pf, me.id).run();
    // если ученик прикреплён к организации — синхронизируем GPA/IELTS/SAT с карточкой организации
    if (me.orgId && body.portfolio && typeof body.portfolio === 'object') {
      try {
        const curCard = await db.prepare('select * from org_students where user_id=?').bind(me.id).first();
        if (curCard) {
          const gpaObj = body.portfolio.gpa || {};
          const langObj = body.portfolio.langExam || {};
          const satObj = body.portfolio.sat || {};
          await db.prepare('update org_students set gpa=?, ielts=?, sat=?, updated_at=? where user_id=?')
            .bind(
              gpaObj.overall != null ? str(gpaObj.overall, 40) : (curCard.gpa || ''),
              langObj.score != null ? str((langObj.type ? langObj.type + ' ' : '') + langObj.score, 60).trim() : (curCard.ielts || ''),
              satObj.score != null ? str(satObj.score, 40) : (curCard.sat || ''),
              nowISO(), me.id
            ).run();
        }
      } catch (e) { /* ignore */ }
    }
    const updated = await db.prepare('select * from users where id=?').bind(me.id).first();
    return json({ ok: true, user: updated ? publicUser(toUser(updated), true) : null }, 200, origin);
  }

  /* ── публичное: ключ для push-подписки нужен до входа ── */
  if (path === '/push/key' && method === 'GET') {
    return json({ ok: true, key: env.VAPID_PUBLIC_KEY || '' }, 200, origin);
  }

  /* ── дальше только со входом: ни одна ручка не отвечает без токена ── */
  if (!me) return notAuth();

  if (path === '/bootstrap' || path === '/') {
    return bootstrap(env, origin, me);
  }

  /* ── события: чтение публичное ── */
  if (path === '/events' && method === 'GET') {
    if (!me) return notAuth();
    const list = await db.prepare("select * from events where status='published' order by priority desc, deadline_date limit 300").all();
    return json({ ok: true, events: list.results.map(toEvent) }, 200, origin);
  }

  if (path === '/events' && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const id = body.id || uid('e');
    await db.prepare(
      `insert into events (id,title,category,organizer,description,deadline_date,format,eligibility,location,is_free,image,priority,link,tags,status,applicants,views,created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?)`
    ).bind(id, str(body.title, 160) || 'Без названия', body.category || 'event',
      str(body.organizer, 120), str(body.description, 4000), body.deadlineDate || nowISO(),
      body.format || 'Онлайн', str(body.eligibility, 120), str(body.location, 160),
      body.isFree ? 1 : 0, str(body.image, 900000), Number(body.priority) || 0,
      str(body.link, 500), K(body.tags || []), body.status || 'published', nowISO()).run();
    await audit(env, me.id, 'event.create', id, body.title);
    return json({ ok: true, id }, 201, origin);
  }

  let m = path.match(/^\/events\/([^/]+)$/);
  if (m && (method === 'PATCH' || method === 'DELETE')) {
    const g = notAdmin(); if (g) return g;
    if (method === 'DELETE') {
      await db.prepare('delete from events where id=?').bind(m[1]).run();
      await audit(env, me.id, 'event.delete', m[1]);
      return json({ ok: true }, 200, origin);
    }
    const cur = await db.prepare('select * from events where id=?').bind(m[1]).first();
    if (!cur) return json({ error: 'not found' }, 404, origin);
    const e = Object.assign(toEvent(cur), body);
    await db.prepare(
      `update events set title=?,category=?,organizer=?,description=?,deadline_date=?,format=?,eligibility=?,location=?,is_free=?,image=?,priority=?,link=?,tags=?,status=? where id=?`
    ).bind(e.title, e.category, e.organizer, e.description, e.deadlineDate, e.format,
      e.eligibility, e.location, e.isFree ? 1 : 0, str(e.image, 900000),
      Number(e.priority) || 0, str(e.link, 500), K(e.tags), e.status, m[1]).run();
    await audit(env, me.id, 'event.update', m[1], e.title);
    return json({ ok: true }, 200, origin);
  }

  /* ── переход на сайт мероприятия: считаем клики ── */
  m = path.match(/^\/events\/([^/]+)\/visit$/);
  if (m && method === 'POST') {
    await db.prepare('update events set views=views+1 where id=?').bind(m[1]).run();
    return json({ ok: true }, 200, origin);
  }

  /* ── закладки на события (вместо заявок) ── */
  m = path.match(/^\/saved\/([^/]+)$/);
  if (m && method === 'POST') {
    const evId = m[1];
    const exists = await db.prepare('select 1 from saved_events where user_id=? and event_id=?')
      .bind(me.id, evId).first();
    if (exists) {
      await db.prepare('delete from saved_events where user_id=? and event_id=?').bind(me.id, evId).run();
      return json({ ok: true, saved: false }, 200, origin);
    }
    if (!(await db.prepare('select 1 from events where id=?').bind(evId).first())) {
      return json({ ok: false, error: 'Событие не найдено' }, 404, origin);
    }
    await db.prepare('insert or ignore into saved_events (user_id,event_id,created_at) values (?,?,?)')
      .bind(me.id, evId, nowISO()).run();
    return json({ ok: true, saved: true }, 200, origin);
  }

  /* ── заявки ── */
  /* ── заявки убраны: платформа — агрегатор, заявки подаются на сайте мероприятия ── */
  if (path.startsWith('/applications') || path.startsWith('/admin/applications')) {
    return json({ ok: false, error: 'Заявки отключены: переходите на сайт мероприятия' }, 410, origin);
  }

  /* ── публикации ── */
  if (path === '/posts' && method === 'POST') {
    if (!me) return notAuth();
    const id = body.id || uid('p');
    await db.prepare("insert into posts (id,author_id,text,tag,status,likes,created_at) values (?,?,?,?,'published',0,?)")
      .bind(id, me.id, str(body.text, 3000), str(body.tag, 40), nowISO()).run();
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/posts\/([^/]+)(\/like)?$/);
  if (m) {
    if (m[2] && method === 'POST') {
      if (!me) return notAuth();
      const liked = await db.prepare('select 1 from post_likes where post_id=? and user_id=?').bind(m[1], me.id).first();
      if (liked) {
        await db.prepare('delete from post_likes where post_id=? and user_id=?').bind(m[1], me.id).run();
      } else {
        await db.prepare('insert or ignore into post_likes (post_id,user_id) values (?,?)').bind(m[1], me.id).run();
      }
      await db.prepare('update posts set likes=(select count(*) from post_likes where post_id=?) where id=?')
        .bind(m[1], m[1]).run();
      return json({ ok: true, liked: !liked }, 200, origin);
    }
    if (method === 'PATCH' || method === 'DELETE') {
      const g = notAdmin(); if (g) return g;
      if (method === 'DELETE' || body.status === 'delete') {
        await db.prepare('delete from post_comments where post_id=?').bind(m[1]).run();
        await db.prepare('delete from posts where id=?').bind(m[1]).run();
      } else {
        await db.prepare('update posts set status=?, resolved_at=? where id=?')
          .bind(body.status, body.status === 'published' ? nowISO() : null, m[1]).run();
      }
      await audit(env, me.id, 'post.moderate', m[1], body.status || 'delete');
      return json({ ok: true }, 200, origin);
    }
  }

  /* ── комментарии к постам ── */
  if (path === '/comments' && method === 'POST') {
    if (!me) return notAuth();
    const id = uid('cm');
    await db.prepare('insert into post_comments (id,post_id,author_id,text,created_at) values (?,?,?,?,?)')
      .bind(id, body.postId, me.id, str(body.text, 1500), nowISO()).run();
    const c = await db.prepare('select * from post_comments where id=?').bind(id).first();
    return json({
      ok: true,
      comment: {
        id: c.id, postId: c.post_id, authorId: c.author_id, text: c.text,
        createdAt: c.created_at, editedAt: null
      }
    }, 201, origin);
  }

  m = path.match(/^\/comments\/([^/]+)$/);
  if (m && method === 'PATCH') {
    if (!me) return notAuth();
    const cur = await db.prepare('select * from post_comments where id=?').bind(m[1]).first();
    if (!cur) return json({ error: 'not found' }, 404, origin);
    if (cur.author_id !== me.id && me.role === 'student') {
      return json({ ok: false, error: 'Можно менять только свой комментарий' }, 403, origin);
    }
    await db.prepare('update post_comments set text=?, edited_at=? where id=?')
      .bind(str(body.text, 1500), nowISO(), m[1]).run();
    return json({ ok: true }, 200, origin);
  }

  /* ── команды ── */
  if (path === '/teams' && method === 'POST') {
    if (!me) return notAuth();
    const id = uid('tm');
    const inviteCode = hex(crypto.getRandomValues(new Uint8Array(6)));
    await db.prepare(
      "insert into teams (id,title,description,type,spots_open,lead_id,tags,status,invite_code,created_at) values (?,?,?,?,?,?,?,'open',?,?)"
    ).bind(id, str(body.title, 160), str(body.description, 2000), str(body.type, 60),
      Number(body.spotsOpen) || 1, me.id, K(body.tags || []), inviteCode, nowISO()).run();
    await db.prepare('insert or ignore into team_members (team_id,user_id,created_at) values (?,?,?)')
      .bind(id, me.id, nowISO()).run();
    await db.prepare("insert or ignore into chats (id,title,kind,unread,last_at) values (?,?,'team',0,?)")
      .bind('chat_' + id, str(body.title, 160), nowISO()).run();
    await db.prepare('insert or ignore into chat_members (chat_id,user_id) values (?,?)')
      .bind('chat_' + id, me.id).run();
    return json({ ok: true, id, inviteCode, chatId: 'chat_' + id }, 201, origin);
  }

  /* проверка ссылки-приглашения в команду */
  m = path.match(/^\/teams\/([^/]+)\/invite$/);
  if (m && method === 'GET') {
    if (!me) return notAuth();
    const team = await db.prepare('select * from teams where id=?').bind(m[1]).first();
    if (!team) return json({ ok: false, error: 'Команда не найдена' }, 404, origin);
    const code = String(url.searchParams.get('code') || '').trim();
    let expected = team.invite_code || '';
    if (!expected) {
      expected = (await sha256('kk_inv_' + team.id)).slice(0, 12);
      await db.prepare('update teams set invite_code=? where id=?').bind(expected, team.id).run();
    }
    const members = await db.prepare('select user_id from team_members where team_id=?').bind(m[1]).all();
    const mIds = (members.results || []).map((r) => r.user_id);
    const isMember = team.lead_id === me.id || mIds.includes(me.id);
    return json({
      ok: true,
      valid: isMember || (!!code && code === expected),
      inviteCode: isMember ? expected : '',
      team: {
        id: team.id, title: team.title, description: team.description, type: team.type,
        spotsOpen: team.spots_open, leadId: team.lead_id, tags: P(team.tags, []), members: mIds
      }
    }, 200, origin);
  }

  /* вступление в команду: только по ссылке-приглашению (code) или если уже участник */
  m = path.match(/^\/teams\/([^/]+)\/join$/);
  if (m && method === 'POST') {
    if (!me) return notAuth();
    const team = await db.prepare('select * from teams where id=?').bind(m[1]).first();
    if (!team) return json({ ok: false, error: 'Команда не найдена' }, 404, origin);
    let expected = team.invite_code || '';
    if (!expected) {
      expected = (await sha256('kk_inv_' + team.id)).slice(0, 12);
      await db.prepare('update teams set invite_code=? where id=?').bind(expected, team.id).run();
    }

    const already = await db.prepare('select 1 from team_members where team_id=? and user_id=?').bind(m[1], me.id).first();
    if (!already && team.lead_id !== me.id) {
      const code = String(body.code || '').trim();
      if (!code || code !== expected) {
        return json({ ok: false, error: 'Вступить в команду можно только по ссылке-приглашению от автора поста' }, 403, origin);
      }
      await db.prepare('insert into team_members (team_id,user_id,created_at) values (?,?,?)')
        .bind(m[1], me.id, nowISO()).run();
      await db.prepare('update teams set spots_open = max(0, spots_open - 1) where id=?').bind(m[1]).run();
    }

    // чат команды
    let chat = await db.prepare("select * from chats where id=?").bind('chat_' + m[1]).first();
    if (!chat) {
      await db.prepare("insert into chats (id,title,kind,unread,last_at) values (?,?,'team',0,?)")
        .bind('chat_' + m[1], team.title, nowISO()).run();
      await db.prepare('insert or ignore into chat_members (chat_id,user_id) values (?,?)')
        .bind('chat_' + m[1], team.lead_id).run();
      const members = await db.prepare('select user_id from team_members where team_id=?').bind(m[1]).all();
      for (const row of members.results || []) {
        await db.prepare('insert or ignore into chat_members (chat_id,user_id) values (?,?)')
          .bind('chat_' + m[1], row.user_id).run();
      }
    } else {
      await db.prepare('insert or ignore into chat_members (chat_id,user_id) values (?,?)')
        .bind('chat_' + m[1], me.id).run();
    }

    if (!already && team.lead_id !== me.id) {
      const joinAt = nowISO();
      await db.prepare('insert into messages (id,chat_id,author_id,text,created_at) values (?,?,?,?,?)')
        .bind(uid('m'), 'chat_' + m[1], me.id, '👋 Присоединился(ась) к команде по приглашению!', joinAt).run();
      await db.prepare('update chats set last_at=? where id=?').bind(joinAt, 'chat_' + m[1]).run();
    }

    const members = await db.prepare('select user_id from team_members where team_id=?').bind(m[1]).all();
    return json({
      ok: true, chatId: 'chat_' + m[1],
      title: team.title,
      inviteCode: expected,
      members: (members.results || []).map((r) => r.user_id)
    }, 200, origin);
  }

  /* ── чаты ── */
  const attSummary = (att) => {
    if (!att || typeof att !== 'object') return '';
    if (att.kind === 'sticker') return '🎭 Стикер' + (att.label ? ' · ' + att.label : '');
    if (att.kind === 'image') return '🖼 Фотография';
    if (att.kind === 'file') return '📎 ' + (att.name || 'Документ');
    if (att.kind === 'invite') return '🤝 Приглашение в команду';
    return '';
  };

  if (path === '/chats/direct' && method === 'POST') {
    if (!me) return notAuth();
    const other = await db.prepare('select * from users where id=?').bind(body.userId).first();
    if (!other) return json({ ok: false, error: 'Пользователь не найден' }, 404, origin);
    if (other.id === me.id) return json({ ok: false, error: 'Нельзя написать самому себе' }, 400, origin);

    const existing = await db.prepare(
      `select c.id from chats c
       join chat_members a on a.chat_id=c.id and a.user_id=?
       join chat_members b on b.chat_id=c.id and b.user_id=?
       where c.kind='direct' limit 1`
    ).bind(me.id, other.id).first();
    if (existing) return json({ ok: true, chatId: existing.id, existing: true }, 200, origin);

    const id = uid('chat');
    await db.prepare("insert into chats (id,title,kind,unread,last_at) values (?,?,'direct',0,?)")
      .bind(id, other.name, nowISO()).run();
    await db.prepare('insert into chat_members (chat_id,user_id) values (?,?)').bind(id, me.id).run();
    await db.prepare('insert into chat_members (chat_id,user_id) values (?,?)').bind(id, other.id).run();
    return json({ ok: true, chatId: id, existing: false }, 201, origin);
  }

  /* ── список чатов: лёгкий ответ для синхронизации ── */
  if (path === '/chats' && method === 'GET') {
    if (!me) return notAuth();
    const rows = await db.prepare(
      `select c.id, c.title, c.kind, c.unread, c.last_at,
              (select m.text from messages m where m.chat_id=c.id order by m.created_at desc limit 1) as last_text,
              (select m.attachment from messages m where m.chat_id=c.id order by m.created_at desc limit 1) as last_att,
              (select m.author_id from messages m where m.chat_id=c.id order by m.created_at desc limit 1) as last_author
         from chats c
         join chat_members cm on cm.chat_id=c.id and cm.user_id=?
        order by c.last_at desc
        limit 60`
    ).bind(me.id).all();

    const list = rows.results || [];
    const byChat = {};
    if (list.length) {
      const ph = list.map(() => '?').join(',');
      const mm = await db.prepare(
        `select chat_id, user_id from chat_members where chat_id in (${ph})`
      ).bind(...list.map((r) => r.id)).all();
      (mm.results || []).forEach((r) => {
        (byChat[r.chat_id] = byChat[r.chat_id] || []).push(r.user_id);
      });
    }

    return json({ ok: true, chats: list.map((r) => ({
      id: r.id, title: r.title, kind: r.kind || 'group',
      unread: r.unread || 0, lastAt: r.last_at,
      memberIds: byChat[r.id] || [],
      lastText: r.last_text || attSummary(P(r.last_att, null)) || '',
      lastAuthorId: r.last_author || ''
    })) }, 200, origin);
  }

  /* ── новые сообщения чата (его опрашивает открытый экран) ── */
  m = path.match(/^\/chats\/([^/]+)\/messages$/);
  if (m && method === 'GET') {
    if (!me) return notAuth();
    const member = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?')
      .bind(m[1], me.id).first();
    if (!member) return json({ ok: false, error: 'Нет доступа к чату' }, 403, origin);

    const after = url.searchParams.get('after') || '';
    const rows = await db.prepare(
      `select id, chat_id, author_id, text, attachment, created_at, edited_at from messages
        where chat_id=? and (created_at>=? or coalesce(edited_at,'')>=?)
        order by created_at asc limit 100`
    ).bind(m[1], after, after).all();

    return json({ ok: true, messages: (rows.results || []).map((r) => ({
      id: r.id, chatId: r.chat_id, authorId: r.author_id, text: r.text,
      attachment: P(r.attachment, null),
      at: r.created_at, editedAt: r.edited_at || ''
    })) }, 200, origin);
  }

  m = path.match(/^\/chats\/([^/]+)\/messages$/);
  if (m && method === 'POST') {
    if (!me) return notAuth();
    const member = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?').bind(m[1], me.id).first();
    if (!member) return json({ ok: false, error: 'Нет доступа к чату' }, 403, origin);
    const id = body.id || uid('m');
    const at = nowISO();
    const attJson = body.attachment && typeof body.attachment === 'object'
      ? str(JSON.stringify(body.attachment), 700000) : null;
    const textVal = str(body.text, 3000);
    if (!textVal.trim() && !attJson) {
      return json({ ok: false, error: 'Пустое сообщение' }, 400, origin);
    }
    await db.prepare('insert into messages (id,chat_id,author_id,text,attachment,created_at) values (?,?,?,?,?,?)')
      .bind(id, m[1], me.id, textVal, attJson, at).run();
    await db.prepare('update chats set last_at=?, unread=0 where id=?').bind(at, m[1]).run();
    return json({ ok: true, id, at }, 201, origin);
  }

  m = path.match(/^\/messages\/([^/]+)$/);
  if (m && method === 'PATCH') {
    if (!me) return notAuth();
    const cur = await db.prepare('select * from messages where id=?').bind(m[1]).first();
    if (!cur) return json({ error: 'not found' }, 404, origin);
    if (cur.author_id !== me.id) return json({ ok: false, error: 'Можно менять только свои сообщения' }, 403, origin);
    await db.prepare('update messages set text=?, edited_at=? where id=?')
      .bind(str(body.text, 3000), nowISO(), m[1]).run();
    return json({ ok: true }, 200, origin);
  }

  m = path.match(/^\/chats\/([^/]+)\/read$/);
  if (m && method === 'POST') {
    if (!me) return notAuth();
    await db.prepare('update chats set unread=0 where id=?').bind(m[1]).run();
    return json({ ok: true }, 200, origin);
  }

  /* ── роадмап: личный + общий роадмап командных/групповых чатов ── */
  async function notifyChatRoadmap(chatId, actionText, itemTitle, itemDate) {
    if (!chatId) return;
    try {
      const chat = await db.prepare('select * from chats where id=?').bind(chatId).first();
      if (!chat) return;
      const at = nowISO();
      const datePart = itemDate ? ' · ' + String(itemDate).slice(0, 10) : '';
      const msgText = `🗺 ${me.name.split(' ')[0]} ${actionText} в роадмапе команды: «${itemTitle}»${datePart}`;
      await db.prepare('insert into messages (id,chat_id,author_id,text,created_at) values (?,?,?,?,?)')
        .bind(uid('m'), chatId, me.id, msgText, at).run();
      await db.prepare('update chats set last_at=? where id=?').bind(at, chatId).run();
      const members = await db.prepare('select user_id from chat_members where chat_id=? and user_id != ?')
        .bind(chatId, me.id).all();
      const otherIds = (members.results || []).map((r) => r.user_id);
      if (otherIds.length) {
        const ph = otherIds.map(() => '?').join(',');
        const subs = await db.prepare(`select * from push_subs where user_id in (${ph})`).bind(...otherIds).all();
        const payload = JSON.stringify({
          title: 'Роадмап · ' + chat.title,
          body: `${me.name.split(' ')[0]} ${actionText}: ${itemTitle}${datePart}`,
          url: './#/roadmap/team/' + encodeURIComponent(chatId)
        });
        for (const sub of (subs.results || [])) {
          await sendPush(env, sub, payload);
        }
      }
    } catch (e) { /* push best-effort */ }
  }

  if (path === '/plan' && method === 'GET') {
    if (!me) return notAuth();
    const chatId = url.searchParams.get('chat') || '';
    if (chatId) {
      const mem = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?').bind(chatId, me.id).first();
      if (!mem) return json({ ok: false, error: 'Нет доступа к чату команды' }, 403, origin);
      const rows = await db.prepare('select * from plan_items where chat_id=? order by start_at limit 400').bind(chatId).all();
      return json({ ok: true, items: (rows.results || []).map(toPlan) }, 200, origin);
    }
    const rows = await db.prepare(
      `select * from plan_items
        where (user_id=? and (chat_id is null or chat_id=''))
           or (chat_id is not null and chat_id != '' and chat_id in (select chat_id from chat_members where user_id=?))
        order by start_at limit 600`
    ).bind(me.id, me.id).all();
    return json({ ok: true, items: (rows.results || []).map(toPlan) }, 200, origin);
  }

  if (path === '/plan/items' && method === 'POST') {
    if (!me) return notAuth();
    const kind = ['milestone', 'track', 'task'].includes(body.kind) ? body.kind : 'task';
    const chatId = body.chatId ? str(body.chatId, 80) : '';
    if (chatId) {
      const mem = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?').bind(chatId, me.id).first();
      if (!mem) return json({ ok: false, error: 'Только участники чата могут менять роадмап команды' }, 403, origin);
    }
    const id = str(body.id, 60) || uid('p');
    const start = str(body.startAt, 40) || nowISO();
    const title = str(body.title, 200);
    await db.prepare(
      `insert or replace into plan_items (id,user_id,chat_id,kind,title,note,start_at,end_at,done,event_id,checklist,color,created_at,updated_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, me.id, chatId || null, kind, title, str(body.note, 600), start,
      str(body.endAt, 40), body.done ? 1 : 0, str(body.eventId, 60),
      JSON.stringify(Array.isArray(body.checklist) ? body.checklist.slice(0, 40) : []),
      str(body.color, 20) || 'sky', nowISO(), nowISO()).run();
    if (chatId) await notifyChatRoadmap(chatId, 'добавил(а) событие', title, start);
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/plan\/items\/([^/]+)$/);
  if (m && method === 'PATCH') {
    if (!me) return notAuth();
    const row = await db.prepare('select * from plan_items where id=?').bind(m[1]).first();
    if (!row) return json({ ok: false, error: 'Пункт не найден' }, 404, origin);
    if (row.chat_id) {
      const mem = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?').bind(row.chat_id, me.id).first();
      if (!mem) return json({ ok: false, error: 'Нет доступа к роадмапу команды' }, 403, origin);
    } else if (row.user_id !== me.id) {
      return json({ ok: false, error: 'Пункт не найден' }, 404, origin);
    }
    const pick = (key, col, max) => (body[key] === undefined ? row[col] : (body[key] === null ? '' : str(body[key], max)));
    const nextTitle = pick('title', 'title', 200);
    const nextStart = pick('startAt', 'start_at', 40);
    const nextDone = body.done === undefined ? row.done : (body.done ? 1 : 0);
    await db.prepare(
      `update plan_items set title=?, note=?, start_at=?, end_at=?, done=?, checklist=?, color=?, updated_at=?
       where id=?`
    ).bind(
      nextTitle, pick('note', 'note', 600), nextStart,
      pick('endAt', 'end_at', 40), nextDone,
      body.checklist === undefined ? row.checklist : JSON.stringify((body.checklist || []).slice(0, 40)),
      pick('color', 'color', 20) || 'sky', nowISO(), m[1]
    ).run();
    if (row.chat_id && (body.title !== undefined || body.startAt !== undefined || body.done !== undefined)) {
      const act = body.done !== undefined && !!body.done !== !!row.done
        ? (nextDone ? 'отметил(а) выполненным' : 'вернул(а) в работу')
        : 'обновил(а)';
      await notifyChatRoadmap(row.chat_id, act, nextTitle, nextStart);
    }
    return json({ ok: true }, 200, origin);
  }

  if (m && method === 'DELETE') {
    if (!me) return notAuth();
    const row = await db.prepare('select * from plan_items where id=?').bind(m[1]).first();
    if (!row) return json({ ok: true }, 200, origin);
    if (row.chat_id) {
      const mem = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?').bind(row.chat_id, me.id).first();
      if (!mem) return json({ ok: false, error: 'Нет доступа к роадмапу команды' }, 403, origin);
    } else if (row.user_id !== me.id) {
      return json({ ok: false, error: 'Пункт не найден' }, 404, origin);
    }
    await db.prepare('delete from plan_items where id=?').bind(m[1]).run();
    if (row.chat_id) await notifyChatRoadmap(row.chat_id, 'удалил(а)', row.title, '');
    return json({ ok: true }, 200, origin);
  }

  /* ── цели и задачи ── */
  if (path === '/goals' && method === 'POST') {
    if (!me) return notAuth();
    const id = uid('g');
    await db.prepare('insert into goals (id,user_id,title,created_at) values (?,?,?,?)')
      .bind(id, me.id, str(body.title, 200), nowISO()).run();
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/goals\/([^/]+)$/);
  if (m && method === 'DELETE') {
    if (!me) return notAuth();
    await db.prepare('delete from tasks where goal_id=? and user_id=?').bind(m[1], me.id).run();
    await db.prepare('delete from goals where id=? and user_id=?').bind(m[1], me.id).run();
    return json({ ok: true }, 200, origin);
  }

  if (path === '/tasks' && method === 'POST') {
    if (!me) return notAuth();
    const id = uid('tk');
    await db.prepare('insert into tasks (id,goal_id,user_id,title,date_label,status) values (?,?,?,?,?,?)')
      .bind(id, body.goalId, me.id, str(body.title, 200), str(body.dateLabel, 60), body.status || 'planned').run();
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/tasks\/([^/]+)$/);
  if (m && method === 'PATCH') {
    if (!me) return notAuth();
    await db.prepare('update tasks set status=? where id=? and user_id=?').bind(body.status, m[1], me.id).run();
    return json({ ok: true }, 200, origin);
  }

  m = path.match(/^\/goals\/([^/]+)\/plan$/);
  if (m && method === 'PUT') {
    if (!me) return notAuth();
    await db.prepare('delete from tasks where goal_id=? and user_id=?').bind(m[1], me.id).run();
    const list = Array.isArray(body.tasks) ? body.tasks : [];
    if (list.length) {
      await db.batch(list.map((t, i) => db.prepare(
        'insert into tasks (id,goal_id,user_id,title,date_label,status) values (?,?,?,?,?,?)'
      ).bind(uid('tk'), m[1], me.id, str(t.title, 200), str(t.dateLabel, 60), i === 0 ? 'current' : 'planned')));
    }
    return json({ ok: true }, 200, origin);
  }

  /* ═════════════════ АДМИНКА ═════════════════ */

  /* ── пользователи ── */
  /* ─────────────────── организации (B2B) ─────────────────── */

  const toOrg = (r) => ({
    id: r.id, name: r.name, plan: r.plan || 'agency', city: r.city || '', contact: r.contact || '',
    status: r.status || 'active', managerId: r.manager_id || null, managerName: r.manager_name || '',
    note: r.note || '', createdAt: r.created_at,
    students: r.students != null ? r.students : undefined,
    openTasks: r.open_tasks != null ? r.open_tasks : undefined
  });

  /* организация текущего сотрудника: её нельзя подменить параметром запроса */
  const isMentor = () => !!(me && me.orgRole === 'mentor');
  const isOrgAdmin = () => !!(me && ((me.role === 'org' && me.orgRole !== 'mentor') || me.role === 'admin' || me.role === 'root'));

  async function myOrgRow() {
    if (me.role === 'org' || isMentor()) {
      if (!me.orgId) return null;
      return await db.prepare('select * from organizations where id=?').bind(me.orgId).first();
    }
    const wanted = url.searchParams.get('org');
    if (wanted) return await db.prepare('select * from organizations where id=?').bind(wanted).first();
    return await db.prepare('select * from organizations order by created_at limit 1').first();
  }

  if (path === '/admin/orgs' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    const list = await db.prepare(
      `select o.*, u.name as manager_name,
         (select count(*) from users x where x.org_id=o.id and x.role='student') as students,
         (select count(*) from org_slots s where s.org_id=o.id and s.done=0) as open_tasks
       from organizations o left join users u on u.id=o.manager_id
       order by o.created_at desc`
    ).all();
    return json({ ok: true, orgs: list.results.map(toOrg) }, 200, origin);
  }

  if (path === '/admin/orgs' && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const name = str(body.name, 120);
    if (name.trim().length < 2) return json({ ok: false, error: 'Название организации обязательно' }, 400, origin);

    const login = str(body.managerLogin, 120).toLowerCase();
    if (login) {
      if (!/^[a-z0-9._@-]{3,40}$/.test(login)) {
        return json({ ok: false, error: 'Логин управляющего: 3–40 символов, латиница, цифры, . _ - @' }, 400, origin);
      }
      if (await resolveLogin(env, login)) return json({ ok: false, error: 'Логин занят' }, 409, origin);
    }

    const id = uid('org');
    await db.prepare(
      'insert into organizations (id,name,plan,city,contact,status,note,created_at) values (?,?,?,?,?,?,?,?)'
    ).bind(id, name.trim(), body.plan === 'school' ? 'school' : 'agency',
      str(body.city, 60), str(body.contact, 120), 'active', str(body.note, 300), nowISO()).run();

    let manager = null;
    if (login) {
      const password = String(body.managerPassword || '') || makeOtp();
      const salt = newSalt();
      const mid = uid('u');
      await db.prepare(
        `insert into users (id,name,email,pass_hash,salt,role,org_id,color,created_at)
         values (?,?,?,?,?,'org',?,?,?)`
      ).bind(mid, str(body.managerName, 120) || 'Управляющий', login.includes('@') ? login : null,
        await hashPassword(password, salt), salt, id, 'lavender', nowISO()).run();
      await db.prepare('insert into user_logins (login,user_id,created_at) values (?,?,?)')
        .bind(login, mid, nowISO()).run();
      await db.prepare('update organizations set manager_id=? where id=?').bind(mid, id).run();
      manager = { id: mid, login, password };
      await audit(env, me.id, 'org.manager.create', mid, login + ' / ' + name.trim());
    }

    await audit(env, me.id, 'org.create', id, name.trim());
    return json({ ok: true, id, manager }, 201, origin);
  }

  m = path.match(/^\/admin\/orgs\/([^/]+)$/);
  if (m) {
    const g = notAdmin(); if (g) return g;
    const org = await db.prepare('select * from organizations where id=?').bind(m[1]).first();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 404, origin);

    if (method === 'PATCH') {
      const name = body.name != null ? str(body.name, 120) : org.name;
      if (String(name).trim().length < 2) return json({ ok: false, error: 'Название слишком короткое' }, 400, origin);
      const status = ['active', 'paused', 'archived'].includes(body.status) ? body.status : (org.status || 'active');
      await db.prepare('update organizations set name=?,plan=?,city=?,contact=?,status=?,note=? where id=?')
        .bind(String(name).trim(), body.plan == null ? org.plan : (body.plan === 'school' ? 'school' : 'agency'),
          body.city == null ? org.city : str(body.city, 60),
          body.contact == null ? org.contact : str(body.contact, 120),
          status,
          body.note == null ? org.note : str(body.note, 300), org.id).run();
      await audit(env, me.id, 'org.update', org.id, String(name).trim());
      const row = await db.prepare('select * from organizations where id=?').bind(org.id).first();
      return json({ ok: true, org: toOrg(row) }, 200, origin);
    }

    if (method === 'DELETE') {
      const gr = notRoot(); if (gr) return gr;
      await db.prepare('update users set org_id=null where org_id=?').bind(org.id).run();
      await db.prepare('delete from org_slots where org_id=?').bind(org.id).run();
      await db.prepare('delete from organizations where id=?').bind(org.id).run();
      await audit(env, me.id, 'org.delete', org.id, org.name);
      return json({ ok: true }, 200, origin);
    }
  }

  /* кабинет управляющего организацией (только админ организации) */
  if (path === '/org/overview' && method === 'GET') {
    if (!isOrgAdmin()) {
      return json({ ok: false, error: 'Доступно только администратору организации' }, 403, origin);
    }
    const org = await myOrgRow();
    if (!org) return json({ ok: true, org: null, students: [], slots: [], deadlines: [], kpi: null }, 200, origin);

    const [students, slots, deadlines, manager] = await Promise.all([
      db.prepare("select * from users where org_id=? order by role desc, name limit 500").bind(org.id).all(),
      db.prepare('select * from org_slots where org_id=? order by date limit 500').bind(org.id).all(),
      db.prepare(
        `select e.id, e.title, e.deadline_date, e.format, e.link, s.user_id
           from saved_events s
           join events e on e.id = s.event_id
           join users u on u.id = s.user_id
          where u.org_id = ? and e.deadline_date >= ?
          order by e.deadline_date limit 200`
      ).bind(org.id, new Date(Date.now() - 7 * 864e5).toISOString()).all(),
      org.manager_id ? db.prepare('select id,name from users where id=?').bind(org.manager_id).first() : null
    ]);

    const now = nowISO();
    const rows = slots.results || [];
    const kpi = {
      students: students.results.filter((u) => u.role === 'student' && u.org_role !== 'mentor').length,
      staff: students.results.filter((u) => u.role !== 'student' || u.org_role === 'mentor').length,
      open: rows.filter((s) => !s.done).length,
      overdue: rows.filter((s) => !s.done && String(s.date) < now).length,
      weekDeadlines: (deadlines.results || []).filter((d) => String(d.deadline_date) < new Date(Date.now() + 7 * 864e5).toISOString()).length
    };

    return json({
      ok: true,
      org: toOrg(Object.assign({}, org, { manager_name: manager ? manager.name : '' })),
      manager: manager ? { id: manager.id, name: manager.name } : null,
      students: students.results.map((u) => adminUser(toUser(u))),
      slots: rows.map((s) => ({
        id: s.id, orgId: s.org_id, studentId: s.student_id, title: s.title, note: s.note || '',
        date: s.date, kind: s.kind || 'internal', done: !!s.done, createdBy: s.created_by
      })),
      deadlines: (deadlines.results || []).map((d) => ({
        eventId: d.id, title: d.title, date: d.deadline_date, format: d.format, link: d.link || '', studentId: d.user_id
      })),
      kpi
    }, 200, origin);
  }

  if (path === '/org/users' && method === 'POST') {
    if (!isOrgAdmin()) {
      return json({ ok: false, error: 'Создавать учеников и менторов может только администратор организации' }, 403, origin);
    }
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);

    const login = str(body.login, 120).toLowerCase();
    if (!/^[a-z0-9._@-]{3,40}$/.test(login)) {
      return json({ ok: false, error: 'Логин: 3–40 символов, латиница, цифры, . _ - @' }, 400, origin);
    }
    if (await resolveLogin(env, login)) return json({ ok: false, error: 'Логин занят' }, 409, origin);

    const password = String(body.password || '') || makeOtp();
    const salt = newSalt();
    const id = uid('u');
    const mentor = !!body.mentor || body.orgRole === 'mentor';
    const colors = ['mint', 'sky', 'sun', 'blush', 'lavender'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    await db.prepare(
      `insert into users (id,name,email,pass_hash,salt,role,org_id,grade,school,city,color,org_role,created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, str(body.name, 120) || 'Без имени', login.includes('@') ? login : null,
      await hashPassword(password, salt), salt, mentor ? 'org' : 'student', org.id, str(body.grade, 40),
      str(body.school, 120) || org.name, str(body.city, 60) || org.city || '', color,
      mentor ? 'mentor' : null, nowISO()).run();
    await db.prepare('insert into user_logins (login,user_id,created_at) values (?,?,?)')
      .bind(login, id, nowISO()).run();
    const cleanTags = Array.isArray(body.tags)
      ? body.tags.slice(0, 20).map((t) => str(t, 40).replace(/^#/, '')).filter(Boolean)
      : [];
    const chosenMentor = !mentor
      ? (body.mentorId ? String(body.mentorId) : (me.role === 'org' ? me.id : org.manager_id || null))
      : null;
    await db.prepare(
      `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,template_id,updated_at)
       values (?,?,?,?,'','','','','','','','','plan',?,?)
       on conflict(user_id) do update set tags=excluded.tags, mentor_id=excluded.mentor_id, template_id=excluded.template_id`
    ).bind(id, chosenMentor, JSON.stringify(cleanTags), str(body.grade, 40),
      !mentor && body.templateId ? String(body.templateId) : null, nowISO()).run();

    // если при создании ученика сразу выбран шаблон роадмапа — разворачиваем его события
    if (!mentor && body.templateId) {
      const tpl = await db.prepare('select * from roadmap_templates where id=? and org_id=?')
        .bind(String(body.templateId), org.id).first();
      if (tpl) {
        const items = P(tpl.items, []);
        const now = new Date();
        for (const it of items) {
          const d = new Date(now.getFullYear(), Number(it.month) || 0, Number(it.day) || 1);
          if (d < now) d.setFullYear(d.getFullYear() + 1);
          await db.prepare('insert into org_slots (id,org_id,student_id,title,note,date,kind,done,created_by,created_at) values (?,?,?,?,?,?,?,0,?,?)')
            .bind(uid('slot'), org.id, id, str(it.title, 160), str(it.note, 200),
              d.toISOString().slice(0, 10), it.kind === 'course' ? 'milestone' : 'internal', me.id, nowISO()).run();
        }
      }
    }

    await audit(env, me.id, 'org.user.create', id, login + ' / ' + org.name);
    return json({ ok: true, id, login, password }, 201, origin);
  }

  /* управление карточкой ментора — строго только для главного админа организации */
  m = path.match(/^\/org\/mentors\/([^/]+)$/);
  if (m) {
    if (!isOrgAdmin()) {
      return json({ ok: false, error: 'Управлять менторами может только администратор организации' }, 403, origin);
    }
    const org = await myOrgRow();
    const target = org ? await db.prepare('select * from users where id=? and org_id=?').bind(m[1], org.id).first() : null;
    if (!target) return json({ ok: false, error: 'Ментор не найден' }, 404, origin);
    if (method === 'PATCH') {
      if (body.name != null && String(body.name).trim().length >= 2) {
        await db.prepare('update users set name=? where id=?').bind(str(body.name, 120).trim(), target.id).run();
      }
      if (body.tags != null) {
        const clean = (Array.isArray(body.tags) ? body.tags : []).slice(0, 20).map((t) => str(t, 40).replace(/^#/, '')).filter(Boolean);
        await db.prepare(
          `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
           values (?,null,?,'','','','','','','','','','plan',?)
           on conflict(user_id) do update set tags=excluded.tags, updated_at=excluded.updated_at`
        ).bind(target.id, JSON.stringify(clean), nowISO()).run();
      }
      await audit(env, me.id, 'org.mentor.update', target.id);
      return json({ ok: true }, 200, origin);
    }
    if (method === 'DELETE') {
      if (target.id === org.manager_id) {
        return json({ ok: false, error: 'Нельзя удалить главного управляющего организации' }, 400, origin);
      }
      const attached = await db.prepare(
        "select count(*) as c from org_students s join users u on u.id=s.user_id where u.org_id=? and u.role='student' and coalesce(u.org_role,'')!='mentor' and s.mentor_id=?"
      ).bind(org.id, target.id).first();
      if (attached && attached.c > 0) {
        return json({ ok: false, error: 'Сначала переведите учеников этого ментора другому ментору (' + attached.c + ')' }, 400, origin);
      }
      await db.prepare('delete from org_students where user_id=?').bind(target.id).run();
      await db.prepare('delete from sessions where user_id=?').bind(target.id).run();
      await db.prepare('delete from user_logins where user_id=?').bind(target.id).run();
      await db.prepare('delete from users where id=?').bind(target.id).run();
      await audit(env, me.id, 'org.mentor.delete', target.id, target.name);
      return json({ ok: true }, 200, origin);
    }
  }

  /* ─────────────────── кабинет организации: карточки kk. ─────────────────── */

  function orgGuard(adminOnly) {
    if (adminOnly && !isOrgAdmin()) {
      return json({ ok: false, error: 'Доступно только администратору организации' }, 403, origin);
    }
    if (!isOrgAdmin() && !isMentor()) {
      return json({ ok: false, error: 'Только для сотрудников организации' }, 403, origin);
    }
    return null;
  }
  async function canSeeStudent(org, userId) {
    if (!org || !userId) return null;
    const u = await db.prepare("select id from users where id=? and org_id=? and role='student' and coalesce(org_role,'')!='mentor'")
      .bind(userId, org.id).first();
    if (!u) return null;
    if (isMentor()) {
      const c = await db.prepare('select mentor_id from org_students where user_id=?').bind(userId).first();
      if (!c || c.mentor_id !== me.id) return null;
    }
    return u;
  }
  const P2 = (v, def) => P(v, def);

  if (path === '/org/slots' && method === 'POST') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const sid = body.studentId ? String(body.studentId) : null;
    if (isMentor() && (!sid || !(await canSeeStudent(org, sid)))) {
      return json({ ok: false, error: 'Ментор может добавлять события только своим ученикам' }, 403, origin);
    }
    const title = str(body.title, 160);
    if (!title.trim()) return json({ ok: false, error: 'Название задачи обязательно' }, 400, origin);
    const date = String(body.date || '').slice(0, 24);
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) return json({ ok: false, error: 'Нужна дата' }, 400, origin);
    const kind = ['internal', 'milestone', 'external'].includes(body.kind) ? body.kind : 'internal';

    const id = uid('slot');
    const importance = ['high', 'middle', 'low'].includes(body.importance) ? body.importance : 'middle';
    await db.prepare(
      'insert into org_slots (id,org_id,student_id,title,note,date,kind,importance,notify,done,created_by,created_at) values (?,?,?,?,?,?,?,?,?,0,?,?)'
    ).bind(id, org.id, sid, title.trim(),
      str(body.note, 400), date, kind, importance, body.notify ? 1 : 0, me.id, nowISO()).run();
    await audit(env, me.id, 'org.slot.create', id, title.trim());
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/org\/slots\/([^/]+)$/);
  if (m) {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    const row = await db.prepare('select * from org_slots where id=?').bind(m[1]).first();
    if (!row) return json({ ok: false, error: 'Задача не найдена' }, 404, origin);
    if (!org || row.org_id !== org.id) {
      return json({ ok: false, error: 'Это задача другой организации' }, 403, origin);
    }
    if (isMentor() && (!row.student_id || !(await canSeeStudent(org, row.student_id)))) {
      return json({ ok: false, error: 'Нет доступа к чужому ученику' }, 403, origin);
    }

    if (method === 'PATCH') {
      const date = body.date != null ? String(body.date).slice(0, 24) : row.date;
      if (body.date != null && !/^\d{4}-\d{2}-\d{2}/.test(date)) {
        return json({ ok: false, error: 'Нужна дата' }, 400, origin);
      }
      const kind = ['internal', 'milestone', 'external'].includes(body.kind) ? body.kind : row.kind;
      await db.prepare('update org_slots set title=?,note=?,date=?,kind=?,done=?,student_id=?,importance=?,notify=? where id=?')
        .bind(body.title != null ? str(body.title, 160) : row.title,
          body.note != null ? str(body.note, 400) : row.note,
          date, kind,
          body.done == null ? row.done : (body.done ? 1 : 0),
          isMentor() ? row.student_id : (body.studentId !== undefined ? (body.studentId ? String(body.studentId) : null) : row.student_id),
          ['high', 'middle', 'low'].includes(body.importance) ? body.importance : (row.importance || 'middle'),
          body.notify == null ? (row.notify || 0) : (body.notify ? 1 : 0),
          row.id).run();
      await audit(env, me.id, 'org.slot.update', row.id, date);
      return json({ ok: true }, 200, origin);
    }

    if (method === 'DELETE') {
      await db.prepare('delete from org_slots where id=?').bind(row.id).run();
      await audit(env, me.id, 'org.slot.delete', row.id, row.title);
      return json({ ok: true }, 200, origin);
    }
  }

  /* статус ученика: по плану / отстаёт / в зоне риска */
  function studentStatus(slots) {
    const now = nowISO();
    const open = slots.filter((s) => !s.done);
    const overdue = open.filter((s) => String(s.date) < now);
    if (!overdue.length) return { status: 'plan', overdue: 0, worst: '' };
    const worst = overdue.reduce((a, b) => (String(a.date) < String(b.date) ? a : b));
    const days = Math.round((Date.parse(now) - Date.parse(worst.date)) / 864e5);
    const heavy = overdue.some((s) => s.kind === 'milestone');
    return { status: heavy && days >= 14 ? 'risk' : 'lag', overdue: overdue.length, worst: worst.title, days };
  }

  function cardOf(row) {
    return {
      userId: row.user_id, mentorId: row.mentor_id || null, tags: P2(row.tags, []),
      grade: row.grade || '', gpa: row.gpa || '', gpaNote: row.gpa_note || '',
      sat: row.sat || '', satNote: row.sat_note || '',
      ielts: row.ielts || '', ieltsNote: row.ielts_note || '',
      goal: row.goal || '', goalNote: row.goal_note || '',
      status: row.status || 'plan', templateId: row.template_id || null,
      updatedAt: row.updated_at || ''
    };
  }


  /* ── ученик видит, что заполнил ментор ── */
  /* ── push-подписки ── */

  if (path === '/push/subscribe' && method === 'POST') {
    const sub = body.subscription || {};
    if (!sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
      return json({ ok: false, error: 'Нужна push-подписка браузера' }, 400, origin);
    }
    const exists = await db.prepare('select id from push_subs where endpoint=?').bind(str(sub.endpoint, 400)).first();
    if (exists) {
      await db.prepare('update push_subs set user_id=?,p256dh=?,auth=? where id=?')
        .bind(me.id, str(sub.keys.p256dh, 200), str(sub.keys.auth, 100), exists.id).run();
      return json({ ok: true, updated: true }, 200, origin);
    }
    const id = uid('psub');
    await db.prepare('insert into push_subs (id,user_id,endpoint,p256dh,auth,created_at) values (?,?,?,?,?,?)')
      .bind(id, me.id, str(sub.endpoint, 400), str(sub.keys.p256dh, 200), str(sub.keys.auth, 100), nowISO()).run();
    return json({ ok: true, id }, 201, origin);
  }

  if (path === '/push/subscribe' && method === 'DELETE') {
    const endpoint = str((body.subscription || {}).endpoint, 400);
    if (endpoint) await db.prepare('delete from push_subs where endpoint=?').bind(endpoint).run();
    else await db.prepare('delete from push_subs where user_id=?').bind(me.id).run();
    return json({ ok: true }, 200, origin);
  }

  if (path === '/push/test' && method === 'POST') {
    const r = await pushDigest(env, { userId: me.id });
    return json(Object.assign({ ok: true }, r), 200, origin);
  }

  /* ── админ: разослать напоминания вручную ── */
  if (path === '/admin/push-digest' && method === 'POST') {
    if (me.role !== 'root') return json({ ok: false, error: 'Только владелец' }, 403, origin);
    const r = await pushDigest(env, {});
    return json(Object.assign({ ok: true }, r), 200, origin);
  }

  if (path === '/me/mentor-card' && method === 'GET') {
    const row = await db.prepare('select * from org_students where user_id=?').bind(me.id).first();
    if (!row) return json({ ok: true, card: null }, 200, origin);
    const mentor = row.mentor_id ? await db.prepare('select id,name from users where id=?').bind(row.mentor_id).first() : null;
    const org = me.orgId ? await db.prepare('select id,name from organizations where id=?').bind(me.orgId).first() : null;
    return json({
      ok: true,
      card: cardOf(row),
      mentor: mentor ? { id: mentor.id, name: mentor.name } : null,
      org: org ? { id: org.id, name: org.name } : null,
      updatedBy: 'ментор'
    }, 200, origin);
  }

  if (path === '/org/crm' && method === 'GET') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: true, org: null, mentors: [], students: [], templates: [], kpi: null }, 200, origin);

    const [members, cards, slots, templates, tagGroups] = await Promise.all([
      db.prepare('select * from users where org_id=? order by name limit 500').bind(org.id).all(),
      db.prepare('select * from org_students').all(),
      db.prepare('select * from org_slots where org_id=? order by date limit 1000').bind(org.id).all(),
      db.prepare('select * from roadmap_templates where org_id=? order by created_at desc limit 100').bind(org.id).all(),
      db.prepare('select * from org_tag_groups where org_id=? order by created_at asc').bind(org.id).all()
    ]);

    const cardMap = {};
    (cards.results || []).forEach((c) => { cardMap[c.user_id] = c; });
    const rows = members.results || [];
    const mentors = rows.filter((u) => u.role === 'org' || u.org_role === 'mentor').map((u) => adminUser(toUser(u)));
    const students = rows.filter((u) => u.role === 'student' && u.org_role !== 'mentor');

    const slotsBy = {};
    (slots.results || []).forEach((s) => { (slotsBy[s.student_id] = slotsBy[s.student_id] || []).push(s); });

    (cards.results || []).forEach((c) => {
      if (!c.mentor_id || mentors.some((m) => m.id === c.mentor_id)) return;
      const u = rows.find((x) => x.id === c.mentor_id);
      if (u) mentors.push(adminUser(toUser(u)));
    });

    const fullList = students.map((u) => {
      const mine = slotsBy[u.id] || [];
      const st = studentStatus(mine);
      const card = cardMap[u.id] ? cardOf(cardMap[u.id]) : { userId: u.id, tags: [], status: st.status };
      const next = mine.filter((s) => !s.done && String(s.date) >= nowISO())
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
      const mentor = mentors.find((m) => m.id === (card.mentorId || org.manager_id));
      return Object.assign({}, adminUser(toUser(u)), {
        tags: card.tags && card.tags.length ? card.tags : [],
        mentorId: card.mentorId || org.manager_id || null,
        mentorName: mentor ? mentor.name.split(' ')[0] + ' ' + (mentor.name.split(' ')[1] || '').charAt(0) + '.' : '',
        status: st.status, overdue: st.overdue, worst: st.worst, days: st.days || 0,
        nextTitle: next ? next.title : (st.overdue ? st.worst : ''),
        nextDate: next ? next.date : '',
        overdueTitle: st.overdue ? st.worst : '',
        goal: card.goal || '', grade: card.grade || u.grade || ''
      });
    });

    /* МЕНТОР: видит строго ТОЛЬКО свою группу учеников и ближайшие созвоны — никаких чужих менторов, шаблонов и статистики! */
    if (isMentor()) {
      const myList = fullList.filter((s) => s.mentorId === me.id);
      const myStudentIds = new Set(myList.map((s) => s.id));
      const myCalls = (slots.results || [])
        .filter((s) => !s.done && myStudentIds.has(s.student_id) && String(s.date) >= nowISO().slice(0, 10))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .slice(0, 12)
        .map((s) => ({
          id: s.id, title: s.title, date: s.date, note: s.note || '',
          studentId: s.student_id,
          studentName: (myList.find((u) => u.id === s.student_id) || {}).name || ''
        }));
      const myTags = cardMap[me.id] ? cardOf(cardMap[me.id]).tags : [];
      return json({
        ok: true,
        myRole: 'mentor',
        org: { id: org.id, name: org.name, city: org.city || '' },
        meMentor: { id: me.id, name: me.name, color: me.color || 'mint', tags: myTags },
        mentors: [],
        mentorStats: [],
        students: myList,
        myCalls,
        templates: [],
        tagGroups: [],
        kpi: null
      }, 200, origin);
    }

    const total = fullList.length;
    const byPlan = fullList.filter((s) => s.status === 'plan').length;
    const lag = fullList.filter((s) => s.status === 'lag').length;
    const risk = fullList.filter((s) => s.status === 'risk').length;

    const mentorStats = mentors.map((m) => {
      const mine = fullList.filter((s) => s.mentorId === m.id);
      const ok = mine.filter((s) => s.status === 'plan').length;
      return {
        id: m.id, name: m.name, color: m.color || 'lavender',
        isManager: m.id === org.manager_id,
        tags: (cardMap[m.id] ? cardOf(cardMap[m.id]).tags : (m.tags || [])),
        students: mine.length, onPlan: mine.length ? Math.round((ok / mine.length) * 100) : 0,
        risk: mine.filter((s) => s.status !== 'plan').length, updated: 'сегодня'
      };
    });

    return json({
      ok: true,
      myRole: 'admin',
      org: toOrg(Object.assign({}, org, { manager_name: (mentors.find((m) => m.id === org.manager_id) || {}).name || '' })),
      mentors, mentorStats, students: fullList,
      templates: (templates.results || []).map((t) => ({
        id: t.id, title: t.title, tags: P2(t.tags, []), grade: t.grade || '', items: P2(t.items, []),
        assigned: fullList.filter((s) => (cardMap[s.id] || {}).template_id === t.id).length, createdAt: t.created_at
      })),
      tagGroups: (tagGroups.results || []).map((t) => ({ id: t.id, title: t.title, tags: P2(t.tags, []) })),
      kpi: { students: total, onPlan: byPlan, onPlanPct: total ? Math.round((byPlan / total) * 100) : 0, lag, risk, mentors: mentors.length }
    }, 200, origin);
  }

  if (path === '/org/student' && method === 'GET') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const id = url.searchParams.get('id') || '';
    if (!(await canSeeStudent(org, id))) return json({ ok: false, error: 'Нет доступа к карточке ученика' }, 403, origin);

    const [row, cardRow, portfolio, slots, events, plans, reports, sprints] = await Promise.all([
      db.prepare('select * from users where id=?').bind(id).first(),
      db.prepare('select * from org_students where user_id=?').bind(id).first(),
      db.prepare('select * from org_portfolio where user_id=? order by created_at desc limit 200').bind(id).all(),
      db.prepare('select * from org_slots where org_id=? and student_id=? order by date limit 500').bind(org.id, id).all(),
      db.prepare('select * from events where id in (select event_id from saved_events where user_id=?) limit 100').bind(id).all(),
      db.prepare("select * from plan_items where user_id=? and (chat_id is null or chat_id='') order by start_at limit 300").bind(id).all(),
      db.prepare('select * from org_reports where user_id=? order by created_at desc limit 30').bind(id).all(),
      db.prepare('select * from org_sprints where org_id=? and user_id=? order by start_date limit 60').bind(org.id, id).all()
    ]);

    const st = studentStatus(slots.results || []);
    const pf = portfolio.results || [];
    const tu = toUser(row);
    const mentorRow = (cardRow && cardRow.mentor_id)
      ? await db.prepare('select id,name from users where id=?').bind(cardRow.mentor_id).first()
      : (org.manager_id ? await db.prepare('select id,name from users where id=?').bind(org.manager_id).first() : null);
    return json({
      ok: true,
      user: Object.assign(adminUser(tu), { portfolio: tu.portfolio || null }),
      mentorName: mentorRow ? mentorRow.name : '',
      card: cardRow ? cardOf(cardRow) : { userId: id, tags: [], status: st.status },
      status: st.status, overdue: st.overdue, days: st.days || 0,
      achievements: pf.filter((x) => x.kind === 'achievement').map((x) => ({ id: x.id, title: x.title, note: x.note || '', year: x.year || '', file: x.file_name || '', size: x.file_size || 0, fileData: x.file_data || '' })),
      projects: pf.filter((x) => x.kind === 'project').map((x) => ({ id: x.id, title: x.title, note: x.note || '', year: x.year || '', file: x.file_name || '', size: x.file_size || 0, fileData: x.file_data || '' })),
      certificates: pf.filter((x) => x.kind === 'certificate').map((x) => ({ id: x.id, title: x.title, note: x.note || '', year: x.year || '', file: x.file_name || '', size: x.file_size || 0, fileData: x.file_data || '' })),
      slots: (slots.results || []).map((s) => ({
        id: s.id, title: s.title, note: s.note || '', date: s.date, kind: s.kind, done: !!s.done,
        studentId: s.student_id, importance: s.importance || 'middle', notify: !!s.notify
      })),
      events: (events.results || []).map((x) => ({ id: x.id, title: x.title, date: x.deadline_date, category: x.category })),
      sprints: (sprints.results || []).map((x) => ({
        id: x.id, title: x.title, project: x.project || '', startDate: x.start_date, endDate: x.end_date,
        status: x.status || 'plan'
      })),
      plan: (plans.results || []).map(toPlan),
      reports: (reports.results || []).map((r) => ({
        id: r.id, period: r.period, comment: r.comment || '', createdAt: r.created_at, payload: P2(r.payload, null)
      }))
    }, 200, origin);
  }

  if (path === '/org/student' && method === 'PATCH') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const id = String(body.userId || '');
    if (!(await canSeeStudent(org, id))) return json({ ok: false, error: 'Нет доступа к карточке ученика' }, 403, origin);

    const cur = await db.prepare('select * from org_students where user_id=?').bind(id).first();
    const base = cur ? cardOf(cur) : { tags: [], gpa: '', sat: '', ielts: '', goal: '', mentorId: org.manager_id || null };
    const pick = (k, cur2) => (body[k] != null ? str(body[k], 200) : cur2);
    const tags = body.tags != null ? JSON.stringify((Array.isArray(body.tags) ? body.tags : []).slice(0, 20).map((t) => str(t, 40))) : JSON.stringify(base.tags);
    const nextMentorId = isMentor() ? base.mentorId : (body.mentorId !== undefined ? (body.mentorId || null) : base.mentorId);
    const nextTplId = isMentor() ? (base.templateId || null) : (body.templateId !== undefined ? (body.templateId || null) : (base.templateId || null));

    await db.prepare(
      `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,template_id,updated_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       on conflict(user_id) do update set mentor_id=excluded.mentor_id,tags=excluded.tags,grade=excluded.grade,
         gpa=excluded.gpa,gpa_note=excluded.gpa_note,sat=excluded.sat,sat_note=excluded.sat_note,
         ielts=excluded.ielts,ielts_note=excluded.ielts_note,goal=excluded.goal,goal_note=excluded.goal_note,
         template_id=excluded.template_id,updated_at=excluded.updated_at`
    ).bind(id, nextMentorId, tags,
      pick('grade', base.grade || ''),
      pick('gpa', base.gpa), pick('gpaNote', base.gpaNote),
      pick('sat', base.sat), pick('satNote', base.satNote),
      pick('ielts', base.ielts), pick('ieltsNote', base.ieltsNote),
      pick('goal', base.goal), pick('goalNote', base.goalNote),
      body.status || base.status || 'plan',
      nextTplId, nowISO()).run();

    await audit(env, me.id, 'org.student.update', id, 'карточка ученика');
    return json({ ok: true }, 200, origin);
  }

  if (path === '/org/portfolio' && method === 'POST') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const id = String(body.userId || '');
    if (!(await canSeeStudent(org, id))) return json({ ok: false, error: 'Нет доступа к карточке ученика' }, 403, origin);
    const kind = ['achievement', 'project', 'certificate'].includes(body.kind) ? body.kind : 'achievement';
    const title = str(body.title, 160).trim();
    if (!title) return json({ ok: false, error: 'Нужно название' }, 400, origin);
    const pid = uid('pf');
    await db.prepare('insert into org_portfolio (id,user_id,kind,title,note,year,file_name,file_size,file_data,created_at) values (?,?,?,?,?,?,?,?,?,?)')
      .bind(pid, id, kind, title, str(body.note, 400), str(body.year, 40),
        str(body.fileName, 160), Number(body.fileSize) || 0, str(body.fileData, 700000) || null, nowISO()).run();
    await audit(env, me.id, 'org.portfolio.add', pid, kind + ': ' + title);
    return json({ ok: true, id: pid }, 201, origin);
  }

  m = path.match(/^\/org\/portfolio\/([^/]+)$/);
  if (m) {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    const row = await db.prepare('select * from org_portfolio where id=?').bind(m[1]).first();
    if (!row || !(await canSeeStudent(org, row.user_id))) return json({ ok: false, error: 'Запись не найдена' }, 404, origin);
    if (method === 'DELETE') {
      await db.prepare('delete from org_portfolio where id=?').bind(row.id).run();
      return json({ ok: true }, 200, origin);
    }
    if (method === 'PATCH') {
      await db.prepare('update org_portfolio set title=?,note=?,year=? where id=?')
        .bind(body.title != null ? str(body.title, 160) : row.title,
          body.note != null ? str(body.note, 400) : row.note,
          body.year != null ? str(body.year, 40) : row.year, row.id).run();
      return json({ ok: true }, 200, origin);
    }
  }


  /* ── прикрепить / перевести ученика, удалить карточку ── */

  m = path.match(/^\/org\/students\/([^/]+)\/(mentor|remove)$/);
  if (m) {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    if (!(await canSeeStudent(org, m[1]))) return json({ ok: false, error: 'Ученик не из этой организации' }, 404, origin);

    if (m[2] === 'mentor' && method === 'POST') {
      const mentorId = String(body.mentorId || '');
      const mentor = mentorId
        ? await db.prepare("select * from users where id=? and org_id=? and (role='org' or org_role='mentor')").bind(mentorId, org.id).first()
        : null;
      if (mentorId && !mentor) return json({ ok: false, error: 'Ментор не найден в организации' }, 404, origin);
      await db.prepare(
        `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
         values (?,?,'[]','','','','','','','','','','plan',?)
         on conflict(user_id) do update set mentor_id=excluded.mentor_id, updated_at=excluded.updated_at`
      ).bind(m[1], mentor ? mentor.id : null, nowISO()).run();
      await audit(env, me.id, 'org.student.mentor', m[1], mentor ? mentor.name : 'без ментора');
      return json({ ok: true, mentorId: mentor ? mentor.id : null }, 200, origin);
    }

    if (m[2] === 'remove' && method === 'POST') {
      await db.prepare('delete from org_portfolio where user_id=?').bind(m[1]).run();
      await db.prepare('delete from org_students where user_id=?').bind(m[1]).run();
      await db.prepare('delete from org_slots where org_id=? and student_id=?').bind(org.id, m[1]).run();
      await db.prepare('update users set org_id=null, org_role=null where id=?').bind(m[1]).run();
      await audit(env, me.id, 'org.student.remove', m[1], 'карточка откреплена');
      return json({ ok: true }, 200, origin);
    }
  }

  /* ── шаблон из роадмапа ученика ── */
  if (path === '/org/templates/from-student' && method === 'POST') {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    const id = String(body.userId || '');
    if (!(await canSeeStudent(org, id))) return json({ ok: false, error: 'Ученик не найден' }, 404, origin);
    const [user, slots] = await Promise.all([
      db.prepare('select * from users where id=?').bind(id).first(),
      db.prepare('select * from org_slots where org_id=? and student_id=? order by date').bind(org.id, id).all()
    ]);
    const items = (slots.results || []).map((s) => {
      const d = new Date(s.date);
      return { title: s.title, month: d.getMonth(), day: d.getDate(), kind: s.kind === 'milestone' ? 'course' : 'date', note: s.note || '' };
    });
    const tid = uid('tpl');
    await db.prepare('insert into roadmap_templates (id,org_id,title,tags,grade,items,created_at) values (?,?,?,?,?,?,?)')
      .bind(tid, org.id, 'Из роадмапа · ' + (user ? user.name.split(' ')[0] : ''), '[]',
        str(user ? user.grade : '', 20), JSON.stringify(items), nowISO()).run();
    await audit(env, me.id, 'org.template.fromStudent', tid, id);
    return json({ ok: true, id: tid, items: items.length }, 201, origin);
  }

  /* ── группы тегов для шаблонов («+ Новая группа тегов») ── */

  if (path === '/org/tag-groups' && method === 'POST') {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const title = str(body.title, 120).trim();
    if (!title) return json({ ok: false, error: 'Нужно название группы' }, 400, origin);
    const tags = (Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(','))
      .map((t) => str(t, 30).trim().replace(/^#/, '')).filter(Boolean).slice(0, 12);
    if (!tags.length) return json({ ok: false, error: 'Добавьте хотя бы один тег' }, 400, origin);
    const id = uid('tg');
    await db.prepare('insert into org_tag_groups (id,org_id,title,tags,created_at) values (?,?,?,?,?)')
      .bind(id, org.id, title, JSON.stringify(tags), nowISO()).run();
    await audit(env, me.id, 'org.taggroup.add', id, title + ': ' + tags.join(', '));
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/org\/tag-groups\/([^/]+)$/);
  if (m && method === 'DELETE') {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    const row = await db.prepare('select * from org_tag_groups where id=?').bind(m[1]).first();
    if (!row || !org || row.org_id !== org.id) return json({ ok: false, error: 'Группа не найдена' }, 404, origin);
    await db.prepare('delete from org_tag_groups where id=?').bind(row.id).run();
    return json({ ok: true }, 200, origin);
  }

  if (path === '/org/templates' && method === 'POST') {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const title = str(body.title, 120).trim();
    if (!title) return json({ ok: false, error: 'Нужно название шаблона' }, 400, origin);
    const id = body.id ? String(body.id) : uid('tpl');
    const items = JSON.stringify((Array.isArray(body.items) ? body.items : []).slice(0, 200).map((it) => ({
      title: str(it.title, 160), month: Math.max(0, Math.min(11, Number(it.month) || 0)),
      day: Math.max(1, Math.min(28, Number(it.day) || 1)), kind: str(it.kind || 'date', 20),
      grade: str(it.grade || '', 10), note: str(it.note, 200),
      offset: (it.offset === null || it.offset === undefined || it.offset === '') ? null
        : Math.max(-365, Math.min(1460, Number(it.offset) || 0)),
      weeks: Math.max(0, Math.min(60, Number(it.weeks) || 0))
    })));
    const exists = await db.prepare('select id from roadmap_templates where id=? and org_id=?').bind(id, org.id).first();
    if (exists) {
      await db.prepare('update roadmap_templates set title=?,tags=?,grade=?,items=? where id=?')
        .bind(title, JSON.stringify((body.tags || []).slice(0, 12).map((t) => str(t, 30))), str(body.grade, 20), items, id).run();
    } else {
      await db.prepare('insert into roadmap_templates (id,org_id,title,tags,grade,items,created_at) values (?,?,?,?,?,?,?)')
        .bind(id, org.id, title, JSON.stringify((body.tags || []).slice(0, 12).map((t) => str(t, 30))), str(body.grade, 20), items, nowISO()).run();
    }
    await audit(env, me.id, 'org.template.save', id, title);
    return json({ ok: true, id }, exists ? 200 : 201, origin);
  }

  m = path.match(/^\/org\/templates\/([^/]+)(\/assign)?$/);
  if (m) {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    const row = await db.prepare('select * from roadmap_templates where id=? and org_id=?').bind(m[1], org.id).first();
    if (!row) return json({ ok: false, error: 'Шаблон не найден' }, 404, origin);

    if (m[2] === '/assign' && method === 'POST') {
      const ids = Array.isArray(body.userIds) ? body.userIds.map(String).slice(0, 200) : [];
      const items = P2(row.items, []);
      const now = new Date();
      // дата старта потока: от неё считаются относительные слоты (offset)
      const startRaw = String(body.startDate || '').slice(0, 10);
      const startDate = /^\d{4}-\d{2}-\d{2}$/.test(startRaw)
        ? new Date(startRaw + 'T09:00:00') : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (const sid of ids) {
        if (!(await canSeeStudent(org, sid))) continue;
        await db.prepare(
          `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,template_id,updated_at)
           values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           on conflict(user_id) do update set template_id=excluded.template_id, updated_at=excluded.updated_at`
        ).bind(sid, org.manager_id || null, '[]', '', '', '', '', '', '', '', '', '', 'plan', row.id, nowISO()).run();

        for (const it of items) {
          let d;
          if (it.offset !== null && it.offset !== undefined) {
            d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + Number(it.offset));
          } else {
            d = new Date(now.getFullYear(), it.month, it.day);
            if (d < now) d.setFullYear(d.getFullYear() + 1);
          }
          const id2 = uid('slot');
          await db.prepare('insert into org_slots (id,org_id,student_id,title,note,date,kind,done,created_by,created_at) values (?,?,?,?,?,?,?,0,?,?)')
            .bind(id2, org.id, sid, it.title, it.note || '', d.toISOString().slice(0, 10),
              it.kind === 'course' ? 'milestone' : 'internal', me.id, nowISO()).run();
        }
      }
      await audit(env, me.id, 'org.template.assign', row.id, ids.length + ' ученикам с ' + startDate.toISOString().slice(0, 10));
      return json({ ok: true, assigned: ids.length, startDate: startDate.toISOString().slice(0, 10) }, 200, origin);
    }
    if (method === 'DELETE') {
      await db.prepare('delete from roadmap_templates where id=?').bind(row.id).run();
      return json({ ok: true }, 200, origin);
    }
  }

  /* ── спринты проектов: подкалендарь команды ── */

  if (path === '/org/sprints' && method === 'POST') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const sid = String(body.userId || '');
    if (!(await canSeeStudent(org, sid))) return json({ ok: false, error: 'Нет доступа к ученику' }, 403, origin);
    const title = str(body.title, 160).trim();
    const start = String(body.startDate || '').slice(0, 10);
    const end = String(body.endDate || '').slice(0, 10) || start;
    if (!title) return json({ ok: false, error: 'Нужно название спринта' }, 400, origin);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return json({ ok: false, error: 'Нужна дата начала' }, 400, origin);
    const id = uid('spr');
    await db.prepare('insert into org_sprints (id,org_id,user_id,project,title,start_date,end_date,status,created_at) values (?,?,?,?,?,?,?,?,?)')
      .bind(id, org.id, sid, str(body.project, 160), title, start, end,
        ['plan', 'active', 'done'].includes(body.status) ? body.status : 'plan', nowISO()).run();
    await audit(env, me.id, 'org.sprint.add', id, title);
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/org\/sprints\/([^/]+)$/);
  if (m) {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    const row = await db.prepare('select * from org_sprints where id=?').bind(m[1]).first();
    if (!row || !org || row.org_id !== org.id || !(await canSeeStudent(org, row.user_id))) {
      return json({ ok: false, error: 'Спринт не найден' }, 404, origin);
    }
    if (method === 'DELETE') {
      await db.prepare('delete from org_sprints where id=?').bind(row.id).run();
      return json({ ok: true }, 200, origin);
    }
    if (method === 'PATCH') {
      await db.prepare('update org_sprints set title=?,start_date=?,end_date=?,status=? where id=?')
        .bind(str(body.title, 160) || row.title,
          String(body.startDate || row.start_date).slice(0, 10),
          String(body.endDate || row.end_date).slice(0, 10),
          ['plan', 'active', 'done'].includes(body.status) ? body.status : row.status, row.id).run();
      return json({ ok: true }, 200, origin);
    }
  }

  /* ── алерты кабинета: что горит в ближайшие 48 часов ── */

  if (path === '/org/alerts' && method === 'GET') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: true, soon: [], overdue: [] }, 200, origin);
    const [members, slots, cards] = await Promise.all([
      db.prepare('select * from users where org_id=? limit 500').bind(org.id).all(),
      db.prepare('select * from org_slots where org_id=? order by date limit 2000').bind(org.id).all(),
      db.prepare('select * from org_students').all()
    ]);
    const cardMap = {}; (cards.results || []).forEach((c) => { cardMap[c.user_id] = c; });
    const mentorFlag = isMentor();
    const visible = (members.results || []).filter((u) => u.role === 'student' && u.org_role !== 'mentor' &&
      (!mentorFlag ? true : (cardMap[u.id] || {}).mentor_id === me.id));
    const visibleIds = new Set(visible.map((u) => u.id));
    const nameOf = {}; visible.forEach((u) => { nameOf[u.id] = u.name; });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in48 = new Date(today.getTime() + 2 * 86400000);
    const soon = [], overdue = [];
    for (const s of (slots.results || [])) {
      if (!visibleIds.has(s.student_id)) continue;
      const d = new Date(String(s.date).slice(0, 10) + 'T00:00:00');
      const base = { id: s.id, title: s.title, date: s.date, studentId: s.student_id, student: nameOf[s.student_id] || '',
        importance: s.importance || 'middle', notify: !!s.notify };
      if (s.done) continue;
      if (d < today) overdue.push(Object.assign(base, { days: Math.round((today - d) / 86400000) }));
      else if (d <= in48) soon.push(Object.assign(base, { days: Math.round((d - today) / 86400000) }));
    }
    soon.sort((a, b) => a.date.localeCompare(b.date));
    overdue.sort((a, b) => a.date.localeCompare(b.date));
    return json({ ok: true, soon: soon.slice(0, 50), overdue: overdue.slice(0, 50),
      counts: { soon: soon.length, overdue: overdue.length } }, 200, origin);
  }

  /* ── дайджест родителю: готовый текст по ученику ── */

  if (path === '/org/digest' && method === 'GET') {
    const g = orgGuard(); if (g) return g;
    const org = await myOrgRow();
    const id = url.searchParams.get('user') || '';
    if (!org || !(await canSeeStudent(org, id))) return json({ ok: false, error: 'Ученик не найден' }, 404, origin);
    const [u, cardRow, slots, pf] = await Promise.all([
      db.prepare('select * from users where id=?').bind(id).first(),
      db.prepare('select * from org_students where user_id=?').bind(id).first(),
      db.prepare('select * from org_slots where org_id=? and student_id=? order by date limit 400').bind(org.id, id).all(),
      db.prepare('select * from org_portfolio where user_id=? order by created_at desc limit 100').bind(id).all()
    ]);
    const st = studentStatus(slots.results || []);
    const all = (slots.results || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const done = all.filter((s) => s.done).slice(-4);
    const next = all.filter((s) => !s.done && new Date(String(s.date).slice(0, 10) + 'T00:00:00') >= today).slice(0, 4);
    const late = all.filter((s) => !s.done && new Date(String(s.date).slice(0, 10) + 'T00:00:00') < today);
    const pfAll = pf.results || [];
    const fmt = (d) => { const x = new Date(String(d).slice(0, 10) + 'T00:00:00'); return x.getDate() + ' ' + MONTHS_RU[x.getMonth()]; };
    const c = cardRow ? cardOf(cardRow) : {};
    const lines = [];
    lines.push('Дайджест для родителей · ' + (u ? u.name : '') + (c.grade ? ', ' + c.grade + ' класс' : ''));
    lines.push('Организация: ' + org.name + ' · ' + fmt(new Date()) + ' ' + new Date().getFullYear());
    lines.push('');
    lines.push('Статус: ' + ({ plan: 'идёт по плану', lag: 'есть отставание', risk: 'нужно внимание' }[st.status] || 'по плану') +
      (late.length ? '. Просрочено событий: ' + late.length + '.' : '. Просрочек нет.'));
    if (done.length) { lines.push(''); lines.push('Сделано за период:'); done.forEach((s) => lines.push('• ' + s.title + ' — ' + fmt(s.date))); }
    if (next.length) { lines.push(''); lines.push('Впереди:'); next.forEach((s) => lines.push('• ' + fmt(s.date) + ' — ' + s.title)); }
    if (pfAll.length) {
      lines.push('');
      lines.push('Портфолио: ' + pfAll.filter((x) => x.kind === 'achievement').length + ' достижений, ' +
        pfAll.filter((x) => x.kind === 'project').length + ' проектов, ' +
        pfAll.filter((x) => x.kind === 'certificate').length + ' сертификатов.');
    }
    if (c.gpa || c.sat || c.ielts) {
      lines.push('Показатели: ' + [c.gpa && ('GPA ' + c.gpa), c.sat && ('SAT ' + c.sat), c.ielts && ('IELTS ' + c.ielts)]
        .filter(Boolean).join(' · '));
    }
    lines.push('');
    lines.push('Написать ментору можно в чате приложения.');
    return json({ ok: true, text: lines.join('\n'), status: st.status }, 200, origin);
  }

  /* ── балансировка нагрузки менторов ── */

  if (path === '/org/balance' && method === 'GET') {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const [members, cards, slots] = await Promise.all([
      db.prepare('select * from users where org_id=? limit 500').bind(org.id).all(),
      db.prepare('select * from org_students').all(),
      db.prepare('select * from org_slots where org_id=? order by date limit 2000').bind(org.id).all()
    ]);
    const mentorRows = (members.results || []).filter((u) => u.org_role === 'mentor' || u.role === 'org');
    // менеджер организации может не иметь org_role — добавляем его как ментора по умолчанию
    const mgr = (members.results || []).find((u) => u.id === org.manager_id);
    const mentors = mgr && !mentorRows.some((u) => u.id === mgr.id) ? mentorRows.concat([mgr]) : mentorRows;
    const cardMap = {}; (cards.results || []).forEach((c) => { cardMap[c.user_id] = c; });
    // те же правила, что и в /org/crm: ученик — это роль student без роли ментора
    const students = (members.results || []).filter((u) => u.role === 'student' && u.org_role !== 'mentor');
    const slotsBy = {};
    (slots.results || []).forEach((s) => { (slotsBy[s.student_id] = slotsBy[s.student_id] || []).push(s); });

    const load = {};
    mentors.forEach((m) => { load[m.id] = { id: m.id, name: m.name, students: 0, risky: 0 }; });
    students.forEach((s) => {
      const mid = (cardMap[s.id] ? cardOf(cardMap[s.id]).mentorId : null) || org.manager_id;
      if (!mid || !load[mid]) return;
      load[mid].students += 1;
      if (studentStatus(slotsBy[s.id] || []).status !== 'plan') load[mid].risky += 1;
    });
    const arr = Object.values(load);
    const avg = arr.length ? arr.reduce((a, b) => a + b.students, 0) / arr.length : 0;
    const suggestions = [];
    // считаем «как будет после передачи» отдельно — фактические цифры не меняем
    const plan = {};
    arr.forEach((m) => { plan[m.id] = m.students; });
    const heavy = arr.filter((m) => m.students > Math.ceil(avg) && m.students > 1).sort((a, b) => b.students - a.students);
    const light = arr.filter((m) => m.students < Math.floor(avg) || (m.students === 0 && arr.length > 1)).sort((a, b) => a.students - b.students);
    for (const h of heavy) {
      const target = light.find((l) => plan[l.id] < plan[h.id] - 1);
      if (!target) continue;
      // переводим учеников со статусом не «по плану», начиная с самых проблемных
      const pool = students.filter((s) => ((cardMap[s.id] ? cardOf(cardMap[s.id]).mentorId : null) || org.manager_id) === h.id)
        .map((s) => ({ id: s.id, name: s.name, status: studentStatus(slotsBy[s.id] || []).status }))
        .filter((s) => s.status !== 'plan');
      const move = pool.slice(0, Math.max(1, Math.floor((plan[h.id] - plan[target.id]) / 2)));
      if (move.length) {
        suggestions.push({
          from: { id: h.id, name: h.name, students: plan[h.id] },
          to: { id: target.id, name: target.name, students: plan[target.id] },
          students: move
        });
        plan[h.id] -= move.length;
        plan[target.id] += move.length;
      }
    }
    return json({ ok: true, load: arr, avg: Math.round(avg * 10) / 10, suggestions }, 200, origin);
  }

  if (path === '/org/report' && method === 'GET') {
    const g = orgGuard(); if (g) return g;
    const org = await myOrgRow();
    const id = url.searchParams.get('user') || '';
    if (!(await canSeeStudent(org, id))) return json({ ok: false, error: 'Ученик не найден' }, 404, origin);
    const period = ['month', 'quarter', 'year'].includes(url.searchParams.get('period'))
      ? url.searchParams.get('period') : 'month';
    const days = period === 'month' ? 30 : period === 'quarter' ? 92 : 365;
    const from = new Date(Date.now() - days * 864e5);

    const [user, slots, pf] = await Promise.all([
      db.prepare('select * from users where id=?').bind(id).first(),
      db.prepare('select * from org_slots where org_id=? and student_id=? order by date').bind(org.id, id).all(),
      db.prepare('select * from org_portfolio where user_id=?').bind(id).all()
    ]);
    const all = slots.results || [];
    const inRange = all.filter((s) => Date.parse(s.date) >= from.getTime());
    const done = inRange.filter((s) => s.done);
    const future = all.filter((s) => !s.done && Date.parse(s.date) > Date.now()).slice(0, 6);
    const st = studentStatus(all);
    return json({
      ok: true,
      report: {
        user: { id: user.id, name: user.name, grade: user.grade, color: user.color },
        period, from: from.toISOString(), to: nowISO(),
        status: st.status,
        doneCount: done.length, totalCount: inRange.length,
        done: done.slice(0, 8).map((s) => s.title),
        next: future.map((s) => ({ title: s.title, date: s.date })),
        achievements: (pf.results || []).filter((x) => x.kind === 'achievement').slice(0, 5).map((x) => x.title),
        projects: (pf.results || []).filter((x) => x.kind === 'project').slice(0, 5).map((x) => x.title),
        certificates: (pf.results || []).filter((x) => x.kind === 'certificate').slice(0, 5).map((x) => x.title)
      }
    }, 200, origin);
  }

  if (path === '/org/report' && method === 'POST') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    const id = String(body.userId || '');
    if (!(await canSeeStudent(org, id))) return json({ ok: false, error: 'Ученик не найден' }, 404, origin);
    const rid = uid('rep');
    await db.prepare('insert into org_reports (id,user_id,period,comment,payload,created_by,created_at) values (?,?,?,?,?,?,?)')
      .bind(rid, id, str(body.period || 'month', 20), str(body.comment, 2000),
        JSON.stringify(body.payload || null), me.id, nowISO()).run();
    await audit(env, me.id, 'org.report.create', rid, id);
    return json({ ok: true, id: rid }, 201, origin);
  }

  if (path === '/admin/users' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    // админ не видит root; root видит всех
    const sql = me.role === 'root'
      ? 'select * from users order by role, created_at'
      : "select * from users where role != 'root' order by role, created_at";
    const list = await db.prepare(sql).all();
    return json({ ok: true, users: list.results.map((u) => adminUser(toUser(u))) }, 200, origin);
  }

  if (path === '/admin/users' && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const role = ['student', 'admin', 'org'].includes(body.role) ? body.role : 'student';
    if (role === 'admin') {
      const gr = notRoot(); if (gr) return json({ ok: false, error: 'Админов назначает только владелец' }, 403, origin);
    }
    let orgId = body.orgId ? String(body.orgId) : null;
    if (orgId) {
      const org = await db.prepare('select id from organizations where id=?').bind(orgId).first();
      if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    } else if (role === 'org') {
      return json({ ok: false, error: 'Для управляющего выберите организацию' }, 400, origin);
    }

    const login = str(body.login, 120).toLowerCase();
    if (!/^[a-z0-9._@-]{3,40}$/.test(login)) {
      return json({ ok: false, error: 'Логин: 3–40 символов, латиница, цифры, . _ - @' }, 400, origin);
    }
    if (await resolveLogin(env, login)) return json({ ok: false, error: 'Логин занят' }, 409, origin);

    const password = String(body.password || '') || makeOtp();
    const salt = newSalt();
    const id = uid('u');
    await db.prepare(
      `insert into users (id,name,email,pass_hash,salt,role,org_id,grade,school,city,color,created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, str(body.name, 120) || 'Без имени', login.includes('@') ? login : null,
      await hashPassword(password, salt), salt, role, orgId, str(body.grade, 40),
      str(body.school, 120) || 'Школа №1520', 'Москва', 'sky', nowISO()).run();
    await db.prepare('insert into user_logins (login,user_id,created_at) values (?,?,?)')
      .bind(login, id, nowISO()).run();
    await audit(env, me.id, 'user.create', id, login + ' / ' + role + (orgId ? ' / ' + orgId : ''));

    return json({ ok: true, id, login, password }, 201, origin);
  }

  m = path.match(/^\/admin\/users\/((?!bulk-delete$)[^/]+)$/);
  if (m) {
    const g = notAdmin(); if (g) return g;
    const target = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!target) return json({ ok: false, error: 'Пользователь не найден' }, 404, origin);

    // root неприкосновенен для всех, кроме себя
    if (target.role === 'root' && me.role !== 'root') {
      return json({ ok: false, error: 'Недостаточно прав' }, 403, origin);
    }
    // админ не может удалять/менять админов, кроме себя
    if (me.role === 'admin' && target.role === 'admin' && target.id !== me.id) {
      return json({ ok: false, error: 'Другого админа может менять только владелец' }, 403, origin);
    }

    if (method === 'DELETE') {
      if (target.role === 'root') return json({ ok: false, error: 'Владельца удалить нельзя' }, 403, origin);
      await db.prepare('delete from sessions where user_id=?').bind(m[1]).run();
      await db.prepare('delete from user_logins where user_id=?').bind(m[1]).run();
      await db.prepare('delete from chat_members where user_id=?').bind(m[1]).run();
      await db.prepare('delete from users where id=?').bind(m[1]).run();
      await audit(env, me.id, 'user.delete', m[1], target.name);
      return json({ ok: true }, 200, origin);
    }

    if (method === 'PATCH') {
      const login = body.login !== undefined ? str(body.login, 120).toLowerCase() : null;
      if (login) {
        if (!/^[a-z0-9._@-]{3,40}$/.test(login)) {
          return json({ ok: false, error: 'Логин: 3–40 символов, латиница, цифры, . _ - @' }, 400, origin);
        }
        const taken = await db.prepare('select user_id from user_logins where login=?').bind(login).first();
        if (taken && taken.user_id !== target.id) {
          return json({ ok: false, error: 'Логин занят' }, 409, origin);
        }
        const old = await db.prepare('select login from user_logins where user_id=?').bind(target.id).all();
        for (const row of old.results || []) {
          if (row.login !== login) await db.prepare('delete from user_logins where login=?').bind(row.login).run();
        }
        await db.prepare('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)')
          .bind(login, target.id, nowISO()).run();
        await db.prepare('update users set email=? where id=?')
          .bind(login.includes('@') ? login : null, target.id).run();
      }

      const role = body.role;
      if (role && role !== target.role) {
        const gr = notRoot(); if (gr) return json({ ok: false, error: 'Роли меняет только владелец' }, 403, origin);
        if (target.role === 'root') return json({ ok: false, error: 'Роль владельца неизменна' }, 403, origin);
        if (!['student', 'admin', 'org'].includes(role)) return json({ ok: false, error: 'Неизвестная роль' }, 400, origin);
        if (role === 'admin') {
          const gr = notRoot(); if (gr) return json({ ok: false, error: 'Админов назначает только владелец' }, 403, origin);
        }
        await db.prepare('update users set role=? where id=?').bind(role, target.id).run();
        await audit(env, me.id, 'user.role', target.id, role);
      }

      // привязка к организации: у управляющего она обязательна
      if (body.orgId !== undefined) {
        const nextOrg = body.orgId ? String(body.orgId) : null;
        const finalRole = role && ['student', 'admin', 'org'].includes(role) ? role : target.role;
        if (nextOrg) {
          const org = await db.prepare('select id from organizations where id=?').bind(nextOrg).first();
          if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
        } else if (finalRole === 'org') {
          return json({ ok: false, error: 'Управляющий должен быть привязан к организации' }, 400, origin);
        }
        await db.prepare('update users set org_id=? where id=?').bind(nextOrg, target.id).run();
        await audit(env, me.id, 'user.org', target.id, nextOrg || '—');
      }

      // меняем только присланные поля — остальное не затираем
      const fields = [], vals = [];
      const put = (col, val) => { fields.push(col + '=?'); vals.push(val); };
      if (body.name !== undefined) put('name', str(body.name, 120) || target.name);
      if (body.grade !== undefined) put('grade', str(body.grade, 40));
      if (body.school !== undefined) put('school', str(body.school, 120));
      if (body.city !== undefined) put('city', str(body.city, 60));
      if (body.position !== undefined) put('position', str(body.position, 120));
      if (body.blocked !== undefined) put('blocked', body.blocked ? 1 : 0);
      if (fields.length) {
        const stmt = db.prepare('update users set ' + fields.join(', ') + ' where id=?');
        await stmt.bind(...vals, target.id).run();
      }

      if (body.blocked) await db.prepare('delete from sessions where user_id=?').bind(target.id).run();
      await audit(env, me.id, 'user.update', target.id, target.name);
      return json({ ok: true }, 200, origin);
    }
  }

  /* сброс пароля пользователю */
  m = path.match(/^\/admin\/users\/([^/]+)\/password$/);
  if (m && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const target = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!target) return json({ ok: false, error: 'Пользователь не найден' }, 404, origin);
    if (target.role === 'root' && me.role !== 'root') return json({ ok: false, error: 'Недостаточно прав' }, 403, origin);
    if (me.role === 'admin' && target.role === 'admin' && target.id !== me.id) {
      return json({ ok: false, error: 'Пароль другому админу меняет только владелец' }, 403, origin);
    }
    const password = String(body.password || '') || makeOtp();
    if (password.length < 6) return json({ ok: false, error: 'Пароль минимум 6 символов' }, 400, origin);
    const salt = newSalt();
    await db.prepare('update users set pass_hash=?, salt=?, pass=null where id=?')
      .bind(await hashPassword(password, salt), salt, target.id).run();
    await db.prepare('delete from sessions where user_id=?').bind(target.id).run();
    await audit(env, me.id, 'user.password', target.id, target.name);
    return json({ ok: true, password }, 200, origin);
  }

  /* одноразовый пароль на 24 часа */
  m = path.match(/^\/admin\/users\/([^/]+)\/otp$/);
  if (m && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const target = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!target) return json({ ok: false, error: 'Пользователь не найден' }, 404, origin);
    if (target.role === 'root' && me.role !== 'root') return json({ ok: false, error: 'Недостаточно прав' }, 403, origin);
    if (me.role === 'admin' && target.role === 'admin' && target.id !== me.id) {
      return json({ ok: false, error: 'Ключ другому админу выдаёт только владелец' }, 403, origin);
    }

    const code = makeOtp();
    const salt = newSalt();
    const expires = new Date(Date.now() + 24 * 3600e3).toISOString();
    await db.prepare(
      'insert into otp_codes (id,user_id,code_hash,salt,expires_at,used,created_by,created_at) values (?,?,?,?,?,0,?,?)'
    ).bind(uid('otp'), target.id, await hashPassword(code, salt), salt, expires, me.id, nowISO()).run();
    await audit(env, me.id, 'user.otp', target.id, target.name);
    return json({ ok: true, code, expires, login: target.email || target.id }, 200, origin);
  }

  /* снять все сессии пользователя */
  m = path.match(/^\/admin\/users\/([^/]+)\/sessions$/);
  if (m && method === 'DELETE') {
    const g = notAdmin(); if (g) return g;
    const target = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!target) return json({ ok: false, error: 'Не найдено' }, 404, origin);
    if (target.role === 'root' && me.role !== 'root') return json({ ok: false, error: 'Недостаточно прав' }, 403, origin);
    const res = await db.prepare('delete from sessions where user_id=?').bind(m[1]).run();
    return json({ ok: true, removed: res.meta ? res.meta.changes : 0 }, 200, origin);
  }

  /* ── модерация ── */
  if (path === '/admin/moderation' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    const list = await db.prepare('select * from posts order by created_at desc').all();
    return json({ ok: true, posts: list.results.map(toPost) }, 200, origin);
  }

  if (path === '/admin/moderation/cleanup' && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const days = Math.max(1, Number(body.days) || 30);
    const before = new Date(Date.now() - days * 864e5).toISOString();
    const res = await db.prepare(
      "delete from posts where status != 'published' and created_at < ?"
    ).bind(before).run();
    await db.prepare("delete from posts where status='removed'").run();
    await audit(env, me.id, 'moderation.cleanup', null, days + ' дней');
    return json({ ok: true, removed: res.meta ? res.meta.changes : 0, days }, 200, origin);
  }

  /* ── ИИ-ключи ── */
  if (path === '/admin/ai-keys' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    const list = await db.prepare('select * from ai_keys order by created_at').all();
    return json({
      ok: true,
      keys: list.results.map((k) => ({
        id: k.id, label: k.label, endpoint: k.endpoint || '',
        masked: '••••' + String(k.secret || '').slice(-4),
        lastResponse: k.last_response || null,
        enabled: !!k.enabled, lastStatus: k.last_status || null,
        lastChecked: k.last_checked || null, usedCount: k.used_count || 0,
        createdAt: k.created_at
      })),
      envKeys: String(env.GEMINI_KEYS || '').split(',').filter(Boolean).length
    }, 200, origin);
  }

  if (path === '/admin/ai-keys' && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const key = str(body.key, 200);
    if (key.length < 10) return json({ ok: false, error: 'Ключ слишком короткий' }, 400, origin);
    const endpoint = str(body.endpoint, 400).trim();
    if (!/^https:\/\/[^\s]+$/i.test(endpoint)) {
      return json({ ok: false, error: 'Укажите ссылку на эндпоинт модели (https://…)' }, 400, origin);
    }
    const id = uid('key');
    await db.prepare('insert into ai_keys (id,label,secret,endpoint,enabled,created_at) values (?,?,?,?,1,?)')
      .bind(id, str(body.label, 60) || 'Gemini', key, endpoint, nowISO()).run();
    await audit(env, me.id, 'ai.add', id);
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/admin\/ai-keys\/([^/]+)$/);
  if (m) {
    const g = notAdmin(); if (g) return g;
    if (method === 'PATCH') {
      if (typeof body.endpoint === 'string') {
        const endpoint = body.endpoint.trim();
        if (!/^https:\/\/[^\s]+$/i.test(endpoint)) {
          return json({ ok: false, error: 'Некорректная ссылка на эндпоинт' }, 400, origin);
        }
        await db.prepare('update ai_keys set endpoint=? where id=?').bind(endpoint, m[1]).run();
      }
      if (typeof body.label === 'string' && body.label.trim()) {
        await db.prepare('update ai_keys set label=? where id=?').bind(str(body.label, 60), m[1]).run();
      }
      if (typeof body.enabled !== 'undefined') {
        await db.prepare('update ai_keys set enabled=? where id=?').bind(body.enabled ? 1 : 0, m[1]).run();
      }
      return json({ ok: true }, 200, origin);
    }
    if (method === 'DELETE') {
      await db.prepare('delete from ai_keys where id=?').bind(m[1]).run();
      await audit(env, me.id, 'ai.delete', m[1]);
      return json({ ok: true }, 200, origin);
    }
  }

  m = path.match(/^\/admin\/ai-keys\/([^/]+)\/test$/);
  if (m && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const row = await db.prepare('select * from ai_keys where id=?').bind(m[1]).first();
    if (!row) return json({ ok: false, error: 'Ключ не найден' }, 404, origin);
    const started = Date.now();
    try {
      const out = await callGemini(env, 'Ответь одним словом: работает', 'gemini-2.0-flash', row.secret, row.endpoint);
      const ms = Date.now() - started;
      const raw = String(out.raw || '').slice(0, 2000);
      await db.prepare("update ai_keys set last_status='ok', last_checked=?, last_response=?, used_count=used_count+1 where id=?")
        .bind(nowISO(), raw, m[1]).run();
      return json({ ok: true, status: 'ok', httpStatus: out.status, ms, sample: out.text.slice(0, 200), raw }, 200, origin);
    } catch (e) {
      const ms = Date.now() - started;
      const raw = String(e.raw || '').slice(0, 2000);
      await db.prepare('update ai_keys set last_status=?, last_checked=?, last_response=? where id=?')
        .bind('error: ' + str(e.message, 120), nowISO(), raw || String(e.message || e), m[1]).run();
      return json({ ok: false, error: String(e.message || e), ms, raw }, 200, origin);
    }
  }

  /* ── вход в аккаунт ученика (поддержка) ── */
  m = path.match(/^\/admin\/users\/([^/]+)\/impersonate$/);
  if (m && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const target = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!target) return json({ ok: false, error: 'Пользователь не найден' }, 404, origin);
    if (target.role === 'root' && me.role !== 'root') {
      return json({ ok: false, error: 'Недостаточно прав' }, 403, origin);
    }
    if (target.role !== 'student' && target.id !== me.id && me.role !== 'root') {
      return json({ ok: false, error: 'Администратора может открыть только владелец' }, 403, origin);
    }
    if (target.blocked) return json({ ok: false, error: 'Аккаунт заблокирован' }, 403, origin);

    const sess = await createSession(env, target.id, request.headers.get('user-agent') || 'support');
    await audit(env, me.id, 'user.impersonate', target.id, target.name);
    return json({ ok: true, token: sess.token, user: publicUser(toUser(target)) }, 200, origin);
  }

  /* ── пакетное удаление ── */
  if (path === '/admin/users/bulk-delete' && method === 'POST') {
    const g = notRoot(); if (g) return g;
    const ids = (Array.isArray(body.ids) ? body.ids : []).filter((id) => id && id !== ROOT_ID);
    if (!ids.length) return json({ ok: false, error: 'Никого не выбрано' }, 400, origin);
    let removed = 0;
    for (const id of ids) {
      const r = await db.prepare('delete from users where id=? and role != ?').bind(id, 'root').run();
      removed += r.meta ? r.meta.changes : 0;
      await db.prepare('delete from sessions where user_id=?').bind(id).run();
      await db.prepare('delete from user_logins where user_id=?').bind(id).run();
      await db.prepare('delete from chat_members where user_id=?').bind(id).run();
      await db.prepare('delete from team_members where user_id=?').bind(id).run();
    }
    await audit(env, me.id, 'user.bulk-delete', null, String(removed));
    return json({ ok: true, removed }, 200, origin);
  }

  if (path === '/admin/events/bulk-delete' && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const ids = (Array.isArray(body.ids) ? body.ids : []).filter(Boolean);
    if (!ids.length) return json({ ok: false, error: 'Ничего не выбрано' }, 400, origin);
    let removed = 0;
    for (const id of ids) {
      const r = await db.prepare('delete from events where id=?').bind(id).run();
      removed += r.meta ? r.meta.changes : 0;
    }
    await audit(env, me.id, 'event.bulk-delete', null, String(removed));
    return json({ ok: true, removed }, 200, origin);
  }

  /* ── полный бэкап базы (только владелец) ── */
  if (path === '/admin/backup' && method === 'GET') {
    const g = notRoot(); if (g) return g;
    const data = { version: 1, at: nowISO(), build: BUILD, tables: {} };
    for (const t of BACKUP_TABLES) {
      const rows = await db.prepare('select * from ' + t).all();
      data.tables[t] = rows.results || [];
    }
    return json({ ok: true, data }, 200, origin);
  }

  /* Наполнить тестовыми данными — только владелец */
  if (path === '/admin/seed' && method === 'POST') {
    const g = notRoot(); if (g) return g;
    const before = await tableCounts(db);
    await seedDemo(env);          // базовый набор: люди, события, команды, чаты
    await seedPrompts(env);
    await seedPlanDemo(env);
    await seedOwnerDemo(env, me.id);   // дополнительный набор + роадмап на 4 года
    await seedOrgDemo(env);            // кабинет kk.: менторы, карточки, портфолио, шаблоны
    const totals = await tableCounts(db);
    const added = {};
    Object.keys(totals).forEach((k) => { added[k] = Math.max(0, totals[k] - before[k]); });
    await audit(env, me.id, 'db.seed', null, JSON.stringify(added).slice(0, 400));
    return json({ ok: true, added, totals }, 200, origin);
  }

  if (path === '/admin/restore' && method === 'POST') {
    const g = notRoot(); if (g) return g;
    const data = body && body.data;
    if (!data || !data.tables || typeof data.tables !== 'object') {
      return json({ ok: false, error: 'Файл не похож на резервную копию' }, 400, origin);
    }
    const report = {};
    for (const t of BACKUP_TABLES) {
      const rows = Array.isArray(data.tables[t]) ? data.tables[t] : [];
      const info = await db.prepare(`pragma table_info(${t})`).all();
      const cols = (info.results || []).map((c) => c.name);
      await db.prepare('delete from ' + t).run();
      let n = 0;
      for (const row of rows) {
        const keys = cols.filter((c) => Object.prototype.hasOwnProperty.call(row, c));
        if (!keys.length) continue;
        const sql = `insert or replace into ${t} (${keys.join(',')}) values (${keys.map(() => '?').join(',')})`;
        await db.prepare(sql).bind(...keys.map((k) => row[k])).run();
        n++;
      }
      report[t] = n;
    }
    await ensureRoot(env);
    await seedPrompts(env);
    await audit(env, me.id, 'db.restore', null, JSON.stringify(report).slice(0, 400));
    return json({ ok: true, restored: report }, 200, origin);
  }

  /* ── системные промты ── */
  if (path === '/admin/prompts' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    const list = await db.prepare('select * from ai_prompts order by key').all();
    const defaults = {};
    DEFAULT_PROMPTS.forEach((d) => { defaults[d.key] = d.template; });
    return json({
      ok: true,
      prompts: (list.results || []).map((r) => ({
        key: r.key, title: r.title, whereUsed: r.where_used,
        template: r.template, updatedAt: r.updated_at,
        isDefault: r.template === defaults[r.key],
        defaultTemplate: defaults[r.key] || ''
      }))
    }, 200, origin);
  }

  m = path.match(/^\/admin\/prompts\/([^/]+)$/);
  if (m && method === 'PATCH') {
    const g = notAdmin(); if (g) return g;
    const cur = await db.prepare('select * from ai_prompts where key=?').bind(m[1]).first();
    if (!cur) return json({ ok: false, error: 'Промт не найден' }, 404, origin);
    const template = str(body.template, 4000);
    if (template.length < 10) return json({ ok: false, error: 'Слишком короткий промт' }, 400, origin);
    await db.prepare('update ai_prompts set template=?, updated_at=? where key=?')
      .bind(template, nowISO(), m[1]).run();
    await audit(env, me.id, 'prompt.update', m[1]);
    return json({ ok: true }, 200, origin);
  }

  /* ── журнал ── */
  if (path === '/admin/audit' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    const list = await db.prepare('select * from audit_log order by created_at desc limit 100').all();
    const rootRow = await db.prepare("select id from users where role='root' limit 1").first();
    const rootId = rootRow ? rootRow.id : null;
    // администратор не должен видеть владельца даже в журнале
    const log = list.results.map((r) => (me.role !== 'root' && r.actor_id === rootId
      ? Object.assign({}, r, { actor_id: null, detail: 'Администрация' })
      : r));
    return json({ ok: true, log }, 200, origin);
  }

  /* ── профиль пользователя (чтение с сертификатами / редактирование) ── */
  m = path.match(/^\/users\/([^/]+)$/);
  if (m && method === 'GET') {
    if (!me) return notAuth();
    const cur = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!cur) return json({ ok: false, error: 'not found' }, 404, origin);
    return json({ ok: true, user: publicUser(toUser(cur), true) }, 200, origin);
  }
  if (m && method === 'PATCH') {
    if (!me) return notAuth();
    if (me.id !== m[1] && me.role === 'student') {
      return json({ ok: false, error: 'Можно менять только свой профиль' }, 403, origin);
    }
    const cur = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!cur) return json({ error: 'not found' }, 404, origin);
    const u = Object.assign(toUser(cur), body);
    const pf = body.portfolio !== undefined
      ? (body.portfolio && typeof body.portfolio === 'object' ? str(JSON.stringify(body.portfolio), 1800000) : null)
      : cur.portfolio;
    await db.prepare('update users set name=?,grade=?,school=?,city=?,skills=?,interests=?,portfolio=? where id=?')
      .bind(u.name, u.grade, u.school, u.city, K(u.skills), K(u.interests), pf, m[1]).run();
    return json({ ok: true }, 200, origin);
  }

  return json({ ok: false, error: 'Неизвестный эндпоинт', path }, 404, origin);
}

/* ───────────────────────── воркер ───────────────────────── */

export default {
  async scheduled(event, env, ctx) {
    if (!env.DB) return;
    ctx.waitUntil(pushDigest(env, {}));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = env.ALLOW_ORIGIN || '*';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS(origin) });

    /* Служебные адреса отвечают только по ключу: без него — обычное «не найдено». */
    if (url.pathname === '/' || url.pathname === '' || url.pathname === '/health' || url.pathname === '/ping') {
      if (!keyOk(url)) return noKey(origin);
      if (!env.DB) return json({ ok: false, error: 'База не подключена' }, 503, origin);
      const db = env.DB;
      const [e, u, a, k] = await Promise.all([
        db.prepare('select count(*) as c from events').first(),
        db.prepare('select count(*) as c from users').first(),
        db.prepare('select count(*) as c from ai_keys where enabled=1').first(),
        db.prepare('select count(*) as c from ai_prompts').first()
      ]);
      return json({
        ok: true, service: 'student-hub-api', build: BUILD, db: true,
        events: e ? e.c : 0, users: u ? u.c : 0, aiKeys: a ? a.c : 0, prompts: k ? k.c : 0
      }, 200, origin);
    }

    if ((url.pathname === '/ai' || url.pathname === '/api/ai') && request.method === 'POST') {
      if (!env.DB) return json({ ok: false, error: 'База не подключена' }, 503, origin);
      await ensureReady(env);
      const me = await currentUser(request, env);
      if (!me) return json({ ok: false, error: 'Нужен вход' }, 401, origin);

      const body = await request.json().catch(() => ({}));
      const { prompt, model, promptKey, vars } = body;

      let text = String(prompt || '');
      let usedKey = null;
      if (promptKey) {
        const row = await env.DB.prepare('select * from ai_prompts where key=?').bind(String(promptKey)).first();
        if (!row) return json({ ok: false, error: 'Промт не найден' }, 404, origin);
        const v = vars && typeof vars === 'object' ? vars : {};
        text = String(row.template).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (all, name) => {
          const val = v[name];
          return typeof val === 'undefined' || val === null ? '' : String(val);
        });
        usedKey = row.key;
      }
      if (!text.trim()) return json({ ok: false, error: 'Пустой запрос к ИИ' }, 400, origin);
      if (text.length > 6000) return json({ ok: false, error: 'Слишком длинный запрос' }, 413, origin);

      try {
        const out = await callGemini(env, text, model);
        return json({ ok: true, text: out.text, key: out.key, provider: 'gemini', promptKey: usedKey }, 200, origin);
      } catch (e) {
        // 200 + ok:false — штатная ситуация: клиент уходит в локальный расчёт
        return json({ ok: false, error: String(e.message || e), raw: String(e.raw || '').slice(0, 2000) }, 200, origin);
      }
    }

    if (url.pathname.startsWith('/api')) {
      if (!env.DB) {
        return json({
          ok: false, error: 'База не подключена',
          hint: 'Settings → Bindings → Add binding → D1 database, имя DB (не Variable!)'
        }, 503, origin);
      }
      try {
        return await api(request, env, url, origin);
      } catch (e) {
        return json({
          ok: false, error: String(e.message || e),
          stack: String(e.stack || '').split('\n').slice(0, 4)
        }, 500, origin);
      }
    }

    return json({ error: 'not found' }, 404, origin);
  }
};
