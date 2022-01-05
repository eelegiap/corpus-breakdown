
// set the dimensions and margins of the graph
var margin = { top: 30, right: 200, bottom: 10, left: 50 },
  width = 1000 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("all_data.csv", function (original_data) {

  // filter data
  var keyword = d3.select("#lemma").property("value")

  var data = original_data.filter(function (datum) {
    var sgform = datum.Dataset.replaceAll('_Sing', '')
    var plform = datum.Dataset.replaceAll('_Plur', '')
    var wordform = datum.Dataset.replaceAll('_Both', '')
    return (sgform == keyword) || (plform == keyword) || (wordform == keyword) || (datum.Dataset == 'Average')
  })

  var domain = ['Average', keyword + '_Sing', keyword + '_Plur', keyword + '_Both']
  // Color scale: give me a specie name, I return a color
  // var color = d3.scaleOrdinal()
  //   .domain(domain)
  //   .range(['black', '#FFD700', '#00BFFF', 'lightgreen'])

  // Here I set the list of dimension manually to control the order of axis:
  dimensions = ['Nom', 'Acc', 'Gen', 'Loc', 'Dat', 'Ins']



  // For each dimension, I build a linear scale. I store all in a y object
  var y = {}
  for (i in dimensions) {
    name = dimensions[i]
    y[name] = d3.scaleLinear()
      .domain([0, 1]) // --> Same axis range for each group
      // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
      .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  x = d3.scalePoint()
    .range([0, width])
    .domain(dimensions);


  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function path(d) {
    return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
  }

  // Draw the axis:
  svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    .attr("class", "axis")
    // I translate this element to its right position on the x axis
    .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function (d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
    // Add axis title
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(function (d) { return d; })
    .style("fill", "black")
    .style('font-size', 18)

  d3.select('#submit').on('click', function () {
    var newKeyword = d3.select('#lemma').property("value")
    update(newKeyword)
  })

  update(keyword)

  // Get the input field
  var input = document.getElementById("lemma");

  // Execute a function when the user releases a key on the keyboard
  input.addEventListener("keyup", function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.key == 'Enter') {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      update(d3.select('#lemma').property("value"))
    }
  });


  // UPDATE UPDATE UPDATE
  function update(keyword) {
    var newdata = original_data.filter(function (datum) {
      var sgform = datum.Dataset.replaceAll('_Sing', '')
      var plform = datum.Dataset.replaceAll('_Plur', '')
      var wordform = datum.Dataset.replaceAll('_Both', '')
      return (sgform == keyword) || (plform == keyword) || (wordform == keyword) || (datum.Dataset == 'Average')
    })
    console.log('newdata', newdata)
    var newdomain = ['Average', keyword + '_Sing', keyword + '_Plur', keyword + '_Both']

    // Color scale: give me a specie name, I return a color
    var color = d3.scaleOrdinal()
      .domain(newdomain)
      .range(['black', '#FFD700', '#00BFFF', 'lightgreen'])

    d3.selectAll('path.line').transition().duration(800).style('stroke', 'transparent').remove()
    // Highlight the specie that is hovered
    var highlight = function (d) {

      selected_dataset = d.Dataset

      // first every group turns grey
      d3.selectAll(".line")
        .transition().duration(200)
        .style("stroke", "lightgrey")
        .style("opacity", "0.2")
      // Second the hovered specie takes its color
      d3.selectAll("." + selected_dataset)
        .transition().duration(200)
        .style("stroke", color(selected_dataset))
        .style("opacity", "1")
    }

    // Highlight the specie that is hovered
    var highlight = function (d) {

      selected_dataset = d.Dataset

      // first every group turns grey
      d3.selectAll(".line")
        .transition().duration(200)
        .style("stroke", "lightgrey")
        .style("opacity", "0.2")
      // Second the hovered specie takes its color
      d3.selectAll("." + selected_dataset)
        .transition().duration(200)
        .style("stroke", color(selected_dataset))
        .style("opacity", "1")
    }

    // Unhighlight
    var doNotHighlight = function (d) {
      d3.selectAll(".line")
        .transition().duration(200).delay(1000)
        .style("stroke", function (d) { return (color(d.Dataset)) })
        .style("opacity", "1")
    }

    // add PATHS
    svg
      .selectAll("myPath")
      .data(newdata)
      .enter()
      .append("path")
      .attr("class", function (d) { return "line " + d.Dataset }) // 2 class for each line: 'line' and the group name
      .attr('id', d => d.Dataset)
      .attr("d", path)
      .style("fill", "none")
      .style("stroke", function (d) { return (color(d.Dataset)) })
      .style('stroke-width', function (d) {
        if (d.Dataset.includes('Both')) {
          return 1
        }; return 3
      })
      .style("opacity", 0)
      .on("mouseover", highlight)
      .on("mouseleave", doNotHighlight)
      .transition()
      .duration(800)
      .style('opacity', 1)

    d3.selectAll('.legend').remove()

    // Handmade legend
    newdomain.forEach(function (cat, i) {
      svg.append("circle").attr('class', 'legend legend_' + cat).attr("cx", width + 20).attr("cy", 160 + i * 30)
        .attr("r", 6).style("fill", color(cat))
      svg.append("text").attr('class', 'legend legend_' + cat).attr("x", width + 30).attr("y", 160 + i * 30).text(cat)
        .style("font-size", "15px").attr("alignment-baseline", "middle")
    })

    // on LEGEND hover
    d3.selectAll('.legend').on('mouseover', function () {
      var legendClass = d3.select(this).attr('class')
      var dataset = legendClass.split(' ')[1].replaceAll('legend_', '')
      d3.selectAll('path.line').each(function () {
        var pathDataset = d3.select(this).attr('class').split(' ')[1]
        if (dataset !== pathDataset) {
          d3.select('#' + pathDataset).transition().style('opacity', .1)
        }
      })
    }).on('mouseout', function () {
      d3.selectAll('path.line').each(function () {
        d3.select(this).transition().style('opacity', 1)
      })
    })

    // on PATH hover 
    d3.selectAll('path.line').on('mouseover', function () {
      var pathID = d3.select(this).attr('id')
      d3.selectAll('.legend').each(function () {
        var legDataset = d3.select(this).attr('class').split(' ')[1]
        if ('legend_' + pathID !== legDataset) {
          d3.selectAll('.' + legDataset).transition().style('opacity', .1)
        }
      })
    }).on('mouseout', function () {
      d3.selectAll('.legend').each(function () {
        d3.select(this).transition().style('opacity', 1)
      })
    })




  }
})