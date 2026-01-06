(function() {
    'use strict';

    var manifest = {
        type: 'video',
        version: '1.1',
        name: 'UA Online - Український контент',
        description: 'Плагін для україномовних фільмів і серіалів з UAKino, HDRezka UA, Toloka, Takflix, UAKino.best та UASerials. Підтримує високоякісний стрімінг та авторизацію в HDRezka.',
        component: 'ua_online'
    };

    Lampa.Manifest.plugins = manifest;

    var component = {
        object: {},
        network: new Lampa.Reguest(),
        scroll: new Lampa.Scroll({mask: true, over: true}),
        items: [],
        html: $('<div></div>'),
        empty: function() {
            this.html.append(Lampa.Template.get('list_empty', {}));
            this.draw();
        },
        start: function() {
            Lampa.Controller.enable('content');
            this.build();
            this.card();
        },
        build: function() {
            this.html.append(this.scroll.render());
            this.html.append('<div class="online__footer"></div>');
            this.loading = false;
        },
        card: function() {
            var _this = this;
            this.activity.loader(true);
            this.load(function() {
                _this.activity.loader(false);
                _this.activity.toggle();
            });
        },
        init: function() {
            this.activity = new Lampa.Activity({
                url: '',
                title: manifest.name,
                component: 'ua_online',
                page: 1
            });
            this.activity.on('load', this.start.bind(this));
        },
        load: function(callback) {
            var _this = this;
            _this.activity.loader(true);
            var query = encodeURIComponent(this.object.movie.title + (this.object.movie.year ? ' ' + this.object.movie.year : ''));
            var sources = ['uakino', 'hdrezka_ua', 'toloka', 'takflix', 'uakino_best', 'uaserials'];
            var results = [];

            function getHDRezkaMirror() {
                var mirror = Lampa.Storage.get('ua_hdrezka_mirror', 'https://hdrezka.ag').replace(/\/$/, '');
                if (!mirror.startsWith('https://')) mirror = 'https://' + mirror;
                return mirror;
            }

            function getHDRezkaCookie() {
                var cookie = Lampa.Storage.get('ua_hdrezka_cookie', '');
                if (cookie.indexOf('PHPSESSID=') === -1) {
                    cookie = 'PHPSESSID=' + (Math.random().toString(36).substr(2, 26)) + (cookie ? '; ' + cookie : '');
                }
                return cookie;
            }

            function fetchWithProxy(url, useProxy, headers = {}) {
                if (useProxy) {
                    var proxyUrl = Lampa.Storage.get('ua_online_proxy_url', 'https://cors-anywhere.herokuapp.com/');
                    url = proxyUrl + url;
                }
                if (url.includes('hdrezka')) {
                    headers.Cookie = getHDRezkaCookie();
                }
                return _this.network.silent(url, function(html) {
                    return html;
                }, function() {
                    Lampa.Noty.show('Помилка з\'єднання. Спробуйте VPN.');
                    return null;
                }, null, { headers: headers, withCredentials: true });
            }

            function hdrezkaLogin(success, error) {
                var host = getHDRezkaMirror();
                var login = Lampa.Storage.get('ua_hdrezka_login', '');
                var password = Lampa.Storage.get('ua_hdrezka_password', '');
                if (!login || !password) {
                    Lampa.Noty.show('Введіть логін та пароль для HDRezka в налаштуваннях.');
                    if (error) error();
                    return;
                }
                var postdata = {
                    login_name: login,
                    login_password: password,
                    login_not_save: 0
                };
                var url = host + '/ajax/login/';
                _this.network.native(url, function(result, response, headers) {
                    if (response.success) {
                        Lampa.Storage.set('ua_hdrezka_status', 'true');
                        var setCookies = headers['set-cookie'] || [];
                        var cookieStr = setCookies.map(c => c.split(';')[0]).join('; ');
                        Lampa.Storage.set('ua_hdrezka_cookie', cookieStr);
                        verifyHDRezkaSession(success, error);
                    } else {
                        Lampa.Noty.show(response.message || 'Помилка авторизації в HDRezka.');
                        Lampa.Storage.set('ua_hdrezka_status', 'false');
                        if (error) error();
                    }
                }, function() {
                    Lampa.Noty.show('Помилка запиту до HDRezka.');
                    if (error) error();
                }, postdata, { dataType: 'json', withCredentials: true, returnHeaders: true });
            }

            function verifyHDRezkaSession(success, error) {
                var host = getHDRezkaMirror();
                var url = host + '/';
                var headers = { Cookie: getHDRezkaCookie() };
                _this.network.silent(url, function(html) {
                    if (html.indexOf('<form id="login-form"') === -1) {
                        Lampa.Noty.show('Авторизація в HDRezka успішна!');
                        if (success) success();
                    } else {
                        Lampa.Noty.show('Сесія HDRezka невалідна. Спробуйте знову.');
                        Lampa.Storage.set('ua_hdrezka_status', 'false');
                        if (error) error();
                    }
                }, function() {
                    if (error) error();
                }, null, { headers: headers });
            }

            function parseUAKino(html) {
                var items = [];
                $(html).find('.movie-item').each(function() {
                    var title = $(this).find('.movie-title').text();
                    var link = $(this).find('a').attr('href');
                    var quality = $(this).find('.quality').text() || 'HD';
                    if (title.match(/україн/i)) {
                        items.push({title: title, url: 'https://uakino.club' + link, quality: quality});
                    }
                });
                return items;
            }

            function parseHDRezkaUA(html) {
                var items = [];
                $(html).find('.b-post__title').each(function() {
                    var title = $(this).text();
                    var link = $(this).find('a').attr('href');
                    var quality = 'Full HD';
                    if (title.match(/україн/i) || link.includes('ua')) {
                        items.push({title: title, url: link, quality: quality});
                    }
                });
                return items;
            }

            function parseUAKinoBest(html) {
                var items = [];
                $(html).find('.film-item').each(function() {  // Припустима структура, адаптуйте якщо сайт змінився
                    var title = $(this).find('.film-title').text();
                    var link = $(this).find('a').attr('href');
                    var quality = $(this).find('.hd-tag').text() || 'HD';
                    if (title.match(/україн/i)) {
                        items.push({title: title, url: 'https://uakino.best' + link, quality: quality});
                    }
                });
                return items;
            }

            function parseUASerials(html) {
                var items = [];
                $(html).find('.serial-item').each(function() {  // Припустима структура для uaserials.pro
                    var title = $(this).find('.serial-title').text();
                    var link = $(this).find('a').attr('href');
                    var quality = 'Full HD';  // Зазвичай серіали в HD
                    if (title.match(/україн/i)) {
                        items.push({title: title, url: 'https://uaserials.pro' + link, quality: quality});
                    }
                });
                return items;
            }

            // ... (parseToloka та parseTakflix без змін, додайте якщо потрібно)

            var promises = sources.map(function(source) {
                var url;
                var parser;
                switch(source) {
                    case 'uakino': url = 'https://uakino.club/search?q=' + query; parser = parseUAKino; break;
                    case 'hdrezka_ua': url = getHDRezkaMirror() + '/search/?do=search&subaction=search&q=' + query; parser = parseHDRezkaUA; break;
                    case 'toloka': url = 'https://toloka.to/search.php?search=' + query + '&lang=ua'; parser = parseToloka; break;
                    case 'takflix': url = 'https://takflix.com/en/search?q=' + query; parser = parseTakflix; break;
                    case 'uakino_best': url = 'https://uakino.best/search?q=' + query; parser = parseUAKinoBest; break;
                    case 'uaserials': url = 'https://uaserials.pro/search?q=' + query; parser = parseUASerials; break;
                }
                return fetchWithProxy(url, Lampa.Storage.get('ua_online_use_proxy', true)).then(parser);
            });

            Promise.all(promises).then(function(allItems) {
                results = allItems.flat();
                if (results.length) {
                    _this.append(results);
                } else {
                    _this.empty();
                }
                callback();
            }).catch(function() {
                _this.empty();
                callback();
            });
        },
        append: function(items) {
            var _this = this;
            items.forEach(function(element) {
                var card = Lampa.Template.get('online_mod', {
                    title: element.title,
                    quality: element.quality,
                    info: ''
                });
                card.on('hover:focus', function() {
                    _this.selected = element.url;
                    Lampa.Player.play({
                        url: element.url,
                        title: element.title,
                        quality: { 'HD': element.url }
                    });
                });
                _this.scroll.append(card);
            });
        }
    };

    // Налаштування без змін
    Lampa.Params.input('ua_hdrezka_mirror', 'HDRezka Дзеркало (URL)', 'https://hdrezka.ag');
    Lampa.Params.input('ua_hdrezka_login', 'HDRezka Логін (email)', '');
    Lampa.Params.input('ua_hdrezka_password', 'HDRezka Пароль', '');
    Lampa.Params.trigger('ua_hdrezka_login_btn', 'Авторизуватися в HDRezka', function() {
        component.hdrezkaLogin(function() {}, function() {});
    });
    Lampa.Params.select('ua_online_use_proxy', 'Використовувати проксі для обходу блоків', true, [true, false]);
    Lampa.Params.input('ua_online_proxy_url', 'URL проксі (наприклад, CORS)', 'https://cors-anywhere.herokuapp.com/');

    // Ініціалізація з фіксом для кнопки
    function startPlugin() {
        window.ua_online_plugin = true;
        Lampa.Component.add('ua_online', component);
        Lampa.Listener.follow('full', function(e) {
            if (e.type == 'open' && e.body.find('.view--online').length == 0) {
                var button = $('<div class="full-start__button selector view--online"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><span>Переглянути українською</span></div>');
                button.on('hover:enter', function() {
                    component.object = e.object;
                    Lampa.Activity.push({
                        url: '',
                        component: 'ua_online',
                        movie: e.object.movie,
                        title: e.object.movie.title,
                        page: 1
                    });
                });
                e.body.find('.full-start__buttons').append(button);
            }
        });
    }

    if (!window.ua_online_plugin) startPlugin();
})();
