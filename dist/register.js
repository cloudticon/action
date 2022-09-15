/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 964:
/***/ ((module, exports, __nccwpck_require__) => {

/* module decorator */ module = __nccwpck_require__.nmd(module);
const { TraceMap, originalPositionFor, AnyMap } = __nccwpck_require__(817);
var path = __nccwpck_require__(17);
const { fileURLToPath, pathToFileURL } = __nccwpck_require__(310);
var util = __nccwpck_require__(837);

var fs;
try {
  fs = __nccwpck_require__(147);
  if (!fs.existsSync || !fs.readFileSync) {
    // fs doesn't have all methods we need
    fs = null;
  }
} catch (err) {
  /* nop */
}

/**
 * Requires a module which is protected against bundler minification.
 *
 * @param {NodeModule} mod
 * @param {string} request
 */
function dynamicRequire(mod, request) {
  return mod.require(request);
}

/**
 * @typedef {{
 *   enabled: boolean;
 *   originalValue: any;
 *   installedValue: any;
 * }} HookState
 * Used for installing and uninstalling hooks
 */

// Increment this if the format of sharedData changes in a breaking way.
var sharedDataVersion = 1;

/**
 * @template T
 * @param {T} defaults
 * @returns {T}
 */
function initializeSharedData(defaults) {
  var sharedDataKey = 'source-map-support/sharedData';
  if (typeof Symbol !== 'undefined') {
    sharedDataKey = Symbol.for(sharedDataKey);
  }
  var sharedData = this[sharedDataKey];
  if (!sharedData) {
    sharedData = { version: sharedDataVersion };
    if (Object.defineProperty) {
      Object.defineProperty(this, sharedDataKey, { value: sharedData });
    } else {
      this[sharedDataKey] = sharedData;
    }
  }
  if (sharedDataVersion !== sharedData.version) {
    throw new Error("Multiple incompatible instances of source-map-support were loaded");
  }
  for (var key in defaults) {
    if (!(key in sharedData)) {
      sharedData[key] = defaults[key];
    }
  }
  return sharedData;
}

// If multiple instances of source-map-support are loaded into the same
// context, they shouldn't overwrite each other.  By storing handlers, caches,
// and other state on a shared object, different instances of
// source-map-support can work together in a limited way. This does require
// that future versions of source-map-support continue to support the fields on
// this object. If this internal contract ever needs to be broken, increment
// sharedDataVersion. (This version number is not the same as any of the
// package's version numbers, which should reflect the *external* API of
// source-map-support.)
var sharedData = initializeSharedData({

  // Only install once if called multiple times
  // Remember how the environment looked before installation so we can restore if able
  /** @type {HookState} */
  errorPrepareStackTraceHook: undefined,
  /** @type {HookState} */
  processEmitHook: undefined,
  /** @type {HookState} */
  moduleResolveFilenameHook: undefined,

  /** @type {Array<(request: string, parent: any, isMain: boolean, options: any, redirectedRequest: string) => void>} */
  onConflictingLibraryRedirectArr: [],

  // If true, the caches are reset before a stack trace formatting operation
  emptyCacheBetweenOperations: false,

  // Maps a file path to a string containing the file contents
  fileContentsCache: Object.create(null),

  // Maps a file path to a source map for that file
  /** @type {Record<string, {url: string, map: TraceMap}} */
  sourceMapCache: Object.create(null),

  // Priority list of retrieve handlers
  retrieveFileHandlers: [],
  retrieveMapHandlers: [],

  // Priority list of internally-implemented handlers.
  // When resetting state, we must keep these.
  internalRetrieveFileHandlers: [],
  internalRetrieveMapHandlers: [],

});

// Supports {browser, node, auto}
var environment = "auto";

// Regex for detecting source maps
var reSourceMap = /^data:application\/json[^,]+base64,/;

function isInBrowser() {
  if (environment === "browser")
    return true;
  if (environment === "node")
    return false;
  return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function') && !(window.require && window.module && window.process && window.process.type === "renderer"));
}

function hasGlobalProcessEventEmitter() {
  return ((typeof process === 'object') && (process !== null) && (typeof process.on === 'function'));
}

function tryFileURLToPath(v) {
  if(isFileUrl(v)) {
    return fileURLToPath(v);
  }
  return v;
}

// TODO un-copy these from resolve-uri; see if they can be exported from that lib
function isFileUrl(input) {
  return input.startsWith('file:');
}
function isAbsoluteUrl(input) {
  return schemeRegex.test(input);
}
// Matches the scheme of a URL, eg "http://"
const schemeRegex = /^[\w+.-]+:\/\//;
function isSchemeRelativeUrl(input) {
  return input.startsWith('//');
}

// #region Caches
/** @param {string} pathOrFileUrl */
function getCacheKey(pathOrFileUrl) {
  if(pathOrFileUrl.startsWith('node:')) return pathOrFileUrl;
  if(isFileUrl(pathOrFileUrl)) {
    // Must normalize spaces to %20, stuff like that
    return new URL(pathOrFileUrl).toString();
  } else {
    try {
      return pathToFileURL(pathOrFileUrl).toString();
    } catch {
      return pathOrFileUrl;
    }
  }
}
function getFileContentsCache(key) {
  return sharedData.fileContentsCache[getCacheKey(key)];
}
function hasFileContentsCacheFromKey(key) {
  return Object.prototype.hasOwnProperty.call(sharedData.fileContentsCache, key);
}
function getFileContentsCacheFromKey(key) {
  return sharedData.fileContentsCache[key];
}
function setFileContentsCache(key, value) {
  return sharedData.fileContentsCache[getCacheKey(key)] = value;
}
function getSourceMapCache(key) {
  return sharedData.sourceMapCache[getCacheKey(key)];
}
function setSourceMapCache(key, value) {
  return sharedData.sourceMapCache[getCacheKey(key)] = value;
}
function clearCaches() {
  sharedData.fileContentsCache = Object.create(null);
  sharedData.sourceMapCache = Object.create(null);
}
// #endregion Caches

function handlerExec(list, internalList) {
  return function(arg) {
    for (var i = 0; i < list.length; i++) {
      var ret = list[i](arg);
      if (ret) {
        return ret;
      }
    }
    for (var i = 0; i < internalList.length; i++) {
      var ret = internalList[i](arg);
      if (ret) {
        return ret;
      }
    }
    return null;
  };
}

var retrieveFile = handlerExec(sharedData.retrieveFileHandlers, sharedData.internalRetrieveFileHandlers);

sharedData.internalRetrieveFileHandlers.push(function(path) {
  // Trim the path to make sure there is no extra whitespace.
  path = path.trim();
  if (/^file:/.test(path)) {
    // existsSync/readFileSync can't handle file protocol, but once stripped, it works
    path = path.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
      return drive ?
        '' : // file:///C:/dir/file -> C:/dir/file
        '/'; // file:///root-dir/file -> /root-dir/file
    });
  }
  const key = getCacheKey(path);
  if(hasFileContentsCacheFromKey(key)) {
    return getFileContentsCacheFromKey(key);
  }

  var contents = '';
  try {
    if (!fs) {
      // Use SJAX if we are in the browser
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, /** async */ false);
      xhr.send(null);
      if (xhr.readyState === 4 && xhr.status === 200) {
        contents = xhr.responseText;
      }
    } else if (fs.existsSync(path)) {
      // Otherwise, use the filesystem
      contents = fs.readFileSync(path, 'utf8');
    }
  } catch (er) {
    /* ignore any errors */
  }

  return setFileContentsCache(path, contents);
});

