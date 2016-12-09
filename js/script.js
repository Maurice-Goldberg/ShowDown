
var inputDate;
var attractionID;

// ============= ANGULAR =============
var app = angular.module('showDown', []);
app.controller('showDownController', ['$scope', '$http', '$compile',  function($scope, $http, $compile) {

  $scope.category = 'City';

  $scope.changeOptionSelected = function(){
    console.log('changing selected option.');
  };
  $scope.dateChange = function() {
    console.log('date');
  }; 

  $scope.save = function(){
    var id = selectedMarker['id'];
    localStorage.setItem(String(id), JSON.stringify(selectedMarker));
    alert("Show successfully saved.");
  }; 

  $scope.clearSaved = function(){
    localStorage.clear();
    alert("Saved shows cleared.");
  };

  $scope.seeSavedShows = function(){

    var event = 0;
    eventList = []; 

    for(var i in localStorage){
      event = JSON.parse(localStorage[i]); 
      eventList.push(event);
    }

    if(eventList.length == 0){
      alert("No shows saved silly.");
    }
    else{
      var mapDiv = document.getElementById('map');
      var map = new google.maps.Map(mapDiv, {
        center: new google.maps.LatLng(38, -97),
        zoom: 4
      });
      for(var i = 0; i < eventList.length; i++){
        event = eventList[i];
        addMarker(map, event);

      }
    }

  }; 

}]);

// GLOBAL VARIABLES BELOW
var selectedMarker = 0;

// this array will hold all the audio objects
var audioVariables = [];
for(var i = 0; i < 200; i++){
  audioVariables.push(0);
}
// current_global keeps track of the latest variable slot in the array above that's been used to hold an audio object
var current_global = 0; 

// Goes through all the players and pauses them
var stopPlayers = function() {
  for(var i = 0; i < 200; i++){
    if(audioVariables[i] != 0){
      audioVariables[i].pause(); 
    }
  }
}; 

// ============= SPOTIFY FUNCTIONS =============
// Gets top tracks for artist ID, then appends players
var searchForTopTracks = function (artistID) {

  $.ajax({
        url: 'https://api.spotify.com/v1/artists/' + artistID + '/top-tracks',
        data: {
            country: 'US',
        },
        success: function (response) {
            // this is the local 'current' variable for audio that this new button will refer to
            var curr = current_global;

            // Get artist, album, and track info from response
            var artist = response['tracks'][0]['artists'][0]['name']
            var album = response['tracks'][0]['album']['name']
            var track = response['tracks'][0]['name']

            var audioInfo = "<font color='white'> Artist: " + artist + ", Album: " + album + ", Track: " + track + "</font><br>"

            audioVariables[current_global] = new Audio();
            audioVariables[current_global].src = response['tracks'][0]['preview_url']

            current_global++; 

            var audioButton = document.createElement("button");
            audioButton.className = "btn btn-primary"
            audioButton.innerHTML = "<span class='glyphicon glyphicon-play'></span>"
            audioButton.onclick = function() { 
                if(!audioVariables[curr].paused) {
                audioVariables[curr].pause();
                audioButton.innerHTML = "<span class='glyphicon glyphicon-play'></span>"
              }
              else{
                audioVariables[curr].play();
                audioButton.innerHTML = "<span class='glyphicon glyphicon-pause'></span>"
              }
            };

            $('#musicPlayer').append(audioInfo);
            $('#musicPlayer').append(audioButton);
            $('#musicPlayer').append("<hr>");

        }
    });

}; 

// Searches for an artist on Spotify, returns that artist's ID 
var searchForArtist = function (query) {
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'artist'
        },
        success: function (response) { 
            searchForTopTracks(String(response['artists']['items'][0]['id']));
        }
    });
};

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




