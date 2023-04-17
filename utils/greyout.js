// const { encoder, decoder } = require('tetris-fumen');

function greyout(fumenCodes) {
    let results = [];
    for (let code of fumenCodes) {
        try {
            let inputPages = decoder.decode(code);
            for (let i = 0; i < inputPages.length; i++) {
                board = inputPages[i]["_field"]["field"]["pieces"];
                for (let rowIndex = 0; rowIndex < 23; rowIndex++) {
                    for (let colIndex = 0; colIndex < 10; colIndex++) {
                        if (board[rowIndex * 10 + colIndex] != 0) board[rowIndex * 10 + colIndex] = 8;
                    }
                }
            }
            results.push(encoder.encode(inputPages));
        }
        catch (error) { console.log(code, error); }
    }
    return results;
}