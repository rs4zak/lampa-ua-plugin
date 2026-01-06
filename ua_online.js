(function () {
    'use strict';

    if (window.ua_plugin_loaded) return;
    window.ua_plugin_loaded = true;

    // Створюємо функцію пошуку
    function UAComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        
        this.create = function () {
            var _this = this;
            var title = object.movie.title;
            
            // Створюємо порожню картку-посилання на пошук
            var card = Lampa.Template.get('online_mod', {
                title: 'Шукати "' + title + '" на UA ресурсах',
                quality: 'UA'
            });

            card.on('hover:enter', function () {
                // При натисканні відкриваємо зовнішній пошук або плеєр
                Lampa.Select.show({
                    title: 'Виберіть джерело',
                    items: [
                        {title: 'UAKino (Онлайн)', source: 'uakino'},
                        {title: 'UAseriali (Онлайн)', source: 'uaseriali'}
                    ],
                    onSelect: function(item){
                        Lampa.Noty.show('Пошук на ' + item.title + ' запущено');
                        // Тут можна додати перехід на конкретний сайт
                    }
                });
            });

            scroll.append(card);
            return scroll.render();
        };
    }

    // Додаємо кнопку безпосередньо в інтерфейс
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite' || e.type == 'open') {
            // Перевіряємо чи вже є кнопка, щоб не дублювати
            if (e.body.find('.view--ua-online').length > 0) return;

            var btn = $('<div class="full-start__button selector view--ua-online"><span>Дивитись UA</span></div>');
            
            btn.on('hover:enter', function () {
                Lampa.Component.add('ua_plugin', UAComponent);
                Lampa.Activity.push({
                    title: 'Українською',
                    component: 'ua_plugin',
                    movie: e.object.movie
                });
            });

            // Додаємо в початок списку кнопок
            e.body.find('.full-start__actions').prepend(btn);
        }
    });
})();
