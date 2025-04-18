function readStr(u8, o, len = -1) {
    let str = '';
    let end = u8.length;
    if (len !== -1)
        end = o + len;
    for (let i = o; i < end && u8[i] !== 0; ++i)
        str += String.fromCharCode(u8[i]);
    return str;
}



export const API = (function () {
    class ProcExit extends Error {
        constructor(code) {
            super(`process exited with code ${code}.`);
            this.code = code;
        }
    };

    class NotImplemented extends Error {
        constructor(modname, fieldname) {
            super(`${modname}.${fieldname} not implemented.`);
        }
    }

    class AbortError extends Error {
        constructor(msg = 'abort') { super(msg); }
    }

    class AssertError extends Error {
        constructor(message) { // Add message parameter
           super(message);
           this.name = "AssertError";
        }
    }

    function assert(cond, message = 'assertion failed.') { // Add optional message
        if (!cond) {
            throw new AssertError(message);
        }
    }

    function getInstance(module, imports) {
        return WebAssembly.instantiate(module, imports);
    }

    function getImportObject(obj, names) {
        const result = {};
        for (let name of names) {
             // Ensure the property exists before binding
            if (typeof obj[name] === 'function') {
               result[name] = obj[name].bind(obj);
            } else {
               console.warn(`Method ${name} not found on object for import.`);
               // Provide a dummy function or throw an error if critical
               result[name] = () => { throw new NotImplemented(obj.constructor.name, name); };
            }
        }
        return result;
    }

    // function msToSec(start, end) {
    //     return ((end - start) / 1000).toFixed(2);
    // }

    const ESUCCESS = 0;

    class Memory {
        constructor(memory) {
            this.memory = memory;
            this.buffer = this.memory.buffer;
            this.u8 = new Uint8Array(this.buffer);
            this.u32 = new Uint32Array(this.buffer);
        }

        check() {
            // Check if buffer detached or memory grew
            if (this.buffer.byteLength === 0 || this.buffer !== this.memory.buffer) {
                this.buffer = this.memory.buffer;
                this.u8 = new Uint8Array(this.buffer);
                this.u32 = new Uint32Array(this.buffer);
            }
        }

        read8(o) { return this.u8[o]; }
        read32(o) { return this.u32[o >> 2]; }
        write8(o, v) { this.u8[o] = v; }
        write32(o, v) { this.u32[o >> 2] = v; }
        write64(o, vlo, vhi = 0) { this.write32(o, vlo); this.write32(o + 4, vhi); }

        readStr(o, len) {
            this.check(); // Ensure buffer is valid
            return readStr(this.u8, o, len);
        }

        // Null-terminated string.
        writeStr(o, str) {
            this.check(); // Ensure buffer is valid
            o += this.write(o, str);
            this.write8(o, 0);
            return str.length + 1;
        }

        write(o, buf) {
            this.check(); // Ensure buffer is valid
            if (buf instanceof ArrayBuffer) {
                return this.write(o, new Uint8Array(buf));
            } else if (typeof buf === 'string') {
                 // Convert string to UTF8 bytes
                const bytes = new TextEncoder().encode(buf);
                return this.write(o, bytes);
            } else if (buf instanceof Uint8Array) { // Check if it's already Uint8Array
                const dst = new Uint8Array(this.buffer, o, buf.length);
                dst.set(buf);
                return buf.length;
            } else { // Handle other array-like types (e.g., number[])
                 const bytes = Uint8Array.from(buf);
                 const dst = new Uint8Array(this.buffer, o, bytes.length);
                 dst.set(bytes);
                 return bytes.length;
            }
        }
    };
    class MemFS {
        constructor(options) {
            const compileStreaming = options.compileStreaming;
            this.hostWrite = options.hostWrite || console.log; // Default hostWrite
            this.stdinStr = options.stdinStr || "";
            this.stdinStrPos = 0;
            this.memfsFilename = options.memfsFilename || 'memfs.wasm'; // Provide default

            this.hostMem_ = null;  // Set later when wired up to application.

            // Imports for memfs module.
            const env = getImportObject(
                this, ['abort', 'host_write', 'host_read', 'memfs_log', 'copy_in', 'copy_out']);

            this.ready = compileStreaming(this.memfsFilename)
                .then(module => WebAssembly.instantiate(module, { env }))
                .then(instance => {
                    this.instance = instance;
                    this.exports = instance.exports;
                    // Check if memory export exists
                    if (!this.exports.memory) {
                        throw new Error("memfs module does not export 'memory'");
                    }
                    this.mem = new Memory(this.exports.memory);
                    // Check if init export exists and is a function
                    if (typeof this.exports.init === 'function') {
                       this.exports.init();
                    } else {
                       console.warn("memfs module does not export an 'init' function.");
                    }
                }).catch(err => {
                    console.error(`Failed to load or instantiate ${this.memfsFilename}:`, err);
                    this.hostWrite(`Error: Failed to initialize virtual filesystem (${this.memfsFilename}).\n`);
                    throw err; // Re-throw error to propagate it
                });
        }

        set hostMem(mem) {
            this.hostMem_ = mem;
        }

        setStdinStr(str) {
            this.stdinStr = str;
            this.stdinStrPos = 0;
        }

        // Helper to ensure exports are ready and functions exist
        _checkExport(name) {
           if (!this.exports || typeof this.exports[name] !== 'function') {
              throw new Error(`MemFS export '${name}' is not available or not a function.`);
           }
        }

        addDirectory(path) {
            this._checkExport('GetPathBuf');
            this._checkExport('AddDirectoryNode');
            this.mem.check();
            const pathBufAddr = this.exports.GetPathBuf();
            this.mem.write(pathBufAddr, path); // Use write which handles strings correctly
            this.exports.AddDirectoryNode(new TextEncoder().encode(path).length); // Pass byte length
        }

        addFile(path, contents) {
            this._checkExport('GetPathBuf');
            this._checkExport('AddFileNode');
            this._checkExport('GetFileNodeAddress');
            const contentBytes = (contents instanceof Uint8Array) ? contents : new TextEncoder().encode(contents);
            const length = contentBytes.length;

            this.mem.check();
            const pathBufAddr = this.exports.GetPathBuf();
            this.mem.write(pathBufAddr, path); // Use write for path
            const inode = this.exports.AddFileNode(new TextEncoder().encode(path).length, length); // Pass byte lengths
            const addr = this.exports.GetFileNodeAddress(inode);
            this.mem.check();
            this.mem.write(addr, contentBytes); // Use write for content bytes
        }

        getFileContents(path) {
            this._checkExport('GetPathBuf');
            this._checkExport('FindNode');
            this._checkExport('GetFileNodeAddress');
            this._checkExport('GetFileNodeSize');
            this.mem.check();
            const pathBufAddr = this.exports.GetPathBuf();
            this.mem.write(pathBufAddr, path); // Use write for path
            const inode = this.exports.FindNode(new TextEncoder().encode(path).length); // Pass byte length
            if (inode === 0) { // Assuming 0 indicates not found
                throw new Error(`File not found in MemFS: ${path}`);
            }
            const addr = this.exports.GetFileNodeAddress(inode);
            const size = this.exports.GetFileNodeSize(inode);
            this.mem.check(); // Re-check buffer before creating subarray
            // Return a copy to avoid issues if the underlying buffer changes
            const data = new Uint8Array(this.mem.buffer, addr, size);
            return data.slice(); 
        }

        abort(msg = 'abort') { throw new AbortError(msg); } // Allow passing message

        host_write(fd, iovs, iovs_len, nwritten_out) {
            if (!this.hostMem_) {
                console.error("hostMem not set in MemFS for host_write");
                return ESUCCESS; // Or an appropriate error code
            }
            this.hostMem_.check();
            assert(fd <= 2, `Invalid file descriptor for host_write: ${fd}`);
            let size = 0;
            let str = '';
            try {
                for (let i = 0; i < iovs_len; ++i) {
                    const buf = this.hostMem_.read32(iovs);
                    iovs += 4;
                    const len = this.hostMem_.read32(iovs);
                    iovs += 4;
                    str += this.hostMem_.readStr(buf, len);
                    size += len;
                }
                this.hostMem_.write32(nwritten_out, size);
                this.hostWrite(str); // Call the provided hostWrite function
            } catch (e) {
                console.error("Error during host_write:", e);
                this.hostWrite(`Error during host_write: ${e.message}\n`);
                // Potentially return an error code if the WASI spec requires it
            }
            return ESUCCESS;
        }

        host_read(fd, iovs, iovs_len, nread) {
             if (!this.hostMem_) {
                console.error("hostMem not set in MemFS for host_read");
                return ESUCCESS; // Or an appropriate error code
            }
            this.hostMem_.check();
            assert(fd === 0, `Invalid file descriptor for host_read: ${fd}`);
            let size = 0;
            try {
                for (let i = 0; i < iovs_len; ++i) {
                    const buf = this.hostMem_.read32(iovs);
                    iovs += 4;
                    const len = this.hostMem_.read32(iovs);
                    iovs += 4;
                    const lenToWrite = Math.min(len, (this.stdinStr.length - this.stdinStrPos));
                    if (lenToWrite <= 0) { // Check for <= 0
                        break;
                    }
                    // Read the substring *before* writing to memory
                    const chunk = this.stdinStr.substr(this.stdinStrPos, lenToWrite);
                    this.hostMem_.write(buf, chunk); // Use write, handles string conversion
                    size += lenToWrite;
                    this.stdinStrPos += lenToWrite;
                    if (lenToWrite < len) { // Check if we wrote less than requested buffer len
                        break;
                    }
                }
                this.hostMem_.write32(nread, size);
            } catch (e) {
                 console.error("Error during host_read:", e);
                 this.hostWrite(`Error during host_read: ${e.message}\n`);
                 // Potentially return an error code
            }
            return ESUCCESS;
        }

        memfs_log(buf, len) {
            this.mem.check();
            // Optional: Implement logging from memfs if needed
            // console.log("MemFS Log:", this.mem.readStr(buf, len));
        }

        copy_out(clang_dst, memfs_src, size) {
            if (!this.hostMem_) return; // Guard against missing hostMem
            this.hostMem_.check();
            const dst = new Uint8Array(this.hostMem_.buffer, clang_dst, size);
            this.mem.check();
            const src = new Uint8Array(this.mem.buffer, memfs_src, size);
            dst.set(src);
        }

        copy_in(memfs_dst, clang_src, size) {
            if (!this.hostMem_) return; // Guard against missing hostMem
            this.mem.check();
            const dst = new Uint8Array(this.mem.buffer, memfs_dst, size);
            this.hostMem_.check();
            const src = new Uint8Array(this.hostMem_.buffer, clang_src, size);
            dst.set(src);
        }
    }
    const RAF_PROC_EXIT_CODE = 0xC0C0A; // Keep this if used by your Wasm modules
    class App {
        constructor(module, memfs, name, ...args) {
            this.argv = [name, ...args];
            // Simple default environment, can be expanded
            this.environ = { 
                'USER': 'web_user', 
                'PATH': '/bin', 
                'PWD': '/',
                'HOME': '/',
                'LANG': navigator.language || 'en-US', // Get browser language
                'TERM': 'xterm-256color' // Common terminal type
            };
            this.memfs = memfs;
            this.handles = new Map(); // For managing file descriptors or other resources if needed
            this.nextHandle = 3; // Start after stdin, stdout, stderr

            // --- WASI Imports ---
            const wasi_unstable = {
                // Process control
                proc_exit: this.proc_exit.bind(this),

                // Environment variables
                environ_sizes_get: this.environ_sizes_get.bind(this),
                environ_get: this.environ_get.bind(this),

                // Command line arguments
                args_sizes_get: this.args_sizes_get.bind(this),
                args_get: this.args_get.bind(this),

                // Filesystem (delegated to MemFS)
                fd_prestat_get: this.memfs.exports.fd_prestat_get,
                fd_prestat_dir_name: this.memfs.exports.fd_prestat_dir_name,
                fd_fdstat_get: this.memfs.exports.fd_fdstat_get,
                fd_write: this.memfs.exports.fd_write,
                fd_read: this.memfs.exports.fd_read,
                fd_seek: this.memfs.exports.fd_seek,
                fd_close: this.memfs.exports.fd_close,
                path_open: this.memfs.exports.path_open,
                // Add other required FS functions from memfs.exports if needed

                // Other WASI functions
                random_get: this.random_get.bind(this),
                clock_time_get: this.clock_time_get.bind(this),
                poll_oneoff: this.poll_oneoff.bind(this),
                // Add other WASI functions if your Wasm module requires them
            };

            // --- Optional Env Imports (if needed by specific tools like clang/lld) ---
            const env = {
                // Example: memory allocation used by some toolchains compiled without WASI libc
                // malloc: (size) => { /* ... implementation ... */ },
                // free: (ptr) => { /* ... implementation ... */ },
                // abort: () => { this.memfs.abort("env.abort called"); },
                // __assert_fail: (condition, file, line, func) => { 
                //    this.memfs.abort(`Assertion failed: ${this.mem.readStr(condition)} at ${this.mem.readStr(file)}:${line} in ${this.mem.readStr(func)}`); 
                // },
                // Add other non-WASI imports if required
            };


            this.ready = getInstance(module, { wasi_snapshot_preview1: wasi_unstable, env }) // Use wasi_snapshot_preview1
                .then(instance => {
                    this.instance = instance;
                    this.exports = this.instance.exports;
                     if (!this.exports.memory) {
                        throw new Error("Wasm module does not export 'memory'");
                    }
                    this.mem = new Memory(this.exports.memory);
                    this.memfs.hostMem = this.mem; // Link memfs to this app's memory

                    // Check for _initialize function (common in WASI)
                    if (typeof this.exports._initialize === 'function') {
                        try {
                            this.exports._initialize();
                        } catch (e) {
                            console.warn("Wasm module '_initialize' function threw an error:", e);
                            // Decide if this is fatal or not
                        }
                    }
                }).catch(err => {
                    console.error(`Failed to instantiate Wasm module ${name}:`, err);
                    this.memfs.hostWrite(`Error: Failed to instantiate Wasm module ${name}.\n`);
                    throw err;
                });
        }

        async run() {
            await this.ready;
            if (!this.exports._start) {
                 this.memfs.hostWrite(`Error: Wasm module does not export '_start' function.\n`);
                 throw new Error("Wasm module does not export '_start' function.");
            }
            try {
                this.exports._start();
                // If _start returns normally, it's like exit(0) in WASI
                throw new ProcExit(0); 
            } catch (exn) {
                if (exn instanceof ProcExit) {
                    // Handle known exit codes
                    if (exn.code === 0) {
                        // Normal exit
                        return null; // Indicate successful completion, no app instance to return
                    } else if (exn.code === RAF_PROC_EXIT_CODE) {
                        // Special code for requestAnimationFrame loop?
                        return this; // Return app instance to potentially continue
                    } else {
                        // Non-zero exit code
                        this.memfs.hostWrite(`Process exited with code ${exn.code}\n`);
                        return null; // Indicate finished with error
                    }
                } else if (exn instanceof WebAssembly.RuntimeError && exn.message.includes("unreachable")) {
                     this.memfs.hostWrite("WebAssembly unreachable code executed.\n");
                     throw exn; // Re-throw as it's likely a Wasm trap
                } else {
                    // Other unexpected errors
                    this.memfs.hostWrite(`Unexpected Error: ${exn.message}\n`);
                    if (exn.stack) {
                       this.memfs.hostWrite(`Stack: ${exn.stack}\n`);
                    }
                    throw exn; // Re-throw unexpected errors
                }
            }
        }

        // --- WASI Implementation ---

        proc_exit(code) {
            throw new ProcExit(code);
        }

        environ_sizes_get(environ_count_out, environ_buf_size_out) {
            this.mem.check();
            let size = 0;
            const names = Object.keys(this.environ); // Use Object.keys
            for (const name of names) {
                const value = this.environ[name];
                // +2 for '=' and '\0'
                size += new TextEncoder().encode(name).length + new TextEncoder().encode(value).length + 2;
            }
            this.mem.write32(environ_count_out, names.length); // WASI uses 32-bit sizes/counts
            this.mem.write32(environ_buf_size_out, size);
            return ESUCCESS;
        }

        environ_get(environ_ptrs, environ_buf) {
            this.mem.check();
            const names = Object.keys(this.environ);
            for (const name of names) {
                this.mem.write32(environ_ptrs, environ_buf);
                environ_ptrs += 4;
                const entry = `${name}=${this.environ[name]}`;
                environ_buf += this.mem.writeStr(environ_buf, entry); // writeStr adds null terminator
            }
            // WASI doesn't require a null pointer at the end of the list
            // this.mem.write32(environ_ptrs, 0); 
            return ESUCCESS;
        }

        args_sizes_get(argc_out, argv_buf_size_out) {
            this.mem.check();
            let size = 0;
            for (let arg of this.argv) {
                size += new TextEncoder().encode(arg).length + 1; // +1 for '\0'
            }
            this.mem.write32(argc_out, this.argv.length); // WASI uses 32-bit sizes/counts
            this.mem.write32(argv_buf_size_out, size);
            return ESUCCESS;
        }

        args_get(argv_ptrs, argv_buf) {
            this.mem.check();
            for (let arg of this.argv) {
                this.mem.write32(argv_ptrs, argv_buf);
                argv_ptrs += 4;
                argv_buf += this.mem.writeStr(argv_buf, arg); // writeStr adds null terminator
            }
             // WASI doesn't require a null pointer at the end of the list
            // this.mem.write32(argv_ptrs, 0);
            return ESUCCESS;
        }

        random_get(buf, buf_len) {
            this.mem.check();
            const data = new Uint8Array(this.mem.buffer, buf, buf_len);
            // Use crypto.getRandomValues for better randomness
            if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
               crypto.getRandomValues(data);
            } else {
               console.warn("crypto.getRandomValues not available, using Math.random (less secure).");
               for (let i = 0; i < buf_len; ++i) {
                   data[i] = (Math.random() * 256) | 0;
               }
            }
            return ESUCCESS;
        }

        // Basic implementation using performance.now()
        // See WASI spec for different clock IDs (REALTIME, MONOTONIC, etc.)
        clock_time_get(clock_id, precision, time_out) {
            this.mem.check();
            let time_ns;
            // performance.now() gives milliseconds relative to navigation start
            // Convert to nanoseconds
            const ms = performance.now(); 
            time_ns = BigInt(Math.round(ms * 1_000_000)); 

            // WASI expects nanoseconds since epoch for CLOCK_REALTIME
            // This implementation provides monotonic time, adjust if REALTIME is needed
            // and you have a way to get epoch time.
            if (clock_id === 0) { // CLOCK_REALTIME (approximate with monotonic for now)
                 console.warn("clock_time_get: CLOCK_REALTIME requested, returning monotonic time.");
            } else if (clock_id === 1) { // CLOCK_MONOTONIC
                 // time_ns is already monotonic
            } else {
                 // Handle other clock IDs or return error
                 console.warn(`clock_time_get: Unsupported clock_id ${clock_id}`);
                 // Return EINVAL (invalid argument) - WASI error codes needed
                 // For now, just return the monotonic time
            }

            // Write 64-bit time value
            const low = Number(time_ns & BigInt(0xFFFFFFFF));
            const high = Number(time_ns >> BigInt(32));
            this.mem.write32(time_out, low);
            this.mem.write32(time_out + 4, high);
            
            return ESUCCESS;
        }

        // Stub implementation - required by many WASI modules
        poll_oneoff(in_ptr, out_ptr, nsubscriptions, nevents_out) {
            // This is complex to implement fully in the browser without workers/async logic
            // For simple cases, returning 0 events might suffice
            this.mem.check();
            this.mem.write32(nevents_out, 0); // Indicate no events occurred
            // console.warn("poll_oneoff called but not fully implemented.");
            return ESUCCESS; 
            // For a real implementation, you'd need to check subscriptions (e.g., fd_read/write)
            // and potentially use async mechanisms to wait.
            // throw new NotImplemented('wasi_snapshot_preview1', 'poll_oneoff');
        }
    }
    class Tar {
        constructor(buffer) {
            this.u8 = new Uint8Array(buffer);
            this.offset = 0;
        }

        readStr(len) {
            // Read string up to null terminator or length limit
            let str = '';
            const end = Math.min(this.offset + len, this.u8.length);
            for (let i = this.offset; i < end; ++i) {
                const charCode = this.u8[i];
                if (charCode === 0) break; // Stop at null terminator
                str += String.fromCharCode(charCode);
            }
            this.offset += len; // Advance offset by the full field length
            return str;
        }

        readOctal(len) {
            const str = this.readStr(len).trim(); // Trim whitespace
            return str ? parseInt(str, 8) : 0; // Handle empty strings
        }

        alignUp() {
            this.offset = (this.offset + 511) & ~511;
        }

        readEntry() {
            if (this.offset + 512 > this.u8.length) {
                return null; // Not enough data for a header
            }

            // Check for end-of-archive marker (two zero blocks)
            let isAllZeros = true;
            for(let i = this.offset; i < this.offset + 1024 && i < this.u8.length; i++) {
                if (this.u8[i] !== 0) {
                    isAllZeros = false;
                    break;
                }
            }
            if (isAllZeros && this.offset + 1024 <= this.u8.length) {
                 return null; // End of archive
            }


            const headerStart = this.offset;
            const entry = {
                filename: this.readStr(100),
                mode: this.readOctal(8),
                owner: this.readOctal(8),
                group: this.readOctal(8),
                size: this.readOctal(12),
                mtim: this.readOctal(12), // Modification time (seconds since epoch)
                checksum: this.readOctal(8),
                type: this.readStr(1), // Type flag
                linkname: this.readStr(100), // Target of link (if type '1' or '2')
            };

            // USTAR fields
            const ustarIndicator = this.readStr(6); // 'ustar\0'
            this.offset += 2; // Skip version '00'

            entry.ownerName = this.readStr(32);
            entry.groupName = this.readStr(32);
            entry.devMajor = this.readOctal(8); // Use octal for device numbers
            entry.devMinor = this.readOctal(8);
            entry.filenamePrefix = this.readStr(155);

            // Simple checksum validation (optional but recommended)
            // Note: Checksum calculation is tricky, this is a basic check
            // let checksumCalculated = 0;
            // for (let i = headerStart; i < headerStart + 512; i++) {
            //     checksumCalculated += (i >= headerStart + 148 && i < headerStart + 156) ? 32 : this.u8[i];
            // }
            // if (checksumCalculated && entry.checksum && checksumCalculated !== entry.checksum) {
            //     console.warn(`Tar checksum mismatch for ${entry.filename || 'entry'}`);
            //     // Decide how to handle: skip entry, throw error?
            // }


            this.offset = headerStart + 512; // Ensure offset is exactly at the end of the header

            // Handle filename prefix if present
            if (entry.filenamePrefix) {
                entry.filename = entry.filenamePrefix + entry.filename;
            }
            
            // Clean up filename (remove trailing nulls, etc.)
            entry.filename = entry.filename.replace(/\0/g, '').trim();
            entry.linkname = entry.linkname.replace(/\0/g, '').trim();


            // Read file data if it's a regular file
            if (entry.type === '0' || entry.type === '\0') { // Regular file ('\0' for older tar)
                 if (this.offset + entry.size > this.u8.length) {
                     console.error(`Tar entry size error for ${entry.filename}: size ${entry.size} exceeds buffer length.`);
                     return null; // Or handle error appropriately
                 }
                entry.contents = this.u8.subarray(this.offset, this.offset + entry.size);
                this.offset += entry.size;
                this.alignUp(); // Align to the next 512-byte boundary after file data
            } else if (entry.type === '1') { // Hard link
                 console.log(`Tar entry: Hard link ${entry.filename} -> ${entry.linkname}`);
                 // MemFS might need specific handling for links
            } else if (entry.type === '2') { // Symbolic link
                 console.log(`Tar entry: Symlink ${entry.filename} -> ${entry.linkname}`);
                 // MemFS might need specific handling for links
            } else if (entry.type === '5') { // Directory
                 // No data content for directories
                 this.alignUp(); // Still need to align
            } else {
                 console.warn(`Unsupported tar entry type '${entry.type}' for ${entry.filename}`);
                 this.alignUp(); // Align even if unsupported
            }

            // Basic check for valid entry before returning
            if (!entry.filename && entry.type !== '5') { // Allow unnamed directories sometimes
                 // Might be an empty block or invalid entry
                 return null; 
            }


            return entry;
        }

        untar(memfs) {
            let entry;
            while (entry = this.readEntry()) {
                // Ensure filename is valid before proceeding
                if (!entry.filename) continue; 

                // Create parent directories if they don't exist
                const pathParts = entry.filename.split('/').filter(p => p);
                let currentPath = '';
                for (let i = 0; i < pathParts.length - (entry.type === '5' ? 0 : 1); i++) {
                    currentPath += (currentPath ? '/' : '') + pathParts[i];
                     try {
                         // Attempt to add directory - might already exist
                         memfs.addDirectory(currentPath);
                     } catch (e) {
                         // Ignore errors assuming they might be "directory exists"
                         // A more robust check would involve trying to find the node first
                         // console.warn(`Could not create parent dir ${currentPath}: ${e.message}`);
                     }
                }


                switch (entry.type) {
                    case '0': // Regular file
                    case '\0': // Regular file (legacy)
                        try {
                           memfs.addFile(entry.filename, entry.contents);
                        } catch (e) {
                           console.error(`Failed to add file ${entry.filename} to MemFS: ${e.message}`);
                        }
                        break;
                    case '5': // Directory
                         try {
                            memfs.addDirectory(entry.filename);
                         } catch (e) {
                            // Ignore if directory already exists
                            // console.warn(`Could not add directory ${entry.filename}: ${e.message}`);
                         }
                        break;
                    case '1': // Hard link - Not directly supported by simple MemFS, treat as file copy?
                         console.warn(`Hard link ${entry.filename} -> ${entry.linkname} not fully supported. Treating as regular file if target exists.`);
                         // Try to copy content if link target exists? Requires finding the target.
                         break;
                    case '2': // Symbolic link - Not directly supported by simple MemFS
                         console.warn(`Symbolic link ${entry.filename} -> ${entry.linkname} not supported.`);
                         // Could potentially store link info if MemFS is extended
                         break;
                    default:
                        // Already warned in readEntry
                        break;
                }
            }
        }
    }
    class API {
        constructor(options) {
            this.moduleCache = {};
            // Validate mandatory options
            if (!options.readBuffer || !options.compileStreaming || !options.hostWrite) {
                throw new Error("API requires readBuffer, compileStreaming, and hostWrite options.");
            }
            this.readBuffer = options.readBuffer;
            this.compileStreaming = options.compileStreaming;
            this.hostWrite = options.hostWrite;

            // Provide defaults for filenames
            this.clangFilename = options.clang || 'clang.wasm';
            this.lldFilename = options.lld || 'lld.wasm';
            this.sysrootFilename = options.sysroot || 'sysroot.tar';
            this.memfsFilename = options.memfs || 'memfs.wasm'; // Add memfs default

            this.showTiming = options.showTiming || false; // Default to false

            // Default Clang/LLD args (adjust as needed for WASI target)
            this.clangCommonArgs = [
                '-target', 'wasm32-wasi', // Target WASI
                '-disable-free',
                '-isysroot', '/',
                '-internal-isystem', '/include/c++/v1',
                '-internal-isystem', '/include',
                // Clang version might differ, adjust path if needed
                '-internal-isystem', '/lib/clang/15.0.0/include', // Example version
                '-ferror-limit', '19',
                '-fmessage-length', '80',
                '-fvisibility=hidden', // Good practice for libraries/executables
                 '-mthread-model', 'single' // Explicitly single-threaded for WASI
            ];

             this.clangCommonArgsC = [
                '-target', 'wasm32-wasi',
                '-disable-free',
                '-isysroot', '/',
                '-internal-isystem', '/include',
                 // Clang version might differ
                '-internal-isystem', '/lib/clang/15.0.0/include', // Example version
                '-ferror-limit', '19',
                '-fmessage-length', '80',
                 '-fvisibility=hidden',
                 '-mthread-model', 'single'
            ];

            this.lldCommonArgs = [
                 '--no-threads',
                 '--export-dynamic', // Often needed for WASI dynamic linking features if used
                 '--allow-undefined', // May be needed depending on libc/runtime
                 '-z', 'stack-size=1048576', // 1MB stack
                 '-L/lib/wasm32-wasi', // Path to WASI libraries in sysroot
                 '/lib/wasm32-wasi/crt1.o' // WASI entry point object file
            ];


            this.memfs = new MemFS({
                compileStreaming: this.compileStreaming,
                hostWrite: this.hostWrite,
                memfsFilename: this.memfsFilename, // Pass memfs filename
            });

            // Chain initialization: MemFS ready -> Untar sysroot
            this.ready = this.memfs.ready
                .then(() => this.untar(this.memfs, this.sysrootFilename))
                .catch(err => {
                    console.error("API Initialization failed:", err);
                    this.hostWrite("Error: API Initialization failed. Check console.\n");
                    // Make 'ready' promise reject so subsequent calls fail quickly
                    return Promise.reject(err); 
                });
        }

        // Simple logging helper
        hostLog(message) {
            // Optional: Add styling or prefixes
            this.hostWrite(`> ${message}\n`);
        }

        // Helper to time async operations if showTiming is enabled
        async timeIt(message, promise) {
            if (!this.showTiming) return promise; // Skip timing if disabled

            this.hostLog(`${message}...`);
            const start = performance.now();
            try {
                const result = await promise;
                const end = performance.now();
                this.hostLog(`${message} done in ${((end - start) / 1000).toFixed(2)}s`);
                return result;
            } catch (error) {
                 const end = performance.now();
                 this.hostLog(`${message} FAILED in ${((end - start) / 1000).toFixed(2)}s`);
                 throw error; // Re-throw the error
            }
        }


        async getModule(name) {
            if (this.moduleCache[name]) return this.moduleCache[name];
            
            const promise = this.compileStreaming(name)
                 .catch(err => {
                     console.error(`Failed to fetch/compile ${name}:`, err);
                     this.hostWrite(`Error: Failed to load Wasm module ${name}. Check network and console.\n`);
                     throw err;
                 });

            const module = await this.timeIt(`Fetching/Compiling ${name}`, promise);
            this.moduleCache[name] = module;
            return module;
        }

        async untar(memfs, filename) {
            // Ensure MemFS is ready before trying to untar
            await this.memfs.ready; 
            
            const promise = (async () => {
                const buffer = await this.readBuffer(filename);
                const tar = new Tar(buffer);
                tar.untar(this.memfs); // Pass the memfs instance
            })();

            await this.timeIt(`Untarring ${filename}`, promise);
        }

        async compile(options) {
            const input = options.input || 'input.cpp'; // Default input filename
            const contents = options.contents;
            const obj = options.obj || 'output.o'; // Default output filename
            const opt = options.opt || '2'; // Default optimization level

            if (!contents) throw new Error("Compile requires 'contents'");

            await this.ready; // Ensure sysroot is ready
            this.memfs.addFile(input, contents);
            const clang = await this.getModule(this.clangFilename);

            const args = [
                'clang', '-cc1', '-emit-obj',
                ...this.clangCommonArgs,
                `-O${opt}`,
                '-o', obj,
                '-x', 'c++', input
            ];

            this.hostLog(`Compiling ${input} with args: ${args.slice(1).join(' ')}`);
            const compilePromise = this.run(clang, ...args);
            return await this.timeIt(`Compiling ${input}`, compilePromise);
        }

        async link(obj, wasm) {
            await this.ready; // Ensure sysroot is ready
            const lld = await this.getModule(this.lldFilename);

            const args = [
                'wasm-ld',
                ...this.lldCommonArgs,
                obj, // Input object file
                '-lc', // Link C library (WASI libc)
                '-lc++', // Link C++ library
                '-lc++abi', // Link C++ ABI library
                '-o', wasm // Output Wasm file
            ];

            this.hostLog(`Linking ${obj} with args: ${args.slice(1).join(' ')}`);
            const linkPromise = this.run(lld, ...args);
            return await this.timeIt(`Linking ${obj}`, linkPromise);
        }

        // Generic run method for executing a Wasm module (like clang, lld, or the compiled user code)
        async run(module, ...args) {
            this.hostLog(`Running ${args[0]}...`); // Log which command is running
            const app = new App(module, this.memfs, ...args);
            try {
                const result = await app.run();
                this.hostLog(`${args[0]} finished.`);
                return result; // Might be null or the app instance if RAF_PROC_EXIT_CODE
            } catch (e) {
                 this.hostLog(`${args[0]} failed.`);
                 // Error already logged in App.run, just re-throw
                 throw e;
            }
        }

        // --- Convenience Methods ---

        async compileLinkRun(contents) {
            const input = `main.cc`;
            const obj = `main.o`;
            const wasm = `main.wasm`;

            await this.compile({ input, contents, obj });
            await this.link(obj, wasm);

            const buffer = this.memfs.getFileContents(wasm);
            const userWasmModule = await this.timeIt(`Compiling final Wasm ${wasm}`, WebAssembly.compile(buffer));
            
            this.hostLog("--- Running User Code ---");
            const runPromise = this.run(userWasmModule, wasm); // Pass wasm filename as argv[0]
            const result = await this.timeIt(`Executing ${wasm}`, runPromise);
            this.hostLog("--- User Code Finished ---");
            return result;
        }

        // --- C Language Specific Methods ---

        async compileC(options) {
            const input = options.input || 'input.c';
            const contents = options.contents;
            const obj = options.obj || 'output.o';
            const opt = options.opt || '2';

             if (!contents) throw new Error("compileC requires 'contents'");

            await this.ready;
            this.memfs.addFile(input, contents);
            const clang = await this.getModule(this.clangFilename);

             const args = [
                'clang', '-cc1', '-emit-obj',
                ...this.clangCommonArgsC, // Use C-specific args
                `-O${opt}`,
                '-o', obj,
                '-x', 'c', input // Specify language as C
            ];

            this.hostLog(`Compiling ${input} (C) with args: ${args.slice(1).join(' ')}`);
            const compilePromise = this.run(clang, ...args);
            return await this.timeIt(`Compiling ${input} (C)`, compilePromise);
        }

        async linkC(obj, wasm) {
            await this.ready;
            const lld = await this.getModule(this.lldFilename);

             const args = [
                'wasm-ld',
                ...this.lldCommonArgs,
                obj,
                '-lc', // Link C library only
                '-o', wasm
            ];

            this.hostLog(`Linking ${obj} (C) with args: ${args.slice(1).join(' ')}`);
            const linkPromise = this.run(lld, ...args);
            return await this.timeIt(`Linking ${obj} (C)`, linkPromise);
        }

        async compileLinkRunC(contents) {
            const input = `main.c`;
            const obj = `main.o`;
            const wasm = `main.wasm`;

            await this.compileC({ input, contents, obj });
            await this.linkC(obj, wasm);

            const buffer = this.memfs.getFileContents(wasm);
            const userWasmModule = await this.timeIt(`Compiling final Wasm ${wasm}`, WebAssembly.compile(buffer));

            this.hostLog("--- Running User Code (C) ---");
            const runPromise = this.run(userWasmModule, wasm);
            const result = await this.timeIt(`Executing ${wasm}`, runPromise);
            this.hostLog("--- User Code Finished (C) ---");
            return result;
        }
    }
    return API;
})();
