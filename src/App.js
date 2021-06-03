
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import './styles.css';
import { v4 as uuidv4 } from 'uuid';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
import Histogram from "./Histogram";
import ModifiedHistogram from "./ModifiedHistogram";

let STYLES = {
    UL: {
        listStyleType: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#333333',
        '&:hover' : {backgroundColor: 'white'}
    },
    LI: {
        float: 'left',
        color: 'white'
    },
    LI_A: {
        display: 'block',
        color: 'white',
        textAlign: 'center',
        padding: '16px',
        textDecoration: 'none',
        hover:{
                backgroundColor: 'yellow'

            }
        }
    
}

STYLES = {}

function App(){
    return (
        <Router>
            <div>
                <nav>
                    <ul style={STYLES.UL}>
                        <li style={STYLES.LI}>
                            <Link to="/"><a style={STYLES.LI_A} > /ModifiedHistogram</a></Link>
                        </li>
                        <li style={STYLES.LI}>
                            <Link to="/h2"><a style={STYLES.LI_A}> /Histogram</a></Link>
                        </li>
                    </ul>
                </nav>

                {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
                <Switch>
                    <Route  path="/h2">
                        <Histogram key={uuidv4()} title="Histogram"/>
                    </Route>
                    <Route  path="/">
                        <ModifiedHistogram key={uuidv4()} title="Modified Histogram"/>
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}





export default App;








