'use strict';

require('babel/register');
require('co-mocha');
global.expect = require('chai').expect;
global.assert = require('chai').assert;
require('./test');