// Support URLs relative to a directory, but be careful about a protocol prefix
// in case we are in the browser (i.e. directories may start with "http://" or "file:///")
function supportRelativeURL(file, url) {
  if(!file) return url;
  // given that this happens within error formatting codepath, probably best to
  // fallback instead of throwing if anything goes wrong
  try {
    // if should output a URL
    if(isAbsoluteUrl(file) || isSchemeRelativeUrl(file)) {
        if(isAbsoluteUrl(url) || isSchemeRelativeUrl(url)) {
            return new URL(url, file).toString();
        }
        if(path.isAbsolute(url)) {
            return new URL(pathToFileURL(url), file).toString();
        }
        // url is relative path or URL
        return new URL(url.replace(/\\/g, '/'), file).toString();
    }
    // if should output a path (unless URL is something like https://)
    if(path.isAbsolute(file)) {
        if(isFileUrl(url)) {
            return fileURLToPath(url);
        }
        if(isSchemeRelativeUrl(url)) {
            return fileURLToPath(new URL(url, 'file://'));
        }
        if(isAbsoluteUrl(url)) {
            // url is a non-file URL
            // Go with the URL
            return url;
        }
        if(path.isAbsolute(url)) {
            // Normalize at all?  decodeURI or normalize slashes?
            return path.normalize(url);
        }
        // url is relative path or URL
        return path.join(file, '..', decodeURI(url));
    }
    // If we get here, file is relative.
    // Shouldn't happen since node identifies modules with absolute paths or URLs.
    // But we can take a stab at returning something meaningful anyway.
    if(isAbsoluteUrl(url) || isSchemeRelativeUrl(url)) {
        return url;
    }
    return path.join(file, '..', url);
  } catch(e) {
      return url;
  }
}

// Return pathOrUrl in the same style as matchStyleOf: either a file URL or a native path
function matchStyleOfPathOrUrl(matchStyleOf, pathOrUrl) {
  try {
    if(isAbsoluteUrl(matchStyleOf) || isSchemeRelativeUrl(matchStyleOf)) {
      if(isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl)) return pathOrUrl;
      if(path.isAbsolute(pathOrUrl)) return pathToFileURL(pathOrUrl).toString();
    } else if(path.isAbsolute(matchStyleOf)) {
      if(isAbsoluteUrl(pathOrUrl) || isSchemeRelativeUrl(pathOrUrl)) {
        return fileURLToPath(new URL(pathOrUrl, 'file://'));
      }
    }
    return pathOrUrl;
  } catch(e) {
    return pathOrUrl;
  }
}

function retrieveSourceMapURL(source) {
  var fileData;

  if (isInBrowser()) {
     try {
       var xhr = new XMLHttpRequest();
       xhr.open('GET', source, false);
       xhr.send(null);
       fileData = xhr.readyState === 4 ? xhr.responseText : null;

       // Support providing a sourceMappingURL via the SourceMap header
       var sourceMapHeader = xhr.getResponseHeader("SourceMap") ||
                             xhr.getResponseHeader("X-SourceMap");
       if (sourceMapHeader) {
         return sourceMapHeader;
       }
     } catch (e) {
     }
  }

  // Get the URL of the source map
  fileData = retrieveFile(tryFileURLToPath(source));
  var re = /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/mg;
  // Keep executing the search to find the *last* sourceMappingURL to avoid
  // picking up sourceMappingURLs from comments, strings, etc.
  var lastMatch, match;
  while (match = re.exec(fileData)) lastMatch = match;
  if (!lastMatch) return null;
  return lastMatch[1];
};

// Can be overridden by the retrieveSourceMap option to install. Takes a
// generated source filename; returns a {map, optional url} object, or null if
// there is no source map.  The map field may be either a string or the parsed
// JSON object (ie, it must be a valid argument to the SourceMapConsumer
// constructor).
/** @type {(source: string) => import('./source-map-support').UrlAndMap | null} */
var retrieveSourceMap = handlerExec(sharedData.retrieveMapHandlers, sharedData.internalRetrieveMapHandlers);
sharedData.internalRetrieveMapHandlers.push(function(source) {
  var sourceMappingURL = retrieveSourceMapURL(source);
  if (!sourceMappingURL) return null;

  // Read the contents of the source map
  var sourceMapData;
  if (reSourceMap.test(sourceMappingURL)) {
    // Support source map URL as a data url
    var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
    sourceMapData = Buffer.from(rawData, "base64").toString();
    sourceMappingURL = source;
  } else {
    // Support source map URLs relative to the source URL
    sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
    sourceMapData = retrieveFile(tryFileURLToPath(sourceMappingURL));
  }

  if (!sourceMapData) {
    return null;
  }

  return {
    url: sourceMappingURL,
    map: sourceMapData
  };
});

function mapSourcePosition(position) {
  var sourceMap = getSourceMapCache(position.source);
  if (!sourceMap) {
    // Call the (overrideable) retrieveSourceMap function to get the source map.
    var urlAndMap = retrieveSourceMap(position.source);
    if (urlAndMap) {
      sourceMap = setSourceMapCache(position.source, {
        url: urlAndMap.url,
        map: new AnyMap(urlAndMap.map, urlAndMap.url)
      });

      // Overwrite trace-mapping's resolutions, because they do not handle
      // Windows paths the way we want.
      // TODO Remove now that windows path support was added to resolve-uri and thus trace-mapping?
      sourceMap.map.resolvedSources = sourceMap.map.sources.map(s => supportRelativeURL(sourceMap.url, s));

      // Load all sources stored inline with the source map into the file cache
      // to pretend like they are already loaded. They may not exist on disk.
      if (sourceMap.map.sourcesContent) {
        sourceMap.map.resolvedSources.forEach(function(resolvedSource, i) {
          var contents = sourceMap.map.sourcesContent[i];
          if (contents) {
            setFileContentsCache(resolvedSource, contents);
          }
        });
      }
    } else {
      sourceMap = setSourceMapCache(position.source, {
        url: null,
        map: null
      });
    }
  }

  // Resolve the source URL relative to the URL of the source map
  if (sourceMap && sourceMap.map) {
    var originalPosition = originalPositionFor(sourceMap.map, position);

    // Only return the original position if a matching line was found. If no
    // matching line is found then we return position instead, which will cause
    // the stack trace to print the path and line for the compiled file. It is
    // better to give a precise location in the compiled file than a vague
    // location in the original file.
    if (originalPosition.source !== null) {
      // originalPosition.source has *already* been resolved against sourceMap.url
      // so is *already* as absolute as possible.
      // However, we want to ensure we output in same format as input: URL or native path
      originalPosition.source = matchStyleOfPathOrUrl(
        position.source, originalPosition.source);
      return originalPosition;
    }
  }

  return position;
}

// Parses code generated by FormatEvalOrigin(), a function inside V8:
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js
function mapEvalOrigin(origin) {
  // Most eval() calls are in this format
  var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
  if (match) {
    var position = mapSourcePosition({
      source: match[2],
      line: +match[3],
      column: match[4] - 1
    });
    return 'eval at ' + match[1] + ' (' + position.source + ':' +
      position.line + ':' + (position.column + 1) + ')';
  }

  // Parse nested eval() calls using recursion
  match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
  if (match) {
    return 'eval at ' + match[1] + ' (' + mapEvalOrigin(match[2]) + ')';
  }

  // Make sure we still return useful information if we didn't find anything
  return origin;
}

