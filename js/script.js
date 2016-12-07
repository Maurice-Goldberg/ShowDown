//https://developers.google.com/maps/documentation/javascript/examples/polyline-simple
var inputDate;
var attractionID;

$(document).ready(function(){

  $('#sideBar').hide();

  /** dropdown selection control **/
  $('#categoryDropdown').on('change', function() {
    if (this.value == 'Artist')
    {
      $('#pac-input').hide(); //hide autocomplete search box
      $('#calendarForm').hide(); //hide calendar
      $('#artistSearch').show();
    }
    else
    {
      $('#artistSearch').hide();
      $('#pac-input').show();
      $('#calendarForm').show();
      $('#artistSearch').val(''); //empty the input field so that autocomplete map loads
      initAutocomplete(); //load autocomplete map
    }
  });

  /** get data from calendar input **/
  $('input[type="date"]').change(function(){
        inputDate = this.value;
  });

  /** if pressed enter on artist input field **/
  $('#artistSearch').keypress(function (e) {
    var key = e.which;
    if(key == 13)  // the enter key code
    {
      e.preventDefault();
      var artistName = $('#artistSearch').val();
      if (artistName != "") //if searching for an artist
      {
          /* get attraction ID from artistName */
        $.ajax({
        type:"GET",
        url:"https://app.ticketmaster.com/discovery/v2/attractions.json?apikey=VsVdNmwCso1hURORRbFKWLca5sLcAemO&keyword="
        +artistName + "&size="+500,
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

          if (attractionID != undefined) //valid artist name input
          {
            var todayDate = getCurrentDate();
            /* get events with attraction(artist) ID */
            $.ajax({
            type: "GET",
            url: "https://app.ticketmaster.com/discovery/v2/events.json?apikey=VsVdNmwCso1hURORRbFKWLca5sLcAemO&attractionId="+
            attractionID+ "&size="+500 + "&startDateTime="+todayDate+"T00:00:00Z", //add end date
            // async:true,
            dataType: "json",
            success: function(json) {
              console.log(json);
              initMap(json);
              attractionID = undefined;
              //some sort of drawLines(json) function should be called here
            },
            error: function(xhr, status, err) {
              console.log(err);
            }
            });
          }
          else //invalid artist name input
          {
            alert("Please input a valid artist name.");
          }          
          
        }, 
        error: function(xhr, status, err) {
          console.log(err);
        }
        });
      }
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

  google.maps.event.addListener(marker, 'click', function() {
    console.log(event._embedded.venues[0].address.line1); //testing

    //show sideBar element if it's hidden
    if($('#sideBar').hasClass('hidden')) {

      //remove 'hidden' class (i.e. show element)
      $('#sideBar').removeClass('hidden');
      
      //fadeIn element
      $('#sideBar').fadeIn('fast');
    }

    var request = {
      query: event._embedded.venues[0].address.line1 + "" 
      + event._embedded.venues[0].state.name+ ""
      +event._embedded.venues[0].name//info from TM API
    };
    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function(results, status){
      console.log(results); //get placeId and call place details api 

      service.getDetails({'placeId': results[0].place_id}, function(results, status){
        console.log(results);
        /** display venue info **/

        //results.photos[0] for venue photo
        //getURL does not result in proper output and neither does html_attributions
        $('#venuePhoto').src = results.photos[0].getUrl;
        
        //results.name for venue name (sometimes just an address)
        $('#venueName').text(results.name);
          
        //results.formatted_address for venue address
        $('#venueAddress').text(results.formatted_address);

        //phone number
        $('#venuePhone').text(results.formatted_phone_number);

        //website
        if($('#sideBar').has("#venueLink")) {
          $('#venueLink').remove();
        }
        $('#venueWebsite').append("<a id=\"venueLink\" href=\"" + results.website + "\">" + results.website + "</a>");

        /*display event info (still need to figure this part out)*/
          //event name
          //artist name
          //date of event
          //time of event
          //link to tickets
        /** **/
      });
    });
   }); // end of click event


};


function getCurrentDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
      dd='0'+dd
  } 

  if(mm<10) {
      mm='0'+mm
  } 

  today = yyyy+'-'+mm+'-'+dd;
  return today;

};

