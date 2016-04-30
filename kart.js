var skolekart = function(key){
    var directionsDisplay;
    var directionsService;
    //var resources;
    
    var jsonCoords = [];
    var schools = [];
    var searchUrl = "https://maps.googleapis.com/maps/api/geocode/json";
    var apiKey = key;
    var map;
    var overlays = [];

    var displayAlert = function(text){
        var div = $("#alertDiv");
        div.text(text);
        div.toggle();
    }

    var initMap = function(){
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 10,
            center: {lat: 60.170507, lng: 11.665829},
            mapTypeId: google.maps.MapTypeId.TERRAIN
        });

        loadPolygons();
        loadSchools(displaySchools);

        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
    };

    function displaySchools(schools){
        schools.forEach(function(school){
            var markerURL = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
            if(school.public === false){
                markerURL = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
            }

            var marker = new google.maps.Marker({
                position: {
                    lat:school.lat,
                    lng:school.lng
                },
                map: map,
                title: school.name
            });
            marker.setIcon(markerURL); 
        });
    }

    function loadPolygons(){
        $.ajax({
            url:"./polygons.json",
            dataType:"json",
            mimeType:"application/json",
            success:function(data){
                jsonCoords = data;
            }
        });
    }
    
    function loadSchools(callback){
        $.ajax({
            url:"./schools.json",
            dataType:"json",
            mimeType:"application/json",
            success:function(data){
                console.log(data);
                schools = data;
                callback(data);
            },
            error:function(e){
                console.log(e);
            }
        });
    }


    function parseSkoleKretsPolygon(){
        var polygons = [];
        var features = geojson_Skolekretspolygon.features;
        var kretsNavn = "";
            
        features.forEach(function(feature) {
            var path = {};
            path.name = feature.properties.SKRETS_SKR;

            var lines = [];
            var polygon = feature.geometry;
            var coords = polygon.coordinates[0];

            coords.forEach(function (coordinates) {
                var lat = coordinates[1];
                var lng = coordinates[0];

                var coord = {
                    "lng": lng,
                    "lat": lat
                };
                lines.push(coord);
            });
            path.lines = lines;
            polygons.push(path);
        });
        return polygons;
    }

    function clearMap(){
        overlays.forEach(function(overlay){
            overlay.setMap(null);
        });
        overlays = [];
    }

    function search() {
        clearMap();
        
        var address = $('#containerDiv > input[type=text]').val();
        var data = {
            'address':address,
            'key':apiKey
        };
        
        var request = $.get(searchUrl,data)
        .done(function(data){
            console.log(data);
            var pos = data.results[0].geometry.location;
            var marker = new google.maps.Marker({
                position: {
                    lat:pos.lat,
                    lng:pos.lng
                },
                map: map,
                title: address
            });
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            overlays.push(marker);
            map.setCenter(pos);
            map.setZoom(10);
            
            //var result = getPolygonForPoint(pos);
        })
        .fail(function(data){
            /*
            console.log(data);
            displayAlert("Det oppstod et problem");
            */
        });
    }

    function getPolygonForPoint(point) {
        var pos = new google.maps.LatLng(point.lat, point.lng);
        var kretsNavn = "";
        var foundPath = null;
        
        jsonCoords.some(function(path){
            var polygon = new google.maps.Polygon({paths: path.lines});
            
            if(google.maps.geometry.poly.containsLocation(pos, polygon)){
                foundPath = path;
                kretsNavn = path.name;
                return true;
        }
        });
        
        if( foundPath != null){
            var krets = new google.maps.Polygon({
                paths: foundPath.lines,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeWeight: 1,
                strokeOpacity: 0.8,
                fillColor:'#FF0000',
                fillOpacity:0.3
            });

            krets.setMap(map);
            overlays.push(krets);
        }
        else {
            console.log("not found");
        }
    }

    function init(){
        var topDiv = document.createElement('div');
        topDiv.id="kartroot";
        
        var mapDiv = document.createElement('div');
        mapDiv.id="map";
        
        var floatDiv = document.createElement('div');
        floatDiv.id="address_float";
        
        var alertDiv = document.createElement('div');
        alertDiv.id="alertDiv";
        
        var containerDiv = document.createElement('div');
        containerDiv.id = "containerDiv";
        
        var input = document.createElement('input');
        input.type="text";
        input.placeholder="Skriv inn adresse";
        input.onkeydown = function(event){
            if(event.key == "Enter"){
                search();
            }
        };
        
        var button = document.createElement('button');
        button.id="address_button";
        button.innerHTML = "Søk";
        button.onclick = search;

        containerDiv.appendChild(input);
        containerDiv.appendChild(button);
        
        floatDiv.appendChild(containerDiv);

        topDiv.appendChild(mapDiv);
        topDiv.appendChild(floatDiv);
        topDiv.appendChild(alertDiv);

        var kretsnode = document.getElementById("skolekrets");
        kretsnode.parentNode.insertBefore(topDiv,kretsnode);

        initMap();
    }
        
    window.onload = function(){
        console.log("onload");
        jqueryurl="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js";
        googleurl="https://maps.googleapis.com/maps/api/js?libraries=geometry&key="+apiKey;

        var script=document.createElement('script');
        script.type='text/javascript';
        script.src=jqueryurl;
        script.onload = function(){ 
            
            var googlescript = document.createElement('script');
            googlescript.type = 'text/javascript';
            googlescript.src = googleurl;
            googlescript.onload = function(){ init(); };
                
            document.body.appendChild(googlescript);
        };
            
        document.body.appendChild(script);
        
        
        
        var css = document.createElement('link');
        css.rel = "stylesheet";
        css.href = "./kart.css";
        
        document.head.appendChild(css);
    };
};