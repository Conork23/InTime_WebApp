var stats = {

  // initialise front end js
  init: function(data, results){
    var self = this;
      this.accuracyGraph(data, results);
      this.autoSuggestions();

      //init main graph
      var PieChart;
      $.get("../stats/ajax", function(data, status){
          PieChart = self.setMainGraph(data);
      });

      //button binding
      $("button.checkBtn").click(function(){
        var to = $('.to-input input.tt-input').val();
        var from = $('.from-input input.tt-input').val();
          $.get("../stats/ajax?to="+to+"&from="+from, function(data, status){
              self.updateGraph(data, PieChart);
          });
      });



  },

  // Set Accuracy Graph
  accuracyGraph: function(data, results){
    var dataArray = data.all;
    var dates = results.reverse();
    var lables = [];
    for(var i = 0; i<dataArray.length; i++){
      date = dates[i].time.substring(0, 10);
      year = date.substring(2,4);
      month = date.substring(5,7);
      day = date.substring(8,10);
      lable = day+'/'+month+'/'+year;
      lables[i] = lable;
    }

    var data = {
			    labels: lables,
			    datasets: [
			       			 {
				            label: "Accuracy",
				            data: dataArray,
                    backgroundColor: 'rgba(22, 24, 254, 0.5)',
                    borderColor: 'rgba(22,24,254,1)',
                    borderWidth: 1
   								 }
   							  ]
				};


    var ctx = $("#accuracy_graph");
    var myBarChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  }
              }]
          }
        }
    });
  },

  // Auto Suggestions for 'to and 'from' Search bars
  autoSuggestions:function(){

    $('.from-input .typeahead').typeahead({highlight: true, minLength: 1, limit:10},{
      source: function (query, process) {
                return $.get('../stats/ajax?distinct=true&from='+query , function (data) {
                    return process(data);
              });
      },
      templates: {
        empty: '<div class="empty-message">No matches.</div>'
      }
    });

    $('.to-input .typeahead').typeahead({  highlight: true, minLength: 1,limit: 10},{
        name: 'to',
        source: function (query, process) {
                  return $.get('../stats/ajax?distinct=true&to='+query , function (data) {
                      return process(data);
                });
        },
        templates: {
          empty: '<div class="empty-message">No matches.</div>'
        }
    });

  },

  //Setting the main pie chart for the first time
  setMainGraph: function(data){
    var total  = data.length;
    var arrived = 0;

    for(var i = 0; i<total; i++){
      if(data[i].arrivedOnTime){
        arrived += 1;
      }
    }

    var didntArrive = total - arrived;

    var data = {
    labels: [
        "Arrived In Time",
        "Didn't Arrive In Time",
    ],
    datasets: [
        {
            data: [arrived, didntArrive],
            backgroundColor: [
                'rgba(22, 24, 254, 0.5)',
                'rgba(254, 24, 22, 0.5)'
            ],
            hoverBackgroundColor: [
                'rgba(22, 24, 254, .65)',
                'rgba(254, 24, 22, .65)'
            ]
        }]
      };



    var options = {
      responsive: true,
      animation:{
        animateScale:true
      },
      legend: {
            display: true,
            labels: {
                fontColor: 'rgb(255, 255, 255)'
            }
        }
    }
    $("#main-graph").remove();
    $(".main-graph").append('<canvas id="main-graph"></canvas>');
    var ctx = $("#main-graph");
    var myPieChart = new Chart(ctx,{
      type: 'pie',
      data: data,
      options: options
    });
      return myPieChart;
    },

  // Update the graph with user choosen locations
  updateGraph: function(data,PieChart){
    var total  = data.length;
    var arrived = 0;

    for(var i = 0; i<total; i++){
      if(data[i].arrivedOnTime){
        arrived += 1;
      }
    }

    var didntArrive = total - arrived;


    PieChart.chart.config.data.datasets[0].data = [arrived, didntArrive];
    PieChart.update();

  }

}

$(document).ready(function() {
    stats.init(data, results);
});
