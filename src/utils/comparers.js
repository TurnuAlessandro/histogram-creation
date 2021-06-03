const COMPARERS = {
    'ALPHABETICAL':{
        'ASCENDING':{
            'CASE-SENSITIVE': (x, y) => x <= y,
            'CASE-INSENSITIVE': (x, y) => x.toLowerCase() <= y.toLowerCase()
        },
        'DESCENDING': {
            'CASE-SENSITIVE': (x, y) => x >= y,
            'CASE-INSENSITIVE': (x, y) => x.toLowerCase() >= y.toLowerCase()
        }
    },
    'NUMERICAL':{
        'ASCENDING': (x, y) => x <= y,
        'DESCENDING' : (x, y) => x >= y,
    }
}


export default function getComparer(dataType = String, dataOrder = 'ascending', caseSensitive = true){
    dataType = dataType ? dataType : String;

    dataOrder = dataOrder ? ['ascending', 'descending'].includes(dataOrder) ? dataOrder : 'ascending' : 'ascending';
    caseSensitive = caseSensitive ? [true, false].includes(caseSensitive) ? caseSensitive : true : true;

    let comp =  COMPARERS[dataType == String ? 'ALPHABETICAL' : 'NUMERICAL'][dataOrder == 'ascending' ? 'ASCENDING' : 'DESCENDING'];

    if(dataType == String){
        comp = comp[caseSensitive == true ? 'CASE-SENSITIVE' : 'CASE-INSENSITIVE']
    }

    return comp;
}