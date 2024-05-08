
import "javy"

import { HTTPRequest, HTTPResponse } from "./v1/types_pb";

  type  Handler = (req: HTTPRequest )=> HTTPResponse

class RunHandler {
  constructor() {
    console.log("RunHandler constructor loaded");
  }

  readInput = () : HTTPRequest=> {
    const chunkSize = 1024;
    const inputChunks :Array<Uint8Array> = [];
    let totalBytes = 0;

    // Read all the available bytes
    while (1) {
      const buffer = new Uint8Array(chunkSize);
      // Stdin file descriptor
      const fd = 0;
      const bytesRead = Javy.IO.readSync(fd, buffer);

      totalBytes += bytesRead;
      if (bytesRead === 0) {
        break;
      }
      inputChunks.push(buffer.subarray(0, bytesRead));
    }

    // Assemble input into a single Uint8Array
    const { finalBuffer } = inputChunks.reduce(
      (context, chunk) => {
        context.finalBuffer.set(chunk, context.bufferOffset);
        context.bufferOffset += chunk.length;
        return context;
      },
      { bufferOffset: 0, finalBuffer: new Uint8Array(totalBytes) }
    );

    let req = HTTPRequest.fromJson(
      JSON.parse(new TextDecoder().decode(finalBuffer))
    );
    return req;
  };
  writeOutput = (output: HTTPResponse) => {

    const encodedOutput = new TextEncoder().encode(JSON.stringify(output));
    const buffer = new Uint8Array(encodedOutput);
    // Stdout file descriptor
    const fd = 1;
    Javy.IO.writeSync(fd, buffer);
  };

  /**
   * @param {Http.Handler} handler
   */
  handle = (handler: Handler) => {
    // read protobuf request pass into the sandbox
    const request = this.readInput();
    // convert protobuf request to request
    let response = handler(request);
    this.writeOutput(response);
  };
}

export default RunHandler;
