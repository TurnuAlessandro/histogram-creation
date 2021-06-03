
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import * as d3 from 'd3';
import { getRandomColor } from "./utils/randomColors";
import { v4 as uuidv4 } from 'uuid';
import { getWidth, getHeight } from "./utils/pageDimensions";
import encode from './utils/encode';
import getCorrectTextColor from "./utils/getCorrectTextColor";
import getImage from "./img/getImage";

let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let getLetter = () => letters[Math.floor(Math.random()*16)%letters.length];

function element(uuid, value, color){
    return {
        uuid,
        value: value ? value : Math.floor(Math.random() * 100 * 4 + 1), // +20 per evitare la presenza di zeri
        color: color ? color : getRandomColor(),
        name: `${getLetter()}${getLetter()}${getLetter()}${getLetter()}${getLetter()}`
    };
}

const transitionDuration = 100;

function Histogram({ title }) {
    let [dataMap, setDataMap] = useState(new Map());
    let wheel = useRef(null);
    let [wheelSpeed, setWheelSpeed] = useState(5);
    let addRectBtn = useRef(null);
    let addRandomRectBtn = useRef(null);
    let [svgWidth, setSvgWidth] = useState();
    let [svgHeight, setSvgHeight] = useState(550);
    let widthInput = useRef(null);
    let [currentElement, setCurrentElement] = useState(null);

    let margin = {
        top: 40,
        right: 20,
        bottom: 70,
        left: 40
    };
    let width = svgWidth - margin.left - margin.right;
    let height = svgHeight - margin.top - margin.bottom;

    let dataArray = [...dataMap.values()]
    let maxYvalue = d3.max(dataArray, d => d.value);

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
        dataMap.set(id, element(id, data?.value, data?.color));
        /*

                let newX = d3
                    .scaleBand()
                    .rangeRound([0, width])
                    .padding(0)
                    .domain([...dataMap.values()].map(x => x.name));


                // scale Y axis with transition
                d3.select('#yAxis')
                    .transition()
                    .duration(transitionDuration)
                    .call(d3.axisBottom(newX));*/

        // needed to scale all the other rects
        let newY = d3.scaleLinear()
            .range([0, height])
            .domain([d3.max([...dataMap.values()], d => d.value), 0])

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

    // onMount: used to initialize the map
    useEffect(() => {
        let initialMap = new Map();
        let id = 0;

        d3.range(Math.floor(Math.random()*30)).map(x => {
            id = uuidv4();
            initialMap.set(id, element(id));
        })
        setDataMap(initialMap);
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
        .domain(dataArray.map(x => x.name));


    // Y axis: scale and draw:
    let y = d3.scaleLinear()
        .range([0, height])
        .domain([d3.max(dataArray, d => d.value), 0])
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
        let oldValue = dataMap.get(uuid).value;

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
            setDataMap(oldMap => {
                let newMap = new Map(oldMap);
                let elementToModify = oldMap.get(uuid);
                elementToModify.value = newValue;
                newMap.set(uuid, elementToModify);
                return newMap;
            })
        }, transitionTime);
    }
    function highlightRect(uuid){

        d3.selectAll('rect')
            .attr('stroke-width', 0)
            .attr('stroke', null)
            .style('opacity', 1)
            .on('mouseover', function(actual, data){
                if(currentElement == data.uuid)
                    return;
                d3.select(this)

                    .attr('opacity', 0.6)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
            })
            .on('mouseleave', function(actual, data){
                if(!(currentElement != null && data.uuid == currentElement))
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke', null)
            })


        if(uuid == null)
            return

        d3.select(`#rect${encode(uuid)}`)
            .attr('stroke', 'black')
            .attr('stroke-width', '3px')
            .on('mouseleave', null)
            .on('mouseover', null)
    }




    function updateDataMap(newDataMap, transitionDuration = 400){
        const t = d3
            .select('#rectsContainer')
            .transition()
            .duration(transitionDuration)

        // update y axis value (scale domain)
        y.domain([d3.max([...newDataMap.values()].map(x => x.value)), 0]);

        d3.select('#yAxis')
            .transition()
            .duration(transitionDuration)
            .call(d3.axisLeft(y));


console.log('newDataMap.values()', [...newDataMap.values()])
        let newX = x.domain([...newDataMap.values()].map(x => x.name));



        d3
            .select('#rectsContainer')

            .selectAll('rect')
            // .data([...newDataMap.values()])
            .data(dataArray)
            .transition(t)
            //.merge([...newDataMap.values()])
            .delay((d, i) => i*20)
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

        d3
            .select('#xAxis')
            .transition()
            .duration(transitionDuration)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .attr('transform', 'translate(-20, 20) rotate(-70)');

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
            setDataMap(newDataMap)
        }, transitionDuration);
    }

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
                                dataMap.delete(data.uuid);
                                setDataMap(new Map(dataMap))
                                break;
                            case 'U+004E': // 'n' key
                                addRandomElementToMapAfterXuuid(data.uuid); // insertion after the current (this) element
                                break;
                            default:
                                break;
                        }
                    });

            })
            .on('mouseleave', function (actual, i) {
                if(!(currentElement != null && i.uuid == currentElement))
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
                setCurrentElement(old => {
                    return data.uuid == old ? null : data.uuid;
                })
                let str = `${getLetter()}${getLetter()}${getLetter()}${getLetter()}${getLetter()}`;

                let [a, ...b] = [...dataMap.entries()];

                updateDataMap(new Map([a, [str, element(str, 900)], ...b]), 1000)
            })
            .on('dblclick', function(actual, data){
                return;
// TODO delete
                let newDataMap = new Map(dataMap);
                newDataMap.delete(data.uuid);


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
            .on('wheel', function (wheelInfo, data){
                console.log('ehrrl')
                setCurrentElement(old => data.uuid)

                let newValue = data.value + (wheelInfo.deltaY < 0 ? -wheelSpeed : wheelSpeed);
                updateValue(data.uuid, newValue, 0);

            })
            .append('title')
            .html(d => `${d.name}: ${d.value}`)


        histogram.exit().remove();
    }, [dataMap, svgWidth]);



    useEffect(() => highlightRect(currentElement))

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
                                let dataArr = [...dataMap.values()].sort((x, y) => x.value > y.value);
                                let mapElement = dataArr.map(x => [x.uuid, x]);
                                updateDataMap(new Map(mapElement), 1000)
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
                            {currentElement ?

                                <div className='col'
                                     style={{
                                         paddingTop: 5,
                                         border: `1px solid black`,
                                         borderRadius: 15,
                                         backgroundColor: dataMap.get(currentElement)?.color,
                                         color: getCorrectTextColor(dataMap.get(currentElement)?.color)
                                     }}>
                                    <div style={{fontSize:16}}> Current Element:</div>
                                    <div
                                        className='container-fluid p-0'>
                                        <div className='row'>

                                            <div className='col-9'>
                                                {dataMap.get(currentElement)?.value}
                                            </div>
                                            <div className='col-3'>
                                                <div style={{
                                                    border: `1px solid ${getCorrectTextColor(dataMap.get(currentElement)?.color)}`,
                                                    borderRadius: '3px',
                                                    width: '30px',
                                                    float: 'right'
                                                }}>

                                                    <img
                                                        src={getImage(getCorrectTextColor(dataMap.get(currentElement)?.color) == 'white' ? 'whitePencil' : 'blackPencil')}
                                                        className='m-1'
                                                        width={20}
                                                        height={20}/>
                                                </div>

                                            </div>
                                        </div>
                                    </div>


                                    <hr className='my-2' style={{backgroundColor: getCorrectTextColor(dataMap.get(currentElement)?.color)}}/>


                                </div>
                                : 'not selected'}
                        </div>
                        <div className='row'>
                            <input
                                ref={wheel}
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                defaultValue={wheelSpeed}
                                onChange={() => {
                                    setWheelSpeed(parseInt(wheel.current.value))
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

export default Histogram;








