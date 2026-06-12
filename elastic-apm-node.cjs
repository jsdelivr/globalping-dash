const { version } = require('./package.json');

module.exports = {
	active: process.env.NODE_ENV === 'production',
	serviceName: 'globalping-dash',
	serviceVersion: process.env.SOURCE_COMMIT || version,
	logLevel: 'fatal',
	centralConfig: false,
	captureExceptions: false,
	captureSpanStackTraces: false,
	captureErrorLogStackTraces: 'always',
	ignoreUrls: [ '/favicon.ico' ],
	transactionSampleRate: .1,
};
