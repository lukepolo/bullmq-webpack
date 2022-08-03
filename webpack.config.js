const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: "production",
  target: "node",
  devtool: "inline-source-map",
  entry: {
    app: ["./src"],
  },
  externals: [],
  node: {
    __dirname: true,
    __filename: true,
  },
  output: {
    path: path.join(__dirname, "./dist"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: [".js", ".jsx", ".mjs", ".ts", ".tsx", ".json", ".node"],
  },
  module: {
    rules: [
      {
        test: /\.node$/,
        use: [
          {
            loader: "node-loader",
            options: {
              name() {
                return "[name].[ext]";
              },
            },
          },
        ],
      },
      {
        test: /\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ["**/*"],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "./node_modules/bullmq/dist",
          to: "./node_modules/bullmq/dist",
        },
        {
          from: "./node_modules/@taskforcesh/bullmq-pro/dist",
          to: "./node_modules/@taskforcesh/bullmq-pro/dist",
        },
        {
          from: "./node_modules/@bull-board",
          to: "./node_modules/@bull-board",
        },
      ],
    }),
  ],
  watchOptions: {
    poll: 1000,
    aggregateTimeout: 200,
  },
  stats: {
    hash: false,
    chunks: false,
    modules: false,
    source: false,
    reasons: false,
    version: false,
    timings: false,
    children: false,
    publicPath: false,
    errorDetails: false,
  },
};
