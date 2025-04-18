function sleep(ms) {
    return new Promise((resolve, _) => setTimeout(resolve, ms));
}

export function debounceLazy(f, ms) {
    let waiting = 0;
    let running = false;

    const wait = async () => {
        ++waiting;
        await sleep(ms);
        return --waiting === 0;
    };

    const wrapped = async (...args) => {
        if (await wait()) {
            while (running) await wait();
            running = true;
            try {
                await f(...args);
            } finally {
                running = false;
            }
        }
    };
    return wrapped;
}

export const getApiOptions = (outputFunc) => {
    return {
        async readBuffer(filename) {
          const response = await fetch(filename);
          if (!response.ok) { // Add error handling for fetch
            throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
          }
          return response.arrayBuffer();
        },
      
        async compileStreaming(filename) {
          // TODO: make compileStreaming work. It needs the server to use the
          // application/wasm mimetype.
          if (false && WebAssembly.compileStreaming) {
            // This path is currently disabled
            return WebAssembly.compileStreaming(fetch(filename)); 
          } else {
            const response = await fetch(filename);
             if (!response.ok) { // Add error handling for fetch
               throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
             }
            return WebAssembly.compile(await response.arrayBuffer());
          }
        },
      
        hostWrite(s) { outputFunc(s) }
      };
}
