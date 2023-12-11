/*  @license GPL-2.0+ */
/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
"use strict";
/** Header Codes
 * S = sign bit, 0 = positive or 0, 1 = negative
 * 0000 - 0 or false
 * 0001 - 1 or true
 * 001S - 8 bit
 *
 * 010S - 16 bit
 * 011S - 32 bit
 *
 * 1000 - float
 * 1001 - single optional non null byte string
 * 1010 - 8 bit null-terminated string
 * 1011 - 16 bit null-terminated string
 *
 * 1100 - repeat again twice
 * 1101 - repeat again thrice
 * 1110 - repeat 4 + n times (0 <= n < 16)
 * 1111 - end of header
 */

/** An explanation of the new protocol - fasttalk 2.0
 * The new fasttalk system, named fasttalk 2.0, is designed to be backward compatible with fasttalk 1.0.
 * Instead of operating on a string, the data is put onto a Uint8Array, which makes it much faster.
 * The type indicators are also made shorter, changing from 1 byte to 4 bits, and special compressions for 0 and 1 and type repeats are also added, which reduced bandwidth usage.
 * 
 * The algorithm compresses an array of JavaScript numbers and strings into a single packets. Booleans are automatically casted to 0 and 1.
 * Each packet consists of two main parts: the header codes, and the data.
 * The header codes are 4 bit each, and there must be an even number of them.
 * In a packet, the header code always start and end with code 15 (0b1111). The actual headers are put between them. The starting code allows the client to instantly check to see which version of the protocol is used, and fall back if necessary. The encding codes allows the client to signal the start of the data section. Since there must be an even number of header codes, if there is an odd number of headers, there will be two code 15s at the end instead of only one.
 * 
 * When the data is being compressed, each element of the array is labeled to one of 12 types, which is the first 12 header codes in the table above. If more than 3 header codes of the same type is used, they are compressed into shorter blocks to indicate repeats.
 */
