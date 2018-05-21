var $dropDown = Plotly.d3.select("#selDataset");
var $metaPanel = Plotly.d3.select("#metadata-panel");

Plotly.d3.json("/names", (error, nameList)=>{
    if (error) return console.warn(error);
    for (var i=0; i<nameList.length; i++) {
        $dropDown.append("option").attr("value", nameList[i]).text(nameList[i]);
    }
    makePlots(nameList[0],true);
});

function optionChanged(dataset) {
    makePlots(dataset);
}

function makePlots(dataset, init=false){
    Plotly.d3.json(`metadata/${dataset}`, (error, response)=>{
        if(error) return console.warn(error);
        fillMetaData(response);
    });

    Plotly.d3.json(`wfreq/${dataset}`, (error, response)=>{
        if(error) return console.warn(error);
        gaugePlot(response, init);
    });
    Plotly.d3.json(`samples/${dataset}`,(error, response)=>{
        if(error) return console.warn(error);
        pieBubble(response, init);
    });
}

function fillMetaData(data){
    // console.log(Object.entries(data));
    var mdString = "";
    var pairs = Object.entries(data);
    for (var i=0; i<pairs.length;i++){
        mdString += `<p>${pairs[i][0]}: ${pairs[i][1]} </p>`
    }
    $metaPanel.html(mdString);
}

function pieBubble(sampleData, init=false){
    var pieData = sampleData[0];
    var pieLabels = pieData.otu_ids.slice(0,10);
    var pieValues = pieData.sample_values.slice(0,10);

    
    var bubbleY = pieData.sample_values.filter(x=>x>0);
    var bubbleX = pieData.otu_ids.slice(0,bubbleY.length);

    var pieDesc = [];
    var bubbleText = [];

    Plotly.d3.json("/otu", (error, response)=>{
        if(error) return console.warn(error);

        pieLabels.forEach((x)=>{
            pieDesc.push(response[x-1]);
        });

        bubbleX.forEach((x)=>{
            bubbleText.push(response[x-1]);
        });

        var tracePie = {
            labels: pieLabels,
            values: pieValues,
            hovertext: pieDesc,
            hoverinfo: "percent+text",
            type: "pie",
        };
        
        var pieLayout={};

        function sizeMap(x) {
            return Math.pow(x+3,0.9)
        }

        var traceBubble = {
            x: bubbleX,
            y: bubbleY,
            text: bubbleText,
            type: "scatter",
            mode: "markers",
            
            marker: {
                colorscale: "RdBu",
                size: bubbleY.map(sizeMap),
                color: bubbleX,
            }
        };

        var bubbleLayout = {
            xaxis: {
                title:"OTU ID"
            },
            yaxis: {
                range: [bubbleY[0]*-0.2,bubbleY[0]*2]
            }
        };

        if (init) {
            Plotly.plot("pie",[tracePie],pieLayout);
            Plotly.plot("bubble",[traceBubble],bubbleLayout);
        }else{
            var stylePie = {
                labels: [pieLabels],
                values: [pieValues],
                hovertext: [pieDesc],
            }
            Plotly.restyle("pie", stylePie);
            
            var styleBubble = {
                x:[bubbleX],
                y:[bubbleY],
                text:[bubbleText],
                marker: [{
                    colorscale: "RdBu",
                    size: bubbleY.map(sizeMap),
                    color: bubbleX,
                }]
            }

            Plotly.restyle("bubble",styleBubble);
            Plotly.relayout("bubble",bubbleLayout);
        }
    })
}

function gaugePlot(datum, init=false) {
    var level = datum;
    // console.log(level);
    var numLevels = 9;

    // Trig to calc meter point
    var degrees = 180 - (level)*180/numLevels,
        radius = .5;
    var radians = degrees * Math.PI / 180;
    var x = radius * Math.cos(radians);
    var y = radius * Math.sin(radians);

    var path = `M ${-y*0.04} ${x*0.04} L ${y*0.04} ${-x*0.04} L ${x} ${y} Z`;

    var traceDot = { type: 'scatter',
        x: [0], 
        y: [0],
        marker: {size: 15, color:'850000'},
        showlegend: false,
        name: 'Washing Frequency',
        text: level,
        hoverinfo: 'text'
    };

    var scaleLabels = [...Array(numLevels).keys()]
                        .map(x=>`${x}-${x+1}`)
                        .sort((a,b)=>true);
    function threeColorLerp(value){
        var color1 = [132,181,137];
        var color2 = [213,229,153];
        var color3 = [248,243,236];

        value = value < 0 ? 0: value;
        value = value > 1 ? 0: value;

        var ca = value < 0.5 ? color1: color2;
        var cb = value < 0.5 ? color2: color3;
        var v = value < 0.5 ? value*2 : value*2-1;

        var newColor = ca.map((x,i)=>x+(cb[i]-x)*v);

        return `rgb(${newColor[0]},${newColor[1]},${newColor[2]})`
    }
    var scaleColors = '';

    var traceScale = { 
        values: [...[...Array(numLevels).keys()].map(x=>50/numLevels), 50],
        rotation: 90,
        text: scaleLabels,
        textinfo: 'text',
        textposition:'inside',
        marker: { 
            colors: [...[...Array(numLevels).keys()]
                        .map(x=>threeColorLerp(x/numLevels)),
                    "rgba(0,0,0,0)"],
        },
        labels: [...scaleLabels, ' '],
        hoverinfo: 'none',
        hole: .5,
        type: 'pie',
        showlegend: false
    };

    var layout = {
        shapes:[{
            type: 'path',
            path: path,
            fillcolor: '850000',
            line: {
                color: '850000'
            }
            }],
        title: `Washing Frequency (per week)`,
        // height: 1000,
        // width: 1000,
        xaxis: {
            zeroline:false, 
            showticklabels:false,
            showgrid: false, 
            range: [-1, 1]
        },
        yaxis: {
            zeroline:false, 
            showticklabels:false,
            showgrid: false, 
            range: [-1, 1]
        },
    };

    if (init) {
        Plotly.plot("gauge",[traceDot,traceScale],layout);
    } else {
        var styleDot = {
            text: [level],
        }

        var newLayout = {
            shapes: layout.shapes,
        }
        Plotly.restyle("gauge", styleDot, 0);
        Plotly.relayout("gauge", newLayout);
    }
}
