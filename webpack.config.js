const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const fromRoot = (...paths) => path.resolve(__dirname, ...paths);

module.exports = {
  devtool: "source-map",
  mode: "development",
  context: fromRoot(),
  entry: fromRoot("src/index.ts"),
  output: {
    path: fromRoot("dist"),
    filename: "js/[name].[contenthash:8].js",
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
    alias: {
      "@": fromRoot("src"),
      fs: fromRoot("lib/virtual-fs.js"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(t|j)s$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        enforce: "post",
        test: /linebreak[/\\]src[/\\]linebreaker.js/,
        use: ["transform-loader?brfs"],
      },
      {
        test: /\.(glsl|vert|frag)$/,
        loader: "shader-loader",
      },
      {
        test: /\.txt$/,
        loader: "raw-loader",
        options: {
          esModule: false,
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: fromRoot("public/index.html"),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          context: fromRoot("public"),
          from: "**/*",
          to: fromRoot("dist"),
          toType: "dir",
          filter: (resourcePath) =>
            ![/public\/index.html/].some((exclude) =>
              exclude.test(resourcePath)
            ),
          noErrorOnMissing: true,
        },
        {
          context: fromRoot("src/assets"),
          from: "**/*",
          to: fromRoot("dist/assets"),
          toType: "dir",
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  devServer: {
    historyApiFallback: true,
    host: "localhost",
    port: 8080,
    hot: true,
    open: false,
  },
};
