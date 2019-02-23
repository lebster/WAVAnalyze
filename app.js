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
        loadWavFile(data);
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

function WavFile(buffer){
    this.fullBuffer = buffer;
    this.descriptor = new BufferItem(buffer.slice(0, 4), types.text);
    this.chunkSize = new BufferItem(buffer.slice(4, 8), types.number);
    this.waveDesc = new BufferItem(buffer.slice(8, 12), types.text);
    this.fmtSubChunk = new BufferItem(buffer.slice(12, 16), types.text);
    this.subChunk1Size = new BufferItem(buffer.slice(16, 20), types.number);
    this.audioFormat = new BufferItem(buffer.slice(20, 22), types.number16);
    this.channels = new BufferItem(buffer.slice(22, 24), types.number16);
    this.sampleRate = new BufferItem(buffer.slice(24, 28), types.number);
    this.byteRate = new BufferItem(buffer.slice(28, 32), types.number);
    this.blockAlign = new BufferItem(buffer.slice(32, 34), types.number16);
    this.bitPerSample = new BufferItem(buffer.slice(34, 36), types.number16);
    this.dataSubChunkStart = new BufferItem(buffer.slice(36, 40), types.text);
    this.dataSubChunkSize = new BufferItem(buffer.slice(40, 44), types.number);
    this.soundData = new BufferItem(buffer.slice(44, this.dataSubChunkSize.getValue() + 44), types.number);
    this.restOfData = new BufferItem(buffer.slice(this.dataSubChunkSize.getValue() + 44, buffer.length), types.text);
}

WavFile.prototype.print = function(){
    Object.keys(this).forEach(key => {
        if (key !== 'soundData' && key !== 'fullBuffer') {
            console.log(key, this[key].getValue());
        } else {
            console.log(key, this[key].buffer.byteLength);
        }
    });
};

WavFile.prototype.printIt = function(){
    Object.keys(this).forEach(key => {
        if (key !== 'soundData' && key !== 'fullBuffer') {
            console.log(key, this[key]);
        } 
    });
};

WavFile.prototype.reBuildFullBuffer = function(){
    this.fullBuffer = Buffer.concat([
        this.descriptor.buffer,
        this.chunkSize.buffer,
        this.waveDesc.buffer,
        this.fmtSubChunk.buffer,
        this.subChunk1Size.buffer,
        this.audioFormat.buffer,
        this.channels.buffer,
        this.sampleRate.buffer,
        this.byteRate.buffer,
        this.blockAlign.buffer,
        this.bitPerSample.buffer,
        this.dataSubChunkStart.buffer,
        this.dataSubChunkSize.buffer,
        this.soundData.buffer,
        this.restOfData.buffer
    ]);
};

function loadWavFile(buffer) {
    var data = new WavFile(buffer);
    // data.dataSubChunkSize.buffer[0]= '00';
    // data.dataSubChunkSize.buffer[1]= '00';
    // data.dataSubChunkSize.buffer[2]= '00';
    // data.dataSubChunkSize.buffer[3]= '00';
     //data.soundData.buffer = Buffer.from(data.soundData.buffer.reverse());
     //data.soundData.buffer = Buffer.from(shuffle(data.soundData.buffer));
     data.reBuildFullBuffer();
     //console.log(data.fullBuffer.toString('hex'));
    fs.writeFile('temp.txt', data.fullBuffer.toString('base64'), function(err, data){
        if (err) throw err;
        console.log('file written');
    });
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
    
ask();