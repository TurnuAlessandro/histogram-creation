
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



    useEffect(() => {
        let initialMap = new Map(dataMap);
        let id = 0;

        d3.range(10).map(x => {
            id = uuidv4();
            initialMap.set(id, element(id));
        })

        setDataMap(initialMap);
    }, []);

    useLayoutEffect(() => {
        let data = [...dataMap.values()]
        if (Array.isArray(data)) {
            let margin = {
                top: 40,
                right: 30,
                bottom: 30,
                left: 40
            };
            let width = svgWidth - margin.left - margin.right;
            let height = svgHeight - margin.top - margin.bottom;

            let maxYvalue = d3.max(data, d => d.value);

            d3.select('#histogram svg').remove();
            let svg = d3.select("#histogram")
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.bottom + margin.top)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`)




            // X axis: scale and draw:
            var x = d3.scaleLinear()
                .domain([0, 100]) // axis y range
                .range([0, width]);//data.lenght]); // axis x range
            var xAxis = svg.append("g")
                            .attr("transform", "translate(0," + height + ")");
            xAxis.call(d3.axisBottom(x));


            // Y axis: scale and draw:
            var y = d3.scaleLinear()
                .range([0, height])
                .domain([d3.max(data, d => d.value), 0])
            let yAxis = svg.append("g");

            yAxis.call(d3.axisLeft(y));


            let translateX = width / (data.length);

            let histogram = svg.selectAll('rect')
                .data(data)
                .enter()
                .append('rect')
                .attr('x', (_, i) => i*translateX)
                .attr('y', (d, i) => y(d.value))
                .attr('width', (width) / (data.length > 0 ? data.length : 1))
                .attr('value', d => d.value)
                .attr('height', function(d) { return height - y(d.value); })
                .style('fill', d => d.color)
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

                                  if(value > maxYvalue){ // here the user changes the value with a value grater then the max value
                                      // update y axis value (scale domain)
                                      y.domain([value, 0]);
                                      yAxis.transition()
                                          .duration(transitionDuration)
                                          .call(d3.axisLeft(y));

                                      // update each rect
                                      d3.select('svg')
                                          .selectAll('rect')
                                          .transition()
                                          .duration(transitionDuration)
                                          .attr('y', d => y(d.value))
                                          .attr('height', d => height - y(d.value))

                                  }
                                  d3.select(this)
                                      .transition()
                                      .duration(transitionDuration)
                                      .attr('y', y(value))
                                      .attr('height', height - y(value))
                              }, 0);

                              // data update after all transition finish
                              setTimeout(() => {
                                  setDataMap(oldMap => {
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
                                      )
                                  d3
                                      .select(this)
                                      .raise()
                                      .attr('x', event.x)




                              })
                              .on('end', function dragEnded(){

                                  d3.select(this)
                                      .attr('stroke', null);


                                  //setDataMap(new Map(dataMap))
                              })

                      )
                  histogram.exit().remove();
        }
    }, [dataMap]);

    return (
        <>

            {/*<svg width={svgWidth} height={svgHeight} ref={containerRef}/>*/}

            <div id="histogram" />

            <div >
                <button
                    onClick={() => {
                        setDataMap(d => {
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
                        setDataMap(d => {
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








