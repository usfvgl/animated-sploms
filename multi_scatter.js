function multi_scatter(_dataSource, _attr, _category, _animate, _encoding, _chartTitle) {

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
	var animateNum = 0;
	if (isAnimate) {
		animateNum = animate.animateNum;
	}
	
	var maxData = [];
	var minData = [];
	var midData = [];
	var rowCount;

	// formatting plot area
	var majorPad = 55;
	var gridWidth;
	var tickLen = 3;
	var tickLabelDist = tickLen * 1.5;
	var subtitleDist = tickLen * 7;
	var labelPad;
	var plotX1, plotY1, plotX2, plotY2, xTitle, yTitle, xAxisLabelX, xAxisLabelY, yAxisLabelX, yAxisLabelY, xLegend, yLegend;
	var gridX, gridY;

	// Set up encoding. _encoding needs to be a string with one of these values:
	// color_point, color_shape
	var pointEncode = {
		strokeWeight: 0.3,
		size: 4.5,
		colors: ["rgba(76, 114, 176, 1)", "rgba(85, 168, 104, 1)", "rgba(196, 78, 82, 1)", "rgba(129, 114, 178, 1)", "rgba(204, 185, 116, 1)"]
	};
	var shapeEncode = {
		stroke: pointEncode.colors[0],
		strokeWeight: 0.5,
		size: 4.5,
		shapes: [
			function(x, y, r) {
				ellipse(x, y, r, r);
			},
			function(x, y, r) {
				line(x, y - r/2, x, y + r/2);
				line(x - r/2, y, x + r/2, y);
			},
			function(x, y, r) {
				rectMode(CENTER);
				rect(x, y, r, r);
			},
			function(x, y, r) {
				triangle(x, y - r, x - 2*r/1.73, y + r, x + 2*r/1.73, y + r);
			},
			function() {
				quad(x, y - r, x + r, y, x, y + r, x - r, y);
			}
		]
	};
	
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
		textSize(24);
		textAlign(CENTER, BOTTOM);
		fill(0);
		noStroke();
		text(_chartTitle, xTitle, yTitle);

	}

	function drawAxisLabels() {
		fill(169, 169, 169);
		stroke(169, 169, 169);
		textSize(8);
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
						textSize(10);
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
						textSize(10);
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
		textSize(16);
		textAlign(CENTER, BOTTOM);
		fill(128, 128, 128);
		noStroke();
		text(category.name, xLegend + gridWidth/2, yLegend + padding + yBands/2);
	
		//legend key
		textSize(14);
		for (var i = 0; i < classes.length; i++) {
			fill(pointEncode.colors[i]);
			textAlign(LEFT, CENTER);
			text(classes[i], xLegend + padding + keySize, yLegend + padding + yBands * (i + 1) + yBands/2);
			rectMode(CENTER);
			rect(xLegend + padding, yLegend + padding + yBands * (i + 1) + yBands/2, keySize, keySize);
		}
	
	}
	
	function plotData(encoding, animate) {
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
			
					if (encoding === "color_point") {
						strokeWeight(pointEncode.strokeWeight);
						//noStroke();				//TODO change if want white stroke around circle
						stroke(255);
						fill(pointEncode.colors[classes.indexOf(cat)]);
						ellipse(x, y, pointEncode.size, pointEncode.size);
					} else if (encoding === "color_shape") {			
						stroke(pointEncode.colors[classes.indexOf(cat)]);
						strokeWeight(shapeEncode.strokeWeight);
						noFill();
						//Either circles or '+' marks: comment out unused one
						ellipse(x, y, shapeEncode.size, shapeEncode.size);
						//plusMark(x, y, shapeEncode.size);
					}
				
				}	
			}			
		}
	
		if (animate) {
			animateStart++;
			animateStart = animateStart % rowCount;
		}
	}
	
	function axisMin(origMin) {
		if (origMin > 10) {
			origMin -= origMin % 5
		}
		return floor(origMin);
	}

	function axisMax(origMax) {
		if (origMax > 10) {
			origMax = floor(origMax - origMax % 5 + 5);
		}
		return origMax;
	}
	
	// p5 functions
	main.preload = function() {
		source = loadTable(dataSource, "csv", "header");
	}
	
	main.setup = function() {
		createCanvas(855, 900);
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

		gridWidth = (width - 2 * majorPad)/(useAttr.length - 1);
		labelPad = gridWidth * 0.1;	
		gridX = [];
		gridY = [];
		for (var i = 0; i < useAttr.length - 1; i++) {
			gridX.push(plotX1 + i * gridWidth);
			gridY.push(plotY1 + i * gridWidth);
		}
	
		xTitle = width/2;
		yTitle = plotY1 - majorPad;
	
		xAxisLabelX = (plotX1 + plotX2)/2;
		yAxisLabelX = plotX1/2;
	    xAxisLabelY = height - 25;
		yAxisLabelY = (plotY1 + plotY2)/2;
	
		xLegend = plotX2 - gridWidth;
		yLegend = plotY1 + Math.min(useAttr.length - 2, 3) * gridWidth;
	
		//call noLoop unless doing animation
		if (!isAnimate) {
			noLoop();		
		} else {
			frameRate(60);
			plotData(_encoding, false);
		}
	
		drawGrid();
		drawChartText();
		drawLegend();
		drawAxisLabels();
		
	}
	
	main.draw = function() {
		if (isAnimate) {
			console.log(frameRate());
		}
		plotData(_encoding, isAnimate);
	}

	return main;
	
}