// This is copied almost verbatim from the V8 source code at
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js
// Update 2022-04-29:
//    https://github.com/v8/v8/blob/98f6f100c5ab8e390e51422747c4ef644d5ac6f2/src/builtins/builtins-callsite.cc#L175-L179
//    https://github.com/v8/v8/blob/98f6f100c5ab8e390e51422747c4ef644d5ac6f2/src/objects/call-site-info.cc#L795-L804
//    https://github.com/v8/v8/blob/98f6f100c5ab8e390e51422747c4ef644d5ac6f2/src/objects/call-site-info.cc#L717-L750
// The implementation of wrapCallSite() used to just forward to the actual source
// code of CallSite.prototype.toString but unfortunately a new release of V8
// did something to the prototype chain and broke the shim. The only fix I
// could find was copy/paste.
function CallSiteToString() {
  var fileName;
  var fileLocation = "";
  if (this.isNative()) {
    fileLocation = "native";
  } else {
    fileName = this.getScriptNameOrSourceURL();
    if (!fileName && this.isEval()) {
      fileLocation = this.getEvalOrigin();
      fileLocation += ", ";  // Expecting source position to follow.
    }

    if (fileName) {
      fileLocation += fileName;
    } else {
      // Source code does not originate from a file and is not native, but we
      // can still get the source position inside the source string, e.g. in
      // an eval string.
      fileLocation += "<anonymous>";
    }
    var lineNumber = this.getLineNumber();
    if (lineNumber != null) {
      fileLocation += ":" + lineNumber;
      var columnNumber = this.getColumnNumber();
      if (columnNumber) {
        fileLocation += ":" + columnNumber;
      }
    }
  }

  var line = "";
  var isAsync = this.isAsync ? this.isAsync() : false;
  if(isAsync) {
    line += 'async ';
    var isPromiseAll = this.isPromiseAll ? this.isPromiseAll() : false;
    var isPromiseAny = this.isPromiseAny ? this.isPromiseAny() : false;
    if(isPromiseAny || isPromiseAll) {
      line += isPromiseAll ? 'Promise.all (index ' : 'Promise.any (index ';
      var promiseIndex = this.getPromiseIndex();
      line += promiseIndex + ')';
    }
  }
  var functionName = this.getFunctionName();
  var addSuffix = true;
  var isConstructor = this.isConstructor();
  var isMethodCall = !(this.isToplevel() || isConstructor);
  if (isMethodCall) {
    var typeName = this.getTypeName();
    // Fixes shim to be backward compatable with Node v0 to v4
    if (typeName === "[object Object]") {
      typeName = "null";
    }
    var methodName = this.getMethodName();
    if (functionName) {
      if (typeName && functionName.indexOf(typeName) != 0) {
        line += typeName + ".";
      }
      line += functionName;
      if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
        line += " [as " + methodName + "]";
      }
    } else {
      line += typeName + "." + (methodName || "<anonymous>");
    }
  } else if (isConstructor) {
    line += "new " + (functionName || "<anonymous>");
  } else if (functionName) {
    line += functionName;
  } else {
    line += fileLocation;
    addSuffix = false;
  }
  if (addSuffix) {
    line += " (" + fileLocation + ")";
  }
  return line;
}

function cloneCallSite(frame) {
  var object = {};
  Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
    object[name] = /^(?:is|get)/.test(name) ? function() { return frame[name].call(frame); } : frame[name];
  });
  object.toString = CallSiteToString;
  return object;
}

function wrapCallSite(frame, state) {
  // provides interface backward compatibility
  if (state === undefined) {
    state = { nextPosition: null, curPosition: null }
  }
  if(frame.isNative()) {
    state.curPosition = null;
    return frame;
  }

  // Most call sites will return the source file from getFileName(), but code
  // passed to eval() ending in "//# sourceURL=..." will return the source file
  // from getScriptNameOrSourceURL() instead
  var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
  if (source) {
    // v8 does not expose its internal isWasm, etc methods, so we do this instead.
    if(source.startsWith('wasm://')) {
      state.curPosition = null;
      return frame;
    }

    var line = frame.getLineNumber();
    var column = frame.getColumnNumber() - 1;

    // Fix position in Node where some (internal) code is prepended.
    // See https://github.com/evanw/node-source-map-support/issues/36
    // Header removed in node at ^10.16 || >=11.11.0
    // v11 is not an LTS candidate, we can just test the one version with it.
    // Test node versions for: 10.16-19, 10.20+, 12-19, 20-99, 100+, or 11.11
    var noHeader = /^v(10\.1[6-9]|10\.[2-9][0-9]|10\.[0-9]{3,}|1[2-9]\d*|[2-9]\d|\d{3,}|11\.11)/;
    var headerLength = noHeader.test(process.version) ? 0 : 62;
    if (line === 1 && column > headerLength && !isInBrowser() && !frame.isEval()) {
      column -= headerLength;
    }

    var position = mapSourcePosition({
      source: source,
      line: line,
      column: column
    });
    state.curPosition = position;
    frame = cloneCallSite(frame);
    var originalFunctionName = frame.getFunctionName;
    frame.getFunctionName = function() {
      if (state.nextPosition == null) {
        return originalFunctionName();
      }
      return state.nextPosition.name || originalFunctionName();
    };
    frame.getFileName = function() { return position.source; };
    frame.getLineNumber = function() { return position.line; };
    frame.getColumnNumber = function() { return position.column + 1; };
    frame.getScriptNameOrSourceURL = function() { return position.source; };
    return frame;
  }

  // Code called using eval() needs special handling
  var origin = frame.isEval() && frame.getEvalOrigin();
  if (origin) {
    origin = mapEvalOrigin(origin);
    frame = cloneCallSite(frame);
    frame.getEvalOrigin = function() { return origin; };
    return frame;
  }

  // If we get here then we were unable to change the source position
  return frame;
}

var kIsNodeError = undefined;
try {
  // Get a deliberate ERR_INVALID_ARG_TYPE
  // TODO is there a better way to reliably get an instance of NodeError?
  path.resolve(123);
} catch(e) {
  const symbols = Object.getOwnPropertySymbols(e);
  const symbol = symbols.find(function (s) {return s.toString().indexOf('kIsNodeError') >= 0});
  if(symbol) kIsNodeError = symbol;
}

const ErrorPrototypeToString = (err) =>Error.prototype.toString.call(err);

/** @param {HookState} hookState */
function createPrepareStackTrace(hookState) {
  return prepareStackTrace;

  // This function is part of the V8 stack trace API, for more info see:
  // https://v8.dev/docs/stack-trace-api
  function prepareStackTrace(error, stack) {
    if(!hookState.enabled) return hookState.originalValue.apply(this, arguments);

    if (sharedData.emptyCacheBetweenOperations) {
      clearCaches();
    }

    // node gives its own errors special treatment.  Mimic that behavior
    // https://github.com/nodejs/node/blob/3cbaabc4622df1b4009b9d026a1a970bdbae6e89/lib/internal/errors.js#L118-L128
    // https://github.com/nodejs/node/pull/39182
    var errorString;
    if (kIsNodeError) {
      if(kIsNodeError in error) {
        errorString = `${error.name} [${error.code}]: ${error.message}`;
      } else {
        errorString = ErrorPrototypeToString(error);
      }
    } else {
      var name = error.name || 'Error';
      var message = error.message || '';
      errorString = message ? name + ": " + message : name;
    }

    var state = { nextPosition: null, curPosition: null };
    var processedStack = [];
    for (var i = stack.length - 1; i >= 0; i--) {
      processedStack.push('\n    at ' + wrapCallSite(stack[i], state));
      state.nextPosition = state.curPosition;
    }
    state.curPosition = state.nextPosition = null;
    return errorString + processedStack.reverse().join('');
  }
}

// Generate position and snippet of original source with pointer
function getErrorSource(error) {
  var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
  if (match) {
    var source = match[1];
    var line = +match[2];
    var column = +match[3];

    // Support the inline sourceContents inside the source map
    var contents = getFileContentsCache(source);

    const sourceAsPath = tryFileURLToPath(source);

    // Support files on disk
    if (!contents && fs && fs.existsSync(sourceAsPath)) {
      try {
        contents = fs.readFileSync(sourceAsPath, 'utf8');
      } catch (er) {
        contents = '';
      }
    }

    // Format the line from the original source code like node does
    if (contents) {
      var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
      if (code) {
        return source + ':' + line + '\n' + code + '\n' +
          new Array(column).join(' ') + '^';
      }
    }
  }
  return null;
}

function printFatalErrorUponExit (error) {
  var source = getErrorSource(error);

  // Ensure error is printed synchronously and not truncated
  if (process.stderr._handle && process.stderr._handle.setBlocking) {
    process.stderr._handle.setBlocking(true);
  }

  if (source) {
    console.error(source);
  }

  // Matches node's behavior for colorized output
  console.error(
    util.inspect(error, {
      customInspect: false,
      colors: process.stderr.isTTY
    })
  );
}

function shimEmitUncaughtException () {
  const originalValue = process.emit;
  var hook = sharedData.processEmitHook = {
    enabled: true,
    originalValue,
    installedValue: undefined
  };
  var isTerminatingDueToFatalException = false;
  var fatalException;

  process.emit = sharedData.processEmitHook.installedValue = function (type) {
    const hadListeners = originalValue.apply(this, arguments);
    if(hook.enabled) {
      if (type === 'uncaughtException' && !hadListeners) {
        isTerminatingDueToFatalException = true;
        fatalException = arguments[1];
        process.exit(1);
      }
      if (type === 'exit' && isTerminatingDueToFatalException) {
        printFatalErrorUponExit(fatalException);
      }
    }
    return hadListeners;
  };
}

