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

var getEvents = function() {
  console.log("Getting events...");
  var url = "https://8ifco0noyd.execute-api.us-east-1.amazonaws.com/prod/events?begin=" + (new Date()).toISOString().substring(0,19)+'Z' + "&end=";

  $.get(url, function(res, status) {
    console.log(res);
  });
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
