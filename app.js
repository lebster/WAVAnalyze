var fs = require('fs');
var readline = require('readline')

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask() {
    rl.question('What is the file path to the wav file?', (answer) => {
        if(answer === 'q'){
            rl.close();
        } else{
        readWavFile(answer);
        rl.close();
        }
    });
}

function readWavFile(filePath){
    //var readStream = fs.createReadStream(filePath);
    //readStream.pipe(process.stdout);
    fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        walkBuffer(data);
    });
}

var types = {
    text:'text',
    number:'number',
    number16:'number16',
};

function BufferItem (buffer, type){
    this.buffer = buffer;
    this.type = type;
}

BufferItem.prototype.getValue = function(){
    if (this.type === types.text) {
        return this.buffer.toString('utf8');
    } else if (this.type === types.number) {
        return Buffer.from(this.buffer).readInt32LE();
    } else if(this.type === types.number16){
        return Buffer.from(this.buffer).readInt16LE();
    }
};

function getSamples(buffer, bitPerSample) {

}

function walkBuffer(buffer) {
    var data = {
        descriptor: new BufferItem(buffer.slice(0, 4), types.text),
        chunkSize: new BufferItem(buffer.slice(4, 8), types.number),
        waveDesc: new BufferItem(buffer.slice(8, 12), types.text),
        fmtSubChunk: new BufferItem(buffer.slice(12, 16), types.text),
        subChunk1Size: new BufferItem(buffer.slice(16, 20), types.number),
        audioFormat: new BufferItem(buffer.slice(20, 22), types.number16),
        channels: new BufferItem(buffer.slice(22, 24), types.number16),
        sampleRate: new BufferItem(buffer.slice(24, 28), types.number),
        byteRate: new BufferItem(buffer.slice(28, 32), types.number),
        blockAlign: new BufferItem(buffer.slice(32, 34), types.number16),
        bitPerSample: new BufferItem(buffer.slice(34, 36), types.number16),
        dataSubChunkStart: new BufferItem(buffer.slice(36, 40), types.text),
        dataSubChunkSize: new BufferItem(buffer.slice(40, 44), types.number),
    };

    data.soundData = new BufferItem(buffer.slice(44, data.dataSubChunkSize.getValue() + 44), types.number);
    data.restOfData = new BufferItem(buffer.slice(data.dataSubChunkSize.getValue() + 44, buffer.length), types.text);

    Object.keys(data).forEach(key => {
        if (key !== 'soundData') {
            //console.log(key, data[key].buffer.toString('hex'));
            console.log(key, data[key].getValue());
        } else {
            console.log(key, data[key].buffer.byteLength);
        }
    });
    // for(var i = 0; i < chunkSize.length; i++){
    // console.log(chunkSize[i].toString(16).toUpperCase());
    // }
}

    
ask();