var originalRetrieveFileHandlers = sharedData.retrieveFileHandlers.slice(0);
var originalRetrieveMapHandlers = sharedData.retrieveMapHandlers.slice(0);

exports.wrapCallSite = wrapCallSite;
exports.getErrorSource = getErrorSource;
exports.mapSourcePosition = mapSourcePosition;
exports.retrieveSourceMap = retrieveSourceMap;

exports.install = function(options) {
  options = options || {};

  if (options.environment) {
    environment = options.environment;
    if (["node", "browser", "auto"].indexOf(environment) === -1) {
      throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}")
    }
  }

  // Use dynamicRequire to avoid including in browser bundles
  var Module = dynamicRequire(module, 'module');

  // Redirect subsequent imports of "source-map-support"
  // to this package
  const {redirectConflictingLibrary = true, onConflictingLibraryRedirect} = options;
  if(redirectConflictingLibrary) {
    if (!sharedData.moduleResolveFilenameHook) {
      const originalValue = Module._resolveFilename;
      const moduleResolveFilenameHook = sharedData.moduleResolveFilenameHook = {
        enabled: true,
        originalValue,
        installedValue: undefined,
      }
      Module._resolveFilename = sharedData.moduleResolveFilenameHook.installedValue = function (request, parent, isMain, options) {
        if (moduleResolveFilenameHook.enabled) {
          // Match all source-map-support entrypoints: source-map-support, source-map-support/register
          let requestRedirect;
          if (request === 'source-map-support') {
            requestRedirect = './';
          } else if (request === 'source-map-support/register') {
            requestRedirect = './register';
          }

          if (requestRedirect !== undefined) {
              const newRequest = __nccwpck_require__.ab + "register1.js";
              for (const cb of sharedData.onConflictingLibraryRedirectArr) {
                cb(request, parent, isMain, options, __nccwpck_require__.ab + "register1.js");
              }
              request = __nccwpck_require__.ab + "register1.js";
          }
        }
        
        return originalValue.call(this, __nccwpck_require__.ab + "register1.js", parent, isMain, options);
      }
    } 
    if (onConflictingLibraryRedirect) {
      sharedData.onConflictingLibraryRedirectArr.push(onConflictingLibraryRedirect);
    }
  }

  // Allow sources to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveFile) {
    if (options.overrideRetrieveFile) {
      sharedData.retrieveFileHandlers.length = 0;
    }

    sharedData.retrieveFileHandlers.unshift(options.retrieveFile);
  }

  // Allow source maps to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveSourceMap) {
    if (options.overrideRetrieveSourceMap) {
      sharedData.retrieveMapHandlers.length = 0;
    }

    sharedData.retrieveMapHandlers.unshift(options.retrieveSourceMap);
  }

  // Support runtime transpilers that include inline source maps
  if (options.hookRequire && !isInBrowser()) {
    var $compile = Module.prototype._compile;

    if (!$compile.__sourceMapSupport) {
      Module.prototype._compile = function(content, filename) {
        setFileContentsCache(filename, content);
        setSourceMapCache(filename, undefined);
        return $compile.call(this, content, filename);
      };

      Module.prototype._compile.__sourceMapSupport = true;
    }
  }

  // Configure options
  if (!sharedData.emptyCacheBetweenOperations) {
    sharedData.emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ?
      options.emptyCacheBetweenOperations : false;
  }


  // Install the error reformatter
  if (!sharedData.errorPrepareStackTraceHook) {
    const originalValue = Error.prepareStackTrace;
    sharedData.errorPrepareStackTraceHook = {
      enabled: true,
      originalValue,
      installedValue: undefined
    };
    Error.prepareStackTrace = sharedData.errorPrepareStackTraceHook.installedValue = createPrepareStackTrace(sharedData.errorPrepareStackTraceHook);
  }

  if (!sharedData.processEmitHook) {
    var installHandler = 'handleUncaughtExceptions' in options ?
      options.handleUncaughtExceptions : true;

    // Do not override 'uncaughtException' with our own handler in Node.js
    // Worker threads. Workers pass the error to the main thread as an event,
    // rather than printing something to stderr and exiting.
    try {
      // We need to use `dynamicRequire` because `require` on it's own will be optimized by WebPack/Browserify.
      var worker_threads = dynamicRequire(module, 'worker_threads');
      if (worker_threads.isMainThread === false) {
        installHandler = false;
      }
    } catch(e) {}

    // Provide the option to not install the uncaught exception handler. This is
    // to support other uncaught exception handlers (in test frameworks, for
    // example). If this handler is not installed and there are no other uncaught
    // exception handlers, uncaught exceptions will be caught by node's built-in
    // exception handler and the process will still be terminated. However, the
    // generated JavaScript code will be shown above the stack trace instead of
    // the original source code.
    if (installHandler && hasGlobalProcessEventEmitter()) {
      shimEmitUncaughtException();
    }
  }
};

exports.uninstall = function() {
  if(sharedData.processEmitHook) {
    // Disable behavior
    sharedData.processEmitHook.enabled = false;
    // If possible, remove our hook function.  May not be possible if subsequent third-party hooks have wrapped around us.
    if(process.emit === sharedData.processEmitHook.installedValue) {
      process.emit = sharedData.processEmitHook.originalValue;
    }
    sharedData.processEmitHook = undefined;
  }
  if(sharedData.errorPrepareStackTraceHook) {
    // Disable behavior
    sharedData.errorPrepareStackTraceHook.enabled = false;
    // If possible or necessary, remove our hook function.
    // In vanilla environments, prepareStackTrace is `undefined`.
    // We cannot delegate to `undefined` the way we can to a function w/`.apply()`; our only option is to remove the function.
    // If we are the *first* hook installed, and another was installed on top of us, we have no choice but to remove both.
    if(Error.prepareStackTrace === sharedData.errorPrepareStackTraceHook.installedValue || typeof sharedData.errorPrepareStackTraceHook.originalValue !== 'function') {
      Error.prepareStackTrace = sharedData.errorPrepareStackTraceHook.originalValue;
    }
    sharedData.errorPrepareStackTraceHook = undefined;
  }
  if (sharedData.moduleResolveFilenameHook) {
    // Disable behavior
    sharedData.moduleResolveFilenameHook.enabled = false;
    // If possible, remove our hook function.  May not be possible if subsequent third-party hooks have wrapped around us.
    var Module = dynamicRequire(module, 'module');
    if(Module._resolveFilename === sharedData.moduleResolveFilenameHook.installedValue) {
      Module._resolveFilename = sharedData.moduleResolveFilenameHook.originalValue;
    }
    sharedData.moduleResolveFilenameHook = undefined;
  }
  sharedData.onConflictingLibraryRedirectArr.length = 0;
}

exports.resetRetrieveHandlers = function() {
  sharedData.retrieveFileHandlers.length = 0;
  sharedData.retrieveMapHandlers.length = 0;
}


/***/ }),

