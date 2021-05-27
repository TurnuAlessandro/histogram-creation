
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

const transitionDuration = 100;

function App() {
    const svgWidth = 600;
    const svgHeight = 600;

    let [dataMap, setDataMap] = useState(new Map());
    let wheel = useRef(null);
    let [wheelSpeed, setWheelSpeed] = useState(5);


    let margin = {
        top: 40,
        right: 30,
        bottom: 30,
        left: 40
    };
    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;

    let dataArray = [...dataMap.values()]
    let maxYvalue = d3.max(dataArray, d => d.value);


    d3.selection.prototype.first = function (){
        return d3.select(this.nodes()[0])
    }
    d3.selection.prototype.last = function (){
        return d3.select(this.nodes()[this.size()-1])
    }


    // Adds an element to the map at the end of the map => adds a rect after the last one
    function addRandomElementToMap(transitionDuration){
        let id = uuidv4();
        dataMap.set(id, element(id));

        let newY = d3.scaleLinear()
            .range([0, height])
            .domain([d3.max([...dataMap.values()], d => d.value), 0])


        d3.select('svg')
            .selectAll('rect')
            .transition()
            .duration(transitionDuration)
            .attr('x', (_, i) => i*(width / (dataArray.length+1)))
            .attr('y', (d, i) => newY(d.value))
            .attr('width', (width) / (dataArray.length+1 > 0 ? dataArray.length+1 : 1))
            .attr('value', d => d.value)
            .attr('height', function(d) { return height - newY(d.value); })

        // new rect creation, it must be put after the last rect, with overflow on the x axis
        let newRect = d3.select('svg')
                        .select('g')
                        .append('rect')
                        .attr('x', (dataMap.size-1)*(width / (dataArray.length)))//(dataMap.size)*(width / (dataArray.length)))
                        .attr('y', newY(dataMap.get(id).value))
                        .attr('width', (width) / (dataArray.length > 0 ? dataArray.length : 1))
                        .attr('value', dataMap.get(id).value)
                        .attr('height', height - newY(dataMap.get(id).value))
                        .attr('fill', dataMap.get(id).color)

        // move the new rect on its right position
        newRect.transition()
            .duration(transitionDuration)
            .attr('x', (dataMap.size-1)*(width / (dataArray.length+1)))
            .attr('width', (width) / (dataArray.length+1 > 0 ? dataArray.length+1 : 1))



        /*
                let histogram = svg.selectAll('rect')
                    .data([dataMap.get(id)])
                    .enter()
                    .append('rect')
                    .attr('x', (_, i) => i*translateX)
                    .attr('y', (d, i) => y(d.value))
                    .attr('width', (width) / (dataArray.length > 0 ? dataArray.length : 1))
                    .attr('value', d => d.value)
                    .attr('height', function(d) { return height - y(d.value); })
                    .style('fill', d => d.color)*/

        // console.log(d3.select('svg').selectAll('rect').last().transition().duration(1000).attr('width', width/2))

        setTimeout(() => setDataMap(new Map(dataMap)), transitionDuration);
    }

    function addRandomElementToMapAfterXuuid(xUuid){
        let dataMapEntries = dataMap.entries();

        let newMap = new Map();

        let newElementUuid = uuidv4();
        [...dataMapEntries].forEach(([k, v]) => {
            newMap.set(k, v);
            if(k == xUuid) {
                newMap.set(newElementUuid, element(newElementUuid))
            }
        })

        setDataMap(newMap);

    }

    useEffect(() => {
        let initialMap = new Map(dataMap);
        let id = 0;

        d3.range(3).map(x => {
            id = uuidv4();
            initialMap.set(id, element(id));
        })

        setDataMap(initialMap);



    }, []);



    useLayoutEffect(() => {



        if (Array.isArray(dataArray)) {


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
                .domain([d3.max(dataArray, d => d.value), 0])
            let yAxis = svg.append("g");

            yAxis.call(d3.axisLeft(y));


            let translateX = width / (dataArray.length);


            d3.select('body')
                .attr('focusable', 'true')
                .on('keydown', function(e) { // manage up, down and canc and n (or N) keys
                    if(e.keyIdentifier == 'U+004E'){ // 'n' key
                        addRandomElementToMap();

                    }
                });

            /* Function to update a value of a specified rect (d3 element)
            * (with transitions to other rects too) */
            let updateValue = (d3element, elementUuid, newValue, transitionTime) => {
                let oldValue = parseFloat(d3.select(d3element).attr('value'));

                if(newValue > maxYvalue){ // here the user changes the value with a value grater then the max value

                    // update y axis value (scale domain)
                    y.domain([newValue, 0]);
                    yAxis.transition()
                        .duration(transitionTime)
                        .call(d3.axisLeft(y));

                } else if(oldValue == maxYvalue){ // user decreases the value of the maximum rect
                    let secondMaxYvalue = d3.max([...dataArray].filter(x => x.value != oldValue), d => d.value);
                    let demainValue = 0;

                    /* if the user decides to decrease the maximum rect there are 2 scenarios:
                            1) newValue for the (old) maximum rect is less then the second maximum value
                                -> the (old) maximum rect is no longer the maximum rect
                            2) newValue for the (old) maximum rect is grater or equal then the second maximum value
                                -> the (old) maximum rect is still the maximum rect */
                    if(newValue < secondMaxYvalue){ // scenario 1)
                        demainValue = secondMaxYvalue;
                    } else { // scenario 2)
                        demainValue = newValue;
                    }

                    // update y axis value (scale domain)
                    y.domain([demainValue, 0]);
                    yAxis.transition()
                        .duration(transitionTime)
                        .call(d3.axisLeft(y));
                }

                // update each rect
                d3.select('svg')
                    .selectAll('rect')
                    .transition()
                    .duration(transitionTime)
                    .attr('y', d => y(d.value))
                    .attr('height', d => height - y(d.value));

                // update rect modified with new height
                d3.select(d3element)
                    .transition()
                    .duration(transitionTime)
                    .attr('y', y(newValue))
                    .attr('height', height - y(newValue));

                // data update after all transition finish
                setTimeout(() => {
                    setDataMap(oldMap => {
                        let newMap = new Map(oldMap);
                        let elementToModify = oldMap.get(elementUuid);
                        elementToModify.value = newValue;
                        newMap.set(elementUuid, elementToModify);
                        return newMap;
                    })
                }, transitionTime);
            }




            let histogram = svg.selectAll('rect')
                .data(dataArray)
                .enter()
                .append('rect')
                .attr('x', (_, i) => i*translateX)
                .attr('y', (d, i) => y(d.value))
                .attr('width', (width) / (dataArray.length > 0 ? dataArray.length : 1))
                .attr('value', d => d.value)
                .attr('height', function(d) { return height - y(d.value); })
                .style('fill', d => d.color)
                .on('mouseenter', function (event, data) {
                    d3.select(this)
                        .attr('opacity', 0.6)

                    let thisElement = this;

                    d3.select('body')
                        .attr('focusable', 'true')
                        .on('keydown', function(e) { // manage up, down and canc and n (or N) keys
                            switch (e.keyIdentifier) {
                                case 'Up':
                                    updateValue(thisElement, data.uuid, data.value+wheelSpeed, wheelSpeed*10)
                                    break;
                                case 'Down':
                                    updateValue(thisElement, data.uuid, data.value-wheelSpeed, wheelSpeed*10)
                                    break;
                                case 'U+0008': // delete key (to delete key)
                                    dataMap.delete(data.uuid);
                                    setDataMap(new Map(dataMap))
                                    break;
                                case 'U+004E': // 'n' key
                                    addRandomElementToMapAfterXuuid(data.uuid); // insertion after the current (this) element
                                    break;
                            }
                        });

                })
                .on('mouseover', function(actual, i){
                    d3.select(this)
                        .attr('stroke', 'black')
                        .attr('stroke-width', 3)
                })
                .on('wheel', function (wheelInfo, data){

                    d3.select(this).attr('stroke', 'black')
                    let newValue = data.value + (wheelInfo.deltaY < 0 ? -wheelSpeed : wheelSpeed);
                    updateValue(this, data.uuid, newValue, 0);

                })
                .on('mouseleave', function (actual, i) {
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke', null)

                    d3.select('body')
                        .attr('focusable', 'false')
                        .on('keydown', function(e) { // manage up, down and canc and n (or N) keys
                            if(e.keyIdentifier == 'U+004E'){ // 'n' key
                                addRandomElementToMap();
                            }
                        });
                })
                .on('click', function(actual, data){
                    var response = prompt("Change value:", data.value);
                    if (response == null || response == "") {
                        alert("You cancelled the prompt.");
                        return;
                    }
                    if(!isNaN(response)){

                        let value = parseFloat(response);


                        updateValue(this, data.uuid, value, 1000);
                        return;
                    }
                    alert("Something went wrong!");
                })
                .on('dblclick', function(actual, data){

                    let newDataMap = new Map(dataMap);
                    newDataMap.delete(data.uuid);

// TODO double click does not work yet, probably it's the alert on the event 'click'

                    d3.select(this)
                        .transition()
                        .duration(1000)
                        .attr('x', parseFloat(d3.select(this).attr('x'))+parseFloat(d3.select(this).attr('width'))/2)
                        .attr('width', 0)

                    setTimeout(() => setDataMap(newDataMap), 1000);
                    return newDataMap;




                    /*  Not working code to animate delete   */

                    /*

                    // Y axis: scale and draw:
                    var y = d3.scaleLinear()
                        .range([0, height])
                        .domain([d3.max(dataArray, d => d.value), 0])
                    yAxis.transition()
                        .duration(1000)
                        .call(d3.axisLeft(y));



                    d3.selectAll('rect').data([...newDataMap.values()].filter(x => x.uuid != data.uuid))
                        .transition()
                        .duration(1000)
                        .attr('x', (_, i) => i*(translateX = width / (dataArray.length-1)))
                        .attr('y', (d, i) => y(d.value))
                        .attr('width', (width) / (dataArray.length-1 > 0 ? dataArray.length-1 : 1))
                        .attr('value', d => d.value)
                        .attr('height', function(d) { return height - y(d.value); })
                        .style('fill', d => d.color)


                    setTimeout(() => setDataMap(oldMap => {
                        oldMap.delete(data.uuid);


                        return new Map(oldMap);
                    }), 1000) */

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
                    onClick={() => addRandomElementToMap(500)}>
                    ciaoo
                </button>
                <input
                    ref={wheel}
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    id="wheelController"
                    defaultValue={wheelSpeed}
                    onChange={() => {
                        setWheelSpeed(parseInt(wheel.current.value))
                    }}/>
                <div>
                    {wheelSpeed}</div>
            </div>

        </>
    );
};

export default App;








