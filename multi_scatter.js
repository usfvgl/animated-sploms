function multi_scatter(_dataSource, _attr, _category, _animate, _chartTitle) {

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
	if (isAnimate) {
		animateNum = animate.animateNum;
	}
	var initDraw = animate.initDraw;
	
	var maxData = [];
	var minData = [];
	var midData = [];
	var rowCount;

	// formatting plot area
	var majorPad = 55;
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
		legendLabel: 14
	};
	var canvasWidth;
	var canvasHeight;

	var pointEncode = {
		strokeWeight: 0.3,
		size: 4.5,
		colors: [
		"#EDC34B",	// yellow
		"#EE67AC",	// pink
		"#5DBA9E", // teal
		"#9D99C9", // purple
		"#929292",	// gray
		"#92C05F",	// green
		"#E48D4B"	// orange
		]
	};
	
	var loadBar = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		strokeWeight: 0.5,
		stroke: "rgb(255, 255, 255)",
		fill: "rgb(169, 169, 169)",
		allLoaded: false
	};
	
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
	
	// Helper function section
	
	function drawGrid() {
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
	
	function drawChartText() {
		// draw title
		textSize(textSizes.title);
		textAlign(CENTER, BOTTOM);
		fill(0);
		noStroke();
		text(_chartTitle, xTitle, yTitle);

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
						push();
						textSize(textSizes.axisTitle);
						stroke(128, 128, 128);
						text(attr[useAttr[count]], x, plotY1 - subtitleDist);
						pop();
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
						push();
						textSize(textSizes.axisTitle);
						stroke(128, 128, 128);
						rotate(-PI/2);
						textAlign(CENTER, CENTER);
						text(attr[useAttr[count]], -y, plotX1 - 1.5 * subtitleDist);
						pop();
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
	
	function drawLoadBar(percentDrawn) {
		
		// draw rectangle box
		rectMode(CORNER);
		blendMode(REPLACE);
		strokeWeight(loadBar.strokeWeight);
		stroke(loadBar.fill);
		noFill();
		rect(loadBar.x, loadBar.y, loadBar.width, loadBar.height);

		// draw text
		fill(255, 255, 255);
		stroke(255, 255, 255);
		rect(loadBar.x, loadBar.y - 30, loadBar.width, 30 - loadBar.strokeWeight);
		textSize(textSizes.loadBar);
		fill(loadBar.fill);
		noStroke();
		textAlign(LEFT, BOTTOM);
		if (initDraw || loadBar.allLoaded) {
			text("% data animated", loadBar.x, loadBar.y - 5);
		} else {
			text("% data displayed", loadBar.x, loadBar.y - 5);
		}
		
		noStroke();
		fill(loadBar.fill);
		rect(loadBar.x, loadBar.y, loadBar.width * percentDrawn, loadBar.height);
		
		// draw line when all data are loaded (including when initDraw is true)
		if (loadBar.allLoaded || initDraw) {
			stroke(loadBar.stroke);
			line(loadBar.x + loadBar.width * percentDrawn, loadBar.y, loadBar.x + loadBar.width * percentDrawn, loadBar.y + loadBar.height);
		}
		
	}

	function drawLegend() {
	
		var padding = gridWidth/6;
		var yBands = (gridWidth - padding * 2)/(classes.length + 1);
		var keySize = yBands * 0.6;
	
		//draw rectangle around legend box
		rectMode(CORNER);
		noFill();
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
			fill(pointEncode.colors[i]);
			textAlign(LEFT, CENTER);
			text(classes[i], xLegend + padding + keySize, yLegend + padding + yBands * (i + 1) + yBands/2);
			rectMode(CENTER);
			rect(xLegend + padding, yLegend + padding + yBands * (i + 1) + yBands/2, keySize, keySize);
		}
	
	}
	
	function plotData(animate) {
		
		fill(0);
		var numData = 0;
		var startIndex = 0;
		var buffer;
	
		//determine number of rows to use based on whether we're animating
		if (animate) {
			numData = animateNum;
			startIndex = animateStart;
		} else {
			numData = rowCount;
			buffer = createGraphics(canvasWidth, canvasHeight);
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
					
					if (animate) {
						strokeWeight(pointEncode.strokeWeight);
						stroke(255);
						fill(pointEncode.colors[classes.indexOf(cat)]);						
						ellipse(x, y, pointEncode.size, pointEncode.size);
					} else {
						buffer.strokeWeight(pointEncode.strokeWeight);
						buffer.stroke(255);
						buffer.fill(pointEncode.colors[classes.indexOf(cat)]);						
						buffer.ellipse(x/2, y/2, pointEncode.size/2, pointEncode.size/2);
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
			image(buffer, 0, 0);
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
			isAnimate = (params.isAnimate.toLowerCase() === "true");
		}
		
		if (typeof params.initDraw !== "undefined") {
			initDraw = (params.initDraw.toLowerCase() === "true");
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
			gridWidth = gridWidth * scaleAmount;
			pointEncode.size = pointEncode.size * scaleAmount;
			pointEncode.strokeWeight = pointEncode.strokeWeight * scaleAmount;
			for (var size in textSizes) {
				textSizes[size] *= scaleAmount;
			}
		}
		
		canvasWidth = gridWidth * (useAttr.length - 1) + 2 * majorPad;
		canvasHeight = gridWidth * (useAttr.length - 1) + 2.5 * majorPad;
		createCanvas(canvasWidth, canvasHeight);
		background(255);
		rowCount = source.getRowCount();
	
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
		
		loadBar.x = xLegend;
		loadBar.width = gridWidth;
		loadBar.height = gridWidth/10;
		loadBar.y = yLegend - gridWidth/10 - loadBar.height;
	
		//call noLoop unless doing animation
		if (!isAnimate) {
			noLoop();		
		} else {
			frameRate(60);
			
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
		
		var blah = createGraphics(canvasWidth, canvasHeight);
		// blah.background("yellow");
		// blah.fill(100);
		// blah.rect(0, 0, 50, 50);
		// blah.rect(50, 50, 50, 50);
		// image(blah, 0, 0);
		
	}
	
	main.draw = function() {
		plotData(isAnimate);
		if (rectangles.length >= 1) {
			drawRects("rgba(255, 255, 255, 1)")
			drawRects(rectColor);			
		}
	}

	return main;
	
}