/***/ 898:
/***/ (function(module) {

(function (global, factory) {
     true ? module.exports = factory() :
    0;
})(this, (function () { 'use strict';

    // Matches the scheme of a URL, eg "http://"
    const schemeRegex = /^[\w+.-]+:\/\//;
    /**
     * Matches the parts of a URL:
     * 1. Scheme, including ":", guaranteed.
     * 2. User/password, including "@", optional.
     * 3. Host, guaranteed.
     * 4. Port, including ":", optional.
     * 5. Path, including "/", optional.
     * 6. Query, including "?", optional.
     * 7. Hash, including "#", optional.
     */
    const urlRegex = /^([\w+.-]+:)\/\/([^@/#?]*@)?([^:/#?]*)(:\d+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?/;
    /**
     * File URLs are weird. They dont' need the regular `//` in the scheme, they may or may not start
     * with a leading `/`, they can have a domain (but only if they don't start with a Windows drive).
     *
     * 1. Host, optional.
     * 2. Path, which may include "/", guaranteed.
     * 3. Query, including "?", optional.
     * 4. Hash, including "#", optional.
     */
    const fileRegex = /^file:(?:\/\/((?![a-z]:)[^/#?]*)?)?(\/?[^#?]*)(\?[^#]*)?(#.*)?/i;
    var UrlType;
    (function (UrlType) {
        UrlType[UrlType["Empty"] = 1] = "Empty";
        UrlType[UrlType["Hash"] = 2] = "Hash";
        UrlType[UrlType["Query"] = 3] = "Query";
        UrlType[UrlType["RelativePath"] = 4] = "RelativePath";
        UrlType[UrlType["AbsolutePath"] = 5] = "AbsolutePath";
        UrlType[UrlType["SchemeRelative"] = 6] = "SchemeRelative";
        UrlType[UrlType["Absolute"] = 7] = "Absolute";
    })(UrlType || (UrlType = {}));
    function isAbsoluteUrl(input) {
        return schemeRegex.test(input);
    }
    function isSchemeRelativeUrl(input) {
        return input.startsWith('//');
    }
    function isAbsolutePath(input) {
        return input.startsWith('/');
    }
    function isFileUrl(input) {
        return input.startsWith('file:');
    }
    function isRelative(input) {
        return /^[.?#]/.test(input);
    }
    function parseAbsoluteUrl(input) {
        const match = urlRegex.exec(input);
        return makeUrl(match[1], match[2] || '', match[3], match[4] || '', match[5] || '/', match[6] || '', match[7] || '');
    }
    function parseFileUrl(input) {
        const match = fileRegex.exec(input);
        const path = match[2];
        return makeUrl('file:', '', match[1] || '', '', isAbsolutePath(path) ? path : '/' + path, match[3] || '', match[4] || '');
    }
    function makeUrl(scheme, user, host, port, path, query, hash) {
        return {
            scheme,
            user,
            host,
            port,
            path,
            query,
            hash,
            type: UrlType.Absolute,
        };
    }
    function parseUrl(input) {
        if (isSchemeRelativeUrl(input)) {
            const url = parseAbsoluteUrl('http:' + input);
            url.scheme = '';
            url.type = UrlType.SchemeRelative;
            return url;
        }
        if (isAbsolutePath(input)) {
            const url = parseAbsoluteUrl('http://foo.com' + input);
            url.scheme = '';
            url.host = '';
            url.type = UrlType.AbsolutePath;
            return url;
        }
        if (isFileUrl(input))
            return parseFileUrl(input);
        if (isAbsoluteUrl(input))
            return parseAbsoluteUrl(input);
        const url = parseAbsoluteUrl('http://foo.com/' + input);
        url.scheme = '';
        url.host = '';
        url.type = input
            ? input.startsWith('?')
                ? UrlType.Query
                : input.startsWith('#')
                    ? UrlType.Hash
                    : UrlType.RelativePath
            : UrlType.Empty;
        return url;
    }
    function stripPathFilename(path) {
        // If a path ends with a parent directory "..", then it's a relative path with excess parent
        // paths. It's not a file, so we can't strip it.
        if (path.endsWith('/..'))
            return path;
        const index = path.lastIndexOf('/');
        return path.slice(0, index + 1);
    }
    function mergePaths(url, base) {
        normalizePath(base, base.type);
        // If the path is just a "/", then it was an empty path to begin with (remember, we're a relative
        // path).
        if (url.path === '/') {
            url.path = base.path;
        }
        else {
            // Resolution happens relative to the base path's directory, not the file.
            url.path = stripPathFilename(base.path) + url.path;
        }
    }
    /**
     * The path can have empty directories "//", unneeded parents "foo/..", or current directory
     * "foo/.". We need to normalize to a standard representation.
     */
    function normalizePath(url, type) {
        const rel = type <= UrlType.RelativePath;
        const pieces = url.path.split('/');
        // We need to preserve the first piece always, so that we output a leading slash. The item at
        // pieces[0] is an empty string.
        let pointer = 1;
        // Positive is the number of real directories we've output, used for popping a parent directory.
        // Eg, "foo/bar/.." will have a positive 2, and we can decrement to be left with just "foo".
        let positive = 0;
        // We need to keep a trailing slash if we encounter an empty directory (eg, splitting "foo/" will
        // generate `["foo", ""]` pieces). And, if we pop a parent directory. But once we encounter a
        // real directory, we won't need to append, unless the other conditions happen again.
        let addTrailingSlash = false;
        for (let i = 1; i < pieces.length; i++) {
            const piece = pieces[i];
            // An empty directory, could be a trailing slash, or just a double "//" in the path.
            if (!piece) {
                addTrailingSlash = true;
                continue;
            }
            // If we encounter a real directory, then we don't need to append anymore.
            addTrailingSlash = false;
            // A current directory, which we can always drop.
            if (piece === '.')
                continue;
            // A parent directory, we need to see if there are any real directories we can pop. Else, we
            // have an excess of parents, and we'll need to keep the "..".
            if (piece === '..') {
                if (positive) {
                    addTrailingSlash = true;
                    positive--;
                    pointer--;
                }
                else if (rel) {
                    // If we're in a relativePath, then we need to keep the excess parents. Else, in an absolute
                    // URL, protocol relative URL, or an absolute path, we don't need to keep excess.
                    pieces[pointer++] = piece;
                }
                continue;
            }
            // We've encountered a real directory. Move it to the next insertion pointer, which accounts for
            // any popped or dropped directories.
            pieces[pointer++] = piece;
            positive++;
        }
        let path = '';
        for (let i = 1; i < pointer; i++) {
            path += '/' + pieces[i];
        }
        if (!path || (addTrailingSlash && !path.endsWith('/..'))) {
            path += '/';
        }
        url.path = path;
    }
    /**
     * Attempts to resolve `input` URL/path relative to `base`.
     */
    function resolve(input, base) {
        if (!input && !base)
            return '';
        const url = parseUrl(input);
        let inputType = url.type;
        if (base && inputType !== UrlType.Absolute) {
            const baseUrl = parseUrl(base);
            const baseType = baseUrl.type;
            switch (inputType) {
                case UrlType.Empty:
                    url.hash = baseUrl.hash;
                // fall through
                case UrlType.Hash:
                    url.query = baseUrl.query;
                // fall through
                case UrlType.Query:
                case UrlType.RelativePath:
                    mergePaths(url, baseUrl);
                // fall through
                case UrlType.AbsolutePath:
                    // The host, user, and port are joined, you can't copy one without the others.
                    url.user = baseUrl.user;
                    url.host = baseUrl.host;
                    url.port = baseUrl.port;
                // fall through
                case UrlType.SchemeRelative:
                    // The input doesn't have a schema at least, so we need to copy at least that over.
                    url.scheme = baseUrl.scheme;
            }
            if (baseType > inputType)
                inputType = baseType;
        }
        normalizePath(url, inputType);
        const queryHash = url.query + url.hash;
        switch (inputType) {
            // This is impossible, because of the empty checks at the start of the function.
            // case UrlType.Empty:
            case UrlType.Hash:
            case UrlType.Query:
                return queryHash;
            case UrlType.RelativePath: {
                // The first char is always a "/", and we need it to be relative.
                const path = url.path.slice(1);
                if (!path)
                    return queryHash || '.';
                if (isRelative(base || input) && !isRelative(path)) {
                    // If base started with a leading ".", or there is no base and input started with a ".",
                    // then we need to ensure that the relative path starts with a ".". We don't know if
                    // relative starts with a "..", though, so check before prepending.
                    return './' + path + queryHash;
                }
                return path + queryHash;
            }
            case UrlType.AbsolutePath:
                return url.path + queryHash;
            default:
                return url.scheme + '//' + url.user + url.host + url.port + url.path + queryHash;
        }
    }

    return resolve;

}));
//# sourceMappingURL=resolve-uri.umd.js.map


/***/ }),

/***/ 225:
/***/ (function(__unused_webpack_module, exports) {

(function (global, factory) {
     true ? factory(exports) :
    0;
})(this, (function (exports) { 'use strict';

    const comma = ','.charCodeAt(0);
    const semicolon = ';'.charCodeAt(0);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const intToChar = new Uint8Array(64); // 64 possible chars.
    const charToInt = new Uint8Array(128); // z is 122 in ASCII
    for (let i = 0; i < chars.length; i++) {
        const c = chars.charCodeAt(i);
        intToChar[i] = c;
        charToInt[c] = i;
    }
    // Provide a fallback for older environments.
    const td = typeof TextDecoder !== 'undefined'
        ? /* #__PURE__ */ new TextDecoder()
        : typeof Buffer !== 'undefined'
            ? {
                decode(buf) {
                    const out = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
                    return out.toString();
                },
            }
            : {
                decode(buf) {
                    let out = '';
                    for (let i = 0; i < buf.length; i++) {
                        out += String.fromCharCode(buf[i]);
                    }
                    return out;
                },
            };
    function decode(mappings) {
        const state = new Int32Array(5);
        const decoded = [];
        let index = 0;
        do {
            const semi = indexOf(mappings, index);
            const line = [];
            let sorted = true;
            let lastCol = 0;
            state[0] = 0;
            for (let i = index; i < semi; i++) {
                let seg;
                i = decodeInteger(mappings, i, state, 0); // genColumn
                const col = state[0];
                if (col < lastCol)
                    sorted = false;
                lastCol = col;
                if (hasMoreVlq(mappings, i, semi)) {
                    i = decodeInteger(mappings, i, state, 1); // sourcesIndex
                    i = decodeInteger(mappings, i, state, 2); // sourceLine
                    i = decodeInteger(mappings, i, state, 3); // sourceColumn
                    if (hasMoreVlq(mappings, i, semi)) {
                        i = decodeInteger(mappings, i, state, 4); // namesIndex
                        seg = [col, state[1], state[2], state[3], state[4]];
                    }
                    else {
                        seg = [col, state[1], state[2], state[3]];
                    }
                }
                else {
                    seg = [col];
                }
                line.push(seg);
            }
            if (!sorted)
                sort(line);
            decoded.push(line);
            index = semi + 1;
        } while (index <= mappings.length);
        return decoded;
    }
    function indexOf(mappings, index) {
        const idx = mappings.indexOf(';', index);
        return idx === -1 ? mappings.length : idx;
    }
    function decodeInteger(mappings, pos, state, j) {
        let value = 0;
        let shift = 0;
        let integer = 0;
        do {
            const c = mappings.charCodeAt(pos++);
            integer = charToInt[c];
            value |= (integer & 31) << shift;
            shift += 5;
        } while (integer & 32);
        const shouldNegate = value & 1;
        value >>>= 1;
        if (shouldNegate) {
            value = -0x80000000 | -value;
        }
        state[j] += value;
        return pos;
    }
    function hasMoreVlq(mappings, i, length) {
        if (i >= length)
            return false;
        return mappings.charCodeAt(i) !== comma;
    }
    function sort(line) {
        line.sort(sortComparator);
    }
    function sortComparator(a, b) {
        return a[0] - b[0];
    }
    function encode(decoded) {
        const state = new Int32Array(5);
        const bufLength = 1024 * 16;
        const subLength = bufLength - 36;
        const buf = new Uint8Array(bufLength);
        const sub = buf.subarray(0, subLength);
        let pos = 0;
        let out = '';
        for (let i = 0; i < decoded.length; i++) {
            const line = decoded[i];
            if (i > 0) {
                if (pos === bufLength) {
                    out += td.decode(buf);
                    pos = 0;
                }
                buf[pos++] = semicolon;
            }
            if (line.length === 0)
                continue;
            state[0] = 0;
            for (let j = 0; j < line.length; j++) {
                const segment = line[j];
                // We can push up to 5 ints, each int can take at most 7 chars, and we
                // may push a comma.
                if (pos > subLength) {
                    out += td.decode(sub);
                    buf.copyWithin(0, subLength, pos);
                    pos -= subLength;
                }
                if (j > 0)
                    buf[pos++] = comma;
                pos = encodeInteger(buf, pos, state, segment, 0); // genColumn
                if (segment.length === 1)
                    continue;
                pos = encodeInteger(buf, pos, state, segment, 1); // sourcesIndex
                pos = encodeInteger(buf, pos, state, segment, 2); // sourceLine
                pos = encodeInteger(buf, pos, state, segment, 3); // sourceColumn
                if (segment.length === 4)
                    continue;
                pos = encodeInteger(buf, pos, state, segment, 4); // namesIndex
            }
        }
        return out + td.decode(buf.subarray(0, pos));
    }
    function encodeInteger(buf, pos, state, segment, j) {
        const next = segment[j];
        let num = next - state[j];
        state[j] = next;
        num = num < 0 ? (-num << 1) | 1 : num << 1;
        do {
            let clamped = num & 0b011111;
            num >>>= 5;
            if (num > 0)
                clamped |= 0b100000;
            buf[pos++] = intToChar[clamped];
        } while (num > 0);
        return pos;
    }

    exports.decode = decode;
    exports.encode = encode;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=sourcemap-codec.umd.js.map


/***/ }),

/***/ 817:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

(function (global, factory) {
     true ? factory(exports, __nccwpck_require__(225), __nccwpck_require__(898)) :
    0;
})(this, (function (exports, sourcemapCodec, resolveUri) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var resolveUri__default = /*#__PURE__*/_interopDefaultLegacy(resolveUri);

    function resolve(input, base) {
        // The base is always treated as a directory, if it's not empty.
        // https://github.com/mozilla/source-map/blob/8cb3ee57/lib/util.js#L327
        // https://github.com/chromium/chromium/blob/da4adbb3/third_party/blink/renderer/devtools/front_end/sdk/SourceMap.js#L400-L401
        if (base && !base.endsWith('/'))
            base += '/';
        return resolveUri__default["default"](input, base);
    }

    /**
     * Removes everything after the last "/", but leaves the slash.
     */
    function stripFilename(path) {
        if (!path)
            return '';
        const index = path.lastIndexOf('/');
        return path.slice(0, index + 1);
    }

    const COLUMN = 0;
    const SOURCES_INDEX = 1;
    const SOURCE_LINE = 2;
    const SOURCE_COLUMN = 3;
    const NAMES_INDEX = 4;
    const REV_GENERATED_LINE = 1;
    const REV_GENERATED_COLUMN = 2;

    function maybeSort(mappings, owned) {
        const unsortedIndex = nextUnsortedSegmentLine(mappings, 0);
        if (unsortedIndex === mappings.length)
            return mappings;
        // If we own the array (meaning we parsed it from JSON), then we're free to directly mutate it. If
        // not, we do not want to modify the consumer's input array.
        if (!owned)
            mappings = mappings.slice();
        for (let i = unsortedIndex; i < mappings.length; i = nextUnsortedSegmentLine(mappings, i + 1)) {
            mappings[i] = sortSegments(mappings[i], owned);
        }
        return mappings;
    }
    function nextUnsortedSegmentLine(mappings, start) {
        for (let i = start; i < mappings.length; i++) {
            if (!isSorted(mappings[i]))
                return i;
        }
        return mappings.length;
    }
    function isSorted(line) {
        for (let j = 1; j < line.length; j++) {
            if (line[j][COLUMN] < line[j - 1][COLUMN]) {
                return false;
            }
        }
        return true;
    }
    function sortSegments(line, owned) {
        if (!owned)
            line = line.slice();
        return line.sort(sortComparator);
    }
    function sortComparator(a, b) {
        return a[COLUMN] - b[COLUMN];
    }

    let found = false;
    /**
     * A binary search implementation that returns the index if a match is found.
     * If no match is found, then the left-index (the index associated with the item that comes just
     * before the desired index) is returned. To maintain proper sort order, a splice would happen at
     * the next index:
     *
     * ```js
     * const array = [1, 3];
     * const needle = 2;
     * const index = binarySearch(array, needle, (item, needle) => item - needle);
     *
     * assert.equal(index, 0);
     * array.splice(index + 1, 0, needle);
     * assert.deepEqual(array, [1, 2, 3]);
     * ```
     */
    function binarySearch(haystack, needle, low, high) {
        while (low <= high) {
            const mid = low + ((high - low) >> 1);
            const cmp = haystack[mid][COLUMN] - needle;
            if (cmp === 0) {
                found = true;
                return mid;
            }
            if (cmp < 0) {
                low = mid + 1;
            }
            else {
                high = mid - 1;
            }
        }
        found = false;
        return low - 1;
    }
    function upperBound(haystack, needle, index) {
        for (let i = index + 1; i < haystack.length; i++, index++) {
            if (haystack[i][COLUMN] !== needle)
                break;
        }
        return index;
    }
    function lowerBound(haystack, needle, index) {
        for (let i = index - 1; i >= 0; i--, index--) {
            if (haystack[i][COLUMN] !== needle)
                break;
        }
        return index;
    }
    function memoizedState() {
        return {
            lastKey: -1,
            lastNeedle: -1,
            lastIndex: -1,
        };
    }
    /**
     * This overly complicated beast is just to record the last tested line/column and the resulting
     * index, allowing us to skip a few tests if mappings are monotonically increasing.
     */
    function memoizedBinarySearch(haystack, needle, state, key) {
        const { lastKey, lastNeedle, lastIndex } = state;
        let low = 0;
        let high = haystack.length - 1;
        if (key === lastKey) {
            if (needle === lastNeedle) {
                found = lastIndex !== -1 && haystack[lastIndex][COLUMN] === needle;
                return lastIndex;
            }
            if (needle >= lastNeedle) {
                // lastIndex may be -1 if the previous needle was not found.
                low = lastIndex === -1 ? 0 : lastIndex;
            }
            else {
                high = lastIndex;
            }
        }
        state.lastKey = key;
        state.lastNeedle = needle;
        return (state.lastIndex = binarySearch(haystack, needle, low, high));
    }

    // Rebuilds the original source files, with mappings that are ordered by source line/column instead
    // of generated line/column.
    function buildBySources(decoded, memos) {
        const sources = memos.map(buildNullArray);
        for (let i = 0; i < decoded.length; i++) {
            const line = decoded[i];
            for (let j = 0; j < line.length; j++) {
                const seg = line[j];
                if (seg.length === 1)
                    continue;
                const sourceIndex = seg[SOURCES_INDEX];
                const sourceLine = seg[SOURCE_LINE];
                const sourceColumn = seg[SOURCE_COLUMN];
                const originalSource = sources[sourceIndex];
                const originalLine = (originalSource[sourceLine] || (originalSource[sourceLine] = []));
                const memo = memos[sourceIndex];
                // The binary search either found a match, or it found the left-index just before where the
                // segment should go. Either way, we want to insert after that. And there may be multiple
                // generated segments associated with an original location, so there may need to move several
                // indexes before we find where we need to insert.
                const index = upperBound(originalLine, sourceColumn, memoizedBinarySearch(originalLine, sourceColumn, memo, sourceLine));
                insert(originalLine, (memo.lastIndex = index + 1), [sourceColumn, i, seg[COLUMN]]);
            }
        }
        return sources;
    }
    function insert(array, index, value) {
        for (let i = array.length; i > index; i--) {
            array[i] = array[i - 1];
        }
        array[index] = value;
    }
    // Null arrays allow us to use ordered index keys without actually allocating contiguous memory like
    // a real array. We use a null-prototype object to avoid prototype pollution and deoptimizations.
    // Numeric properties on objects are magically sorted in ascending order by the engine regardless of
    // the insertion order. So, by setting any numeric keys, even out of order, we'll get ascending
    // order when iterating with for-in.
    function buildNullArray() {
        return { __proto__: null };
    }

    const AnyMap = function (map, mapUrl) {
        const parsed = typeof map === 'string' ? JSON.parse(map) : map;
        if (!('sections' in parsed))
            return new TraceMap(parsed, mapUrl);
        const mappings = [];
        const sources = [];
        const sourcesContent = [];
        const names = [];
        const { sections } = parsed;
        let i = 0;
        for (; i < sections.length - 1; i++) {
            const no = sections[i + 1].offset;
            addSection(sections[i], mapUrl, mappings, sources, sourcesContent, names, no.line, no.column);
        }
        if (sections.length > 0) {
            addSection(sections[i], mapUrl, mappings, sources, sourcesContent, names, Infinity, Infinity);
        }
        const joined = {
            version: 3,
            file: parsed.file,
            names,
            sources,
            sourcesContent,
            mappings,
        };
        return exports.presortedDecodedMap(joined);
    };
    function addSection(section, mapUrl, mappings, sources, sourcesContent, names, stopLine, stopColumn) {
        const map = AnyMap(section.map, mapUrl);
        const { line: lineOffset, column: columnOffset } = section.offset;
        const sourcesOffset = sources.length;
        const namesOffset = names.length;
        const decoded = exports.decodedMappings(map);
        const { resolvedSources } = map;
        append(sources, resolvedSources);
        append(sourcesContent, map.sourcesContent || fillSourcesContent(resolvedSources.length));
        append(names, map.names);
        // If this section jumps forwards several lines, we need to add lines to the output mappings catch up.
        for (let i = mappings.length; i <= lineOffset; i++)
            mappings.push([]);
        // We can only add so many lines before we step into the range that the next section's map
        // controls. When we get to the last line, then we'll start checking the segments to see if
        // they've crossed into the column range.
        const stopI = stopLine - lineOffset;
        const len = Math.min(decoded.length, stopI + 1);
        for (let i = 0; i < len; i++) {
            const line = decoded[i];
            // On the 0th loop, the line will already exist due to a previous section, or the line catch up
            // loop above.
            const out = i === 0 ? mappings[lineOffset] : (mappings[lineOffset + i] = []);
            // On the 0th loop, the section's column offset shifts us forward. On all other lines (since the
            // map can be multiple lines), it doesn't.
            const cOffset = i === 0 ? columnOffset : 0;
            for (let j = 0; j < line.length; j++) {
                const seg = line[j];
                const column = cOffset + seg[COLUMN];
                // If this segment steps into the column range that the next section's map controls, we need
                // to stop early.
                if (i === stopI && column >= stopColumn)
                    break;
                if (seg.length === 1) {
                    out.push([column]);
                    continue;
                }
                const sourcesIndex = sourcesOffset + seg[SOURCES_INDEX];
                const sourceLine = seg[SOURCE_LINE];
                const sourceColumn = seg[SOURCE_COLUMN];
                if (seg.length === 4) {
                    out.push([column, sourcesIndex, sourceLine, sourceColumn]);
                    continue;
                }
                out.push([column, sourcesIndex, sourceLine, sourceColumn, namesOffset + seg[NAMES_INDEX]]);
            }
        }
    }
    function append(arr, other) {
        for (let i = 0; i < other.length; i++)
            arr.push(other[i]);
    }
    // Sourcemaps don't need to have sourcesContent, and if they don't, we need to create an array of
    // equal length to the sources. This is because the sources and sourcesContent are paired arrays,
    // where `sourcesContent[i]` is the content of the `sources[i]` file. If we didn't, then joined
    // sourcemap would desynchronize the sources/contents.
    function fillSourcesContent(len) {
        const sourcesContent = [];
        for (let i = 0; i < len; i++)
            sourcesContent[i] = null;
        return sourcesContent;
    }

    const INVALID_ORIGINAL_MAPPING = Object.freeze({
        source: null,
        line: null,
        column: null,
        name: null,
    });
    const INVALID_GENERATED_MAPPING = Object.freeze({
        line: null,
        column: null,
    });
    const LINE_GTR_ZERO = '`line` must be greater than 0 (lines start at line 1)';
    const COL_GTR_EQ_ZERO = '`column` must be greater than or equal to 0 (columns start at column 0)';
    const LEAST_UPPER_BOUND = -1;
    const GREATEST_LOWER_BOUND = 1;
    /**
     * Returns the encoded (VLQ string) form of the SourceMap's mappings field.
     */
    exports.encodedMappings = void 0;
    /**
     * Returns the decoded (array of lines of segments) form of the SourceMap's mappings field.
     */
    exports.decodedMappings = void 0;
    /**
     * A low-level API to find the segment associated with a generated line/column (think, from a
     * stack trace). Line and column here are 0-based, unlike `originalPositionFor`.
     */
    exports.traceSegment = void 0;
    /**
     * A higher-level API to find the source/line/column associated with a generated line/column
     * (think, from a stack trace). Line is 1-based, but column is 0-based, due to legacy behavior in
     * `source-map` library.
     */
    exports.originalPositionFor = void 0;
    /**
     * Finds the source/line/column directly after the mapping returned by originalPositionFor, provided
     * the found mapping is from the same source and line as the originalPositionFor mapping.
     *
     * Eg, in the code `let id = 1`, `originalPositionAfter` could find the mapping associated with `1`
     * using the same needle that would return `id` when calling `originalPositionFor`.
     */
    exports.generatedPositionFor = void 0;
    /**
     * Iterates each mapping in generated position order.
     */
    exports.eachMapping = void 0;
    /**
     * A helper that skips sorting of the input map's mappings array, which can be expensive for larger
     * maps.
     */
    exports.presortedDecodedMap = void 0;
    /**
     * Returns a sourcemap object (with decoded mappings) suitable for passing to a library that expects
     * a sourcemap, or to JSON.stringify.
     */
    exports.decodedMap = void 0;
    /**
     * Returns a sourcemap object (with encoded mappings) suitable for passing to a library that expects
     * a sourcemap, or to JSON.stringify.
     */
    exports.encodedMap = void 0;
    class TraceMap {
        constructor(map, mapUrl) {
            this._decodedMemo = memoizedState();
            this._bySources = undefined;
            this._bySourceMemos = undefined;
            const isString = typeof map === 'string';
            if (!isString && map.constructor === TraceMap)
                return map;
            const parsed = (isString ? JSON.parse(map) : map);
            const { version, file, names, sourceRoot, sources, sourcesContent } = parsed;
            this.version = version;
            this.file = file;
            this.names = names;
            this.sourceRoot = sourceRoot;
            this.sources = sources;
            this.sourcesContent = sourcesContent;
            if (sourceRoot || mapUrl) {
                const from = resolve(sourceRoot || '', stripFilename(mapUrl));
                this.resolvedSources = sources.map((s) => resolve(s || '', from));
            }
            else {
                this.resolvedSources = sources.map((s) => s || '');
            }
            const { mappings } = parsed;
            if (typeof mappings === 'string') {
                this._encoded = mappings;
                this._decoded = undefined;
            }
            else {
                this._encoded = undefined;
                this._decoded = maybeSort(mappings, isString);
            }
        }
    }
    (() => {
        exports.encodedMappings = (map) => {
            var _a;
            return ((_a = map._encoded) !== null && _a !== void 0 ? _a : (map._encoded = sourcemapCodec.encode(map._decoded)));
        };
        exports.decodedMappings = (map) => {
            return (map._decoded || (map._decoded = sourcemapCodec.decode(map._encoded)));
        };
        exports.traceSegment = (map, line, column) => {
            const decoded = exports.decodedMappings(map);
            // It's common for parent source maps to have pointers to lines that have no
            // mapping (like a "//# sourceMappingURL=") at the end of the child file.
            if (line >= decoded.length)
                return null;
            return traceSegmentInternal(decoded[line], map._decodedMemo, line, column, GREATEST_LOWER_BOUND);
        };
        exports.originalPositionFor = (map, { line, column, bias }) => {
            line--;
            if (line < 0)
                throw new Error(LINE_GTR_ZERO);
            if (column < 0)
                throw new Error(COL_GTR_EQ_ZERO);
            const decoded = exports.decodedMappings(map);
            // It's common for parent source maps to have pointers to lines that have no
            // mapping (like a "//# sourceMappingURL=") at the end of the child file.
            if (line >= decoded.length)
                return INVALID_ORIGINAL_MAPPING;
            const segment = traceSegmentInternal(decoded[line], map._decodedMemo, line, column, bias || GREATEST_LOWER_BOUND);
            if (segment == null)
                return INVALID_ORIGINAL_MAPPING;
            if (segment.length == 1)
                return INVALID_ORIGINAL_MAPPING;
            const { names, resolvedSources } = map;
            return {
                source: resolvedSources[segment[SOURCES_INDEX]],
                line: segment[SOURCE_LINE] + 1,
                column: segment[SOURCE_COLUMN],
                name: segment.length === 5 ? names[segment[NAMES_INDEX]] : null,
            };
        };
        exports.generatedPositionFor = (map, { source, line, column, bias }) => {
            line--;
            if (line < 0)
                throw new Error(LINE_GTR_ZERO);
            if (column < 0)
                throw new Error(COL_GTR_EQ_ZERO);
            const { sources, resolvedSources } = map;
            let sourceIndex = sources.indexOf(source);
            if (sourceIndex === -1)
                sourceIndex = resolvedSources.indexOf(source);
            if (sourceIndex === -1)
                return INVALID_GENERATED_MAPPING;
            const generated = (map._bySources || (map._bySources = buildBySources(exports.decodedMappings(map), (map._bySourceMemos = sources.map(memoizedState)))));
            const memos = map._bySourceMemos;
            const segments = generated[sourceIndex][line];
            if (segments == null)
                return INVALID_GENERATED_MAPPING;
            const segment = traceSegmentInternal(segments, memos[sourceIndex], line, column, bias || GREATEST_LOWER_BOUND);
            if (segment == null)
                return INVALID_GENERATED_MAPPING;
            return {
                line: segment[REV_GENERATED_LINE] + 1,
                column: segment[REV_GENERATED_COLUMN],
            };
        };
        exports.eachMapping = (map, cb) => {
            const decoded = exports.decodedMappings(map);
            const { names, resolvedSources } = map;
            for (let i = 0; i < decoded.length; i++) {
                const line = decoded[i];
                for (let j = 0; j < line.length; j++) {
                    const seg = line[j];
                    const generatedLine = i + 1;
                    const generatedColumn = seg[0];
                    let source = null;
                    let originalLine = null;
                    let originalColumn = null;
                    let name = null;
                    if (seg.length !== 1) {
                        source = resolvedSources[seg[1]];
                        originalLine = seg[2] + 1;
                        originalColumn = seg[3];
                    }
                    if (seg.length === 5)
                        name = names[seg[4]];
                    cb({
                        generatedLine,
                        generatedColumn,
                        source,
                        originalLine,
                        originalColumn,
                        name,
                    });
                }
            }
        };
        exports.presortedDecodedMap = (map, mapUrl) => {
            const clone = Object.assign({}, map);
            clone.mappings = [];
            const tracer = new TraceMap(clone, mapUrl);
            tracer._decoded = map.mappings;
            return tracer;
        };
        exports.decodedMap = (map) => {
            return {
                version: 3,
                file: map.file,
                names: map.names,
                sourceRoot: map.sourceRoot,
                sources: map.sources,
                sourcesContent: map.sourcesContent,
                mappings: exports.decodedMappings(map),
            };
        };
        exports.encodedMap = (map) => {
            return {
                version: 3,
                file: map.file,
                names: map.names,
                sourceRoot: map.sourceRoot,
                sources: map.sources,
                sourcesContent: map.sourcesContent,
                mappings: exports.encodedMappings(map),
            };
        };
    })();
    function traceSegmentInternal(segments, memo, line, column, bias) {
        let index = memoizedBinarySearch(segments, column, memo, line);
        if (found) {
            index = (bias === LEAST_UPPER_BOUND ? upperBound : lowerBound)(segments, column, index);
        }
        else if (bias === LEAST_UPPER_BOUND)
            index++;
        if (index === -1 || index === segments.length)
            return null;
        return segments[index];
    }

    exports.AnyMap = AnyMap;
    exports.GREATEST_LOWER_BOUND = GREATEST_LOWER_BOUND;
    exports.LEAST_UPPER_BOUND = LEAST_UPPER_BOUND;
    exports.TraceMap = TraceMap;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=trace-mapping.umd.js.map


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 310:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__nccwpck_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
(__nccwpck_require__(964).install)();

})();

module.exports = __webpack_exports__;
/******/ })()
;