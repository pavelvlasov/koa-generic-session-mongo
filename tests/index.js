'use strict';

require('babel/register');
require('co-mocha');
global.expect = require('chai').expect;
require('./test');