const protocol2 = {};
protocol2.decode = function (arraybuffer) {
    let isStart = true;
    let rawtypecodes = [];
    let lastTC = 0;
    let flagged = false;
    let dv = new DataView(arraybuffer);
    let dvi = 0;
    out: for (dvi = 0; ; ++dvi) {
        for (let j = 0; j < 2; ++j) {
            const halfbyte = j === 0 ? dv.getUint8(dvi) >> 4 : dv.getUint8(dvi) & 0b1111;
            if (flagged) {
                for (let i = 0; i < halfbyte + 4; ++i)
                    rawtypecodes.push(lastTC);
                flagged = false;
            } else if (halfbyte === 0b1111) {
                if (!isStart) break out;
                isStart = false;
            } else if (halfbyte < 0b1100) {
                lastTC = halfbyte;
                rawtypecodes.push(lastTC);
            } else if (halfbyte === 0b1100) {
                rawtypecodes.push(lastTC);
                rawtypecodes.push(lastTC);
            } else if (halfbyte === 0b1101) {
                rawtypecodes.push(lastTC);
                rawtypecodes.push(lastTC);
                rawtypecodes.push(lastTC);
            } else if (halfbyte === 0b1110) {
                flagged = true;
            }
        }
    }
    dvi++;
    const output = [];
    for (let i = 0; i < rawtypecodes.length; ++i) {
        const typecoderaw = rawtypecodes[i];
        switch (typecoderaw) {
            case 0b0000: output.push(0); break;
            case 0b0001: output.push(1); break;
            case 0b0010: output.push(dv.getUint8(dvi)); dvi += 1; break;
            case 0b0011: output.push(dv.getUint8(dvi) - 256); dvi += 1; break
            case 0b0100: output.push(dv.getUint16(dvi, true)); dvi += 2; break;
            case 0b0101: output.push(dv.getUint16(dvi, true) - 65536); dvi += 2; break;
            case 0b0110: output.push(dv.getUint32(dvi, true)); dvi += 4; break;
            case 0b0111: output.push(dv.getUint32(dvi, true) - 4294967296); dvi += 4; break;
            case 0b1000: output.push(dv.getFloat32(dvi, true)); dvi += 4; break;
            case 0b1001: { /* Single character string */
                const value = dv.getUint8(dvi++);
                if (value !== 0)
                    output.push(String.fromCharCode(value));
                else output.push("");
                break;
            }
            // Could these be faster if we built an array and then called String.fromCharCode with the spread operator?
            case 0b1010: {
                let s = '';
                let byte = 0;
                while (byte = dv.getUint8(dvi++)) {
                    s += String.fromCharCode(byte);
                }
                output.push(s);
                break;
            }
            case 0b1011: {
                let s = '';
                let byte = 0;
                while (byte = dv.getUint8(dvi++) | dv.getUint8(dvi++) << 8) {
                    s += String.fromCharCode(byte);
                }
                output.push(s);
                break;
            }
        }
    }
    return output;
}
protocol2.encode = function (data) {
    let lastTc = null;
    let nLast = 0;
    let typecodes = [];
    let rawtypecodes = [];
    let bodySize = 0;
    typecodes.push(0b1111)
    for (let i = 0; i < data.length; ++i) {
        const datum = data[i];
        let tC;
        if (datum === false || datum === 0) {
            tC = 0b0000;
        } else if (datum === true || datum === 1) {
            tC = 0b0001;
        } else if (Math.floor(datum) === datum) {
            const sbit = +(datum < 0);
            const abs = Math.abs(datum);
            /* Difference: 0 is encoded as "false" */
            if (abs <= 255) {
                bodySize += 1;
                tC = 0b0010 | sbit;
            } else if (abs <= 65535) {
                bodySize += 2;
                tC = 0b0100 | sbit;
            } else {
                bodySize += 4;
                tC = 0b0110 | sbit;
            }
        } else if (typeof datum === 'number') {
            bodySize += 4;
            tC = 0b1000;
        } else if (typeof datum === 'string') {
            if (datum.length <= 1) {
                bodySize += 1;
                tC = 0b1001;
            } else {
                for (let i = 0; i < datum.length; ++i) {
                    if (datum[i].charCodeAt(i) > 255) {
                        bodySize += 2 * datum.length + 1;
                        tC = 0b1011;
                        break;
                    }
                }
                bodySize += datum.length + 1;
                tC = 0b1010;
            }
        }
        rawtypecodes.push(tC);
        if (tC === lastTc) {
            nLast++;
        } else if (lastTc !== null) {
            typecodes.push(lastTc);
            for (; nLast > 19; nLast -= 15) {
                typecodes.push(0b1110);
                typecodes.push(0b1111);
            }
            switch (nLast) {
                case 0: break;
                case 1: typecodes.push(lastTc); break;
                case 3: typecodes.push(0b1101); break;
                case 2: typecodes.push(0b1100); break;
                default:
                    typecodes.push(0b1110);
                    typecodes.push(nLast - 4); break;
            }
            nLast = 0;
        }
        lastTc = tC;
    }
    typecodes.push(lastTc);
    for (; nLast > 19; nLast -= 15) {
        typecodes.push(0b1110);
        typecodes.push(0b1111);
    }
    switch (nLast) {
        case 0: break;
        case 1: typecodes.push(lastTc); break;
        case 3: typecodes.push(0b1101); break;
        case 2: typecodes.push(0b1100); break;
        default:
            typecodes.push(0b1110);
            typecodes.push(nLast - 4); break;
    }
    typecodes.push(0b1111);
    if (typecodes.length % 2 !== 0)
        typecodes.push(0b1111);
    let dv = new DataView(new ArrayBuffer(typecodes.length / 2 + bodySize));
    let dvi = 0;
    for (let i = 0; i < typecodes.length; i += 2) {
        dv.setUint8(dvi, typecodes[i] << 4 | typecodes[i + 1]);
        dvi += 1;
    }
    for (let i = 0; i < data.length; ++i) {
        const datum = data[i];
        switch (rawtypecodes[i]) {
            case 0b0010: dv.setUint8(dvi, datum); dvi += 1; break;
            case 0b0011: dv.setUint8(dvi, 256 + datum); dvi += 1; break;
            case 0b0100: dv.setUint16(dvi, datum, true); dvi += 2; break;
            case 0b0101: dv.setUint16(dvi, 65536 + datum, true); dvi += 2; break;
            case 0b0110: dv.setUint32(dvi, datum, true); dvi += 4; break;
            case 0b0111: dv.setUint32(dvi, 4294967296 + datum, true); dvi += 4; break;
            case 0b1000: dv.setFloat32(dvi, datum, true); dvi += 4; break;
            case 0b1001: {
                dv.setUint8(dvi, datum.charCodeAt(0));
                dvi += 1;
                break;
            }
            case 0b1010: {
                for (let j = 0; j < datum.length; ++j) {
                    // string returns NaN for out-of-bounds charCodeAt access
                    dv.setUint8(dvi, datum.charCodeAt(j))
                    dvi += 1;
                }
                dv.setUint8(dvi, 0, true);
                dvi += 1;
                break;
            }
            case 0b1011: {
                for (let j = 0; j < datum.length; ++j) {
                    dv.setUint16(dvi, datum.charCodeAt(j), true)
                    dvi += 2;
                }
                dv.setUint8(dvi, 0, true);
                dvi += 1;
                break;
            }
        }
    }
    return new Uint8Array(dv.buffer);
}

export default protocol2;