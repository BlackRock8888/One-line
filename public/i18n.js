const D = {
  ru: {
    tagline:'Связь для своих.', create:'Создать комнату', join:'Присоединиться', invited:'Вас пригласили в комнату.',
    preparing:'Готовим комнату…', mic:'Разрешите доступ к микрофону…', joining:'Входим…', linking:'Соединяем голоса…',
    waiting_hint:'Отправьте ссылку близкому. Без гостя комната закроется через минуту.', waiting:'Ждём гостя · {s} с', talking:'Разговор · {t}', connected:'Вы на связи. Просто говорите.', unstable:'Связь нестабильна, ждём восстановления…', failed:'Аудио не соединилось. Выйдите и зайдите снова.', reconnecting:'Переподключаемся к комнате…',
    you:'Вы', guest:'Гость', invite:'Пригласить', free:'Свободное место', here:'В комнате', offline:'—',
    mute:'Микрофон', unmute:'Включить', share:'Ссылка', chat:'Чат', leave:'Выйти', copy:'Скопировать', copied:'Ссылка скопирована.', copyManual:'Выделите и скопируйте ссылку.',
    enableAudio:'Включить звук', send:'Отправить', msg:'Сообщение', chatNote:'Только эта сессия. История исчезнет при выходе.', chatWait:'Чат откроется, когда придёт гость', chatClose:'Закрыть чат',
    log:'Журнал', logTitle:'Технический журнал', logCopy:'Скопировать', logNote:'Только технические события. Без звука и ключей.', logEmpty:'Событий пока нет.', close:'Закрыть', language:'Язык',
    moreSeats:'Больше мест — позже', retry:'Попробовать снова',
    ended_LEFT:'Вы вышли. Микрофон выключен.', ended_WAIT_ENDED:'Гость не пришёл за минуту. Комната закрыта, микрофон выключен.', ended_waitclock:'Гость не пришёл за минуту. Комната закрыта, микрофон выключен.',
    e_ROOM_OCCUPIED:'В комнате уже двое. Попробуйте, когда освободится место.', e_ROOM_NOT_FOUND:'Эта комната закрыта или не существует. Создайте новую.', e_TRY_LATER:'Слишком много попыток. Подождите минуту.', e_HTTPS_REQUIRED:'Для микрофона нужна защищённая страница (HTTPS).',
    e_NotAllowedError:'Доступ к микрофону запрещён. Разрешите его в настройках браузера.', e_NotFoundError:'Микрофон не найден. Подключите его и повторите.', e_NETWORK_ERROR:'Нет связи с сервером. Проверьте интернет.', e_SERVER_UNCONFIGURED:'Сервер комнат не подключён к этому сайту.', e_ROOM_SERVICE_UNAVAILABLE:'Сервер комнат недоступен. Попробуйте позже.', e_default:'Не удалось подключиться. Попробуйте ещё раз.'
  },
  en: {
    tagline:'Connection for your own.', create:'Create room', join:'Join', invited:'You have been invited to a room.',
    preparing:'Preparing your room…', mic:'Allow microphone access…', joining:'Entering…', linking:'Connecting your voices…',
    waiting_hint:'Send the link to your person. Without a guest the room closes in a minute.', waiting:'Waiting for guest · {s}s', talking:'In call · {t}', connected:'You are connected. Just talk.', unstable:'Connection unstable, waiting to recover…', failed:'Audio did not connect. Leave and join again.', reconnecting:'Reconnecting to the room…',
    you:'You', guest:'Guest', invite:'Invite', free:'Open seat', here:'In room', offline:'—',
    mute:'Mic', unmute:'Unmute', share:'Share', chat:'Chat', leave:'Leave', copy:'Copy', copied:'Link copied.', copyManual:'Select and copy the link.',
    enableAudio:'Enable audio', send:'Send', msg:'Message', chatNote:'This session only. History disappears when you leave.', chatWait:'Chat opens when your guest arrives', chatClose:'Close chat',
    log:'Log', logTitle:'Technical log', logCopy:'Copy', logNote:'Technical events only. No audio, no keys.', logEmpty:'No events yet.', close:'Close', language:'Language',
    moreSeats:'More seats — later', retry:'Try again',
    ended_LEFT:'You left. Microphone is off.', ended_WAIT_ENDED:'No guest within a minute. Room closed, microphone off.', ended_waitclock:'No guest within a minute. Room closed, microphone off.',
    e_ROOM_OCCUPIED:'Two people are already in. Try again when a seat opens.', e_ROOM_NOT_FOUND:'This room is closed or does not exist. Create a new one.', e_TRY_LATER:'Too many attempts. Wait a minute.', e_HTTPS_REQUIRED:'The microphone needs a secure (HTTPS) page.',
    e_NotAllowedError:'Microphone access denied. Allow it in browser settings.', e_NotFoundError:'No microphone found. Connect one and retry.', e_NETWORK_ERROR:'Cannot reach the server. Check your internet.', e_SERVER_UNCONFIGURED:'The room server is not connected to this site.', e_ROOM_SERVICE_UNAVAILABLE:'The room server is unavailable. Try later.', e_default:'Could not connect. Please try again.'
  },
  ar: {
    tagline:'تواصل لأقربائك.', create:'إنشاء غرفة', join:'انضمام', invited:'تمت دعوتك إلى غرفة.',
    preparing:'نجهّز الغرفة…', mic:'اسمح بالوصول إلى الميكروفون…', joining:'ندخل…', linking:'نربط الأصوات…',
    waiting_hint:'أرسل الرابط لمن تحب. تُغلق الغرفة بعد دقيقة بلا ضيف.', waiting:'بانتظار الضيف · {s} ث', talking:'مكالمة · {t}', connected:'أنتم على اتصال. تحدثوا.', unstable:'الاتصال غير مستقر، ننتظر التعافي…', failed:'تعذّر وصل الصوت. اخرج وادخل من جديد.', reconnecting:'إعادة الاتصال بالغرفة…',
    you:'أنت', guest:'الضيف', invite:'دعوة', free:'مقعد شاغر', here:'في الغرفة', offline:'—',
    mute:'الميكروفون', unmute:'تشغيل', share:'مشاركة', chat:'دردشة', leave:'خروج', copy:'نسخ', copied:'تم نسخ الرابط.', copyManual:'حدّد الرابط وانسخه.',
    enableAudio:'تشغيل الصوت', send:'إرسال', msg:'رسالة', chatNote:'هذه الجلسة فقط. يُمحى السجل عند الخروج.', chatWait:'تفتح الدردشة عند وصول الضيف', chatClose:'إغلاق الدردشة',
    log:'السجل', logTitle:'السجل التقني', logCopy:'نسخ', logNote:'أحداث تقنية فقط. بلا صوت أو مفاتيح.', logEmpty:'لا أحداث بعد.', close:'إغلاق', language:'اللغة',
    moreSeats:'مقاعد أكثر — لاحقًا', retry:'حاول مجددًا',
    ended_LEFT:'غادرت. الميكروفون متوقف.', ended_WAIT_ENDED:'لم يصل ضيف خلال دقيقة. أُغلقت الغرفة والميكروفون متوقف.', ended_waitclock:'لم يصل ضيف خلال دقيقة. أُغلقت الغرفة والميكروفون متوقف.',
    e_ROOM_OCCUPIED:'يوجد شخصان بالفعل. حاول عند توفر مقعد.', e_ROOM_NOT_FOUND:'هذه الغرفة مغلقة أو غير موجودة. أنشئ غرفة جديدة.', e_TRY_LATER:'محاولات كثيرة. انتظر دقيقة.', e_HTTPS_REQUIRED:'الميكروفون يحتاج صفحة آمنة (HTTPS).',
    e_NotAllowedError:'تم رفض الميكروفون. اسمح به من إعدادات المتصفح.', e_NotFoundError:'لا يوجد ميكروفون. وصّل واحدًا وأعد المحاولة.', e_NETWORK_ERROR:'تعذّر الوصول إلى الخادم. تحقق من الإنترنت.', e_SERVER_UNCONFIGURED:'خادم الغرف غير موصول بهذا الموقع.', e_ROOM_SERVICE_UNAVAILABLE:'خادم الغرف غير متاح. حاول لاحقًا.', e_default:'تعذّر الاتصال. حاول مرة أخرى.'
  }
};
const KEY = 'brt-lang';
export let lang = 'en';
export function pickLanguage() {
  const saved = localStorage.getItem(KEY);
  if (D[saved]) return saved;
  for (const l of navigator.languages || [navigator.language]) { const c = String(l).slice(0,2).toLowerCase(); if (D[c]) return c; }
  return 'en';
}
export function t(key, vars = {}) {
  const s = D[lang][key] ?? D.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
export const errorText = code => D[lang]['e_' + code] ?? D[lang].e_default;
export function applyLanguage(next, onChange) {
  lang = D[next] ? next : 'en';
  localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
  for (const el of document.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  onChange?.();
}
