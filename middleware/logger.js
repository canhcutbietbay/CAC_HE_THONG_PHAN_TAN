import morgan from 'morgan'
import moment from 'moment-timezone'
import chalk from 'chalk'

morgan.token('date', () => {
    return chalk.whiteBright(moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss'));
});

morgan.token('ip', (req) => {
    return chalk.cyan(req.ip);
});

morgan.token('method', (req) => chalk.blue(req.method));
morgan.token('url', (req) => chalk.green(req.url));

morgan.token('status', (req, res) => {
    const status = res.statusCode;
    if (status >= 500) return chalk.red(status); // Màu đỏ cho lỗi server
    if (status >= 400) return chalk.yellow(status); // Màu vàng cho lỗi client
    if (status >= 300) return chalk.cyan(status); // Màu xanh cho redirect
    return chalk.green(status); // Màu xanh lá cho status 2xx
});

export default morgan(':date - :ip - :method :url :status :response-time ms - :res[content-length]')