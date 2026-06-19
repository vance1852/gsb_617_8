function errorHandler(err, req, res, next) {
  console.error('[Error]', err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ message: '参数校验失败', errors: err.errors });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || '服务器内部错误' });
}

module.exports = { errorHandler };
