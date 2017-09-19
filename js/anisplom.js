function anisplom(_div, _source, _params) {
  // external variables and functions
  var main = {};

  // placeholders for data
  var data = {
    'rows': 0,      // number of rows
    'cols': 0,      // number of columns
    'keep': 0,      // number of columns keeping in splom
    'indices': [],  // original table indices
    'labels': [],   // column names,
    'colors': {},   // class to color map
    'min': [],      // minimum values
    'max': [],      // maximum values
    'mid': [],      // midpoint values
    'drawn': false, // whether data has been 100% drawn
    'table': undefined
  };

  // placeholders for drawing canvas and buffers
  var canvas;
  var buffers = {
    'color': undefined,
    'grey': undefined,
    'classes': {}
  };

  // placeholders for interactivity
  var highlighted = {
    'x': undefined, 'y': undefined
  };

  var brushed = {
    'active': false,
    'status': {}
  };

  // counter for looping through data
  var start = 0;

  // internal configuration
  var config = {
    'framerate': 30,
    'point': {
      // size of points (circumference)
      // https://p5js.org/reference/#/p5/ellipse
      'size': 4.5,

      // thin stroke for normal encoding
      // thick stroke for open encoding
      // https://p5js.org/reference/#/p5/strokeWeight
      'stroke': {
        'thin': 0.3,
        'wide': 0.8
      },

      // used for alpha blending (between 0 and 255)
      // https://p5js.org/reference/#/p5/color
      'alpha': 125,

      // http://colorbrewer2.org/#type=qualitative&scheme=Set3&n=10
      // used to color points by class
      'color': [
        '#8dd3c7', '#fb8072', '#80b1d3', '#fdb462', '#bc80bd', '#b3de69', '#fccde5', '#d9d9d9', '#ffffb3', '#bebada'
      ],
    },
    'text': {
      // text colors
      'normal': 'rgb(169, 169, 169)',
      'hover': 'rgb(0, 0, 0)',

      // text sizes
      'sizes': {
        'label': 10,
        'legend': 12,
      }
    },
    'grid': {
      'width': 125,
      'pad': NaN,
      'ticks': 3,
      'x': [],
      'y': [],
    },
    'plot': {
      // plot boundaries (for hover interactivty)
      'x1': NaN, 'y1': NaN, 'x2': NaN, 'y2': NaN
    },
    'legend': {
      // legend boundaries (for click interactivity)
      'x1': NaN, 'x2': NaN, 'size': NaN,
      'keys': []
    },
    'progress': {
      'top': {
        'x': NaN, 'y': NaN,
        'width': NaN, 'height': NaN
      },
      'bar': {
        'x': NaN, 'y': NaN,
        'width': NaN, 'height': NaN
      },
      'text': {'x': NaN, 'y': NaN}
    },
    'buttons': {
      'play': {
        'x': NaN, 'y': NaN,
        'width': NaN, 'height': NaN
      },
      'pause': {
        'x': NaN, 'y': NaN,
        'width': NaN, 'height': NaN
      },
    },
    'canvas': {
      'pad': 35,
      'width': NaN,
      'height': NaN
    }
  };

  // valid encoding types and their respective functions

  var defaultEncoding = function(x, y, c, buffer) {
    if (buffer) {
      buffer.stroke(255);
      buffer.strokeWeight(config.point.stroke.thin);
      buffer.fill(c);
      buffer.ellipse(x, y, config.point.size);
    }
    else {
      stroke(255);
      strokeWeight(config.point.stroke.thin);
      fill(c);
      ellipse(x, y, config.point.size);
    }
  };

  var drawOutline = function(x, y, c, buffer, thin) {
    var size = thin ? config.point.stroke.thin : config.point.stroke.wide;

    if (buffer) {
      buffer.stroke(c);
      buffer.strokeWeight(size);
      buffer.noFill();
      buffer.ellipse(x, y, config.point.size);
    }
    else {
      stroke(c);
      strokeWeight(size);
      noFill();
      ellipse(x, y, config.point.size);
    }
  };

  var encodings = {
    'normal': defaultEncoding,
    'open': drawOutline,
    'alpha': function(x, y, c, buffer) {
      var fixed = color(c);
      fixed = color(red(fixed), green(fixed), blue(fixed), config.point.alpha);
      push();
      blendMode(BLEND);
      defaultEncoding(x, y, fixed, buffer);
      pop();
    },
    'blend': function(x, y, c, buffer) {
      push();
      blendMode('darken');
      defaultEncoding(x, y, c, buffer);
      pop();

      drawOutline(x, y, '#FFFFFF', buffer, true);
    }
  };

  /**** parameter handling ****/

  // holds configurable parameters
  var params = {};

  function processParameters() {
    // set values from function parameters first

    params.animate = setBoolean(_params, 'animate', true);
    params.prerender = setBoolean(_params, 'prerender', true);
    params.shuffle = setBoolean(_params, 'shuffle', false);

    params.rows = setNumber(_params, 'rows', 0, data.table.getRowCount(), 1);
    params.scale = setNumber(_params, 'scale', 0, Number.MAX_SAFE_INTEGER, 1);

    params.encoding = setEncoding(_params, 'encoding', 'normal');

    // process url parameters and overwrite if valid

    // https://p5js.org/reference/#/p5/getURLParams
    var urlParams = getURLParams();

    params.animate = setBoolean(urlParams, 'animate', params.animate);
    params.prerender = setBoolean(urlParams, 'prerender', params.prerender);
    params.shuffle = setBoolean(urlParams, 'shuffle', params.shuffle);

    params.rows = setNumber(urlParams, 'rows', 0, data.table.getRowCount(), params.rows);
    params.scale = setNumber(urlParams, 'scale', 0, Number.MAX_SAFE_INTEGER, params.scale);

    params.encoding = setEncoding(urlParams, 'encoding', params.encoding);

    // make sure rows is an integer number
    params.rows = Math.round(params.rows);
  }

  function setBoolean(object, property, fallback) {
    if (object != null && object.hasOwnProperty(property)) {
      if (typeof object[property] === 'boolean') {
        return object[property];
      }

      if (typeof object[property] === 'string') {
        var value = decodeURIComponent(object[property]).toLowerCase().trim();

        if (value === 'true' || value === 'false') {
          return value === 'true';
        }
      }
    }

    console.assert(typeof fallback === 'boolean');
    return fallback;
  }

  function setNumber(object, property, lo, hi, fallback) {
    if (object != null && object.hasOwnProperty(property)) {
      var value = object[property];

      if (typeof value === 'string') {
        value = parseFloat(decodeURIComponent(value));
      }

      if (typeof value === 'number') {
        if (value > lo && value <= hi) {
          return value;
        }
      }
    }

    console.assert(fallback > lo && fallback <= hi);
    return fallback;
  }

  function setEncoding(object, property, fallback) {
    if (object != null && object.hasOwnProperty(property)) {
      var value = decodeURIComponent(object[property]).toLowerCase().trim();
      if (encodings.hasOwnProperty(value)) {
        return value;
      }
    }

    console.assert(encodings.hasOwnProperty(fallback));
    return fallback;
  }

  function shuffleRows() {
    shuffle(data.table.rows, true);
  }

  /**** drawing functions ****/

  function formatLabel(value) {
    if (abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }

    return value;
  }

  function drawBase() {
    drawGrid();
    drawTicks();
    drawLabels();
    drawLegend();
    drawProgress(0);
    drawButtons();
    drawSpinner();
    drawSpinnerText();
  }

  function drawGrid() {
    blendMode(REPLACE);
    rectMode(CORNER);
    noFill();

    strokeWeight(1);
    stroke(169, 169, 169);

    // draw rectangles
    for (var row = 0; row < data.keep - 1; row++) {
      for (var col = data.keep - 1; col > row; col--) {
        rect(config.grid.x[col], config.grid.y[row], config.grid.width, config.grid.width);
      }
    }
  }

  function drawTicks() {
    fill(169, 169, 169);

    for (var col = 0; col < data.keep; col++) {
      var reversed = data.keep - col - 1;

      var labels = [
        data.min[col],
        data.mid[col],
        data.max[col]
      ];

      for (var i = 0; i < labels.length; i++) {

        // x-axis labels
        if (col !== 0) {
          var x = map(labels[i], labels[0], labels[2], config.plot.x1 + reversed * config.grid.width + config.grid.pad, config.plot.x1 + (reversed + 1) * config.grid.width - config.grid.pad);

          var y = config.plot.y1 - config.grid.ticks;

          // tick labels
          noStroke();
          textStyle(NORMAL);
          textAlign(CENTER, BOTTOM);
          textSize(config.text.sizes.label);
          text(formatLabel(labels[i]), x, y);

          // tick marks
          stroke(169, 169, 169);
          strokeWeight(1);
          line(x, config.plot.y1 - config.grid.ticks, x, config.plot.y1);
        }

        // y-axis labels
        if (col !== data.keep - 1) {
          var x = config.plot.x1 - config.grid.ticks;
          var y = map(labels[i], labels[0], labels[2], config.plot.y1 + (col + 1) * config.grid.width - config.grid.pad, config.plot.y1 + col * config.grid.width + config.grid.pad);

          // tick label
          push();
          rotate(-HALF_PI);
          noStroke();
          textStyle(NORMAL);
          textAlign(CENTER, BOTTOM);
          textSize(config.text.sizes.label);
          text(formatLabel(labels[i]), -y, x);
          pop();

          // tick marks
          stroke(169, 169, 169);
          strokeWeight(1);
          line(config.plot.x1 - config.grid.ticks, y, config.plot.x1, y);
        }
      }
    }
  }

  function drawLabels() {
    fill(169, 169, 169);

    for (var col = 0; col < data.keep; col++) {
      var reversed = data.keep - col - 1;

      var labels = [
        data.min[col],
        data.mid[col],
        data.max[col]
      ];

      // x-axis labels
      if (col !== 0) {
        var x = map(labels[1], labels[0], labels[2], config.plot.x1 + reversed * config.grid.width + config.grid.pad, config.plot.x1 + (reversed + 1) * config.grid.width - config.grid.pad);

        var y = config.plot.y1 - config.grid.ticks;

        // axis subtitle
        drawTitle(x, y, data.labels[col], false);
      }

      // y-axis labels
      if (col !== data.keep - 1) {
        var x = config.plot.x1 - config.grid.ticks;
        var y = map(labels[1], labels[0], labels[2], config.plot.y1 + (col + 1) * config.grid.width - config.grid.pad, config.plot.y1 + col * config.grid.width + config.grid.pad);

        // axis subtitle
        drawTitle(x, y, data.labels[col], true);
      }
    }
  }

  function drawTitle(x, y, title, vertical) {
    push();
    textStyle(BOLD);
    textAlign(CENTER, BOTTOM);
    textSize(config.text.sizes.label);

    if (vertical) {
      rotate(-HALF_PI);

      var temp = x;
      x = -y;
      y = temp;
    }

    // white out anything before
    // needed for redrawing titles
    fill(255);
    stroke(255);
    strokeWeight(1);
    text(title, x, y - textLeading());

    // redraw new label
    var current = vertical ? highlighted.y : highlighted.x;

    if (current === title) {
      fill(0);
    }
    else {
      fill(169);
    }

    noStroke();
    text(title, x, y - textLeading());
    pop();
  }

  function drawLegend() {
    textSize(config.text.sizes.legend);

    var x1 = config.plot.x2 - config.grid.width;
    var y1 = config.plot.y2 - config.grid.width
    var title = _source.columns.names[_source.classes.index];

    // draw rectangle
    fill(255);
    stroke(169, 169, 169);
    strokeWeight(1);
    rectMode(CORNER);
    rect(x1, y1, config.grid.width, config.grid.width);

    // legend title
    noStroke();
    textStyle(BOLD);
    textAlign(CENTER, TOP);
    fill(169, 169, 169);
    text(title, x1 + 0.5 * config.grid.width, y1 + config.grid.pad);

    // legend key
    var pad = round(4 * params.scale);
    var gap = round((config.grid.width - textLeading() - config.grid.pad * 2) / _source.classes.names.length);
    var size = gap - pad;
    var half = size / 2;

    // set legend key bounds
    config.legend.x1 = x1 + config.grid.pad;
    config.legend.x2 = x1 + config.grid.pad + size;
    config.legend.size = size;
    config.legend.pad = pad;

    for (var i = 0; i < _source.classes.names.length; i++) {
      var x = x1 + config.grid.pad;
      var y = y1 + config.grid.pad + textLeading() + pad + gap * i;
      var name = _source.classes.names[i];

      // setup brushing while we are at it
      config.legend.keys.push({
        'y1': y, 'y2': y + size,
        'index': i, 'name': name
      });

      drawKey(x, y, name);
    }
  }

  function drawKey(x, y, name) {
    textSize(config.text.sizes.legend);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    rectMode(CORNER);

    var tx = x + config.legend.size + config.legend.pad;
    var ty = y + config.legend.size / 2;

    // white out text and rectangle
    fill(255);
    stroke(255);
    strokeWeight(1);
    text(name, tx, ty);
    rect(x, y, config.legend.size, config.legend.size);

    // redraw key and label
    var c = brushed.status[name] ? '#D9D9D9' : data.colors[name];

    noStroke();
    fill(c);
    rect(x, y, config.legend.size, config.legend.size);
    text(name, tx, ty);
  }

  function drawProgress(rows) {
    // convert rows to percent
    var value = round(rows / data.rows * 100);
    var label = data.drawn ? '% of rows animated' : '% of rows displayed';

    // draw white rectangle to remove previous bar
    strokeWeight(1);
    stroke(255);
    fill(255);
    rect(config.progress.top.x, config.progress.top.y, config.progress.top.width, config.progress.top.height);

    // draw vertical line or bar
    var width = map(rows, 0, data.rows, 0, config.progress.bar.width);

    if (data.drawn) {
      fill(169);
      stroke(255);
      rect(config.progress.bar.x, config.progress.bar.y, config.progress.bar.width, config.progress.bar.height);

      stroke(255);
      line(config.progress.bar.x + width, config.progress.bar.y, config.progress.bar.x + width, config.progress.bar.y + config.progress.bar.height);
    }
    else {
      fill(169);
      stroke(169);
      rect(config.progress.bar.x, config.progress.bar.y, width, config.progress.bar.height);

      // draw rectangle outline
      noFill();
      rect(config.progress.bar.x, config.progress.bar.y, config.progress.bar.width, config.progress.bar.height);
    }

    // draw text
    fill(169);
    noStroke();
    textSize(config.text.sizes.label);
    textAlign(RIGHT, BOTTOM);
    text(value + label, config.progress.text.x, config.progress.text.y);

  }

  function drawButtons() {
    var play = params.animate ? 169 : 217;
    var pause = params.animate ? 217 : 169;

    noStroke();

    fill(play);
    triangle(
      config.buttons.play.x, config.buttons.play.y,
      config.buttons.play.x + config.buttons.play.width, config.buttons.play.y + config.buttons.play.height / 2,
      config.buttons.play.x, config.buttons.play.y + config.buttons.play.height
    );

    fill(pause);
    rect(config.buttons.pause.x, config.buttons.pause.y, config.buttons.pause.width * 0.4, config.buttons.pause.height);
    rect(config.buttons.pause.x + config.buttons.pause.width - config.buttons.pause.width * 0.4, config.buttons.pause.y, config.buttons.pause.width * 0.4, config.buttons.pause.height);
  }

  function drawSpinner() {
    var spinner = createInput(params.rows, 'number');
    spinner.attribute('id', 'rows');
    spinner.attribute('min', 1);
    spinner.attribute('max', data.rows);
    spinner.attribute('step', 1);
    spinner.parent(_div);

    spinner.style('width', (config.buttons.play.x - config.progress.top.x - config.buttons.pause.width * 0.4) + 'px');
    spinner.style('text-align', 'right');
    spinner.style('font-size', config.text.sizes.legend + 'px');

    spinner.input(function() {
      params.rows = parseInt(spinner.value());
    });

    windowResized();
  }

  function drawSpinnerText() {
    textSize(config.text.sizes.label);
    fill(160);
    noStroke();
    textAlign(LEFT, BOTTOM);
    text(
      'Rows per frame (' + data.rows + ' max)',
      config.progress.top.x,
      config.buttons.play.y - 4 * params.scale
    );
  }

  function drawRow(index) {
    var name = data.table.getString(index, _source.classes.index);
    var c = data.colors[name];

    for (var row = 0; row < data.keep - 1; row++) {
      var yvalue = data.table.getNum(index, data.indices[row]);
      var py = map(yvalue, data.min[row], data.max[row], config.grid.y[row] + config.grid.width - config.grid.pad, config.grid.y[row] + config.grid.pad);

      for (var col = data.keep - 1; col > row; col--) {
        var xvalue = data.table.getNum(index, data.indices[col]);
        var px = map(xvalue, data.min[col], data.max[col], config.grid.x[col] + config.grid.pad, config.grid.x[col] + config.grid.width - config.grid.pad);

        encodings[params.encoding](px, py, c, buffers.color);
        encodings[params.encoding](px, py, c, buffers.classes[name]);
        encodings[params.encoding](px, py, '#D9D9D9', buffers.grey);

        // change live color if necessary
        if (brushed.active && brushed.status[name]) {
          encodings[params.encoding](px, py, '#D9D9D9', undefined);
        }
        else {
          encodings[params.encoding](px, py, c, undefined);
        }
      }
    }
  }

  function drawBuffers() {
    if (brushed.active) {
      image(buffers.grey, 0, 0, config.canvas.width * displayDensity(), config.canvas.height * displayDensity(), 0, 0, config.canvas.width, config.canvas.height);

      for (var name in brushed.status) {
        if (!brushed.status[name]) {
          image(buffers.classes[name], 0, 0, config.canvas.width * displayDensity(), config.canvas.height * displayDensity(), 0, 0, config.canvas.width, config.canvas.height);
        }
      }
    }
    else {
      image(buffers.color, 0, 0, config.canvas.width * displayDensity(), config.canvas.height * displayDensity(), 0, 0, config.canvas.width, config.canvas.height);
    }
  }

  function insertAlert(text) {
    var parent = document.getElementById(_div);

    var div = document.createElement('div');
    parent.insertBefore(div, parent.firstChild);
    div.id = 'alert';
    div.classList.add('columns');
    div.classList.add('is-centered');

    var col = document.createElement('div');
    div.appendChild(col);
    col.classList.add('column');
    col.classList.add('is-narrow');

    var notice = document.createElement('div');
    col.appendChild(notice);
    notice.classList.add('notification');
    notice.innerHTML = '<p><i class="fa fa-pulse fa-spinner"></i> ' + text + '</p>';
  }

  function prerender() {
    // turn off draw loop temporarily
    noLoop();

    for (var i = 0; i < data.rows; i++) {
      drawRow(i);
    }

    params.prerender = false;
    data.drawn = true;

    // re-enable draw loop if needed
    if (params.animate) {
      loop();
    }
  }

  /**** p5 functions ****/

  // called before setup() to load files
  // https://p5js.org/reference/#/p5/preload
  main.preload = function() {
    // https://p5js.org/reference/#/p5/loadTable
    data.table = loadTable(_source.path, 'csv', 'header');
  };

  main.setup = function() {
    data.rows = data.table.getRowCount();
    data.cols = data.table.getColumnCount();
    data.keep = _source.columns.shown.length;

    console.log('Loaded ' + data.rows + ' rows and ' + data.cols + ' columns from "' + _source.path + '".');

    // calculate column extents
    for (var i = 0; i < data.keep; i++) {
      var index = _source.columns.shown[i];
      var values = data.table.getColumn(index);

      data.indices[i] = index;
      data.labels[i] = _source.columns.names[index];
      data.min[i] = floor(min(values));
      data.max[i] = ceil(max(values));
      data.mid[i] = data.min[i] + (data.max[i] - data.min[i]) / 2;
    }

    /**** process function and url parameters ****/

    processParameters();

    // shuffle if necessary
    if (params.shuffle) {
      shuffleRows();
    }

    // scale sizes
    if (params.scale !== 1) {
      config.point.size *= params.scale;
      config.point.stroke.thin *= params.scale;
      config.point.stroke.wide *= params.scale;

      for (var size in config.text.sizes) {
        config.text.sizes[size] *= params.scale;
      }

      config.grid.width *= params.scale;
      config.grid.ticks *= params.scale;
      config.canvas.pad *= params.scale;
    }

    /**** setup canvas and buffers ****/

    config.canvas.width = config.grid.width * (data.keep - 1) + 2 * config.canvas.pad;
    config.canvas.height = config.canvas.width;

    // setup offscreen buffers
    var density = displayDensity();

    buffers['color'] = createGraphics(config.canvas.width * density, config.canvas.height * density);
    buffers['grey'] = createGraphics(config.canvas.width * density, config.canvas.height * density);
    buffers['classes'] = {};

    // setup class colors and buffers
    for (var i = 0; i < _source.classes.names.length; i++) {
      var name = String(_source.classes.names[i]);
      data.colors[name] = config.point.color[i];

      buffers['classes'][name] = createGraphics(config.canvas.width * density, config.canvas.height * density);
      brushed.status[name] = false;
    }

    // calculate grid locations
    config.grid.pad = config.grid.width * 0.1;
    config.grid.x.push(undefined);

    for (var i = 0; i < data.keep - 1; i++) {
      config.grid.x.push(config.canvas.width - config.canvas.pad - config.grid.width - i * config.grid.width);
      config.grid.y.push(config.canvas.pad + i * config.grid.width);
    }
    config.grid.y.push(undefined);

    // calculate plot bounds
    config.plot.x1 = config.canvas.pad;
    config.plot.x2 = config.canvas.width - config.canvas.pad;

    config.plot.y1 = config.canvas.pad;
    config.plot.y2 = config.canvas.height - config.canvas.pad;

    // calculate progress bar location
    config.progress.bar.width = config.grid.width;
    config.progress.bar.height = config.grid.pad * 1.5;

    config.progress.bar.x = config.plot.x2 - config.grid.width;
    config.progress.bar.y = config.plot.y2 - config.grid.width - config.grid.pad - config.progress.bar.height;

    // calculate progress text location
    config.progress.text.x = config.plot.x2 - 1;
    config.progress.text.y = config.progress.bar.y - 1;

    // calculate progress top location
    textSize(config.text.sizes.label);
    config.progress.top.x = config.progress.bar.x + 1;
    config.progress.top.y = config.progress.text.y - textLeading();
    config.progress.top.width = config.progress.bar.width;
    config.progress.top.height = config.plot.y2 - config.grid.width - config.grid.pad - config.progress.top.y;

    // calculate button locations
    config.buttons.play.width = config.progress.bar.height * 0.8;
    config.buttons.play.height = config.progress.bar.height;
    config.buttons.pause.width = config.buttons.play.width;
    config.buttons.pause.height = config.buttons.play.height;

    config.buttons.pause.x = config.plot.x2 - config.buttons.pause.width;
    config.buttons.pause.y = config.progress.top.y - config.buttons.pause.height - config.grid.pad;

    config.buttons.play.x = config.buttons.pause.x - config.buttons.play.width - config.buttons.pause.width * 0.2;
    config.buttons.play.y = config.buttons.pause.y;

    canvas = createCanvas(config.canvas.width, config.canvas.height);
    canvas.parent(_div);
    background(255);
    frameRate(config.framerate);
    cursor(ARROW);
    blendMode(REPLACE);

    drawBase();

    if (!params.animate) {
      params.prerender = true;
    }

    console.log('Setup complete!', config, params, data);
  };

  main.draw = function() {
    if (frameCount === 1) {
      windowResized();
    }

    if (params.prerender) {
      // let frame 0 animate...
      // otherwise the grid will not render while waiting
      if (frameCount == 1) {
        // insert alert in a frame BEFORE the prerender
        // otherwise it does not appear until AFTEr the prerender
        insertAlert('Prerendering ' + data.rows + ' rows and ' + data.keep + ' columns...');
      }
      else if (frameCount > 1) {
        prerender();
        drawProgress(data.rows);

        // remove the alert now that prerender is done
        var div = select('#alert');
        if (div != null) {
          div.remove();
        }
      }
    }
    else {
      // do nothing if canvas is not yet loaded
      if (config.canvas == null || params.animate == null) {
        return;
      }

      var count = 0;

      while (count < params.rows) {
        drawRow(start);

        if (start === data.rows - 1) {
          data.drawn = true;

          if (params.shuffle) {
            shuffleRows();
          }
        }

        // data.drawn = data.drawn ? true : (start === data.rows - 1);
        start = (start + 1) % data.rows;
        count++;
      }

      drawProgress(start);
    }
  };

  main.mouseClicked = function() {
    // check if click from legend
    if (mouseX >= config.legend.x1 &&
        mouseX <= config.legend.x2) {
      for (var i = 0; i < config.legend.keys.length; i++) {
        var key = config.legend.keys[i];

        if (mouseY < key.y1) {
          // outside bounds
          break;
        }

        if (mouseY > key.y2) {
          // move to next class
          continue;
        }

        // this is the correct class to brush

        // toggle the brushed status
        brushed.status[key.name] = !brushed.status[key.name];
        drawKey(config.legend.x1, key.y1, key.name);

        // test if all of the values are now false
        var reset = Object.values(brushed.status).every(function(d) { return d === false; });

        // change brushing status if necessary
        if (reset) {
          brushed.active = false;
        }
        else if (brushed.status[key.name]) {
          brushed.active = true;
        }

        if (!brushed.active) {
          // just draw the color buffer
          image(buffers.color, 0, 0, config.canvas.width * displayDensity(), config.canvas.height * displayDensity(), 0, 0, config.canvas.width, config.canvas.height);
        }
        else {
          // if brushing, just show appropriate buffer
          if (!brushed.status[key.name]) {
            image(buffers.classes[key.name], 0, 0, config.canvas.width * displayDensity(), config.canvas.height * displayDensity(), 0, 0, config.canvas.width, config.canvas.height);
          }
          // if unbrushing have to draw gray buffer first
          // and then redraw the rest
          else{
            image(buffers.grey, 0, 0, config.canvas.width * displayDensity(), config.canvas.height * displayDensity(), 0, 0, config.canvas.width, config.canvas.height);

            for (var name in brushed.status) {
              if (!brushed.status[name]) {
                image(buffers.classes[name], 0, 0, config.canvas.width * displayDensity(), config.canvas.height * displayDensity(), 0, 0, config.canvas.width, config.canvas.height);
              }
            }
          }
        }

        break;
      }
    }

    // check if clicked on play/pause buttons
    if (mouseY >= config.buttons.play.y && mouseY <= config.buttons.play.y + config.buttons.play.height) {

      if (mouseX >= config.buttons.play.x && mouseX <= config.buttons.play.x + config.buttons.play.width) {
        if (!params.animate) {
          params.animate = true;
          drawButtons();
          loop();
        }
      }
      else if (mouseX >= config.buttons.pause.x && mouseX <= config.buttons.pause.x + config.buttons.pause.width) {
        if (params.animate) {
          params.animate = false;
          drawButtons();
          noLoop();
        }
      }
    }
  };

  main.mouseMoved = function() {
    // adjust axis highlighting
    // makes axis label bold if hovered

    var old = {
      'x': highlighted.x,
      'y': highlighted.y
    };

    if (
      mouseX >= config.plot.x1 &&
      mouseX <  config.plot.x2 &&
      mouseY >= config.plot.y1 &&
      mouseY <  config.plot.y2) {

      var xcol = data.keep - Math.floor((mouseX - config.plot.x1) / config.grid.width) - 1;
      console.assert(xcol > 0 && xcol < data.keep);
      highlighted.x = data.labels[xcol];

      var ycol = Math.floor((mouseY - config.plot.y1) / config.grid.width);
      console.assert(ycol >= 0 && ycol < data.keep - 1);
      highlighted.y = data.labels[ycol];
    }
    else {
      highlighted.x = undefined;
      highlighted.y = undefined;
    }

    if (old.x !== highlighted.x || old.y !== highlighted.y) {
      drawLabels();
    }
  };

  main.windowResized = function() {
    // redraw spinner
    var spinner = select('#rows');

    if (spinner) {
      spinner.position(canvas.position().x + config.progress.top.x, canvas.position().y + config.buttons.play.y);
    }
  }

  return main;
}
