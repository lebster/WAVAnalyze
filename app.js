var fs = require('fs');
var player = require('play-sound')(opts = {})

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
        //readWavFile(answer);
        readWavFile('/Users/lebster/Downloads/tolling-bell_daniel-simion.wav');
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
    this.soundData = new BufferItem(buffer.slice(44, this.dataSubChunkSize.getValue() + 44), types.number16);
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

WavFile.prototype.printSpecial = function(){
    Object.keys(this).forEach(key => {
        if (key === 'soundData') {
            console.log(key, this[key].buffer.byteLength, ' - ', this[key].buffer.slice(1000,1100).toString('hex'));
        }
        else if(key !== 'soundData' && key !== 'fullBuffer') {
            console.log(key, this[key].getValue(), ' - ', this[key].buffer.toString('hex') , ' - ', this[key].buffer.byteLength);
        } else {
            console.log(key, this[key].buffer.byteLength, ' - ', this[key].buffer.slice(0,10).toString('hex'));
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

     data.soundData.buffer = Buffer.from(data.soundData.buffer.slice(0,data.soundData.buffer.byteLength / 4));

     data.soundData.buffer = correctLength(data.soundData.buffer, 4);
     
     var left = copyBuffer(data.soundData.buffer);
     var right = copyBuffer(data.soundData.buffer);

     left = Buffer.from(reverse(removeChannel(left, false), 4));
     right = Buffer.from(removeChannel(right, true));
     //var right = removeChannel(data.soundData.buffer.slice(0),true);
     //var combined = Buffer.concat([left, right]);
     var combined = Buffer.concat([left, right], left.length + right.length);
     data.soundData.buffer = combined;
     console.log('asdf', left);

     var buf = Buffer.allocUnsafe(4);
     buf.writeInt32LE(data.soundData.buffer.byteLength);
     data.dataSubChunkSize.buffer = buf;
    // data.soundData.buffer = Buffer.from(removeChannel(data.soundData.buffer.slice(),0));

    //data.soundData.buffer = Buffer.from(data.soundData.buffer.reverse());
    //data.soundData.buffer = Buffer.from(shuffle(data.soundData.buffer));
    data.reBuildFullBuffer();
    data.printSpecial();
     //console.log(data.fullBuffer.toString('hex'));
    //writeToFile(data);
    writeToWavFile(data);
    playFile(data);
}

function playFile(wavFile){
    player.play('temp.wav', function(err){
        if(err && !err.killed) throw err;
    });
}
function writeToWavFile(wavFile){
    fs.writeFile('temp.wav', wavFile.fullBuffer, function(err, data){
        if (err) throw err;
        console.log('file written');
    });
}

function copyBuffer(buffer){
    return Buffer.from(buffer.toString('hex'),'hex');
}

function writeToFile(wavFile){
    fs.writeFile('temp.txt', wavFile.fullBuffer.toString('base64'), function(err, data){
        if (err) throw err;
        console.log('file written');
    });
}

function correctLength(buffer, blockSize){
     //correct length
     //should use block align size for % x
    switch (buffer.byteLength % blockSize) {
        case 1:
            buffer = Buffer.from(buffer.slice(0, buffer.byteLength - 1));
            break;
        case 3:
            buffer = Buffer.from(buffer.slice(0, buffer.byteLength - 3));
            break;
        case 2:
            buffer = Buffer.from(buffer.slice(0, buffer.byteLength - 2));
            break;
        default:
            break;
     }
     return buffer;

}

//channel 0 = left , 1 = right
function removeChannel(array, channel){
    var channelPos = 0;

    for(var i = 0; i <= array.length; i++){
        if(channelPos <= 1 && !channel){
            array[i] = 0;
        }
        if(channelPos >= 2 && channel){
            array[i] = 0;
        }

        channelPos++;
        if(channelPos === 4){
            channelPos = 0;
        }
    }
    return array;
}

function reverse(array, blockSize) {
    console.log(array.slice(0, 8));
    console.log(array.slice(array.length - 8, array.length));
    var len = array.length;
    var middle = Math.floor(len/2);
    var lower = 0;

    while( lower <= middle){
        var upper = len - lower - (blockSize);
        var pos = 0;
        while (pos <= 3){
            var l = array[lower + pos];
            array[lower+ pos] = array[upper + pos];
            array[upper+ pos] = l;
            pos++;
        }
        // var lowerv = array.slice(lower, lower + (blockSize - 1));
        // var upperV = array.slice(upper, upper + (blockSize - 1));
        // var argsl = [lower, lower+(blockSize - 1)].concat(upperV);
        // var argsu = [upper, upper+(blockSize - 1)].concat(lowerv);
        // console.log(len, lower, upper)
        // Array.prototype.splice.apply(array, argsl);
        // Array.prototype.splice.apply(array, argsu);


        lower = lower + blockSize;
    }
    console.log(array.slice(0, 8));
    console.log(array.slice(array.length - 8, array.length));
    return array;
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