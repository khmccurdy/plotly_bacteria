## Bacterial Sample Dashboard

### [View the app here!](https://plotly-homework.herokuapp.com/)

This project is a full-stack data-driven web application for visualizing datasets about bacterial samples. Data was collected and filtered from a SQLite database using Flask and Python, then used to drive visualizations using Plotly. The gauge plot is a version of Plotly's custom [Gauge Chart](https://plot.ly/javascript/gauge-charts/), modified to automate the tier count and associated color gradient. The app is deployed using Heroku. 

### Code Snippets of Note

Procedural coloration of gauge chart sectors based on a 3-color gradient

```javascript
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
// Inside the trace for the gauge's donut-chart...
        marker: { 
            colors: [...Plotly.d3.range(numLevels)
                        .map(x=>threeColorLerp(x/numLevels)),
                    "rgba(0,0,0,0)"],
        },
```