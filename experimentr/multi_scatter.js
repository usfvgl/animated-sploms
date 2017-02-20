//TODO remove _rectangles and all _rectangles-related references
function multi_scatter(_dataSource, _attr, _category, _animate, _encoding, _chartTitle, _rectangles, _highlight, div_name) {

	var params;
	
	var main = {};
	
	// Variables section
	
	var source;
	var dataSource = _dataSource;	//a string filepath of a .csv file
	
	// Indicates the attr in the dataset. _attr needs to be an object with two properties:
	//	{all: an array of strings containing ALL of the column headings in the first row of the dataset, includes "" primary key field name,
	//	 use: an array of ints containing the column INDICIES of the attr to be plotted in the matrix. Does NOT include the attr to be used for encoding}
	var attr = _attr.all;
	var useAttr = _attr.use;
	
	// Indicates which attr will be used for encoding. Needs to be an object with three properties: 
	//	{name: string holding attr name,
	//	index: column # of attr,
	//	values: an array containing ALL possible values of this attr, string type}
	var category = {};
	category.name = _category.name;
	category.index = _category.index;
	var classes = _category.values;

	// Set up animation variables. _animate needs to be an object with one to two properties:
	//	{isAnimate: boolean indicating whether to animate the scatterplot,
	//	 animateNum: int indicating number of entries to draw at a time during each animation loop}
	var isAnimate = _animate.isAnimate;
	var animateStart = 0;
	var animateNum = 1;
	if (isAnimate && (typeof _animate.animateNum !== "undefined")) {
		animateNum = _animate.animateNum;
	}
	var initDraw = _animate.initDraw;
	
	var maxData = [];
	var minData = [];
	var midData = [];
	var rowCount;

	// formatting plot area
	var majorPad = 50;
	var gridWidth = 125;
	var tickLen = 3;
	var tickLabelDist = tickLen * 1.5;
	var subtitleDist = tickLen * 7;
	var labelPad;
	var plotX1, plotY1, plotX2, plotY2, xTitle, yTitle, xAxisLabelX, xAxisLabelY, yAxisLabelX, yAxisLabelY, xLegend, yLegend;
	var gridX, gridY;
	var textSizes = {
		title: 24,
		axisLabel: 8,
		axisTitle: 10,
		rect: 11,
		loadBar: 10,
		legendTitle: 16,
		legendLabel: 14,
		pauseButton: 12,
		speedToggle: 10
	};
	var canvasWidth;
	var canvasHeight;
	
	// legend-specific data for determining if a specific value of the encoding attr was clicked
	// values calculated in drawLegend()
	var keySize;
	var keyCenters = [];
	
	// variables tracking if user has brushed the data by clicking on a key in the legend
	var brushed = 0;
	var selected = [];
	var brushedColor = "rgb(217, 217, 217)";

	// Color for x and y axis label 
	var axisLabelTextColor = {
		highlight: "rgb(0, 0, 0)",		// when user mouse over a square in the matrix
		regular: "rgb(169, 169, 169)",
	};
	
	// Tracking info for highlighted axis label
	var axisLabelHighlight = {
		x: -1,
		y: -1,
		xPos: [],
		yPos: []
	};

	// Encoding used for plotting points. _encoding needs to be one of the following Strings:
	// filled_normal:  filled cirlces without color blending (default)
	// filled_blended: filled circles with color blending
	// alpha_blended:  filled circles with alpha blending
	// open:           unfilled circles with color outline
	var encoding = "filled_normal";
	if ((_encoding.toLowerCase() === "filled_blended") || (_encoding.toLowerCase() === "alpha_blended") || (_encoding.toLowerCase() === "open")) {
		encoding = _encoding.toLowerCase();
	}

	// encoding variables for plotted points
	var pointEncode = {
		filledStrokeWeight: 0.3,
		openStrokeWeight: 0.8,
		size: 4.5,
		colors: ['#8dd3c7','#fb8072','#80b1d3','#fdb462','#bc80bd','#b3de69','#fccde5','#d9d9d9','#ffffb3','#bebada'],
		blend: "darken",
		alpha: 125
	};
	
	// padding and element size for grid containing load bar, pause button, and speed toggles
	var elementPad = 0;
	var textPad = 0;
	var elementHeight = 0;
	var textHeight = 0;
	
	// stylistic attributes for %-loaded bar
	var loadBar = {
		x: 0,
		y: 0,
		textX: 0,
		textY: 0,
		width: 0,
		height: 0,
		strokeWeight: 0.5,
		stroke: "rgb(255, 255, 255)",
		fill: "rgb(169, 169, 169)",
		allLoaded: false
	};
	
	// stylistic attributes for pause/animate button
	var pauseButton = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		stroke: "rgb(255, 255, 255)",
		selectedFill: "rgb(169, 169, 169)",
		deselectedFill: "rgb(217, 217, 217)"
	}
	
	// variable tracking if user has paused the animation
	var paused = false;
	
	// stylistic attributes for animation speed slider
	var slider = {
		x: 0,
		y: 0,
		textX: 0,
		textY: 0,
		width: 0,
		fill: "rgb(169, 169, 169)"
	}
	
	// Frame rate
	var speed = 30;

	// Max number of points drawn per frame
	var maxPointsPerFrame = 500;
	
	// Set up focus rectangles. rectangles will be populated in setup loop using query string
	// Will be converted into object with following properties:
	//	{
	//		x: column index of x-axis attribute
	//		y: column index of y-axis attribute
	// 		xmin: start value of box along x-axis
	// 		ymin: start value of box along y-axis
	// 		xmax: start value of box along x-axis
	// 		ymax: start value of box along y-axis
	//	}
	var rectangles = [];
	var rectColor = "rgba(89, 89, 89, 1)";	
	var rectStrokeWeight = 1;

	// Set up highlight rectangle to be dragged around by user
	var highlightRect = {
		width: 30,
		height: 30,
		x: 0,
		y: 0,
		xAttr: 0,
		yAttr: 0,
		fill: '#252525',
		strokeWeight: 1,
		on: false,
		clicked: false
	};

	// Offscreen buffer and relevant info
	var buffers = {
		colorBuffer: null,
		greyBuffer: null		
	};
	
	// Display density
	var disp;
	
	// Helper functions section
	
	function drawGrid() {
		blendMode(REPLACE);
	    rectMode(CORNER);
	    noFill();
		strokeWeight(.5);
		stroke(169, 169, 169);
	
		for (var i = 0; i < gridY.length; i++) {
			for (var j = gridX.length - 1 - i; j >= 0; j--) {
				rect(gridX[j], gridY[i], gridWidth, gridWidth);
			}
		}
		
	}
	
	function resetPlotArea() {
		blendMode(REPLACE);
	    rectMode(CORNERS);
	    fill(255, 255, 255);
		strokeWeight(1);
		stroke(255, 255, 255);
		rect(plotX1, plotY1, plotX2 - gridWidth, plotY2);
		rect(plotX2 - gridWidth, plotY1, plotX2, yLegend - gridWidth);
		drawGrid();
		stroke(169, 169, 169);
		line(xLegend, yLegend, xLegend, yLegend + gridWidth);
	}
	
	function drawChartText() {
		// draw title
		textSize(textSizes.title);
		textAlign(CENTER, BOTTOM);
		fill(0);
		noStroke();
		text(_chartTitle, xTitle, yTitle);

	}

	function drawXAxisSubtitle(attrNum, highlight) {
		push();
		var textXPosition = axisLabelHighlight.xPos[attrNum];
		textSize(textSizes.axisTitle);
		strokeWeight(0.25);
		stroke(axisLabelTextColor.highlight);
		fill(axisLabelTextColor.highlight);
		textAlign(CENTER, CENTER);
		if (!highlight) {
			stroke(255, 255, 255);
			fill(255, 255, 255);
			text(attr[useAttr[attrNum]], textXPosition, plotY1 - subtitleDist);
			fill(axisLabelTextColor.regular);
			stroke(axisLabelTextColor.regular);
		}
		text(attr[useAttr[attrNum]], textXPosition, plotY1 - subtitleDist);
		pop();
	}
	
	function drawYAxisSubtitle(attrNum, highlight) {
		push();
		var textYPosition = axisLabelHighlight.yPos[attrNum];
		textSize(textSizes.axisTitle);
		strokeWeight(0.25);
		stroke(axisLabelTextColor.highlight);
		fill(axisLabelTextColor.highlight);
		rotate(-PI/2);
		textAlign(CENTER, CENTER);
		if (!highlight) {
			stroke(255, 255, 255);
			fill(255, 255, 255);
			text(attr[useAttr[attrNum]], -textYPosition, plotX1 - 1.5 * subtitleDist);
			fill(axisLabelTextColor.regular);
			stroke(axisLabelTextColor.regular);
		}
		text(attr[useAttr[attrNum]], -textYPosition, plotX1 - 1.5 * subtitleDist);
		pop();
	}

	function drawAxisLabels() {
		fill(169, 169, 169);
		stroke(169, 169, 169);
		textSize(textSizes.axisLabel);
		strokeWeight(0.25);
	
		for (var count = 0; count < useAttr.length; count++) {
		
			var reversedCount = useAttr.length - count - 1;
			var labels = [];
			labels.push(minData[useAttr[count]]);
			labels.push(midData[useAttr[count]]);
			labels.push(maxData[useAttr[count]]);
	
			for (var i = 0; i < labels.length; i++) {
			
				var label = labels[i];
				if (label < 10) {
					label = label.toFixed(1);
				}
				var labelText = label;
			
				//x-axis labels
				if (count !== 0) {
					var x = map(label, labels[0], labels[2], plotX1 + reversedCount * gridWidth + labelPad, plotX1 + (reversedCount + 1) * gridWidth - labelPad);
					var y = plotY1 - tickLen;
					textAlign(CENTER, BOTTOM);
					// change values >= 1000 to K
					if (label >= 1000) {
						labelText = (label/1000).toFixed(1);
						labelText = labelText + "K";
					}
					text(labelText, x, plotY1 - tickLabelDist);
				
					// draw axis subtitle
					if (i === 1) {
						axisLabelHighlight.xPos[count] = x;
						drawXAxisSubtitle(count, false);
					}
				
					stroke(0,0,0);
					line(x, y, x, y + tickLen);
					noStroke();
				}
			
				//y-axis labels
				if (count !== useAttr.length - 1) {
					y = map(label, labels[0], labels[2], plotY1 + (count + 1) * gridWidth - labelPad, plotY1 + count * gridWidth + labelPad);
					x = plotX1 - tickLen;
					textAlign(RIGHT, CENTER);
					text(labelText, plotX1 - tickLabelDist, y);
				
					// draw axis subtitle
					if (i === 1) {
						axisLabelHighlight.yPos[count] = y;
						drawYAxisSubtitle(count, false);
					}
				
					stroke(0,0,0);
					line(x, y, x + tickLen, y);
					noStroke();
				}	

			}
		
		}
	
	}
	
	function drawRects(strokeColor) {
		blendMode(REPLACE);
		stroke(strokeColor);
		strokeWeight(rectStrokeWeight);		
		textSize(textSizes.rect);
		rectMode(CORNER);
		var count = 0;
		
		rectangles.forEach(function(r) {
			noFill();
			var row = useAttr.indexOf(r.y);
			var col = useAttr.length - 1 - useAttr.indexOf(r.x);
			var x1 = map(r.xmin, minData[r.x], maxData[r.x], gridX[col] + labelPad, gridX[col] + gridWidth - labelPad);
			var y1 = map(r.ymin, minData[r.y], maxData[r.y], gridY[row] + gridWidth - labelPad, gridY[row] + labelPad);
			var x2 = map(r.xmax, minData[r.x], maxData[r.x], gridX[col] + labelPad, gridX[col] + gridWidth - labelPad);
			var y2 = map(r.ymax, minData[r.y], maxData[r.y], gridY[row] + gridWidth - labelPad, gridY[row] + labelPad);
			rect(x1, y2, x2 - x1, y1 - y2);
			
			// draw label for rectangle
			textAlign(CENTER,TOP);
			fill(strokeColor);
			// strokeWeight(0.25);
			// if (count <= 1) {
			// 	fill(rectStrokeWeight);
			// }
			text(++count, (x2 + x1)/2, y1);
		});
		
		blendMode(BLEND);

	}

	// Draw highlight rectangle (for user study purpose only)
	function drawHighlightRect(strokeColor) {
		blendMode(REPLACE);
		noFill();
		stroke(strokeColor);
		strokeWeight(highlightRect.strokeWeight);
		rectMode(CENTER);
		rect(highlightRect.x, highlightRect.y, highlightRect.width, highlightRect.height);
	}
	
	function setHighlightRectCenter(x, y) {
		var xOffset = highlightRect.width/2;
		var yOffset = highlightRect.height/2;
		// set valid x value for center of highlightRect
		if (x < (plotX1 + xOffset)) {
			highlightRect.x = plotX1 + xOffset;
		} else if (x > (plotX2 - gridWidth - xOffset) && y > (yLegend - gridWidth - yOffset)) {
			highlightRect.x = plotX2 - gridWidth - xOffset;
		} else if (x > (plotX2 - yOffset)) {
			highlightRect.x = plotX2 - xOffset;
		} else {
			highlightRect.x = x;
		}
		// set valid y value for center of highlightRect
		if (y < (plotY1 + yOffset)) {
			highlightRect.y = plotY1 + yOffset;
		} else if (y > (plotY2 - yOffset)) {
			highlightRect.y = plotY2 - yOffset;
		} else {
			highlightRect.y = y;
		}
	}
	
	function drawLoadBar(percentDrawn) {
		
		// draw white rectangle to wipe area clean
		rectMode(CORNER);
		blendMode(REPLACE);
		stroke(255, 255, 255);
		fill(255, 255, 255);
		rect(loadBar.x, loadBar.y - textPad - textHeight, gridWidth, textHeight + textPad + elementHeight);
		
		// draw rectangle box
		strokeWeight(loadBar.strokeWeight);
		stroke(loadBar.fill);
		noFill();
		rect(loadBar.x, loadBar.y, loadBar.width, loadBar.height);

		// draw text
		textSize(textSizes.loadBar);
		fill(loadBar.fill);
		noStroke();
		textAlign(LEFT, CENTER);
		if (initDraw || loadBar.allLoaded) {
			text("% data animated", loadBar.textX, loadBar.textY);
		} else {
			text("% data displayed", loadBar.textX, loadBar.textY);
		}
		
		noStroke();
		fill(loadBar.fill);
		
		// draw line when all data are loaded (including when initDraw is true)
		if (loadBar.allLoaded || initDraw) {
			rect(loadBar.x, loadBar.y, loadBar.width, loadBar.height);
			stroke(255, 255, 255);
			line(loadBar.x + loadBar.width * percentDrawn, loadBar.y, loadBar.x + loadBar.width * percentDrawn, loadBar.y + loadBar.height);
		} else {
			rect(loadBar.x, loadBar.y, loadBar.width * percentDrawn, loadBar.height);
		}
		
	}

	function drawLegend() {
	
		var padding = gridWidth/6;
		var yBands = (gridWidth - padding * 2)/(classes.length + 1);
		keySize = yBands * 0.6;
	
		//draw rectangle around legend box
		rectMode(CORNER);
		fill(255);
		strokeWeight(.5);
		stroke(169, 169, 169);
		rect(xLegend, yLegend, gridWidth, gridWidth);
	
		//legend title
		textSize(textSizes.legendTitle);
		textAlign(CENTER, BOTTOM);
		fill(128, 128, 128);
		noStroke();
		text(category.name, xLegend + gridWidth/2, yLegend + padding + yBands/2);
	
		//legend key
		textSize(textSizes.legendLabel);
		for (var i = 0; i < classes.length; i++) {
			var cat = classes[i];
			// Change color to grey for brushed out categories if brushing has been enabled
			if (brushed > 0 && selected.indexOf(cat) < 0) {
				fill(brushedColor);
			} else {
				var pointFill = pointEncode.colors[i];
				if (encoding === "alpha_blended") {
					pointFill = addAlpha(pointFill);
				}
				fill(pointFill);
			}
			textAlign(LEFT, CENTER);
			text(cat, xLegend + padding + keySize, yLegend + padding + yBands * (i + 1) + yBands/2);
			rectMode(CENTER);
			var centerX = xLegend + padding;
			var centerY = yLegend + padding + yBands * (i + 1) + yBands/2;
			rect(centerX, centerY, keySize, keySize);
			keyCenters[i] = [centerX, centerY];
		}
	
	}
	
	// Draw a point with specified fill at specified location
	// If buffer is provided, point will be drawn to buffer
	// Otherwise, point will be drawn on-screen
	function drawPoint(x, y, pointFill, buffer) {
		
		if (encoding === "alpha_blended") {
			pointFill = addAlpha(pointFill);
		}
		
		if (buffer === undefined) {
			
			if(encoding === "open") {
				strokeWeight(pointEncode.openStrokeWeight);
				stroke(pointFill);
				noFill();
				ellipse(x, y, pointEncode.size, pointEncode.size);
			} else {
				strokeWeight(pointEncode.filledStrokeWeight);
				stroke(255);
				if(encoding === "filled_blended") {
					noFill();
					ellipse(x, y, pointEncode.size, pointEncode.size);
					fill(pointFill);
					blendMode(pointEncode.blend);
					ellipse(x, y, pointEncode.size, pointEncode.size);
					blendMode(BLEND);
				} else {
					fill(pointFill);
					ellipse(x, y, pointEncode.size, pointEncode.size);
				}
			}

		} else {
			
			if(encoding === "open") {
				buffer.strokeWeight(pointEncode.openStrokeWeight);
				buffer.stroke(pointFill);
				buffer.noFill();
				buffer.ellipse(x, y, pointEncode.size, pointEncode.size);
			} else {
				buffer.strokeWeight(pointEncode.filledStrokeWeight);
				buffer.stroke(255);
				if(encoding === "filled_blended") {
					buffer.noFill();
					buffer.ellipse(x, y, pointEncode.size, pointEncode.size);
					buffer.fill(pointFill);
					buffer.blendMode(pointEncode.blend);
					buffer.ellipse(x, y, pointEncode.size, pointEncode.size);
					buffer.blendMode(BLEND);
				} else {
					buffer.fill(pointFill);
					buffer.ellipse(x, y, pointEncode.size, pointEncode.size);
				}
			}
			
		}
		
	}
	
	// If encoding use is alpha blending, adds alpha value to color given as
	// a String and return the color
	function addAlpha(colorString) {
		var c = color(colorString);
		var rVal = red(c);
		var gVal = green(c);
		var bVal = blue(c);
		return color(rVal, gVal, bVal, pointEncode.alpha);
	}
	
	function plotData(animate) {
		
		fill(0);
		var numData = 0;
		var startIndex = 0;
	
		//determine number of rows to use based on whether we're animating
		if (animate) {
			numData = animateNum;
			startIndex = animateStart;
		} else {
			numData = rowCount;
		}

		for (var data = startIndex; data < (startIndex + numData); data++) {
			var adjusted = data % rowCount;
			for (var row = 0; row < gridY.length; row++) {
				var cat = source.getString(adjusted, category.name);
				var attrY = useAttr[row];
				var y = map(source.getNum(adjusted, attrY), minData[attrY], maxData[attrY], gridY[row] + gridWidth - labelPad, gridY[row] + labelPad);					
				for (var col = 0; col < (gridX.length - row); col++) {
					var attrX = useAttr[useAttr.length - col - 1];
					var x = map(source.getNum(adjusted, attrX), minData[attrX], maxData[attrX], gridX[col] + labelPad, gridX[col] + gridWidth - labelPad);
					// Draw point to color buffer first
					var pointFill = pointEncode.colors[classes.indexOf(cat)];
					drawPoint(x, y, pointFill, buffers.colorBuffer);
					// Draw grey point to grey buffer
					drawPoint(x, y, brushedColor, buffers.greyBuffer);
					// Draw color point to class-specific buffer
					drawPoint(x, y, pointFill, buffers[cat]);
					if (animate) {
						// Change color to grey for brushed out categories if brushing has been enabled
						if (brushed && (selected.indexOf(cat) < 0)) {
							pointFill = brushedColor;
						}
						// Draw on screen live
						drawPoint(x, y, pointFill);
					}
				}	
			}			
		}
	
		if (animate) {
			animateStart += animateNum;
			if (animateStart >= rowCount) {
				loadBar.allLoaded = true;
			}
			animateStart = animateStart % rowCount;
			drawLoadBar(animateStart/rowCount);	
		} else {
			image(buffers.colorBuffer, 0, 0, canvasWidth * disp, canvasHeight * disp, 0, 0, canvasWidth, canvasHeight);
		}
	}
	
	function axisMin(origMin) {
		if (round(origMin) > 10) {
			origMin = round(origMin);
			origMin -= origMin % 5
		} else if (round(origMin) === 10) {
			origMin = round(origMin);
		}
		return origMin;
	}

	function axisMax(origMax) {
		if (round(origMax) > 10) {
			origMax = round(origMax);
			origMax = floor(origMax - origMax % 5 + 5);
		} else if (round(origMax) === 10) {
			origMax = round(origMax);
		}
		return origMax;
	}
	
	// Get rectangle attributes from query string if exists. Query string is a series of comma-separated integers in the following order:
	// x,y,xmin,ymin,xmax,ymax
	// for multiple rectangles, enter the attributes for the next rectangle after ymax, of the previous rectangle
	function getRectsParams() {
		
		if (typeof params.rects === "undefined") {
			return;
		}
		
		var paramArray = params.rects.split(',');
		
		if (paramArray.length % 6 !== 0) {
			return;
		}
	
		for (var i = 0; i < (paramArray.length/6); i++) {
			rectangles.push({
				x: +paramArray[i * 6],
				y: +paramArray[i * 6 + 1],
				xmin: +paramArray[i * 6 + 2],
				ymin: +paramArray[i * 6 + 3],
				xmax: +paramArray[i * 6 + 4],
				ymax: +paramArray[i * 6 + 5]
			});
		}
		
	}
	
	// Loads appropriate buffers after brushing enabled/disenabled
	function brushRedraw() {
		resetPlotArea();
		if (brushed === 0) {
			image(buffers.colorBuffer, 0, 0, canvasWidth * disp, canvasHeight * disp, 0, 0, canvasWidth, canvasHeight);
		} else {
			image(buffers.greyBuffer, 0, 0, canvasWidth * disp, canvasHeight * disp, 0, 0, canvasWidth, canvasHeight);
			for (var i = 0; i < brushed; i++) {
				if (encoding === "filled_blended" && i === 1) {
					blendMode(pointEncode.blend);
				}
				image(buffers[selected[i]], 0, 0, canvasWidth * disp, canvasHeight * disp, 0, 0, canvasWidth, canvasHeight);
			}
			blendMode(BLEND);
		}
	}
	
	// create event tracking entry object
	function getEventEntry(eventName, time, details) {
		var object = {};
		object.event = eventName;
		object.timestamp = time;
		object.details = details;
		return object
	}
	
	// p5 functions
	main.preload = function() {
		params = getURLParams();
		if (typeof params.source !== "undefined") {
			dataSource = params.source;
		}
		source = loadTable(dataSource, "csv", "header");
	}
	
	main.setup = function() {
		
		// update parameters from query string if exists
		if (typeof params.animateNum !== "undefined") {
			animateNum = +(params.animateNum);
		}
		
		if (typeof params.isAnimate !== "undefined") {
			isAnimate = (decodeURIComponent(params.isAnimate).toLowerCase() === "true");
		}
		
		if (typeof params.initDraw !== "undefined") {
			initDraw = (decodeURIComponent(params.initDraw).toLowerCase() === "true");
		}
		
		getRectsParams();
		
		if (typeof params.chartTitle !== "undefined") {
			_chartTitle = decodeURIComponent(params.chartTitle);
		}
		
		if (typeof params.attr !== "undefined") {
			attr = params.attr.split(',');
			attr = attr.map(function(d) {return decodeURIComponent(d); });
		}
		
		if (typeof params.useAttr !== "undefined") {
			useAttr = params.useAttr.split(',');
			useAttr = useAttr.map(function(d) {return +d; });
		}	
	
		if (typeof params.category !== "undefined") {
			var split = params.category.split(',');
			category.name = split[0];
			category.index = +split[1];
		}
		
		if (typeof params.classes !== "undefined") {
			classes = params.classes.split(',');
		}
		
		if (typeof params.scaleAmount !== "undefined") {
			scaleAmount = +(params.scaleAmount);
			majorPad *= scaleAmount;
			gridWidth *= scaleAmount;
			tickLen *= scaleAmount;
			tickLabelDist *= scaleAmount;
			subtitleDist *= scaleAmount;
			pointEncode.size *= scaleAmount;
			pointEncode.strokeWeight *= scaleAmount;
			for (var size in textSizes) {
				textSizes[size] *= scaleAmount;
			}
		}

		canvasWidth = gridWidth * (useAttr.length - 1) + 2 * majorPad;
		canvasHeight = gridWidth * (useAttr.length - 1) + 2.5 * majorPad;
		var canvas = createCanvas(canvasWidth, canvasHeight);
		background(255);
		rowCount = source.getRowCount();

		// Turn on draggable highlight rectangle for user study purposes
		if (_highlight !== "undefined" && _highlight.toLowerCase() === "true") {
			highlightRect.on = _highlight;
		}

		// if given, set parent div
		if (div_name !== "undefined") {
			canvas.parent(div_name);
		}
	
		//get min and max
		for (var i = 0; i < rowCount; i++) {
		
			// update min and max based on dataset
			for (var c = 0; c < useAttr.length; c++) {
			
				var data = source.getNum(i, useAttr[c]);
			
				if (i === 0) {
					minData[useAttr[c]] = axisMin(data);
					maxData[useAttr[c]] = axisMax(data);
				} else {
					if (axisMin(data) < minData[useAttr[c]]) {
						minData[useAttr[c]] = axisMin(data);
					}
					if (axisMax(data) > maxData[useAttr[c]]) {
						maxData[useAttr[c]] = axisMax(data);
					}
				}
		
			}
		
		}
	
		// update mid based on new min and max
		for (var i = 0; i < useAttr.length; i++) {
			midData[useAttr[i]] = (maxData[useAttr[i]] + minData[useAttr[i]])/2;
			if (midData[useAttr[i]] >= 10) {
				midData[useAttr[i]] = Math.round(midData[useAttr[i]]);
			}
		}
	
	    plotX1 = majorPad;
	    plotX2 = width - majorPad;
	    plotY1 = height - (width - 2 * majorPad) - majorPad;
	    plotY2 = height - majorPad;

		//gridWidth = (width - 2 * majorPad)/(useAttr.length - 1);
		labelPad = gridWidth * 0.1;	
		gridX = [];
		gridY = [];
		for (var i = 0; i < useAttr.length - 1; i++) {
			gridX.push(plotX1 + i * gridWidth);
			gridY.push(plotY1 + i * gridWidth);
		}
	
		xTitle = width/2;
		yTitle = 2*majorPad/3;
	
		xAxisLabelX = (plotX1 + plotX2)/2;
		yAxisLabelX = plotX1/2;
	    xAxisLabelY = height - 25;
		yAxisLabelY = (plotY1 + plotY2)/2;
	
		xLegend = plotX2 - gridWidth;
		yLegend = plotY1 + Math.min(useAttr.length - 2, 3) * gridWidth;

		if (highlightRect.on) {
			highlightRect.x = xLegend - gridWidth/2 + highlightRect.width/2;
			highlightRect.y = yLegend + highlightRect.height/2;
		}

		elementPad = gridWidth * 0.1;
		textPad = gridWidth * 0.03;
		elementHeight = gridWidth * 0.12;
		textHeight = gridWidth * 0.1;
		var infoBoxY = yLegend - gridWidth * 0.70;

		slider.textX = xLegend;
		slider.textY = infoBoxY + textHeight/2;
		slider.x = xLegend * 0.996;
		slider.y = infoBoxY + textHeight + textPad;
		slider.width = gridWidth * 0.75;

		pauseButton.width = gridWidth * 0.2;
		pauseButton.height = elementHeight;
		pauseButton.x = slider.x + gridWidth - pauseButton.width/2;
		pauseButton.y = slider.y + elementHeight/2;
		
		loadBar.textX = xLegend;
		loadBar.textY = infoBoxY + textHeight + textPad + elementHeight + elementPad + textHeight/2;
		loadBar.x = xLegend;
		loadBar.y = infoBoxY + textHeight + textPad + elementHeight + elementPad + textHeight + textPad;
		loadBar.width = gridWidth;
		loadBar.height = elementHeight;
		
		// Setting up offscreen buffers
		disp = displayDensity();
		buffers.colorBuffer = createGraphics(canvasWidth * disp, canvasHeight * disp);
		buffers.greyBuffer = createGraphics(canvasWidth * disp, canvasHeight * disp);
		// Class-specific buffers
		for (var i = 0; i < classes.length; i++) {
			var cat = classes[i];
			buffers[cat] = createGraphics(canvasWidth * disp, canvasHeight * disp);
		}
		
		//call noLoop unless doing animation
		if (!isAnimate) {
			noLoop();		
		} else {
			frameRate(speed);
			
			if (initDraw) {
				plotData(false);
				drawLoadBar(1);
			} else {
				drawLoadBar(0);				
			}

		}
	
		drawGrid();
		drawChartText();
		drawLegend();
		drawAxisLabels();
		
	}
	
	main.draw = function() {
		// Frame rate tracking info: can delete
		main.frameRate.n += 1;
		main.frameRate.runningTtl += frameRate();
		
		// Fix cursor symbol as arrow
		cursor(ARROW);
		
		plotData(isAnimate);
		if (rectangles.length >= 1) {
			drawRects("rgba(255, 255, 255, 1)")
			drawRects(rectColor);			
		}
		
		if (highlightRect.on) {
			drawHighlightRect(highlightRect.fill);
		}
	}

	// Below mouse events are mainly used for highlight box for user study purpose only
	
	// Function return value indicates whether highlightRect has been clicked by user
	// to be moved
	main.mousePressed = function() {
		
		if (!highlightRect.on) {
			return false;
		}
		
		var x = mouseX;
		var y = mouseY;
		
		// see if user clicked in highlight box
		if ((Math.abs(x - highlightRect.x) < highlightRect.width/2)
			&& (Math.abs(y - highlightRect.y) < highlightRect.height/2)) {
				highlightRect.clicked = true;
				brushRedraw();
				return true;
		} else {
			return false;
		}
		
	}
	
	// Function return value indicates whether highlightRect has been placed by user,
	// true only if user has previously clicked on highlightRect
	main.mouseReleased = function() {
		
		if (!highlightRect.on || !highlightRect.clicked) {
			return false;
		}
		
		var time = millis();
		var x = mouseX;
		var y = mouseY;
		
		setHighlightRectCenter(x, y);
		drawHighlightRect(highlightRect.fill);
		highlightRect.clicked = false;
		
		// Adjust to actual x and y values and store in highlightRect
		var col = Math.floor((x - plotX1)/gridWidth);
		var xAttr = useAttr.length - 1 - col;
		var yAttr = Math.floor((y - plotY1)/gridWidth);
		main.highlightRect.x = map(x, gridX[col] + labelPad, gridX[col] + gridWidth - labelPad, minData[xAttr], maxData[xAttr]);
		main.highlightRect.y = map(y, gridY[yAttr] + gridWidth - labelPad, gridY[yAttr] + labelPad, minData[yAttr], maxData[yAttr]);
		main.highlightRect.xAttr = attr[useAttr[xAttr]];
		main.highlightRect.yAttr = attr[useAttr[yAttr]];
		return true;
		
	}
	
	main.mouseMoved = function() {
		if (highlightRect.on && highlightRect.clicked) {
			brushRedraw();
			setHighlightRectCenter(mouseX, mouseY);
			drawHighlightRect(highlightRect.fill);
		}
		
		// axis label highlighting
		var xAttrRev = Math.floor((mouseX - plotX1)/gridWidth);
		var xAttr = useAttr.length - 1 - xAttrRev;
		var yAttr = Math.floor((mouseY - plotY1)/gridWidth);
		
		// mouseMoved gets called oddly before screen loads.
		// the above will therefore yield NaN
		// exit callback if that's the case
		if (xAttrRev !== xAttrRev || xAttr !== xAttr || yAttr !== yAttr) {
			return;
		}
		
		// Un-highlight axis labels
		if (axisLabelHighlight.x !== -1 && axisLabelHighlight.y !== -1 && (axisLabelHighlight.x !== xAttr || axisLabelHighlight.y !== yAttr)) {
			var currxAttrRev = useAttr.length - 1 - axisLabelHighlight.x;
			drawXAxisSubtitle(axisLabelHighlight.x, false);
			drawYAxisSubtitle(axisLabelHighlight.y, false);
		}
		
		// If valid mouse position, highlight axis labels
		if (xAttr < 0 || yAttr < 0 || (xAttr > useAttr.length - 1) || (yAttr > useAttr.length - 1) || xAttr <= yAttr) {
			axisLabelHighlight.x = -1;
			axisLabelHighlight.y = -1;
		} else if (axisLabelHighlight.x !== xAttr || axisLabelHighlight.y !== yAttr) {
			axisLabelHighlight.x = xAttr;
			axisLabelHighlight.y = yAttr;
			drawXAxisSubtitle(xAttr, true);
			drawYAxisSubtitle(yAttr, true);
		}
	}
	
	main.mouseDragged = function() {
		mouseMoved();
	}

	// Session tracking: array of event objects of form:
	// {
	//  event: one of the following: pause, play, brush, unbrush, rows per frame
	//  timestamp: number of milliseconds (thousandths of a second) since starting the program
	//  details: for brush or unbrush, name of class brushed/unbrushed;
	//           for speed, change in animate num
	// }
	main.session = [];
	
	// Highlight rectangle logging information
	main.highlightRect = {
		x: 0,
		y: 0
	};

	main.frameRate = {
		n: 0,
		runningTtl: 0
	};

	main.getAvgFrameRate = function(seconds) {
		main.frameRate.n = 0;
		main.frameRate.runningTtl = 0;
		setTimeout(function(){
			var thisN = main.frameRate.n;
			var thisTtl = main.frameRate.runningTtl;
			console.log("Avg. frame rate in the last " + seconds + " seconds: " + Math.round(thisTtl/thisN));
		}, 1000 * seconds);
	}
	
	return main;
	
}
