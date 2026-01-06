(function () {
    'use strict';

    if (window.ua_online_loaded) return;
    window.ua_online_loaded = true;

    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        
        this.create = function () {
            var _this = this;
            // Використовуємо універсальний API пошуку для українських ресурсів
            var url = 'https://cors.uamods.workers.dev/?url=' + encodeURIComponent('https://it-serv.xyz/lampa/search?title=' + object.movie.title);

            network.silent(url, function (data) {
                if (data && data.length > 0) {
                    data.forEach(function (item) {
                        var card = Lampa.Template.get('online_mod', {
                            title: item.title || object.movie.title,
                            quality: item.quality || 'HD'
                        });

                        card.on('hover:enter', function () {
                            Lampa.Player.play({
                                url: item.url,
                                title: item.title || object.movie.title
                            });
                        });
                        scroll.append(card);
                    });
                } else {
                    _this.empty();
                }
                _this.activity.toggle();
            }, function () {
                _this.empty();
            });

            return scroll.render();
        };

        this.empty = function () {
            scroll.append(Lampa.Template.get('list_empty'));
            this.activity.toggle();
        };
    }

    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite' || e.type == 'open') {
            if (e.body.find('.btn--ua-online').length > 0) return;

            var btn = $('<div class="full-start__button selector btn--ua-online"><span>Дивитись UA</span></div>');
            
            btn.on('hover:enter', function () {
                Lampa.Component.add('ua_online', UAOnline);
                Lampa.Activity.push({
                    title: 'Українською',
                    component: 'ua_online',
                    movie: e.object.movie
                });
            });

            e.body.find('.full-start__actions').prepend(btn);
        }
    });
})();
