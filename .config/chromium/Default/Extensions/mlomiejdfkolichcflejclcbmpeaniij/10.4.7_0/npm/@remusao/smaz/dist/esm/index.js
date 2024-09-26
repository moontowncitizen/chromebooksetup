import { SmazCompress } from '../../../smaz-compress/dist/esm/index.js';
import { SmazDecompress } from '../../../smaz-decompress/dist/esm/index.js';

class Smaz {
    constructor(codebook, maxSize = 30000) {
        this.codebook = codebook;
        this.compressor = new SmazCompress(codebook, maxSize);
        this.decompressor = new SmazDecompress(codebook);
    }
    compress(str) {
        return this.compressor.compress(str);
    }
    getCompressedSize(str) {
        return this.compressor.getCompressedSize(str);
    }
    decompress(buffer) {
        return this.decompressor.decompress(buffer);
    }
}

export { Smaz };
