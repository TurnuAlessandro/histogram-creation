
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import * as d3 from 'd3';
import { getRandomColor } from "./utils/randomColors";
import { v4 as uuidv4 } from 'uuid';
import { getWidth, getHeight } from "./utils/pageDimensions";
import encode from './utils/encode';
import getCorrectTextColor from "./utils/getCorrectTextColor";
import getImage from "./img/getImage";
import dataFile from './righe.csv';
import {csv} from 'd3-request';
import element from "./histogramElement";
import randRange from "./utils/randRange";


function getFromUuid(array, uuid){
    let names = array.map(x => x.uuid);

    if(!names.includes(uuid))
        return [null, null];

    let position = names.indexOf(uuid);
    return [array[position], position];
}

function ModifiedHistogram({ title }) {
    let [dataArray, setDataArray] = useState([]);
    let wheel = useRef(null);
    let [wheelSpeed, setWheelSpeed] = useState(5);
    let addRectBtn = useRef(null);
    let addRandomRectBtn = useRef(null);
    let [svgWidth, setSvgWidth] = useState();
    let [svgHeight, setSvgHeight] = useState(550);
    let widthInput = useRef(null);
    let [currentElementUuid, setCurrentElementUuid] = useState(null);

    let margin = {
        top: 40,
        right: 20,
        bottom: 70,
        left: 40
    };
    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;

    let maxYvalue = d3.max(dataArray, d => d.value);

    let [selectedElement, selectedElementIndex] = getFromUuid(dataArray, currentElementUuid)

    useEffect(() => {
        // On Component Mount
        function resizeHistogramContainer(){
            setSvgWidth((document.getElementById('histogram-container')?.clientWidth))
        }
        window.addEventListener('resize', resizeHistogramContainer)

        return () => {
            // On Component Dismount
            window.removeEventListener('resize', resizeHistogramContainer)
        }
    }, []);

    // Adds an element to the map at the end of the map => adds a rect after the last one
    function addRandomElementToMap(data, transitionDuration){
        let id = uuidv4();
        dataArray.push(element(id, data?.value, data?.color));


        // needed to scale all the other rects
        let newY = d3.scaleLinear()
            .range([0, height])
            .domain([d3.max(dataArray, d => d.value), 0])

        // scale Y axis with transition
        d3.select('#yAxis')
            .transition()
            .duration(transitionDuration)
            .call(d3.axisLeft(newY));

        // movement of the other rects
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
            .attr('x', (dataArray.length-1)*(width / (dataArray.length)))//(dataMap.size)*(width / (dataArray.length)))
            .attr('y', newY(dataArray[dataArray.length-1].value))
            .attr('width', (width) / (dataArray.length > 0 ? dataArray.length : 1))
            .attr('value', dataArray[dataArray.length-1].value)
            .attr('height', height - newY(dataArray[dataArray.length-1].value))
            .attr('fill', dataArray[dataArray.length-1].color)

        // move the new rect on its right position
        newRect.transition()
            .duration(transitionDuration)
            .attr('x', (dataArray.length-1)*(width / (dataArray.length+1)))
            .attr('width', (width) / (dataArray.length+1 > 0 ? dataArray.length+1 : 1))




        setTimeout(() => setDataArray([...dataArray]), transitionDuration);
    }
/*
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

        setDataArray(newMap);

    }*/

    // onMount: used to initialize the map
    useEffect(() => {/*
        let initialMap = new Map();
        let id = 0;

        d3.range(Math.floor(Math.random()*30)).map(x => {
            id = uuidv4();
            initialMap.set(id, element(id));
        })

        setDataArray(initialMap);*/
        setSvgWidth(parseInt(document.getElementById('histogram-container')?.clientWidth)); // if i put it in the default value of useState, histogram-container is not loaded yet, so it returns 0
    }, []);




    /*
        // X axis: scale and draw:
        var x = d3.scaleLinear()
            .domain([0, 1000]) // axis y range
            .range([0, width]);//data.lenght]); // axis x range*/

    let x = d3
        .scaleBand()
        .rangeRound([0, width])
        .padding(0.05)
        .domain(dataArray.map(x => {
            return x.name;
        }));


    // Y axis: scale and draw:
    let y = d3.scaleLinear()
        .range([0, height])
        .domain([d3.max(dataArray, d => d.value), 0])



    d3.select('body')
        .attr('focusable', 'true')
        .on('keydown', function(e) { // manage  n (or N) keys
            if(e.keyIdentifier == 'U+004E'){ // 'n' key
                addRandomElementToMap();
            }
        });

    /* Function to update a value of a specified rect (d3 element)
    * (with transitions to other rects too) */
    function updateValue(uuid, newValue, transitionTime){
        let d3element = d3.select(`#rect${encode(uuid)}`);
        let [oldValue, oldValueIndex] = getFromUuid(dataArray, uuid);
        oldValue = oldValue.uuid;

        if(newValue <= 0.5)
            newValue = 0.5


        if(newValue > maxYvalue){ // here the user changes the value with a value grater then the max value
            // update y axis value (scale domain)
            y.domain([newValue, 0]);
            d3.select('#yAxis')
                .transition()
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
            d3.select('#yAxis')
                .transition()
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
        d3element
            .transition()
            .duration(transitionTime)
            .attr('y', y(newValue))
            .attr('height', height - y(newValue));

        // data update after all transition finish
        setTimeout(() => {
            setDataArray(oldArray => {
                let newArray = [...oldArray]
                let [elementToModify, i] = getFromUuid(newArray, uuid);
                newArray[i].value = newValue;
                return newArray;
            })
        }, transitionTime);
    }
    function highlightRect(index){


        d3.selectAll('rect')
            .attr('stroke-width', 0)
            .attr('stroke', null)
            .style('opacity', 1)
            .on('mouseover', function(actual, data){
                if(selectedElement?.uuid == data.uuid)
                    return;
                d3.select(this)

                    .attr('opacity', 0.6)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
            })
            .on('mouseleave', function(actual, data){
                if(!(selectedElementIndex != null && selectedElement?.uuid == data.uuid))
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke', null)
            })



        if(index == null || index < 0 || index >= dataArray.length)
            return;


        let uuid = dataArray[index].uuid;


        d3.select(`#rect${encode(uuid)}`)
            .attr('stroke', 'black')
            .attr('stroke-width', '3px')
            .on('mouseleave', null)
            .on('mouseover', null)
    }


    function updateDataArray(newDataArray, transitionDuration = 400){
        const t = d3
            .select('#rectsContainer')
            .transition()
            .duration(transitionDuration)

        // update y axis value (scale domain)
        y.domain([d3.max(newDataArray.map(x => parseFloat(x.value))), 0]);

        d3.select('#yAxis')
            .transition()
            .duration(transitionDuration)
            .call(d3.axisLeft(y));


        x.domain(newDataArray.map(x => x.name));


        d3.select('#xAxis')
            .transition()
            .duration(transitionDuration)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'translate(-20, 20) rotate(-70)');



        d3
            .select('#rectsContainer')
            .selectAll('rect')
            .data(dataArray)
            .transition(t)
            //.delay((d, i) => i*20)
            .attr('x', d => x(d.name))
            .attr('width', x.bandwidth())
            .attr('y', (d, i) => y(d.value))
            .attr('height', d => height - y(d.value))
            .style('fill', d => d.color);


/*
        d3
            .select('#rectsContainer')
            .append('rect')


            .attr('width', x.bandwidth()/2)
            .attr('y', 10)
            .attr('height', 40)
            .style('fill', 'yellow')
            .transition().duration(transitionDuration)
            .attr('width', x.bandwidth())
            .style('fill', 'black')
*/

        /*
                d3
                    .select('#rectsContainer')
                    .append('rect')
                   // .transition(t)
                    //.delay((d, i) => i*20)
                    .attr('x', d => x(d.name))

                    .attr('width', x.bandwidth())
                    .attr('y', (d, i) => y(d.value))
                    .attr('height', d => height - y(d.value))
        */



        setTimeout(() => {
            setDataArray(newDataArray)
        }, transitionDuration);
    }


    useEffect(function(){
        csv(dataFile, function (error, data) {
            if (error) {
                console.log(error);
                return;
            }
            let r = [...d3.range(100).map(x => element(uuidv4()))];
            r = []
            setDataArray([...data.map((x, i) => {
                x.uuid = uuidv4();
                x.value = parseFloat(x.value);
                return x;
            }), ...r])
        })
    }, [])

    useLayoutEffect(() => {


        d3.select('#histogram svg').remove();

        let svg = d3.select("#histogram")
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.bottom + margin.top)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .attr('id', 'rectsContainer')






        var xAxis = svg.append("g")
            .attr('id', 'xAxis')
            .attr("transform", "translate(0," + height + ")");


        let yAxis = svg.append("g")
            .attr('id', 'yAxis');

        xAxis.call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'translate(-20, 20) rotate(-70)');

        yAxis.call(d3.axisLeft(y));




        let histogram = d3.select('#rectsContainer').selectAll('rect')
            .data(dataArray)
            .enter()
            .append('rect')
            .attr('x', (d, i) => x(d.name))
            .attr('y', (d, i) => y(d.value))
            .attr('id', d => `rect${encode(d.uuid)}`)
            .attr('width', x.bandwidth())
            .attr('height', function(d) { return height - y(d.value); })
            .style('fill', d => d.color)
            .on('mouseenter', function (event, data) {
                d3.select('body')
                    .attr('focusable', 'true')
                    .on('keydown', function(e) { // manage up, down and canc and n (or N) keys
                        switch (e.keyIdentifier) {
                            case 'Up':
                                updateValue(data.uuid, data.value+wheelSpeed, wheelSpeed*10)
                                break;
                            case 'Down':
                                updateValue(data.uuid, data.value-wheelSpeed, wheelSpeed*10)
                                break;
                            case 'U+0008': // delete key (to delete key)
                               /* dataMap.delete(data.uuid);
                                setDataArray(new Map(dataMap))*/
                                break;
                            case 'U+004E': // 'n' key
                              //  addRandomElementToMapAfterXuuid(data.uuid); // insertion after the current (this) element
                                break;
                            default:
                                break;
                        }
                    });

            })
            .on('mouseleave', function (actual, i) {
                if(!(selectedElementIndex != null && i.uuid == selectedElement?.uuid))
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
                setCurrentElementUuid(old => {
                    if(old == data.uuid)
                        return null
                    return data.uuid;
                })
            })
            .on('dblclick', function(actual, data){
                return;
// TODO delete
                /*
                let newDataMap = new Map(dataMap);


                newDataMap.delete(data.uuid);


                d3.select(this)
                    .transition()
                    .duration(1000)
                    .attr('x', parseFloat(d3.select(this).attr('x'))+parseFloat(d3.select(this).attr('width'))/2)
                    .attr('width', 0)

                setTimeout(() => setDataArray(newDataMap), 1000);
                return newDataMap;

*/


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


                setTimeout(() => setDataArray(oldMap => {
                    oldMap.delete(data.uuid);


                    return new Map(oldMap);
                }), 1000) */

            })
            .on('wheel', function (wheelInfo, data){
                setCurrentElementUuid(old => {
                  /*  if(old == data.uuid)
                        return null*/
                    return data.uuid;
                })

                let newValue = data.value + (wheelInfo.deltaY < 0 ? -wheelSpeed : wheelSpeed);
                updateValue(data.uuid, newValue, 0);

            })
            .append('title')
            .html(d => `${d.name}: ${d.value}`)


        histogram.exit().remove();
    }, [dataArray, svgWidth]);



    useEffect(() => highlightRect(selectedElementIndex))



    const titleBtn = title ? <button
        className='btn btn-outline-secondary disabled mr-3'
        style={{borderRadius: 0, borderRight: 0, borderLeft: 0}}>
        {title}
    </button> : null;
    return (
        <>
            <div className="container-fluid">
                <div className='row'>
                    <div className='col'>
                        {titleBtn}
                        <button
                            className='btn btn-outline-primary mr-3'
                            ref={addRectBtn}
                            onClick={() => {

                                addRandomElementToMap({value: 900}, 500)
                                addRectBtn.current.disabled = true;
                                setTimeout(() => addRectBtn.current.disabled = false, 500)
                            }}>
                            Add Rect
                        </button>
                        <button
                        className='btn btn-outline-primary mr-3'
                        ref={addRandomRectBtn}
                        onClick={() => {
                            addRandomElementToMap(null,500)
                            addRandomRectBtn.current.disabled = true;
                            setTimeout(() => addRandomRectBtn.current.disabled = false, 500)
                        }}>
                        Add Random Rect
                    </button>

                        <button
                            className='btn btn-outline-primary mr-3'
                            onClick={() => {
                                let dataArr = [...dataArray].sort((x, y) => x.value > y.value);
                                updateDataArray([...dataArr], 1000)
                            }}>
                            Add Random Rect
                        </button>

                        {/*[...dataMap.keys()].map(k => <div>{k} <span class={'text-danger'}>or</span> {encode(k)}</div>)*/}

                    </div>
                </div>
                <div className='row'>
                    <div className='col-12 col-md-8 p-0' id='histogram-container'>

                        <div id="histogram" />
                    </div>
                    <div
                        className='col-12 col-md-4 p-0 container'

                    >
                        <div
                            className='row'> <h4>Menu</h4></div>
                        <div
                            className='row'

                        >
                            {selectedElementIndex ?

                                <div className='col'
                                     style={{
                                         paddingTop: 5,
                                         border: `1px solid black`,
                                         borderRadius: 15,
                                         backgroundColor: selectedElement?.color,
                                         color: getCorrectTextColor(selectedElement?.color)
                                     }}>
                                    <div style={{fontSize:16}}> Current Element:</div>
                                    <div
                                        className='container-fluid p-0'>
                                        <div className='row'>

                                            <div className='col-9'>
                                                {selectedElement?.color}
                                            </div>
                                            <div className='col-3'>
                                                <div style={null/*{
                                                    border: '1px solid ' + getCorrectTextColor(selectedElement?.color,
                                                    borderRadius: '3px',
                                                    width: '30px',
                                                    float: 'right'
                                                }*/}>

                                                    <img
                                                        src={getImage(getCorrectTextColor(selectedElement?.color) == 'white' ? 'whitePencil' : 'blackPencil')}
                                                        className='m-1'
                                                        width={20}
                                                        height={20}/>
                                                </div>

                                            </div>
                                        </div>
                                    </div>


                                    <hr className='my-2' style={{backgroundColor: getCorrectTextColor(selectedElement?.color)}}/>


                                </div>
                                : 'not selected'}
                        </div>
                        <div className='row'>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                defaultValue={wheelSpeed}
                                onChange={(e) => {
                                    setWheelSpeed(parseInt(e.target.value))
                                }}/>{wheelSpeed}
                        </div>
                        <div>
                        </div>
                        <div className="input-group">
                            <div>
                                <label htmlFor="customRange1" className="form-label row">
                                    Example range
                                </label>
                            </div>
                            <div className="row">
                                <input type="range" className="form-range" id="customRange1" />
                            </div>
                        </div>
                    </div>
                </div>


                <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#exampleModal">
                    Launch demo modal
                </button>



            </div>




            <div class="modal fade bd-example-modal-lg" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ...
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary">Save changes</button>
                        </div>
                    </div>
                </div>
            </div>

        </>





    );
};

export default ModifiedHistogram;








