
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
  const svgHeight = 300;

  const [dataMap, setData] = useState(new Map());
  const containerRef = useRef(null);


    useEffect(() => {
        let initialMap = new Map(dataMap);
        let id = uuidv4();
        initialMap.set(id, element(id));
        id = uuidv4();
        initialMap.set(id, element(id));
        id = uuidv4();
        initialMap.set(id, element(id));
        setData(initialMap);
    }, []);

  useLayoutEffect(() => {
    let data = [...dataMap.values()];

    if (Array.isArray(data)) {
      const histogram = d3.select('svg').selectAll('rect').data(data);
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
                          .attr('x', event.x)*/




                  })
                  .on('end', function dragEnded(){

                      d3.select(this)
                          .attr('stroke', null);


                      //setData(new Map(dataMap))
                  })

          )
      histogram.exit().remove();
    }
  }, [dataMap]);

  return (
      <>

        <svg width={svgWidth} height={svgHeight} ref={containerRef} />

        <div>
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
