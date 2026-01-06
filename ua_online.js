(function () {
    'use strict';

    Lampa.Platform.tv();

    function UAOnline(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');
        
        this.create = function () {
            var _this = this;
            this.start();
            return this.render();
        };

        this.start = function () {
            // Тут має бути логіка запиту до вашого проксі-сервера або API
            // Оскільки прямі запити до сайтів заблоковані CORS
            this.search();
        };

        this.search = function () {
            // Приклад відображення, що пошук йде
            this.showResults([
                {
                    title: "Пошук на ресурсах (UAKino, HDRezka...)",
                    quality: "HD",
                    url: "" 
                }
            ]);
        };

        this.showResults = function (data) {
            var _this = this;
            data.forEach(function (item) {
                var card = Lampa.Template.get('online_mod', item);
                card.on('hover:enter', function () {
                    Lampa.Player.play({
                        url: item.url,
                        title: object.movie.title
                    });
                });
                scroll.append(card);
            });
        };

        this.render = function () {
            return scroll.render();
        };
    }

    // Додавання кнопки "Дивитись UA" у картку фільму
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            var btn = $('<div class="full-start__button selector"><span>Дивитись UA</span></div>');
            btn.on('hover:enter', function () {
                Lampa.Component.add('ua_online', UAOnline);
                Lampa.Activity.push({
                    url: '',
                    title: 'Українською',
                    component: 'ua_online',
                    movie: e.object.movie,
                    page: 1
                });
            });
            e.body.find('.full-start__actions').append(btn);
        }
    });
})();
