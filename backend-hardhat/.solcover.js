module.exports = {
  istanbulFolder: "./reports/coverage",
  mocha: {
    reporter: "mocha-multi-reporters",
    reporterOptions: {
      configFile: "./mocha-reporter-config.json",
    },
  },
};
