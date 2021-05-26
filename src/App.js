
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import * as d3 from 'd3';
import { getRandomColor } from "./utils/randomColors";
import { v4 as uuidv4 } from 'uuid';

function element(uuid){
        return {
            uuid,
            value: Math.floor(Math.random() * 100 + 20), // +20 per evitare la presenza di zeri
            color: getRandomColor()
        };
}

const transitionDuration = 1000;

function App() {
  const svgWidth = 1000;
  const svgHeight = 600;

  const [dataMap, setDataMap] = useState(new Map());
  const containerRef = useRef(null);

    const [data, setData] = useState(d3.range(300).map(x => Math.random()*100));

/*
    useEffect(() => {
        let initialMap = new Map(dataMap);
        let id = uuidv4();
        initialMap.set(id, element(id));
        id = uuidv4();
        initialMap.set(id, element(id));
        id = uuidv4();
        initialMap.set(id, element(id));
        setDataMap(initialMap);
    }, [null]);
*/
  useLayoutEffect(() => {
console.log(data)
    if (Array.isArray(data)) {
        let margin = {
            top: 40,
            right: 30,
            bottom: 30,
            left: 40
        };
        let width = svgWidth - margin.left - margin.right;
        let height = svgHeight - margin.top - margin.bottom;

        let svg = d3.select("#histogram")
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.bottom + margin.top)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
      //const histogram = d3.select('svg').selectAll('rect').data(data);




        // get the data
            // X axis: scale and draw:
            var x = d3.scaleLinear()
                .domain([0, 100]) // axis y range
                .range([0, width]);//data.lenght]); // axis x range
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // set the parameters for the histogram
           /* var histogram = d3.histogram()
                .value(d => d)   // I need to give the vector of value
                .domain(x.domain())  // then the domain of the graphic
                .thresholds(x.ticks(data.lenght)); // then the numbers of bins*/

            // And apply this function to data to get the bins
           // var bins = histogram(data);

            // Y axis: scale and draw:
            var y = d3.scaleLinear()
                .range([0, height])
                .domain([d3.max(data, d => d), 0])
            svg.append("g")
                .call(d3.axisLeft(y));
console.log("x", x, "y", y)
            // append the bar rectangles to the svg element

        let translateX = width / (data.length);

        svg.selectAll("rect")
                //.data(bins)
                .data(data)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", function(d, i) {
                    return `translate(${i*translateX},${y(d)})`; })
                .attr("width", function(d) {
                    return x(d)-20  ; })
                .attr('value', d=> d)
                .attr("height", function(d) { return height - y(d); })
                .style("fill", () => getRandomColor())


                .attr("width", (width) / (data.length > 0 ? data.length : 1))







/*


      histogram
          .enter()
          .append('rect')
          .merge(histogram)
          .attr('x', (_, i) => i * svgWidth/(data.length+1) + (100/data.length))
          .attr('transform', d => `translate(0,${svgHeight-(d.value * 300 / svgHeight)})`) // per allinearli tutti verso il basso
          .attr("width", (svgWidth-100) / (data.length + 1))
          .attr("height", d => d.value * 300 / svgHeight)
          .attr('fill', d => d.color)
          .on('mouseenter', function (actual, i) {
              d3.select(this)
                  .attr('opacity', 0.6)
          })
          .on('mouseleave', function (actual, i) {
              d3.select(this)
                  .attr('opacity', 1)
          })
          .on('click', function(actual, data){
              var response = prompt("Change value:", data.value);
              if (response == null || response == "") {
                  alert("You cancelled the prompt.");
                  return;
              }
              if(!isNaN(response)){
                  let value = parseFloat(response);

                  setTimeout(() => {
                      d3.select(this)
                          .transition()
                          .duration(transitionDuration)
                          .attr('transform', d => `translate(0,${svgHeight-(value * 300 / svgHeight)})`) // per allinearli tutti verso il basso
                          .attr("height", d => value * 300 / svgHeight);
                  }, 0);
                  setTimeout(() => {
                      setData(oldMap => {
                          let newMap = new Map(oldMap);
                          newMap.set(data.uuid, {
                              uuid: data.uuid,
                              color: data.color,
                              value: value
                          })
                          return newMap;
                      })
                  }, transitionDuration);
                  return;
              }
              alert("Something went wrong!");
          })
          .call(d3.drag()
                  .on('start', function dragStarted(){
                      d3.select(this)
                          .attr('stroke', 'black');
                  })
                  .on('drag', function dragged(event, d){

                      let newX;
                      // we need to understand where the mouse is, if it is on the first half of the element or on the second one
                      let elementMiddleX = parseFloat(d3.select(this).attr("width"))/2 + parseFloat(d3.select(this).attr("x")); // middle x of the element dragged
//TODO aggiustare sfarfallamento
                      // TODO consulta http://bl.ocks.org/AlessandraSozzi/9aff786dd04515d6b028
                      if(event.x < (elementMiddleX)) { // first half
                          newX = event.x - parseFloat(d3.select(this).attr("width"))/2;
                      }
                      else { // second half
                          newX = event.x - parseFloat(d3.select(this).attr("width"))/2;
                      }
                      d3.select(this)
                          .raise()
                          .attr('x',
                              newX
                          )/*
                      d3
                          .select(this)
                          .raise()
                          .attr('x', event.x)




                  })
                  .on('end', function dragEnded(){

                      d3.select(this)
                          .attr('stroke', null);


                      //setData(new Map(dataMap))
                  })

          )
      histogram.exit().remove();*/
    }
  }, [dataMap, data]);

  return (
      <>

          {/*<svg width={svgWidth} height={svgHeight} ref={containerRef}/>*/}

        <div id="histogram" />

        <div >
            <button
                onClick={() => {
                    setData(d => {
                        let newMap = new Map(d);
                        let id = uuidv4();
                        newMap.set(id, element(id));
                        return newMap;
                    })
                }}>
                ciaoo
            </button>
            <button
                onClick={() => {
                    setData(d => {
                        let newMap = new Map(d);
                        let id = uuidv4();
                        newMap.set(id, element(id));
                        return newMap;
                    })
                }}>
                ciaoo
            </button>
        </div>

      </>
  );
};

export default App;








