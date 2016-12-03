$(document).ready(function(){
  $('#categoryDropdown').on('change', function() {
    if (this.value == 'Artist')
    {
      $('#pac-input').hide();
      $('#artistSearch').show();
    }
    else
    {
      $('#artistSearch').hide();
      $('#pac-input').show();
      $('#artistSearch').val(''); //empty the input field so that autocomplete map loads
      initAutocomplete(); //load autocomplete map
    }
  });

  $('#find').click(function(e){
    e.preventDefault();
    var artistName = $('#artistSearch').val();
    if (artistName != "")
    {
        /* get attraction ID from artistName */
      $.ajax({
      type:"GET",
      url:"https://app.ticketmaster.com/discovery/v2/attractions.json?apikey=VsVdNmwCso1hURORRbFKWLca5sLcAemO&keyword="+artistName,
      // async:true,
      dataType: "json",
      success: function(json) {
        console.log(json);
        for (var i = 0; i < json.page.totalElements; i++)
        {
          if (json._embedded.attractions[i].name == artistName)
          {
            attractionID = json._embedded.attractions[i].id;
            break;
          }
        } 

        /* get events with attraction(artist) ID */
        $.ajax({
        type: "GET",
        url: "https://app.ticketmaster.com/discovery/v2/events.json?apikey=VsVdNmwCso1hURORRbFKWLca5sLcAemO&attractionId="+attractionID+ "&size="+500,
        // async:true,
        dataType: "json",
        success: function(json) {
                console.log(json);
                // var e = document.getElementById("events");
                // e.innerHTML = json.page.totalElements + " events found.";
                // showEvents(json);
                initMap(json);
                
        },
        error: function(xhr, status, err) {
            console.log(err);
        }
        });
      },
      error: function(xhr, status, err) {
        console.log(err);
      }
      });
    }
  });
});

 /** Draw Map on Load **/
  function initAutocomplete() {
        var map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 38, lng: -97},
          zoom: 4,
          mapTypeId: 'roadmap'
        });

        // Create the search box and link it to the UI element. But allow searchbox to be outside map
        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
          searchBox.setBounds(map.getBounds());
        });

        var markers = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          // Clear out the old markers.
          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          markers = [];

          // For each place, get the icon, name and location.
          var bounds = new google.maps.LatLngBounds();
          places.forEach(function(place) {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }
            var icon = {
              url: place.icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
              map: map,
              icon: icon,
              title: place.name,
              position: place.geometry.location
            }));

            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
      });
          map.fitBounds(bounds);
      });
    };


/** initMap for artist search **/
function initMap(json){
  var mapDiv = document.getElementById('map');
  var map = new google.maps.Map(mapDiv, {
    // center: {lat: position.coords.latitude, lng: position.coords.longitude},
    center: new google.maps.LatLng(38, -97),
    zoom: 4
  });
  for(var i=0; i<json.page.totalElements; i++) {
    addMarker(map, json._embedded.events[i]);
  }
};

function addMarker(map, event) {
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(event._embedded.venues[0].location.latitude, event._embedded.venues[0].location.longitude),
    map: map
  });
  marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
  console.log(marker);
};