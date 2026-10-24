module.exports = async function () {
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ?? '3000';
  
  process.env.API_URL = `http://${host}:${port}`;
};