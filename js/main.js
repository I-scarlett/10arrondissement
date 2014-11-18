$(document).ready(function() {
//
	var cities;
	var map = L.map('map', {
			center: [37.8, -96],
			zoom: 4,
			minZoom: 4
		});

	L.tileLayer(
		'http://{s}.acetate.geoiq.com/tiles/acetate/{z}/{x}/{y}.png', {
			attribution: 'Acetate tileset from GeoIQ'
	}).addTo(map);
    
    
    var layer = L.mapbox.tileLayer('examples.map-i86nkdio');
layer.on('ready', function() {
  // the layer has been fully loaded now, and you can
  // call .getTileJSON and investigate its properties
});

	$.getJSON("data/city-data.json")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info.timestamps, data);
			createLegend(info.min,info.max);
			createSliderUI(info.timestamps);

		})
		.fail(function() { alert("There has been a problem loading the data.")});

	function processData(data) {

		var timestamps = [];
		var	min = Infinity;
		var	max = -Infinity;

		for (var feature in data.features) {

			var properties = data.features[feature].properties;

			for (var attribute in properties) {

				if ( attribute != 'id' &&
					 attribute != 'name' &&
					 attribute != 'lat' &&
					 attribute != 'lon' )
				{
					if ( $.inArray(attribute,timestamps) ===  -1) {
						timestamps.push(attribute);
					}
					if (properties[attribute] < min) {
						min = properties[attribute];
					}
					if (properties[attribute] > max) {
						max = properties[attribute];
					}
				}
			}
		}
		return {
			timestamps : timestamps,
			min : Number(min),
			max : Number(max)
		}
	}  // end processData()
	function createPropSymbols(timestamps, data) {

		cities = L.geoJson(data, {

			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

                    fillColor: PropColor(Number(feature.properties[timestamps[0]])),
				    color: PropColor(Number(feature.properties[timestamps[0]])),
                    weight: 1,
				    fillOpacity: 0.8

                
                }).on({

					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: '#FFFFFF'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: PropColor(Number(feature.properties[timestamps[0]])) });

					}
				});
			}
		}).addTo(map);

		updatePropSymbols(timestamps[0]);
        
	} // end createPropSymbols()
    
    
    function PropColor(UVIndex) {
        if(UVIndex >= "11") {
            return  "#b765a5";
        }
        else if (UVIndex >= "8") {
            return "#e4320e";
        }
        else if (UVIndex >= "6") {
            return "#ed8f00";
        }
        else {
            return "#fff209";
        }
	} // end PropColor()
    


        function updatePropSymbols(timestamp) {

		cities.eachLayer(function(layer) {

			var props = layer.feature.properties;
			var	radius = calcPropRadius(props[timestamp]);
			var	popupContent = " UV Index: <b>" + String(props[timestamp]) + "</b><br>"
							   + "<i>" + props.name +
							   "</i> in </i>" + timestamp + "</i>";
            
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });
            layer.options.color = PropColor(Number(props[timestamp]));
            layer.options.fillColor = PropColor(Number(props[timestamp]));
		});
	} // end updatePropSymbols
    
	function calcPropRadius(attributeValue) {

		var scaleFactor = 0.3,
			area = attributeValue * attributeValue * scaleFactor;

		return area;

	} // end calcPropRadius
	function createLegend(min, max) {

		if (min < 4) {
			min = 4;
		}

		function roundNumber(inNumber) {

       		return Math.round(inNumber);
		}

		var legend = L.control( { position: 'bottomright' } );

		legend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend");
			var	symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
			var	classes = [roundNumber(min), roundNumber((max+min)/2), roundNumber(max)];
			var	legendCircle;
			var	lastRadius = 0;
			var  currentRadius;
			var  margin;

			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(legendContainer).append("<h2 id='legendTitle'>Annul average UV Index</h2>");

			for (var i = classes.length-1; i >= 0; i--) {

				legendCircle = L.DomUtil.create("div", "legendCircle");

				currentRadius = calcPropRadius(classes[i]);

				margin = -currentRadius - lastRadius - 3;

				$(legendCircle).attr("style", "width: " + currentRadius*2 +
					"px; height: " + currentRadius*2 +
					"px; margin-left: " + margin + 
                    "px; background: " + PropColor(classes[i]) );

				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

				$(symbolsContainer).append(legendCircle);

				lastRadius = currentRadius;

			}

			$(legendContainer).append(symbolsContainer);

			return legendContainer;

		};

		legend.addTo(map);
	} // end createLegend()
	function createSliderUI(timestamps) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({'type':'range', 
                       'max': timestamps[timestamps.length-1], 
                       'min':timestamps[0], 
                       'step': 1,
                       'value': String(timestamps[0])})
            
		        .on('input change', function() {
		        	updatePropSymbols($(this).val().toString());
		            $(".temporal-legend").text(this.value);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	} // end createSliderUI()
    
	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });

		temporalLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "temporal-legend");

			return output;
		}

		temporalLegend.addTo(map);
		$(".temporal-legend").text(startTimestamp);
	}	// end createTemporalLegend()
	
});
