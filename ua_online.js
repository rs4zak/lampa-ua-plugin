(function () {
    'use strict';

    if (window.ua_online_plugin) return;
    window.ua_online_plugin = true;

    var manifest = {
        type: 'video',
        version: '1.3',
        name: 'UA Films',
        description: 'Українські фільми: uakino.best / uaserials.top / hdrezka',
        component: 'ua_films'
    };

    Lampa.Manifest.plugins = manifest;

    var component = {
        html: $('<div></div>'),
        scroll: null,
        activity: null,
        movie: null,

        init: function () {
            this.scroll = new Lampa.Scroll({ mask: true });

            this.activity = new Lampa.Activity({
                component: 'ua_films',
                title: 'Дивитись українською',
                page: 1
            });

            this.activity.on('load', this.start.bind(this));
        },

        start: function () {
            this.movie = this.activity.params.movie;
            this.html.empty();
            this.html.append(this.scroll.render());

            if (!this.movie || !this.movie.title) {
                return this.empty();
            }

            this.searchUAKino();
        },

        /* ===================== UAKINO ===================== */

        searchUAKino: function () {
            var _this = this;
            var q = encodeURIComponent(this.movie.title);

            Lampa.Reguest.silent(
                'https://uakino.best/index.php?do=search&subaction=search&story=' + q,
                function (html) {
                    var dom = $('<div>' + html + '</div>');
                    var item = dom.find('.movie-item a').first();

                    if (item.length) {
                        _this.loadPlayer(item.attr('href'), _this.searchUASerials);
                    } else {
                        _this.searchUASerials();
                    }
                },
                function () {
                    _this.searchUASerials();
                }
            );
        },

        /* ===================== UASERIALS ===================== */

        searchUASerials: function () {
            var _this = this;
            var q = encodeURIComponent(this.movie.title);

            Lampa.Reguest.silent(
                'https://uaserials.top/search/?q=' + q,
                function (html) {
                    var dom = $('<div>' + html + '</div>');
                    var item = dom.find('.short-item a').first();

                    if (item.length) {
                        _this.loadPlayer(item.attr('href'), _this.searchRezka);
                    } else {
                        _this.searchRezka();
                    }
                },
                function () {
                    _this.searchRezka();
                }
            );
        },

        /* ===================== HDREZKA ===================== */

        searchRezka: function () {
            var _this = this;
            var q = encodeURIComponent(this.movie.title);

            Lampa.Reguest.silent(
                'https://hdrezka.ag/search/?do=search&subaction=search&q=' + q,
                function (html) {
                    var dom = $('<div>' + html + '</div>');
                    var item = dom.find('.b-content__inline_item a').first();

                    if (item.length) {
                        _this.loadPlayer(item.attr('href'), _this.empty);
                    } else {
                        _this.empty();
                    }
                },
                function () {
                    _this.empty();
                }
            );
        },

        /* ===================== PLAYER ===================== */

        loadPlayer: function (url, fallback) {
            var _this = this;

            Lampa.Reguest.silent(
                url,
                function (html) {
                    var match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/);

                    if (!match) {
                        fallback.call(_this);
                        return;
                    }

                    _this.render(match[1]);
                },
                function () {
                    fallback.call(_this);
                }
            );
        },

        render: function (stream) {
            var title = this.movie.title;

            var card = Lampa.Template.get('online_mod', {
                title: title,
                quality: 'Full HD'
            });

            card.on('hover:enter', function () {
                Lampa.Player.play({
                    title: title,
                    url: stream,
                    quality: {
                        'Full HD': stream
                    }
                });
            });

            this.scroll.append(card);
            this.activity.toggle();
        },

        empty: function () {
            this.html.append(Lampa.Template.get('list_empty', {
                title: 'Української версії не знайдено'
            }));
            this.activity.toggle();
        }
    };

    /* ===================== REGISTER ===================== */

    Lampa.Component.add('ua_films', component);
    component.init(); // 🔥 КРИТИЧНО ВАЖЛИВО

    /* ===================== BUTTON ===================== */

    Lampa.Listener.follow('full', function (e) {
        if (e.type !== 'open') return;

        var btn = $('<div class="full-start__button selector"><span>Дивитись українською</span></div>');

        btn.on('hover:enter', function () {
            Lampa.Activity.push({
                component: 'ua_films',
                movie: e.object.movie
            });
        });

        e.body
            .find('.full-start__actions, .full-start__buttons')
            .first()
            .append(btn);
    });

})();
