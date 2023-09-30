const util = require("util");
const exec = util.promisify(require("child_process").exec);

exports.runCommand = async (command, options) => {
    try {
        const { stdout, stderr } = await exec(command, options);
        
        return ({
            success: true,
            outData: stdout,
            errData: stderr
        });
    } catch (err) {
        return ({
            success: false,
            message: err.message || err
        });
    }
};