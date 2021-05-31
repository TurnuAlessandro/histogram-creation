//https://codepen.io/davidhalford/pen/ywEva?editors=0010

function getCorrectTextColor(hexBackgroundColor){

    /*
    From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast

    Color brightness is determined by the following formula:
    ((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000

I know this could be more compact, but I think this is easier to read/explain.

    */

    let threshold = 130; /* about half of 256. Lower threshold equals more dark text on dark background  */


    let cutHex = h => {
        return (h.charAt(0)=="#") ? h.substring(1,7) : h
    }

    let hexToR = h => {
        return parseInt((cutHex(h)).substring(0,2),16)
    }
    let hexToG = h => {
        return parseInt((cutHex(h)).substring(2,4),16)
    }
    let hexToB = h => {
        return parseInt((cutHex(h)).substring(4,6),16)
    }

    let hRed = hexToR(hexBackgroundColor);
    let hGreen = hexToG(hexBackgroundColor);
    let hBlue = hexToB(hexBackgroundColor);



    let cBrightness = ((hRed * 299) + (hGreen * 587) + (hBlue * 114)) / 1000;
    if (cBrightness > threshold){return "black";} else { return "white";}
}

export default getCorrectTextColor;












