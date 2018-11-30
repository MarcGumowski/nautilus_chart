// nautilus_plot
//
// author : Marc Gumowski
// ver : 0.01


//
// main function
//
function nautilus_plot(div, index, mat, options) {

    //     div : id of the div to plot, '#div_name'
    //   index : id of the element to focus on, 'element_id'
    //     mat : matrix of values, basically list of arrays with this similar structure as:
    //           [{{index: 'a'}, {values: {b: 5}, {c: 3}, ...}}, {}, ...]
    // options : collection of parameters for configuration

    // initial options
    var cfg = {
    width: Math.min(1600, window.innerWidth - 20),
    height: Math.min(900, window.innerHeight - 10),
    margin: {top: 50, left: 50, right: 50, bottom: 50},
    inner_circle_radius: 20,
    outer_circle_radius: 2,
    ray_stroke_width: 2,
    center_position_x: 1/2,
    center_position_y: 1/2,
    center_title_height: 34,
    number_max_to_show: 30,
    select_scale: 10,
    number_format: '.2f',
    chart_color: 'black',
    text_color_blank: 'rgba(0, 0, 0, 0)',
    text_color: 'rgba(0, 0, 0, 1)',
    select_color: 'rgba(230, 0, 0, 1)',
    right_table_index: '#legend_container',
    right_table_cols: ['value', 'index'],
    left_table_index: '#control_container',
    tooltip_offset_x: 0,
    tooltip_offset_y: 550
    };

    // put all of the options into a variable called cfg
	if('undefined' !== typeof options){
	  for(var p in options){
		if('undefined' !== typeof options[p]){ cfg[p] = options[p]; }
	  }
	}

	// svg
	var svg = d3.select(div).append('svg')
        .attr('width', cfg.width)
        .attr('height', cfg.height);

    // div for tooltip
    var tooltip_div = d3.select(div).append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

    // select data
    var data = get_data(mat, index, cfg, cfg.number_max_to_show);

    // color
    var max_value = get_max_value(mat, 'value')
    var color = d3.scaleSequential(d3.interpolateRdYlGn)
        .domain([max_value, 0]);

    // center
    var center = svg.append('g')
        .datum(index)
        .attr('class', 'center')
        .on('mouseover', function(d) {
            tooltip_div.transition()
                .duration(0)
                .style('opacity', 1);
            tooltip_div.html('<b>' +  d3.selectAll('.center').datum() + '</b> ')
                .style('left', cfg.tooltip_offset_x + 'px')
                .style('top', cfg.tooltip_offset_y + 'px');
            d3.select(this).style('cursor', 'pointer');})
        .on('mouseout', function(d) {
            tooltip_div.transition()
                .duration(500)
                .style('opacity', 0);
            d3.select(this).style('cursor', 'default');})
        .on('click', function(d) {
            console.log(d);
            retract(cfg);});
    // center circle
    center.append('circle')
        .attr('cx', cfg.width * cfg.center_position_x)
        .attr('cy', cfg.height * cfg.center_position_y)
        .attr('r', cfg.inner_circle_radius);
    // center title
    center.append('text')
        .attr('x', cfg.width * cfg.center_position_x)
        .attr('y', cfg.center_title_height)
        .style('font-size', function(d) {return cfg.center_title_height + 'px';})
        .style('fill', cfg.text_color)
        .style("text-anchor", "middle")
        .text(function(d) { return d;});
    // shell
    var ray = svg.selectAll('.ray')
        .data(data)
        .enter().append('g')
        .attr('class', 'ray');
    // shell rays links
    ray.append('line')
        .attr('x1', function(d) { return d.x1_start;})
        .attr('x2', function(d) { return d.x1_start;})
        .attr('y1', function(d) { return d.y1_start;})
        .attr('y2', function(d) { return d.y1_start;})
        .style('stroke-width', cfg.ray_stroke_width)
        .style('stroke', function(d) { return color(d.value); })
        .on('mouseover', on_mouseover)
        .on('mousemove', on_mousemove)
        .on('mouseout', on_mouseout)
        .on('click', function(d) {
            console.log(d);
            var number_max_to_show = d3.select('#input_box')
                .property('value');
            redraw(mat, d.index, cfg, number_max_to_show);
         });
    // shell ray circles
     ray.append('circle')
        .attr('cx', function(d) { return d.x1_start;})
        .attr('cy', function(d) { return d.y1_start;})
        .attr('r', 0)
        .style('fill', cfg.chart_color)
        .on('mouseover', on_mouseover)
        .on('mousemove', on_mousemove)
        .on('mouseout', on_mouseout)
        .on('click', function(d) {
            console.log(d);
            var number_max_to_show = d3.select('#input_box')
                .property('value');
            redraw(mat, d.index, cfg, number_max_to_show);
         });

    // simulation
     ray.selectAll('line').transition('starting')
        .duration(2000)
        .attr('x1', function(d) { return d.x1;})
        .attr('y1', function(d) { return d.y1;})
        .attr('x2', function(d) { return d.x2;})
        .attr('y2', function(d) { return d.y2;})
     ray.selectAll('circle').transition('starting')
        .duration(2000)
        .attr('cx', function(d) { return d.x2;})
        .attr('cy', function(d) { return d.y2;})
        .attr('r', cfg.outer_circle_radius);

    // left table - controls
    var left_table_control = create_control(cfg.left_table_index, mat, cfg, index);
    // left table - explanations
    var left_table_explanation = create_explanation(cfg.left_table_index);

    // right table - legend
    var right_table = tabulate(cfg.right_table_index, data, cfg.right_table_cols, cfg.number_format, cfg.width);

    //
    // local functions
    //

    function get_value(data, value) {
        return data.map(d => d.value)
    }

    function get_max_value(data, value) {
        var index_name = Object.keys(data);
        var arr_max = [];
        for (k = 0; k < index_name.length; ++k) {

           var arr = data[index_name[k]];
           var arr_value = get_value(arr, value)
           arr_max.push(Math.max(...arr_value))

        };
        return Math.max(...arr_max);
    }

    // mouse
    function on_mouseover(element) {

        d3.select('svg').selectAll('line')
            .select( function(d) { return d===element?this:null;})
            .style('stroke', cfg.select_color)
        d3.select('svg').selectAll('circle')
            .select( function(d) { return d===element?this:null;})
            .style('fill', cfg.select_color)
            .attr("r", function(d) { return cfg.outer_circle_radius * cfg.select_scale; });
        d3.select(cfg.right_table_index).select('table').select('tbody').selectAll('tr')
            .select( function(d) { return d===element?this:null;})
            .style('color', cfg.select_color);

        tooltip_div.transition()
            .duration(0)
            .style('opacity', 1);
        tooltip_div.html(d3.selectAll('.center').datum() + ' --| <b>' + d3.format(cfg.number_format)(element.value) + '</b> |-- ' + element.index)
            .style('left', cfg.tooltip_offset_x + 'px')
            .style('top', cfg.tooltip_offset_y + 'px');

        d3.select(this).style('cursor', 'pointer');
    };
    function on_mousemove(element) {

        d3.select('svg').selectAll('line')
            .select( function(d) { return d===element?this:null;})
            .style('stroke', cfg.select_color)
        d3.select('svg').selectAll('circle')
            .select( function(d) { return d===element?this:null;})
            .style('fill', cfg.select_color)
        d3.select(cfg.right_table_index).select('table').select('tbody').selectAll('tr')
            .select( function(d) { return d===element?this:null;})
            .style('color', cfg.select_color);

        d3.select(this).style('cursor', 'pointer');
    };
    function on_mouseout(element) {

        d3.select('svg').selectAll('line')
            .select( function(d) { return d===element?this:null;})
            .transition('hide')
            .duration(200)
            .style('stroke', function(d) { return color(d.value); })
        d3.select('svg').selectAll('circle')
            .select( function(d) { return d===element?this:null;})
            .transition('hide')
            .duration(200)
            .style('fill', cfg.chart_color)
            .attr("r", function(d) { return cfg.outer_circle_radius; });
        d3.select(cfg.right_table_index).select('table').select('tbody').selectAll('tr')
            .select( function(d) { return d===element?this:null;})
            .transition('hide')
            .duration(200)
            .style('color', cfg.text_color);

        tooltip_div.transition()
            .duration(500)
            .style('opacity', 0);

        d3.select(this).style('cursor', 'default');
    };

    // Thanks to http://bl.ocks.org/phil-pedruco/7557092 for the table code
    function tabulate(id, data, columns, number_format = '.2f', table_width) {

        var table = d3.select(id)
            .append('table')
            .attr('width', table_width),
            thead = table.append('thead'),
            tbody = table.append('tbody'),
            format = d3.format(number_format);

        // append the header row
        thead.append('tr')
            .selectAll('th')
            .data(columns)
            .enter()
            .append('th')
                .text(function(column) { return column;});

        // create a row for each object in the data
        var rows = tbody.selectAll('tr')
            .data(data)
            .enter()
            .append('tr')
            .on('click', function (d) {
                console.log(d);
                var number_max_to_show = d3.select('#input_box')
                .property('value');
                redraw(mat, d.index, cfg, number_max_to_show);
            })
            .on('mouseover', on_mouseover)
            .on('mousemove', on_mousemove)
            .on('mouseout', on_mouseout);

        // create a cell in each row for each column
        var cells = rows.selectAll('td')
            .data(function(row) {
                return columns.map(function(column) {
                    return {column: column, value: row[column]};
                });
            })
            .enter()
            .append('td')
            .html(function(d) {
                if (isNaN(d.value)) {
                    return d.value;
                } else {
                    return '<b>' + format(d.value) + '</b>';
                };
            });

        return table;
    };

    // get data
    function get_data(mat, index, cfg, n) {
        // select data
        var data = mat[index];
        // sort by value
        data.sort(function (a, b) {
          return a.value - b.value;
        });
        // filter number max
        var data = get_first_n(data, n);

        // scales
        var max_value = data[data.length - 1].value;
        var scale = d3.scaleLinear()
          .domain([0, max_value])
          .range([0, (cfg.height / 2) - 2 * cfg.outer_circle_radius - cfg.inner_circle_radius - cfg.margin.top]);
        // add x and y position for nodes, depending on inner circle radius
        for (i = 0; i < data.length; ++i) {
            angle = (i / data.length) * 2 * Math.PI // 2*PI for complete circle
            starting_angle = angle - Math.PI / 2
            data[i]['x1_start'] = (cfg.inner_circle_radius) * Math.cos(starting_angle) + (cfg.width * cfg.center_position_x)
            data[i]['y1_start'] = (cfg.inner_circle_radius) * Math.sin(starting_angle) + (cfg.height * cfg.center_position_y)
            data[i]['x1'] = (cfg.inner_circle_radius) * Math.cos(angle) + (cfg.width * cfg.center_position_x)
            data[i]['y1'] = (cfg.inner_circle_radius) * Math.sin(angle) + (cfg.height * cfg.center_position_y)
            data[i]['x2'] = (scale(data[i].value) + cfg.inner_circle_radius) * Math.cos(angle) + (cfg.width * cfg.center_position_x)
            data[i]['y2'] = (scale(data[i].value) + cfg.inner_circle_radius) * Math.sin(angle) + (cfg.height * cfg.center_position_y)
        }
        return data;
    };

    // get first n data
    function get_first_n(obj, n) {
        return Object.keys(obj) // get the keys out
        .slice(0, n) // get the first N
        .reduce(function(memo, current) { // generate a new object out of them
        memo[current] = obj[current]
        return memo;
        }, [])
    };

    // redraw chart and table
    function redraw(mat, index, cfg, n) {

        var format = d3.format(cfg.number_format),
            new_data = get_data(mat, index, cfg, n),
            right_table = d3.select(cfg.right_table_index).select('tbody').selectAll('tr')
                .data(new_data),
            svg = d3.selectAll('svg'),
            new_center = svg.selectAll('.center')
                .datum(index),
            new_ray = svg.selectAll('.ray')
                .data(new_data);

       // enter
        var new_ray_enter = new_ray.enter().append('g')
            .attr('class', 'ray');
        new_ray_enter.append('line')
            .attr('x1', function(d) { return d.x1_start;})
            .attr('x2', function(d) { return d.x1_start;})
            .attr('y1', function(d) { return d.y1_start;})
            .attr('y2', function(d) { return d.y1_start;})
            .style("stroke-width", cfg.ray_stroke_width)
            .style("stroke",  function(d) { return color(d.value); })
            .on('mouseover', on_mouseover)
            .on('mousemove', on_mousemove)
            .on('mouseout', on_mouseout)
            .on('click', function(d) {
            console.log(d);
            var number_max_to_show = d3.select('#input_box')
                .property('value');
            redraw(mat, d.index, cfg, number_max_to_show);
            });
        new_ray_enter.append('circle')
            .attr('cx', function(d) { return d.x1_start;})
            .attr('cy', function(d) { return d.y1_start;})
            .attr('r', 0)
            .style('fill', cfg.chart_color)
            .on('mouseover', on_mouseover)
            .on('mousemove', on_mousemove)
            .on('mouseout', on_mouseout)
            .on('click', function(d) {
                console.log(d);
                var number_max_to_show = d3.select('#input_box')
                    .property('value');
                redraw(mat, d.index, cfg, number_max_to_show);
             });
        var right_table_enter = right_table.enter().append('tr')
            .on('click', function (d) {
                console.log(d);
                var number_max_to_show = d3.select('#input_box')
                .property('value');
                redraw(mat, d.index, cfg, number_max_to_show);
            })
            .on('mouseover', on_mouseover)
            .on('mousemove', on_mousemove)
            .on('mouseout', on_mouseout);

        var new_cell = right_table_enter.selectAll('td')
                .data(function(row) {
                    return cfg.right_table_cols.map(function(column) {
                        return {column: column, value: row[column]};
                    });
                })
                .enter()
                .append('td')
                .style('opacity', 0)
                .html(function(d) {
                    if (isNaN(d.value)) {
                        return d.value;
                    } else {
                        return '<b>' + format(d.value) + '</b>';
                    };
                });

        // exit
        new_ray.exit().selectAll('line').transition('ending')
            .duration(1000)
            .attr('x1', function(d) { return d.x1_start;})
            .attr('x2', function(d) { return d.x1_start;})
            .attr('y1', function(d) { return d.y1_start;})
            .attr('y2', function(d) { return d.y1_start;});
        new_ray.exit().selectAll('circle').transition('ending')
            .duration(1000)
            .attr('cx', function(d) { return d.x1_start;})
            .attr('cy', function(d) { return d.y1_start;})
            .attr('r', 0);
        new_ray.exit().transition().duration(1000).remove();
        right_table.exit().transition('ending')
            .duration(1000)
            .style('opacity', 0)
            .remove();

        // update
        new_center.select('text').transition('ending')
            .duration(1000)
            .style('opacity', 0)
            .transition('redrawing')
            .duration(2000)
            .text(function(d) {return d;})
            .style('opacity', 1);
        var new_ray = svg.selectAll('.ray'); // reselect to update all
        new_ray.select('line').transition('ending')
            .duration(1000)
            .attr('x1', function(d) { return d.x1_start;})
            .attr('x2', function(d) { return d.x1_start;})
            .attr('y1', function(d) { return d.y1_start;})
            .attr('y2', function(d) { return d.y1_start;})
            .transition('redrawing')
            .duration(2000)
            .attr('x1', function(d) { return d.x1;})
            .attr('y1', function(d) { return d.y1;})
            .attr('x2', function(d) { return d.x2;})
            .attr('y2', function(d) { return d.y2;})
            .style('stroke', function(d) { return color(d.value); });
        new_ray.select('circle').transition('ending')
            .duration(1000)
            .attr('cx', function(d) { return d.x1_start;})
            .attr('cy', function(d) { return d.y1_start;})
            .attr('r', 0)
            .transition('redrawing')
            .duration(2000)
            .attr('cx', function(d) { return d.x2;})
            .attr('cy', function(d) { return d.y2;})
            .attr('r', cfg.outer_circle_radius);

        var right_table = d3.select(cfg.right_table_index).select('tbody').selectAll('tr');
        right_table.selectAll('td')
            .data(function(row) {
                return cfg.right_table_cols.map(function(column) {
                    return {column: column, value: row[column]};
                });
            })
            .transition('ending')
            .duration(1000)
            .style('opacity', 0)
            .on('end', function() {
                d3.select(this)
                    .html(function(d) {
                    if (isNaN(d.value)) {
                        return d.value;
                    } else {
                        return '<b>' + format(d.value) + '</b>';
                    };
                })
                .transition('redrawing')
                .duration(2000)
                .style('opacity', 1);
            });
        d3.select('#dropdown_menu')
            .property('value', index)
    };

    // retract
    var retracted = false;
    function retract(cfg) {

        var svg = d3.selectAll('svg');
        var ray = svg.selectAll('.ray');

        if (retracted) {
        // open
        ray.select('line').transition('redrawing')
            .duration(2000)
            .attr('x1', function(d) { return d.x1;})
            .attr('y1', function(d) { return d.y1;})
            .attr('x2', function(d) { return d.x2;})
            .attr('y2', function(d) { return d.y2;});
        ray.select('circle').transition('redrawing')
            .duration(2000)
            .attr('cx', function(d) { return d.x2;})
            .attr('cy', function(d) { return d.y2;})
            .attr('r', cfg.outer_circle_radius);
        retracted = false;
        } else {
        // retract
        ray.select('line').transition('ending')
            .duration(1000)
            .attr('x1', function(d) { return d.x1_start;})
            .attr('x2', function(d) { return d.x1_start;})
            .attr('y1', function(d) { return d.y1_start;})
            .attr('y2', function(d) { return d.y1_start;});
        ray.select('circle').transition('ending')
            .duration(1000)
            .attr('cx', function(d) { return d.x1_start;})
            .attr('cy', function(d) { return d.y1_start;})
            .attr('r', 0);
         retracted = true;
        }
    };

    function create_explanation(div) {

        var explanation_div = d3.select(div).append('div')
            .attr('class', 'explanation_div');

        explanation_div
            .attr('id', 'explanation')
            .html('This circular chart represents a distance matrix from a single element perspective.' +
                  'The weights linking the chosen element and its <i>N</i> closest neighbours are sorted from ' +
                  'smallest to largest distances, and are then dispatched in a circle around the center, thus ' +
                  'forming naturally a nautilus shell shape. <br><br>' +
                  'To explore the landscape further:<br>' + '<ul type="square">' +
                  '<li>Click on any neighbour nodes to focus it. </li>' +
                  '<li>Navigate using drop down menu to focus on a specific element. </li>' +
                  '<li>Change the number <i>N</i> to increase or decrease the maximum number of closest neighbours represented on the chart.</li></ul>')
    }

    function create_control(div, data, cfg, index) {

        var control_div = d3.select(div).append('div');

        var values = Object.keys(data).sort()

        // drop down
        control_div
            .append('div')
            .attr('class', 'control_div')
            .append('select')
            .attr('id', 'dropdown_menu')
            .on('mouseover', function() { d3.select(this).style('cursor', 'pointer');})
            .on('mousemove', function() { d3.select(this).style('cursor', 'pointer');})
            .on('mouseout', function() { d3.select(this).style('cursor', 'default');})
            .selectAll('option')
            .data(values)
            .enter()
            .append('option')
            .attr('value', function(d) {
                return d;
            })
            .text(function(d) {
                return d;
            });
        d3.select('#dropdown_menu')
            .property('value', index);
         // input box
        control_div
            .append('div')
            .attr('class', 'control_div')
            .append('input')
            .attr('id', 'input_box')
            .attr('type', 'number')
            .attr('value', cfg.number_max_to_show)
            .attr('min', 1)
            .attr('max', values.length);
        // redraw
        control_div
            .on('change', function() {
                var selected_value = d3.select(this)
                    .select('select')
                    .property('value');
                var number_max_to_show = d3.select('#input_box')
                    .property('value');
                console.log(selected_value);
                console.log(number_max_to_show);
                redraw(mat, selected_value, cfg, number_max_to_show);
            });
    };
};