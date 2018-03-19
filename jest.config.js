module.exports = {
	transform: {
		"^.+\\.ts$": "<rootDir>/node_modules/ts-jest/preprocessor.js"
	},
	testRegex: "^.+\.spec\.ts$",
	moduleFileExtensions: ["ts", "js"],
	setupTestFrameworkScriptFile: "<rootDir>/src/tests/bootstrap.ts",
	collectCoverage: true,
	collectCoverageFrom: [
		"src/**/*.ts",
		"!src/**/index.ts",
		"!src/**/*.d.ts",
		"!src/**/*.spec.ts",
		"!src/**/tests/**/*.ts"
	],
	coverageDirectory: "<rootDir>/coverage",
	coverageReporters: ["lcov", "text", "text-summary"],
	modulePathIgnorePatterns: [
		"<rootDir>/dist"
	],
	verbose: true
};
