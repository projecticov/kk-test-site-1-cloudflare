/* ============================================================
   Student Hub — единый файл бэкенда для Cloudflare Workers
   Сборка: 2026-11-24 19:23 · 091885c9
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

const BUILD = '2026-11-24 19:23 · 091885c9';

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
  `create table if not exists org_call_slots (
    id text primary key, org_id text, mentor_id text, slot_date text, slot_time text,
    duration integer default 60, link text, student_id text, topic text,
    importance text default 'middle', org_slot_id text, created_at text, booked_at text)`,
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
  ['org_slots', 'end_date', 'text'],
  ['org_slots', 'project', 'text'],
  ['org_slots', 'color', 'text'],
  ['org_slots', 'slot_time', 'text'],
  ['org_slots', 'link', 'text'],
  ['org_portfolio', 'file_name', 'text'],
  ['org_portfolio', 'file_size', 'integer default 0'],
  ['org_portfolio', 'file_data', 'text'],
  ['users', 'portfolio', 'text'],
  ['teams', 'invite_code', 'text'],
  ['messages', 'attachment', 'text'],
  ['messages', 'reactions', 'text'],
  ['messages', 'updated_at', 'text'],
  ['chats', 'pinned_msg_id', 'text'],
  ['plan_items', 'chat_id', 'text'],
  ['users', 'admin_tags', "text default '[]'"],
  ['users', 'admin_note', 'text']
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

  const uniqTables = Array.from(new Set(COLUMNS.map(([t]) => t)));
  const infos = await env.DB.batch(uniqTables.map((t) => env.DB.prepare(`pragma table_info(${t})`)));
  const tableCols = {};
  uniqTables.forEach((t, idx) => {
    tableCols[t] = new Set(((infos[idx] && infos[idx].results) || []).map((c) => c.name));
  });
  const alters = [];
  for (const [table, column, type] of COLUMNS) {
    if (!tableCols[table] || !tableCols[table].has(column)) {
      alters.push(env.DB.prepare(`alter table ${table} add column ${column} ${type}`));
      if (tableCols[table]) tableCols[table].add(column);
    }
  }
  if (alters.length) await env.DB.batch(alters);

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
        `insert or ignore into users (id,name,role,grade,school,city,color,skills,interests,admin_tags,admin_note,created_at)
         values (?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(u.id, u.name, u.role || 'student', u.grade || null, u.school || null,
        u.city || null, u.color || 'sky', K(u.skills || []), K(u.interests || []),
        '["бот","сид"]', 'Системный демо-аккаунт (seedDemo)', nowISO()));
      continue;
    }
    const dup = await env.DB.prepare('select id from users where email=?').bind(login).first();
    if (dup) continue;

    const salt = newSalt();
    const hash = await hashPassword(u.password || 'demo', salt);
    const id = u.id === 'u_admin' ? 'u_admin_demo' : u.id;

    st.push(env.DB.prepare(
      `insert or ignore into users (id,name,email,pass_hash,salt,role,grade,school,city,color,position,rating,skills,interests,admin_tags,admin_note,created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, u.name, login, hash, salt, u.role === 'admin' ? 'admin' : 'student',
      u.grade || null, u.school || null, u.city || null, u.color || 'sky',
      u.position || null, u.rating || 0, K(u.skills || []), K(u.interests || []),
      '["бот","сид"]', 'Системный демо-аккаунт (seedDemo)', nowISO()));

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
      `insert or ignore into users (id,name,email,pass_hash,salt,role,org_id,org_role,school,city,color,admin_tags,admin_note,created_at)
       values (?,?,?,?,?,'org',?,'mentor',?,?,?,?,?,?)`,
      dm.id, dm.name, dm.email, hash, salt, org.id, org.name, org.city || 'Москва', dm.color,
      '["бот","тест-макет"]', 'Тестовый ментор организации из макета kk. · создан автоматически', nowISO());
    await put('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)', dm.email, dm.id, nowISO());
    await put(
      `insert or replace into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
       values (?,null,?,'','','','','','','','','','plan',?)`,
      dm.id, JSON.stringify(dm.tags), nowISO());
  }
  const mentorAssign = ['u_kk_daniyar', 'u_kk_daniyar', 'u_kk_madina', 'u_kk_madina', org.manager_id || 'u_kk_daniyar', 'u_kk_daniyar'];
  const tplAssign = ['tpl_kk_usa_premium', 'tpl_kk_usa_base', 'tpl_kk_italy', 'tpl_kk_italy', 'tpl_kk_usa_premium', 'tpl_kk_usa_premium'];
  let pi = 0;
  for (const p of people) {
    const id = 'u_kk_' + p.email.split('@')[0].replace(/[^a-z0-9]/g, '');
    const idx = pi++;
    const assignedMentor = mentorAssign[idx] || org.manager_id || null;
    await put(
      `insert or ignore into users (id,name,email,pass_hash,salt,role,grade,school,city,color,org_id,admin_tags,admin_note,created_at)
       values (?,?,?,?,?,'student',?,?,?,?,?,?,?,?)`,
      id, p.name, p.email, hash, salt, p.grade, org.name, org.city || 'Москва',
      ['pink', 'mint', 'sky', 'sun', 'lavender'][id.length % 5], org.id,
      '["бот","тест-макет"]', 'Тестовый ученик организации из макета kk. · создан автоматически', nowISO());
    await put('insert or replace into user_logins (login,user_id,created_at) values (?,?,?)', p.email, id, nowISO());
    await put(
      `insert or replace into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,template_id,updated_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      id, assignedMentor, JSON.stringify(p.tags), p.grade, p.gpa, p.gpaNote,
      p.sat, p.satNote, p.ielts, p.ieltsNote, p.goal, p.goalNote, 'plan', tplAssign[idx] || null, nowISO());
  }

  const nowDt = new Date();
  const sy0 = nowDt.getMonth() >= 8 ? nowDt.getFullYear() : nowDt.getFullYear() - 1;
  const sy1 = sy0 + 1;
  const ids = people.map((p) => 'u_kk_' + p.email.split('@')[0].replace(/[^a-z0-9]/g, ''));
  // Плотность 1-в-1 из макета 05_student_card_roadmap: длительные курсы + High/Middle/Low даты + проекты
  const richSlots = [
    [0, 'Марафон SAT', `${sy0}-10-01`, `${sy0}-12-10`, '', '#FF9F43', '', 'course', 'middle', 1, 0, 'Ежедневная практика Reading + Math'],
    [0, 'Проект MVP', `${sy0}-12-20`, `${sy1}-02-10`, '', '#8B8DF0', '', 'course', 'middle', 1, 0, 'Сборка прототипа и презентации'],
    [0, 'Буткемп', `${sy1}-01-10`, `${sy1}-01-31`, '', '#3CC9B5', '', 'course', 'middle', 1, 0, 'Зимний интенсив по STEM и олимпиадам'],
    [0, 'Стажировка', `${sy1}-06-15`, `${sy1}-08-20`, '', '#FF7AA8', '', 'course', 'middle', 1, 0, 'Летняя стажировка в лаборатории'],
    [0, 'Урок по SAT · диагностика', `${sy0}-10-12`, '', '', '', '', 'internal', 'low', 0, 1, 'Входной срез'],
    [0, 'Пробный IELTS', `${sy0}-10-28`, '', '', '', '', 'internal', 'middle', 1, 1, 'Результат 7.0'],
    [0, 'Урок по SAT', `${sy0}-11-09`, '', '', '', '', 'internal', 'low', 0, 1, 'Разбор ошибок Math'],
    [0, 'Созвон с ментором', `${sy0}-11-14`, '', '', '', '18:00', 'call', 'middle', 1, 1, 'Разбор пробного IELTS'],
    [0, 'Отборочный тур Хакатона', `${sy0}-11-20`, '', '', '', '', 'milestone', 'high', 1, 1, 'Командный этап пройден'],
    [0, 'Финал Хакатона STEM', day(6), '', '', '', '', 'milestone', 'high', 1, 0, 'Защита перед жюри'],
    [0, 'IELTS', `${sy0}-12-14`, '', '', '', '', 'milestone', 'high', 1, 0, 'Официальная сдача Academic'],
    [0, 'Ревью MVP с ментором', `${sy1}-01-15`, '', '', '', '18:00', 'call', 'middle', 1, 0, 'Проверка готовности'],
    [0, 'Zerde · научный конкурс', `${sy1}-02-20`, '', '', '', '', 'milestone', 'high', 1, 0, 'Республиканский этап'],
    [0, 'Подбор летних программ', `${sy1}-03-12`, '', '', '', '', 'internal', 'low', 0, 0, 'Шорт-лист стажировок'],
    [0, 'Пробный SAT · весенний срез', `${sy1}-04-05`, '', '', '', '', 'internal', 'middle', 1, 0, 'Цель 1460+'],
    [0, 'Сборка платы и калибровка сенсоров', `${sy0}-10-15`, `${sy0}-12-05`, 'Эко-датчик', '#3CC9B5', '', 'course', 'middle', 1, 0, 'Аппаратная часть'],
    [0, 'Демо школьному совету', `${sy0}-12-18`, '', 'Эко-датчик', '', '', 'milestone', 'high', 1, 0, 'Замеры в 4 кабинетах'],
    [0, 'Запись сезона №2 (выпуски 13–18)', `${sy0}-11-01`, `${sy1}-01-25`, 'Школьный подкаст', '#8B8DF0', '', 'course', 'middle', 1, 0, 'Интервью с выпускниками'],
    [1, 'Курс SAT Base', `${sy0}-10-01`, `${sy0}-12-10`, '', '#FF9F43', '', 'course', 'middle', 1, 0, 'Базовый поток'],
    [1, 'Курс IELTS Base', `${sy1}-01-15`, `${sy1}-03-25`, '', '#8B8DF0', '', 'course', 'middle', 1, 0, 'Подготовка на 6.5+'],
    [1, 'Эссе Common App · черновик', day(-3), '', '', '', '', 'internal', 'middle', 1, 0, 'Нужно дослать структуру'],
    [1, 'Созвон с ментором', day(5), '', '', '', '17:30', 'call', 'middle', 1, 0, 'Разбор эссе и плана'],
    [1, 'Пробный SAT', `${sy0}-12-12`, '', '', '', '', 'milestone', 'high', 1, 0, 'Полный тайминг'],
    [2, 'Интенсив IELTS Academic', `${sy0}-09-20`, `${sy0}-12-05`, '', '#8B8DF0', '', 'course', 'middle', 1, 0, 'Подготовка к сдаче'],
    [2, 'Подготовка портфолио для вузов Италии', `${sy0}-11-01`, `${sy1}-02-20`, '', '#FF9F43', '', 'course', 'middle', 1, 0, '12 проектов + описание'],
    [2, 'Мотивационное письмо · финал', day(-5), '', '', '', '', 'milestone', 'high', 1, 0, 'Требуется срочная вычитка'],
    [2, 'Подача документов (1-я волна)', day(9), '', '', '', '', 'milestone', 'high', 1, 0, 'Politecnico di Milano / NABA'],
    [3, 'Итальянский язык A2–B1', `${sy0}-10-05`, `${sy0}-12-22`, '', '#3CC9B5', '', 'course', 'middle', 1, 0, 'Разговорный и академический'],
    [3, 'Курс IELTS', `${sy1}-01-10`, `${sy1}-03-20`, '', '#8B8DF0', '', 'course', 'middle', 1, 0, 'Цель 6.5+'],
    [3, 'Созвон с ментором', day(7), '', '', '', '18:00', 'call', 'middle', 1, 0, 'Проверка плана на зиму'],
    [3, 'Сдача экзамена TOLC-E', `${sy1}-03-28`, '', '', '', '', 'milestone', 'high', 1, 0, 'Онлайн-сессия'],
    [4, 'SAT Math & Reading 1500+', `${sy0}-09-25`, `${sy0}-12-03`, '', '#FF9F43', '', 'course', 'middle', 1, 0, 'Продвинутая группа'],
    [4, 'Лабораторный практикум по биохимии', `${sy1}-01-12`, `${sy1}-03-30`, '', '#3CC9B5', '', 'course', 'middle', 1, 0, 'Исследовательский проект'],
    [4, 'Официальный SAT', `${sy0}-12-05`, '', '', '', '', 'milestone', 'high', 1, 0, 'Цель 1500+'],
    [4, 'Подача на летнюю школу KAIST', `${sy1}-02-15`, '', '', '', '', 'milestone', 'high', 1, 0, 'Пакет документов'],
    [5, 'Марафон эссе США (RD)', `${sy0}-10-10`, `${sy0}-12-25`, '', '#8B8DF0', '', 'course', 'middle', 1, 0, 'Supplemental Essays'],
    [5, 'Регистрация и результат SAT', day(-7), '', '', '', '', 'milestone', 'high', 1, 0, 'Нет загруженного сертификата'],
    [5, 'Созвон с ментором · антикризисный план', day(3), '', '', '', '19:00', 'call', 'middle', 1, 0, 'Пересборка списка вузов'],
    [5, 'Дедлайн Regular Decision', `${sy1}-01-03`, '', '', '', '', 'milestone', 'high', 1, 0, 'Отправка Common App']
  ];
  let si = 0;
  for (const [ui, title, dt, endDt, proj, col, stime, kind, imp, ntf, done, note] of richSlots) {
    await put(
      `insert or replace into org_slots (id,org_id,student_id,title,note,date,end_date,project,color,slot_time,kind,importance,notify,done,created_by,created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      'slot_kk_v22_' + (si++), org.id, ids[ui], title, note, dt, endDt, proj, col, stime, kind, imp, ntf, done, org.manager_id, nowISO());
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

  // Шаблоны роадмапов 1-в-1 из доски 04_admin_templates.html
  const templates = [
    {
      id: 'tpl_kk_usa_premium', title: 'США · Premium', tags: ['сша', 'premium'], grade: '10–12',
      items: [
        { title: 'Курс SAT', grade: '10', month: 9, day: 1, endMonth: 11, endDay: 10, weeks: 10, kind: 'course', color: '#FF9F43', importance: 'middle', note: '10 кл · 1 окт – 10 дек' },
        { title: 'Пробный SAT', grade: '10', month: 11, day: 12, kind: 'date', importance: 'high', note: '10 кл · 2-я суббота декабря' },
        { title: 'Курс IELTS', grade: '10', month: 0, day: 10, endMonth: 2, endDay: 20, weeks: 10, kind: 'course', color: '#8B8DF0', importance: 'middle', note: '10 кл · 10 янв – 20 мар' },
        { title: 'Созвон с ментором', grade: '10', month: 8, day: 15, kind: 'call', calls: 8, importance: 'middle', note: 'каждые 2 недели' },
        { title: 'Хакатон / STEM-конкурс', grade: '10', month: 10, day: 20, kind: 'date', importance: 'middle', note: '10 кл · 20 ноября' },
        { title: 'Сдача IELTS', grade: '10', month: 2, day: 25, kind: 'date', importance: 'high', note: '10 кл · конец марта' },
        { title: 'Защита школьного проекта', grade: '10', month: 4, day: 10, kind: 'date', importance: 'high', note: '10 кл · 10 мая' },
        { title: 'Летняя стажировка / лагерь', grade: '10', month: 5, day: 15, endMonth: 7, endDay: 10, weeks: 8, kind: 'course', color: '#FF7AA8', importance: 'middle', note: '10 кл · 15 июн – 10 авг' },
        { title: 'Итоговый разбор 10 класса', grade: '10', month: 7, day: 20, kind: 'date', importance: 'low', note: '10 кл · 20 августа' },
        { title: 'SAT Intensive · 1500+', grade: '11', month: 8, day: 15, endMonth: 10, endDay: 30, weeks: 11, kind: 'course', color: '#FF9F43', importance: 'middle', note: '11 кл · 15 сен – 30 ноя' },
        { title: 'Официальный SAT', grade: '11', month: 11, day: 5, kind: 'date', importance: 'high', note: '11 кл · 1-я суббота декабря' },
        { title: 'Research / Проект MVP', grade: '11', month: 0, day: 12, endMonth: 3, endDay: 15, weeks: 13, kind: 'course', color: '#3CC9B5', importance: 'middle', note: '11 кл · 12 янв – 15 апр' },
        { title: 'Список вузов (College List)', grade: '11', month: 3, day: 20, kind: 'date', importance: 'middle', note: '11 кл · 20 апреля' },
        { title: 'AP / профильная олимпиада', grade: '11', month: 4, day: 8, kind: 'date', importance: 'high', note: '11 кл · май' },
        { title: 'Запрос рекомендательных писем', grade: '11', month: 4, day: 22, kind: 'date', importance: 'middle', note: '11 кл · конец мая' },
        { title: 'Черновик Personal Statement', grade: '11', month: 7, day: 15, kind: 'date', importance: 'high', note: '11 кл · 15 августа' },
        { title: 'Созвон с ментором', grade: '11', month: 8, day: 15, kind: 'call', calls: 8, importance: 'middle', note: 'каждые 2 недели' },
        { title: 'Марафон эссе Common App', grade: '12', month: 8, day: 1, endMonth: 9, endDay: 25, weeks: 8, kind: 'course', color: '#8B8DF0', importance: 'middle', note: '12 кл · 1 сен – 25 окт' },
        { title: 'Дедлайн Early Action / ED', grade: '12', month: 10, day: 1, kind: 'date', importance: 'high', note: '12 кл · 1 ноября' },
        { title: 'Финализация CSS Profile / FinAid', grade: '12', month: 10, day: 20, kind: 'date', importance: 'high', note: '12 кл · 20 ноября' },
        { title: 'Дедлайн Regular Decision', grade: '12', month: 0, day: 3, kind: 'date', importance: 'high', note: '12 кл · 3 января' },
        { title: 'Выбор оффера и виза F-1', grade: '12', month: 4, day: 1, kind: 'date', importance: 'high', note: '12 кл · 1 мая' },
        { title: 'Созвон с ментором', grade: '12', month: 8, day: 15, kind: 'call', calls: 8, importance: 'middle', note: 'каждые 2 недели' }
      ]
    },
    {
      id: 'tpl_kk_usa_base', title: 'США · Base', tags: ['сша', 'base'], grade: '10–12',
      items: [
        { title: 'Курс SAT', grade: '10', month: 9, day: 1, endMonth: 11, endDay: 10, weeks: 10, kind: 'course', color: '#FF9F43', importance: 'middle', note: '10 кл · 1 окт – 10 дек' },
        { title: 'Пробный SAT', grade: '10', month: 11, day: 12, kind: 'date', importance: 'high', note: '10 кл · 2-я суббота декабря' },
        { title: 'Диагностика IELTS', grade: '10', month: 1, day: 15, kind: 'date', importance: 'middle', note: '10 кл · 15 февраля' },
        { title: 'Летний план портфолио', grade: '10', month: 5, day: 10, kind: 'date', importance: 'low', note: '10 кл · 10 июня' },
        { title: 'Созвон с ментором', grade: '10', month: 8, day: 20, kind: 'call', calls: 3, importance: 'middle', note: 'раз в четверть' },
        { title: 'Курс IELTS', grade: '11', month: 0, day: 15, endMonth: 2, endDay: 25, weeks: 10, kind: 'course', color: '#8B8DF0', importance: 'middle', note: '11 кл · 15 янв – 25 мар' },
        { title: 'Официальный SAT', grade: '11', month: 2, day: 6, kind: 'date', importance: 'high', note: '11 кл · март' },
        { title: 'Сдача IELTS', grade: '11', month: 3, day: 18, kind: 'date', importance: 'high', note: '11 кл · апрель' },
        { title: 'Подбор вузов США', grade: '11', month: 4, day: 20, kind: 'date', importance: 'middle', note: '11 кл · 20 мая' },
        { title: 'Созвон с ментором', grade: '11', month: 8, day: 20, kind: 'call', calls: 3, importance: 'middle', note: 'раз в четверть' },
        { title: 'Практикум Common App', grade: '12', month: 8, day: 10, endMonth: 9, endDay: 25, weeks: 7, kind: 'course', color: '#3CC9B5', importance: 'middle', note: '12 кл · 10 сен – 25 окт' },
        { title: 'Дедлайн Early Action', grade: '12', month: 10, day: 1, kind: 'date', importance: 'high', note: '12 кл · 1 ноября' },
        { title: 'Вычитка эссе перед RD', grade: '12', month: 11, day: 10, kind: 'date', importance: 'middle', note: '12 кл · 10 декабря' },
        { title: 'Дедлайн Regular Decision', grade: '12', month: 0, day: 5, kind: 'date', importance: 'high', note: '12 кл · 5 января' },
        { title: 'Решение по офферам', grade: '12', month: 4, day: 1, kind: 'date', importance: 'high', note: '12 кл · 1 мая' },
        { title: 'Созвон с ментором', grade: '12', month: 9, day: 1, kind: 'call', calls: 2, importance: 'middle', note: 'перед дедлайнами' }
      ]
    },
    {
      id: 'tpl_kk_italy', title: 'Италия · Premium', tags: ['италия', 'premium'], grade: '11–12',
      items: [
        { title: 'Итальянский язык A1–A2', grade: '11', month: 9, day: 1, endMonth: 11, endDay: 20, weeks: 11, kind: 'course', color: '#FF9F43', importance: 'middle', note: '11 кл · 1 окт – 20 дек' },
        { title: 'Пробный IELTS', grade: '11', month: 11, day: 15, kind: 'date', importance: 'middle', note: '11 кл · 15 декабря' },
        { title: 'Курс IELTS', grade: '11', month: 0, day: 10, endMonth: 2, endDay: 20, weeks: 10, kind: 'course', color: '#8B8DF0', importance: 'middle', note: '11 кл · 10 янв – 20 мар' },
        { title: 'Сдача IELTS Academic', grade: '11', month: 2, day: 28, kind: 'date', importance: 'high', note: '11 кл · конец марта' },
        { title: 'Структура портфолио / CV', grade: '11', month: 4, day: 5, kind: 'date', importance: 'middle', note: '11 кл · 5 мая' },
        { title: 'Летний воркшоп по профилю', grade: '11', month: 5, day: 20, kind: 'date', importance: 'low', note: '11 кл · 20 июня' },
        { title: 'Созвон с ментором', grade: '11', month: 8, day: 15, kind: 'call', calls: 8, importance: 'middle', note: 'каждые 2 недели' },
        { title: 'Подготовка к TOLC / IMAT', grade: '12', month: 8, day: 15, endMonth: 10, endDay: 30, weeks: 11, kind: 'course', color: '#3CC9B5', importance: 'middle', note: '12 кл · 15 сен – 30 ноя' },
        { title: 'Сдача экзамена TOLC', grade: '12', month: 11, day: 10, kind: 'date', importance: 'high', note: '12 кл · 10 декабря' },
        { title: 'Оформление DSU и документов', grade: '12', month: 0, day: 15, endMonth: 2, endDay: 15, weeks: 9, kind: 'course', color: '#FF7AA8', importance: 'middle', note: '12 кл · 15 янв – 15 мар' },
        { title: 'Финал портфолио', grade: '12', month: 2, day: 5, kind: 'date', importance: 'high', note: '12 кл · до 5 марта' },
        { title: 'Предрегистрация Universitaly', grade: '12', month: 3, day: 25, kind: 'date', importance: 'high', note: '12 кл · 25 апреля' },
        { title: 'Подача документов и стипендия DSU', grade: '12', month: 4, day: 15, kind: 'date', importance: 'high', note: '12 кл · 15 мая' },
        { title: 'Подача на студвизу D', grade: '12', month: 6, day: 20, kind: 'date', importance: 'high', note: '12 кл · 20 июля' },
        { title: 'Созвон с ментором', grade: '12', month: 8, day: 15, kind: 'call', calls: 8, importance: 'middle', note: 'каждые 2 недели' }
      ]
    },
    {
      id: 'tpl_kk_sat_group', title: 'Группа SAT · интенсив', tags: ['группа_sat'], grade: '1 год',
      items: [
        { title: 'Входная диагностика SAT', grade: '10', month: 8, day: 28, kind: 'date', importance: 'middle', note: '28 сентября' },
        { title: 'Курс SAT Intensive', grade: '10', month: 9, day: 1, endMonth: 11, endDay: 15, weeks: 11, kind: 'course', color: '#FF9F43', importance: 'middle', note: '1 окт – 15 дек' },
        { title: 'Пробный SAT #1', grade: '10', month: 9, day: 26, kind: 'date', importance: 'middle', note: '4-я суббота октября' },
        { title: 'Пробный SAT #2', grade: '10', month: 10, day: 23, kind: 'date', importance: 'high', note: '4-я суббота ноября' },
        { title: 'Официальная сдача SAT', grade: '10', month: 11, day: 7, kind: 'date', importance: 'high', note: '1-я суббота декабря' },
        { title: 'Групповой разбор с ментором', grade: '10', month: 9, day: 5, kind: 'call', calls: 10, importance: 'middle', note: 'еженедельно · 10 встреч' }
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
      `insert or ignore into users (id,name,email,pass_hash,salt,role,grade,school,city,color,skills,interests,admin_tags,admin_note,created_at)
       values (?,?,?,?,?,'student',?,?,?,?,?,?,?,?,?)`
    ).bind(u.id, u.name, u.email, hash, salt, u.grade, 'Школа №1520', 'Москва', u.color,
      K(u.skills), K(u.interests), '["бот","сид"]', 'Демо-ученик ленты и команд · создан автоматически', nowISO()));
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

const orgSlotToPlan = (s) => {
  const startDay = String(s.date || '').slice(0, 10);
  const endDay = String(s.end_date || '').slice(0, 10);
  const isSpan = !!(endDay && endDay > startDay);
  const isHigh = s.importance === 'high' || s.kind === 'milestone' || s.kind === 'external';
  const colorMap = { '#FF9F43': 'sun', '#8B8DF0': 'lavender', '#3CC9B5': 'mint', '#FF7AA8': 'blush' };
  const color = colorMap[s.color] || (isHigh ? 'blush' : (isSpan ? 'lavender' : (s.importance === 'low' ? 'sky' : 'sun')));
  return {
    id: 'orgslot_' + s.id,
    userId: s.student_id,
    chatId: '',
    kind: isSpan ? 'track' : (isHigh ? 'milestone' : 'task'),
    title: s.title + (s.slot_time ? ' · ' + s.slot_time : ''),
    note: [s.project ? 'Проект: ' + s.project : '', s.note || '', s.link ? 'Ссылка: ' + s.link : '', 'Сопровождение ментора'].filter(Boolean).join(' · '),
    startAt: startDay + (s.slot_time ? 'T' + s.slot_time + ':00' : ''),
    endAt: isSpan ? endDay : '',
    done: !!s.done,
    eventId: '',
    checklist: [],
    color,
    fromOrg: true
  };
};

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
  id: u.id, name: u.name, email: keepBlobs ? (u.email || '') : undefined,
  role: u.role, grade: u.grade, school: u.school, city: u.city,
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
  return json({ ok: true, token: session.token, expires: session.expires, user: publicUser(toUser(user), true) }, 201, origin);
}

async function authLogout(request, env, origin, me) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (token) await env.DB.prepare('delete from sessions where id=?').bind(await sha256(token)).run();
  if (me && me.id) {
    try { await audit(env, me.id, 'logout', me.id, me.name); } catch (e) { /* ignore */ }
  }
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

  const myOrgSlotRows = (me && me.role === 'student')
    ? await db.prepare('select * from org_slots where student_id=? order by date limit 300').bind(me.id).all()
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
      editedAt: m.edited_at || null, attachment: P(m.attachment, null),
      reactions: P(m.reactions, null)
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
      lastAt: c.last_at, pinnedMsgId: c.pinned_msg_id || '',
      memberIds: memByChat[c.id] || [], messages: byChat[c.id] || []
    })),
    saved: (saved.results || []).map((r) => r.event_id),
    plan: (planRows.results || []).map(toPlan).concat((myOrgSlotRows.results || []).map(orgSlotToPlan)),
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
  if (path === '/auth/logout' && method === 'POST') return authLogout(request, env, origin, me);

  if (path === '/auth/me') {
    if (!me) return json({ ok: false, error: 'Сессия истекла' }, 401, origin);
    return json({ ok: true, user: publicUser(me, true) }, 200, origin);
  }

  if (path === '/auth/password/send-code' && method === 'POST') {
    if (!me) return notAuth();
    const row = await db.prepare('select * from users where id=?').bind(me.id).first();
    if (!row) return notAuth();

    let targetEmail = str(body.email, 160).toLowerCase() || String(row.email || '').toLowerCase();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return json({ ok: false, error: 'Укажите корректную почту для получения кода' }, 400, origin);
    }
    if (!row.email && targetEmail) {
      await db.prepare('update users set email=? where id=?').bind(targetEmail, me.id).run();
    }

    const codeNum = 100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000);
    const code = String(codeNum);
    const salt = newSalt();
    const codeHash = await hashPassword(code, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.prepare("update otp_codes set used=1 where user_id=? and used=0 and id like 'pwc_%'").bind(me.id).run();
    await db.prepare('insert into otp_codes (id,user_id,code_hash,salt,expires_at,used) values (?,?,?,?,?,0)')
      .bind(uid('pwc'), me.id, codeHash, salt, expiresAt).run();

    let deliveredByEmail = false;
    const htmlMail =
      '<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:440px;margin:0 auto;padding:28px;background:#faf8f5;border-radius:18px">' +
        '<div style="font-size:13px;font-weight:700;letter-spacing:.04em;color:#6E59F7;margin-bottom:8px">STUDENT HUB</div>' +
        '<h2 style="margin:0 0 10px;font-size:20px;color:#14151a">Код подтверждения смены пароля</h2>' +
        '<p style="margin:0 0 18px;font-size:14px;color:#525866;line-height:1.5">Введите этот 6-значный код в приложении, чтобы установить новый пароль. Код действует 10 минут.</p>' +
        '<div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;padding:16px;background:#fff;border-radius:14px;color:#14151a;border:1px solid #e6e8ee">' + code + '</div>' +
      '</div>';

    if (env.RESEND_API_KEY) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + env.RESEND_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.MAIL_FROM || 'Student Hub <onboarding@resend.dev>',
            to: [targetEmail],
            subject: code + ' — код смены пароля Student Hub',
            html: htmlMail
          })
        });
        if (r.ok) deliveredByEmail = true;
      } catch (e) { /* ignore */ }
    }

    if (!deliveredByEmail && env.MAILCHANNELS_ENABLED === '1') {
      try {
        const r = await fetch('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: targetEmail, name: row.name || 'Пользователь' }] }],
            from: { email: env.MAIL_FROM_ADDRESS || 'noreply@studenthub.app', name: 'Student Hub' },
            subject: code + ' — код смены пароля Student Hub',
            content: [{ type: 'text/html', value: htmlMail }]
          })
        });
        if (r.ok) deliveredByEmail = true;
      } catch (e) { /* ignore */ }
    }

    // Дублируем код в Web Push на подписанные устройства пользователя
    try {
      const subs = await db.prepare('select * from push_subs where user_id=?').bind(me.id).all();
      const payload = JSON.stringify({
        title: 'Код подтверждения: ' + code,
        body: 'Код для смены пароля в Student Hub (' + targetEmail + ')',
        url: './#/profile'
      });
      for (const sub of (subs.results || [])) {
        await sendPush(env, sub, payload);
      }
    } catch (e) { /* ignore */ }

    await audit(env, me.id, 'password.code_sent', me.id, targetEmail);
    return json({
      ok: true,
      email: targetEmail,
      deliveredByEmail,
      // Для демо-стенда без внешнего платного SMTP возвращаем код для входящего баннера
      previewCode: deliveredByEmail ? undefined : code,
      expiresInSec: 600
    }, 200, origin);
  }

  if (path === '/auth/password/confirm' && method === 'POST') {
    if (!me) return notAuth();
    const code = String(body.code || '').replace(/\D+/g, '');
    const next = String(body.next || '');
    if (code.length !== 6) return json({ ok: false, error: 'Введите 6-значный код из письма' }, 400, origin);
    if (next.length < 6) return json({ ok: false, error: 'Новый пароль минимум 6 символов' }, 400, origin);

    const rows = await db.prepare(
      "select * from otp_codes where user_id=? and used=0 and id like 'pwc_%' and expires_at > ? order by expires_at desc"
    ).bind(me.id, nowISO()).all();

    let matchedId = null;
    for (const r of rows.results || []) {
      if (safeEqual(await hashPassword(code, r.salt), r.code_hash)) {
        matchedId = r.id;
        break;
      }
    }
    if (!matchedId) {
      return json({ ok: false, error: 'Неверный или истёкший код подтверждения' }, 400, origin);
    }

    await db.prepare('update otp_codes set used=1 where id=?').bind(matchedId).run();
    const salt = newSalt();
    await db.prepare('update users set pass_hash=?, salt=?, pass=null where id=?')
      .bind(await hashPassword(next, salt), salt, me.id).run();
    await audit(env, me.id, 'password.change.code', me.id);
    return json({ ok: true }, 200, origin);
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
    const color = body.color != null ? (str(body.color, 24) || 'sun') : (me.color || 'sun');
    const avatar = body.avatar !== undefined ? (str(body.avatar, 350000) || null) : (me.avatar || null);
    const pf = body.portfolio !== undefined
      ? (body.portfolio && typeof body.portfolio === 'object' ? str(JSON.stringify(body.portfolio), 1800000) : null)
      : (me.portfolio ? JSON.stringify(me.portfolio) : null);
    await db.prepare('update users set name=?,grade=?,school=?,city=?,color=?,skills=?,interests=?,avatar=?,portfolio=? where id=?')
      .bind(name, grade, school, city, color, K(skills), K(interests), avatar, pf, me.id).run();
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
    const cur = await db.prepare('select * from events where id=?').bind(m[1]).first();
    if (method === 'DELETE') {
      await db.prepare('delete from events where id=?').bind(m[1]).run();
      await audit(env, me.id, 'event.delete', m[1], cur ? cur.title : null);
      return json({ ok: true }, 200, origin);
    }
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

  if (m && method === 'DELETE') {
    if (!me) return notAuth();
    const cur = await db.prepare('select * from post_comments where id=?').bind(m[1]).first();
    if (!cur) return json({ ok: true }, 200, origin);
    if (cur.author_id !== me.id && me.role === 'student') {
      return json({ ok: false, error: 'Можно удалять только свой комментарий' }, 403, origin);
    }
    await db.prepare('delete from post_comments where id=?').bind(m[1]).run();
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
      `select id, chat_id, author_id, text, attachment, reactions, created_at, edited_at, updated_at from messages
        where chat_id=? and (created_at>=? or coalesce(edited_at,'')>=? or coalesce(updated_at,'')>=?)
        order by created_at asc limit 100`
    ).bind(m[1], after, after, after).all();

    return json({ ok: true, messages: (rows.results || []).map((r) => ({
      id: r.id, chatId: r.chat_id, authorId: r.author_id, text: r.text,
      attachment: P(r.attachment, null),
      reactions: P(r.reactions, null),
      at: r.created_at, editedAt: r.edited_at || '', updatedAt: r.updated_at || ''
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

  m = path.match(/^\/messages\/([^/]+)\/react$/);
  if (m && method === 'POST') {
    if (!me) return notAuth();
    const cur = await db.prepare('select * from messages where id=?').bind(m[1]).first();
    if (!cur) return json({ error: 'not found' }, 404, origin);
    const member = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?')
      .bind(cur.chat_id, me.id).first();
    if (!member) return json({ ok: false, error: 'Нет доступа к чату' }, 403, origin);

    const emoji = str(body.emoji, 16);
    if (!emoji) return json({ ok: false, error: 'Пустая реакция' }, 400, origin);
    const reactions = P(cur.reactions, {}) || {};
    const had = Array.isArray(reactions[emoji]) && reactions[emoji].includes(me.id);
    // как в Telegram (базовый режим): одна активная реакция от пользователя на сообщение
    Object.keys(reactions).forEach((k) => {
      reactions[k] = (reactions[k] || []).filter((uid) => uid !== me.id);
      if (!reactions[k].length) delete reactions[k];
    });
    if (!had) {
      reactions[emoji] = (reactions[emoji] || []).concat(me.id);
    }
    await db.prepare('update messages set reactions=?, updated_at=? where id=?')
      .bind(Object.keys(reactions).length ? K(reactions) : null, nowISO(), m[1]).run();
    return json({ ok: true, reactions }, 200, origin);
  }

  m = path.match(/^\/chats\/([^/]+)\/pin$/);
  if (m && method === 'POST') {
    if (!me) return notAuth();
    const member = await db.prepare('select 1 from chat_members where chat_id=? and user_id=?')
      .bind(m[1], me.id).first();
    if (!member) return json({ ok: false, error: 'Нет доступа к чату' }, 403, origin);
    const msgId = str(body.messageId, 64) || null;
    await db.prepare('update chats set pinned_msg_id=? where id=?').bind(msgId, m[1]).run();
    return json({ ok: true, pinnedMsgId: msgId || '' }, 200, origin);
  }

  m = path.match(/^\/messages\/([^/]+)$/);
  if (m && method === 'PATCH') {
    if (!me) return notAuth();
    const cur = await db.prepare('select * from messages where id=?').bind(m[1]).first();
    if (!cur) return json({ error: 'not found' }, 404, origin);
    if (cur.author_id !== me.id) return json({ ok: false, error: 'Можно менять только свои сообщения' }, 403, origin);
    const ts = nowISO();
    await db.prepare('update messages set text=?, edited_at=?, updated_at=? where id=?')
      .bind(str(body.text, 3000), ts, ts, m[1]).run();
    return json({ ok: true }, 200, origin);
  }

  if (m && method === 'DELETE') {
    if (!me) return notAuth();
    const cur = await db.prepare('select * from messages where id=?').bind(m[1]).first();
    if (!cur) return json({ ok: true }, 200, origin);
    if (cur.author_id !== me.id && me.role !== 'root' && me.role !== 'admin') {
      return json({ ok: false, error: 'Можно удалять только свои сообщения' }, 403, origin);
    }
    await db.prepare('delete from messages where id=?').bind(m[1]).run();
    await db.prepare('update chats set pinned_msg_id=null where id=? and pinned_msg_id=?').bind(cur.chat_id, m[1]).run();
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
    const [rows, orgRows2] = await Promise.all([
      db.prepare(
        `select * from plan_items
          where (user_id=? and (chat_id is null or chat_id=''))
             or (chat_id is not null and chat_id != '' and chat_id in (select chat_id from chat_members where user_id=?))
          order by start_at limit 600`
      ).bind(me.id, me.id).all(),
      me.role === 'student'
        ? db.prepare('select * from org_slots where student_id=? order by date limit 300').bind(me.id).all()
        : Promise.resolve({ results: [] })
    ]);
    return json({ ok: true, items: (rows.results || []).map(toPlan).concat((orgRows2.results || []).map(orgSlotToPlan)) }, 200, origin);
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
    if (m[1].startsWith('orgslot_')) {
      const rawSlotId = m[1].slice(8);
      const osRow = await db.prepare('select * from org_slots where id=? and student_id=?').bind(rawSlotId, me.id).first();
      if (!osRow) return json({ ok: false, error: 'Пункт не найден' }, 404, origin);
      const nextDone = body.done === undefined ? osRow.done : (body.done ? 1 : 0);
      await db.prepare('update org_slots set done=? where id=?').bind(nextDone, rawSlotId).run();
      return json({ ok: true }, 200, origin);
    }
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
    if (m[1].startsWith('orgslot_')) {
      return json({ ok: false, error: 'Событие назначено ментором — его можно отметить выполненным' }, 403, origin);
    }
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
    const wanted = url.searchParams.get('org') || (body && body.orgId ? String(body.orgId) : '');
    if (wanted) return await db.prepare('select * from organizations where id=?').bind(wanted).first();
    return await db.prepare('select * from organizations order by created_at limit 1').first();
  }

  if (path === '/admin/orgs' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    const [list, staffRows] = await Promise.all([
      db.prepare(
        `select o.*, u.name as manager_name,
           (select count(*) from users x where x.org_id=o.id and x.role='student' and coalesce(x.org_role,'')!='mentor') as students,
           (select count(*) from org_slots s where s.org_id=o.id and s.done=0) as open_tasks
         from organizations o left join users u on u.id=o.manager_id
         order by o.created_at desc`
      ).all(),
      db.prepare("select id, name, org_id, role, org_role from users where org_id is not null and (role='org' or org_role='mentor') order by name").all()
    ]);
    const mentorsByOrg = {};
    for (const s of (staffRows.results || [])) {
      (mentorsByOrg[s.org_id] = mentorsByOrg[s.org_id] || []).push({ id: s.id, name: s.name });
    }
    return json({
      ok: true,
      orgs: list.results.map((r) => Object.assign(toOrg(r), {
        mentors: (mentorsByOrg[r.id] || []).map((m) => ({
          id: m.id,
          name: m.name,
          isManager: m.id === r.manager_id
        }))
      }))
    }, 200, origin);
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
      await db.prepare('delete from org_call_slots where org_id=?').bind(org.id).run();
      await db.prepare('delete from org_slots where org_id=?').bind(org.id).run();
      await db.prepare('delete from organizations where id=?').bind(org.id).run();
      await audit(env, me.id, 'org.delete', org.id, org.name);
      return json({ ok: true }, 200, origin);
    }
  }

  /* прикрепление существующих сторонних учеников к организации (для админа и владельца) */
  m = path.match(/^\/admin\/orgs\/([^/]+)\/attach-students$/);
  if (m && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const org = await db.prepare('select * from organizations where id=?').bind(m[1]).first();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 404, origin);

    const rawIds = Array.isArray(body.userIds)
      ? body.userIds
      : (body.userId ? [body.userId] : []);
    const ids = Array.from(new Set(rawIds.map((x) => String(x || '').trim()).filter(Boolean))).slice(0, 200);
    if (!ids.length) return json({ ok: false, error: 'Выберите хотя бы одного ученика' }, 400, origin);

    let mentor = null;
    if (body.mentorId) {
      mentor = await db.prepare("select id, name from users where id=? and org_id=? and (role='org' or org_role='mentor')")
        .bind(String(body.mentorId), org.id).first();
      if (!mentor) return json({ ok: false, error: 'Выбранный ментор не найден в этой организации' }, 400, origin);
    }
    const chosenMentorId = body.mentorId !== undefined
      ? (mentor ? mentor.id : null)
      : (org.manager_id || null);

    const cleanTags = (Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(','))
      .map((t) => str(t, 40).trim().replace(/^#/, '')).filter(Boolean).slice(0, 20);

    let attached = 0;
    for (const uidItem of ids) {
      const target = await db.prepare("select * from users where id=? and role='student' and coalesce(org_role,'')!='mentor'").bind(uidItem).first();
      if (!target) continue;
      await db.prepare('update users set org_id=?, org_role=null where id=?').bind(org.id, target.id).run();
      await db.prepare(
        `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
         values (?,?,?,?,'','','','','','','','','plan',?)
         on conflict(user_id) do update set
           mentor_id=excluded.mentor_id,
           tags=case when excluded.tags != '[]' then excluded.tags else org_students.tags end,
           grade=case when org_students.grade != '' then org_students.grade else excluded.grade end,
           updated_at=excluded.updated_at`
      ).bind(target.id, chosenMentorId, JSON.stringify(cleanTags), str(target.grade, 40), nowISO()).run();
      await audit(env, me.id, 'org.student.attach', target.id, org.name + (mentor ? ' · ментор: ' + mentor.name : ''));
      attached++;
    }
    if (!attached) return json({ ok: false, error: 'Не найдено подходящих аккаунтов учеников' }, 400, origin);
    return json({ ok: true, attached }, 200, origin);
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
    let chosenMentor = null;
    let chosenMentorName = '';
    if (!mentor) {
      if (body.mentorId !== undefined) {
        if (body.mentorId) {
          const mRow = await db.prepare("select id, name from users where id=? and org_id=? and (role='org' or org_role='mentor')")
            .bind(String(body.mentorId), org.id).first();
          if (!mRow) return json({ ok: false, error: 'Выбранный ментор не найден в организации' }, 400, origin);
          chosenMentor = mRow.id;
          chosenMentorName = mRow.name;
        } else {
          chosenMentor = null;
        }
      } else {
        chosenMentor = me.role === 'org' ? me.id : (org.manager_id || null);
      }
    }
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
    if (!mentor && chosenMentor && chosenMentorName) {
      await audit(env, me.id, 'org.student.mentor', id, chosenMentorName);
    }
    return json({ ok: true, id, login, password, mentorId: chosenMentor, mentorName: chosenMentorName }, 201, origin);
  }

  /* управление доступом (просмотр логина, сброс пароля, одноразовый код) внутри организации — строго для админа организации */
  m = path.match(/^\/org\/users\/([^/]+)\/(password|otp)$/);
  if (m && method === 'POST') {
    if (!isOrgAdmin()) {
      return json({ ok: false, error: 'Сбрасывать пароли может только администратор организации' }, 403, origin);
    }
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const target = await db.prepare('select * from users where id=? and org_id=?').bind(m[1], org.id).first();
    if (!target) return json({ ok: false, error: 'Участник не найден в вашей организации' }, 404, origin);
    if (target.role === 'root' || target.role === 'admin') {
      return json({ ok: false, error: 'Недостаточно прав для смены пароля администратора платформы' }, 403, origin);
    }
    const loginRow = await db.prepare('select login from user_logins where user_id=? order by created_at limit 1').bind(target.id).first();
    const resolvedLogin = (loginRow && loginRow.login) || target.email || target.id;

    if (m[2] === 'password') {
      const password = String(body.password || '').trim() || makeOtp();
      if (password.length < 4) return json({ ok: false, error: 'Пароль минимум 4 символа' }, 400, origin);
      const salt = newSalt();
      await db.prepare('update users set pass_hash=?, salt=?, pass=null where id=?')
        .bind(await hashPassword(password, salt), salt, target.id).run();
      if (target.id !== me.id) {
        await db.prepare('delete from sessions where user_id=?').bind(target.id).run();
      }
      await audit(env, me.id, 'user.password', target.id, target.name);
      return json({ ok: true, login: resolvedLogin, password }, 200, origin);
    }

    if (m[2] === 'otp') {
      const code = makeOtp();
      const salt = newSalt();
      const expires = new Date(Date.now() + 24 * 3600e3).toISOString();
      await db.prepare(
        'insert into otp_codes (id,user_id,code_hash,salt,expires_at,used,created_by,created_at) values (?,?,?,?,?,0,?,?)'
      ).bind(uid('otp'), target.id, await hashPassword(code, salt), salt, expires, me.id, nowISO()).run();
      await audit(env, me.id, 'user.otp', target.id, target.name);
      return json({ ok: true, login: resolvedLogin, code, expires }, 200, origin);
    }
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
      const nextMentorName = (body.name != null && String(body.name).trim().length >= 2)
        ? str(body.name, 120).trim()
        : target.name;
      if (body.password != null && String(body.password).trim().length > 0) {
        const pw = String(body.password).trim();
        if (pw.length < 4) return json({ ok: false, error: 'Пароль минимум 4 символа' }, 400, origin);
        if (target.role === 'root' || target.role === 'admin') {
          return json({ ok: false, error: 'Недостаточно прав для смены пароля администратора' }, 403, origin);
        }
        const salt = newSalt();
        await db.prepare('update users set pass_hash=?, salt=?, pass=null where id=?')
          .bind(await hashPassword(pw, salt), salt, target.id).run();
        if (target.id !== me.id) {
          await db.prepare('delete from sessions where user_id=?').bind(target.id).run();
        }
        await audit(env, me.id, 'user.password', target.id, nextMentorName);
      }
      await audit(env, me.id, 'org.mentor.update', target.id, nextMentorName);
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
      const nextRole = target.role === 'org' ? 'student' : target.role;
      await db.prepare('update users set role=?, org_id=null, org_role=null where id=?')
        .bind(nextRole, target.id).run();
      await audit(env, me.id, 'org.mentor.remove', target.id, target.name);
      return json({ ok: true, detached: true }, 200, origin);
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
    if (!title.trim()) return json({ ok: false, error: 'Название события обязательно' }, 400, origin);
    const date = String(body.date || '').slice(0, 24);
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) return json({ ok: false, error: 'Нужна дата' }, 400, origin);
    const kind = ['internal', 'milestone', 'external', 'course', 'call'].includes(body.kind) ? body.kind : 'internal';
    const endDateRaw = String(body.endDate || '').slice(0, 10);
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(endDateRaw) ? endDateRaw : '';
    const project = str(body.project, 120).trim();
    const color = str(body.color, 20).trim();
    const slotTime = str(body.slotTime, 10).trim();
    const link = str(body.link, 300).trim();

    const id = uid('slot');
    const importance = ['high', 'middle', 'low'].includes(body.importance) ? body.importance : 'middle';
    await db.prepare(
      'insert into org_slots (id,org_id,student_id,title,note,date,end_date,project,color,slot_time,link,kind,importance,notify,done,created_by,created_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)'
    ).bind(id, org.id, sid, title.trim(),
      str(body.note, 400), date.slice(0, 10), endDate, project, color, slotTime, link, kind, importance, body.notify ? 1 : 0, me.id, nowISO()).run();

    // Если назначен прямой созвон ученику — отражаем его и в таблице слотов/броней календаря ментора
    if (kind === 'call' && sid) {
      const stCard = await db.prepare('select mentor_id from org_students where user_id=?').bind(sid).first();
      const targetMentorId = isMentor() ? me.id : ((stCard && stCard.mentor_id) || org.manager_id || me.id);
      const csId = uid('cs');
      await db.prepare(
        'insert into org_call_slots (id,org_id,mentor_id,slot_date,slot_time,duration,link,student_id,topic,importance,org_slot_id,created_at,booked_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?)'
      ).bind(csId, org.id, targetMentorId, date.slice(0, 10), slotTime || '18:00', Number(body.duration) || 60,
        link, sid, title.trim(), importance, id, nowISO(), nowISO()).run();
    }

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
      const kind = ['internal', 'milestone', 'external', 'course', 'call'].includes(body.kind) ? body.kind : row.kind;
      const endDate = body.endDate !== undefined
        ? (/^\d{4}-\d{2}-\d{2}$/.test(String(body.endDate || '').slice(0, 10)) ? String(body.endDate).slice(0, 10) : '')
        : (row.end_date || '');
      const project = body.project !== undefined ? str(body.project, 120).trim() : (row.project || '');
      const color = body.color !== undefined ? str(body.color, 20).trim() : (row.color || '');
      const slotTime = body.slotTime !== undefined ? str(body.slotTime, 10).trim() : (row.slot_time || '');
      const link = body.link !== undefined ? str(body.link, 300).trim() : (row.link || '');
      await db.prepare('update org_slots set title=?,note=?,date=?,end_date=?,project=?,color=?,slot_time=?,link=?,kind=?,done=?,student_id=?,importance=?,notify=? where id=?')
        .bind(body.title != null ? str(body.title, 160) : row.title,
          body.note != null ? str(body.note, 400) : row.note,
          date.slice(0, 10), endDate, project, color, slotTime, link, kind,
          body.done == null ? row.done : (body.done ? 1 : 0),
          isMentor() ? row.student_id : (body.studentId !== undefined ? (body.studentId ? String(body.studentId) : null) : row.student_id),
          ['high', 'middle', 'low'].includes(body.importance) ? body.importance : (row.importance || 'middle'),
          body.notify == null ? (row.notify || 0) : (body.notify ? 1 : 0),
          row.id).run();
      await audit(env, me.id, 'org.slot.update', row.id, date.slice(0, 10));
      return json({ ok: true }, 200, origin);
    }

    if (method === 'DELETE') {
      await db.prepare('delete from org_call_slots where org_slot_id=?').bind(row.id).run();
      await db.prepare('delete from org_slots where id=?').bind(row.id).run();
      await audit(env, me.id, 'org.slot.delete', row.id, row.title);
      return json({ ok: true }, 200, origin);
    }
  }

  /* ── Календарь слотов созвона ментора и бронирования учеников ── */
  function mapCallSlot(cs, userMap) {
    const st = cs.student_id && userMap ? userMap[cs.student_id] : null;
    const mn = cs.mentor_id && userMap ? userMap[cs.mentor_id] : null;
    return {
      id: cs.id,
      orgId: cs.org_id,
      mentorId: cs.mentor_id,
      mentorName: mn ? mn.name : '',
      date: cs.slot_date,
      time: cs.slot_time || '17:00',
      duration: Number(cs.duration) || 60,
      link: cs.link || '',
      studentId: cs.student_id || null,
      studentName: st ? st.name : '',
      studentGrade: st ? (st.grade || '') : '',
      studentColor: st ? (st.color || '') : '',
      topic: cs.topic || '',
      importance: cs.importance || 'middle',
      orgSlotId: cs.org_slot_id || null,
      bookedAt: cs.booked_at || null
    };
  }

  if (path === '/org/call-slots' && method === 'GET') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: true, slots: [] }, 200, origin);
    const qMentor = url.searchParams.get('mentor') || '';
    const rows = isMentor()
      ? await db.prepare('select * from org_call_slots where org_id=? and mentor_id=? order by slot_date, slot_time limit 500').bind(org.id, me.id).all()
      : (qMentor
          ? await db.prepare('select * from org_call_slots where org_id=? and mentor_id=? order by slot_date, slot_time limit 500').bind(org.id, qMentor).all()
          : await db.prepare('select * from org_call_slots where org_id=? order by slot_date, slot_time limit 500').bind(org.id).all());
    const uRows = await db.prepare('select id,name,grade,color from users where org_id=?').bind(org.id).all();
    const uMap = {};
    (uRows.results || []).forEach((u) => { uMap[u.id] = u; });
    return json({ ok: true, slots: (rows.results || []).map((r) => mapCallSlot(r, uMap)) }, 200, origin);
  }

  if (path === '/org/call-slots' && method === 'POST') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    const date = String(body.date || '').slice(0, 10);
    const time = String(body.time || '17:00').trim().slice(0, 5);
    const duration = [30, 45, 60, 90].includes(Number(body.duration)) ? Number(body.duration) : 60;
    const link = str(body.link, 300).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ ok: false, error: 'Укажите дату слота' }, 400, origin);
    if (!/^\d{2}:\d{2}$/.test(time)) return json({ ok: false, error: 'Укажите время слота (ЧЧ:ММ)' }, 400, origin);
    const targetMentorId = isMentor() ? me.id : String(body.mentorId || org.manager_id || me.id);

    const dup = await db.prepare('select id from org_call_slots where org_id=? and mentor_id=? and slot_date=? and slot_time=?')
      .bind(org.id, targetMentorId, date, time).first();
    if (dup) return json({ ok: false, error: 'На это время слот уже открыт' }, 409, origin);

    const id = uid('cs');
    await db.prepare(
      'insert into org_call_slots (id,org_id,mentor_id,slot_date,slot_time,duration,link,student_id,topic,importance,org_slot_id,created_at,booked_at) values (?,?,?,?,?,?,?,null,null,\'middle\',null,?,null)'
    ).bind(id, org.id, targetMentorId, date, time, duration, link, nowISO()).run();
    await audit(env, me.id, 'org.callslot.open', id, date + ' ' + time + ' · ' + duration + ' мин');
    return json({ ok: true, id }, 201, origin);
  }

  m = path.match(/^\/org\/call-slots\/([^/]+)(\/cancel)?$/);
  if (m) {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    const row = await db.prepare('select * from org_call_slots where id=?').bind(m[1]).first();
    if (!row || !org || row.org_id !== org.id) return json({ ok: false, error: 'Слот не найден' }, 404, origin);
    if (isMentor() && row.mentor_id !== me.id) return json({ ok: false, error: 'Чужой слот' }, 403, origin);

    if (m[2] === '/cancel' && method === 'POST') {
      if (row.org_slot_id) await db.prepare('delete from org_slots where id=?').bind(row.org_slot_id).run();
      await db.prepare('update org_call_slots set student_id=null, topic=null, org_slot_id=null, booked_at=null where id=?').bind(row.id).run();
      await audit(env, me.id, 'org.callslot.cancel', row.id, row.slot_date + ' ' + row.slot_time + (row.topic ? ' · ' + row.topic : ''));
      return json({ ok: true }, 200, origin);
    }

    if (!m[2] && method === 'DELETE') {
      if (row.org_slot_id) await db.prepare('delete from org_slots where id=?').bind(row.org_slot_id).run();
      await db.prepare('delete from org_call_slots where id=?').bind(row.id).run();
      await audit(env, me.id, row.student_id ? 'org.callslot.cancel' : 'org.callslot.delete', row.id, row.slot_date + ' ' + row.slot_time);
      return json({ ok: true }, 200, origin);
    }
  }

  /* статус ученика: по плану / отстаёт / в зоне риска */
  function studentStatus(slots) {
    const todayStr = nowISO().slice(0, 10);
    const open = slots.filter((s) => !s.done);
    const overdue = open.filter((s) => String(s.end_date || s.date || '').slice(0, 10) < todayStr);
    if (!overdue.length) return { status: 'plan', overdue: 0, worst: '' };
    const worst = overdue.reduce((a, b) => (String(a.end_date || a.date) < String(b.end_date || b.date) ? a : b));
    const days = Math.max(1, Math.round((Date.parse(todayStr + 'T00:00:00Z') - Date.parse(String(worst.end_date || worst.date).slice(0, 10) + 'T00:00:00Z')) / 864e5));
    const heavy = overdue.some((s) => s.importance === 'high' || s.kind === 'milestone');
    return { status: (heavy || days > 14) ? 'risk' : 'lag', overdue: overdue.length, worst: worst.title, days };
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


  /* ── ученик видит, что заполнил ментор + свободные слоты созвона ── */
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
    const org = me.orgId ? await db.prepare('select id,name,manager_id from organizations where id=?').bind(me.orgId).first() : null;
    if (!row && !org) return json({ ok: true, card: null, openSlots: [], myBookings: [] }, 200, origin);
    const mentorId = (row && row.mentor_id) || (org && org.manager_id) || null;
    const mentor = mentorId ? await db.prepare('select id,name,color from users where id=?').bind(mentorId).first() : null;
    const todayStr = nowISO().slice(0, 10);
    let openSlots = [];
    let myBookings = [];
    if (mentorId) {
      const csRows = await db.prepare('select * from org_call_slots where mentor_id=? and slot_date >= ? order by slot_date, slot_time limit 200')
        .bind(mentorId, todayStr).all();
      const allCs = csRows.results || [];
      openSlots = allCs.filter((x) => !x.student_id).map((x) => ({
        id: x.id, date: x.slot_date, time: x.slot_time || '17:00', duration: Number(x.duration) || 60
      }));
      myBookings = allCs.filter((x) => x.student_id === me.id).map((x) => ({
        id: x.id, date: x.slot_date, time: x.slot_time || '17:00', duration: Number(x.duration) || 60,
        topic: x.topic || 'Созвон с ментором', importance: x.importance || 'middle', link: x.link || ''
      }));
    }
    return json({
      ok: true,
      card: row ? cardOf(row) : { userId: me.id, mentorId, tags: [], gpa: '', sat: '', ielts: '', goal: '', status: 'plan' },
      mentor: mentor ? { id: mentor.id, name: mentor.name, color: mentor.color || 'mint' } : null,
      org: org ? { id: org.id, name: org.name } : null,
      openSlots,
      myBookings,
      updatedBy: 'ментор'
    }, 200, origin);
  }

  m = path.match(/^\/me\/call-slots\/([^/]+)\/(book|cancel)$/);
  if (m && method === 'POST') {
    const slotRow = await db.prepare('select * from org_call_slots where id=?').bind(m[1]).first();
    if (!slotRow) return json({ ok: false, error: 'Слот не найден' }, 404, origin);

    if (m[2] === 'cancel') {
      if (slotRow.student_id !== me.id) return json({ ok: false, error: 'Это не ваша запись' }, 403, origin);
      if (slotRow.org_slot_id) await db.prepare('delete from org_slots where id=?').bind(slotRow.org_slot_id).run();
      await db.prepare('update org_call_slots set student_id=null, topic=null, org_slot_id=null, booked_at=null where id=?').bind(slotRow.id).run();
      await audit(env, me.id, 'org.callslot.cancel', slotRow.id, slotRow.slot_date + ' ' + slotRow.slot_time);
      return json({ ok: true }, 200, origin);
    }

    // book
    if (!me.orgId || me.orgId !== slotRow.org_id) {
      return json({ ok: false, error: 'Слот принадлежит другой организации' }, 403, origin);
    }
    const stCard = await db.prepare('select mentor_id from org_students where user_id=?').bind(me.id).first();
    const orgRow = await db.prepare('select manager_id from organizations where id=?').bind(me.orgId).first();
    const allowedMentor = (stCard && stCard.mentor_id) || (orgRow && orgRow.manager_id) || null;
    if (allowedMentor && slotRow.mentor_id !== allowedMentor) {
      return json({ ok: false, error: 'Этот слот открыт другим ментором' }, 403, origin);
    }
    if (slotRow.student_id) {
      return json({ ok: false, error: 'Этот слот уже занят — выберите другое время' }, 409, origin);
    }
    const topic = str(body.topic, 160).trim() || 'Созвон с ментором';
    const importance = ['high', 'middle', 'low'].includes(body.importance) ? body.importance : 'middle';
    const orgSlotId = uid('slot');
    const slotTitle = /^созвон/i.test(topic) ? topic : 'Созвон с ментором · ' + topic;

    const upd = await db.prepare(
      'update org_call_slots set student_id=?, topic=?, importance=?, org_slot_id=?, booked_at=? where id=? and (student_id is null or student_id=\'\')'
    ).bind(me.id, topic, importance, orgSlotId, nowISO(), slotRow.id).run();
    if (upd && upd.meta && upd.meta.changes === 0) {
      return json({ ok: false, error: 'Слот только что заняли — выберите другое окно' }, 409, origin);
    }

    await db.prepare(
      'insert into org_slots (id,org_id,student_id,title,note,date,end_date,project,color,slot_time,link,kind,importance,notify,done,created_by,created_at) values (?,?,?,?,?,?,?, ?,?,?,?,?,?,1,0,?,?)'
    ).bind(orgSlotId, slotRow.org_id, me.id, slotTitle, 'Забронировано учеником (' + (slotRow.duration || 60) + ' мин)',
      slotRow.slot_date, '', '', '', slotRow.slot_time || '17:00', slotRow.link || '', 'call', importance, me.id, nowISO()).run();

    await audit(env, me.id, 'org.callslot.book', slotRow.id, slotRow.slot_date + ' ' + (slotRow.slot_time || '') + ' · ' + topic);
    return json({ ok: true, id: slotRow.id, orgSlotId }, 200, origin);
  }

  if (path === '/org/crm' && method === 'GET') {
    const g = orgGuard(false); if (g) return g;
    const org = await myOrgRow();
    if (!org) return json({ ok: true, org: null, mentors: [], students: [], templates: [], callSlots: [], kpi: null }, 200, origin);

    const [members, cards, slots, templates, tagGroups, orgLogins, callSlotRows] = await Promise.all([
      db.prepare('select * from users where org_id=? order by name limit 500').bind(org.id).all(),
      db.prepare('select * from org_students').all(),
      db.prepare('select * from org_slots where org_id=? order by date limit 1000').bind(org.id).all(),
      db.prepare('select * from roadmap_templates where org_id=? order by created_at desc limit 100').bind(org.id).all(),
      db.prepare('select * from org_tag_groups where org_id=? order by created_at asc').bind(org.id).all(),
      isOrgAdmin()
        ? db.prepare('select ul.user_id, ul.login from user_logins ul join users u on u.id=ul.user_id where u.org_id=?').bind(org.id).all()
        : Promise.resolve({ results: [] }),
      isMentor()
        ? db.prepare('select * from org_call_slots where org_id=? and mentor_id=? order by slot_date, slot_time limit 500').bind(org.id, me.id).all()
        : db.prepare('select * from org_call_slots where org_id=? order by slot_date, slot_time limit 500').bind(org.id).all()
    ]);

    const loginMap = {};
    (orgLogins.results || []).forEach((l) => { if (!loginMap[l.user_id]) loginMap[l.user_id] = l.login; });
    const withOrgLogin = (obj) => isOrgAdmin()
      ? Object.assign(obj, { login: loginMap[obj.id] || obj.email || '' })
      : obj;

    const cardMap = {};
    (cards.results || []).forEach((c) => { cardMap[c.user_id] = c; });
    const rows = members.results || [];
    const uMap = {};
    rows.forEach((u) => { uMap[u.id] = u; });
    const mappedCallSlots = (callSlotRows.results || []).map((cs) => mapCallSlot(cs, uMap));
    const mentors = rows.filter((u) => u.role === 'org' || u.org_role === 'mentor').map((u) => withOrgLogin(adminUser(toUser(u))));
    const students = rows.filter((u) => u.role === 'student' && u.org_role !== 'mentor');

    const slotsBy = {};
    (slots.results || []).forEach((s) => { (slotsBy[s.student_id] = slotsBy[s.student_id] || []).push(s); });

    (cards.results || []).forEach((c) => {
      if (!c.mentor_id || mentors.some((m) => m.id === c.mentor_id)) return;
      const u = rows.find((x) => x.id === c.mentor_id);
      if (u) mentors.push(withOrgLogin(adminUser(toUser(u))));
    });

    const fullList = students.map((u) => {
      const mine = slotsBy[u.id] || [];
      const st = studentStatus(mine);
      const card = cardMap[u.id] ? cardOf(cardMap[u.id]) : { userId: u.id, tags: [], status: st.status };
      const todayIso = nowISO().slice(0, 10);
      const upcomingPoint = mine.filter((s) => !s.done && String(s.date || '').slice(0, 10) >= todayIso)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
      const ongoingCourse = mine.filter((s) => !s.done && s.end_date && String(s.end_date).slice(0, 10) >= todayIso)
        .sort((a, b) => String(a.end_date).localeCompare(String(b.end_date)))[0];
      const next = upcomingPoint || ongoingCourse || null;
      const mentor = mentors.find((m) => m.id === (card.mentorId || org.manager_id));
      return withOrgLogin(Object.assign({}, adminUser(toUser(u)), {
        tags: card.tags && card.tags.length ? card.tags : [],
        mentorId: card.mentorId || org.manager_id || null,
        mentorName: mentor ? mentor.name.split(' ')[0] + (mentor.name.split(' ')[1] ? ' ' + mentor.name.split(' ')[1].charAt(0) + '.' : '') : '',
        mentorFullName: mentor ? mentor.name : '',
        status: st.status, overdue: st.overdue, worst: st.worst, days: st.days || 0,
        nextTitle: next ? next.title : (st.overdue ? st.worst : ''),
        nextDate: next ? next.date : '',
        nextEndDate: next ? (next.end_date || '') : '',
        overdueTitle: st.overdue ? st.worst : '',
        goal: card.goal || '', grade: card.grade || u.grade || ''
      }));
    });

    /* МЕНТОР: видит строго ТОЛЬКО свою группу учеников и ближайшие созвоны — никаких чужих менторов, шаблонов и статистики! */
    if (isMentor()) {
      const myList = fullList.filter((s) => s.mentorId === me.id);
      const myStudentIds = new Set(myList.map((s) => s.id));
      const bookedAsCalls = mappedCallSlots
        .filter((cs) => cs.studentId && String(cs.date) >= nowISO().slice(0, 10))
        .map((cs) => ({
          id: cs.orgSlotId || cs.id, callSlotId: cs.id, title: cs.topic || 'Созвон с ментором',
          date: cs.date, time: cs.time || '', duration: cs.duration || 60, link: cs.link || '',
          importance: cs.importance || 'middle',
          studentId: cs.studentId, studentName: cs.studentName || ''
        }));
      const slotCalls = (slots.results || [])
        .filter((s) => !s.done && myStudentIds.has(s.student_id) && (s.kind === 'call' || /созвон/i.test(s.title || '')) && String(s.date) >= nowISO().slice(0, 10))
        .filter((s) => !bookedAsCalls.some((b) => b.id === s.id))
        .map((s) => ({
          id: s.id, title: s.title, date: s.date, time: s.slot_time || '', link: s.link || '', note: s.note || '',
          importance: s.importance || 'middle',
          studentId: s.student_id,
          studentName: (myList.find((u) => u.id === s.student_id) || {}).name || ''
        }));
      const myCalls = bookedAsCalls.concat(slotCalls)
        .sort((a, b) => String(a.date + ' ' + (a.time || '')).localeCompare(String(b.date + ' ' + (b.time || ''))))
        .slice(0, 20);
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
        callSlots: mappedCallSlots,
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
        login: m.login || m.email || '',
        email: m.email || '',
        isManager: m.id === org.manager_id,
        createdAt: m.createdAt || '',
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
      callSlots: mappedCallSlots,
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

    const [row, cardRow, portfolio, slots, events, plans, reports, sprints, stLoginRow] = await Promise.all([
      db.prepare('select * from users where id=?').bind(id).first(),
      db.prepare('select * from org_students where user_id=?').bind(id).first(),
      db.prepare('select * from org_portfolio where user_id=? order by created_at desc limit 200').bind(id).all(),
      db.prepare('select * from org_slots where org_id=? and student_id=? order by date limit 500').bind(org.id, id).all(),
      db.prepare('select * from events where id in (select event_id from saved_events where user_id=?) limit 100').bind(id).all(),
      db.prepare("select * from plan_items where user_id=? and (chat_id is null or chat_id='') order by start_at limit 300").bind(id).all(),
      db.prepare('select * from org_reports where user_id=? order by created_at desc limit 30').bind(id).all(),
      db.prepare('select * from org_sprints where org_id=? and user_id=? order by start_date limit 60').bind(org.id, id).all(),
      isOrgAdmin()
        ? db.prepare('select login from user_logins where user_id=? order by created_at limit 1').bind(id).first()
        : Promise.resolve(null)
    ]);

    const st = studentStatus(slots.results || []);
    const pf = portfolio.results || [];
    const tu = toUser(row);
    const mentorRow = (cardRow && cardRow.mentor_id)
      ? await db.prepare('select id,name from users where id=?').bind(cardRow.mentor_id).first()
      : (org.manager_id ? await db.prepare('select id,name from users where id=?').bind(org.manager_id).first() : null);
    const userPayload = Object.assign(adminUser(tu), { portfolio: tu.portfolio || null });
    if (isOrgAdmin()) {
      userPayload.login = (stLoginRow && stLoginRow.login) || tu.email || '';
    }
    return json({
      ok: true,
      user: userPayload,
      mentorName: mentorRow ? mentorRow.name : '',
      card: cardRow ? cardOf(cardRow) : { userId: id, tags: [], status: st.status },
      status: st.status, overdue: st.overdue, days: st.days || 0,
      achievements: pf.filter((x) => x.kind === 'achievement').map((x) => ({ id: x.id, title: x.title, note: x.note || '', year: x.year || '', file: x.file_name || '', size: x.file_size || 0, fileData: x.file_data || '' })),
      projects: pf.filter((x) => x.kind === 'project').map((x) => ({ id: x.id, title: x.title, note: x.note || '', year: x.year || '', file: x.file_name || '', size: x.file_size || 0, fileData: x.file_data || '' })),
      certificates: pf.filter((x) => x.kind === 'certificate').map((x) => ({ id: x.id, title: x.title, note: x.note || '', year: x.year || '', file: x.file_name || '', size: x.file_size || 0, fileData: x.file_data || '' })),
      slots: (slots.results || []).map((s) => ({
        id: s.id, title: s.title, note: s.note || '', date: s.date,
        endDate: s.end_date || '', project: s.project || '', color: s.color || '',
        slotTime: s.slot_time || '', link: s.link || '',
        kind: s.kind, done: !!s.done,
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
      const prevCard = await db.prepare('select mentor_id from org_students where user_id=?').bind(m[1]).first();
      const nextMentorId = mentor ? mentor.id : null;
      await db.prepare(
        `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
         values (?,?,'[]','','','','','','','','','','plan',?)
         on conflict(user_id) do update set mentor_id=excluded.mentor_id, updated_at=excluded.updated_at`
      ).bind(m[1], nextMentorId, nowISO()).run();
      if (!prevCard || (prevCard.mentor_id || null) !== nextMentorId) {
        await audit(env, me.id, 'org.student.mentor', m[1], mentor ? mentor.name : 'без ментора');
      }
      return json({ ok: true, mentorId: nextMentorId }, 200, origin);
    }

    if (m[2] === 'remove' && method === 'POST') {
      const stUser = await db.prepare('select name from users where id=?').bind(m[1]).first();
      await db.prepare('update org_call_slots set student_id=null, topic=null, org_slot_id=null, booked_at=null where org_id=? and student_id=?').bind(org.id, m[1]).run();
      await db.prepare('delete from org_portfolio where user_id=?').bind(m[1]).run();
      await db.prepare('delete from org_students where user_id=?').bind(m[1]).run();
      await db.prepare('delete from org_slots where org_id=? and student_id=?').bind(org.id, m[1]).run();
      await db.prepare('update users set org_id=null, org_role=null where id=?').bind(m[1]).run();
      await audit(env, me.id, 'org.student.remove', m[1], stUser ? stUser.name : 'карточка откреплена');
      return json({ ok: true }, 200, origin);
    }
  }

  /* ── шаблон из роадмапа ученика ── */
  if (path === '/org/templates/from-student' && method === 'POST') {
    const g = orgGuard(true); if (g) return g;
    const org = await myOrgRow();
    const id = String(body.userId || '');
    if (!(await canSeeStudent(org, id))) return json({ ok: false, error: 'Ученик не найден' }, 404, origin);
    const [user, stCard, slots] = await Promise.all([
      db.prepare('select * from users where id=?').bind(id).first(),
      db.prepare('select * from org_students where user_id=?').bind(id).first(),
      db.prepare('select * from org_slots where org_id=? and student_id=? and (project is null or project=\'\') order by date').bind(org.id, id).all()
    ]);
    const nowDt = new Date();
    const baseSchoolYear = nowDt.getMonth() >= 8 ? nowDt.getFullYear() : nowDt.getFullYear() - 1;
    const rawGrade = parseInt(String((stCard && stCard.grade) || (user && user.grade) || '10'), 10);
    const stuGrade = [9, 10, 11, 12].includes(rawGrade) ? rawGrade : 10;
    const items = (slots.results || []).map((s) => {
      const d = new Date(String(s.date).slice(0, 10) + 'T12:00:00Z');
      const sy = d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
      const gNum = Math.max(9, Math.min(12, stuGrade + (sy - baseSchoolYear)));
      const isCourse = s.kind === 'course' || (s.end_date && s.end_date > s.date);
      const isCall = s.kind === 'call' || /созвон/i.test(s.title || '');
      const ed = isCourse && s.end_date ? new Date(String(s.end_date).slice(0, 10) + 'T12:00:00Z') : null;
      return {
        title: s.title,
        month: d.getUTCMonth(),
        day: d.getUTCDate(),
        endMonth: ed ? ed.getUTCMonth() : null,
        endDay: ed ? ed.getUTCDate() : null,
        kind: isCourse ? 'course' : (isCall ? 'call' : 'date'),
        grade: String(gNum),
        importance: ['high', 'middle', 'low'].includes(s.importance) ? s.importance : (isCourse || isCall ? 'middle' : 'high'),
        color: s.color || '',
        calls: isCall ? 1 : 0,
        note: s.note || ''
      };
    });
    const tid = uid('tpl');
    const gSet = Array.from(new Set(items.map((x) => Number(x.grade)).filter(Boolean))).sort((a, b) => a - b);
    const gradeRange = gSet.length > 1 ? (gSet[0] + '–' + gSet[gSet.length - 1]) : String(gSet[0] || stuGrade);
    const tagsJson = stCard && stCard.tags ? stCard.tags : '[]';
    await db.prepare('insert into roadmap_templates (id,org_id,title,tags,grade,items,created_at) values (?,?,?,?,?,?,?)')
      .bind(tid, org.id, 'Из роадмапа · ' + (user ? user.name.split(' ')[0] : ''), tagsJson,
        gradeRange, JSON.stringify(items), nowISO()).run();
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
      title: str(it.title, 160),
      month: Math.max(0, Math.min(11, Number(it.month) || 0)),
      day: Math.max(1, Math.min(28, Number(it.day) || 1)),
      endMonth: (it.endMonth === null || it.endMonth === undefined || it.endMonth === '') ? null
        : Math.max(0, Math.min(11, Number(it.endMonth) || 0)),
      endDay: (it.endDay === null || it.endDay === undefined || it.endDay === '') ? null
        : Math.max(1, Math.min(28, Number(it.endDay) || 1)),
      kind: ['course', 'call', 'date'].includes(it.kind) ? it.kind : 'date',
      importance: ['high', 'middle', 'low'].includes(it.importance) ? it.importance : (it.kind === 'course' || it.kind === 'call' ? 'middle' : 'high'),
      color: str(it.color || '', 20),
      calls: Math.max(0, Math.min(52, Number(it.calls) || 0)),
      grade: str(it.grade || '', 10),
      note: str(it.note, 200),
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
      const baseSchoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
      const todayIso = nowISO().slice(0, 10);
      // дата старта потока: от неё считаются относительные слоты (offset)
      const startRaw = String(body.startDate || '').slice(0, 10);
      const startDate = /^\d{4}-\d{2}-\d{2}$/.test(startRaw)
        ? new Date(startRaw + 'T09:00:00') : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (const sid of ids) {
        if (!(await canSeeStudent(org, sid))) continue;
        const [stUser, stCard] = await Promise.all([
          db.prepare('select grade from users where id=?').bind(sid).first(),
          db.prepare('select grade from org_students where user_id=?').bind(sid).first()
        ]);
        const parsedStuGrade = parseInt(String((stCard && stCard.grade) || (stUser && stUser.grade) || '10'), 10);
        const stuGrade = [9, 10, 11, 12].includes(parsedStuGrade) ? parsedStuGrade : 10;

        await db.prepare(
          `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,template_id,updated_at)
           values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           on conflict(user_id) do update set template_id=excluded.template_id, updated_at=excluded.updated_at`
        ).bind(sid, org.manager_id || null, '[]', String(stuGrade), '', '', '', '', '', '', '', '', 'plan', row.id, nowISO()).run();

        const COURSE_PALETTE = ['#FF9F43', '#8B8DF0', '#3CC9B5', '#FF7AA8'];
        let cIdx = 0;
        const pad2 = (n) => String(n).padStart(2, '0');
        for (const it of items) {
          const itemGradeNum = parseInt(String(it.grade || ''), 10);
          // Если у шаблона несколько классов (10, 11, 12), не дублируем уже прошедшие младшие классы
          if ([9, 10, 11, 12].includes(itemGradeNum) && itemGradeNum < stuGrade) continue;
          const itemSchoolYear = [9, 10, 11, 12].includes(itemGradeNum)
            ? baseSchoolYear + (itemGradeNum - stuGrade)
            : baseSchoolYear;

          const monthIdx = Math.max(0, Math.min(11, Number(it.month) || 0));
          const dayNum = Math.max(1, Math.min(28, Number(it.day) || 1));
          let startIso;
          if (it.offset !== null && it.offset !== undefined && it.offset !== '') {
            const dOff = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + Number(it.offset)));
            startIso = dOff.toISOString().slice(0, 10);
          } else {
            const calY = monthIdx >= 8 ? itemSchoolYear : itemSchoolYear + 1;
            startIso = calY + '-' + pad2(monthIdx + 1) + '-' + pad2(dayNum);
          }

          const isCourse = it.kind === 'course';
          const isCall = it.kind === 'call';
          if (isCall && Number(it.calls) > 1) {
            const totalCalls = Math.min(12, Number(it.calls) || 4);
            const stepDays = Math.max(7, Math.round(240 / totalCalls));
            const baseUtc = new Date(startIso + 'T12:00:00Z');
            for (let ci = 0; ci < totalCalls; ci++) {
              const cd = new Date(baseUtc.getTime() + ci * stepDays * 864e5).toISOString().slice(0, 10);
              const isPast = cd < todayIso ? 1 : 0;
              await db.prepare(
                'insert into org_slots (id,org_id,student_id,title,note,date,end_date,color,slot_time,kind,importance,notify,done,created_by,created_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
              ).bind(uid('slot'), org.id, sid, it.title, it.note || '', cd, '', '', '18:00', 'call',
                it.importance || 'middle', 1, isPast, me.id, nowISO()).run();
            }
            continue;
          }

          let endD = '';
          if (isCourse) {
            if (it.endMonth !== null && it.endMonth !== undefined && it.endMonth !== '') {
              const em = Math.max(0, Math.min(11, Number(it.endMonth) || 0));
              const ed = Math.max(1, Math.min(28, Number(it.endDay) || 15));
              let endY = em >= 8 ? itemSchoolYear : itemSchoolYear + 1;
              const cand = endY + '-' + pad2(em + 1) + '-' + pad2(ed);
              if (cand < startIso) endY += 1;
              endD = endY + '-' + pad2(em + 1) + '-' + pad2(ed);
            } else {
              const weeks = Number(it.weeks) > 0 ? Number(it.weeks) : 8;
              endD = new Date(new Date(startIso + 'T12:00:00Z').getTime() + weeks * 7 * 864e5).toISOString().slice(0, 10);
            }
          }
          const col = isCourse ? (it.color || COURSE_PALETTE[(cIdx++) % COURSE_PALETTE.length]) : '';
          const imp = ['high', 'middle', 'low'].includes(it.importance) ? it.importance : (isCourse || isCall ? 'middle' : 'high');
          const dbKind = isCourse ? 'course' : (isCall ? 'call' : (imp === 'high' ? 'milestone' : 'internal'));
          const doneVal = (endD || startIso) < todayIso ? 1 : 0;
          await db.prepare(
            'insert into org_slots (id,org_id,student_id,title,note,date,end_date,color,slot_time,kind,importance,notify,done,created_by,created_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
          ).bind(uid('slot'), org.id, sid, it.title, it.note || '', startIso, endD, col, isCall ? '18:00' : '',
            dbKind, imp, 1, doneVal, me.id, nowISO()).run();
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
    const stUser = await db.prepare('select name from users where id=?').bind(id).first();
    const rid = uid('rep');
    await db.prepare('insert into org_reports (id,user_id,period,comment,payload,created_by,created_at) values (?,?,?,?,?,?,?)')
      .bind(rid, id, str(body.period || 'month', 20), str(body.comment, 2000),
        JSON.stringify(body.payload || null), me.id, nowISO()).run();
    await audit(env, me.id, 'org.report.create', rid, stUser ? stUser.name : id);
    return json({ ok: true, id: rid }, 201, origin);
  }

  const normalizeAdminTags = (raw) => {
    const arr = Array.isArray(raw) ? raw : String(raw || '').split(',');
    const out = [];
    for (const item of arr) {
      const clean = str(item, 40).toLowerCase().replace(/^#+/, '').replace(/\s+/g, '_').trim();
      if (clean && !out.includes(clean)) out.push(clean);
      if (out.length >= 16) break;
    }
    return out;
  };

  const formatAdminMetaDiff = (prevTags, nextTags, prevNote, nextNote) => {
    const parts = [];
    if (JSON.stringify(prevTags) !== JSON.stringify(nextTags)) {
      const p = prevTags.length ? prevTags.map((t) => '#' + t).join(', ') : 'нет';
      const n = nextTags.length ? nextTags.map((t) => '#' + t).join(', ') : 'нет';
      parts.push('теги: ' + p + ' → ' + n);
    }
    if (prevNote !== nextNote) {
      parts.push('заметка: ' + (nextNote ? '«' + nextNote.slice(0, 120) + (nextNote.length > 120 ? '…' : '') + '»' : 'очищена'));
    }
    return parts.join(' · ');
  };

  if (path === '/admin/users' && method === 'GET') {
    const g = notAdmin(); if (g) return g;
    // админ не видит root; root видит всех
    const sql = me.role === 'root'
      ? 'select * from users order by role, created_at'
      : "select * from users where role != 'root' order by role, created_at";
    const [list, logins, cards] = await Promise.all([
      db.prepare(sql).all(),
      db.prepare('select user_id, login from user_logins order by created_at').all(),
      db.prepare('select user_id, mentor_id from org_students').all()
    ]);
    const loginMap = {};
    for (const l of (logins.results || [])) {
      if (!loginMap[l.user_id]) loginMap[l.user_id] = l.login;
    }
    const mentorMap = {};
    for (const c of (cards.results || [])) {
      mentorMap[c.user_id] = c.mentor_id || null;
    }
    // Строгая приватность: adminTags и adminNote отдаются ТОЛЬКО здесь под notAdmin() (root и admin платформы)
    return json({
      ok: true,
      users: list.results.map((u) => Object.assign(adminUser(toUser(u)), {
        login: loginMap[u.id] || u.email || '',
        mentorId: mentorMap[u.id] || null,
        adminTags: P(u.admin_tags, []),
        adminNote: u.admin_note || ''
      }))
    }, 200, origin);
  }

  /* ── приватные админ-теги и заметки («для себя») с обязательной записью в audit_log ── */
  m = path.match(/^\/admin\/users\/([^/]+)\/admin-meta$/);
  if (m && method === 'PATCH') {
    const g = notAdmin(); if (g) return g;
    const target = await db.prepare('select * from users where id=?').bind(m[1]).first();
    if (!target) return json({ ok: false, error: 'Пользователь не найден' }, 404, origin);
    if (target.role === 'root' && me.role !== 'root') {
      return json({ ok: false, error: 'Недостаточно прав' }, 403, origin);
    }

    const prevTags = P(target.admin_tags, []);
    const prevNote = String(target.admin_note || '');
    const nextTags = body.adminTags !== undefined ? normalizeAdminTags(body.adminTags) : prevTags;
    const nextNote = body.adminNote !== undefined ? str(body.adminNote, 500) : prevNote;

    await db.prepare('update users set admin_tags=?, admin_note=? where id=?')
      .bind(JSON.stringify(nextTags), nextNote || null, target.id).run();

    const diff = formatAdminMetaDiff(prevTags, nextTags, prevNote, nextNote);
    await audit(env, me.id, 'user.admin_meta', target.id, diff || 'обновлены метки');
    return json({ ok: true, id: target.id, adminTags: nextTags, adminNote: nextNote }, 200, origin);
  }

  if (path === '/admin/users' && method === 'POST') {
    const g = notAdmin(); if (g) return g;
    const reqRole = ['student', 'admin', 'org', 'mentor'].includes(body.role) ? body.role : 'student';
    const role = reqRole === 'mentor' ? 'org' : reqRole;
    const orgRole = (reqRole === 'mentor' || body.orgRole === 'mentor') ? 'mentor' : null;
    if (role === 'admin') {
      const gr = notRoot(); if (gr) return json({ ok: false, error: 'Админов назначает только владелец' }, 403, origin);
    }
    let orgId = body.orgId ? String(body.orgId) : null;
    let orgRow = null;
    if (orgId) {
      orgRow = await db.prepare('select * from organizations where id=?').bind(orgId).first();
      if (!orgRow) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
    } else if (role === 'org') {
      return json({ ok: false, error: orgRole === 'mentor' ? 'Для ментора выберите организацию' : 'Для админа компании выберите организацию' }, 400, origin);
    }

    const login = str(body.login, 120).toLowerCase();
    if (!/^[a-z0-9._@-]{3,40}$/.test(login)) {
      return json({ ok: false, error: 'Логин: 3–40 символов, латиница, цифры, . _ - @' }, 400, origin);
    }
    if (await resolveLogin(env, login)) return json({ ok: false, error: 'Логин занят' }, 409, origin);

    const password = String(body.password || '') || makeOtp();
    const salt = newSalt();
    const id = uid('u');
    const initAdminTags = body.adminTags !== undefined ? normalizeAdminTags(body.adminTags) : [];
    const initAdminNote = body.adminNote !== undefined ? str(body.adminNote, 500) : '';
    await db.prepare(
      `insert into users (id,name,email,pass_hash,salt,role,org_id,org_role,grade,school,city,color,admin_tags,admin_note,created_at)
       values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, str(body.name, 120) || 'Без имени', login.includes('@') ? login : null,
      await hashPassword(password, salt), salt, role, orgId, orgRole, str(body.grade, 40),
      str(body.school, 120) || (orgRow ? orgRow.name : 'Школа №1520'), (orgRow && orgRow.city) || 'Москва', 'sky',
      JSON.stringify(initAdminTags), initAdminNote || null, nowISO()).run();
    await db.prepare('insert into user_logins (login,user_id,created_at) values (?,?,?)')
      .bind(login, id, nowISO()).run();

    if (role === 'student' && orgId && orgRow) {
      let chosenMentorId = orgRow.manager_id || null;
      let chosenMentorName = '';
      if (body.mentorId !== undefined) {
        if (body.mentorId) {
          const mRow = await db.prepare("select id, name from users where id=? and org_id=? and (role='org' or org_role='mentor')")
            .bind(String(body.mentorId), orgId).first();
          if (mRow) { chosenMentorId = mRow.id; chosenMentorName = mRow.name; }
        } else {
          chosenMentorId = null;
        }
      }
      await db.prepare(
        `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
         values (?,?,'[]',?,'','','','','','','','','plan',?)`
      ).bind(id, chosenMentorId, str(body.grade, 40), nowISO()).run();
      if (chosenMentorName) {
        await audit(env, me.id, 'org.student.mentor', id, chosenMentorName);
      }
    }

    await audit(env, me.id, 'user.create', id, login + ' / ' + (orgRole === 'mentor' ? 'mentor' : role) + (orgRow ? ' / ' + orgRow.name : ''));
    if (initAdminTags.length || initAdminNote) {
      const diff = formatAdminMetaDiff([], initAdminTags, '', initAdminNote);
      await audit(env, me.id, 'user.admin_meta', id, diff);
    }

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

      const reqRole = body.role;
      let finalDbRole = target.role;
      let finalDbOrgRole = target.org_role || null;
      if (reqRole) {
        if (!['student', 'admin', 'org', 'mentor'].includes(reqRole)) {
          return json({ ok: false, error: 'Неизвестная роль' }, 400, origin);
        }
        const nextDbRole = reqRole === 'mentor' ? 'org' : reqRole;
        const nextDbOrgRole = reqRole === 'mentor' ? 'mentor' : (body.orgRole === 'mentor' ? 'mentor' : null);
        if (nextDbRole !== target.role || nextDbOrgRole !== (target.org_role || null)) {
          const gr = notRoot(); if (gr) return json({ ok: false, error: 'Роли меняет только владелец' }, 403, origin);
          if (target.role === 'root') return json({ ok: false, error: 'Роль владельца неизменна' }, 403, origin);
          await db.prepare('update users set role=?, org_role=? where id=?').bind(nextDbRole, nextDbOrgRole, target.id).run();
          await audit(env, me.id, 'user.role', target.id, nextDbOrgRole === 'mentor' ? 'mentor' : nextDbRole);
          finalDbRole = nextDbRole;
          finalDbOrgRole = nextDbOrgRole;
        }
      }

      // привязка к организации: у админа компании и ментора она обязательна
      if (body.orgId !== undefined || body.mentorId !== undefined) {
        const nextOrg = body.orgId !== undefined ? (body.orgId ? String(body.orgId) : null) : target.org_id;
        let orgRow = null;
        if (nextOrg) {
          orgRow = await db.prepare('select * from organizations where id=?').bind(nextOrg).first();
          if (!orgRow) return json({ ok: false, error: 'Организация не найдена' }, 400, origin);
        } else if (finalDbRole === 'org') {
          return json({ ok: false, error: 'Сотрудник организации должен быть привязан к организации' }, 400, origin);
        }
        if (body.orgId !== undefined && nextOrg !== target.org_id) {
          await db.prepare('update users set org_id=? where id=?').bind(nextOrg, target.id).run();
          await audit(env, me.id, 'user.org', target.id, nextOrg || '—');
        }
        if (finalDbRole === 'student' && finalDbOrgRole !== 'mentor') {
          if (nextOrg && orgRow) {
            let chosenMentorId = orgRow.manager_id || null;
            let chosenMentorName = '';
            if (body.mentorId !== undefined) {
              if (body.mentorId) {
                const mRow = await db.prepare("select id, name from users where id=? and org_id=? and (role='org' or org_role='mentor')")
                  .bind(String(body.mentorId), nextOrg).first();
                if (mRow) { chosenMentorId = mRow.id; chosenMentorName = mRow.name; }
              } else {
                chosenMentorId = null;
              }
            } else {
              const curCard = await db.prepare('select mentor_id from org_students where user_id=?').bind(target.id).first();
              if (curCard && curCard.mentor_id && nextOrg === target.org_id) chosenMentorId = curCard.mentor_id;
            }
            await db.prepare(
              `insert into org_students (user_id,mentor_id,tags,grade,gpa,gpa_note,sat,sat_note,ielts,ielts_note,goal,goal_note,status,updated_at)
               values (?,?,'[]',?,'','','','','','','','','plan',?)
               on conflict(user_id) do update set mentor_id=excluded.mentor_id, updated_at=excluded.updated_at`
            ).bind(target.id, chosenMentorId, str(body.grade !== undefined ? body.grade : target.grade, 40), nowISO()).run();
            if (body.mentorId !== undefined) {
              await audit(env, me.id, 'org.student.mentor', target.id, chosenMentorName || 'без ментора');
            }
          } else if (!nextOrg) {
            await db.prepare('delete from org_students where user_id=?').bind(target.id).run();
          }
        }
      }

      // приватные админ-теги и заметка (если переданы вместе с формой редактирования)
      let metaChanged = false;
      if (body.adminTags !== undefined || body.adminNote !== undefined) {
        const prevTags = P(target.admin_tags, []);
        const prevNote = String(target.admin_note || '');
        const nextTags = body.adminTags !== undefined ? normalizeAdminTags(body.adminTags) : prevTags;
        const nextNote = body.adminNote !== undefined ? str(body.adminNote, 500) : prevNote;
        const diff = formatAdminMetaDiff(prevTags, nextTags, prevNote, nextNote);
        if (diff) {
          await db.prepare('update users set admin_tags=?, admin_note=? where id=?')
            .bind(JSON.stringify(nextTags), nextNote || null, target.id).run();
          await audit(env, me.id, 'user.admin_meta', target.id, diff);
          metaChanged = true;
        }
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
      if (fields.length || login || !metaChanged) {
        await audit(env, me.id, 'user.update', target.id, target.name);
      }
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
    const loginRow = await db.prepare('select login from user_logins where user_id=? order by created_at limit 1').bind(target.id).first();
    await audit(env, me.id, 'user.otp', target.id, target.name);
    return json({ ok: true, code, expires, login: (loginRow && loginRow.login) || target.email || target.id }, 200, origin);
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
    const safeQ = (sql) => db.prepare(sql).all().catch(() => ({ results: [] }));
    const [
      list, histNames, userRows, orgRows, eventRows, tplRows, slotRows, pfRows, promptRows, postRows
    ] = await Promise.all([
      db.prepare('select * from audit_log order by created_at desc limit 1000').all(),
      safeQ("select target, detail from audit_log where target is not null and detail is not null and action in ('register','login','login.otp','logout','user.delete','org.mentor.delete','org.mentor.remove','user.update','user.password','user.impersonate')"),
      safeQ('select id, name, email, role, org_role, org_id from users'),
      safeQ('select id, name from organizations'),
      safeQ('select id, title from events'),
      safeQ('select id, title from roadmap_templates'),
      safeQ('select id, title, student_id from org_slots'),
      safeQ('select id, user_id, title from org_portfolio'),
      safeQ('select key, title from ai_prompts'),
      safeQ('select id, text from posts')
    ]);

    const usersMap = {};
    let rootId = null;
    for (const u of (userRows.results || [])) {
      usersMap[u.id] = u;
      if (u.role === 'root') rootId = u.id;
    }
    const deletedUserNames = {};
    for (const h of (histNames.results || [])) {
      if (h.target && h.detail && !deletedUserNames[h.target]) {
        deletedUserNames[h.target] = h.detail;
      }
    }
    const orgsMap = {};
    for (const o of (orgRows.results || [])) orgsMap[o.id] = o.name;
    const eventsMap = {};
    for (const ev of (eventRows.results || [])) eventsMap[ev.id] = ev.title;
    const tplMap = {};
    for (const t of (tplRows.results || [])) tplMap[t.id] = t.title;
    const slotMap = {};
    for (const s of (slotRows.results || [])) slotMap[s.id] = s;
    const pfMap = {};
    for (const p of (pfRows.results || [])) pfMap[p.id] = p;
    const promptMap = {};
    for (const pr of (promptRows.results || [])) promptMap[pr.key] = pr.title;
    const postMap = {};
    for (const po of (postRows.results || [])) {
      const snippet = String(po.text || '').replace(/\s+/g, ' ').trim().slice(0, 48);
      postMap[po.id] = snippet ? (snippet + (String(po.text || '').length > 48 ? '…' : '')) : '';
    }

    const roleRu = (u) => {
      if (!u) return '';
      if (u.role === 'root') return 'Владелец';
      if (u.role === 'admin') return 'Администратор';
      if (u.role === 'org') return u.org_role === 'mentor' ? 'Ментор' : 'Админ компании';
      if (u.org_role === 'mentor') return 'Ментор';
      return 'Ученик';
    };
    const roleCodeRu = (code) => {
      if (code === 'root') return 'Владелец';
      if (code === 'admin') return 'Администратор';
      if (code === 'org') return 'Админ компании';
      if (code === 'mentor') return 'Ментор';
      if (code === 'student') return 'Ученик';
      return code || '';
    };
    const resolvePersonName = (id, fallback) => {
      if (!id) return fallback || '';
      if (usersMap[id] && usersMap[id].name) return usersMap[id].name;
      if (deletedUserNames[id]) return deletedUserNames[id];
      return fallback || '';
    };

    const isoToRuNum = (strVal) => String(strVal || '').replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$3.$2.$1');

    const log = (list.results || []).map((raw) => {
      const hideRoot = me.role !== 'root' && rootId && raw.actor_id === rootId;
      const actorObj = (!hideRoot && raw.actor_id) ? usersMap[raw.actor_id] : null;
      const actorName = hideRoot
        ? 'Администрация платформы'
        : (resolvePersonName(raw.actor_id) || (raw.action === 'db.seed' ? 'Система' : 'Пользователь'));
      const actorRole = hideRoot
        ? 'Система'
        : (actorObj ? roleRu(actorObj) : (raw.actor_id ? 'Удалённый аккаунт' : 'Система'));
      const actorEmail = (!hideRoot && actorObj && actorObj.email) ? actorObj.email : '';
      const whoPhrase = hideRoot || (!raw.actor_id && raw.action === 'db.seed')
        ? actorName
        : 'Пользователь «' + actorName + '»';

      const act = String(raw.action || '');
      const t = raw.target ? String(raw.target) : '';
      const d = raw.detail != null ? String(raw.detail) : '';

      let category = 'other';
      let tone = 'sky';
      let human = '';
      const targetPeople = [];
      const addTargetPerson = (nm) => {
        if (nm && nm !== 'ученик' && nm !== 'ментор' && nm !== 'пользователь' && nm !== 'без имени' && nm !== 'удалённый аккаунт') {
          if (!targetPeople.includes(nm)) targetPeople.push(nm);
        }
      };

      if (act === 'login') {
        category = 'auth'; tone = 'mint';
        human = whoPhrase + ' вошёл в систему';
      } else if (act === 'login.otp') {
        category = 'auth'; tone = 'mint';
        human = whoPhrase + ' вошёл в систему по одноразовому коду';
      } else if (act === 'logout') {
        category = 'auth'; tone = 'sky';
        human = whoPhrase + ' вышел из системы';
      } else if (act === 'register') {
        category = 'auth'; tone = 'mint';
        addTargetPerson(d || actorName);
        human = 'Пользователь «' + (d || actorName) + '» зарегистрировался в системе';
      } else if (act === 'password.code_sent') {
        category = 'auth'; tone = 'sun';
        human = whoPhrase + ' запросил код подтверждения для смены пароля' + (d ? ' (' + d + ')' : '');
      } else if (act === 'password.change' || act === 'password.change.code') {
        category = 'auth'; tone = 'sun';
        human = whoPhrase + ' сменил свой пароль';
      } else if (act === 'user.create') {
        category = 'users'; tone = 'mint';
        const createdName = resolvePersonName(t);
        addTargetPerson(createdName);
        const cleanDetail = d.replace(/\/\s*(student|org|mentor|admin)/i, (_, rc) => '· роль: ' + roleCodeRu(rc.toLowerCase()));
        human = whoPhrase + ' создал нового пользователя' +
          (createdName ? ' «' + createdName + '»' : '') +
          (cleanDetail ? ' (' + cleanDetail + ')' : '');
      } else if (act === 'user.admin_meta') {
        category = 'users'; tone = 'lav';
        const uname = resolvePersonName(t) || 'пользователь';
        addTargetPerson(uname);
        human = whoPhrase + ' изменил приватные админ-метки пользователя «' + uname + '»' + (d ? ' (' + d + ')' : '');
      } else if (act === 'user.update') {
        category = 'users'; tone = 'sky';
        const uname = resolvePersonName(t, d) || 'без имени';
        addTargetPerson(uname);
        human = whoPhrase + ' изменил профиль пользователя «' + uname + '»';
      } else if (act === 'user.delete') {
        category = 'users'; tone = 'danger';
        const uname = d || resolvePersonName(t) || 'удалённый аккаунт';
        addTargetPerson(uname);
        human = whoPhrase + ' удалил пользователя «' + uname + '» из системы';
      } else if (act === 'user.bulk-delete') {
        category = 'users'; tone = 'danger';
        human = whoPhrase + ' удалил выбранных пользователей из системы' + (d ? ' (количество: ' + d + ')' : '');
      } else if (act === 'user.role') {
        category = 'users'; tone = 'lav';
        const uname = resolvePersonName(t) || 'пользователь';
        addTargetPerson(uname);
        human = whoPhrase + ' назначил пользователю «' + uname + '» роль «' + roleCodeRu(d) + '»';
      } else if (act === 'user.org') {
        category = 'users'; tone = 'lav';
        const uname = resolvePersonName(t) || 'пользователь';
        addTargetPerson(uname);
        if (!d || d === '—') {
          human = whoPhrase + ' открепил пользователя «' + uname + '» от организации';
        } else {
          const oname = orgsMap[d] || d;
          human = whoPhrase + ' привязал пользователя «' + uname + '» к организации «' + oname + '»';
        }
      } else if (act === 'user.password') {
        category = 'users'; tone = 'sun';
        const uname = resolvePersonName(t, d) || 'пользователь';
        addTargetPerson(uname);
        human = whoPhrase + ' установил новый пароль пользователю «' + uname + '»';
      } else if (act === 'user.otp') {
        category = 'users'; tone = 'sun';
        const uname = resolvePersonName(t, d) || 'пользователь';
        addTargetPerson(uname);
        human = whoPhrase + ' сгенерировал одноразовый код входа для пользователя «' + uname + '»';
      } else if (act === 'user.impersonate') {
        category = 'users'; tone = 'lav';
        const uname = resolvePersonName(t, d) || 'пользователь';
        addTargetPerson(uname);
        human = whoPhrase + ' открыл сессию от имени пользователя «' + uname + '» (режим проверки)';
      } else if (act === 'org.create') {
        category = 'org'; tone = 'mint';
        const oname = d || orgsMap[t] || 'организация';
        human = whoPhrase + ' создал организацию «' + oname + '»';
      } else if (act === 'org.update') {
        category = 'org'; tone = 'sky';
        const oname = d || orgsMap[t] || 'организация';
        human = whoPhrase + ' обновил данные организации «' + oname + '»';
      } else if (act === 'org.delete') {
        category = 'org'; tone = 'danger';
        const oname = d || orgsMap[t] || 'организация';
        human = whoPhrase + ' удалил организацию «' + oname + '» из системы';
      } else if (act === 'org.manager.create') {
        category = 'org'; tone = 'mint';
        const mname = resolvePersonName(t);
        addTargetPerson(mname);
        human = whoPhrase + ' создал аккаунт руководителя организации' +
          (mname ? ' «' + mname + '»' : '') + (d ? ' (' + d + ')' : '');
      } else if (act === 'org.user.create') {
        category = 'org'; tone = 'mint';
        const uname = resolvePersonName(t);
        addTargetPerson(uname);
        human = whoPhrase + ' добавил участника' +
          (uname ? ' «' + uname + '»' : '') + ' в организацию' + (d ? ' (' + d + ')' : '');
      } else if (act === 'org.student.attach') {
        category = 'org'; tone = 'mint';
        const uname = resolvePersonName(t) || 'ученик';
        addTargetPerson(uname);
        human = whoPhrase + ' прикрепил стороннего ученика «' + uname + '» к организации' + (d ? ' (' + d + ')' : '');
      } else if (act === 'org.mentor.update') {
        category = 'org'; tone = 'sky';
        const mname = resolvePersonName(t, d) || 'ментор';
        addTargetPerson(mname);
        human = whoPhrase + ' обновил профиль ментора «' + mname + '»';
      } else if (act === 'org.mentor.remove') {
        category = 'org'; tone = 'sun';
        const mname = d || resolvePersonName(t) || 'ментор';
        addTargetPerson(mname);
        human = whoPhrase + ' снял права ментора у пользователя «' + mname + '» и открепил его от организации';
      } else if (act === 'org.mentor.delete') {
        category = 'org'; tone = 'danger';
        const mname = d || resolvePersonName(t) || 'ментор';
        addTargetPerson(mname);
        human = whoPhrase + ' удалил ментора «' + mname + '» из системы';
      } else if (act === 'org.student.mentor') {
        category = 'org'; tone = 'lav';
        const sname = resolvePersonName(t) || 'ученик';
        addTargetPerson(sname);
        if (!d || d === 'без ментора') {
          human = whoPhrase + ' снял назначенного ментора у ученика «' + sname + '»';
        } else {
          addTargetPerson(d);
          human = whoPhrase + ' назначил ученику «' + sname + '» ментора «' + d + '»';
        }
      } else if (act === 'org.student.update') {
        category = 'org'; tone = 'sky';
        const sname = resolvePersonName(t) || 'ученик';
        addTargetPerson(sname);
        human = whoPhrase + ' обновил карточку сопровождения ученика «' + sname + '»';
      } else if (act === 'org.student.remove') {
        category = 'org'; tone = 'danger';
        const sname = resolvePersonName(t, d && d !== 'карточка откреплена' ? d : '') || 'ученик';
        addTargetPerson(sname);
        human = whoPhrase + ' открепил ученика «' + sname + '» от организации';
      } else if (act === 'org.portfolio.add') {
        category = 'org'; tone = 'mint';
        const pf = pfMap[t];
        const sname = pf ? resolvePersonName(pf.user_id) : '';
        addTargetPerson(sname);
        const cleanItem = d
          .replace(/^achievement:\s*/i, 'достижение «')
          .replace(/^project:\s*/i, 'проект «')
          .replace(/^certificate:\s*/i, 'сертификат «')
          .replace(/^exam:\s*/i, 'экзамен «');
        const itemText = cleanItem !== d ? (cleanItem + '»') : (d ? '«' + d + '»' : 'запись');
        human = whoPhrase + ' добавил в портфолио' + (sname ? ' ученика «' + sname + '» ' : ' ') + itemText;
      } else if (act === 'org.template.save' || act === 'org.template.fromStudent') {
        category = 'org'; tone = 'mint';
        const tname = d || tplMap[t] || 'шаблон';
        human = whoPhrase + ' сохранил шаблон дорожной карты «' + tname + '»';
      } else if (act === 'org.template.assign') {
        category = 'org'; tone = 'lav';
        const tname = tplMap[t] || 'дорожная карта';
        human = whoPhrase + ' назначил шаблон плана «' + tname + '»' + (d ? ' (' + isoToRuNum(d) + ')' : '');
      } else if (act === 'org.sprint.add') {
        category = 'org'; tone = 'mint';
        human = whoPhrase + ' добавил спринт' + (d ? ' «' + d + '»' : '') + ' в план подготовки';
      } else if (act === 'org.slot.create') {
        category = 'org'; tone = 'mint';
        const sl = slotMap[t];
        const sname = sl ? resolvePersonName(sl.student_id) : '';
        addTargetPerson(sname);
        const title = d || (sl && sl.title) || 'этап';
        human = whoPhrase + ' добавил дедлайн «' + title + '»' + (sname ? ' для ученика «' + sname + '»' : '');
      } else if (act === 'org.slot.update') {
        category = 'org'; tone = 'sky';
        const sl = slotMap[t];
        const sname = sl ? resolvePersonName(sl.student_id) : '';
        addTargetPerson(sname);
        const title = (sl && sl.title) ? '«' + sl.title + '»' : 'этап плана';
        human = whoPhrase + ' изменил ' + title +
          (sname ? ' у ученика «' + sname + '»' : '') +
          (d ? ' (срок: ' + isoToRuNum(d) + ')' : '');
      } else if (act === 'org.slot.delete') {
        category = 'org'; tone = 'danger';
        const title = d || (slotMap[t] && slotMap[t].title) || 'этап плана';
        human = whoPhrase + ' удалил дедлайн «' + title + '» из плана ученика';
      } else if (act === 'org.report.create') {
        category = 'org'; tone = 'mint';
        const sname = resolvePersonName(d, d) || 'ученик';
        addTargetPerson(sname);
        human = whoPhrase + ' сформировал отчёт для родителей по ученику «' + sname + '»';
      } else if (act === 'org.taggroup.add') {
        category = 'org'; tone = 'sky';
        human = whoPhrase + ' добавил набор тегов в организации' + (d ? ' (' + d + ')' : '');
      } else if (act === 'event.create') {
        category = 'content'; tone = 'mint';
        const etitle = d || eventsMap[t] || 'без названия';
        human = whoPhrase + ' опубликовал новое мероприятие «' + etitle + '»';
      } else if (act === 'event.update') {
        category = 'content'; tone = 'sky';
        const etitle = d || eventsMap[t] || 'мероприятие';
        human = whoPhrase + ' отредактировал мероприятие «' + etitle + '»';
      } else if (act === 'event.delete') {
        category = 'content'; tone = 'danger';
        const etitle = d || eventsMap[t] || 'мероприятие';
        human = whoPhrase + ' удалил мероприятие «' + etitle + '»';
      } else if (act === 'event.bulk-delete') {
        category = 'content'; tone = 'danger';
        human = whoPhrase + ' удалил выбранные мероприятия' + (d ? ' (количество: ' + d + ')' : '');
      } else if (act === 'post.moderate') {
        category = 'content'; tone = d === 'published' ? 'mint' : 'danger';
        const snip = postMap[t];
        const postLabel = snip ? ' «' + snip + '»' : '';
        if (d === 'hidden') human = whoPhrase + ' скрыл публикацию в ленте сообщества' + postLabel;
        else if (d === 'published') human = whoPhrase + ' восстановил публикацию в ленте сообщества' + postLabel;
        else human = whoPhrase + ' удалил публикацию из ленты сообщества' + postLabel;
      } else if (act === 'moderation.cleanup') {
        category = 'content'; tone = 'danger';
        human = whoPhrase + ' очистил архив удалённых публикаций';
      } else if (act === 'ai.add') {
        category = 'system'; tone = 'mint';
        human = whoPhrase + ' подключил новый API-ключ нейросети' + (d ? ' (' + d + ')' : '');
      } else if (act === 'ai.delete') {
        category = 'system'; tone = 'danger';
        human = whoPhrase + ' удалил API-ключ нейросети';
      } else if (act === 'prompt.update') {
        category = 'system'; tone = 'sky';
        const ptitle = promptMap[t] || t || 'системный промт';
        human = whoPhrase + ' обновил системную инструкцию ИИ «' + ptitle + '»';
      } else if (act === 'db.seed') {
        category = 'system'; tone = 'sky';
        human = 'Система проверила и обновила базовые демо-данные платформы';
      } else if (act === 'db.restore') {
        category = 'system'; tone = 'sun';
        human = whoPhrase + ' восстановил базу данных из резервной копии';
      } else {
        category = 'system'; tone = 'sky';
        human = whoPhrase + ' выполнил действие «' + act + '»' + (d ? ' (' + isoToRuNum(d) + ')' : '');
      }

      return {
        id: raw.id,
        actor_id: hideRoot ? null : raw.actor_id,
        actor_name: actorName,
        actor_role: actorRole,
        actor_email: actorEmail,
        target_people: hideRoot ? [] : targetPeople,
        action: raw.action,
        target: hideRoot ? null : raw.target,
        detail: hideRoot ? 'Администрация' : raw.detail,
        category,
        tone,
        human_text: isoToRuNum(human),
        created_at: raw.created_at
      };
    });

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
    const col = body.color !== undefined ? (str(body.color, 24) || 'sun') : (cur.color || 'sun');
    const av = body.avatar !== undefined ? (str(body.avatar, 350000) || null) : (cur.avatar || null);
    const pf = body.portfolio !== undefined
      ? (body.portfolio && typeof body.portfolio === 'object' ? str(JSON.stringify(body.portfolio), 1800000) : null)
      : cur.portfolio;
    await db.prepare('update users set name=?,grade=?,school=?,city=?,color=?,avatar=?,skills=?,interests=?,portfolio=? where id=?')
      .bind(u.name, u.grade, u.school, u.city, col, av, K(u.skills), K(u.interests), pf, m[1]).run();
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
