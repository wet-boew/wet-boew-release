var expect = require('expect.js');
var release = require('../lib/release');

describe('Core Release Process', function () {

	before(function() {
		release();
	});

	it('runs', function() {
		expect(true).to.be(true);
	});
});
