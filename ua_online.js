(function () {
    'use strict';

    // Використовуємо проксі для обходу блокувань на TV
    var proxy = 'https://corsproxy.io/?';

    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        
        this.create = function () {
            var _this = this;
            this.start();
            return this.render();
        };

        this.start = function () {
            var _this = this;
            // Шукаємо по назві фільму на UAKino (через проксі)
            var searchUrl = proxy + encodeURIComponent('https://uakino.me/index.php?do=search&subaction=search&story=' + object.movie.title);
            
            network.silent(searchUrl, function (html) {
                if (html) {
                    _this.parse(html);
                } else {
                    _this.empty();
                }
            }, function () {
                _this.empty();
            });
        };

        this.parse = function (html) {
            var _this = this;
            var dom = $(html);
            var results = dom.find('#dle-content .movie-item'); // Селектор для UAKino

            if (results.length > 0) {
                results.each(function () {
                    var link = $(this).find('a').attr('href');
                    var title = $(this).find('.movie-title').text() || object.movie.title;

                    var card = Lampa.Template.get('online_mod', {
                        title: title,
                        quality: 'UA'
                    });

                    card.on('hover:enter', function () {
                        // Відкриваємо сайт у плеєрі Lampa
                        Lampa.Player.play({
                            url: link, 
                            title: title
                        });
                    });
                    scroll.append(card);
                });
            } else {
                this.empty();
            }
            this.activity.toggle();
        };

        this.empty = function () {
            scroll.append(Lampa.Template.get('list_empty'));
        };

        this.render = function () {
            return scroll.render();
        };
    }

    // Реєстрація кнопки в картці фільму
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            var btn = $('<div class="full-start__button selector"><span>Дивитись UA</span></div>');
            btn.on('hover:enter', function () {
                Lampa.Component.add('ua_online', UAOnline);
                Lampa.Activity.push({
                    title: 'Українською',
                    component: 'ua_online',
                    movie: e.object.movie
                });
            });
            e.body.find('.full-start__actions').append(btn);
        }
    });
})();
