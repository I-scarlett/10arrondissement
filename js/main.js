$(document).ready(function() {

	var markers;
    L.mapbox.accessToken = 'pk.eyJ1Ijoic3poYW5nMjQ5IiwiYSI6Im9jN0UtRWMifQ.vCDJzEeXrVAIOFVLSD3Afg';
    var map = L.mapbox.map('map', 'szhang249.i6n0bn3j');
    map.setView([48.878, 2.358], 15);

     
    
    
	$.getJSON("data/Locations3.geojson")
		.done(function(data) {

			var info = processData(data);
			createPropSymbols(info, data);
            //createLegend(info.min,info.max);
			createSliderUI(info.pages);
            menuSelection(info.SMs);
            
		})
		.fail(function() { alert("There has been a problem loading the data.")});

	function menuSelection(SMs) {
        var SMOptions = [];
        for (var index in SMs) {
            SMOptions.push("<input type=\"checkbox\" value=\""+ SMs[index] +"\">" + SMs[index] + "</input>");
        }
        
        $("#SubjectiveMarkers").html(SMOptions.join("<br />"));
    }
    
    function processData(data) {
        var pages = [];
        var pageTracker = [];
        var SMs = []
        var SMTracker = [];
        
        for (var feature in data.features) {

			var properties = data.features[feature].properties;

            if (pageTracker[properties.Page] === undefined) {
                pages.push(properties.Page);
                pageTracker[properties.Page] = 1;
            }
            
            if (SMTracker[properties.SM] === undefined) {
                SMs.push(properties.SM);
                SMTracker[properties.SM] = 1;
            }
		}
        return { 
            SMs : SMs,
            pages : pages.sort(function(a,b){return a - b}) 
        };
    }
    

    function createPropSymbols(info, data) {

		markers = L.geoJson(data, {

			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

                    fillColor: PropColor(feature.properties.SM),
				    color: PropColor(feature.properties.SM),
                    weight: 1,
				    fillOpacity: 0.8

                
                }).on({

					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: '#FFFFFF'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: PropColor(feature.properties.SM) });

					}
				});
			}
		}).addTo(map);

		updatePropSymbols();
        
	} // end createPropSymbols()
    
    
    function PropColor(UVIndex) {
        return "#c897d9";
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
    


    function updatePropSymbols() {

		markers.eachLayer(function(layer) {

			var props = layer.feature.properties;
			var	radius = calcPropRadius(props.SM);
			var	popupContent = " In Page: <b>" + props.Page + "</b><br>"
							   + "<i>" + props.SM +
							   "</i> in </i>" + props.Address + "</i>";
            
			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });
            layer.options.color = PropColor(props.SM);
            layer.options.fillColor = PropColor(props.SM);
		});
	} // end updatePropSymbols
    
	function calcPropRadius(attributeValue) {

		var scaleFactor = 0.3,
			area = attributeValue * attributeValue * scaleFactor;

		return 5;

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
	function createSliderUI(pages) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({'type':'range', 
                       'max': pages[pages.length-1], 
                       'min':pages[0], 
                       'step': 1,
                       'value': String(pages[0])})
            
		        .on('input change', function() {
		        	updatePropSymbols($(this).val().toString());
		            $(".temporal-legend").text(this.value);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(pages[0]);
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
