module.exports = function override(config) {
    config.ignoreWarnings = [
        {
            module: /node_modules\/libheif-js/,
            message: /Critical dependency: require function is used/,
        },
    ];
    return config;
};