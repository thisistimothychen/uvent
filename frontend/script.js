$(document).ready(function(){
  // the "href" attribute of the modal trigger must specify the modal ID that wants to be triggered
  $('.modal').modal();
});

$('.datepicker').pickadate({
  selectMonths: true, // Creates a dropdown to control month
  selectYears: 15, // Creates a dropdown of 15 years to control year,
  today: 'Today',
  clear: 'Clear',
  close: 'Ok',
  closeOnSelect: false // Close upon selecting a date,
});

$('.timepicker').pickatime({
  default: 'now', // Set default time: 'now', '1:30AM', '16:30'
  fromnow: 0,       // set default time to * milliseconds from now (using with default = 'now')
  twelvehour: false, // Use AM/PM or 24-hour format
  donetext: 'OK', // text for done-button
  cleartext: 'Clear', // text for clear-button
  canceltext: 'Cancel', // Text for cancel-button
  autoclose: false, // automatic close timepicker
  ampmclickable: true, // make AM PM clickable
  aftershow: function(){} //Function for after opening timepicker
});

var getPrettyDate = function(date) {
    // var strArray=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // var d = date.getDate();
    // var m = strArray[date.getMonth()];
    // var y = date.getFullYear();
    // return '' + m + ' ' + d + ', ' + y + ' ';
    var minutesStr = (date.getMinutes() == 0) ? '00' : date.getMinutes();
    return date.toDateString() + ', ' + date.getHours() + ':' + minutesStr;
}

var getEvents = function() {

  if (document.getElementById('eventCards').innerHTML == "") {
    console.log("Getting events...");
    var url = "https://8ifco0noyd.execute-api.us-east-1.amazonaws.com/prod/events?begin=" + (new Date()).toISOString().substring(0,19)+'Z' + "&end=";

    $.get(url, function(res, status) {
      console.log(res);

      for(var i = 0; i < res['Items'].length; i++) {
        const e = res['Items'][i];
        console.log(e);

        var eventCard = '<li class="collection-item">'
          + '<span class="title"><b>' + e['name'] + '</b></span>'
          + '<p><i>' + getPrettyDate(new Date(e['startDate'])) + '</i>' + '<br>'
          + e['location'] + ' --- ' + e['description'] + '<br>'
          + '</p>'

        $('#eventCards').append(eventCard);
      }

      $('#eventsModal').modal('open');
    });
  } else {
    console.log('Events already listed.');
    $('#eventsModal').modal('open');
  }

};

$('#createEventForm').submit(function(e) {
    // e.preventDefault(); // avoid to execute the actual submit of the form.
    var nameValue = document.getElementById("name").value;
    var locationValue = document.getElementById("location").value;
    var descriptionValue = document.getElementById("description").value;
    var categoriesValue = document.getElementById("categories").value;

    // Calculate start date
    var startDate = new Date(document.getElementById("startDate").value).toISOString().substring(0,19)+'Z';
    var startTime = document.getElementById("startTime").value;
    var startDatetime = new Date(startDate.substring(0,11) + startTime + 'Z');
    var offset = (new Date()).getTimezoneOffset()/60;   // current number of hours offset from UTC
    var offsetStartDatetime = new Date(startDatetime.getTime() + offset*3600*1000);
    var startDateValue = offsetStartDatetime.toISOString().substring(0,19)+'Z'

    // Calculate end date
    if (document.getElementById("endDate").value != "") {
      var endDate = new Date(document.getElementById("endDate").value).toISOString().substring(0,19)+'Z';
      var endTime = document.getElementById("endTime").value;
      var endDatetime = new Date(endDate.substring(0,11) + endTime + 'Z');
      var offset = (new Date()).getTimezoneOffset()/60;   // current number of hours offset from UTC
      var offsetEndDatetime = new Date(endDatetime.getTime() + offset*3600*1000);
      var endDateValue = offsetEndDatetime.toISOString().substring(0,19)+'Z';
    } else {
      var endDateValue = "";
    }

    data = {
      'operation': 'create',
      'payload': {
        'Item': {
          'name': nameValue,
          'description': descriptionValue,
          'location': locationValue,
          'categories': categoriesValue.split(','),
          'startDate': startDateValue,
          'endDate': endDateValue
        }
      }
    }

    var url = "https://8ifco0noyd.execute-api.us-east-1.amazonaws.com/prod/events";
    $.ajax({
      type: "POST",
      url: url,
      dataType: 'json',
      headers: {"Content-Type" : "application/json"},
      data: JSON.stringify(data),
      success: function(res) {
        console.log(res); // show response
      }
    });
});
