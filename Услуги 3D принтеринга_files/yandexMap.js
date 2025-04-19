var yandexMapLoader = {
    queue: [],
    apiKey: '',
    executeWhenLoaded: function(params){
        this.queue.push(params);
        if(this.status < 1){
            this.onDomReady();
        }
    },
    status: 0,
    onDomReady: function(){
        var that = this;
        this.status = 1;
        setTimeout(that.startLoading.bind(that), 10);
    },
    startLoading: function(){
        var mapsLangCode = LPG.LOCALE === 'ru' ? 'ru-RU' : 'en-US';
        this.status = 2;
        window.yandexLoaded = function(){
            yandexMapLoader.successfullyLoaded();
            delete window.yandexLoaded;
        };
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//api-maps.yandex.ru/2.0-stable/?load=package.full' +
            '&lang=' + mapsLangCode +
            (this.apiKey ? '&apikey=' + this.apiKey : '') +
            '&onload=yandexLoaded';
		// console.info('YANDEX MAP:', script);
        document.body.appendChild(script);
    },
    successfullyLoaded: function(){
        this.status = 3;
        while(this.queue.length){
            var item = this.queue.pop();
            item[0].render(item[1], item[2], item[3], item[4]);
            delete item;
        }
    }
};

var yandexMap = {
    name: 'yandex',
    render: function (el, coords, zoom, apiKey, isRefresh) {
        if ( typeof apiKey !== 'undefined' ) {
            yandexMapLoader.apiKey = apiKey;
        }
        if ( !window.ymaps || !window.ymaps.Map || isRefresh ) {
            if ( isRefresh ) { yandexMapLoader.status = 0; }
            yandexMapLoader.executeWhenLoaded([this, el, coords, zoom, apiKey]);
            return;
        }
        this.id = el;
        this.map = new ymaps.Map(document.getElementById(el), {
            center: coords,
            zoom: zoom
        });

        this.addMarker(coords);

        this.map.controls
            .add('zoomControl', { left: 5, top: 5 })
            .add('typeSelector');

        /*var myPlacemark = new ymaps.Placemark(coords, {
            balloonContentHeader: 'Однажды',
            balloonContentBody: 'В студёную зимнюю пору',
            balloonContentFooter: 'Мы пошли в гору',
            hintContent: 'Зимние происшествия'
        });*/

    },

    updateCoords: function(coords){
        if(!this.map){
            return;
        }
        this.addMarker(coords);
        this.map.setCenter(coords);
    },
    addMarker: function(coords){
        if(this.marker){
            this.map.geoObjects.remove(this.marker);
            delete this.marker;
        }
        this.marker = new ymaps.GeoObject({
            geometry: {
                type: 'Point',
                coordinates : coords
            }
        });
        this.map.geoObjects.add(this.marker);
    },
    updateZoom: function(zoom){
        if(!this.map){
            return;
        }
        this.map.setZoom(zoom);
    },
    destroy: function(){
        if(!this.map){
            return;
        }
        this.map.destroy();

        delete this.map;
        delete this.id;
    },
    getCoords: function(address, callback){
        var that = this;
        if(!ymaps.geocode){
            setTimeout(function(){
                that.getCoords(address, callback);
            }, 200);
            return;
        }
        var myGeocoder = ymaps.geocode(address, {json: true});
        myGeocoder.then(
            function (res) {
                if(res.GeoObjectCollection.featureMember.length > 0){
                    var coords = res.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ');
                    coords[0] = parseFloat(coords[0]);
                    coords[1] = parseFloat(coords[1]);
                    callback([coords[1], coords[0]]);
                } else{
                    console.log('yandex map empty results');
                }
            },
            function (err) {
                console.log('yandex map error');
            }
        );
    }
};

try{
module.exports = yandexMap;
} catch(e){

}
