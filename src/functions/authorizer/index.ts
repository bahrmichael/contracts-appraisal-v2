export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  environment: {
    ACCESS_KEY: process.env.APP_API_ACCESS_KEY,
  }
}