/** if pressed enter on venue input field **/
  $('#pac-input').keypress(function (e) {
    var key = e.which;
    if(key == 13)  // the enter key code
    {
      e.preventDefault();
      var venueName = $('#pac-input').val();

      if (venueName != "") //if searching for an artist
      {
          /* get venue ID from artistName */
        $.ajax({
        type:"GET",
        url:"https://app.ticketmaster.com/discovery/v2/venues.json?apikey=VsVdNmwCso1hURORRbFKWLca5sLcAemO&keyword="
        +venueName + "&size="+500,
        // async:true,
        dataType: "json",
        success: function(json) {

          console.log(json); //testing
          for (var i = 0; i < json.page.totalElements; i++)
          {
            if (json._embedded.venues[i].name == venueName)
            {
              venueID = json._embedded.venues[i].id;
              break;
            }
          } 

          if (venueID != undefined) //valid artist name input
          {
            var todayDate = getCurrentDate();
            /* get events with venue ID */
            $.ajax({
            type: "GET",
            url: "https://app.ticketmaster.com/discovery/v2/events.json?apikey=VsVdNmwCso1hURORRbFKWLca5sLcAemO&venueId="+
            venueID+ "&size="+500 + "&startDateTime="+todayDate+"T00:00:00Z", //add end date
            // async:true,
            dataType: "json",
            success: function(json) {
              console.log(json);
              initMap(json);
              venueID = undefined;
              //some sort of drawLines(json) function should be called here
            },
            error: function(xhr, status, err) {
              console.log(err);
            }
            });
          }
          else //invalid artist name input
          {
            alert("Please input a valid venue name.");
          }          
          
        }, 
        error: function(xhr, status, err) {
          console.log(err);
        }
        });
      }
    }
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

  // marker clicked 
  google.maps.event.addListener(marker, 'click', function() {

    selectedMarker = event;

    // Delete previous music players
    $('#musicPlayer').empty();

    // Stop currently playing players from previous search
    stopPlayers(); 

    //console.log(event._embedded.venues[0].address.line1); //testing

    //console.log('EVENT INFO BELO')
    console.log(event['_embedded']['attractions'][0]['name'])
    console.log(event)

    var artists = [];
    var attractions = event['_embedded']['attractions'];
    for(var i = 0; i < attractions.length; i++){
      var attraction = attractions[i];
      artists.push(attraction['name'])
    }

    console.log(artists)

    for(var i = 0; i < artists.length; i++){
      searchForArtist(artists[i]);
    }

    //show sideBar element if it's hidden
    if($('#sideBar').hasClass('hidden')) {

      //remove 'hidden' class (i.e. show element)
      $('#sideBar').removeClass('hidden');
      
      //fadeIn element
      $('#sideBar').fadeIn('fast');
    }

    if (event._embedded.venues[0].name != undefined) //error handling
    {
      var request = {
      query: event._embedded.venues[0].address.line1 + " " 
      +event._embedded.venues[0].city.name+ " "
      +event._embedded.venues[0].country.name+" "
      +event._embedded.venues[0].name //info from TM API
      };
    }
    else
    {
      var request = {
      query: event._embedded.venues[0].address.line1 + " " 
      +event._embedded.venues[0].city.name+ " "
      +event._embedded.venues[0].country.name//info from TM API
      };
    }
    
    var service = new google.maps.places.PlacesService(map);

    //get placeId and call place details api 
    service.textSearch(request, function(results, status){

      //display event name from TM api
      $('#eventName').text(event.name); 

      //event date & time in Universal Time Coordinated
      $('#eventTime').text('Datetime: '+ event.dates.start.dateTime); 

      if($('#sideBar').has("#ticketLink")) { 
        $('#ticketLink').remove();
      }
      //display ticket link from TM api
      $('#venueWebsite').append("<p id='ticketLink'> Buy a <a href=\"" + event.url + "\" target='_blank'>Ticket</a>! </p>");


      if (results.length != 0) //error handling
      {
        service.getDetails({'placeId': results[0].place_id}, function(results, status){
       
        if (results.photos != undefined)
        {
          $('img#venuePhoto').attr('src', results.photos[0].getUrl({
            'maxWidth': 200,
            'maxHeight': 500
          }));
        }
        

        //results.name for venue name (sometimes just an address)
        $('#venueName').text('Venue: ' + results.name);
          
        //results.formatted_address for venue address
        $('#venueAddress').text('Address: ' + results.formatted_address);

        //phone number
        $('#venuePhone').text(results.formatted_phone_number);
        });
      }

      else 
      //if google places can't find location details, display location info from ticketmaster
      {
        //photo
        $('img#venuePhoto').attr('src','band.ico');
        //venue name
        $('#venueName').text('Venue: ' + event._embedded.venues[0].name); 
        //address
        $('#venueAddress').text('Address: ' + event._embedded.venues[0].address.line1 
          + ", " + event._embedded.venues[0].city.name+ ", "+event._embedded.venues[0].country.name);      
        //phone number
        if (event._embedded.venues[0].boxOfficeInfo != undefined)
        {
          $('#venuePhone').text(event._embedded.venues[0].boxOfficeInfo.phoneNumberDetail); 
        }
        else
        {
          $('#venuePhone').text('');
        }
      }
      
    });
   }); // end of click event


};






function addMarker2(map, event) {
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(event._embedded.venues[0].location.latitude, event._embedded.venues[0].location.longitude),
    map: map
  });
  marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');

  // marker clicked 
  google.maps.event.addListener(marker, 'click', function() {

    selectedMarker = event;

    // Delete previous music players
    $('#musicPlayer').empty();

    // Stop currently playing players from previous search
    stopPlayers(); 

    //console.log(event._embedded.venues[0].address.line1); //testing

    //console.log('EVENT INFO BELO')
    console.log(event['_embedded']['venues'][0]['name'])
    console.log(event)

    var venues = [];
    var venues = event['_embedded']['venues'];
    for(var i = 0; i < venues.length; i++){
      var venue = venues[i];
      venues.push(venue['name'])
    }

    console.log(venues)

    /*for(var i = 0; i < artists.length; i++){
      searchForArtist(artists[i]);
    }*/

    //show sideBar element if it's hidden
    if($('#sideBar').hasClass('hidden')) {

      //remove 'hidden' class (i.e. show element)
      $('#sideBar').removeClass('hidden');
      
      //fadeIn element
      $('#sideBar').fadeIn('fast');
    }

    if (event._embedded.venues[0].name != undefined) //error handling
    {
      var request = {
      query: event._embedded.venues[0].address.line1 + " " 
      +event._embedded.venues[0].city.name+ " "
      +event._embedded.venues[0].country.name+" "
      +event._embedded.venues[0].name //info from TM API
      };
    }
    else
    {
      var request = {
      query: event._embedded.venues[0].address.line1 + " " 
      +event._embedded.venues[0].city.name+ " "
      +event._embedded.venues[0].country.name//info from TM API
      };
    }
    
    var service = new google.maps.places.PlacesService(map);

    //get placeId and call place details api 
    service.textSearch(request, function(results, status){

      //display event name from TM api
      $('#eventName').text(event.name); 

      //event date & time in Universal Time Coordinated
      $('#eventTime').text('Datetime: '+ event.dates.start.dateTime); 

      if($('#sideBar').has("#ticketLink")) { 
        $('#ticketLink').remove();
      }
      //display ticket link from TM api
      $('#venueWebsite').append("<p id='ticketLink'> Buy a <a href=\"" + event.url + "\" target='_blank'>Ticket</a>! </p>");


      if (results.length != 0) //error handling
      {
        service.getDetails({'placeId': results[0].place_id}, function(results, status){
       
        if (results.photos != undefined)
        {
          $('img#venuePhoto').attr('src', results.photos[0].getUrl({
            'maxWidth': 200,
            'maxHeight': 500
          }));
        }
        

        //results.name for venue name (sometimes just an address)
        $('#venueName').text('Venue: ' + results.name);
          
        //results.formatted_address for venue address
        $('#venueAddress').text('Address: ' + results.formatted_address);

        //phone number
        $('#venuePhone').text(results.formatted_phone_number);
        });
      }

      else 
      //if google places can't find location details, display location info from ticketmaster
      {
        //photo
        $('img#venuePhoto').attr('src','band.ico');
        //venue name
        $('#venueName').text('Venue: ' + event._embedded.venues[0].name); 
        //address
        $('#venueAddress').text('Address: ' + event._embedded.venues[0].address.line1 
          + ", " + event._embedded.venues[0].city.name+ ", "+event._embedded.venues[0].country.name);      
        //phone number
        if (event._embedded.venues[0].boxOfficeInfo != undefined)
        {
          $('#venuePhone').text(event._embedded.venues[0].boxOfficeInfo.phoneNumberDetail); 
        }
        else
        {
          $('#venuePhone').text('');
        }
      }
      
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

















